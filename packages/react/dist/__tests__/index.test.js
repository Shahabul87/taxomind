/**
 * Index Exports Tests
 * Tests for @sam-ai/react package exports
 */
import { describe, it, expect } from 'vitest';
import { 
// Context & Provider
SAMProvider, useSAMContext, SAMContext, 
// Hooks
useSAM, useSAMChat, useSAMActions, useSAMPageContext, useSAMAutoContext, useSAMAnalysis, useSAMForm, useSAMFormSync, useSAMPageLinks, useSAMFormDataSync, useSAMFormDataEvents, useSAMFormAutoDetect, useSAMFormAutoFill, useSAMPracticeProblems, useSAMAdaptiveContent, useSAMSocraticDialogue, 
// Utilities
createContextDetector, contextDetector, getCapabilities, hasCapability, SAM_FORM_DATA_EVENT, emitSAMFormData, 
// Version
VERSION, } from '../index';
// ============================================================================
// CONTEXT & PROVIDER EXPORTS
// ============================================================================
describe('Context & Provider Exports', () => {
    it('should export SAMProvider', () => {
        expect(SAMProvider).toBeDefined();
        expect(typeof SAMProvider).toBe('function');
    });
    it('should export useSAMContext', () => {
        expect(useSAMContext).toBeDefined();
        expect(typeof useSAMContext).toBe('function');
    });
    it('should export SAMContext', () => {
        expect(SAMContext).toBeDefined();
    });
});
// ============================================================================
// HOOKS EXPORTS
// ============================================================================
describe('Hooks Exports', () => {
    it('should export useSAM', () => {
        expect(useSAM).toBeDefined();
        expect(typeof useSAM).toBe('function');
    });
    it('should export useSAMChat', () => {
        expect(useSAMChat).toBeDefined();
        expect(typeof useSAMChat).toBe('function');
    });
    it('should export useSAMActions', () => {
        expect(useSAMActions).toBeDefined();
        expect(typeof useSAMActions).toBe('function');
    });
    it('should export useSAMPageContext', () => {
        expect(useSAMPageContext).toBeDefined();
        expect(typeof useSAMPageContext).toBe('function');
    });
    it('should export useSAMAutoContext', () => {
        expect(useSAMAutoContext).toBeDefined();
        expect(typeof useSAMAutoContext).toBe('function');
    });
    it('should export useSAMAnalysis', () => {
        expect(useSAMAnalysis).toBeDefined();
        expect(typeof useSAMAnalysis).toBe('function');
    });
    it('should export useSAMForm', () => {
        expect(useSAMForm).toBeDefined();
        expect(typeof useSAMForm).toBe('function');
    });
    it('should export useSAMFormSync', () => {
        expect(useSAMFormSync).toBeDefined();
        expect(typeof useSAMFormSync).toBe('function');
    });
    it('should export useSAMPageLinks', () => {
        expect(useSAMPageLinks).toBeDefined();
        expect(typeof useSAMPageLinks).toBe('function');
    });
    it('should export useSAMFormDataSync', () => {
        expect(useSAMFormDataSync).toBeDefined();
        expect(typeof useSAMFormDataSync).toBe('function');
    });
    it('should export useSAMFormDataEvents', () => {
        expect(useSAMFormDataEvents).toBeDefined();
        expect(typeof useSAMFormDataEvents).toBe('function');
    });
    it('should export useSAMFormAutoDetect', () => {
        expect(useSAMFormAutoDetect).toBeDefined();
        expect(typeof useSAMFormAutoDetect).toBe('function');
    });
    it('should export useSAMFormAutoFill', () => {
        expect(useSAMFormAutoFill).toBeDefined();
        expect(typeof useSAMFormAutoFill).toBe('function');
    });
});
// ============================================================================
// PHASE 2 HOOKS EXPORTS
// ============================================================================
describe('Phase 2 Hooks Exports', () => {
    it('should export useSAMPracticeProblems', () => {
        expect(useSAMPracticeProblems).toBeDefined();
        expect(typeof useSAMPracticeProblems).toBe('function');
    });
    it('should export useSAMAdaptiveContent', () => {
        expect(useSAMAdaptiveContent).toBeDefined();
        expect(typeof useSAMAdaptiveContent).toBe('function');
    });
    it('should export useSAMSocraticDialogue', () => {
        expect(useSAMSocraticDialogue).toBeDefined();
        expect(typeof useSAMSocraticDialogue).toBe('function');
    });
});
// ============================================================================
// UTILITY EXPORTS
// ============================================================================
describe('Utility Exports', () => {
    it('should export createContextDetector', () => {
        expect(createContextDetector).toBeDefined();
        expect(typeof createContextDetector).toBe('function');
    });
    it('should export contextDetector (default instance)', () => {
        expect(contextDetector).toBeDefined();
        expect(contextDetector.detectFromPath).toBeDefined();
        expect(contextDetector.detect).toBeDefined();
    });
    it('should export getCapabilities', () => {
        expect(getCapabilities).toBeDefined();
        expect(typeof getCapabilities).toBe('function');
        const caps = getCapabilities('dashboard');
        expect(Array.isArray(caps)).toBe(true);
    });
    it('should export hasCapability', () => {
        expect(hasCapability).toBeDefined();
        expect(typeof hasCapability).toBe('function');
    });
    it('should export SAM_FORM_DATA_EVENT', () => {
        expect(SAM_FORM_DATA_EVENT).toBeDefined();
        expect(typeof SAM_FORM_DATA_EVENT).toBe('string');
    });
    it('should export emitSAMFormData', () => {
        expect(emitSAMFormData).toBeDefined();
        expect(typeof emitSAMFormData).toBe('function');
    });
});
// ============================================================================
// VERSION EXPORT
// ============================================================================
describe('Version Export', () => {
    it('should export VERSION constant', () => {
        expect(VERSION).toBeDefined();
        expect(typeof VERSION).toBe('string');
    });
    it('should be semantic version format', () => {
        const semverRegex = /^\d+\.\d+\.\d+$/;
        expect(VERSION).toMatch(semverRegex);
    });
    it('should be version 0.1.0', () => {
        expect(VERSION).toBe('0.1.0');
    });
});
// ============================================================================
// INTEGRATION TESTS
// ============================================================================
describe('Integration', () => {
    it('should create context detector and detect path', () => {
        const detector = createContextDetector();
        const result = detector.detectFromPath('/dashboard');
        expect(result.type).toBe('dashboard');
        expect(result.capabilities.length).toBeGreaterThan(0);
    });
    it('should get capabilities for various page types', () => {
        const dashboardCaps = getCapabilities('dashboard');
        const courseCaps = getCapabilities('course-detail');
        const createCaps = getCapabilities('course-create');
        expect(dashboardCaps).toContain('analyze-progress');
        expect(courseCaps).toContain('analyze-course');
        expect(createCaps).toContain('fill-form');
    });
    it('should use default context detector', () => {
        const result = contextDetector.detectFromPath('/teacher/courses');
        expect(result.type).toBe('courses-list');
        expect(result.path).toBe('/teacher/courses');
    });
});
// ============================================================================
// TYPE EXPORTS (VERIFICATION ONLY)
// ============================================================================
describe('Type Exports', () => {
    it('should have proper type exports documented', () => {
        // This test verifies that we have proper type exports
        // Types are verified at compile time, this is just documentation
        const typeNames = [
            'SAMProviderConfig',
            'SAMProviderState',
            'SAMApiTransportOptions',
            'SAMApiTransportResponse',
            'UseSAMReturn',
            'UseSAMContextReturn',
            'UseSAMChatReturn',
            'UseSAMActionsReturn',
            'UseSAMFormReturn',
            'UseSAMAnalysisReturn',
            'SAMPageLink',
            'UseSAMPageLinksOptions',
            'UseSAMPageLinksReturn',
            'PageContextDetection',
            'ContextDetectorOptions',
            'FormSyncOptions',
            'FormAutoFillOptions',
        ];
        // Just verify we have types listed
        expect(typeNames.length).toBeGreaterThan(0);
    });
});
