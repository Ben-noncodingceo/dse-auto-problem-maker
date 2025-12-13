import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prismaMiddleware } from './middleware/prisma';

// Routes
import syllabusRoutes from './routes/syllabus';
import knowledgeRoutes from './routes/knowledge';
import aiProviderRoutes from './routes/ai-provider';
import questionRoutes from './routes/question';
import gradingRoutes from './routes/grading';

// Environment variables type for Cloudflare Workers
type Bindings = {
  DATABASE_URL: string;
  NODE_ENV?: string;
  CORS_ORIGIN?: string;
  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  DOUBAO_API_KEY?: string;
  TONGYI_API_KEY?: string;
  GEMINI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', (c, next) => {
  const corsOrigin = c.env?.CORS_ORIGIN ||
    (typeof process !== 'undefined' && process.env?.CORS_ORIGIN) ||
    'http://localhost:5173';

  return cors({
    origin: corsOrigin,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next);
});

// Initialize Prisma client for each request
app.use('*', prismaMiddleware);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.route('/api/syllabus', syllabusRoutes);
app.route('/api/knowledge', knowledgeRoutes);
app.route('/api/ai-providers', aiProviderRoutes);
app.route('/api/questions', questionRoutes);
app.route('/api/grading', gradingRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);
  return c.json({ error: err.message }, 500);
});

// Export for Cloudflare Workers
export default app;
