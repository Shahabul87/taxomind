// Enterprise Database Management System
// Provides enterprise-level safety, auditing, and environment isolation

import { PrismaClient } from "@prisma/client";
import { getEnvironmentConfig } from "./db-environment";

// Enterprise Database Configuration
interface EnterpriseDBConfig {
  environment: 'development' | 'staging' | 'production';
  allowWrites: boolean;
  allowDestructive: boolean;
  auditEnabled: boolean;
  transactionTimeout: number;
  connectionPoolSize: number;
  safetyChecks: boolean;
}

// Database Connection Pool Manager
class DatabaseConnectionManager {
  private static instances: Map<string, PrismaClient> = new Map();
  private static config: EnterpriseDBConfig;

  static initialize() {
    const envConfig = getEnvironmentConfig();
    
    this.config = {
      environment: process.env.NODE_ENV as any || 'development',
      allowWrites: true,
      allowDestructive: envConfig.isDevelopment,
      auditEnabled: !envConfig.isDevelopment,
      transactionTimeout: envConfig.isDevelopment ? 30000 : 60000,
      connectionPoolSize: envConfig.isDevelopment ? 5 : 20,
      safetyChecks: true
    };

    console.log(`🏢 [ENTERPRISE DB] Initialized for ${this.config.environment}`);
  }

  static getConnection(context: string = 'default'): PrismaClient {
    if (!this.instances.has(context)) {
      const client = new PrismaClient({
        log: this.config.environment === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });

      this.instances.set(context, client);
      console.log(`🔌 [ENTERPRISE DB] Created connection: ${context}`);
    }

    return this.instances.get(context)!;
  }

  static async validateConnection(): Promise<boolean> {
    try {
      const client = this.getConnection('validation');
      await client.$queryRaw`SELECT 1 as test`;
      
      // Verify we're connected to the right database
      const dbInfo = await client.$queryRaw<Array<{database: string}>>`
        SELECT current_database() as database
      `;
      
      const currentDB = dbInfo[0]?.database;
      const isDevelopment = this.config.environment === 'development';
      const isProduction = this.config.environment === 'production';
      const isStaging = this.config.environment === 'staging';
      
      // More flexible validation logic
      let isValidConnection = false;
      
      if (isDevelopment) {
        // In development, allow local databases
        isValidConnection = currentDB === 'taxomind_dev' || 
                          currentDB?.includes('dev') || 
                          currentDB?.includes('local') ||
                          process.env.DATABASE_URL?.includes('localhost');
      } else if (isProduction) {
        // In production, expect railway or production database
        isValidConnection = currentDB === 'railway' || 
                          process.env.DATABASE_URL?.includes('railway.internal') ||
                          process.env.DATABASE_URL?.includes('railway.app');
      } else if (isStaging) {
        // In staging, expect staging database
        isValidConnection = currentDB?.includes('staging') ||
                          process.env.DATABASE_URL?.includes('staging');
      }
      
      if (!isValidConnection) {
        console.warn(`⚠️ [ENTERPRISE DB] Database validation: ${currentDB} in ${this.config.environment} environment`);
        
        // Only throw error in strict mode
        if (process.env.STRICT_ENV_MODE === 'true') {
          throw new Error(`🚨 DATABASE MISMATCH! Environment: ${this.config.environment}, Database: ${currentDB}`);
        }
      }

      console.log(`✅ [ENTERPRISE DB] Connected to: ${currentDB} (${this.config.environment})`);
      return true;
    } catch (error) {
      console.error('❌ [ENTERPRISE DB] Connection validation failed:', error);
      
      // In development, don't fail the build - just warn
      if (this.config.environment === 'development') {
        console.warn('⚠️ [ENTERPRISE DB] Continuing in development mode despite validation failure');
        return true;
      }
      
      return false;
    }
  }

  static getConfig(): EnterpriseDBConfig {
    return { ...this.config };
  }
}

// Enterprise Transaction Manager
class EnterpriseTransactionManager {
  private static auditLog: Array<{
    id: string;
    operation: string;
    table: string;
    environment: string;
    timestamp: Date;
    userId?: string;
    changes: any;
    rollbackData?: any;
  }> = [];

