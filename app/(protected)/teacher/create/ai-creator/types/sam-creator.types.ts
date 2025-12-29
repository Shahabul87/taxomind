export interface CourseCreationRequest {
  courseTitle: string;
  courseShortOverview: string;
  courseCategory: string;
  courseSubcategory?: string;
  courseIntent: string;
  targetAudience: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  chapterCount: number;
  sectionsPerChapter: number;
  // Learning objectives configuration
  learningObjectivesPerChapter: number;
  learningObjectivesPerSection: number;
  courseGoals: string[];
  includeAssessments: boolean;
  bloomsFocus: string[];
  preferredContentTypes: string[];
}

/**
 * SAM Action types that can be returned by the API
 */
export interface SamActionDetails {
  // form_populate
  formId?: string;
  data?: Record<string, unknown>;
  field?: string;
  value?: unknown;

  // course_creation_action
  action?: string;
  topic?: string;
  audience?: string;
  difficulty?: string;
  chapters?: number;
  level?: string;
  courseData?: string;
  bloomLevels?: string[];
  category?: string;
  apiEndpoint?: string;

  // navigation
  url?: string;
  description?: string;

  // gamification_action
  points?: number;
  reason?: string;
}

export interface SamApiAction {
  type:
    | 'form_populate'
    | 'course_creation_action'
    | 'navigation'
    | 'gamification_action'
    | 'form_update';
  details: SamActionDetails;
}

export interface SamActionResult {
  success: boolean;
  message: string;
  fieldsUpdated?: string[];
  actionType: string;
}

export interface SamSuggestion {
  id?: string;
  message: string;
  type: 'encouragement' | 'suggestion' | 'validation' | 'warning' | 'tip';
  actionable: boolean;
  confidence: number;
  /** @deprecated Use actionData for API actions */
  action?: () => void;
  /** API action data from SAM response */
  actionData?: SamApiAction;
  /** Results from processing SAM actions */
  actionResults?: SamActionResult[];
  autoApplyable?: boolean;
  timestamp?: number;
  context?: string;
}

export interface StepComponentProps {
  formData: CourseCreationRequest;
  setFormData: React.Dispatch<React.SetStateAction<CourseCreationRequest>>;
  validationErrors: Record<string, string>;
  onNext?: () => void;
  onBack?: () => void;
}

export interface SamWizardState {
  step: number;
  totalSteps: number;
  isGenerating: boolean;
  samSuggestion: SamSuggestion | null;
  isLoadingSuggestion: boolean;
  validationErrors: Record<string, string>;
  lastAutoSave: Date | null;
}

export interface SamWizardActions {
  handleNext: () => void;
  handleBack: () => void;
  handleGenerate: () => Promise<void>;
  getSamSuggestion: (context: string) => Promise<void>;
  validateForm: () => Promise<void>;
  resetWizard: () => void;
}

export const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'No prior experience required' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Some basic knowledge expected' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Comprehensive background needed' }
] as const;

export const DURATION_OPTIONS = [
  '2-3 weeks', '4-6 weeks', '2-3 months', '6 months', '1 year'
] as const;

export const BLOOMS_LEVELS = [
  { value: 'REMEMBER', label: 'Remember', description: 'Recall facts and basic concepts' },
  { value: 'UNDERSTAND', label: 'Understand', description: 'Explain ideas and concepts' },
  { value: 'APPLY', label: 'Apply', description: 'Use information in new situations' },
  { value: 'ANALYZE', label: 'Analyze', description: 'Draw connections among ideas' },
  { value: 'EVALUATE', label: 'Evaluate', description: 'Justify decisions and actions' },
  { value: 'CREATE', label: 'Create', description: 'Produce new or original work' }
] as const;

export const COURSE_CATEGORIES = [
  {
    value: 'technology',
    label: 'Technology',
    subcategories: ['Web Development', 'Mobile Development', 'Data Science', 'AI/Machine Learning', 'DevOps', 'Cybersecurity']
  },
  {
    value: 'business',
    label: 'Business',
    subcategories: ['Marketing', 'Sales', 'Management', 'Entrepreneurship', 'Finance', 'Project Management']
  },
  {
    value: 'design',
    label: 'Design',
    subcategories: ['UI/UX Design', 'Graphic Design', 'Product Design', 'Web Design', 'Brand Design', 'Motion Graphics']
  },
  {
    value: 'health',
    label: 'Health & Wellness',
    subcategories: ['Fitness', 'Nutrition', 'Mental Health', 'Yoga', 'Meditation', 'Healthcare']
  },
  {
    value: 'education',
    label: 'Education',
    subcategories: ['Teaching Methods', 'Curriculum Design', 'Educational Technology', 'Assessment', 'Learning Sciences']
  }
] as const;

export const COURSE_INTENTS = [
  'Skill development for career advancement',
  'Certification or credential preparation',
  'Personal enrichment and hobby learning',
  'Academic supplementation',
  'Professional development and upskilling',
  'Creative exploration and artistic development'
] as const;

export const TARGET_AUDIENCES = [
  'Complete beginners with no experience',
  'Students with basic foundational knowledge',
  'Intermediate learners looking to advance',
  'Professionals seeking specialized skills',
  'Experienced practitioners wanting specialization',
  'Career changers from other industries',
  'Custom (describe below)'
] as const;

export const CONTENT_TYPES = [
  { value: 'video', label: 'Video Lectures', icon: '🎥' },
  { value: 'reading', label: 'Reading Materials', icon: '📚' },
  { value: 'interactive', label: 'Interactive Exercises', icon: '💡' },
  { value: 'assessments', label: 'Quizzes & Tests', icon: '✅' },
  { value: 'projects', label: 'Hands-on Projects', icon: '🛠️' },
  { value: 'discussions', label: 'Discussion Forums', icon: '💬' }
] as const;