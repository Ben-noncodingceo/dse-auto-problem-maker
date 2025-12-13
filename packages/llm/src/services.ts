import { LLMClient } from './client';
import { PromptBuilder } from './prompts';
import type {
  LLMConfig,
  QuestionGenerationInput,
  QuestionGenerationOutput,
  TranslationInput,
  GradingInput,
  GradingOutput,
  SyllabusAnalysisInput,
  SyllabusAnalysisOutput,
} from './types';

export class LLMService {
  private client: LLMClient;

  constructor(config: LLMConfig) {
    this.client = new LLMClient(config);
  }

  /**
   * 生成题目
   */
  async generateQuestion(input: QuestionGenerationInput): Promise<QuestionGenerationOutput> {
    const prompt = PromptBuilder.buildQuestionGenerationPrompt(input);

    const response = await this.client.chat({
      prompt,
      temperature: 0.8,
      maxTokens: 2000,
      jsonMode: true,
    });

    try {
      const result = JSON.parse(response.content);

      // 验证必需字段
      if (!result.stem || !result.correctAnswer || !result.solution) {
        throw new Error('生成的题目缺少必需字段');
      }

      if (input.questionType === 'mcq' && !result.options) {
        throw new Error('选择题缺少选项');
      }

      // 确保标签数量
      result.knowledgeTags = (result.knowledgeTags || []).slice(0, 3);
      result.abilityTags = (result.abilityTags || []).slice(0, 3);

      // 补充缺失的标签
      while (result.knowledgeTags.length < 3) {
        result.knowledgeTags.push(input.knowledgeTags[result.knowledgeTags.length] || '其他');
      }
      while (result.abilityTags.length < 3) {
        result.abilityTags.push('综合应用');
      }

      return result as QuestionGenerationOutput;
    } catch (error) {
      console.error('Failed to parse question generation output:', response.content);
      throw new Error(`解析 AI 返回结果失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 翻译文本
   */
  async translate(input: TranslationInput): Promise<string> {
    // 如果源语言和目标语言相同，直接返回
    if (input.sourceLanguage === input.targetLanguage) {
      return input.text;
    }

    const prompt = PromptBuilder.buildTranslationPrompt(input);

    const response = await this.client.chat({
      prompt,
      temperature: 0.3, // 翻译用较低的温度保证一致性
      maxTokens: 2000,
    });

    return response.content.trim();
  }

  /**
   * 批改答案
   */
  async gradeAnswer(input: GradingInput): Promise<GradingOutput> {
    const prompt = PromptBuilder.buildGradingPrompt(input);

    const response = await this.client.chat({
      prompt,
      temperature: 0.5,
      maxTokens: 1500,
      jsonMode: true,
    });

    try {
      const result = JSON.parse(response.content);

      // 验证必需字段
      if (typeof result.score !== 'number' || typeof result.isCorrect !== 'boolean') {
        throw new Error('批改结果格式错误');
      }

      // 确保分数在有效范围内
      result.score = Math.max(0, Math.min(input.maxScore, result.score));

      return result as GradingOutput;
    } catch (error) {
      console.error('Failed to parse grading output:', response.content);
      throw new Error(`解析批改结果失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 分析大纲，提取知识点结构
   */
  async analyzeSyllabus(input: SyllabusAnalysisInput): Promise<SyllabusAnalysisOutput> {
    const prompt = PromptBuilder.buildSyllabusAnalysisPrompt(input);

    const response = await this.client.chat({
      prompt,
      temperature: 0.3, // 使用较低温度保证准确性
      maxTokens: 4000,
      jsonMode: true,
    });

    try {
      const result = JSON.parse(response.content);

      // 验证必需字段
      if (!result.categories || !Array.isArray(result.categories)) {
        throw new Error('分析结果格式错误：缺少 categories 字段');
      }

      // 验证每个分类的结构
      result.categories.forEach((category: any, index: number) => {
        if (!category.name || !category.tags || !Array.isArray(category.tags)) {
          throw new Error(`分类 ${index + 1} 格式错误`);
        }
        if (typeof category.order !== 'number') {
          category.order = index + 1;
        }
      });

      return result as SyllabusAnalysisOutput;
    } catch (error) {
      console.error('Failed to parse syllabus analysis output:', response.content);
      throw new Error(`解析大纲分析结果失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
