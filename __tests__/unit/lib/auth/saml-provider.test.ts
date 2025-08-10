import { SAMLProvider } from '@/lib/auth/saml-provider';
import crypto from 'crypto';

// Mock dependencies
jest.mock('crypto');
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('SAMLProvider', () => {
  let provider: SAMLProvider;
  const mockConfig = {
    entityId: 'http://localhost:3000/saml/metadata',
    ssoUrl: 'https://idp.example.com/sso',
    sloUrl: 'https://idp.example.com/slo',
    certificate: `-----BEGIN CERTIFICATE-----
MIICXjCCAcegAwIBAgIJAK...mockCertificate...
-----END CERTIFICATE-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w...mockPrivateKey...
-----END PRIVATE KEY-----`,
  };

  beforeEach(() => {
    provider = new SAMLProvider(mockConfig);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with valid configuration', () => {
      expect(provider).toBeDefined();
      expect(provider['config']).toEqual(mockConfig);
    });

    it('should throw error for missing required configuration', () => {
      expect(() => {
        new SAMLProvider({
          ...mockConfig,
          entityId: '',
        });
      }).toThrow('SAML configuration is incomplete');
    });

    it('should throw error for invalid certificate format', () => {
      expect(() => {
        new SAMLProvider({
          ...mockConfig,
          certificate: 'invalid-certificate',
        });
      }).toThrow('Invalid SAML certificate format');
    });

    it('should throw error for invalid private key format', () => {
      expect(() => {
        new SAMLProvider({
          ...mockConfig,
          privateKey: 'invalid-private-key',
        });
      }).toThrow('Invalid SAML private key format');
    });
  });

  describe('SAML Request Generation', () => {
    beforeEach(() => {
      // Mock crypto functions
      mockCrypto.randomUUID.mockReturnValue('mock-request-id-123');
      mockCrypto.createHash.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mock-hash'),
      } as any);
    });

    it('should generate SAML authentication request', () => {
      const relayState = 'http://localhost:3000/dashboard';
      
      const result = provider.generateAuthRequest(relayState);

      expect(result).toHaveProperty('samlRequest');
      expect(result).toHaveProperty('relayState', relayState);
      expect(result).toHaveProperty('requestId', 'mock-request-id-123');
      
      // Verify the SAML request contains required elements
      expect(result.samlRequest).toContain('AuthnRequest');
      expect(result.samlRequest).toContain(mockConfig.entityId);
      expect(result.samlRequest).toContain('mock-request-id-123');
    });

    it('should generate unique request IDs', () => {
      mockCrypto.randomUUID
        .mockReturnValueOnce('request-id-1')
        .mockReturnValueOnce('request-id-2');

      const request1 = provider.generateAuthRequest();
      const request2 = provider.generateAuthRequest();

      expect(request1.requestId).toBe('request-id-1');
      expect(request2.requestId).toBe('request-id-2');
      expect(request1.requestId).not.toBe(request2.requestId);
    });

    it('should include current timestamp in request', () => {
      const fixedDate = new Date('2024-01-01T00:00:00Z');
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(fixedDate.toISOString());

      const result = provider.generateAuthRequest();

      expect(result.samlRequest).toContain('2024-01-01T00:00:00Z');
    });

    it('should handle optional relay state', () => {
      const resultWithRelay = provider.generateAuthRequest('test-state');
      const resultWithoutRelay = provider.generateAuthRequest();

      expect(resultWithRelay.relayState).toBe('test-state');
      expect(resultWithoutRelay.relayState).toBeUndefined();
    });
  });

  describe('SAML Response Validation', () => {
    const mockSamlResponse = `
      <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                      ID="response-123"
                      Version="2.0"
                      IssueInstant="2024-01-01T00:00:00Z">
        <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">https://idp.example.com</saml:Issuer>
        <samlp:Status>
          <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
        </samlp:Status>
        <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                        ID="assertion-123"
                        Version="2.0"
                        IssueInstant="2024-01-01T00:00:00Z">
          <saml:Issuer>https://idp.example.com</saml:Issuer>
          <saml:Subject>
            <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">user@example.com</saml:NameID>
          </saml:Subject>
          <saml:AttributeStatement>
            <saml:Attribute Name="firstName">
              <saml:AttributeValue>John</saml:AttributeValue>
            </saml:Attribute>
            <saml:Attribute Name="lastName">
              <saml:AttributeValue>Doe</saml:AttributeValue>
            </saml:Attribute>
            <saml:Attribute Name="email">
              <saml:AttributeValue>user@example.com</saml:AttributeValue>
            </saml:Attribute>
            <saml:Attribute Name="role">
              <saml:AttributeValue>USER</saml:AttributeValue>
            </saml:Attribute>
          </saml:AttributeStatement>
        </saml:Assertion>
      </samlp:Response>
    `;

    beforeEach(() => {
      // Mock signature validation to succeed
      jest.spyOn(provider, 'validateSignature' as any).mockReturnValue(true);
      jest.spyOn(provider, 'validateTimestamp' as any).mockReturnValue(true);
    });

    it('should validate and parse successful SAML response', async () => {
      const encodedResponse = Buffer.from(mockSamlResponse).toString('base64');
      
      const result = await provider.validateResponse(encodedResponse, 'request-123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user@example.com',
        email: 'user@example.com',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      });
      expect(result.sessionIndex).toBeDefined();
    });

    it('should reject response with failed status', async () => {
      const failedResponse = mockSamlResponse.replace(
        'Success',
        'AuthnFailed'
      );
      const encodedResponse = Buffer.from(failedResponse).toString('base64');

      const result = await provider.validateResponse(encodedResponse, 'request-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('SAML authentication failed');
    });

    it('should reject response with invalid signature', async () => {
      jest.spyOn(provider, 'validateSignature' as any).mockReturnValue(false);
      
      const encodedResponse = Buffer.from(mockSamlResponse).toString('base64');
      
      const result = await provider.validateResponse(encodedResponse, 'request-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid SAML response signature');
    });

    it('should reject expired response', async () => {
      jest.spyOn(provider, 'validateTimestamp' as any).mockReturnValue(false);
      
      const encodedResponse = Buffer.from(mockSamlResponse).toString('base64');
      
      const result = await provider.validateResponse(encodedResponse, 'request-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('SAML response has expired');
    });

    it('should handle malformed SAML response', async () => {
      const malformedResponse = 'invalid-xml-data';
      const encodedResponse = Buffer.from(malformedResponse).toString('base64');

      const result = await provider.validateResponse(encodedResponse, 'request-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid SAML response format');
    });

    it('should handle missing required attributes', async () => {
      const responseWithoutEmail = mockSamlResponse.replace(
        /<saml:Attribute Name="email">[\s\S]*?<\/saml:Attribute>/,
        ''
      );
      const encodedResponse = Buffer.from(responseWithoutEmail).toString('base64');

      const result = await provider.validateResponse(encodedResponse, 'request-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required attribute: email');
    });
  });

  describe('Logout Request Generation', () => {
    beforeEach(() => {
      mockCrypto.randomUUID.mockReturnValue('logout-request-123');
    });

    it('should generate SAML logout request', () => {
      const nameId = 'user@example.com';
      const sessionIndex = 'session-123';
      const relayState = 'http://localhost:3000/';

      const result = provider.generateLogoutRequest(nameId, sessionIndex, relayState);

      expect(result).toHaveProperty('samlRequest');
      expect(result).toHaveProperty('relayState', relayState);
      expect(result).toHaveProperty('requestId', 'logout-request-123');
      
      expect(result.samlRequest).toContain('LogoutRequest');
      expect(result.samlRequest).toContain(nameId);
      expect(result.samlRequest).toContain(sessionIndex);
    });

    it('should handle missing session index', () => {
      const nameId = 'user@example.com';

      const result = provider.generateLogoutRequest(nameId);

      expect(result.samlRequest).toContain('LogoutRequest');
      expect(result.samlRequest).toContain(nameId);
      // Should not contain SessionIndex element when not provided
      expect(result.samlRequest).not.toContain('SessionIndex');
    });
  });

  describe('Logout Response Validation', () => {
    const mockLogoutResponse = `
      <samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                            ID="logout-response-123"
                            Version="2.0"
                            IssueInstant="2024-01-01T00:00:00Z">
        <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">https://idp.example.com</saml:Issuer>
        <samlp:Status>
          <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
        </samlp:Status>
      </samlp:LogoutResponse>
    `;

    beforeEach(() => {
      jest.spyOn(provider, 'validateSignature' as any).mockReturnValue(true);
      jest.spyOn(provider, 'validateTimestamp' as any).mockReturnValue(true);
    });

    it('should validate successful logout response', async () => {
      const encodedResponse = Buffer.from(mockLogoutResponse).toString('base64');
      
      const result = await provider.validateLogoutResponse(encodedResponse, 'logout-request-123');

      expect(result.success).toBe(true);
    });

    it('should reject failed logout response', async () => {
      const failedResponse = mockLogoutResponse.replace(
        'Success',
        'LogoutFailed'
      );
      const encodedResponse = Buffer.from(failedResponse).toString('base64');

      const result = await provider.validateLogoutResponse(encodedResponse, 'logout-request-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('SAML logout failed');
    });
  });

  describe('Metadata Generation', () => {
    it('should generate valid SAML metadata', () => {
      const metadata = provider.generateMetadata();

      expect(metadata).toContain('EntityDescriptor');
      expect(metadata).toContain(mockConfig.entityId);
      expect(metadata).toContain('SPSSODescriptor');
      expect(metadata).toContain('AssertionConsumerService');
      expect(metadata).toContain('SingleLogoutService');
      expect(metadata).toContain(mockConfig.certificate.replace(/-----[^-]+-----|\n/g, ''));
    });

    it('should include correct service URLs', () => {
      const metadata = provider.generateMetadata();
      const baseUrl = 'http://localhost:3000';

      expect(metadata).toContain(`${baseUrl}/api/auth/saml/acs`);
      expect(metadata).toContain(`${baseUrl}/api/auth/saml/sls`);
    });
  });

  describe('Signature Validation', () => {
    beforeEach(() => {
      // Reset mocks for signature validation tests
      jest.restoreAllMocks();
    });

    it('should validate correct signature', () => {
      const xmlDoc = mockSamlResponse;
      
      // Mock crypto operations for signature validation
      const mockVerify = {
        update: jest.fn().mockReturnThis(),
        verify: jest.fn().mockReturnValue(true),
      };
      
      mockCrypto.createVerify = jest.fn().mockReturnValue(mockVerify as any);

      const result = provider['validateSignature'](xmlDoc);

      expect(result).toBe(true);
      expect(mockCrypto.createVerify).toHaveBeenCalledWith('RSA-SHA256');
    });

    it('should reject invalid signature', () => {
      const xmlDoc = mockSamlResponse;
      
      const mockVerify = {
        update: jest.fn().mockReturnThis(),
        verify: jest.fn().mockReturnValue(false),
      };
      
      mockCrypto.createVerify = jest.fn().mockReturnValue(mockVerify as any);

      const result = provider['validateSignature'](xmlDoc);

      expect(result).toBe(false);
    });

    it('should handle signature validation errors', () => {
      const xmlDoc = mockSamlResponse;
      
      mockCrypto.createVerify = jest.fn().mockImplementation(() => {
        throw new Error('Signature validation error');
      });

      const result = provider['validateSignature'](xmlDoc);

      expect(result).toBe(false);
    });
  });

  describe('Timestamp Validation', () => {
    it('should accept current timestamp', () => {
      const currentTime = new Date();
      const result = provider['validateTimestamp'](currentTime.toISOString());

      expect(result).toBe(true);
    });

    it('should reject expired timestamp', () => {
      const expiredTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const result = provider['validateTimestamp'](expiredTime.toISOString());

      expect(result).toBe(false);
    });

    it('should reject future timestamp', () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future
      const result = provider['validateTimestamp'](futureTime.toISOString());

      expect(result).toBe(false);
    });

    it('should handle invalid timestamp format', () => {
      const result = provider['validateTimestamp']('invalid-timestamp');

      expect(result).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should extract attributes from SAML assertion', () => {
      const result = provider['extractAttributes'](mockSamlResponse);

      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        role: 'USER',
      });
    });

    it('should handle missing attributes gracefully', () => {
      const responseWithoutAttributes = mockSamlResponse.replace(
        /<saml:AttributeStatement>[\s\S]*<\/saml:AttributeStatement>/,
        ''
      );

      const result = provider['extractAttributes'](responseWithoutAttributes);

      expect(result).toEqual({});
    });

    it('should base64 encode SAML requests', () => {
      const xmlString = '<test>content</test>';
      const result = provider['encodeSamlRequest'](xmlString);

      expect(result).toBe(Buffer.from(xmlString).toString('base64'));
    });

    it('should base64 decode SAML responses', () => {
      const originalXml = '<test>content</test>';
      const encodedXml = Buffer.from(originalXml).toString('base64');
      
      const result = provider['decodeSamlResponse'](encodedXml);

      expect(result).toBe(originalXml);
    });
  });

  describe('Error Handling', () => {
    it('should handle XML parsing errors gracefully', async () => {
      const invalidXml = 'not-valid-xml';
      const encodedResponse = Buffer.from(invalidXml).toString('base64');

      const result = await provider.validateResponse(encodedResponse, 'request-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid SAML response format');
    });

    it('should handle crypto errors during signature validation', () => {
      mockCrypto.createVerify = jest.fn().mockImplementation(() => {
        throw new Error('Crypto error');
      });

      const result = provider['validateSignature'](mockSamlResponse);

      expect(result).toBe(false);
    });

    it('should validate required configuration on initialization', () => {
      const requiredFields = ['entityId', 'ssoUrl', 'certificate', 'privateKey'];
      
      requiredFields.forEach(field => {
        const invalidConfig = { ...mockConfig };
        delete invalidConfig[field as keyof typeof invalidConfig];
        
        expect(() => new SAMLProvider(invalidConfig as any)).toThrow(
          'SAML configuration is incomplete'
        );
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete authentication flow', async () => {
      // 1. Generate auth request
      const authRequest = provider.generateAuthRequest('http://localhost:3000/dashboard');
      expect(authRequest.samlRequest).toBeDefined();
      expect(authRequest.requestId).toBeDefined();

      // 2. Validate response (mock successful response)
      jest.spyOn(provider, 'validateSignature' as any).mockReturnValue(true);
      jest.spyOn(provider, 'validateTimestamp' as any).mockReturnValue(true);
      
      const encodedResponse = Buffer.from(mockSamlResponse).toString('base64');
      const validationResult = await provider.validateResponse(encodedResponse, authRequest.requestId);

      expect(validationResult.success).toBe(true);
      expect(validationResult.user?.email).toBe('user@example.com');
    });

    it('should handle complete logout flow', async () => {
      // 1. Generate logout request
      const logoutRequest = provider.generateLogoutRequest('user@example.com', 'session-123');
      expect(logoutRequest.samlRequest).toBeDefined();
      expect(logoutRequest.requestId).toBeDefined();

      // 2. Validate logout response
      jest.spyOn(provider, 'validateSignature' as any).mockReturnValue(true);
      jest.spyOn(provider, 'validateTimestamp' as any).mockReturnValue(true);

      const mockLogoutResponse = `
        <samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                              ID="logout-response-123"
                              Version="2.0"
                              IssueInstant="2024-01-01T00:00:00Z">
          <samlp:Status>
            <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
          </samlp:Status>
        </samlp:LogoutResponse>
      `;
      
      const encodedResponse = Buffer.from(mockLogoutResponse).toString('base64');
      const validationResult = await provider.validateLogoutResponse(encodedResponse, logoutRequest.requestId);

      expect(validationResult.success).toBe(true);
    });
  });
});