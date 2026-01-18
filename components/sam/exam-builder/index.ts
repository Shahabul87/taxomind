/**
 * ExamBuilder Components
 *
 * Enterprise-level exam building UI with Bloom's Taxonomy integration,
 * question bank browser, and AI-powered generation.
 *
 * @module components/sam/exam-builder
 */

// Main component
export { ExamBuilder } from './ExamBuilder';
export type { ExamBuilderProps } from './ExamBuilder';

// Sub-components
export { BloomsDistributionPicker } from './BloomsDistributionPicker';
export type { BloomsDistributionPickerProps, BloomsDistribution } from './BloomsDistributionPicker';

export { QuestionBankBrowser } from './QuestionBankBrowser';
export type { QuestionBankBrowserProps } from './QuestionBankBrowser';

export { ExamPreview } from './ExamPreview';
export type { ExamPreviewProps } from './ExamPreview';
