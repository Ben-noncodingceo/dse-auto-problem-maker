import { createMiddleware } from 'hono/factory';
import { getPrisma, type PrismaClient } from '@dse/database';

// Extend Hono context with prisma client
type PrismaVariables = {
  prisma: PrismaClient;
};

export const prismaMiddleware = createMiddleware<{
  Bindings: { DATABASE_URL: string };
  Variables: PrismaVariables;
}>(async (c, next) => {
  // Get DATABASE_URL from Cloudflare Workers env or Node.js process.env
  const databaseUrl = c.env?.DATABASE_URL ||
    (typeof process !== 'undefined' && process.env?.DATABASE_URL);

  if (!databaseUrl) {
    return c.json({ error: 'DATABASE_URL is not configured' }, 500);
  }

  // Create or get Prisma client instance
  const prisma = getPrisma(databaseUrl);

  // Store in context
  c.set('prisma', prisma);

  await next();
});
