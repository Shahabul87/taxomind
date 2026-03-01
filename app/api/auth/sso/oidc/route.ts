import { NextRequest, NextResponse } from 'next/server';
import { oidcProviderManager, type OIDCConfiguration } from '@/lib/auth/oidc-provider';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

/**
 * OIDC SSO Authentication Endpoints
 * 
 * Handles OpenID Connect authentication flow:
 * 1. POST /api/auth/sso/oidc - Initiate OIDC authentication
 * 2. GET /api/auth/sso/oidc - Get OIDC configuration and tenants
 * 3. GET /api/auth/sso/oidc/discovery - Get OIDC discovery document
 */

/**
 * POST /api/auth/sso/oidc - Initiate OIDC Authentication
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    const { tenantId, redirectUri, additionalParams } = await request.json();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }
    
    // Get or create OIDC provider for tenant
    let provider = oidcProviderManager.getProvider(tenantId);
    
    if (!provider) {
      // Try to load tenant configuration from database or environment
      const config = await loadTenantOIDCConfig(tenantId);
      if (!config) {
        return NextResponse.json(
          { error: 'OIDC configuration not found for tenant' },
          { status: 404 }
        );
      }
      
      provider = await oidcProviderManager.registerProvider(config);
    }
    
    // Generate authentication URL with PKCE
    const { authUrl, state, nonce } = await provider.generateAuthUrl(
      redirectUri,
      additionalParams
    );
    
    // Log authentication attempt

    return NextResponse.json({
      success: true,
      authUrl,
      state,
      nonce,
      tenantId,
    });
    
  } catch (error) {
    logger.error('[OIDC] Authentication initiation failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to initiate OIDC authentication', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/sso/oidc - Get OIDC Configuration and Tenants
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant');
    const action = searchParams.get('action');
    
    if (action === 'discovery' && tenantId) {
      // Return OIDC discovery document for tenant
      const provider = oidcProviderManager.getProvider(tenantId);
      if (!provider) {
        return NextResponse.json(
          { error: 'OIDC configuration not found for tenant' },
          { status: 404 }
        );
      }
      
      const discovery = provider.getDiscoveryDocument();
      return NextResponse.json({
        success: true,
        tenantId,
        discovery,
      });
    }
    
    if (!tenantId) {
      // Return list of configured tenants
      const tenants = oidcProviderManager.getConfiguredTenants();
      const summary = oidcProviderManager.getProvidersSummary();
      
      return NextResponse.json({
        success: true,
        tenants,
        summary,
        oidcEnabled: process.env.OIDC_ENABLED === 'true',
      });
    }
    
    // Get specific tenant configuration (non-sensitive data only)
    const provider = oidcProviderManager.getProvider(tenantId);
    if (!provider) {
      return NextResponse.json(
        { error: 'OIDC configuration not found for tenant' },
        { status: 404 }
      );
    }
    
    const configSummary = provider.getConfigSummary();
    
    return NextResponse.json({
      success: true,
      tenantId,
      config: configSummary,
    });
    
  } catch (error) {
    logger.error('[OIDC] Configuration retrieval failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve OIDC configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/sso/oidc - Update OIDC Configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const config: OIDCConfiguration = await request.json();
    
    if (!config.tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }
    
    // Validate configuration
    const validation = validateOIDCConfig(config);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid OIDC configuration', details: validation.errors },
        { status: 400 }
      );
    }
    
    // Remove existing provider if it exists
    oidcProviderManager.removeProvider(config.tenantId);
    
    // Register new provider
    const provider = await oidcProviderManager.registerProvider(config);
    
    // Optionally save to database
    await saveTenantOIDCConfig(config);

    return NextResponse.json({
      success: true,
      tenantId: config.tenantId,
      config: provider.getConfigSummary(),
    });
    
  } catch (error) {
    logger.error('[OIDC] Configuration update failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to update OIDC configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/sso/oidc - Remove OIDC Configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }
    
    // Remove provider
    const removed = oidcProviderManager.removeProvider(tenantId);
    
    if (!removed) {
      return NextResponse.json(
        { error: 'OIDC configuration not found for tenant' },
        { status: 404 }
      );
    }
    
    // Optionally remove from database
    await removeTenantOIDCConfig(tenantId);

    return NextResponse.json({
      success: true,
      tenantId,
      message: 'OIDC configuration removed successfully',
    });
    
  } catch (error) {
    logger.error('[OIDC] Configuration removal failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to remove OIDC configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Loads OIDC configuration for a tenant
 */
