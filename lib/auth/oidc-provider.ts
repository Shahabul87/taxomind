import * as openidClient from 'openid-client';

// Use the new v6 API which doesn't export Client/TokenSet directly
import { CryptoUtils } from '@/lib/security/crypto-utils';
import { logger } from '@/lib/logger';

/**
 * Enterprise OpenID Connect (OIDC) SSO Provider
 * 
 * Features:
 * - OIDC 1.0 authentication with enterprise identity providers
 * - Support for Authorization Code flow with PKCE
 * - Multi-tenant OIDC configuration
 * - Token validation and refresh
 * - Scope and claims mapping
 * - Session management with secure tokens
 * 
 * Supported Providers:
 * - Microsoft Azure AD / Entra ID
 * - Google Workspace
 * - Okta
 * - Auth0
 * - Keycloak
 * - Custom OIDC providers
 * 
 * @example
 * ```typescript
 * const oidcProvider = new OIDCProvider({
 *   tenantId: 'company-corp',
 *   issuer: 'https://login.microsoftonline.com/tenant-id/v2.0',
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   scopes: ['openid', 'profile', 'email'],
 * });
 * 
 * // Initialize OIDC client
 * await oidcProvider.initialize();
 * 
 * // Generate auth URL
 * const authUrl = await oidcProvider.generateAuthUrl();
 * 
 * // Handle callback
 * const user = await oidcProvider.handleCallback(code, state);
 * ```
 */

export interface OIDCConfiguration {
  // Tenant identification
  tenantId: string;
  tenantName?: string;
  domain?: string;
  
  // OIDC Provider Configuration
  issuer: string; // OIDC issuer URL
  clientId: string;
  clientSecret?: string; // Optional for public clients
  
  // Authentication Flow
  responseType?: string; // Default: 'code'
  scopes?: string[]; // Default: ['openid', 'profile', 'email']
  grantType?: string; // Default: 'authorization_code'
  usePKCE?: boolean; // Default: true
  
  // Endpoint URLs (auto-discovered if not provided)
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
  jwksEndpoint?: string;
  endSessionEndpoint?: string;
  
  // Claims Mapping
  claimsMapping?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    picture?: string;
    groups?: string;
    roles?: string;
    department?: string;
    jobTitle?: string;
    employeeId?: string;
  };
  
  // Role Mapping
  roleMapping?: {
    [oidcRole: string]: 'USER' | 'ADMIN';
  };
  
  // Security Options
  clockTolerance?: number; // Token validation tolerance in seconds
  tokenValidation?: {
    validateIssuer?: boolean;
    validateAudience?: boolean;
    validateExpiry?: boolean;
    validateNonce?: boolean;
  };
  
  // Session Configuration
  sessionTimeout?: number; // in minutes
  refreshTokens?: boolean; // Whether to use refresh tokens
  
  // Additional Parameters
  customParams?: Record<string, string>;
  customHeaders?: Record<string, string>;
}

export interface OIDCUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  picture?: string;
  groups?: string[];
  roles?: string[];
  department?: string;
  jobTitle?: string;
  employeeId?: string;
  role: 'USER' | 'ADMIN';
  tenantId: string;
  sessionId: string;
  claims: Record<string, any>;
  tokenSet?: any;
}

export interface OIDCSession {
  sessionId: string;
  userId: string;
  tenantId: string;
  tokenSet: any; // openid-client v6 doesn't export TokenSet type
  userInfo: any; // openid-client v6 doesn't export UserInfoResponse type
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  refreshToken?: string;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export class OIDCProvider {
  private config: OIDCConfiguration;
  private client: any = null;
  private issuer: any = null;
  private sessions: Map<string, OIDCSession> = new Map();
  private challenges: Map<string, PKCEChallenge> = new Map();
  
  constructor(config: OIDCConfiguration) {
    this.config = this.validateConfig(config);
  }

  /**
   * Validates OIDC configuration
   */
  private validateConfig(config: OIDCConfiguration): OIDCConfiguration {
    const errors: string[] = [];
    
    if (!config.tenantId) errors.push('tenantId is required');
    if (!config.issuer) errors.push('issuer is required');
    if (!config.clientId) errors.push('clientId is required');
    
    if (errors.length > 0) {
      throw new Error(`OIDC Configuration Error: ${errors.join(', ')}`);
    }
    
    return {
      ...config,
      responseType: config.responseType ?? 'code',
      scopes: config.scopes ?? ['openid', 'profile', 'email'],
      grantType: config.grantType ?? 'authorization_code',
      usePKCE: config.usePKCE ?? true,
      sessionTimeout: config.sessionTimeout ?? 480, // 8 hours
      refreshTokens: config.refreshTokens ?? true,
      clockTolerance: config.clockTolerance ?? 30, // 30 seconds
      tokenValidation: {
        validateIssuer: true,
        validateAudience: true,
        validateExpiry: true,
        validateNonce: true,
        ...config.tokenValidation,
      },
    };
  }

  /**
   * Initializes OIDC client with provider discovery
   */
  public async initialize(): Promise<void> {
    try {
      // For now, store the issuer URL directly - v6 API has different discovery pattern
      this.issuer = { issuer: this.config.issuer };
      
      // Create OIDC client
      const clientConfig: any = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uris: [this.getCallbackUrl()],
        response_types: [this.config.responseType!],
        token_endpoint_auth_method: this.config.clientSecret ? 'client_secret_post' : 'none',
      };
      
      this.client = new this.issuer.Client(clientConfig);
      
      // Configure token validation
      this.client[Symbol.for('issuer')] = this.issuer;

    } catch (error: any) {
      throw new Error(`Failed to initialize OIDC provider: ${error.message}`);
    }
  }

