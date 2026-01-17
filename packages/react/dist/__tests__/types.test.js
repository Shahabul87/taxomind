/**
 * Types Tests
 * Tests for type definitions and interfaces
 */
import { describe, it, expect } from 'vitest';
// ============================================================================
// TYPE TESTS
// These tests verify type interfaces work correctly at runtime
// ============================================================================
describe('SAMProviderConfig', () => {
    it('should have optional config', () => {
        const config = {
            debug: true,
        };
        expect(config.debug).toBe(true);
        expect(config.config).toBeUndefined();
    });
    it('should accept transport options', () => {
        const config = {
            transport: 'api',
            api: {
                endpoint: '/api/sam/chat',
            },
        };
        expect(config.transport).toBe('api');
        expect(config.api?.endpoint).toBe('/api/sam/chat');
    });
    it('should accept callbacks', () => {
        const onStateChange = () => { };
        const onError = () => { };
        const config = {
            onStateChange,
            onError,
        };
        expect(config.onStateChange).toBe(onStateChange);
        expect(config.onError).toBe(onError);
    });
});
describe('SAMApiTransportOptions', () => {
    it('should have required endpoint', () => {
        const options = {
            endpoint: '/api/chat',
        };
        expect(options.endpoint).toBe('/api/chat');
    });
    it('should accept optional configuration', () => {
        const options = {
            endpoint: '/api/chat',
            streamEndpoint: '/api/chat/stream',
            headers: { 'X-Custom': 'header' },
            buildRequest: ({ message }) => ({ msg: message }),
            parseResponse: (payload) => payload,
        };
        expect(options.streamEndpoint).toBe('/api/chat/stream');
        expect(options.headers).toEqual({ 'X-Custom': 'header' });
        expect(options.buildRequest).toBeDefined();
        expect(options.parseResponse).toBeDefined();
    });
});
describe('SAMApiTransportResponse', () => {
    it('should have message field', () => {
        const response = {
            message: 'Hello!',
        };
        expect(response.message).toBe('Hello!');
    });
    it('should accept optional fields', () => {
        const response = {
            message: 'Hello!',
            suggestions: [{ id: '1', text: 'Follow up', label: 'Follow up', type: 'quick-reply' }],
            actions: [{ id: '1', type: 'navigate', label: 'Go', payload: {} }],
            insights: { key: 'value' },
            blooms: {
                dominantLevel: 'ANALYZE',
                distribution: {
                    REMEMBER: 0.1,
                    UNDERSTAND: 0.2,
                    APPLY: 0.2,
                    ANALYZE: 0.3,
                    EVALUATE: 0.1,
                    CREATE: 0.1,
                },
                cognitiveDepth: 65,
                balance: 'well-balanced',
                gaps: [],
                recommendations: [],
                confidence: 0.9,
                method: 'ai',
            },
        };
        expect(response.suggestions?.length).toBe(1);
        expect(response.actions?.length).toBe(1);
        expect(response.blooms?.dominantLevel).toBe('ANALYZE');
    });
});
describe('SAMProviderState', () => {
    it('should have required state properties', () => {
        const state = {
            context: {},
            state: 'idle',
            isOpen: false,
            isProcessing: false,
            isStreaming: false,
            messages: [],
            error: null,
            lastResult: null,
        };
        expect(state.state).toBe('idle');
        expect(state.isOpen).toBe(false);
        expect(state.messages).toEqual([]);
    });
});
describe('UseSAMReturn', () => {
    it('should extend SAMProviderState with actions', () => {
        const mockReturn = {
            context: {},
            state: 'idle',
            isOpen: false,
            isProcessing: false,
            isStreaming: false,
            messages: [],
            error: null,
            lastResult: null,
            suggestions: [],
            actions: [],
            open: () => { },
            close: () => { },
            toggle: () => { },
            sendMessage: async () => null,
            clearMessages: () => { },
            clearError: () => { },
            updateContext: () => { },
            updatePage: () => { },
            updateForm: () => { },
            analyze: async () => null,
            getBloomsAnalysis: () => null,
            executeAction: async () => { },
        };
        expect(mockReturn.open).toBeDefined();
        expect(mockReturn.sendMessage).toBeDefined();
        expect(mockReturn.analyze).toBeDefined();
    });
});
describe('UseSAMContextReturn', () => {
    it('should have context manipulation methods', () => {
        const mockReturn = {
            context: {},
            updateContext: () => { },
            updatePage: () => { },
            updateUser: () => { },
            detectPageContext: () => { },
        };
        expect(mockReturn.updateContext).toBeDefined();
        expect(mockReturn.detectPageContext).toBeDefined();
    });
});
describe('UseSAMChatReturn', () => {
    it('should have chat-specific properties', () => {
        const mockReturn = {
            messages: [],
            isProcessing: false,
            isStreaming: false,
            sendMessage: async () => null,
            clearMessages: () => { },
            suggestions: [],
        };
        expect(mockReturn.messages).toEqual([]);
        expect(mockReturn.sendMessage).toBeDefined();
    });
});
describe('UseSAMActionsReturn', () => {
    it('should have action-specific properties', () => {
        const mockReturn = {
            actions: [],
            executeAction: async () => { },
            isExecuting: false,
            lastActionResult: null,
        };
        expect(mockReturn.actions).toEqual([]);
        expect(mockReturn.executeAction).toBeDefined();
    });
});
describe('UseSAMFormReturn', () => {
    it('should have form-specific properties', () => {
        const mockReturn = {
            fields: {},
            updateFields: () => { },
            syncFormToSAM: () => { },
            autoFillField: () => { },
            getFieldSuggestions: async () => [],
        };
        expect(mockReturn.fields).toEqual({});
        expect(mockReturn.syncFormToSAM).toBeDefined();
    });
});
describe('UseSAMAnalysisReturn', () => {
    it('should have analysis-specific properties', () => {
        const mockReturn = {
            analyze: async () => null,
            isAnalyzing: false,
            lastAnalysis: null,
            bloomsAnalysis: null,
        };
        expect(mockReturn.analyze).toBeDefined();
        expect(mockReturn.isAnalyzing).toBe(false);
    });
});
describe('SAMPageLink', () => {
    it('should have href as required field', () => {
        const link = {
            href: '/courses/123',
        };
        expect(link.href).toBe('/courses/123');
    });
    it('should accept optional metadata', () => {
        const link = {
            href: '/courses/123',
            text: 'Course Link',
            ariaLabel: 'Navigate to course',
            title: 'Course Title',
            rel: 'noopener',
            target: '_blank',
        };
        expect(link.text).toBe('Course Link');
        expect(link.target).toBe('_blank');
    });
});
describe('UseSAMPageLinksOptions', () => {
    it('should have optional configuration', () => {
        const options = {
            enabled: true,
            selector: 'a[href]',
            maxLinks: 50,
            includeHidden: false,
        };
        expect(options.enabled).toBe(true);
        expect(options.maxLinks).toBe(50);
    });
});
describe('UseSAMPageLinksReturn', () => {
    it('should have links array and refresh function', () => {
        const mockReturn = {
            links: [],
            refresh: () => { },
        };
        expect(mockReturn.links).toEqual([]);
        expect(mockReturn.refresh).toBeDefined();
    });
});
describe('UseSAMFormDataSyncOptions', () => {
    it('should have optional configuration', () => {
        const options = {
            formName: 'registration',
            debounceMs: 300,
            enabled: true,
            formType: 'course-create',
        };
        expect(options.formName).toBe('registration');
        expect(options.enabled).toBe(true);
    });
});
describe('UseSAMFormDataSyncReturn', () => {
    it('should have sync function', () => {
        const mockReturn = {
            sync: () => { },
        };
        expect(mockReturn.sync).toBeDefined();
    });
});
describe('SAMFormDataEventDetail', () => {
    it('should have form data', () => {
        const detail = {
            formId: 'form-1',
            formData: { field1: 'value1', field2: 'value2' },
        };
        expect(detail.formId).toBe('form-1');
        expect(detail.formData.field1).toBe('value1');
    });
});
describe('UseSAMFormDataEventsOptions', () => {
    it('should have optional configuration', () => {
        const options = {
            enabled: true,
        };
        expect(options.enabled).toBe(true);
    });
});
describe('UseSAMFormDataEventsReturn', () => {
    it('should have last payload', () => {
        const mockReturn = {
            lastPayload: null,
        };
        expect(mockReturn.lastPayload).toBeNull();
    });
});
describe('UseSAMFormAutoDetectOptions', () => {
    it('should have optional configuration', () => {
        const options = {
            enabled: true,
            selector: 'input, select, textarea',
            maxFields: 100,
        };
        expect(options.enabled).toBe(true);
        expect(options.maxFields).toBe(100);
    });
});
describe('UseSAMFormAutoDetectReturn', () => {
    it('should have form context and refresh', () => {
        const mockReturn = {
            formContext: null,
            refresh: () => { },
        };
        expect(mockReturn.formContext).toBeNull();
        expect(mockReturn.refresh).toBeDefined();
    });
});
describe('UseSAMFormAutoFillOptions', () => {
    it('should have optional configuration', () => {
        const options = {
            triggerEvents: true,
            onFill: () => { },
        };
        expect(options.triggerEvents).toBe(true);
        expect(options.onFill).toBeDefined();
    });
});
describe('UseSAMFormAutoFillReturn', () => {
    it('should have fill and resolve functions', () => {
        const mockReturn = {
            fillField: () => true,
            resolveField: () => null,
        };
        expect(mockReturn.fillField('field', 'value')).toBe(true);
        expect(mockReturn.resolveField).toBeDefined();
    });
});
describe('PageContextDetection', () => {
    it('should have required fields', () => {
        const detection = {
            type: 'course-detail',
            path: '/courses/123',
            capabilities: ['analyze-course'],
            breadcrumb: ['Courses', 'Course 123'],
        };
        expect(detection.type).toBe('course-detail');
        expect(detection.capabilities.length).toBe(1);
    });
    it('should accept optional entity IDs', () => {
        const detection = {
            type: 'chapter-detail',
            entityId: 'chapter-123',
            parentEntityId: 'course-456',
            path: '/courses/456/chapters/123',
            capabilities: [],
            breadcrumb: [],
        };
        expect(detection.entityId).toBe('chapter-123');
        expect(detection.parentEntityId).toBe('course-456');
    });
});
describe('ContextDetectorOptions', () => {
    it('should have optional configuration', () => {
        const options = {
            routePatterns: { '/custom': 'dashboard' },
            detectFromDOM: true,
        };
        expect(options.routePatterns).toBeDefined();
        expect(options.detectFromDOM).toBe(true);
    });
});
describe('FormSyncOptions', () => {
    it('should have form reference', () => {
        const options = {
            form: '#my-form',
            autoSync: true,
            debounceMs: 300,
        };
        expect(options.form).toBe('#my-form');
        expect(options.autoSync).toBe(true);
    });
});
describe('FormAutoFillOptions', () => {
    it('should have field ID', () => {
        const options = {
            fieldId: 'email',
            triggerEvents: true,
            animate: true,
        };
        expect(options.fieldId).toBe('email');
        expect(options.triggerEvents).toBe(true);
    });
});
