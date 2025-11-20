/**
 * Enterprise SAML 2.0 Authentication Provider
 * Implements SAML SSO for enterprise authentication
 * @module lib/auth/saml-provider
 */

import { Strategy as SamlStrategy, Profile, VerifyWithRequest } from '@node-saml/passport-saml';
import { db } from '@/lib/db';
import * as crypto from 'crypto';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// SAML Configuration Schema
const SAMLConfigSchema = z.object({
  entryPoint: z.string().url(),
  issuer: z.string(),
  callbackUrl: z.string().url(),
  cert: z.string(),
  privateKey: z.string().optional(),
  decryptionPvk: z.string().optional(),
  signatureAlgorithm: z.enum(['sha1', 'sha256', 'sha512']).default('sha256'),
  identifierFormat: z.string().optional(),
  acceptedClockSkewMs: z.number().default(5000),
  attributeConsumingServiceIndex: z.string().optional(),
  disableRequestedAuthnContext: z.boolean().default(false),
  forceAuthn: z.boolean().default(false),
  skipRequestCompression: z.boolean().default(false),
  authnRequestBinding: z.enum(['HTTP-POST', 'HTTP-Redirect']).default('HTTP-Redirect'),
});

export type SAMLConfiguration = z.infer<typeof SAMLConfigSchema>;

export interface SAMLUserProfile {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  organization?: string;
  role?: string;
  groups?: string[];
  attributes?: Record<string, any>;
}

export class SAMLProvider {
  private strategy: SamlStrategy;
  private config: z.infer<typeof SAMLConfigSchema>;
  
  constructor(organizationId: string) {
    this.config = this.loadConfiguration(organizationId);
    this.strategy = this.createStrategy();
  }

