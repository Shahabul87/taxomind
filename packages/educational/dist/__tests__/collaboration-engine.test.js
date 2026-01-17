/**
 * @sam-ai/educational - Collaboration Engine Tests
 * Tests for real-time collaboration analytics engine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CollaborationEngine, createCollaborationEngine, } from '../engines/collaboration-engine';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createCollaborationConfig(overrides = {}) {
    return {
        ...overrides,
    };
}
// ============================================================================
// TESTS
// ============================================================================
describe('CollaborationEngine', () => {
    let engine;
    let config;
    beforeEach(() => {
        config = createCollaborationConfig();
        engine = new CollaborationEngine(config);
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create engine with valid config', () => {
            expect(engine).toBeInstanceOf(CollaborationEngine);
        });
        it('should create engine without database adapter', () => {
            const noDatabaseEngine = new CollaborationEngine({});
            expect(noDatabaseEngine).toBeInstanceOf(CollaborationEngine);
        });
        it('should create engine using factory function', () => {
            const factoryEngine = createCollaborationEngine();
            expect(factoryEngine).toBeInstanceOf(CollaborationEngine);
        });
        it('should create engine with custom config', () => {
            const customConfig = createCollaborationConfig();
            const customEngine = new CollaborationEngine(customConfig);
            expect(customEngine).toBeInstanceOf(CollaborationEngine);
        });
    });
    // ============================================================================
    // SESSION MANAGEMENT TESTS (Requires Database)
    // ============================================================================
    describe('startCollaborationSession', () => {
        it('should throw error without database adapter', async () => {
            await expect(engine.startCollaborationSession('course-1', 'chapter-1', 'user-1', 'discussion')).rejects.toThrow('Database adapter is required');
        });
    });
    describe('joinCollaborationSession', () => {
        it('should throw error for non-existent session', async () => {
            await expect(engine.joinCollaborationSession('non-existent-session', 'user-1')).rejects.toThrow('Session not found or inactive');
        });
    });
    describe('recordContribution', () => {
        it('should throw error for non-existent session', async () => {
            await expect(engine.recordContribution('non-existent-session', 'user-1', {
                type: 'message',
                content: { text: 'Hello!' },
                impact: 0.5,
            })).rejects.toThrow('Session not found');
        });
    });
    describe('analyzeCollaboration', () => {
        it('should throw error for non-existent session without database', async () => {
            await expect(engine.analyzeCollaboration('non-existent-session')).rejects.toThrow('Session not found');
        });
    });
    describe('endCollaborationSession', () => {
        it('should throw error for non-existent session', async () => {
            await expect(engine.endCollaborationSession('non-existent-session')).rejects.toThrow('Session not found or already ended');
        });
    });
    // ============================================================================
    // REAL-TIME METRICS TESTS (Works without Database)
    // ============================================================================
    describe('getRealTimeMetrics', () => {
        it('should return empty metrics when no active sessions', async () => {
            const metrics = await engine.getRealTimeMetrics();
            expect(metrics).toBeDefined();
            expect(metrics.currentSessions).toBe(0);
            expect(metrics.activeUsers).toBe(0);
        });
        it('should return metrics filtered by course', async () => {
            const metrics = await engine.getRealTimeMetrics('course-1');
            expect(metrics).toBeDefined();
            expect(metrics.currentSessions).toBe(0);
        });
        it('should include collaboration hotspots', async () => {
            const metrics = await engine.getRealTimeMetrics();
            expect(metrics.collaborationHotspots).toBeDefined();
            expect(Array.isArray(metrics.collaborationHotspots)).toBe(true);
        });
        it('should include messages per minute', async () => {
            const metrics = await engine.getRealTimeMetrics();
            expect(metrics.messagesPerMinute).toBeDefined();
            expect(typeof metrics.messagesPerMinute).toBe('number');
        });
        it('should include average response time', async () => {
            const metrics = await engine.getRealTimeMetrics();
            expect(metrics.averageResponseTime).toBeDefined();
            expect(typeof metrics.averageResponseTime).toBe('number');
        });
    });
    // ============================================================================
    // ACTIVE SESSION TESTS (Works without Database)
    // ============================================================================
    describe('getActiveSession', () => {
        it('should return undefined for non-existent session', () => {
            const session = engine.getActiveSession('non-existent-session');
            expect(session).toBeUndefined();
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle empty config', () => {
            const emptyEngine = new CollaborationEngine({});
            expect(emptyEngine).toBeInstanceOf(CollaborationEngine);
        });
        it('should handle undefined config', () => {
            const undefinedEngine = new CollaborationEngine();
            expect(undefinedEngine).toBeInstanceOf(CollaborationEngine);
        });
        it('should handle global metrics request', async () => {
            const metrics = await engine.getRealTimeMetrics();
            expect(metrics).toBeDefined();
        });
        it('should handle multiple metrics requests', async () => {
            const metrics1 = await engine.getRealTimeMetrics();
            const metrics2 = await engine.getRealTimeMetrics();
            const metrics3 = await engine.getRealTimeMetrics('course-1');
            expect(metrics1).toBeDefined();
            expect(metrics2).toBeDefined();
            expect(metrics3).toBeDefined();
        });
    });
});