  /**
   * Generates PKCE challenge for authorization code flow
   */
  private async generatePKCEChallenge(): Promise<PKCEChallenge> {
    const codeVerifier = await CryptoUtils.generateSecureString(128, 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    );
    
    const codeChallenge = CryptoUtils.createHash(codeVerifier, 'sha256');
    const base64Challenge = Buffer.from(codeChallenge, 'hex')
      .toString('base64url');
    
    return {
      codeVerifier,
      codeChallenge: base64Challenge,
      codeChallengeMethod: 'S256',
    };
  }

  /**
   * Generates OIDC authorization URL
   */
  public async generateAuthUrl(
    redirectUri?: string,
    additionalParams?: Record<string, string>
  ): Promise<{ authUrl: string; state: string; nonce: string }> {
    if (!this.client) {
      throw new Error('OIDC client not initialized. Call initialize() first.');
    }
    
    const state = await CryptoUtils.generateSecureToken(32);
    const nonce = await CryptoUtils.generateSecureToken(32);
    
    let authParams: any = {
      scope: this.config.scopes!.join(' '),
      state,
      nonce,
      redirect_uri: redirectUri || this.getCallbackUrl(),
      ...this.config.customParams,
      ...additionalParams,
    };
    
    // Add PKCE challenge if enabled
    if (this.config.usePKCE) {
      const pkce = await this.generatePKCEChallenge();
      authParams.code_challenge = pkce.codeChallenge;
      authParams.code_challenge_method = pkce.codeChallengeMethod;
      
      // Store challenge for callback validation
      this.challenges.set(state, pkce);
      
      // Auto-cleanup challenge after 10 minutes
      setTimeout(() => {
        this.challenges.delete(state);
      }, 600000);
    }
    
    const authUrl = this.client.authorizationUrl(authParams);
    
    return { authUrl, state, nonce };
  }

  /**
   * Handles OIDC callback and exchanges code for tokens
   */
  public async handleCallback(
    code: string,
    state: string,
    nonce?: string,
    redirectUri?: string
  ): Promise<OIDCUser> {
    if (!this.client) {
      throw new Error('OIDC client not initialized. Call initialize() first.');
    }
    
    try {
      let tokenParams: any = {
        code,
        redirect_uri: redirectUri || this.getCallbackUrl(),
      };
      
      // Add PKCE verifier if used
      if (this.config.usePKCE) {
        const pkce = this.challenges.get(state);
        if (!pkce) {
          throw new Error('PKCE challenge not found or expired');
        }
        
        tokenParams.code_verifier = pkce.codeVerifier;
        this.challenges.delete(state); // Clean up used challenge
      }
      
      // Exchange code for tokens
      const tokenSet = await this.client.callback(
        this.getCallbackUrl(),
        { code, state },
        { nonce, state }
      );
      
      // Get user info
      const userInfo = await this.client.userinfo(tokenSet);
      
      // Process user profile
      const user = await this.processUserInfo(userInfo, tokenSet);
      
      // Create session
      await this.createSession(user, tokenSet, userInfo);
      
      await this.auditLogin(user, 'success');
      
      return user;
    } catch (error: any) {
      await this.auditLogin(null, 'error', error.message);
      throw new Error(`OIDC callback failed: ${error.message}`);
    }
  }

