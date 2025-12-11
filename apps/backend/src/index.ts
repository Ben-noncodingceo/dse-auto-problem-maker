import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import dotenv from 'dotenv';

// Routes
import syllabusRoutes from './routes/syllabus';
import knowledgeRoutes from './routes/knowledge';
import aiProviderRoutes from './routes/ai-provider';
import questionRoutes from './routes/question';
import gradingRoutes from './routes/grading';

dotenv.config();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

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

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
