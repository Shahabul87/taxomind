export interface GoalSubGoal {
  id: string;
  title: string;
  status: string;
  progress?: number;
  order?: number;
  estimatedMinutes?: number;
  difficulty?: string;
}

export interface GoalPlan {
  id: string;
  status: string;
  overallProgress?: number;
  targetDate?: string | null;
  title?: string;
}

export interface GoalCourse {
  id: string;
  title: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  targetDate?: string | Date | null;
  currentMastery?: string | null;
  targetMastery?: string | null;
  tags?: string[];
  course?: GoalCourse | null;
  subGoals: GoalSubGoal[];
  plans: GoalPlan[];
  createdAt: string | Date;
  updatedAt: string | Date;
}
