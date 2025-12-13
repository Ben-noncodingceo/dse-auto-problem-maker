import OpenAI from 'openai';
import axios from 'axios';
import type { LLMConfig, LLMRequest, LLMResponse } from './types';

export class LLMClient {
  private config: LLMConfig;
  private openaiClient?: OpenAI;

  constructor(config: LLMConfig) {
    this.config = config;

    // 对于兼容 OpenAI API 的供应商，使用 OpenAI SDK
    if (this.isOpenAICompatible()) {
      this.openaiClient = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
        timeout: config.timeoutMs || 30000,
      });
    }
  }

  private isOpenAICompatible(): boolean {
    return ['deepseek', 'chatgpt', 'gemini', 'custom'].includes(this.config.provider);
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      if (this.openaiClient) {
        return await this.chatWithOpenAI(request);
      } else {
        return await this.chatWithCustomAPI(request);
      }
    } catch (error) {
      console.error('LLM API Error:', error);
      throw new Error(`LLM API 调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async chatWithOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    messages.push({ role: 'user', content: request.prompt });

    const response = await this.openaiClient!.chat.completions.create({
      model: this.config.modelName,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      response_format: request.jsonMode ? { type: 'json_object' } : undefined,
      ...this.config.extraParams,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No content in LLM response');
    }

    return {
      content: choice.message.content,
      usageTokens: response.usage ? {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      } : undefined,
      rawResponse: response,
    };
  }

  private async chatWithCustomAPI(request: LLMRequest): Promise<LLMResponse> {
    // 实现豆包和通义千问的 API 调用
    let endpoint = this.config.baseUrl;
    let requestBody: any;

    switch (this.config.provider) {
      case 'doubao':
        // 豆包 API 格式
        endpoint = `${this.config.baseUrl}/chat/completions`;
        requestBody = {
          model: this.config.modelName,
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            { role: 'user', content: request.prompt },
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
        };
        break;

      case 'tongyi':
        // 通义千问 API 格式
        endpoint = `${this.config.baseUrl}/v1/services/aigc/text-generation/generation`;
        requestBody = {
          model: this.config.modelName,
          input: {
            messages: [
              ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
              { role: 'user', content: request.prompt },
            ],
          },
          parameters: {
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens,
            result_format: request.jsonMode ? 'json' : 'text',
          },
        };
        break;

      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }

    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      timeout: this.config.timeoutMs || 30000,
    });

    // 解析不同供应商的响应格式
    let content: string;
    let usageTokens: any;

    if (this.config.provider === 'tongyi') {
      content = response.data.output?.text || response.data.output?.choices?.[0]?.message?.content;
      usageTokens = response.data.usage;
    } else {
      // 豆包和其他
      content = response.data.choices?.[0]?.message?.content;
      usageTokens = response.data.usage;
    }

    if (!content) {
      throw new Error('No content in LLM response');
    }

    return {
      content,
      usageTokens: usageTokens ? {
        prompt: usageTokens.prompt_tokens || usageTokens.input_tokens || 0,
        completion: usageTokens.completion_tokens || usageTokens.output_tokens || 0,
        total: usageTokens.total_tokens || 0,
      } : undefined,
      rawResponse: response.data,
    };
  }
}
