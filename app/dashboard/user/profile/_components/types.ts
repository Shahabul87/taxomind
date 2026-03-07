export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  createdAt: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  totalLearningHours: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  recentActivity: ActivityItem[];
  skills: Skill[];
  courses: EnrolledCourse[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  progress?: number;
}

export interface Skill {
  name: string;
  level: number;
  progress: number;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  thumbnail: string;
  lastAccessed: string;
  totalChapters: number;
  completedChapters: number;
}
