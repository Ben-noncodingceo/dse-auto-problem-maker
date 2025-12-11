import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import app from './index';

dotenv.config();

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
