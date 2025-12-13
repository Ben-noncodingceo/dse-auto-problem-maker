import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// Factory function to create Prisma Client instance
// For Cloudflare Workers, create a new instance per request
export function createPrismaClient(databaseUrl?: string) {
  const connectionString = databaseUrl ||
    (typeof process !== 'undefined' && process.env?.DATABASE_URL);

  if (!connectionString) {
    throw new Error('DATABASE_URL is not provided');
  }

  // Use Neon adapter for edge/serverless environments
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
}

// For backward compatibility and local development
// Only create a global singleton instance if process is available
let cachedPrisma: PrismaClient | undefined;

export function getPrisma(databaseUrl?: string): PrismaClient {
  if (typeof process !== 'undefined') {
    // Node.js environment (local development)
    if (!cachedPrisma) {
      cachedPrisma = createPrismaClient(databaseUrl);
    }
    return cachedPrisma;
  } else {
    // Cloudflare Workers environment
    // Always create a new instance for each request
    return createPrismaClient(databaseUrl);
  }
}

// Lazy-initialized prisma instance using Proxy
// This avoids accessing process.env at module load time
let _prisma: PrismaClient | null = null;

const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // Initialize on first access (not at module load time)
    if (!_prisma) {
      if (typeof process === 'undefined') {
        throw new Error(
          'Prisma client cannot be initialized in Cloudflare Workers context. ' +
          'Use c.var.prisma from the request context instead.'
        );
      }
      _prisma = getPrisma();
    }
    return (_prisma as any)[prop];
  }
});

export const prisma = prismaProxy;

// 导出 Prisma 类型
export * from '@prisma/client';