async function loadTenantOIDCConfig(tenantId: string): Promise<OIDCConfiguration | null> {
  try {
    // First, try to load from database
    const dbConfig = await loadOIDCConfigFromDatabase(tenantId);
    if (dbConfig) {
      return dbConfig;
    }
    
    // Fallback to environment variables
    const envConfig = loadOIDCConfigFromEnvironment(tenantId);
    if (envConfig) {
      return envConfig;
    }
    
    return null;
  } catch (error) {
    logger.error(`[OIDC] Failed to load config for tenant ${tenantId}:`, error);
    return null;
  }
}

/**
 * Loads OIDC configuration from database
 */
async function loadOIDCConfigFromDatabase(tenantId: string): Promise<OIDCConfiguration | null> {
  try {
    // This would query your tenant configuration table
    // For now, we'll return null and use environment variables
    
    // Example implementation:
    // const tenant = await db.tenant.findUnique({
    //   where: { id: tenantId },
    //   include: { oidcConfig: true }
    // });
    // 
    // if (!tenant?.oidcConfig) {
    //   return null;
    // }
    // 
    // return {
    //   tenantId,
    //   tenantName: tenant.name,
    //   issuer: tenant.oidcConfig.issuer,
    //   clientId: tenant.oidcConfig.clientId,
    //   clientSecret: tenant.oidcConfig.clientSecret,
    //   scopes: JSON.parse(tenant.oidcConfig.scopes || '["openid", "profile", "email"]'),
    //   // ... other config
    // };
    
    return null;
  } catch (error) {
    logger.error('[OIDC] Database config load failed:', error);
    return null;
  }
}

/**
 * Loads OIDC configuration from environment variables
 */
function loadOIDCConfigFromEnvironment(tenantId: string): OIDCConfiguration | null {
  const envPrefix = `OIDC_${tenantId.toUpperCase().replace('-', '_')}`;
  
  const issuer = process.env[`${envPrefix}_ISSUER`] || process.env.OIDC_ISSUER;
  const clientId = process.env[`${envPrefix}_CLIENT_ID`] || process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env[`${envPrefix}_CLIENT_SECRET`] || process.env.OIDC_CLIENT_SECRET;
  
  if (!issuer || !clientId) {
    return null;
  }
  
  const scopesString = process.env[`${envPrefix}_SCOPES`] || process.env.OIDC_SCOPES || 'openid,profile,email';
  const scopes = scopesString.split(',').map(s => s.trim());
  
  return {
    tenantId,
    tenantName: process.env[`${envPrefix}_NAME`],
    domain: process.env[`${envPrefix}_DOMAIN`],
    issuer,
    clientId,
    clientSecret,
    scopes,
    usePKCE: process.env[`${envPrefix}_USE_PKCE`] !== 'false',
    sessionTimeout: parseInt(process.env[`${envPrefix}_SESSION_TIMEOUT`] || '480'),
    refreshTokens: process.env[`${envPrefix}_REFRESH_TOKENS`] !== 'false',
    claimsMapping: {
      email: process.env[`${envPrefix}_CLAIM_EMAIL`] || 'email',
      firstName: process.env[`${envPrefix}_CLAIM_FIRST_NAME`] || 'given_name',
      lastName: process.env[`${envPrefix}_CLAIM_LAST_NAME`] || 'family_name',
      displayName: process.env[`${envPrefix}_CLAIM_DISPLAY_NAME`] || 'name',
      groups: process.env[`${envPrefix}_CLAIM_GROUPS`] || 'groups',
      roles: process.env[`${envPrefix}_CLAIM_ROLES`] || 'roles',
    },
    roleMapping: parseRoleMapping(process.env[`${envPrefix}_ROLE_MAPPING`]),
    customParams: parseCustomParams(process.env[`${envPrefix}_CUSTOM_PARAMS`]),
  };
}

/**
 * Saves OIDC configuration to database
 */
async function saveTenantOIDCConfig(config: OIDCConfiguration): Promise<void> {
  try {
    // This would save to your tenant configuration table
    // For now, we'll just log it

    // Example implementation:
    // await db.tenant.upsert({
    //   where: { id: config.tenantId },
    //   update: {
    //     oidcConfig: {
    //       upsert: {
    //         create: {
    //           issuer: config.issuer,
    //           clientId: config.clientId,
    //           clientSecret: config.clientSecret,
    //           scopes: JSON.stringify(config.scopes),
    //           // ... other fields
    //         },
    //         update: {
    //           issuer: config.issuer,
    //           clientId: config.clientId,
    //           clientSecret: config.clientSecret,
    //           scopes: JSON.stringify(config.scopes),
    //           // ... other fields
    //         },
    //       },
    //     },
    //   },
    //   create: {
    //     id: config.tenantId,
    //     name: config.tenantName,
    //     oidcConfig: {
    //       create: {
    //         issuer: config.issuer,
    //         clientId: config.clientId,
    //         clientSecret: config.clientSecret,
    //         scopes: JSON.stringify(config.scopes),
    //         // ... other fields
    //       },
    //     },
    //   },
    // });
  } catch (error) {
    logger.error('[OIDC] Database config save failed:', error);
  }
}

