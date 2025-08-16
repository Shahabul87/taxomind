import { PrismaClient } from '@prisma/client';
import { EnterpriseDB } from './enterprise-db';
import { getEnvironment } from './db-environment';
import { logger } from '@/lib/logger';

const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';
const strictMode = process.env.STRICT_ENV_MODE === 'true';

let dbInstance: PrismaClient | EnterpriseDB | null = null;

export const db = (() => {
  if (!dbInstance) {
    if ((isProduction || isStaging) && strictMode) {

      // Return the enterprise db proxy from enterprise-db.ts
      const { db: enterpriseDb } = require('./enterprise-db');
      dbInstance = enterpriseDb as any;
    } else {
      const globalForPrisma = globalThis as unknown as {
        prisma: PrismaClient | undefined;
      };
      
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient();
      }
      
      dbInstance = globalForPrisma.prisma;
      
      if (isProduction || isStaging) {
        logger.warn('[DB Migration] Using standard PrismaClient in production/staging. Consider enabling STRICT_ENV_MODE for enhanced safety.');
      }
    }
  }
  
  return dbInstance as PrismaClient;
})();

export { EnterpriseDB };

export function getEnterpriseDB(options?: {
  userContext?: { id: string; role: string };
  auditEnabled?: boolean;
}) {
  // Return the enterprise db proxy from enterprise-db.ts
  const { db: enterpriseDb } = require('./enterprise-db');
  return enterpriseDb;
}

export async function migrateToEnterpriseDB<T>(
  operation: (db: PrismaClient) => Promise<T>,
  options?: {
    userContext?: { id: string; role: string };
    requireAudit?: boolean;
  }
): Promise<T> {
  if ((isProduction || isStaging) && strictMode) {
    const enterpriseDb = getEnterpriseDB(options);
    return operation(enterpriseDb as unknown as PrismaClient);
  }
  
  return operation(db);
}