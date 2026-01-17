/**
 * @sam-ai/api - Rate Limiting Middleware
 */
import type { SAMApiRequest, RateLimitConfig, RateLimitInfo } from '../types';
interface RateLimitStore {
    get(key: string): Promise<RateLimitEntry | null>;
    set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
    increment(key: string): Promise<number>;
}
interface RateLimitEntry {
    count: number;
    resetTime: number;
}
export interface RateLimiter {
    check(request: SAMApiRequest): Promise<RateLimitInfo>;
    reset(key: string): Promise<void>;
}
/**
 * Create a rate limiter with the given configuration
 */
export declare function createRateLimiter(config: RateLimitConfig, store?: RateLimitStore): RateLimiter;
/**
 * Rate limit presets for common use cases
 */
export declare const rateLimitPresets: {
    /** Standard API rate limit: 100 requests per minute */
    standard: {
        maxRequests: number;
        windowMs: number;
        message: string;
    };
    /** Strict rate limit: 10 requests per minute */
    strict: {
        maxRequests: number;
        windowMs: number;
        message: string;
    };
    /** AI endpoints: 20 requests per minute */
    ai: {
        maxRequests: number;
        windowMs: number;
        message: string;
    };
    /** Lenient: 1000 requests per minute */
    lenient: {
        maxRequests: number;
        windowMs: number;
        message: string;
    };
};
export {};
//# sourceMappingURL=rateLimit.d.ts.map