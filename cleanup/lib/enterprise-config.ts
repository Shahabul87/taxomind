import { logger } from '@/lib/logger';

// Enterprise Configuration Management
// Provides strict environment isolation and safety controls

export interface EnterpriseEnvironmentConfig {
  name: 'development' | 'staging' | 'production';
  database: {
    host: string;
    name: string;
    ssl: boolean;
    poolSize: number;
    maxConnections: number;
    safetyMode: boolean;
  };
  security: {
    strictMode: boolean;
    auditRequired: boolean;
    encryptionRequired: boolean;
    crossEnvBlocked: boolean;
  };
  operations: {
    allowWrites: boolean;
    allowDestructive: boolean;
    requireUserContext: boolean;
    transactionTimeout: number;
  };
  monitoring: {
    enabled: boolean;
    metricsEnabled: boolean;
    alertingEnabled: boolean;
    debugMode: boolean;
  };
}

class EnterpriseConfigManager {
  private static config: EnterpriseEnvironmentConfig | null = null;
  
  static getConfig(): EnterpriseEnvironmentConfig {
    if (!this.config) {
      this.config = this.loadConfiguration();
      this.validateConfiguration();
    }
    return this.config;
  }

  private static loadConfiguration(): EnterpriseEnvironmentConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Base configuration templates
    const configs: Record<string, EnterpriseEnvironmentConfig> = {
      development: {
        name: 'development',
        database: {
          host: 'localhost:5433',
          name: 'taxomind_dev',
          ssl: false,
          poolSize: 5,
          maxConnections: 10,
          safetyMode: true,
        },
        security: {
          strictMode: process.env.STRICT_MODE === 'true',
          auditRequired: false,
          encryptionRequired: false,
          crossEnvBlocked: process.env.BLOCK_CROSS_ENV === 'true',
        },
        operations: {
          allowWrites: true,
          allowDestructive: true,
          requireUserContext: false,
          transactionTimeout: 30000,
        },
        monitoring: {
          enabled: true,
          metricsEnabled: false,
          alertingEnabled: false,
          debugMode: true,
        },
      },
      
      staging: {
        name: 'staging',
        database: {
          host: 'staging-postgres.railway.internal',
          name: 'staging_db',
          ssl: true,
          poolSize: 10,
          maxConnections: 20,
          safetyMode: true,
        },
        security: {
          strictMode: true,
          auditRequired: true,
          encryptionRequired: true,
          crossEnvBlocked: true,
        },
        operations: {
          allowWrites: true,
          allowDestructive: false,
          requireUserContext: true,
          transactionTimeout: 45000,
        },
        monitoring: {
          enabled: true,
          metricsEnabled: true,
          alertingEnabled: true,
          debugMode: false,
        },
      },
      
      production: {
        name: 'production',
        database: {
          host: 'postgres.railway.internal',
          name: 'railway',
          ssl: true,
          poolSize: 20,
          maxConnections: 50,
          safetyMode: true,
        },
        security: {
          strictMode: true,
          auditRequired: true,
          encryptionRequired: true,
          crossEnvBlocked: true,
        },
        operations: {
          allowWrites: true,
          allowDestructive: false,
          requireUserContext: true,
          transactionTimeout: 60000,
        },
        monitoring: {
          enabled: true,
          metricsEnabled: true,
          alertingEnabled: true,
          debugMode: false,
        },
      },
    };

    const config = configs[nodeEnv as keyof typeof configs];
    if (!config) {
      throw new Error(`🚨 [ENTERPRISE CONFIG] Unknown environment: ${nodeEnv}`);
    }

    return config;
  }

  private static validateConfiguration(): void {
    if (!this.config) return;

    const requiredEnvVars = [
      'DATABASE_URL',
      'AUTH_SECRET',
      'NEXT_PUBLIC_APP_URL',
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`🚨 [ENTERPRISE CONFIG] Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate database URL matches expected environment
    const dbUrl = process.env.DATABASE_URL!;
    const config = this.config;

    if (config.name === 'development' && !dbUrl.includes('localhost')) {
      if (config.security.crossEnvBlocked) {
        throw new Error(`🚨 [ENTERPRISE CONFIG] Cross-environment access blocked: Development environment cannot use remote database`);
      } else {
        logger.warn(`⚠️ [ENTERPRISE CONFIG] WARNING: Development environment using non-local database`);
      }
    }

    if (config.name === 'production' && dbUrl.includes('localhost')) {
      throw new Error(`🚨 [ENTERPRISE CONFIG] Production environment cannot use local database`);
    }

    // Validate SSL requirements
    if (config.database.ssl && !dbUrl.includes('sslmode=require')) {
      logger.warn(`⚠️ [ENTERPRISE CONFIG] SSL required but not configured in DATABASE_URL`);
    }

  }

  static isProductionLike(): boolean {
    const config = this.getConfig();
    return config.name === 'production' || config.name === 'staging';
  }

  static isDevelopment(): boolean {
    return this.getConfig().name === 'development';
  }

  static requiresAudit(): boolean {
    return this.getConfig().security.auditRequired;
  }

  static allowsDestructive(): boolean {
    return this.getConfig().operations.allowDestructive;
  }

  static getSecurityLevel(): 'low' | 'medium' | 'high' {
    const config = this.getConfig();
    if (config.name === 'production') return 'high';
    if (config.name === 'staging') return 'medium';
    return 'low';
  }
}

// Environment-specific database validation
export class DatabaseEnvironmentValidator {
  static async validateEnvironmentIntegrity(): Promise<{
    valid: boolean;
    environment: string;
    database: string;
    issues: string[];
  }> {
    const config = EnterpriseConfigManager.getConfig();
    const issues: string[] = [];
    
    try {
      // This would normally require a database connection
      // For now, we'll validate based on URL patterns
      const dbUrl = process.env.DATABASE_URL!;
      
      // Check 1: Environment-Database alignment
      if (config.name === 'development' && !dbUrl.includes('localhost')) {
        issues.push('Development environment should use localhost database');
      }
      
      if (config.name === 'production' && dbUrl.includes('localhost')) {
        issues.push('Production environment cannot use localhost database');
      }

      // Check 2: SSL configuration
      if (config.database.ssl && !dbUrl.includes('ssl')) {
        issues.push('SSL required but not configured');
      }

      // Check 3: Database name validation
      const expectedDbPattern = config.name === 'development' ? 'taxomind_dev' : 'railway';
      if (!dbUrl.includes(expectedDbPattern)) {
        issues.push(`Expected database pattern '${expectedDbPattern}' not found in URL`);
      }

      return {
        valid: issues.length === 0,
        environment: config.name,
        database: config.database.name,
        issues,
      };
    } catch (error: any) {
      issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        environment: config.name,
        database: 'unknown',
        issues,
      };
    }
  }
}

// Export singleton instance
export const enterpriseConfig = EnterpriseConfigManager;

// Environment-specific constants
export const ENTERPRISE_CONSTANTS = {
  MAX_TRANSACTION_TIME: {
    development: 30000,
    staging: 45000,
    production: 60000,
  },
  CONNECTION_LIMITS: {
    development: { min: 2, max: 10 },
    staging: { min: 5, max: 20 },
    production: { min: 10, max: 50 },
  },
  AUDIT_RETENTION: {
    development: 7, // days
    staging: 30,
    production: 365,
  },
} as const;