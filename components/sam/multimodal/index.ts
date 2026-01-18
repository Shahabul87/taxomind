/**
 * Multimodal Input Components
 *
 * Enterprise-level multimodal input interface supporting:
 * - Voice recording with real-time waveform
 * - Image upload with OCR and analysis
 * - Handwriting canvas with recognition
 * - PDF document processing
 *
 * @module components/sam/multimodal
 */

// Main component
export { MultimodalInputPanel } from "./MultimodalInputPanel";
export type {
  MultimodalInputPanelProps,
  ProcessedResult,
} from "./MultimodalInputPanel";

// Sub-components
export { VoiceRecorder } from "./VoiceRecorder";
export type { VoiceRecorderProps } from "./VoiceRecorder";

export { ImageUploader } from "./ImageUploader";
export type { ImageUploaderProps } from "./ImageUploader";

export { HandwritingCanvas } from "./HandwritingCanvas";
export type { HandwritingCanvasProps } from "./HandwritingCanvas";

export { PDFUploader } from "./PDFUploader";
export type { PDFUploaderProps } from "./PDFUploader";