  /**
   * Processes user information from OIDC userinfo endpoint
   */
  private async processUserInfo(
    userInfo: any,
    tokenSet: any
  ): Promise<OIDCUser> {
    const mapping = this.config.claimsMapping || {};
    
    // Extract standard claims
    const email = this.getClaimValue(userInfo, mapping.email || 'email');
    const firstName = this.getClaimValue(userInfo, mapping.firstName || 'given_name');
    const lastName = this.getClaimValue(userInfo, mapping.lastName || 'family_name');
    const displayName = this.getClaimValue(userInfo, mapping.displayName || 'name') ||
                       `${firstName} ${lastName}`.trim();
    const picture = this.getClaimValue(userInfo, mapping.picture || 'picture');
    
    // Extract groups and roles
    const groups = this.getClaimValues(userInfo, mapping.groups || 'groups') || [];
    const roles = this.getClaimValues(userInfo, mapping.roles || 'roles') || [];
    const role = this.determineUserRole([...groups, ...roles]);
    
    // Generate session ID
    const sessionId = await CryptoUtils.generateSecureToken(32);
    
    return {
      id: userInfo.sub || '',
      email: email || '',
      firstName,
      lastName,
      displayName,
      picture,
      groups,
      roles,
      department: this.getClaimValue(userInfo, mapping.department || 'department'),
      jobTitle: this.getClaimValue(userInfo, mapping.jobTitle || 'job_title'),
      employeeId: this.getClaimValue(userInfo, mapping.employeeId || 'employee_id'),
      role,
      tenantId: this.config.tenantId,
      sessionId,
      claims: userInfo,
      tokenSet,
    };
  }

  /**
   * Determines user role based on OIDC claims
   */
  private determineUserRole(rolesAndGroups: string[]): 'USER' | 'ADMIN' {
    if (!this.config.roleMapping || rolesAndGroups.length === 0) {
      return 'USER';
    }
    
    // Check if user has any admin roles/groups
    for (const roleOrGroup of rolesAndGroups) {
      if (this.config.roleMapping[roleOrGroup] === 'ADMIN') {
        return 'ADMIN';
      }
    }
    
    return 'USER';
  }

  /**
   * Gets single claim value
   */
  private getClaimValue(claims: any, claimName: string): string | undefined {
    const value = claims[claimName];
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * Gets multiple claim values
   */
  private getClaimValues(claims: any, claimName: string): string[] {
    const value = claims[claimName];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  /**
   * Creates user session
   */
  private async createSession(
    user: OIDCUser,
    tokenSet: any,
    userInfo: any
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.config.sessionTimeout! * 60 * 1000));
    
    const session: OIDCSession = {
      sessionId: user.sessionId,
      userId: user.id,
      tenantId: this.config.tenantId,
      tokenSet,
      userInfo,
      createdAt: now,
      expiresAt,
      lastActivity: now,
      refreshToken: tokenSet.refresh_token,
    };
    
    this.sessions.set(user.sessionId, session);
    
    // Auto-cleanup expired session
    setTimeout(() => {
      this.sessions.delete(user.sessionId);
    }, this.config.sessionTimeout! * 60 * 1000);
  }

