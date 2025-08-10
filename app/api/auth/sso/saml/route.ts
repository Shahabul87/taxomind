import { NextRequest, NextResponse } from 'next/server';
import { samlProviderManager, type SAMLConfiguration } from '@/lib/auth/saml-provider';
import { db } from '@/lib/db';
import { signIn } from '@/auth';
import { logger } from '@/lib/logger';

/**
 * SAML SSO Authentication Endpoints
 * 
 * Handles SAML 2.0 authentication flow:
 * 1. POST /api/auth/sso/saml - Initiate SAML authentication
 * 2. GET /api/auth/sso/saml/metadata - Get SAML metadata
 * 3. GET /api/auth/sso/saml/tenants - List configured tenants
 */

/**
 * POST /api/auth/sso/saml - Initiate SAML Authentication
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, relayState } = await request.json();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }
    
    // Get or create SAML provider for tenant
    let provider = samlProviderManager.getProvider(tenantId);
    
    if (!provider) {
      // Try to load tenant configuration from database or environment
      const config = await loadTenantSAMLConfig(tenantId);
      if (!config) {
        return NextResponse.json(
          { error: 'SAML configuration not found for tenant' },
          { status: 404 }
        );
      }
      
      provider = samlProviderManager.registerProvider(config);
    }
    
    // Generate authentication URL
    const authUrl = await provider.generateAuthUrl(relayState);
    
    // Log authentication attempt

    return NextResponse.json({
      success: true,
      authUrl,
      tenantId,
    });
    
  } catch (error) {
    logger.error('[SAML] Authentication initiation failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to initiate SAML authentication', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/sso/saml/metadata - Get SAML Metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant');
    
    if (!tenantId) {
      // Return list of configured tenants
      const tenants = samlProviderManager.getConfiguredTenants();
      const summary = samlProviderManager.getProvidersSummary();
      
      return NextResponse.json({
        success: true,
        tenants,
        summary,
      });
    }
    
    // Get SAML provider for tenant
    const provider = samlProviderManager.getProvider(tenantId);
    if (!provider) {
      return NextResponse.json(
        { error: 'SAML configuration not found for tenant' },
        { status: 404 }
      );
    }
    
    // Return SAML metadata
    const metadata = provider.getMetadata();
    
    return new NextResponse(metadata, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${tenantId}-saml-metadata.xml"`,
      },
    });
    
  } catch (error) {
    logger.error('[SAML] Metadata retrieval failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve SAML metadata', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Loads SAML configuration for a tenant
 */
async function loadTenantSAMLConfig(tenantId: string): Promise<SAMLConfiguration | null> {
  try {
    // First, try to load from database
    const dbConfig = await loadSAMLConfigFromDatabase(tenantId);
    if (dbConfig) {
      return dbConfig;
    }
    
    // Fallback to environment variables
    const envConfig = loadSAMLConfigFromEnvironment(tenantId);
    if (envConfig) {
      return envConfig;
    }
    
    return null;
  } catch (error) {
    logger.error(`[SAML] Failed to load config for tenant ${tenantId}:`, error);
    return null;
  }
}

/**
 * Loads SAML configuration from database
 */
async function loadSAMLConfigFromDatabase(tenantId: string): Promise<SAMLConfiguration | null> {
  try {
    // This would query your tenant configuration table
    // For now, we'll return null and use environment variables
    
    // Example implementation:
    // const tenant = await db.tenant.findUnique({
    //   where: { id: tenantId },
    //   include: { samlConfig: true }
    // });
    // 
    // if (!tenant?.samlConfig) {
    //   return null;
    // }
    // 
    // return {
    //   tenantId,
    //   tenantName: tenant.name,
    //   entryPoint: tenant.samlConfig.entryPoint,
    //   issuer: tenant.samlConfig.issuer,
    //   cert: tenant.samlConfig.cert,
    //   // ... other config
    // };
    
    return null;
  } catch (error) {
    logger.error('[SAML] Database config load failed:', error);
    return null;
  }
}

/**
 * Loads SAML configuration from environment variables
 */
