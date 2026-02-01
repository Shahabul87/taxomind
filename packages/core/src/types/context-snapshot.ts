/**
 * @sam-ai/core - Context Snapshot Types
 *
 * Comprehensive type system for page context snapshots gathered from clients.
 * These types define the complete data model for capturing ALL page context
 * (forms, content, navigation, interaction state) in a single snapshot.
 *
 * Portable — no Prisma or framework-specific imports.
 */

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export type ValidationState = 'valid' | 'invalid' | 'pending' | 'untouched';

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'custom';
  value?: string | number;
  message?: string;
}

export interface FieldDependency {
  sourceField: string;
  targetField: string;
  type: 'visibility' | 'value' | 'validation' | 'enable';
  condition: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormFieldSnapshot {
  name: string;
  type: string;
  value: unknown;
  label: string;
  placeholder?: string;
  helpText?: string;

  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  hidden: boolean;

  validationState: ValidationState;
  errors: string[];

  options?: Array<{ value: string; label: string; selected: boolean }>;
  min?: number | string;
  max?: number | string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  step?: number;

  group?: string;
  order: number;
  dataAttributes: Record<string, string>;
}

export interface FieldGroup {
  name: string;
  label?: string;
  fields: string[];
  order: number;
}

export type FormPurpose = 'create' | 'edit' | 'search' | 'filter' | 'settings' | 'unknown';

export interface FormSnapshot {
  formId: string;
  formName: string;
  purpose: FormPurpose;
  action?: string;
  method?: string;

  fields: FormFieldSnapshot[];
  fieldGroups: FieldGroup[];

  state: {
    isDirty: boolean;
    isValid: boolean;
    isSubmitting: boolean;
    completionPercent: number;
    errorCount: number;
  };

  validation: {
    rules: Record<string, ValidationRule[]>;
    dependencies: FieldDependency[];
  };
}

// ============================================================================
// PAGE TYPES
// ============================================================================

export interface PageState {
  isEditing: boolean;
  isDraft: boolean;
  isPublished: boolean;
  hasUnsavedChanges: boolean;
  permissions: string[];
  step?: number;
  totalSteps?: number;
}

export interface PageSnapshot {
  type: string;
  path: string;
  title: string;
  entityId?: string;
  parentEntityId?: string;
  grandParentEntityId?: string;
  capabilities: string[];
  breadcrumb: string[];
  state: PageState;
  meta: Record<string, string>;
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export interface ContentHeading {
  level: number;
  text: string;
  id?: string;
}

export interface ContentTable {
  caption?: string;
  headers: string[];
  rowCount: number;
}

export interface ContentCodeBlock {
  language?: string;
  preview: string;
}

export interface ContentImage {
  alt: string;
  src: string;
}

export interface ContentSnapshot {
  headings: ContentHeading[];
  tables: ContentTable[];
  codeBlocks: ContentCodeBlock[];
  images: ContentImage[];
  textSummary: string;
  wordCount: number;
  readingTimeMinutes: number;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export type LinkCategory =
  | 'navigation'
  | 'action'
  | 'external'
  | 'resource'
  | 'breadcrumb'
  | 'pagination';

export interface NavigationLink {
  href: string;
  text: string;
  category: LinkCategory;
  ariaLabel?: string;
  isActive: boolean;
}

export interface PaginationState {
  current: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TabItem {
  label: string;
  isActive: boolean;
  href?: string;
}

export interface SidebarItem {
  label: string;
  href: string;
  isActive: boolean;
  depth: number;
}

export interface NavigationSnapshot {
  links: NavigationLink[];
  pagination?: PaginationState;
  tabs?: TabItem[];
  sidebar?: SidebarItem[];
}

// ============================================================================
// INTERACTION TYPES
// ============================================================================

export interface InteractionSnapshot {
  scrollPosition: number;
  viewportHeight: number;
  focusedElement?: string;
  selectedText?: string;
  timeOnPage: number;
}

// ============================================================================
// MAIN SNAPSHOT TYPE
// ============================================================================

export const CONTEXT_SNAPSHOT_VERSION = '1.0.0';

export interface PageContextSnapshot {
  version: string;
  timestamp: number;
  contentHash: string;

