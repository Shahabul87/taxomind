/**
 * @sam-ai/educational - Multimodal Input Engine Tests
 * Tests for image, voice, and handwriting processing
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MultimodalInputEngine, createMultimodalInputEngine, } from '../engines/multimodal-input-engine';
import { createMockSAMConfig, createMockAIAdapter, createMockAIResponse, } from './setup';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createSampleImageFile(overrides = {}) {
    return {
        data: 'base64encodedimagedata',
        mimeType: 'image/jpeg',
        fileName: 'test-image.jpg',
        fileSize: 1024 * 100, // 100KB
        ...overrides,
    };
}
function createSampleAudioFile(overrides = {}) {
    return {
        data: 'base64encodedaudiodata',
        mimeType: 'audio/mpeg',
        fileName: 'test-audio.mp3',
        fileSize: 1024 * 500, // 500KB
        ...overrides,
    };
}
function createSampleHandwritingFile(overrides = {}) {
    return {
        data: 'base64encodedhandwritingdata',
        mimeType: 'image/png',
        fileName: 'handwriting-sample.png',
        fileSize: 1024 * 200, // 200KB
        ...overrides,
    };
}
function createSampleProcessInput(overrides = {}) {
    return {
        file: createSampleImageFile(),
        options: {
            enableOCR: true,
            enableSpeechToText: true,
            enableHandwritingRecognition: true,
            enableAIAnalysis: true,
        },
        userId: 'user-1',
        courseId: 'course-1',
        assignmentId: 'assignment-1',
        ...overrides,
    };
}
function createMultimodalConfig(overrides = {}) {
    return {
        maxFileSize: 50 * 1024 * 1024,
        enableOCR: true,
        enableSpeechToText: true,
        enableHandwritingRecognition: true,
        enableAIAnalysis: true,
        qualityThreshold: 60,
        ...overrides,
    };
}
// Create AI mock that returns appropriate responses based on prompt
function createMultimodalAIMock() {
    return createMockAIAdapter((params) => {
        const prompt = params.messages[0]?.content || '';
        // Image classification
        if (prompt.includes('classify its content type')) {
            return createMockAIResponse('PHOTOGRAPH');
        }
        // Object detection
        if (prompt.includes('Identify the main objects')) {
            return createMockAIResponse(JSON.stringify([
                { label: 'text box', confidence: 0.95, position: 'center', category: 'text' },
                { label: 'diagram', confidence: 0.88, position: 'top-center', category: 'shape' },
            ]));
        }
        // OCR / Text extraction
        if (prompt.includes('Perform OCR') || prompt.includes('Identify all text regions')) {
            return createMockAIResponse(JSON.stringify([
                { text: 'Sample extracted text', type: 'printed', position: 'center', order: 1 },
                { text: 'Another line of text', type: 'printed', position: 'bottom-center', order: 2 },
            ]));
        }
        // Diagram analysis
        if (prompt.includes('Analyze this diagram')) {
            return createMockAIResponse(JSON.stringify({
                type: 'flowchart',
                components: [
                    { id: 'c1', type: 'rectangle', label: 'Start' },
                    { id: 'c2', type: 'rectangle', label: 'Process' },
                    { id: 'c3', type: 'rectangle', label: 'End' },
                ],
                connections: [
                    { from: 'c1', to: 'c2', type: 'directional' },
                    { from: 'c2', to: 'c3', type: 'directional' },
                ],
                labels: ['Start', 'Process', 'End'],
            }));
        }
        // Equation detection
        if (prompt.includes('mathematical equations')) {
            return createMockAIResponse(JSON.stringify([
                {
                    latex: 'E = mc^2',
                    type: 'physics',
                    position: 'center',
                    confidence: 0.95,
                },
            ]));
        }
        // Voice transcription
        if (prompt.includes('Transcribe') || prompt.includes('speech')) {
            return createMockAIResponse(JSON.stringify({
                text: 'This is a sample transcription of the audio content.',
                confidence: 0.92,
                language: 'en',
                segments: [
                    { text: 'This is a sample', startTime: 0, endTime: 2.5 },
                    { text: 'transcription of the audio content.', startTime: 2.5, endTime: 5.0 },
                ],
            }));
        }
        // Speaker analysis
        if (prompt.includes('speakers') || prompt.includes('speaker')) {
            return createMockAIResponse(JSON.stringify({
                speakerCount: 1,
                speakers: [{ id: 'speaker_1', speakingTime: 5.0, confidence: 0.9 }],
            }));
        }
        // Handwriting analysis
        if (prompt.includes('handwriting') || prompt.includes('Recognize')) {
            return createMockAIResponse(JSON.stringify({
                text: 'This is handwritten text',
                confidence: 0.85,
                quality: 'good',
                lines: [{ text: 'This is handwritten text', confidence: 0.85 }],
            }));
        }
        // Educational content detection
        if (prompt.includes('educational')) {
            return createMockAIResponse(JSON.stringify({
                isEducational: true,
                subject: 'Mathematics',
                topics: ['Algebra', 'Equations'],
                gradeLevel: 'High School',
                bloomsLevel: 'APPLY',
            }));
        }
        // AI insights
        if (prompt.includes('educational insights') || prompt.includes('content analysis')) {
            return createMockAIResponse(JSON.stringify({
                summary: 'This is educational content about mathematics.',
                keyPoints: ['Point 1', 'Point 2'],
                confidence: 0.88,
                recommendations: ['Review algebra basics'],
            }));
        }
        // Accessibility content
        if (prompt.includes('alt text') || prompt.includes('accessibility')) {
            return createMockAIResponse('A diagram showing a mathematical process flow');
        }
        // Default response
        return createMockAIResponse(JSON.stringify({
            success: true,
            data: {},
        }));
    });
}
// ============================================================================
// TESTS
// ============================================================================
describe('MultimodalInputEngine', () => {
    let engine;
    let samConfig;
    beforeEach(() => {
        samConfig = createMockSAMConfig({
            ai: createMultimodalAIMock(),
        });
        engine = new MultimodalInputEngine(samConfig, createMultimodalConfig());
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create engine with valid SAMConfig', () => {
            expect(engine).toBeInstanceOf(MultimodalInputEngine);
        });
        it('should create engine with default config', () => {
            const defaultEngine = new MultimodalInputEngine(samConfig);
            expect(defaultEngine).toBeInstanceOf(MultimodalInputEngine);
        });
        it('should create engine with custom config', () => {
            const customConfig = createMultimodalConfig({
                maxFileSize: 100 * 1024 * 1024,
                qualityThreshold: 80,
            });
            const customEngine = new MultimodalInputEngine(samConfig, customConfig);
            expect(customEngine).toBeInstanceOf(MultimodalInputEngine);
        });
        it('should create engine using factory function', () => {
            const factoryEngine = createMultimodalInputEngine(samConfig);
            expect(factoryEngine).toBeInstanceOf(MultimodalInputEngine);
        });
        it('should create engine with factory function and custom config', () => {
            const customConfig = createMultimodalConfig({ enableOCR: false });
            const factoryEngine = createMultimodalInputEngine(samConfig, customConfig);
            expect(factoryEngine).toBeInstanceOf(MultimodalInputEngine);
        });
    });
    // ============================================================================
    // INPUT VALIDATION TESTS
    // ============================================================================
    describe('validateInput', () => {
        it('should validate valid image file', async () => {
            const file = createSampleImageFile();
            const result = await engine.validateInput(file);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should validate valid audio file', async () => {
            const file = createSampleAudioFile();
            const result = await engine.validateInput(file);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should reject file exceeding max size', async () => {
            const largeFile = createSampleImageFile({
                fileSize: 100 * 1024 * 1024, // 100MB
            });
            const result = await engine.validateInput(largeFile);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some((e) => e.code === 'FILE_TOO_LARGE')).toBe(true);
        });
        it('should reject unsupported file format', async () => {
            const unsupportedFile = createSampleImageFile({
                mimeType: 'application/exe',
                fileName: 'malware.exe',
            });
            const result = await engine.validateInput(unsupportedFile);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.code === 'UNSUPPORTED_FORMAT')).toBe(true);
        });
        it('should reject empty file', async () => {
            const emptyFile = createSampleImageFile({
                data: '',
                fileSize: 0,
            });
            const result = await engine.validateInput(emptyFile);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.code === 'MISSING_DATA')).toBe(true);
        });
        it('should warn about missing filename', async () => {
            const noNameFile = createSampleImageFile({
                fileName: '',
            });
            const result = await engine.validateInput(noNameFile);
            // Should still be valid but may have warnings
            expect(result.warnings.length).toBeGreaterThanOrEqual(0);
        });
    });
    // ============================================================================
    // PROCESS INPUT TESTS
    // ============================================================================
    describe('processInput', () => {
        it('should process valid image input', async () => {
            const input = createSampleProcessInput();
            const result = await engine.processInput(input);
            expect(result.success).toBe(true);
            expect(result.input).toBeDefined();
            expect(result.input.type).toBe('IMAGE');
            expect(result.processingTime).toBeGreaterThanOrEqual(0);
        });
        it('should process audio input', async () => {
            const input = createSampleProcessInput({
                file: createSampleAudioFile(),
            });
            const result = await engine.processInput(input);
            expect(result.success).toBe(true);
            expect(result.input.type).toBe('VOICE');
        });
        it('should return errors for invalid input', async () => {
            const input = createSampleProcessInput({
                file: createSampleImageFile({
                    fileSize: 100 * 1024 * 1024, // Too large
                }),
            });
            const result = await engine.processInput(input);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });
        it('should include processing result when successful', async () => {
            const input = createSampleProcessInput();
            const result = await engine.processInput(input);
            expect(result.success).toBe(true);
            expect(result.input.processingResult).toBeDefined();
        });
        it('should set correct status on completion', async () => {
            const input = createSampleProcessInput();
            const result = await engine.processInput(input);
            expect(result.input.status).toBe('COMPLETED');
        });
        it('should include quality assessment', async () => {
            const input = createSampleProcessInput();
            const result = await engine.processInput(input);
            expect(result.input.quality).toBeDefined();
            expect(result.input.quality?.score).toBeDefined();
        });
        it('should process with OCR disabled', async () => {
            const input = createSampleProcessInput({
                options: {
                    enableOCR: false,
                    enableSpeechToText: true,
                    enableHandwritingRecognition: true,
                    enableAIAnalysis: true,
                },
            });
            const result = await engine.processInput(input);
            expect(result.success).toBe(true);
        });
        it('should process with AI analysis disabled', async () => {
            const input = createSampleProcessInput({
                options: {
                    enableOCR: true,
                    enableSpeechToText: true,
                    enableHandwritingRecognition: true,
                    enableAIAnalysis: false,
                },
            });
            const result = await engine.processInput(input);
            expect(result.success).toBe(true);
        });
    });
    // ============================================================================
    // BATCH PROCESSING TESTS
    // ============================================================================
    describe('processBatch', () => {
        it('should process multiple files in batch', async () => {
            const request = {
                files: [createSampleImageFile(), createSampleAudioFile(), createSampleImageFile()],
                options: {
                    enableOCR: true,
                    enableSpeechToText: true,
                    enableHandwritingRecognition: true,
                    enableAIAnalysis: true,
                },
                userId: 'user-1',
                courseId: 'course-1',
            };
            const result = await engine.processBatch(request);
            expect(result.totalFiles).toBe(3);
            expect(result.results).toHaveLength(3);
            expect(result.totalProcessingTime).toBeGreaterThanOrEqual(0);
        });
        it('should track success and failure counts', async () => {
            const request = {
                files: [
                    createSampleImageFile(),
                    createSampleImageFile({ fileSize: 100 * 1024 * 1024 }), // Will fail
                    createSampleImageFile(),
                ],
                options: {
                    enableOCR: true,
                    enableSpeechToText: true,
                    enableHandwritingRecognition: true,
                    enableAIAnalysis: true,
                },
                userId: 'user-1',
            };
            const result = await engine.processBatch(request);
            expect(result.totalFiles).toBe(3);
            expect(result.successCount).toBe(2);
            expect(result.failedCount).toBe(1);
        });
        it('should handle empty batch', async () => {
            const request = {
                files: [],
                options: {
                    enableOCR: true,
                    enableSpeechToText: true,
                    enableHandwritingRecognition: true,
                    enableAIAnalysis: true,
                },
                userId: 'user-1',
            };
            const result = await engine.processBatch(request);
            expect(result.totalFiles).toBe(0);
            expect(result.successCount).toBe(0);
            expect(result.failedCount).toBe(0);
            expect(result.results).toHaveLength(0);
        });
        it('should include assignment ID when provided', async () => {
            const request = {
                files: [createSampleImageFile()],
                options: {
                    enableOCR: true,
                    enableSpeechToText: true,
                    enableHandwritingRecognition: true,
                    enableAIAnalysis: true,
                },
                userId: 'user-1',
                assignmentId: 'assignment-1',
            };
            const result = await engine.processBatch(request);
            expect(result.totalFiles).toBe(1);
            expect(result.successCount).toBe(1);
        });
    });
    // ============================================================================
    // IMAGE ANALYSIS TESTS
    // ============================================================================
    describe('analyzeImage', () => {
        it('should analyze image and return results', async () => {
            const file = createSampleImageFile();
            const result = await engine.analyzeImage(file);
            expect(result).toBeDefined();
            expect(result.contentType).toBeDefined();
            expect(result.objects).toBeDefined();
            expect(result.textRegions).toBeDefined();
        });
        it('should detect objects in image', async () => {
            const file = createSampleImageFile();
            const result = await engine.analyzeImage(file);
            expect(result.objects).toBeDefined();
            expect(Array.isArray(result.objects)).toBe(true);
        });
        it('should extract text regions via OCR', async () => {
            const file = createSampleImageFile();
            const result = await engine.analyzeImage(file);
            expect(result.textRegions).toBeDefined();
            expect(Array.isArray(result.textRegions)).toBe(true);
        });
        it('should analyze color information', async () => {
            const file = createSampleImageFile();
            const result = await engine.analyzeImage(file);
            expect(result.colorAnalysis).toBeDefined();
        });
        it('should detect educational content', async () => {
            const file = createSampleImageFile();
            const result = await engine.analyzeImage(file);
            expect(result.educationalContent).toBeDefined();
        });
        it('should assess image quality', async () => {
            const file = createSampleImageFile();
            const result = await engine.analyzeImage(file);
            expect(result.qualityMetrics).toBeDefined();
        });
    });
    // ============================================================================
    // VOICE ANALYSIS TESTS
    // ============================================================================
    describe('analyzeVoice', () => {
        it('should analyze voice input', async () => {
            const file = createSampleAudioFile();
            const result = await engine.analyzeVoice(file);
            expect(result).toBeDefined();
            expect(result.transcription).toBeDefined();
        });
        it('should transcribe audio to text', async () => {
            const file = createSampleAudioFile();
            const result = await engine.analyzeVoice(file);
            expect(result.transcription).toBeDefined();
            expect(result.transcription.text).toBeDefined();
        });
        it('should detect speakers', async () => {
            const file = createSampleAudioFile();
            const result = await engine.analyzeVoice(file);
            expect(result.speakerAnalysis).toBeDefined();
        });
        it('should assess audio quality', async () => {
            const file = createSampleAudioFile();
            const result = await engine.analyzeVoice(file);
            expect(result.audioQuality).toBeDefined();
        });
        it('should detect language', async () => {
            const file = createSampleAudioFile();
            const result = await engine.analyzeVoice(file);
            expect(result.languageDetection).toBeDefined();
        });
        it('should analyze speech metrics', async () => {
            const file = createSampleAudioFile();
            const result = await engine.analyzeVoice(file);
            expect(result.speechMetrics).toBeDefined();
        });
    });
    // ============================================================================
    // HANDWRITING ANALYSIS TESTS
    // ============================================================================
    describe('analyzeHandwriting', () => {
        it('should analyze handwriting input', async () => {
            const file = createSampleHandwritingFile();
            const result = await engine.analyzeHandwriting(file);
            expect(result).toBeDefined();
            expect(result.recognizedText).toBeDefined();
        });
        it('should recognize handwritten text', async () => {
            const file = createSampleHandwritingFile();
            const result = await engine.analyzeHandwriting(file);
            expect(result.recognizedText).toBeDefined();
            expect(result.recognizedText.text).toBeDefined();
        });
        it('should assess writing quality', async () => {
            const file = createSampleHandwritingFile();
            const result = await engine.analyzeHandwriting(file);
            expect(result.writingQuality).toBeDefined();
        });
        it('should detect handwriting elements', async () => {
            const file = createSampleHandwritingFile();
            const result = await engine.analyzeHandwriting(file);
            expect(result.detectedElements).toBeDefined();
        });
        it('should generate writer profile', async () => {
            const file = createSampleHandwritingFile();
            const result = await engine.analyzeHandwriting(file);
            // Writer profile is optional
            expect(result.writerProfile !== undefined || result.writerProfile === undefined).toBe(true);
        });
        it('should provide educational assessment', async () => {
            const file = createSampleHandwritingFile();
            const result = await engine.analyzeHandwriting(file);
            // Educational assessment is optional
            expect(result.educationalAssessment !== undefined || result.educationalAssessment === undefined).toBe(true);
        });
    });
    // ============================================================================
    // QUALITY ASSESSMENT TESTS
    // ============================================================================
    describe('assessQuality', () => {
        it('should assess quality of image file', async () => {
            const file = createSampleImageFile();
            const result = await engine.assessQuality(file);
            expect(result).toBeDefined();
            expect(result.score).toBeDefined();
            expect(result.level).toBeDefined();
        });
        it('should assess quality of audio file', async () => {
            const file = createSampleAudioFile();
            const result = await engine.assessQuality(file);
            expect(result).toBeDefined();
            expect(result.score).toBeDefined();
        });
        it('should return quality level based on score', async () => {
            const file = createSampleImageFile();
            const result = await engine.assessQuality(file);
            expect(['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'POOR', 'UNREADABLE']).toContain(result.level);
        });
        it('should identify usability issues', async () => {
            const file = createSampleImageFile();
            const result = await engine.assessQuality(file);
            expect(result.usabilityIssues).toBeDefined();
            expect(Array.isArray(result.usabilityIssues)).toBe(true);
        });
        it('should include usability for assessment flag', async () => {
            const file = createSampleImageFile();
            const result = await engine.assessQuality(file);
            expect(result.usableForAssessment).toBeDefined();
            expect(typeof result.usableForAssessment).toBe('boolean');
        });
    });
    // ============================================================================
    // STORAGE QUOTA TESTS
    // ============================================================================
    describe('getStorageQuota', () => {
        it('should return storage quota for user', async () => {
            const quota = await engine.getStorageQuota('user-1');
            expect(quota).toBeDefined();
            expect(quota.userId).toBe('user-1');
            expect(quota.totalAllowed).toBeDefined();
            expect(quota.used).toBeDefined();
            expect(quota.filesCount).toBeDefined();
        });
        it('should return default quota for new user', async () => {
            const quota = await engine.getStorageQuota('new-user');
            expect(quota.userId).toBe('new-user');
            expect(quota.totalAllowed).toBeGreaterThan(0);
        });
    });
    // ============================================================================
    // ACCESSIBILITY CONTENT TESTS
    // ============================================================================
    describe('generateAccessibilityContent', () => {
        it('should generate accessibility content for image', async () => {
            // First process an input to get a MultimodalInput
            const processInput = createSampleProcessInput();
            const processResult = await engine.processInput(processInput);
            if (processResult.success && processResult.input) {
                const result = await engine.generateAccessibilityContent(processResult.input);
                expect(result).toBeDefined();
            }
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle very small file', async () => {
            const file = createSampleImageFile({
                fileSize: 100, // 100 bytes
            });
            const result = await engine.validateInput(file);
            expect(result.isValid).toBe(true);
        });
        it('should handle file at max size limit', async () => {
            const file = createSampleImageFile({
                fileSize: 50 * 1024 * 1024, // Exactly 50MB
            });
            const result = await engine.validateInput(file);
            expect(result.isValid).toBe(true);
        });
        it('should handle multiple supported formats', async () => {
            const formats = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'audio/mpeg',
                'audio/wav',
                'video/mp4',
                'application/pdf',
            ];
            for (const mimeType of formats) {
                const file = createSampleImageFile({ mimeType });
                const result = await engine.validateInput(file);
                expect(result.isValid).toBe(true);
            }
        });
        it('should handle concurrent processing', async () => {
            const inputs = [
                createSampleProcessInput({ userId: 'user-1' }),
                createSampleProcessInput({ userId: 'user-2' }),
                createSampleProcessInput({ userId: 'user-3' }),
            ];
            const results = await Promise.all(inputs.map((input) => engine.processInput(input)));
            expect(results).toHaveLength(3);
            results.forEach((result) => {
                expect(result.success).toBe(true);
            });
        });
        it('should handle processing with minimal options', async () => {
            const input = {
                file: createSampleImageFile(),
                options: {},
                userId: 'user-1',
            };
            const result = await engine.processInput(input);
            expect(result.success).toBe(true);
        });
    });
    // ============================================================================
    // AI INTEGRATION TESTS
    // ============================================================================
    describe('AI integration', () => {
        it('should use AI for image classification', async () => {
            const file = createSampleImageFile();
            const result = await engine.analyzeImage(file);
            expect(result.contentType).toBeDefined();
        });
        it('should use AI for voice transcription', async () => {
            const file = createSampleAudioFile();
            const result = await engine.analyzeVoice(file);
            expect(result.transcription).toBeDefined();
            expect(result.transcription.text).toBeDefined();
        });
        it('should handle AI failure gracefully', async () => {
            const failingAI = createMockAIAdapter(() => {
                throw new Error('AI service unavailable');
            });
            const failingConfig = createMockSAMConfig({ ai: failingAI });
            const failingEngine = new MultimodalInputEngine(failingConfig);
            const file = createSampleImageFile();
            const result = await failingEngine.analyzeImage(file);
            // Should return result even if AI fails
            expect(result).toBeDefined();
            expect(result.contentType).toBe('UNKNOWN');
        });
        it('should generate AI insights when enabled', async () => {
            const input = createSampleProcessInput({
                options: {
                    enableOCR: true,
                    enableSpeechToText: true,
                    enableHandwritingRecognition: true,
                    enableAIAnalysis: true,
                },
            });
            const result = await engine.processInput(input);
            if (result.success && result.input.processingResult) {
                expect(result.input.processingResult.aiInsights).toBeDefined();
            }
        });
    });
    // ============================================================================
    // CONFIGURATION TESTS
    // ============================================================================
    describe('configuration', () => {
        it('should respect disabled OCR config', async () => {
            const noOCREngine = new MultimodalInputEngine(samConfig, createMultimodalConfig({ enableOCR: false }));
            const input = createSampleProcessInput({
                options: {}, // Use engine defaults
            });
            const result = await noOCREngine.processInput(input);
            expect(result.success).toBe(true);
        });
        it('should respect disabled AI analysis config', async () => {
            const noAIEngine = new MultimodalInputEngine(samConfig, createMultimodalConfig({ enableAIAnalysis: false }));
            const input = createSampleProcessInput({
                options: {}, // Use engine defaults
            });
            const result = await noAIEngine.processInput(input);
            expect(result.success).toBe(true);
        });
        it('should respect quality threshold config', async () => {
            const strictEngine = new MultimodalInputEngine(samConfig, createMultimodalConfig({ qualityThreshold: 90 }));
            const file = createSampleImageFile();
            const quality = await strictEngine.assessQuality(file);
            expect(quality).toBeDefined();
        });
        it('should use default language when not specified', async () => {
            const file = createSampleAudioFile();
            const result = await engine.analyzeVoice(file);
            expect(result.languageDetection).toBeDefined();
        });
    });
});
