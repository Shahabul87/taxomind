// Enterprise-grade TypeScript definitions for Section Page
// Following strict type safety standards - NO 'any' types allowed

export interface CodeExplanation {
  id: string;
  heading: string | null;
  code: string | null;
  explanation: string | null;
  language?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MathExplanation {
  id: string;
  title: string;
  content: string | null;
  latex: string | null;
  equation: string | null;
  imageUrl: string | null;
  mode: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SectionVideo {
  id: string;
  title: string;
  url: string;
  duration?: number | null;
  thumbnail?: string | null;
  description?: string | null;
  position?: number;
  category?: string | null;
  author?: string | null;
  rating?: number | null;
  isPublished?: boolean;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SectionBlog {
  id: string;
  title: string;
  content?: string;
  description?: string | null;
  url?: string;
  category?: string | null;
  excerpt?: string;
  author?: string | null;
  publishedAt?: Date | null;
  position?: number | null;
  rating?: number | null;
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SectionArticle {
  id: string;
  title: string;
  content?: string;
  url?: string | null;
  source?: string | null;
  description?: string | null;
  category?: string | null;
  author?: string | null;
  publishedAt?: Date | null;
  position?: number | null;
  rating?: number | null;
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SectionNote {
  id: string;
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'tip' | 'important';
  category?: string | null;
  isImportant?: boolean;
  position?: number;
  isPublished?: boolean;
  sectionId?: string | null;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Section {
  id: string;
  title: string;
  description?: string | null;
  learningObjectives?: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  videoUrl?: string | null;
  videos: SectionVideo[];
  blogs: SectionBlog[];
  articles: SectionArticle[];
  notes: SectionNote[];
  codeExplanations: CodeExplanation[];
  mathExplanations: MathExplanation[];
  chapterId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  videoUrl?: string | null;
  sections: Section[];
  courseId: string;
  course: {
    id: string;
    title: string;
    userId: string;
    description?: string | null;
    imageUrl?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionPageParams {
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export interface SectionData extends Section {
  chapter: Chapter;
}

// Content Statistics for Analytics
export interface ContentStatistics {
  totalVideos: number;
  totalBlogs: number;
  totalArticles: number;
  totalNotes: number;
  totalCodeBlocks: number;
  totalMathEquations: number;
  completionPercentage: number;
  requiredFieldsCompleted: number;
  totalRequiredFields: number;
}

// AI Assistant Suggestion Types
export interface AISuggestion {
  id: string;
  type: 'info' | 'warning' | 'success' | 'tip';
  title: string;
  description: string;
  actions?: AIAction[];
  priority: 'low' | 'medium' | 'high';
}

export interface AIAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

// Form Props Types
export interface SectionFormProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export interface SectionTitleFormProps extends SectionFormProps {
  initialData: {
    title: string;
  };
}

export interface SectionAccessFormProps extends SectionFormProps {
  initialData: {
    isFree: boolean;
  };
}

export interface SectionVideoFormProps extends SectionFormProps {
  initialData: {
    videoUrl?: string | null;
  };
}

// Tab Container Props
export interface TabsContainerProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: {
    chapter: Chapter;
    codeExplanations: CodeExplanation[];
    mathExplanations: MathExplanation[];
    videos: SectionVideo[];
    blogs: SectionBlog[];
    articles: SectionArticle[];
    notes: SectionNote[];
  };
}

// Page Client Props
export interface SectionPageClientProps {
  section: SectionData;
  chapter: Chapter;
  params: SectionPageParams;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Action Response Types
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}