  page: PageSnapshot;
  forms: FormSnapshot[];
  content: ContentSnapshot;
  navigation: NavigationSnapshot;
  interaction: InteractionSnapshot;
  custom: Record<string, unknown>;
}

// ============================================================================
// ENGINE INPUT / OUTPUT TYPES
// ============================================================================

export interface EntityContextData {
  entityType: 'course' | 'chapter' | 'section' | 'exam' | 'assignment';
  entityId: string;
  title: string;
  description?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfileData {
  userId: string;
  role: string;
  learningStyle?: string;
  preferences?: Record<string, unknown>;
}

export interface RelatedEntity {
  id: string;
  type: string;
  title: string;
  relationship: string;
}

export interface ContextGatheringInput {
  snapshot: PageContextSnapshot;
  enrichmentData?: {
    entityContext?: EntityContextData;
    userProfile?: UserProfileData;
    relatedEntities?: RelatedEntity[];
  };
}

export interface MemoryDirectives {
  shouldIngestContent: boolean;
  shouldUpdateSessionContext: boolean;
  shouldUpdateKnowledgeGraph: boolean;
  contentForIngestion: string[];
  entitiesForGraph: Array<{
    name: string;
    type: string;
    relationships: string[];
  }>;
  sessionContextUpdates: Record<string, unknown>;
}

export interface ContextGatheringOutput {
  snapshot: PageContextSnapshot;
  pageSummary: string;
  formSummary: string;
  contentSummary: string;
  navigationSummary: string;
  pageIntent: string;
  availableActions: string[];
  contextConfidence: number;
  memoryDirectives: MemoryDirectives;
}

// ============================================================================
// MEMORY TYPES
// ============================================================================

export interface ContextDiff {
  hasChanges: boolean;
  changedSections: Array<'page' | 'forms' | 'content' | 'navigation' | 'interaction'>;
  newFormFields: FormFieldSnapshot[];
  changedFormValues: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  newContent: string[];
  removedContent: string[];
}

export interface HydrationResult {
  sectionsUpdated: string[];
  vectorsQueued: number;
  graphEntitiesAdded: number;
  sessionUpdated: boolean;
  snapshotId: string;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface ContextProvider {
  name: string;
  gather: () => Record<string, unknown> | Promise<Record<string, unknown>>;
}

export interface UseContextGatheringOptions {
  enabled?: boolean;
  debounceMs?: number;
  includeContent?: boolean;
  includeInteraction?: boolean;
  maxForms?: number;
  maxLinks?: number;
  customProviders?: ContextProvider[];
  onSnapshotReady?: (snapshot: PageContextSnapshot) => void;
}

export interface UseContextGatheringReturn {
  snapshot: PageContextSnapshot | null;
  isGathering: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
  registerProvider: (provider: ContextProvider) => void;
}

// ============================================================================
// FACTORY / DEFAULTS
// ============================================================================

export function createDefaultPageState(): PageState {
  return {
    isEditing: false,
    isDraft: false,
    isPublished: false,
    hasUnsavedChanges: false,
    permissions: [],
  };
}

export function createDefaultContentSnapshot(): ContentSnapshot {
  return {
    headings: [],
    tables: [],
    codeBlocks: [],
    images: [],
    textSummary: '',
    wordCount: 0,
    readingTimeMinutes: 0,
  };
}

export function createDefaultNavigationSnapshot(): NavigationSnapshot {
  return {
    links: [],
  };
}

export function createDefaultInteractionSnapshot(): InteractionSnapshot {
  return {
    scrollPosition: 0,
    viewportHeight: 0,
    timeOnPage: 0,
  };
}

export function createDefaultPageContextSnapshot(
  partial?: Partial<PageContextSnapshot>,
): PageContextSnapshot {
  return {
    version: CONTEXT_SNAPSHOT_VERSION,
    timestamp: Date.now(),
    contentHash: '',
    page: {
      type: 'unknown',
      path: '',
      title: '',
      capabilities: [],
      breadcrumb: [],
      state: createDefaultPageState(),
      meta: {},
    },
    forms: [],
    content: createDefaultContentSnapshot(),
    navigation: createDefaultNavigationSnapshot(),
    interaction: createDefaultInteractionSnapshot(),
    custom: {},
    ...partial,
  };
}
