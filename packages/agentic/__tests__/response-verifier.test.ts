/**
 * Tests for ResponseVerifier
 */

import {
  ResponseVerifier,
  createResponseVerifier,
  InMemoryVerificationResultStore,
  VerificationInput,
  VerificationStatus,
  FactCheckStatus,
  IssueType,
  IssueSeverity,
  SourceType,
  SourceReference,
} from '../src/self-evaluation';

describe('ResponseVerifier', () => {
  let verifier: ResponseVerifier;

  beforeEach(() => {
    verifier = createResponseVerifier();
  });

  describe('verifyResponse', () => {
    it('should verify a well-sourced response with high accuracy', async () => {
      const input: VerificationInput = {
        responseId: 'resp-1',
        userId: 'user-1',
        responseText:
          'TypeScript is a strongly typed programming language that builds on JavaScript. The language is known for adding optional static typing. It was developed by Microsoft and has excellent documentation. This approach results in better tooling support.',
        sources: [
          {
            id: 'source-1',
            type: SourceType.DOCUMENTATION,
            title: 'TypeScript Handbook',
            reliability: 0.95,
          },
        ],
      };

      const result = await verifier.verifyResponse(input);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.responseId).toBe('resp-1');
      expect(result.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.sourceValidations.length).toBeGreaterThan(0);
    });

    it('should mark response as unverified without sources', async () => {
      const input: VerificationInput = {
        responseId: 'resp-2',
        userId: 'user-1',
        responseText: 'This is an unsourced claim that might be incorrect.',
      };

      const result = await verifier.verifyResponse(input);

      expect(result.status).toBe(VerificationStatus.UNVERIFIED);
      expect(result.sourceValidations.length).toBe(0);
    });

    it('should detect potential factual errors for likely incorrect claims', async () => {
      const input: VerificationInput = {
        responseId: 'resp-3',
        userId: 'user-1',
        responseText:
          'JavaScript always passes variables by reference to functions. This will never cause any issues with primitive types.',
      };

      const result = await verifier.verifyResponse(input);

      // Should detect potential misconception
      const misconceptionIssue = result.issues.find(
        (i) => i.type === IssueType.POTENTIAL_MISCONCEPTION
      );
      expect(misconceptionIssue || result.issues.length > 0).toBeTruthy();
    });

    it('should detect oversimplification in responses', async () => {
      const input: VerificationInput = {
        responseId: 'resp-4',
        userId: 'user-1',
        responseText:
          'The algorithm is simply just the only way to sort data. Always use this method.',
      };

      const result = await verifier.verifyResponse(input);

      const oversimplificationIssue = result.issues.find(
        (i) => i.type === IssueType.OVERSIMPLIFICATION
      );
      expect(oversimplificationIssue).toBeDefined();
    });

    it('should generate corrections for critical issues', async () => {
      const input: VerificationInput = {
        responseId: 'resp-5',
        userId: 'user-1',
        responseText: 'This statement passed by reference incorrectly describes the behavior.',
        strictMode: true,
      };

      const result = await verifier.verifyResponse(input);

      // Should have corrections if there are critical issues
      if (result.issues.some((i) => i.severity === IssueSeverity.CRITICAL || i.severity === IssueSeverity.HIGH)) {
        expect(result.corrections?.length).toBeGreaterThan(0);
      }
    });

    it('should validate sources and mark low reliability', async () => {
      const input: VerificationInput = {
        responseId: 'resp-6',
        userId: 'user-1',
        responseText: 'This is sourced from unreliable content.',
        sources: [
          {
            id: 'source-low',
            type: SourceType.GENERATED,
            title: 'AI Generated Content',
            reliability: 0.3,
          },
        ],
      };

      const result = await verifier.verifyResponse(input);

      expect(result.sourceValidations.length).toBe(1);
      expect(result.sourceValidations[0].isValid).toBe(false);
      expect(result.sourceValidations[0].issues).toContain('Low reliability score');
    });

    it('should set expiration date on verification result', async () => {
      const input: VerificationInput = {
        responseId: 'resp-7',
        userId: 'user-1',
        responseText: 'A test response for expiration.',
      };

      const result = await verifier.verifyResponse(input);

      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt.getTime()).toBeGreaterThan(result.verifiedAt.getTime());
    });
  });

  describe('getVerification', () => {
    it('should retrieve a stored verification result', async () => {
      const input: VerificationInput = {
        responseId: 'resp-retrieve',
        userId: 'user-1',
        responseText: 'Test response for retrieval.',
      };

      await verifier.verifyResponse(input);
      const retrieved = await verifier.getVerification('resp-retrieve');

      expect(retrieved).toBeDefined();
      expect(retrieved?.responseId).toBe('resp-retrieve');
    });

    it('should return null for non-existent response', async () => {
      const retrieved = await verifier.getVerification('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getUserHistory', () => {
    it('should return user verification history', async () => {
      await verifier.verifyResponse({
        responseId: 'resp-hist-1',
        userId: 'user-history',
        responseText: 'First response.',
      });

      await verifier.verifyResponse({
        responseId: 'resp-hist-2',
        userId: 'user-history',
        responseText: 'Second response.',
      });

      const history = await verifier.getUserHistory('user-history');

      expect(history.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await verifier.verifyResponse({
          responseId: `resp-limit-${i}`,
          userId: 'user-limit',
          responseText: `Response ${i}`,
        });
      }

      const history = await verifier.getUserHistory('user-limit', 3);
      expect(history.length).toBe(3);
    });
  });

  describe('quickVerify', () => {
    it('should perform quick verification without storing', async () => {
      const result = await verifier.quickVerify(
        'This is a well-structured explanation with examples and good reasoning.'
      );

      expect(result).toBeDefined();
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
      expect(result.status).toBeDefined();
      expect(typeof result.issueCount).toBe('number');
      expect(typeof result.criticalIssues).toBe('number');
    });

    it('should return higher accuracy for well-sourced content', async () => {
      const sources: SourceReference[] = [
        {
          id: 'source-1',
          type: SourceType.TEXTBOOK,
          title: 'Computer Science Textbook',
          reliability: 0.95,
        },
      ];

      const withSources = await verifier.quickVerify(
        'TypeScript is a typed superset of JavaScript.',
        sources
      );

      const withoutSources = await verifier.quickVerify(
        'TypeScript is a typed superset of JavaScript.'
      );

      expect(withSources.accuracy).toBeGreaterThanOrEqual(withoutSources.accuracy);
    });
  });

  describe('validateClaim', () => {
    it('should validate a single claim', async () => {
      const result = await verifier.validateClaim(
        'JavaScript is a programming language.'
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.claim).toBe('JavaScript is a programming language.');
      expect(result.status).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should mark hedged claims as not verifiable', async () => {
      const result = await verifier.validateClaim(
        'The function might possibly work sometimes under certain conditions.'
      );

      expect(result.status).toBe(FactCheckStatus.NOT_VERIFIABLE);
    });

    it('should use sources when validating claims', async () => {
      const sources: SourceReference[] = [
        {
          id: 'source-1',
          type: SourceType.ACADEMIC_PAPER,
          title: 'Research Paper',
          reliability: 0.98,
        },
      ];

      const withSources = await verifier.validateClaim(
        'This is a verified statement from research.',
        sources
      );

      expect(withSources.sources.length).toBeGreaterThan(0);
    });
  });

  describe('extractClaims', () => {
    it('should extract factual claims from text', () => {
      const text = `
        TypeScript is a programming language that builds on JavaScript.
        It was developed by Microsoft.
        The language is known for its static typing.
      `;

      const claims = verifier.extractClaims(text);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims.length).toBeLessThanOrEqual(20); // Max limit
    });

    it('should not extract very short statements', () => {
      const text = 'OK. Yes. No. Fine.';
      const claims = verifier.extractClaims(text);

      expect(claims.length).toBe(0);
    });

    it('should extract definition statements', () => {
      const text = 'A variable is defined as a named storage location in memory.';
      const claims = verifier.extractClaims(text);

      expect(claims.length).toBeGreaterThan(0);
    });
  });

  describe('getIssuesByType', () => {
    it('should filter issues by type', async () => {
      // Create some responses with potential issues
      await verifier.verifyResponse({
        responseId: 'resp-issues-1',
        userId: 'user-1',
        responseText: 'Simply just use the only algorithm. This is always the best approach.',
      });

      const oversimplifications = await verifier.getIssuesByType(IssueType.OVERSIMPLIFICATION);

      expect(Array.isArray(oversimplifications)).toBe(true);
    });

    it('should respect since parameter', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await verifier.verifyResponse({
        responseId: 'resp-issues-time',
        userId: 'user-1',
        responseText: 'Simply just use this method always.',
      });

      const futureIssues = await verifier.getIssuesByType(
        IssueType.OVERSIMPLIFICATION,
        tomorrow
      );

      expect(futureIssues.length).toBe(0);
    });
  });
});

