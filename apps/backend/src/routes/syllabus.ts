import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@dse/database';

const app = new Hono();

// 获取所有大纲来源
app.get('/', async (c) => {
  const sources = await prisma.syllabusSource.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return c.json({ data: sources });
});

// 添加大纲来源（URL）
app.post('/url', zValidator('json', z.object({
  url: z.string().url(),
})), async (c) => {
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
  // TODO: 实现文件上传逻辑
  // 1. 使用 multer 或类似中间件处理文件上传
  // 2. 保存文件到本地或对象存储
  // 3. 创建数据库记录
  // 4. 触发后台任务解析 PDF

  return c.json({ message: 'PDF upload not implemented yet' }, 501);
});

export default app;
