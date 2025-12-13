import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Context } from 'hono';
import { createPrismaClient, type PrismaClient } from '@dse/database';

type Variables = {
  prisma: PrismaClient;
};

type Bindings = {
  DATABASE_URL: string;
  DEEPSEEK_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  TONGYI_API_KEY?: string;
  DOUBAO_API_KEY?: string;
};

const app = new Hono<{ Variables: Variables; Bindings: Bindings }>();

// 获取 Prisma 客户端
function getPrisma(c: Context<{ Variables: Variables; Bindings: Bindings }>): PrismaClient {
  return c.var.prisma || c.get('prisma');
}

// 预设的 AI 提供商配置
const PRESET_PROVIDERS = {
  DEEPSEEK: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
  GEMINI: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelName: 'gemini-pro',
    envKey: 'GEMINI_API_KEY',
  },
  CHATGPT: {
    name: 'OpenAI ChatGPT',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4-turbo-preview',
    envKey: 'OPENAI_API_KEY',
  },
  TONGYI: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/api',
    modelName: 'qwen-turbo',
    envKey: 'TONGYI_API_KEY',
  },
  DOUBAO: {
    name: '豆包',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    modelName: 'doubao-pro',
    envKey: 'DOUBAO_API_KEY',
  },
};

// 获取所有可用的 AI 供应商（预设 + 自定义）
app.get('/', async (c) => {
  const prisma = getPrisma(c);

  // 获取数据库中的自定义配置
  const dbProviders = await prisma.aIProviderConfig.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const providers = [];

  // 添加预设提供商
  for (const [key, preset] of Object.entries(PRESET_PROVIDERS)) {
    const envKey = (c.env as any)[preset.envKey];
    const hasApiKey = !!envKey;

    // 查找数据库中是否有这个提供商的配置
    const dbConfig = dbProviders.find(p => p.providerName === key);

    providers.push({
      id: dbConfig?.id || `preset-${key}`,
      providerName: key,
      displayName: preset.name,
      baseUrl: preset.baseUrl,
      modelName: dbConfig?.modelName || preset.modelName, // 优先使用数据库中的配置
      isDefault: dbConfig?.isDefault || false,
      isPreset: true,
      hasApiKey,
      enabled: !!dbConfig, // 只有在数据库中有记录才认为已启用
    });
  }

  // 添加自定义提供商
  for (const provider of dbProviders) {
    if (provider.providerName === 'CUSTOM') {
      providers.push({
        id: provider.id,
        providerName: provider.providerName,
        displayName: '自定义',
        baseUrl: provider.baseUrl,
        modelName: provider.modelName,
        isDefault: provider.isDefault,
        isPreset: false,
        hasApiKey: true,
        enabled: true,
        apiKey: provider.apiKey.substring(0, 8) + '****', // 部分显示
      });
    }
  }

  return c.json({ data: providers });
});

// 启用/更新预设提供商
app.post('/preset/:providerName', zValidator('json', z.object({
  isDefault: z.boolean().optional(),
  modelName: z.string().optional(), // 允许用户修改模型名称
})), async (c) => {
  const prisma = getPrisma(c);
  const providerName = c.req.param('providerName') as keyof typeof PRESET_PROVIDERS;
  const data = c.req.valid('json');

  // 验证是否是有效的预设提供商
  if (!PRESET_PROVIDERS[providerName]) {
    return c.json({ error: '无效的提供商' }, 400);
  }

  const preset = PRESET_PROVIDERS[providerName];
  const envKey = (c.env as any)[preset.envKey];

  if (!envKey) {
    return c.json({
      error: `${preset.name} 的 API Key 未在环境变量中配置`,
      hint: `请在 Cloudflare Worker 设置中添加 ${preset.envKey}`
    }, 400);
  }

  // 如果设置为默认，先取消其他默认配置
  if (data.isDefault) {
    await prisma.aIProviderConfig.updateMany({
      data: { isDefault: false },
    });
  }

  // 查找或创建配置
  const existing = await prisma.aIProviderConfig.findFirst({
    where: { providerName },
  });

  let provider;
  if (existing) {
    provider = await prisma.aIProviderConfig.update({
      where: { id: existing.id },
      data: {
        isDefault: data.isDefault || false,
        modelName: data.modelName || preset.modelName,
      },
    });
  } else {
    provider = await prisma.aIProviderConfig.create({
      data: {
        providerName,
        baseUrl: preset.baseUrl,
        modelName: data.modelName || preset.modelName,
        apiKey: envKey, // 直接存储环境变量的值
        isDefault: data.isDefault || false,
      },
    });
  }

  return c.json({ data: provider }, 201);
});

// 添加自定义 AI 供应商
app.post('/custom', zValidator('json', z.object({
  baseUrl: z.string().url(),
  modelName: z.string().min(1),
  apiKey: z.string().min(1),
  isDefault: z.boolean().optional(),
  timeoutMs: z.number().int().positive().optional(),
  extraParams: z.record(z.any()).optional(),
})), async (c) => {
  const prisma = getPrisma(c);
  const data = c.req.valid('json');

  // 如果设置为默认，先取消其他默认配置
  if (data.isDefault) {
    await prisma.aIProviderConfig.updateMany({
      data: { isDefault: false },
    });
  }

  const provider = await prisma.aIProviderConfig.create({
    data: {
      providerName: 'CUSTOM',
      baseUrl: data.baseUrl,
      modelName: data.modelName,
      apiKey: data.apiKey, // 自定义的直接存储
      isDefault: data.isDefault || false,
      timeoutMs: data.timeoutMs,
      extraParams: data.extraParams as any,
    },
  });

  return c.json({
    data: {
      ...provider,
      apiKey: data.apiKey.substring(0, 8) + '****',
    },
  }, 201);
});

// 更新自定义供应商
app.patch('/:id', zValidator('json', z.object({
  baseUrl: z.string().url().optional(),
  modelName: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  timeoutMs: z.number().int().positive().optional(),
  extraParams: z.record(z.any()).optional(),
})), async (c) => {
  const prisma = getPrisma(c);
  const id = c.req.param('id');
  const data = c.req.valid('json');

  // 如果设置为默认，先取消其他默认配置
  if (data.isDefault) {
    await prisma.aIProviderConfig.updateMany({
      data: { isDefault: false },
    });
  }

  const provider = await prisma.aIProviderConfig.update({
    where: { id },
    data: data as any,
  });

  return c.json({
    data: {
      ...provider,
      apiKey: provider.apiKey.substring(0, 8) + '****',
    },
  });
});

// 禁用/删除配置
app.delete('/:id', async (c) => {
  const prisma = getPrisma(c);
  const id = c.req.param('id');

  // 如果是预设的，只删除数据库记录（不影响环境变量）
  await prisma.aIProviderConfig.delete({
    where: { id },
  });

  return c.json({ message: '配置已删除' });
});

export default app;