describe('InMemoryVerificationResultStore', () => {
  let store: InMemoryVerificationResultStore;

  beforeEach(() => {
    store = new InMemoryVerificationResultStore();
  });

  it('should create and retrieve verification result', async () => {
    const result = await store.create({
      responseId: 'resp-1',
      userId: 'user-1',
      status: VerificationStatus.VERIFIED,
      overallAccuracy: 0.9,
      factChecks: [],
      totalClaims: 5,
      verifiedClaims: 4,
      contradictedClaims: 0,
      sourceValidations: [],
      issues: [],
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const retrieved = await store.get(result.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.responseId).toBe('resp-1');
  });

  it('should get by response ID', async () => {
    await store.create({
      responseId: 'resp-by-id',
      userId: 'user-1',
      status: VerificationStatus.PARTIALLY_VERIFIED,
      overallAccuracy: 0.75,
      factChecks: [],
      totalClaims: 4,
      verifiedClaims: 3,
      contradictedClaims: 0,
      sourceValidations: [],
      issues: [],
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const retrieved = await store.getByResponse('resp-by-id');
    expect(retrieved).toBeDefined();
    expect(retrieved?.overallAccuracy).toBe(0.75);
  });

  it('should get by user with limit', async () => {
    for (let i = 0; i < 5; i++) {
      await store.create({
        responseId: `resp-user-${i}`,
        userId: 'user-many',
        status: VerificationStatus.VERIFIED,
        overallAccuracy: 0.8,
        factChecks: [],
        totalClaims: 3,
        verifiedClaims: 3,
        contradictedClaims: 0,
        sourceValidations: [],
        issues: [],
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    const results = await store.getByUser('user-many', 3);
    expect(results.length).toBe(3);
  });

  it('should update verification result', async () => {
    const result = await store.create({
      responseId: 'resp-update',
      userId: 'user-1',
      status: VerificationStatus.UNVERIFIED,
      overallAccuracy: 0.5,
      factChecks: [],
      totalClaims: 2,
      verifiedClaims: 1,
      contradictedClaims: 0,
      sourceValidations: [],
      issues: [],
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const updated = await store.update(result.id, {
      status: VerificationStatus.VERIFIED,
      overallAccuracy: 0.95,
    });

    expect(updated.status).toBe(VerificationStatus.VERIFIED);
    expect(updated.overallAccuracy).toBe(0.95);
  });

  it('should throw error when updating non-existent result', async () => {
    await expect(
      store.update('non-existent-id', { status: VerificationStatus.VERIFIED })
    ).rejects.toThrow('Verification result not found');
  });

  it('should get issues by type', async () => {
    await store.create({
      responseId: 'resp-with-issues',
      userId: 'user-1',
      status: VerificationStatus.UNVERIFIED,
      overallAccuracy: 0.6,
      factChecks: [],
      totalClaims: 2,
      verifiedClaims: 1,
      contradictedClaims: 0,
      sourceValidations: [],
      issues: [
        {
          id: 'issue-1',
          type: IssueType.OVERSIMPLIFICATION,
          severity: IssueSeverity.MEDIUM,
          description: 'Test oversimplification',
        },
        {
          id: 'issue-2',
          type: IssueType.FACTUAL_ERROR,
          severity: IssueSeverity.CRITICAL,
          description: 'Test factual error',
        },
      ],
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const oversimplifications = await store.getIssuesByType(IssueType.OVERSIMPLIFICATION);
    expect(oversimplifications.length).toBe(1);
    expect(oversimplifications[0].description).toBe('Test oversimplification');

    const factualErrors = await store.getIssuesByType(IssueType.FACTUAL_ERROR);
    expect(factualErrors.length).toBe(1);
  });
});
