/**
 * Enterprise SAML 2.0 Authentication Provider
 * Implements SAML SSO for enterprise authentication
 * @module lib/auth/saml-provider
 */

import { Strategy as SamlStrategy, Profile, VerifyWithRequest } from '@node-saml/passport-saml';
import { db } from '@/lib/db';
import crypto from 'crypto';
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
      entryPoint: process.env[`SAML_${organizationId}_ENTRY_POINT`] || process.env.SAML_ENTRY_POINT || '',
      issuer: process.env[`SAML_${organizationId}_ISSUER`] || process.env.SAML_ISSUER || 'taxomind-lms',
      callbackUrl: process.env[`SAML_${organizationId}_CALLBACK_URL`] || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/saml/callback`,
      cert: process.env[`SAML_${organizationId}_CERT`] || process.env.SAML_CERT || '',
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
        const samlProfile = this.mapSAMLProfile(profile);
        const user = await this.findOrCreateUser(samlProfile);
        
        // Log successful authentication
        await this.logAuthentication(user.id, 'SUCCESS', samlProfile);
        
        return done(null, user);
      } catch (error) {
        // Log failed authentication
        await this.logAuthentication(null, 'FAILURE', { error: error.message });
        return done(error);
      }
    };

    return new SamlStrategy(
      {
        ...this.config,
        passReqToCallback: true,
      },
      verify
    );
  }

  /**
   * Map SAML profile to internal user profile
   */
  private mapSAMLProfile(profile: Profile): SAMLUserProfile {
    return {
      id: profile.nameID || profile.id || '',
      email: profile.email || 
             profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
             profile.mail || '',
      name: profile.displayName || 
            profile['http://schemas.microsoft.com/identity/claims/displayname'] || '',
      firstName: profile.givenName || 
                 profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || '',
      lastName: profile.surname || 
                profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || '',
      department: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department'] || '',
      organization: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/organization'] || '',
      role: profile['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'USER',
      groups: profile['http://schemas.microsoft.com/ws/2008/06/identity/claims/groups'] || [],
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
      user = await db.user.create({
        data: {
          email: profile.email,
          name: profile.name || `${profile.firstName} ${profile.lastName}`.trim(),
          role: this.mapRole(profile.role),
          emailVerified: new Date(), // SAML users are pre-verified
          // Store SAML metadata
          metadata: {
            saml: {
              nameId: profile.id,
              department: profile.department,
              organization: profile.organization,
              groups: profile.groups,
            },
          },
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
      // Update existing user's SAML metadata
      await db.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...user.metadata as any,
            saml: {
              nameId: profile.id,
              department: profile.department,
              organization: profile.organization,
              groups: profile.groups,
              lastLogin: new Date(),
            },
          },
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
      await db.authAudit.create({
        data: {
          userId,
          provider: 'SAML',
          action: 'LOGIN',
          status,
          ipAddress: details.ipAddress || 'unknown',
          userAgent: details.userAgent || 'unknown',
          metadata: details,
        },
      });
    } catch (error) {
      logger.error('Failed to log authentication:', error);
    }
  }

  /**
   * Generate SAML login URL
   */
  public async generateLoginUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.strategy.getAuthorizeUrl(
        {} as any,
        {} as any,
        (err, url) => {
          if (err) reject(err);
          else resolve(url);
        }
      );
    });
  }

  /**
   * Generate SAML logout URL
   */
  public async generateLogoutUrl(user: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.strategy.logout(
        { user } as any,
        (err, url) => {
          if (err) reject(err);
          else resolve(url);
        }
      );
    });
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
  } catch (error) {
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
  } catch (error) {
    return {
      success: false,
      message: 'SAML connection failed',
      details: { error: error.message },
    };
  }
}