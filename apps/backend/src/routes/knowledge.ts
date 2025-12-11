import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@dse/database';

const app = new Hono();

// 获取所有一级知识目录
app.get('/categories', async (c) => {
  const categories = await prisma.knowledgeCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      tags: true,
    },
  });

  return c.json({ data: categories });
});

// 创建一级知识目录
app.post('/categories', zValidator('json', z.object({
  name: z.string().min(1),
  order: z.number().int().min(0),
})), async (c) => {
  const data = c.req.valid('json');

  const category = await prisma.knowledgeCategory.create({
    data,
  });

  return c.json({ data: category }, 201);
});

// 获取指定目录的二级知识点标签
app.get('/categories/:categoryId/tags', async (c) => {
  const categoryId = c.req.param('categoryId');

  const tags = await prisma.knowledgeTag.findMany({
    where: { categoryId },
    orderBy: { name: 'asc' },
  });

  return c.json({ data: tags });
});

// 创建二级知识点标签
app.post('/tags', zValidator('json', z.object({
  name: z.string().min(1),
  categoryId: z.string(),
  externalRefs: z.record(z.any()).optional(),
})), async (c) => {
  const data = c.req.valid('json');

  const tag = await prisma.knowledgeTag.create({
    data,
  });

  return c.json({ data: tag }, 201);
});

// 获取所有能力标签
app.get('/ability-tags', async (c) => {
  const tags = await prisma.abilityTag.findMany({
    orderBy: { name: 'asc' },
  });

  return c.json({ data: tags });
});

// 创建能力标签
app.post('/ability-tags', zValidator('json', z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})), async (c) => {
  const data = c.req.valid('json');

  const tag = await prisma.abilityTag.create({
    data,
  });

  return c.json({ data: tag }, 201);
});

export default app;
