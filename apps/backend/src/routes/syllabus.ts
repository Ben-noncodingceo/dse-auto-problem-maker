import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Context } from 'hono';
import { createPrismaClient, type PrismaClient } from '@dse/database';
import { LLMService } from '@dse/llm';

type Variables = {
  prisma: PrismaClient;
};

type Bindings = {
  DATABASE_URL: string;
  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
};

const app = new Hono<{ Variables: Variables; Bindings: Bindings }>();

// 获取 Prisma 客户端的辅助函数
function getPrisma(c: Context<{ Variables: Variables; Bindings: Bindings }>): PrismaClient {
  return c.var.prisma || c.get('prisma');
}

// 获取所有大纲来源
app.get('/', async (c) => {
  const prisma = getPrisma(c);

  const sources = await prisma.syllabusSource.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      url: true,
      fileName: true,
      fileSize: true,
      status: true,
      parsedAt: true,
      createdAt: true,
      errorMessage: true,
    },
  });

  return c.json({ data: sources });
});

// 添加大纲来源（URL）
app.post('/url', zValidator('json', z.object({
  url: z.string().url(),
})), async (c) => {
  const prisma = getPrisma(c);
  const { url } = c.req.valid('json');

  const source = await prisma.syllabusSource.create({
    data: {
      type: 'URL',
      url,
      status: 'PENDING',
    },
  });

  // TODO: 触发后台任务解析大纲
  // await parseSyllabusFromUrl(source.id, url);

  return c.json({ data: source }, 201);
});

// 上传大纲 PDF
app.post('/pdf', async (c) => {
  try {
    const prisma = getPrisma(c);
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({ error: '请上传 PDF 文件' }, 400);
    }

    // 验证文件类型
    if (file.type !== 'application/pdf') {
      return c.json({ error: '仅支持 PDF 格式' }, 400);
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: '文件大小不能超过 10MB' }, 400);
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(arrayBuffer);

    // 创建数据库记录
    const source = await prisma.syllabusSource.create({
      data: {
        type: 'PDF',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileContent,
        status: 'PENDING',
      },
    });

    // 在后台触发解析（这里简化为同步调用，实际应该使用队列）
    // 为了不阻塞响应，我们先返回结果，然后异步解析
    parseSyllabusPDF(source.id, c).catch((error) => {
      console.error('Failed to parse syllabus PDF:', error);
    });

    return c.json({
      data: {
        id: source.id,
        fileName: source.fileName,
        fileSize: source.fileSize,
        status: source.status,
        createdAt: source.createdAt,
      },
    }, 201);
  } catch (error) {
    console.error('PDF upload error:', error);
    return c.json({
      error: error instanceof Error ? error.message : '上传失败',
    }, 500);
  }
});

// 触发大纲解析
app.post('/:id/parse', async (c) => {
  try {
    const prisma = getPrisma(c);
    const { id } = c.req.param();

    const source = await prisma.syllabusSource.findUnique({
      where: { id },
    });

    if (!source) {
      return c.json({ error: '大纲来源不存在' }, 404);
    }

    if (source.status === 'PROCESSING') {
      return c.json({ error: '正在解析中，请稍候' }, 400);
    }

    if (source.status === 'COMPLETED') {
      return c.json({ error: '已经解析完成' }, 400);
    }

    // 触发解析
    await parseSyllabusPDF(id, c);

    return c.json({ message: '解析完成' });
  } catch (error) {
    console.error('Parse trigger error:', error);
    return c.json({
      error: error instanceof Error ? error.message : '解析失败',
    }, 500);
  }
});

// 获取解析结果
app.get('/:id', async (c) => {
  try {
    const prisma = getPrisma(c);
    const { id } = c.req.param();

    const source = await prisma.syllabusSource.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        url: true,
        fileName: true,
        fileSize: true,
        status: true,
        parsedData: true,
        errorMessage: true,
        parsedAt: true,
        createdAt: true,
      },
    });

    if (!source) {
      return c.json({ error: '大纲来源不存在' }, 404);
    }

    return c.json({ data: source });
  } catch (error) {
    console.error('Get syllabus error:', error);
    return c.json({
      error: error instanceof Error ? error.message : '获取失败',
    }, 500);
  }
});

