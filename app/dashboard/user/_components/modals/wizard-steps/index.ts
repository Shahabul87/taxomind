/**
 * Study Plan Wizard Step Components
 */

export { StepCourseSelection } from './StepCourseSelection';
export { StepLearningProfile } from './StepLearningProfile';
export { StepScheduleConfig } from './StepScheduleConfig';
export { StepAIPreview } from './StepAIPreview';

// Types for wizard data
export interface WizardData {
  // Step 1: Course Selection
  courseType: 'enrolled' | 'new';
  enrolledCourseId?: string;
  enrolledCourseTitle?: string;
  newCourse?: {
    title: string;
    description: string;
    platform: string;
    url: string;
  };

  // Step 2: Learning Profile
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyles: string[];
  priorKnowledge: string[];
  primaryGoal: 'complete' | 'master' | 'certify' | 'project';
  targetMastery: 'familiar' | 'competent' | 'proficient' | 'expert';
  motivation: 'career' | 'personal' | 'project' | 'curiosity';

  // Step 3: Schedule Configuration
  startDate: Date;
  targetEndDate: Date;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening' | 'flexible';
  dailyStudyHours: number;
  studyDays: string[];
  includePractice: boolean;
  includeAssessments: boolean;
  includeProjects: boolean;
}

export interface GeneratedPlan {
  planTitle: string;
  totalWeeks: number;
  totalTasks: number;
  estimatedHours: number;
  weeks: GeneratedWeek[];
  milestones: Milestone[];
}

export interface GeneratedWeek {
  weekNumber: number;
  title: string;
  tasks: GeneratedTask[];
}

export interface GeneratedTask {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  type: 'LEARN' | 'PRACTICE' | 'ASSESS' | 'REVIEW' | 'PROJECT';
  estimatedMinutes: number;
  scheduledDate: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  contentLinks: { url?: string; title?: string }[];
}

export interface Milestone {
  afterWeek: number;
  title: string;
  description?: string;
}
