/**
 * @sam-ai/integration - Host Detection
 * Auto-detect host environment and generate integration profile
 */
import { type IntegrationProfile, RuntimeEnvironment, HostFrameworkType } from '../types/profile';
/**
 * Environment detection result
 */
export interface DetectionResult {
    runtime: RuntimeEnvironment;
    framework: HostFrameworkType;
    nodeVersion?: string;
    features: DetectedFeatures;
    environment: DetectedEnvironment;
    confidence: number;
}
/**
 * Detected features
 */
export interface DetectedFeatures {
    hasPrisma: boolean;
    hasDrizzle: boolean;
    hasNextAuth: boolean;
    hasClerk: boolean;
    hasAnthropic: boolean;
    hasOpenAI: boolean;
    hasRedis: boolean;
    hasWebSocket: boolean;
    hasPgVector: boolean;
}
/**
 * Detected environment variables
 */
export interface DetectedEnvironment {
    isDevelopment: boolean;
    isProduction: boolean;
    hasDatabase: boolean;
    hasAuth: boolean;
    hasAI: boolean;
    region?: string;
}
/**
 * Host Detector
 * Detects the host environment and available capabilities
 */
export declare class HostDetector {
    private cache;
    /**
     * Detect the host environment
     */
    detect(): DetectionResult;
    /**
     * Clear detection cache
     */
    clearCache(): void;
    /**
     * Detect runtime environment
     */
    private detectRuntime;
    /**
     * Detect framework
     */
    private detectFramework;
    /**
     * Detect available features
     */
    private detectFeatures;
    /**
     * Detect environment
     */
    private detectEnvironment;
    /**
     * Get Node.js version
     */
    private getNodeVersion;
    /**
     * Calculate confidence score for detection
     */
    private calculateConfidence;
    /**
     * Generate a basic integration profile from detection
     */
    generateProfile(options: {
        id: string;
        name: string;
        description?: string;
    }): IntegrationProfile;
}
/**
 * Create a host detector instance
 */
export declare function createHostDetector(): HostDetector;
/**
 * Quick detection
 */
export declare function detectHost(): DetectionResult;
/**
 * Generate profile from auto-detection
 */
export declare function generateProfileFromHost(options: {
    id: string;
    name: string;
    description?: string;
}): IntegrationProfile;
declare global {
    var window: unknown | undefined;
    var Deno: unknown | undefined;
    var Bun: unknown | undefined;
    var EdgeRuntime: unknown | undefined;
}
//# sourceMappingURL=host-detector.d.ts.map