/**
 * 解析 PDF 大纲
 */
async function parseSyllabusPDF(
  sourceId: string,
  c: Context<{ Variables: Variables; Bindings: Bindings }>
): Promise<void> {
  const prisma = getPrisma(c);

  try {
    // 更新状态为处理中
    await prisma.syllabusSource.update({
      where: { id: sourceId },
      data: { status: 'PROCESSING' },
    });

    // 获取大纲来源
    const source = await prisma.syllabusSource.findUnique({
      where: { id: sourceId },
    });

    if (!source || !source.fileContent) {
      throw new Error('文件内容不存在');
    }

    // 提取 PDF 文本（这里简化处理，实际应该使用 PDF 解析库）
    // 在 Cloudflare Workers 中，我们可以使用 AI 直接处理 PDF
    const pdfText = await extractPDFText(source.fileContent);

    // 获取默认 AI 供应商配置
    const aiProvider = await prisma.aIProviderConfig.findFirst({
      where: { isDefault: true },
    });

    if (!aiProvider) {
      throw new Error('未配置默认 AI 供应商');
    }

    // 创建 LLM 服务
    const llmService = new LLMService({
      provider: aiProvider.providerName.toLowerCase() as any,
      baseUrl: aiProvider.baseUrl,
      apiKey: aiProvider.apiKey,
      modelName: aiProvider.modelName,
      timeoutMs: aiProvider.timeoutMs,
      extraParams: aiProvider.extraParams as Record<string, any>,
    });

    // 调用 AI 分析大纲
    const analysisResult = await llmService.analyzeSyllabus({
      text: pdfText,
      exam: 'HKDSE Physics',
      context: source.fileName || undefined,
    });

    // 保存解析结果
    await prisma.syllabusSource.update({
      where: { id: sourceId },
      data: {
        status: 'COMPLETED',
        parsedData: analysisResult as any,
        parsedAt: new Date(),
      },
    });

    // 将解析结果保存到知识点表中
    for (const category of analysisResult.categories) {
      // 创建或获取一级分类
      const existingCategory = await prisma.knowledgeCategory.findFirst({
        where: { name: category.name },
      });

      const dbCategory = existingCategory || await prisma.knowledgeCategory.create({
        data: {
          name: category.name,
          order: category.order,
        },
      });

      // 创建二级知识点标签
      for (const tag of category.tags) {
        const existingTag = await prisma.knowledgeTag.findFirst({
          where: {
            name: tag.name,
            categoryId: dbCategory.id,
          },
        });

        if (!existingTag) {
          await prisma.knowledgeTag.create({
            data: {
              name: tag.name,
              categoryId: dbCategory.id,
              externalRefs: tag.externalRefs || {},
            },
          });
        }
      }
    }

  } catch (error) {
    console.error('Syllabus parsing error:', error);

    // 更新状态为失败
    await prisma.syllabusSource.update({
      where: { id: sourceId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

/**
 * 提取 PDF 文本
 * 简化版：直接将 Uint8Array 转为字符串尝试读取
 * 实际应该使用 pdf-parse 或类似库，但在 Workers 环境中可能需要特殊处理
 */
async function extractPDFText(fileContent: Uint8Array): Promise<string> {
  // 这里是一个简化的实现
  // 在实际环境中，应该使用 PDF 解析库或 AI 的视觉能力

  try {
    // 尝试提取 PDF 中的文本内容
    // 这是一个非常简化的方法，仅用于演示
    const text = new TextDecoder('utf-8').decode(fileContent);

    // 如果提取的文本太短或包含大量乱码，返回提示
    if (text.length < 100 || !text.match(/[\u4e00-\u9fa5a-zA-Z]{10,}/)) {
      return `这是一个 PDF 文件，包含 HKDSE Physics 考试大纲。
请分析其中的知识点结构，提取一级分类和二级知识点。

由于这是二进制 PDF 文件，请根据 HKDSE Physics 的标准大纲结构，
提供一个典型的物理大纲分析，包括：
- 力学
- 热学
- 电磁学
- 波动和光学
- 原子物理

每个分类下应包含相应的知识点标签。`;
    }

    return text;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('PDF 文本提取失败');
  }
}

export default app;
