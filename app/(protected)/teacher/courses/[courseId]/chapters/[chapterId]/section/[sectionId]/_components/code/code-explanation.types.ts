/**
 * Code Explanation Types
 *
 * Type definitions for the Code Explanation Editor feature.
 * Supports granular line-by-line code explanations with Monaco Editor.
 */

// ============================================
// Core Types
// ============================================

/**
 * Represents a range of line numbers in the code
 */
export interface LineRange {
  start: number;
  end: number;
}

/**
 * State for line selection in Monaco Editor
 */
export interface LineSelection {
  range: LineRange | null;
  isSelecting: boolean;
}

/**
 * Supported programming languages
 */
export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "csharp"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin";

export const SUPPORTED_LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

// ============================================
// Database Model Types
// ============================================

/**
 * Raw CodeExplanation from database
 */
export interface CodeExplanationRecord {
  id: string;
  title: string;
  code: string;
  explanation: string | null;
  language: string;
  position: number;
  lineStart: number | null;
  lineEnd: number | null;
  sectionId: string;
  groupId: string | null;
  isPublished: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// UI Component Types
// ============================================

/**
 * A single line explanation linked to a code block
 */
export interface LineExplanation {
  id: string;
  title: string;
  explanation: string;
  lineStart: number;
  lineEnd: number;
  position: number;
}

/**
 * A code block with its associated line explanations
 */
export interface CodeExplanationGroup {
  id: string;
  title: string;
  code: string;
  language: SupportedLanguage;
  sectionId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  explanations: LineExplanation[];
}

/**
 * Form data for creating a new explanation
 */
export interface AddExplanationFormData {
  title: string;
  explanation: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Form data for creating a code block with explanations
 */
export interface CreateCodeBlockFormData {
  title: string;
  code: string;
  language: SupportedLanguage;
  explanations?: AddExplanationFormData[];
}

/**
 * Form data for updating an explanation
 */
export interface UpdateExplanationFormData {
  title?: string;
  explanation?: string;
  lineStart?: number;
  lineEnd?: number;
}

// ============================================
// Component Props
// ============================================

/**
 * Props for the main CodeExplanationEditor container
 */
export interface CodeExplanationEditorProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData?: CodeExplanationGroup | null;
  onSave?: () => void;
  onCancel?: () => void;
}

/**
 * Props for the Monaco code pane
 */
export interface MonacoCodePaneProps {
  code: string;
  language: SupportedLanguage;
  explanations: LineExplanation[];
  selectedRange: LineRange | null;
  onCodeChange: (code: string) => void;
  onLineSelect: (range: LineRange) => void;
  onExplanationHover: (explanation: LineExplanation | null) => void;
  readOnly?: boolean;
}

/**
 * Props for the explanation pane
 */
export interface ExplanationPaneProps {
  explanations: LineExplanation[];
  selectedRange: LineRange | null;
  highlightedExplanation: LineExplanation | null;
  onAddExplanation: (data: AddExplanationFormData) => void;
  onEditExplanation: (id: string, data: UpdateExplanationFormData) => void;
  onDeleteExplanation: (id: string) => void;
  onExplanationClick: (explanation: LineExplanation) => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

/**
 * Props for individual explanation item
 */
export interface ExplanationItemProps {
  explanation: LineExplanation;
  isHighlighted: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

// ============================================
// Student View Types
// ============================================

/**
 * Props for the interactive code viewer (student side)
 */
export interface InteractiveCodeViewerProps {
  codeBlock: CodeExplanationGroup;
  onExplanationSelect?: (explanation: LineExplanation | null) => void;
}

/**
 * Props for the code explanation panel (student side)
 */
export interface CodeExplanationPanelProps {
  explanation: LineExplanation | null;
  explanations: LineExplanation[];
  onNavigate: (direction: "prev" | "next") => void;
  onClose: () => void;
}

// ============================================
// API Types
// ============================================

/**
 * Request body for creating a code block with explanations
 */
export interface CreateCodeBlockWithExplanationsRequest {
  mainBlock: {
    title: string;
    code: string;
    language: string;
  };
  explanations: {
    title: string;
    explanation: string;
    lineStart: number;
    lineEnd: number;
  }[];
}

/**
 * Request body for adding an explanation to existing code block
 */
export interface AddExplanationRequest {
  title: string;
  explanation: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Response for grouped code explanations
 */
export interface GroupedCodeExplanationsResponse {
  success: boolean;
  data: CodeExplanationGroup[];
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// Hook Types
// ============================================

/**
 * Return type for useCodeExplanations hook
 */
export interface UseCodeExplanationsReturn {
  codeBlocks: CodeExplanationGroup[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createCodeBlock: (data: CreateCodeBlockFormData) => Promise<CodeExplanationGroup>;
  addExplanation: (codeBlockId: string, data: AddExplanationFormData) => Promise<LineExplanation>;
  updateExplanation: (explanationId: string, data: UpdateExplanationFormData) => Promise<LineExplanation>;
  deleteExplanation: (explanationId: string) => Promise<void>;
  deleteCodeBlock: (codeBlockId: string) => Promise<void>;
  updateCodeBlock: (codeBlockId: string, data: Partial<CreateCodeBlockFormData>) => Promise<CodeExplanationGroup>;
}

/**
 * Return type for useLineSelection hook
 */
export interface UseLineSelectionReturn {
  selectedRange: LineRange | null;
  isSelecting: boolean;
  startSelection: (lineNumber: number) => void;
  extendSelection: (lineNumber: number) => void;
  endSelection: () => void;
  clearSelection: () => void;
  setSelection: (range: LineRange) => void;
}

// ============================================
// Utility Types
// ============================================

/**
 * Check if two line ranges overlap
 */
export function doRangesOverlap(range1: LineRange, range2: LineRange): boolean {
  return range1.start <= range2.end && range2.start <= range1.end;
}

/**
 * Check if a line number is within a range
 */
export function isLineInRange(lineNumber: number, range: LineRange): boolean {
  return lineNumber >= range.start && lineNumber <= range.end;
}

/**
 * Get a normalized range (start <= end)
 */
export function normalizeRange(range: LineRange): LineRange {
  return {
    start: Math.min(range.start, range.end),
    end: Math.max(range.start, range.end),
  };
}

/**
 * Format line range for display
 */
export function formatLineRange(range: LineRange): string {
  if (range.start === range.end) {
    return `Line ${range.start}`;
  }
  return `Lines ${range.start}-${range.end}`;
}

/**
 * Generate a unique color for an explanation based on its index
 * Higher opacity for better visibility without blur
 */
export function getExplanationColor(index: number): string {
  const colors = [
    "rgba(59, 130, 246, 0.25)", // Blue
    "rgba(16, 185, 129, 0.25)", // Green
    "rgba(245, 158, 11, 0.25)", // Amber
    "rgba(139, 92, 246, 0.25)", // Purple
    "rgba(236, 72, 153, 0.25)", // Pink
    "rgba(6, 182, 212, 0.25)", // Cyan
    "rgba(249, 115, 22, 0.25)", // Orange
    "rgba(34, 197, 94, 0.25)", // Emerald
  ];
  return colors[index % colors.length];
}

/**
 * Get border color for explanation highlight
 */
export function getExplanationBorderColor(index: number): string {
  const colors = [
    "rgba(59, 130, 246, 0.6)", // Blue
    "rgba(16, 185, 129, 0.6)", // Green
    "rgba(245, 158, 11, 0.6)", // Amber
    "rgba(139, 92, 246, 0.6)", // Purple
    "rgba(236, 72, 153, 0.6)", // Pink
    "rgba(6, 182, 212, 0.6)", // Cyan
    "rgba(249, 115, 22, 0.6)", // Orange
    "rgba(34, 197, 94, 0.6)", // Emerald
  ];
  return colors[index % colors.length];
}
