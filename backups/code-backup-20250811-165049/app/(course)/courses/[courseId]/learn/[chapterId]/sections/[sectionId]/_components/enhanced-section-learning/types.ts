export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Section {
  id: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  type?: string | null;
  position: number;
  duration?: number | null;
  user_progress: Array<{
    id: string;
    isCompleted: boolean;
    completedAt?: Date | null;
  }>;
  videos: Array<{ id: string; title: string; duration?: number | null }>;
  blogs: Array<{ id: string; title: string; content?: string | null }>;
  articles: Array<{ id: string; title: string; content?: string | null }>;
  notes: Array<{ id: string; title: string; content?: string | null }>;
  codeExplanations: Array<{ id: string; heading: string | null; explanation?: string | null }>;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  sections: Section[];
}

export interface Course {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  chapters: Chapter[];
}

export interface EnhancedSectionLearningProps {
  user: User;
  course: Course;
  currentChapter: Chapter;
  currentSection: Section;
  nextSection: Section | null;
  prevSection: Section | null;
  nextChapterSection: { section: Section; chapter: Chapter } | null;
  totalSections: number;
  completedSections: number;
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export interface ChapterWithProgress extends Chapter {
  completedSections: number;
  progressPercentage: number;
  isCurrentChapter: boolean;
} 