/**
 * SAM Base Engine
 * Abstract base class for all SAM engines with no database dependencies
 */
import type { SAMEngine, SAMEngineConfig, SAMContext, AnalysisResult, SAMLogger, SAMStorage, ValidationResult } from './types';
export declare abstract class BaseEngine implements SAMEngine {
    protected config: SAMEngineConfig;
    protected logger: SAMLogger;
    protected storage: SAMStorage | null;
    protected initialized: boolean;
    protected cache: Map<string, {
        data: any;
        expiry: number;
    }>;
    abstract name: string;
    constructor(config?: SAMEngineConfig);
    /**
     * Initialize the engine
     */
    initialize(config?: SAMEngineConfig): Promise<void>;
    /**
     * Abstract method for engine-specific initialization
     */
    protected abstract performInitialization(): Promise<void>;
    /**
     * Process input with context
     */
    abstract process(context: SAMContext, input: any): Promise<any>;
    /**
     * Optional analysis method
     */
    analyze?(data: any): Promise<AnalysisResult>;
    /**
     * Cleanup and destroy engine
     */
    destroy(): Promise<void>;
    /**
     * Validate input data
     */
    protected validate<T>(data: any, validator: (data: any) => ValidationResult): T;
    /**
     * Cache management with TTL
     */
    protected withCache<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    /**
     * Clean up expired cache entries
     */
    private cleanupCache;
    /**
     * Performance monitoring wrapper
     */
    protected measurePerformance<T>(operation: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Rate limiting helper
     */
    private rateLimitMap;
    protected checkRateLimit(key: string, maxRequests?: number, windowMs?: number): Promise<boolean>;
    /**
     * Sanitization helpers
     */
    protected sanitizeString(input: string, maxLength?: number): string;
    protected sanitizeNumber(input: any, min: number, max: number, defaultValue: number): number;
    /**
     * Pagination helper
     */
    protected paginate<T>(items: T[], page?: number, limit?: number): {
        items: T[];
        total: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    /**
     * Batch processing helper
     */
    protected processBatch<T, R>(items: T[], processor: (item: T) => Promise<R>, batchSize?: number): Promise<R[]>;
    /**
     * Retry mechanism for operations
     */
    protected retry<T>(operation: () => Promise<T>, maxAttempts?: number, delayMs?: number): Promise<T>;
    /**
     * Delay helper
     */
    private delay;
    /**
     * Create default logger
     */
    private createDefaultLogger;
}
//# sourceMappingURL=base-engine.d.ts.map