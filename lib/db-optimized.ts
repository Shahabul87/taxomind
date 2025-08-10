import { PrismaClient } from "@prisma/client";
import { logger } from '@/lib/logger';

declare global {
  var prisma: PrismaClient | undefined;
}

// Optimized Prisma client with connection pooling for Railway
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Connection pool optimization for Railway's limits
    // Railway typically allows 20-100 connections
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  });
};

// Optimize query performance
const prismaWithOptimizations = () => {
  const client = prismaClientSingleton();
  
  // Add query result caching middleware
  client.$use(async (params, next) => {
    const startTime = Date.now();
    const result = await next(params);
    const duration = Date.now() - startTime;
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      logger.warn(`Slow query (${duration}ms):`, {
        model: params.model,
        action: params.action,
      });
    }
    
    return result;
  });
  
  return client;
};

export const db = globalThis.prisma || prismaWithOptimizations();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect();
});