function loadSAMLConfigFromEnvironment(tenantId: string): SAMLConfiguration | null {
  const envPrefix = `SAML_${tenantId.toUpperCase().replace('-', '_')}`;
  
  const entryPoint = process.env[`${envPrefix}_ENTRY_POINT`] || process.env.SAML_ENTRY_POINT;
  const issuer = process.env[`${envPrefix}_ISSUER`] || process.env.SAML_ISSUER;
  const cert = process.env[`${envPrefix}_CERT`] || process.env.SAML_CERT;
  
  if (!entryPoint || !issuer || !cert) {
    return null;
  }
  
  return {
    tenantId,
    tenantName: process.env[`${envPrefix}_NAME`],
    domain: process.env[`${envPrefix}_DOMAIN`],
    entryPoint,
    issuer,
    cert,
    logoutUrl: process.env[`${envPrefix}_LOGOUT_URL`],
    privateKey: process.env[`${envPrefix}_PRIVATE_KEY`],
    wantAssertionsSigned: process.env[`${envPrefix}_WANT_ASSERTIONS_SIGNED`] !== 'false',
    sessionTimeout: parseInt(process.env[`${envPrefix}_SESSION_TIMEOUT`] || '480'),
    attributeMapping: {
      email: process.env[`${envPrefix}_ATTR_EMAIL`] || 'email',
      firstName: process.env[`${envPrefix}_ATTR_FIRST_NAME`] || 'firstName',
      lastName: process.env[`${envPrefix}_ATTR_LAST_NAME`] || 'lastName',
      displayName: process.env[`${envPrefix}_ATTR_DISPLAY_NAME`] || 'displayName',
      groups: process.env[`${envPrefix}_ATTR_GROUPS`] || 'groups',
    },
    roleMapping: parseRoleMapping(process.env[`${envPrefix}_ROLE_MAPPING`]),
  };
}

/**
 * Parses role mapping from environment variable
 */
function parseRoleMapping(mappingString?: string): Record<string, 'USER' | 'ADMIN'> | undefined {
  if (!mappingString) return undefined;
  
  try {
    return JSON.parse(mappingString);
  } catch (error) {
    logger.warn('[SAML] Failed to parse role mapping:', error);
    return undefined;
  }
}

/**
 * Validates SAML configuration
 */
function validateSAMLConfig(config: SAMLConfiguration): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.tenantId) errors.push('tenantId is required');
  if (!config.entryPoint) errors.push('entryPoint is required');
  if (!config.issuer) errors.push('issuer is required');
  if (!config.cert) errors.push('cert is required');
  
  // Validate URLs
  try {
    new URL(config.entryPoint);
  } catch {
    errors.push('entryPoint must be a valid URL');
  }
  
  if (config.logoutUrl) {
    try {
      new URL(config.logoutUrl);
    } catch {
      errors.push('logoutUrl must be a valid URL');
    }
  }
  
  // Validate certificate format
  if (config.cert && !config.cert.includes('BEGIN CERTIFICATE')) {
    errors.push('cert must be a valid X.509 certificate');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Health check for SAML providers
 */
export async function HEAD(request: NextRequest) {
  try {
    const tenants = samlProviderManager.getConfiguredTenants();
    const summary = samlProviderManager.getProvidersSummary();
    
    const healthStatus = {
      samlEnabled: process.env.SAML_ENABLED === 'true',
      configuredTenants: tenants.length,
      totalActiveSessions: Object.values(summary).reduce(
        (total: number, tenant: any) => total + (tenant.activeSessionsCount || 0),
        0
      ),
    };
    
    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json(
      { error: 'SAML health check failed' },
      { status: 500 }
    );
  }
}

/**
 * Example environment configuration:
 * 
 * # Enable SAML SSO
 * SAML_ENABLED=true
 * 
 * # Default tenant configuration
 * SAML_ENTRY_POINT=https://idp.company.com/saml/sso
 * SAML_ISSUER=urn:company:taxomind:saml
 * SAML_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
 * SAML_LOGOUT_URL=https://idp.company.com/saml/slo
 * SAML_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
 * SAML_SESSION_TIMEOUT=480
 * 
 * # Attribute mapping
 * SAML_ATTR_EMAIL=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress
 * SAML_ATTR_FIRST_NAME=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname
 * SAML_ATTR_LAST_NAME=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname
 * SAML_ATTR_GROUPS=http://schemas.microsoft.com/ws/2008/06/identity/claims/groups
 * 
 * # Role mapping (JSON format)
 * SAML_ROLE_MAPPING={"Domain Admins":"ADMIN","LMS Admins":"ADMIN","Users":"USER"}
 * 
 * # Per-tenant configuration (for multi-tenant setup)
 * SAML_COMPANY_CORP_ENTRY_POINT=https://company-corp.okta.com/app/taxomind/sso/saml
 * SAML_COMPANY_CORP_ISSUER=http://www.okta.com/exk1234567890
 * SAML_COMPANY_CORP_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
 */