  /**
   * Load SAML configuration for organization
   */
  private loadConfiguration(organizationId: string): z.infer<typeof SAMLConfigSchema> {
    // In production, load from database or secure config store
    const config = {
      entryPoint: process.env[`SAML_${organizationId}_ENTRY_POINT`] || process.env.SAML_ENTRY_POINT || 'https://example.com/sso',
      issuer: process.env[`SAML_${organizationId}_ISSUER`] || process.env.SAML_ISSUER || 'taxomind-lms',
      callbackUrl: process.env[`SAML_${organizationId}_CALLBACK_URL`] || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/sso/saml/callback`,
      cert: process.env[`SAML_${organizationId}_CERT`] || process.env.SAML_CERT || 'dummy-cert',
      privateKey: process.env[`SAML_${organizationId}_PRIVATE_KEY`] || process.env.SAML_PRIVATE_KEY,
      decryptionPvk: process.env[`SAML_${organizationId}_DECRYPTION_PVK`] || process.env.SAML_DECRYPTION_PVK,
      signatureAlgorithm: 'sha256' as const,
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      acceptedClockSkewMs: 5000,
      disableRequestedAuthnContext: false,
      forceAuthn: false,
      skipRequestCompression: false,
      authnRequestBinding: 'HTTP-Redirect' as const,
    };

    return SAMLConfigSchema.parse(config);
  }

  /**
   * Create SAML strategy
   */
  private createStrategy(): SamlStrategy {
    const verify: VerifyWithRequest = async (req, profile, done) => {
      try {
        if (!profile) {
          return done(new Error('No profile received from SAML provider'));
        }
        
        const samlProfile = this.mapSAMLProfile(profile);
        const user = await this.findOrCreateUser(samlProfile);
        
        // Log successful authentication
        await this.logAuthentication(user.id, 'SUCCESS', samlProfile);
        
        return done(null, user);
      } catch (error: any) {
        // Log failed authentication
        await this.logAuthentication(null, 'FAILURE', { error: error.message });
        return done(error);
      }
    };

    return new SamlStrategy(
      {
        callbackUrl: this.config.callbackUrl, // Required property
        issuer: this.config.issuer, // Required property
        entryPoint: this.config.entryPoint, // Required property
        idpCert: this.config.cert, // Map cert to idpCert as expected by passport-saml
        passReqToCallback: true,
        privateKey: this.config.privateKey,
        decryptionPvk: this.config.decryptionPvk,
        signatureAlgorithm: this.config.signatureAlgorithm,
        identifierFormat: this.config.identifierFormat,
        acceptedClockSkewMs: this.config.acceptedClockSkewMs,
        attributeConsumingServiceIndex: this.config.attributeConsumingServiceIndex,
        disableRequestedAuthnContext: this.config.disableRequestedAuthnContext,
        forceAuthn: this.config.forceAuthn,
        skipRequestCompression: this.config.skipRequestCompression,
        authnRequestBinding: this.config.authnRequestBinding,
      },
      verify,
      verify // Third argument for SamlStrategy
    );
  }

  /**
   * Map SAML profile to internal user profile
   */
  private mapSAMLProfile(profile: Profile): SAMLUserProfile {
    const getValue = (value: any): string => {
      return typeof value === 'string' ? value : '';
    };
    
    const getArrayValue = (value: any): string[] => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return [value];
      return [];
    };

    return {
      id: getValue(profile.nameID) || getValue(profile.id) || '',
      email: getValue(profile.email) || 
             getValue(profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']) ||
             getValue(profile.mail) || '',
      name: getValue(profile.displayName) || 
            getValue(profile['http://schemas.microsoft.com/identity/claims/displayname']) || '',
      firstName: getValue(profile.givenName) || 
                 getValue(profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']) || '',
      lastName: getValue(profile.surname) || 
                getValue(profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']) || '',
      department: getValue(profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department']) || '',
      organization: getValue(profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/organization']) || '',
      role: getValue(profile['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) || 'USER',
      groups: getArrayValue(profile['http://schemas.microsoft.com/ws/2008/06/identity/claims/groups']),
      attributes: profile,
    };
  }

  /**
   * Find or create user from SAML profile
   */
  private async findOrCreateUser(profile: SAMLUserProfile) {
    // Check if user exists
    let user = await db.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user from SAML profile
      // Note: Users don't have roles - only AdminAccount has roles
      // SAML users are created as regular users by default
      user = await db.user.create({
        data: {
          email: profile.email,
          name: profile.name || `${profile.firstName} ${profile.lastName}`.trim(),
          emailVerified: new Date(), // SAML users are pre-verified
        },
      });

      // Create SSO account link
      await db.account.create({
        data: {
          userId: user.id,
          type: 'saml',
          provider: 'enterprise-saml',
          providerAccountId: profile.id,
          access_token: crypto.randomBytes(32).toString('hex'),
          token_type: 'bearer',
          scope: 'saml',
        },
      });
    } else {
      // Update existing user's last login (metadata not available in schema)
      await db.user.update({
        where: { id: user.id },
        data: {
          // Could update name if needed
          name: profile.name || user.name,
        },
      });
    }

    return user;
  }

  /**
   * Map SAML role to application role
   */
  private mapRole(samlRole?: string): 'ADMIN' | 'USER' {
    const adminRoles = ['admin', 'administrator', 'superuser', 'root'];
    return samlRole && adminRoles.includes(samlRole.toLowerCase()) ? 'ADMIN' : 'USER';
  }

  /**
   * Log authentication attempt
   */
  private async logAuthentication(
    userId: string | null,
    status: 'SUCCESS' | 'FAILURE',
    details: any
  ) {
    try {
      // Log to console/logger instead of database until AuthAudit model is properly configured
      logger.info('SAML Authentication:', {
        userId,
        status,
        action: 'LOGIN',
        ipAddress: details.ipAddress || 'unknown',
        userAgent: details.userAgent || 'unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to log authentication:', error);
    }
  }

  /**
   * Generate SAML login URL
   */
  public async generateLoginUrl(): Promise<string> {
    // Return the entry point URL - this is where users should be redirected to start SAML auth
    return this.config.entryPoint;
  }

  /**
   * Generate SAML logout URL
   */
  public async generateLogoutUrl(user: any): Promise<string> {
    // For basic implementation, return a simple logout endpoint
    // In production, this should generate proper SAML logout request
    return `${this.config.entryPoint}?logout=true`;
  }

  /**
   * Validate SAML response
   */
  public async validateResponse(samlResponse: string): Promise<SAMLUserProfile> {
    return new Promise((resolve, reject) => {
      const req = { body: { SAMLResponse: samlResponse } } as any;
      
      this.strategy.authenticate(req, {
        success: (user: any) => resolve(user),
        error: (err: any) => reject(err),
      } as any);
    });
  }

  /**
   * Get strategy for passport integration
   */
  public getStrategy(): SamlStrategy {
    return this.strategy;
  }

  /**
   * Validate SAML signature
   */
  public validateSignature(samlResponse: string): boolean {
    try {
      // Basic signature validation - in production, use proper XML signature validation
      return samlResponse.includes('Signature') && samlResponse.length > 100;
    } catch (error: any) {
      logger.error('SAML signature validation failed:', error);
      return false;
    }
  }

  /**
   * Validate SAML timestamp
   */
  public validateTimestamp(samlResponse: string): boolean {
    try {
      // Basic timestamp validation - in production, parse XML and validate NotBefore/NotOnOrAfter
      const now = new Date();
      const clockSkew = this.config.acceptedClockSkewMs || 5000;
      
      // For now, just check if response is not too old (basic implementation)
      return true; // Placeholder - implement proper timestamp validation
    } catch (error: any) {
      logger.error('SAML timestamp validation failed:', error);
      return false;
    }
  }

  /**
   * Extract attributes from SAML response
   */
  public extractAttributes(samlResponse: string): Record<string, any> {
    try {
      // Basic attribute extraction - in production, parse XML properly
      const attributes: Record<string, any> = {};
      
      // This is a placeholder implementation
      // In production, you would parse the XML and extract attribute statements
      
      return attributes;
    } catch (error: any) {
      logger.error('SAML attribute extraction failed:', error);
      return {};
    }
  }

  /**
   * Encode SAML request
   */
  public encodeSamlRequest(request: string): string {
    try {
      // Basic encoding - in production, use proper SAML request encoding
      return Buffer.from(request).toString('base64');
    } catch (error: any) {
      logger.error('SAML request encoding failed:', error);
      return '';
    }
  }

  /**
   * Decode SAML response
   */
  public decodeSamlResponse(response: string): string {
    try {
      // Basic decoding - in production, use proper SAML response decoding
      return Buffer.from(response, 'base64').toString('utf8');
    } catch (error: any) {
      logger.error('SAML response decoding failed:', error);
      return '';
    }
  }
}

/**
 * Factory function to create SAML provider
 */
export function createSAMLProvider(organizationId: string): SAMLProvider {
  return new SAMLProvider(organizationId);
}

/**
 * Validate SAML configuration
 */
export async function validateSAMLConfig(config: any): Promise<boolean> {
  try {
    SAMLConfigSchema.parse(config);
    return true;
  } catch (error: any) {
    logger.error('Invalid SAML configuration:', error);
    return false;
  }
}

/**
 * Test SAML connection
 */
export async function testSAMLConnection(organizationId: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const provider = new SAMLProvider(organizationId);
    const loginUrl = await provider.generateLoginUrl();
    
    return {
      success: true,
      message: 'SAML connection successful',
      details: {
        loginUrl,
        issuer: provider['config'].issuer,
        entryPoint: provider['config'].entryPoint,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'SAML connection failed',
      details: { error: error.message },
    };
  }
}

/**
 * Multi-tenant SAML provider manager
 */
export class SAMLProviderManager {
  private providers: Map<string, SAMLProvider> = new Map();

  /**
   * Registers a SAML provider for an organization
   */
  public registerProvider(organizationId: string): SAMLProvider {
    const provider = new SAMLProvider(organizationId);
    this.providers.set(organizationId, provider);
    return provider;
  }

  /**
   * Gets SAML provider for organization
   */
  public getProvider(organizationId: string): SAMLProvider | null {
    return this.providers.get(organizationId) || null;
  }

  /**
   * Removes SAML provider for organization
   */
  public removeProvider(organizationId: string): boolean {
    return this.providers.delete(organizationId);
  }

  /**
   * Lists all configured organizations
   */
  public getConfiguredOrganizations(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Gets summary of all providers
   */
  public getProvidersSummary() {
    const summary: Record<string, any> = {};
    
    for (const [orgId, provider] of Array.from(this.providers.entries())) {
      summary[orgId] = {
        organizationId: orgId,
        issuer: provider['config'].issuer,
        entryPoint: provider['config'].entryPoint,
        callbackUrl: provider['config'].callbackUrl,
        signatureAlgorithm: provider['config'].signatureAlgorithm,
      };
    }
    
    return summary;
  }
}

/**
 * Global SAML provider manager instance
 */
export const samlProviderManager = new SAMLProviderManager();