/**
 * Removes OIDC configuration from database
 */
async function removeTenantOIDCConfig(tenantId: string): Promise<void> {
  try {
    // This would remove from your tenant configuration table
    // For now, we'll just log it

    // Example implementation:
    // await db.oidcConfig.deleteMany({
    //   where: {
    //     tenant: { id: tenantId },
    //   },
    // });
  } catch (error) {
    logger.error('[OIDC] Database config removal failed:', error);
  }
}

/**
 * Parses role mapping from environment variable
 */
function parseRoleMapping(mappingString?: string): Record<string, 'USER' | 'ADMIN'> | undefined {
  if (!mappingString) return undefined;
  
  try {
    return JSON.parse(mappingString);
  } catch (error) {
    logger.warn('[OIDC] Failed to parse role mapping:', error);
    return undefined;
  }
}

/**
 * Parses custom parameters from environment variable
 */
function parseCustomParams(paramsString?: string): Record<string, string> | undefined {
  if (!paramsString) return undefined;
  
  try {
    return JSON.parse(paramsString);
  } catch (error) {
    logger.warn('[OIDC] Failed to parse custom parameters:', error);
    return undefined;
  }
}

/**
 * Validates OIDC configuration
 */
function validateOIDCConfig(config: OIDCConfiguration): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.tenantId) errors.push('tenantId is required');
  if (!config.issuer) errors.push('issuer is required');
  if (!config.clientId) errors.push('clientId is required');
  
  // Validate issuer URL
  try {
    new URL(config.issuer);
  } catch {
    errors.push('issuer must be a valid URL');
  }
  
  // Validate scopes
  if (!config.scopes || config.scopes.length === 0) {
    errors.push('At least one scope is required');
  } else if (!config.scopes.includes('openid')) {
    errors.push('openid scope is required for OIDC');
  }
  
  // Validate timeout values
  if (config.sessionTimeout && config.sessionTimeout <= 0) {
    errors.push('sessionTimeout must be positive');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Health check for OIDC providers
 */
export async function HEAD(request: NextRequest) {
  try {
    const tenants = oidcProviderManager.getConfiguredTenants();
    const summary = oidcProviderManager.getProvidersSummary();
    
    const healthStatus = {
      oidcEnabled: process.env.OIDC_ENABLED === 'true',
      configuredTenants: tenants.length,
      totalActiveSessions: Object.values(summary).reduce(
        (total: number, tenant: any) => total + (tenant.activeSessionsCount || 0),
        0
      ),
    };
    
    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json(
      { error: 'OIDC health check failed' },
      { status: 500 }
    );
  }
}

/**
 * Example environment configuration:
 * 
 * # Enable OIDC SSO
 * OIDC_ENABLED=true
 * 
 * # Default tenant configuration
 * OIDC_ISSUER=https://login.microsoftonline.com/tenant-id/v2.0
 * OIDC_CLIENT_ID=your-application-client-id
 * OIDC_CLIENT_SECRET=your-application-client-secret
 * OIDC_SCOPES=openid,profile,email,offline_access
 * OIDC_USE_PKCE=true
 * OIDC_SESSION_TIMEOUT=480
 * OIDC_REFRESH_TOKENS=true
 * 
 * # Claims mapping
 * OIDC_CLAIM_EMAIL=email
 * OIDC_CLAIM_FIRST_NAME=given_name
 * OIDC_CLAIM_LAST_NAME=family_name
 * OIDC_CLAIM_DISPLAY_NAME=name
 * OIDC_CLAIM_GROUPS=groups
 * OIDC_CLAIM_ROLES=roles
 * 
 * # Role mapping (JSON format)
 * OIDC_ROLE_MAPPING={"admin":"ADMIN","users":"USER","lms-admin":"ADMIN"}
 * 
 * # Custom parameters (JSON format)
 * OIDC_CUSTOM_PARAMS={"prompt":"select_account","domain_hint":"company.com"}
 * 
 * # Per-tenant configuration (for multi-tenant setup)
 * OIDC_COMPANY_CORP_ISSUER=https://company-corp.okta.com
 * OIDC_COMPANY_CORP_CLIENT_ID=okta-client-id
 * OIDC_COMPANY_CORP_CLIENT_SECRET=okta-client-secret
 */