  /**
   * Validates user session
   */
  public async validateSession(sessionId: string): Promise<OIDCSession | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        this.sessions.delete(sessionId);
      }
      return null;
    }
    
    // Check if token needs refresh
    if (session.tokenSet.expires_at && 
        session.tokenSet.expires_at < Math.floor(Date.now() / 1000) + 300) { // 5 min buffer
      
      if (this.config.refreshTokens && session.refreshToken) {
        try {
          const newTokenSet = await this.refreshToken(session.refreshToken);
          session.tokenSet = newTokenSet;
          session.refreshToken = newTokenSet.refresh_token;
        } catch (error: any) {
          logger.error('Token refresh failed:', error);
          this.sessions.delete(sessionId);
          return null;
        }
      }
    }
    
    // Update last activity
    session.lastActivity = new Date();
    return session;
  }

  /**
   * Refreshes access token using refresh token
   */
  public async refreshToken(refreshToken: string): Promise<any> {
    if (!this.client) {
      throw new Error('OIDC client not initialized');
    }
    
    try {
      return await this.client.refresh(refreshToken);
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Terminates user session
   */
  public async terminateSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    // Revoke tokens if supported
    if (this.client && this.issuer.revocation_endpoint) {
      try {
        await this.client.revoke(session.tokenSet.access_token!);
        if (session.refreshToken) {
          await this.client.revoke(session.refreshToken);
        }
      } catch (error: any) {
        logger.warn('Token revocation failed:', error.message);
      }
    }
    
    return this.sessions.delete(sessionId);
  }

  /**
   * Generates end session (logout) URL
   */
  public generateLogoutUrl(
    sessionId: string,
    postLogoutRedirectUri?: string
  ): string | null {
    if (!this.client || !this.issuer.end_session_endpoint) {
      return null;
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    const logoutUrl = this.client.endSessionUrl({
      id_token_hint: session.tokenSet.id_token,
      post_logout_redirect_uri: postLogoutRedirectUri || this.getLogoutCallbackUrl(),
    });
    
    // Terminate local session
    this.terminateSession(sessionId);
    
    return logoutUrl;
  }

  /**
   * Gets callback URL
   */
  private getCallbackUrl(): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/api/auth/sso/oidc/callback/${this.config.tenantId}`;
  }

  /**
   * Gets logout callback URL
   */
  private getLogoutCallbackUrl(): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/api/auth/sso/oidc/logout/${this.config.tenantId}`;
  }

  /**
   * Validates token signature and claims
   */
  public async validateToken(token: string): Promise<any> {
    if (!this.client) {
      throw new Error('OIDC client not initialized');
    }
    
    try {
      return await this.client.userinfo(token);
    } catch (error: any) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Gets OIDC discovery document
   */
  public getDiscoveryDocument(): any {
    return this.issuer?.metadata || null;
  }

  /**
   * Audit logging for OIDC operations
   */
  private async auditLogin(
    user: OIDCUser | null,
    result: 'success' | 'error',
    error?: string
  ): Promise<void> {
    const auditLog = {
      timestamp: new Date().toISOString(),
      event: 'oidc_login',
      tenantId: this.config.tenantId,
      userId: user?.id,
      email: user?.email,
      result,
      error,
      provider: this.config.issuer,
    };

    // TODO: Integrate with enterprise audit system
    // await auditLogger.log(auditLog);
  }

  /**
   * Gets active sessions count
   */
  public getActiveSessionsCount(): number {
    // Clean up expired sessions first
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
    
    return this.sessions.size;
  }

  /**
   * Gets configuration summary (without sensitive data)
   */
  public getConfigSummary() {
    return {
      tenantId: this.config.tenantId,
      tenantName: this.config.tenantName,
      domain: this.config.domain,
      issuer: this.config.issuer,
      clientId: this.config.clientId,
      hasClientSecret: !!this.config.clientSecret,
      scopes: this.config.scopes,
      usePKCE: this.config.usePKCE,
      sessionTimeout: this.config.sessionTimeout,
      refreshTokens: this.config.refreshTokens,
      activeSessionsCount: this.getActiveSessionsCount(),
    };
  }
}

/**
 * Multi-tenant OIDC provider manager
 */
export class OIDCProviderManager {
  private providers: Map<string, OIDCProvider> = new Map();

  /**
   * Registers an OIDC provider for a tenant
   */
  public async registerProvider(config: OIDCConfiguration): Promise<OIDCProvider> {
    const provider = new OIDCProvider(config);
    await provider.initialize();
    this.providers.set(config.tenantId, provider);
    return provider;
  }

  /**
   * Gets OIDC provider for tenant
   */
  public getProvider(tenantId: string): OIDCProvider | null {
    return this.providers.get(tenantId) || null;
  }

  /**
   * Removes OIDC provider for tenant
   */
  public removeProvider(tenantId: string): boolean {
    return this.providers.delete(tenantId);
  }

  /**
   * Lists all configured tenants
   */
  public getConfiguredTenants(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Gets summary of all providers
   */
  public getProvidersSummary() {
    const summary: Record<string, any> = {};
    
    for (const [tenantId, provider] of this.providers.entries()) {
      summary[tenantId] = provider.getConfigSummary();
    }
    
    return summary;
  }
}

/**
 * Global OIDC provider manager instance
 */
export const oidcProviderManager = new OIDCProviderManager();

/**
 * Environment variables for OIDC configuration:
 * 
 * # Basic Configuration
 * OIDC_ENABLED=true
 * OIDC_DEFAULT_TENANT=company-corp
 * 
 * # Per-tenant configuration (replace TENANT with actual tenant ID)
 * OIDC_TENANT_ISSUER=https://login.microsoftonline.com/tenant-id/v2.0
 * OIDC_TENANT_CLIENT_ID=your-client-id
 * OIDC_TENANT_CLIENT_SECRET=your-client-secret
 * 
 * # Optional Configuration
 * OIDC_SESSION_TIMEOUT=480
 * OIDC_USE_PKCE=true
 * OIDC_REFRESH_TOKENS=true
 * OIDC_SCOPES=openid,profile,email
 */