/**
 * @sam-ai/api - Rate Limiting Middleware
 */
/**
 * Simple in-memory rate limit store
 */
function createMemoryStore() {
    const store = new Map();
    return {
        async get(key) {
            const entry = store.get(key);
            if (!entry)
                return null;
            // Check if expired
            if (Date.now() > entry.resetTime) {
                store.delete(key);
                return null;
            }
            return entry;
        },
        async set(key, entry, _ttlMs) {
            store.set(key, entry);
        },
        async increment(key) {
            const entry = store.get(key);
            if (!entry)
                return 1;
            entry.count += 1;
            store.set(key, entry);
            return entry.count;
        },
    };
}
/**
 * Default key generator - uses IP address or user ID
 */
function defaultKeyGenerator(request) {
    // Try to get IP from headers
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor ?? request.headers['x-real-ip'] ?? 'unknown';
    return `rate_limit:${ip}`;
}
/**
 * Create a rate limiter with the given configuration
 */
export function createRateLimiter(config, store) {
    const rateStore = store ?? createMemoryStore();
    const keyGenerator = config.keyGenerator ?? defaultKeyGenerator;
    return {
        async check(request) {
            // Check if request should be skipped
            if (config.skip?.(request)) {
                return {
                    remaining: config.maxRequests,
                    limit: config.maxRequests,
                    resetTime: new Date(Date.now() + config.windowMs),
                    blocked: false,
                };
            }
            const key = keyGenerator(request);
            const now = Date.now();
            const windowEnd = now + config.windowMs;
            // Get or create entry
            let entry = await rateStore.get(key);
            if (!entry) {
                // First request in window
                entry = {
                    count: 1,
                    resetTime: windowEnd,
                };
                await rateStore.set(key, entry, config.windowMs);
                return {
                    remaining: config.maxRequests - 1,
                    limit: config.maxRequests,
                    resetTime: new Date(windowEnd),
                    blocked: false,
                };
            }
            // Increment count
            const newCount = await rateStore.increment(key);
            const blocked = newCount > config.maxRequests;
            const remaining = Math.max(0, config.maxRequests - newCount);
            return {
                remaining,
                limit: config.maxRequests,
                resetTime: new Date(entry.resetTime),
                blocked,
            };
        },
        async reset(key) {
            await rateStore.set(key, { count: 0, resetTime: 0 }, 0);
        },
    };
}
/**
 * Rate limit presets for common use cases
 */
export const rateLimitPresets = {
    /** Standard API rate limit: 100 requests per minute */
    standard: {
        maxRequests: 100,
        windowMs: 60 * 1000,
        message: 'Too many requests. Please try again in a minute.',
    },
    /** Strict rate limit: 10 requests per minute */
    strict: {
        maxRequests: 10,
        windowMs: 60 * 1000,
        message: 'Rate limit exceeded. Please wait before trying again.',
    },
    /** AI endpoints: 20 requests per minute */
    ai: {
        maxRequests: 20,
        windowMs: 60 * 1000,
        message: 'AI request limit reached. Please wait before sending more messages.',
    },
    /** Lenient: 1000 requests per minute */
    lenient: {
        maxRequests: 1000,
        windowMs: 60 * 1000,
        message: 'Request limit reached.',
    },
};
