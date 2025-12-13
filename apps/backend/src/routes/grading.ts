import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@dse/database';
import { LLMService } from '@dse/llm';
import type { GradingInput } from '@dse/llm';

const app = new Hono();

// 提交答案并批改
app.post('/submit', zValidator('json', z.object({
  questionId: z.string(),
  answer: z.union([z.string(), z.array(z.string())]),
  language: z.enum(['zh-cn', 'zh-tw', 'en']).optional(),
  userId: z.string().optional(),
})), async (c) => {
  const data = c.req.valid('json');

  // 获取题目信息
  const question = await prisma.question.findUnique({
    where: { id: data.questionId },
    include: {
      abilityTags: {
        include: { tag: true },
      },
    },
  });

  if (!question) {
    return c.json({ error: '题目不存在' }, 404);
  }

  // 保存用户答案
  const userAnswer = await prisma.userAnswer.create({
    data: {
      questionId: data.questionId,
      userId: data.userId,
      language: (data.language || 'zh-cn').toUpperCase().replace('-', '_') as 'ZH_CN' | 'ZH_TW' | 'EN',
      answerRaw: data.answer,
    },
  });

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

  // 构建批改输入
  const gradingInput: GradingInput = {
    questionStem: question.stemBase,
    questionType: question.type === 'MCQ' ? 'mcq' : 'short',
    standardAnswer: question.correctAnswer as any,
    studentAnswer: data.answer,
    maxScore: 10, // 默认10分
    syllabusContext: question.abilityTags.map((t: any) => t.tag.name).join('、'),
  };

  try {
    const gradingResult = await llmService.gradeAnswer(gradingInput);

    // 保存批改结果
    const result = await prisma.gradingResult.create({
      data: {
        userAnswerId: userAnswer.id,
        score: gradingResult.score,
        isCorrect: gradingResult.isCorrect,
        feedbackText: gradingResult.feedback,
        abilityAssessment: gradingResult.abilityAssessment,
        suggestions: gradingResult.suggestions.join('\n'),
        gradedByAIProviderId: aiProvider.id,
      },
    });

    return c.json({
      data: {
        userAnswer,
        gradingResult: result,
        question: {
          id: question.id,
          stem: question.stemBase,
          correctAnswer: question.correctAnswer,
          solution: question.solution,
        },
      },
    }, 201);
  } catch (error) {
    console.error('Failed to grade answer:', error);
    return c.json({
      error: '批改失败',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

// 获取批改结果
app.get('/result/:userAnswerId', async (c) => {
  const userAnswerId = c.req.param('userAnswerId');

  const result = await prisma.gradingResult.findUnique({
    where: { userAnswerId },
    include: {
      userAnswer: {
        include: {
          question: {
            include: {
              knowledgeTags: {
                include: { tag: true },
              },
              abilityTags: {
                include: { tag: true },
              },
            },
          },
        },
      },
    },
  });

  if (!result) {
    return c.json({ error: '批改结果不存在' }, 404);
  }

  return c.json({ data: result });
});

export default app;
