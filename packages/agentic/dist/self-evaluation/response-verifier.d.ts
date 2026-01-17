/**
 * @sam-ai/agentic - Response Verifier
 * Verifies AI responses against knowledge base and detects issues
 */
import { VerificationResult, VerificationResultStore, VerificationInput, VerificationStatus, FactCheck, VerificationIssue, IssueType, SourceReference, SelfEvaluationLogger } from './types';
/**
 * In-memory implementation of VerificationResultStore
 */
export declare class InMemoryVerificationResultStore implements VerificationResultStore {
    private results;
    private responseIndex;
    get(id: string): Promise<VerificationResult | null>;
    getByResponse(responseId: string): Promise<VerificationResult | null>;
    getByUser(userId: string, limit?: number): Promise<VerificationResult[]>;
    create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult>;
    update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult>;
    getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]>;
}
/**
 * Configuration for ResponseVerifier
 */
export interface ResponseVerifierConfig {
    store?: VerificationResultStore;
    logger?: SelfEvaluationLogger;
    strictModeThreshold?: number;
    claimExtractionPatterns?: RegExp[];
    issueThresholds?: Partial<Record<IssueType, number>>;
}
/**
 * Knowledge base entry for verification
 */
export interface KnowledgeBaseEntry {
    id: string;
    content: string;
    topic: string;
    reliability: number;
    lastUpdated: Date;
}
/**
 * Response Verifier
 * Verifies AI responses against knowledge and detects issues
 */
export declare class ResponseVerifier {
    private store;
    private logger;
    private claimExtractionPatterns;
    constructor(config?: ResponseVerifierConfig);
    /**
     * Verify a response
     */
    verifyResponse(input: VerificationInput): Promise<VerificationResult>;
    /**
     * Get verification result for a response
     */
    getVerification(responseId: string): Promise<VerificationResult | null>;
    /**
     * Get user's verification history
     */
    getUserHistory(userId: string, limit?: number): Promise<VerificationResult[]>;
    /**
     * Get issues by type
     */
    getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]>;
    /**
     * Quick verification check without storing
     */
    quickVerify(responseText: string, sources?: SourceReference[]): Promise<{
        status: VerificationStatus;
        accuracy: number;
        issueCount: number;
        criticalIssues: number;
    }>;
    /**
     * Validate a single claim
     */
    validateClaim(claim: string, sources?: SourceReference[]): Promise<FactCheck>;
    /**
     * Extract claims from text
     */
    extractClaims(text: string): string[];
    private performFactChecks;
    private checkFact;
    private analyzeClaim;
    private getSourceTypeWeight;
    private validateSources;
    private detectIssues;
    private detectOversimplification;
    private detectAmbiguity;
    private detectPotentialMisconceptions;
    private detectIncompleteExplanation;
    private detectLogicalInconsistencies;
    private areContradictory;
    private generateCorrections;
    private looksFactual;
    private determineStatus;
}
/**
 * Create a new ResponseVerifier instance
 */
export declare function createResponseVerifier(config?: ResponseVerifierConfig): ResponseVerifier;
//# sourceMappingURL=response-verifier.d.ts.map