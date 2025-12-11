import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma, AIProvider } from '@dse/database';
import bcrypt from 'bcryptjs';

const app = new Hono();

// 获取所有 AI 供应商配置
app.get('/', async (c) => {
  const providers = await prisma.aIProviderConfig.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // 不返回完整的 API Key，只返回部分用于识别
  const safeProviders = providers.map(p => ({
    ...p,
    apiKey: p.apiKey.substring(0, 8) + '****',
  }));

  return c.json({ data: safeProviders });
});

// 创建 AI 供应商配置
app.post('/', zValidator('json', z.object({
  providerName: z.enum(['DEEPSEEK', 'DOUBAO', 'TONGYI', 'CHATGPT', 'CUSTOM']),
  baseUrl: z.string().url(),
  modelName: z.string().min(1),
  apiKey: z.string().min(1),
  isDefault: z.boolean().optional(),
  timeoutMs: z.number().int().positive().optional(),
  extraParams: z.record(z.any()).optional(),
})), async (c) => {
  const data = c.req.valid('json');

  // 如果设置为默认，先取消其他默认配置
  if (data.isDefault) {
    await prisma.aIProviderConfig.updateMany({
      where: { providerName: data.providerName },
      data: { isDefault: false },
    });
  }

  // 简单加密 API Key (生产环境应使用更安全的方式)
  const encryptedApiKey = await bcrypt.hash(data.apiKey, 10);

  const provider = await prisma.aIProviderConfig.create({
    data: {
      ...data,
      apiKey: encryptedApiKey,
    },
  });

  return c.json({
    data: {
      ...provider,
      apiKey: data.apiKey.substring(0, 8) + '****',
    },
  }, 201);
});

// 更新 AI 供应商配置
app.patch('/:id', zValidator('json', z.object({
  baseUrl: z.string().url().optional(),
  modelName: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  timeoutMs: z.number().int().positive().optional(),
  extraParams: z.record(z.any()).optional(),
})), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  // 如果更新 API Key，需要加密
  let updateData: any = { ...data };
  if (data.apiKey) {
    updateData.apiKey = await bcrypt.hash(data.apiKey, 10);
  }

  const provider = await prisma.aIProviderConfig.update({
    where: { id },
    data: updateData,
  });

  return c.json({
    data: {
      ...provider,
      apiKey: provider.apiKey.substring(0, 8) + '****',
    },
  });
});

// 删除 AI 供应商配置
app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  await prisma.aIProviderConfig.delete({
    where: { id },
  });

  return c.json({ message: 'AI provider deleted successfully' });
});

export default app;