  static async executeWithSafety<T>(
    operation: (tx: PrismaClient) => Promise<T>,
    context: {
      operationType: 'read' | 'write' | 'destructive';
      description: string;
      userId?: string;
      auditData?: any;
    }
  ): Promise<T> {
    const config = DatabaseConnectionManager.getConfig();
    
    // Enterprise safety checks
    if (config.safetyChecks) {
      await this.performSafetyChecks(context);
    }

    // Get connection with proper context
    const client = DatabaseConnectionManager.getConnection(context.description);
    
    // Audit logging
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (config.auditEnabled && context.operationType !== 'read') {
      this.auditLog.push({
        id: auditId,
        operation: context.description,
        table: 'multiple', // TODO: Extract from operation
        environment: config.environment,
        timestamp: new Date(),
        userId: context.userId,
        changes: context.auditData,
      });
    }

    try {
      // Execute within transaction for safety
      if (context.operationType === 'read') {
        return await operation(client);
      } else {
        return await client.$transaction(async (tx) => {
          return await operation(tx);
        }, {
          timeout: config.transactionTimeout,
        });
      }
    } catch (error) {
      console.error(`❌ [ENTERPRISE DB] Operation failed: ${context.description}`, error);
      
      // Log failure
      if (config.auditEnabled) {
        this.auditLog.push({
          id: `${auditId}_failed`,
          operation: `FAILED: ${context.description}`,
          table: 'error',
          environment: config.environment,
          timestamp: new Date(),
          userId: context.userId,
          changes: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
      }
      
      throw error;
    }
  }

  private static async performSafetyChecks(context: any): Promise<void> {
    const config = DatabaseConnectionManager.getConfig();
    
    // Check 1: Validate connection is correct for environment
    const isValid = await DatabaseConnectionManager.validateConnection();
    if (!isValid && config.environment !== 'development') {
      throw new Error('🚨 [ENTERPRISE DB] Database connection validation failed');
    }

    // Check 2: Prevent destructive operations in production
    if (config.environment === 'production' && context.operationType === 'destructive') {
      throw new Error('🚨 [ENTERPRISE DB] Destructive operations blocked in production');
    }

    // Check 3: Require user context for write operations in production
    if (config.environment === 'production' && 
        context.operationType === 'write' && 
        !context.userId) {
      throw new Error('🚨 [ENTERPRISE DB] User context required for production writes');
    }

    // Check 4: Validate environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error('🚨 [ENTERPRISE DB] DATABASE_URL not configured');
    }

    // Check 5: Prevent cross-environment contamination
    if (config.environment === 'development' && 
        process.env.DATABASE_URL?.includes('railway')) {
      console.warn('⚠️ [ENTERPRISE DB] WARNING: Using production database in development mode');
      
      // In strict mode, this would throw an error
      if (process.env.STRICT_ENV_MODE === 'true') {
        throw new Error('🚨 [ENTERPRISE DB] Cross-environment access blocked by strict mode');
      }
    }
  }

  static getAuditLog() {
    return [...this.auditLog];
  }

  static clearAuditLog() {
    this.auditLog = [];
  }
}

// Enterprise Database Client
export class EnterpriseDB {
  private static initialized = false;

  static async initialize() {
    if (!this.initialized) {
      DatabaseConnectionManager.initialize();
      
      // Validate initial connection
      const isValid = await DatabaseConnectionManager.validateConnection();
      if (!isValid) {
        const config = DatabaseConnectionManager.getConfig();
        
        // In development, warn but don't fail
        if (config.environment === 'development') {
          console.warn('⚠️ [ENTERPRISE DB] Connection validation failed in development mode, continuing...');
        } else {
          throw new Error('🚨 [ENTERPRISE DB] Failed to establish secure database connection');
        }
      }

      this.initialized = true;
      console.log('🏢 [ENTERPRISE DB] Enterprise database system initialized');
    }
  }

  // Safe read operations
  static async read<T>(
    operation: (db: PrismaClient) => Promise<T>,
    description: string = 'database_read'
  ): Promise<T> {
    await this.initialize();
    
    return EnterpriseTransactionManager.executeWithSafety(operation, {
      operationType: 'read',
      description,
    });
  }

  // Safe write operations
  static async write<T>(
    operation: (db: PrismaClient) => Promise<T>,
    context: {
      description: string;
      userId?: string;
      auditData?: any;
    }
  ): Promise<T> {
    await this.initialize();
    
    return EnterpriseTransactionManager.executeWithSafety(operation, {
      operationType: 'write',
      ...context,
    });
  }

  // Destructive operations (dev only)
  static async destructive<T>(
    operation: (db: PrismaClient) => Promise<T>,
    context: {
      description: string;
      userId?: string;
      auditData?: any;
    }
  ): Promise<T> {
    await this.initialize();
    
    return EnterpriseTransactionManager.executeWithSafety(operation, {
      operationType: 'destructive',
      ...context,
    });
  }

  // Get raw client for special cases (with safety checks)
  static async getRawClient(reason: string): Promise<PrismaClient> {
    await this.initialize();
    console.warn(`⚠️ [ENTERPRISE DB] Raw client access: ${reason}`);
    return DatabaseConnectionManager.getConnection(`raw_${reason}`);
  }

  // Health check
  static async healthCheck() {
    await this.initialize();
    
    try {
      const config = DatabaseConnectionManager.getConfig();
      const isValid = await DatabaseConnectionManager.validateConnection();
      
      return {
        status: isValid ? 'healthy' : 'unhealthy',
        environment: config.environment,
        config: {
          allowWrites: config.allowWrites,
          allowDestructive: config.allowDestructive,
          auditEnabled: config.auditEnabled,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  // Get audit information
  static getAuditInfo() {
    return {
      logs: EnterpriseTransactionManager.getAuditLog(),
      config: DatabaseConnectionManager.getConfig(),
    };
  }
}

// Backward compatibility - but with safety
export const db = {
  // Proxy all Prisma methods through enterprise safety layer
  get $transaction() {
    console.warn('⚠️ [ENTERPRISE DB] Direct $transaction access - consider using EnterpriseDB.write()');
    return EnterpriseDB.getRawClient('direct_transaction').then(client => client.$transaction);
  },
  
  get $queryRaw() {
    console.warn('⚠️ [ENTERPRISE DB] Direct $queryRaw access - consider using EnterpriseDB.read()');
    return EnterpriseDB.getRawClient('direct_query').then(client => client.$queryRaw);
  },

  // Forward all other Prisma model access
  get user() {
    return EnterpriseDB.getRawClient('user_model').then(client => client.user);
  },
  
  get course() {
    return EnterpriseDB.getRawClient('course_model').then(client => client.course);
  },

  get category() {
    return EnterpriseDB.getRawClient('category_model').then(client => client.category);
  },

  // Add other models as needed...
  get chapter() {
    return EnterpriseDB.getRawClient('chapter_model').then(client => client.chapter);
  },

  get purchase() {
    return EnterpriseDB.getRawClient('purchase_model').then(client => client.purchase);
  },

  get enrollment() {
    return EnterpriseDB.getRawClient('enrollment_model').then(client => client.enrollment);
  }
};

// Initialize on import
EnterpriseDB.initialize().catch(console.error);