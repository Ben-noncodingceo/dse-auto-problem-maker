import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@dse/database';
import { LLMService } from '@dse/llm';
import type { QuestionGenerationInput } from '@dse/llm';

const app = new Hono();

// 生成题目
app.post('/generate', zValidator('json', z.object({
  categoryId: z.string(),
  knowledgeTagIds: z.array(z.string()).min(1),
  customTags: z.array(z.string()).optional(),
  questionType: z.enum(['mcq', 'short']),
  difficulty: z.number().int().min(1).max(5).optional(),
  language: z.enum(['zh-cn', 'zh-tw', 'en']).optional(),
  aiProviderId: z.string().optional(),
})), async (c) => {
  const data = c.req.valid('json');

  // 获取知识点信息
  const knowledgeTags = await prisma.knowledgeTag.findMany({
    where: { id: { in: data.knowledgeTagIds } },
    include: { category: true },
  });

  if (knowledgeTags.length === 0) {
    return c.json({ error: '未找到指定的知识点标签' }, 400);
  }

  // 获取 AI 供应商配置
  let aiProvider = data.aiProviderId
    ? await prisma.aIProviderConfig.findUnique({ where: { id: data.aiProviderId } })
    : await prisma.aIProviderConfig.findFirst({ where: { isDefault: true } });

  if (!aiProvider) {
    return c.json({ error: '未找到可用的 AI 供应商配置' }, 400);
  }

  // 构建 LLM 输入
  const input: QuestionGenerationInput = {
    exam: 'HKDSE Physics',
    syllabusSections: Array.from(new Set(knowledgeTags.map((t: any) => t.category.name))),
    knowledgeTags: knowledgeTags.map((t: any) => t.name),
    customTags: data.customTags,
    questionType: data.questionType,
    difficulty: data.difficulty || 3,
    language: data.language || 'zh-cn',
  };

  // 调用 LLM 生成题目
  const llmService = new LLMService({
    provider: aiProvider.providerName.toLowerCase() as any,
    baseUrl: aiProvider.baseUrl,
    apiKey: aiProvider.apiKey,
    modelName: aiProvider.modelName,
    timeoutMs: aiProvider.timeoutMs,
    extraParams: aiProvider.extraParams as any,
  });

  try {
    const generatedQuestion = await llmService.generateQuestion(input);

    // 创建题目记录
    const question = await prisma.question.create({
      data: {
        type: data.questionType === 'mcq' ? 'MCQ' : 'SHORT',
        languageBase: (data.language || 'zh-cn').toUpperCase().replace('-', '_') as 'ZH_CN' | 'ZH_TW' | 'EN',
        stemBase: generatedQuestion.stem,
        options: generatedQuestion.options,
        correctAnswer: generatedQuestion.correctAnswer,
        solution: generatedQuestion.solution,
        difficulty: data.difficulty || 3,
        createdByAIProviderId: aiProvider.id,
      },
    });

    // 关联知识点标签
    await prisma.questionKnowledgeTag.createMany({
      data: data.knowledgeTagIds.map(tagId => ({
        questionId: question.id,
        tagId,
      })),
    });

    // 创建或获取能力标签，并关联
    for (const abilityTagName of generatedQuestion.abilityTags) {
      let abilityTag = await prisma.abilityTag.findFirst({
        where: { name: abilityTagName },
      });

      if (!abilityTag) {
        abilityTag = await prisma.abilityTag.create({
          data: { name: abilityTagName },
        });
      }

      await prisma.questionAbilityTag.create({
        data: {
          questionId: question.id,
          tagId: abilityTag.id,
        },
      });
    }

    // 返回完整题目信息
    const fullQuestion = await prisma.question.findUnique({
      where: { id: question.id },
      include: {
        knowledgeTags: {
          include: { tag: true },
        },
        abilityTags: {
          include: { tag: true },
        },
      },
    });

    return c.json({ data: fullQuestion }, 201);
  } catch (error) {
    console.error('Failed to generate question:', error);
    return c.json({
      error: '生成题目失败',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

// 获取题目详情
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      knowledgeTags: {
        include: { tag: { include: { category: true } } },
      },
      abilityTags: {
        include: { tag: true },
      },
      translations: true,
    },
  });

  if (!question) {
    return c.json({ error: '题目不存在' }, 404);
  }

  return c.json({ data: question });
});

// 获取题目翻译
app.get('/:id/translate/:language', async (c) => {
  const id = c.req.param('id');
  const language = c.req.param('language').toUpperCase().replace('-', '_') as 'ZH_CN' | 'ZH_TW' | 'EN';

  // 查找已有翻译
  let translation = await prisma.questionTranslation.findUnique({
    where: {
      questionId_language: {
        questionId: id,
        language,
      },
    },
  });

  if (translation) {
    return c.json({ data: translation });
  }

  // 如果不存在，调用 AI 翻译
  const question = await prisma.question.findUnique({
    where: { id },
  });

  if (!question) {
    return c.json({ error: '题目不存在' }, 404);
  }

  // 获取默认 AI 供应商
  const aiProvider = await prisma.aIProviderConfig.findFirst({
    where: { isDefault: true },
  });

  if (!aiProvider) {
    return c.json({ error: '未找到可用的 AI 供应商配置' }, 400);
  }

  const llmService = new LLMService({
    provider: aiProvider.providerName.toLowerCase() as any,
    baseUrl: aiProvider.baseUrl,
    apiKey: aiProvider.apiKey,
    modelName: aiProvider.modelName,
  });

  try {
    const translatedStem = await llmService.translate({
      text: question.stemBase,
      sourceLanguage: question.languageBase.toLowerCase().replace('_', '-') as any,
      targetLanguage: language.toLowerCase().replace('_', '-') as any,
      context: '这是一道 HKDSE Physics 考试题目',
    });

    let translatedOptions: Record<string, string> | null = null;
    if (question.options && question.type === 'MCQ') {
      const options = question.options as Record<string, string>;
      translatedOptions = {};
      for (const [key, value] of Object.entries(options)) {
        translatedOptions[key] = await llmService.translate({
          text: value as string,
          sourceLanguage: question.languageBase.toLowerCase().replace('_', '-') as any,
          targetLanguage: language.toLowerCase().replace('_', '-') as any,
        });
      }
    }

    // 保存翻译
    translation = await prisma.questionTranslation.create({
      data: {
        questionId: id,
        language,
        stem: translatedStem,
        ...(translatedOptions !== null && { options: translatedOptions }),
      },
    });

    return c.json({ data: translation }, 201);
  } catch (error) {
    console.error('Failed to translate question:', error);
    return c.json({
      error: '翻译失败',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export default app;
