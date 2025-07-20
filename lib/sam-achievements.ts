import { SAMBadgeType, BadgeLevel } from '@prisma/client';

// Achievement definitions
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'teaching' | 'collaboration' | 'consistency' | 'mastery' | 'creativity';
  badgeType: SAMBadgeType;
  level: BadgeLevel;
  points: number;
  requirements: {
    type: 'count' | 'streak' | 'quality' | 'time' | 'completion' | 'interaction';
    target: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
    conditions?: Record<string, any>;
  };
  unlockConditions?: {
    prerequisiteAchievements?: string[];
    minimumLevel?: number;
    courseSpecific?: boolean;
  };
}

// Challenge definitions
export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // in days
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  points: number;
  bonusMultiplier?: number;
  requirements: {
    type: 'create_content' | 'use_ai' | 'form_completion' | 'streak_maintenance' | 'collaboration' | 'improvement';
    target: number;
    conditions?: Record<string, any>;
  };
  rewards: {
    points: number;
    badges?: string[];
    specialRewards?: string[];
  };
}

// Teacher-focused achievements
export const TEACHER_ACHIEVEMENTS: Achievement[] = [
  // Learning Milestone Achievements
  {
    id: 'first_course_created',
    name: 'Course Pioneer',
    description: 'Created your first course',
    icon: '🎯',
    category: 'learning',
    badgeType: 'LEARNING_MILESTONE',
    level: 'BRONZE',
    points: 50,
    requirements: {
      type: 'count',
      target: 1,
      conditions: { action: 'course_created' }
    }
  },
  {
    id: 'five_courses_created',
    name: 'Course Architect',
    description: 'Created 5 courses',
    icon: '🏗️',
    category: 'teaching',
    badgeType: 'LEARNING_MILESTONE',
    level: 'SILVER',
    points: 200,
    requirements: {
      type: 'count',
      target: 5,
      conditions: { action: 'course_created' }
    },
    unlockConditions: {
      prerequisiteAchievements: ['first_course_created']
    }
  },
  {
    id: 'course_master',
    name: 'Course Master',
    description: 'Created 15 courses',
    icon: '👑',
    category: 'teaching',
    badgeType: 'LEARNING_MILESTONE',
    level: 'GOLD',
    points: 500,
    requirements: {
      type: 'count',
      target: 15,
      conditions: { action: 'course_created' }
    },
    unlockConditions: {
      prerequisiteAchievements: ['five_courses_created']
    }
  },

  // AI Collaboration Achievements
  {
    id: 'sam_novice',
    name: 'SAM Novice',
    description: 'Used SAM AI assistance 10 times',
    icon: '🤖',
    category: 'collaboration',
    badgeType: 'COLLABORATION',
    level: 'BRONZE',
    points: 30,
    requirements: {
      type: 'count',
      target: 10,
      conditions: { action: 'ai_assistance_used' }
    }
  },
  {
    id: 'sam_collaborator',
    name: 'SAM Collaborator',
    description: 'Used SAM AI assistance 50 times',
    icon: '🤝',
    category: 'collaboration',
    badgeType: 'COLLABORATION',
    level: 'SILVER',
    points: 150,
    requirements: {
      type: 'count',
      target: 50,
      conditions: { action: 'ai_assistance_used' }
    },
    unlockConditions: {
      prerequisiteAchievements: ['sam_novice']
    }
  },
  {
    id: 'sam_expert',
    name: 'SAM Expert',
    description: 'Used SAM AI assistance 200 times',
    icon: '⚡',
    category: 'collaboration',
    badgeType: 'COLLABORATION',
    level: 'GOLD',
    points: 400,
    requirements: {
      type: 'count',
      target: 200,
      conditions: { action: 'ai_assistance_used' }
    },
    unlockConditions: {
      prerequisiteAchievements: ['sam_collaborator']
    }
  },

  // Consistency Achievements
  {
    id: 'consistent_creator',
    name: 'Consistent Creator',
    description: 'Worked on content for 7 consecutive days',
    icon: '📅',
    category: 'consistency',
    badgeType: 'CONSISTENCY',
    level: 'SILVER',
    points: 100,
    requirements: {
      type: 'streak',
      target: 7,
      timeframe: 'daily',
      conditions: { action: 'content_creation' }
    }
  },
  {
    id: 'dedicated_educator',
    name: 'Dedicated Educator',
    description: 'Worked on content for 30 consecutive days',
    icon: '🎓',
    category: 'consistency',
    badgeType: 'CONSISTENCY',
    level: 'GOLD',
    points: 300,
    requirements: {
      type: 'streak',
      target: 30,
      timeframe: 'daily',
      conditions: { action: 'content_creation' }
    },
    unlockConditions: {
      prerequisiteAchievements: ['consistent_creator']
    }
  },

  // Quality Achievements
  {
    id: 'quality_content',
    name: 'Quality Creator',
    description: 'Created content with 90%+ AI quality score',
    icon: '⭐',
    category: 'mastery',
    badgeType: 'ACHIEVEMENT',
    level: 'GOLD',
    points: 200,
    requirements: {
      type: 'quality',
      target: 90,
      conditions: { metric: 'ai_quality_score' }
    }
  },
  {
    id: 'content_perfectionist',
    name: 'Content Perfectionist',
    description: 'Applied 25 SAM suggestions to improve content',
    icon: '✨',
    category: 'mastery',
    badgeType: 'ACHIEVEMENT',
    level: 'SILVER',
    points: 150,
    requirements: {
      type: 'count',
      target: 25,
      conditions: { action: 'suggestion_applied' }
    }
  },

  // Creativity Achievements
  {
    id: 'creative_writer',
    name: 'Creative Writer',
    description: 'Generated content using all SAM AI features (expand, improve, rephrase)',
    icon: '🎨',
    category: 'creativity',
    badgeType: 'ACHIEVEMENT',
    level: 'GOLD',
    points: 250,
    requirements: {
      type: 'completion',
      target: 3,
      conditions: { actions: ['expand_content', 'improve_content', 'rephrase_content'] }
    }
  },
  {
    id: 'comprehensive_educator',
    name: 'Comprehensive Educator',
    description: 'Created complete course with chapters, sections, and assessments',
    icon: '📚',
    category: 'teaching',
    badgeType: 'LEARNING_MILESTONE',
    level: 'PLATINUM',
    points: 400,
    requirements: {
      type: 'completion',
      target: 1,
      conditions: { 
        course_complete: true,
        min_chapters: 3,
        min_sections: 10,
        has_assessments: true
      }
    }
  },

  // Special Achievements
  {
    id: 'early_adopter',
    name: 'SAM Early Adopter',
    description: 'One of the first 100 users to try SAM AI',
    icon: '🚀',
    category: 'learning',
    badgeType: 'SPECIAL',
    level: 'PLATINUM',
    points: 500,
    requirements: {
      type: 'count',
      target: 1,
      conditions: { user_rank: { lte: 100 } }
    }
  },
  {
    id: 'feedback_champion',
    name: 'Feedback Champion',
    description: 'Provided feedback on SAM suggestions 50 times',
    icon: '💬',
    category: 'collaboration',
    badgeType: 'COLLABORATION',
    level: 'GOLD',
    points: 200,
    requirements: {
      type: 'count',
      target: 50,
      conditions: { action: 'feedback_provided' }
    }
  }
];

// Daily, Weekly, and Monthly Challenges
export const CHALLENGES: Challenge[] = [
  // Daily Challenges
  {
    id: 'daily_creator',
    name: 'Daily Creator',
    description: 'Create or edit content using SAM assistance',
    icon: '📝',
    difficulty: 'easy',
    duration: 1,
    category: 'daily',
    points: 10,
    bonusMultiplier: 1.2,
    requirements: {
      type: 'use_ai',
      target: 1,
      conditions: { timeframe: 'today' }
    },
    rewards: {
      points: 10,
      specialRewards: ['daily_streak_bonus']
    }
  },
  {
    id: 'daily_perfectionist',
    name: 'Daily Perfectionist',
    description: 'Apply 3 SAM suggestions to improve your content',
    icon: '✨',
    difficulty: 'medium',
    duration: 1,
    category: 'daily',
    points: 25,
    requirements: {
      type: 'improvement',
      target: 3,
      conditions: { action: 'suggestion_applied', timeframe: 'today' }
    },
    rewards: {
      points: 25,
      badges: ['daily_perfectionist_badge']
    }
  },

  // Weekly Challenges
  {
    id: 'weekly_content_sprint',
    name: 'Content Sprint',
    description: 'Create content for 5 different courses this week',
    icon: '🏃‍♂️',
    difficulty: 'hard',
    duration: 7,
    category: 'weekly',
    points: 100,
    bonusMultiplier: 1.5,
    requirements: {
      type: 'create_content',
      target: 5,
      conditions: { 
        unique_courses: true,
        timeframe: 'this_week'
      }
    },
    rewards: {
      points: 100,
      badges: ['content_sprint_master'],
      specialRewards: ['weekly_leaderboard_entry']
    }
  },
  {
    id: 'weekly_ai_collaboration',
    name: 'AI Collaboration Master',
    description: 'Use SAM AI assistance 20 times this week',
    icon: '🤖',
    difficulty: 'medium',
    duration: 7,
    category: 'weekly',
    points: 75,
    requirements: {
      type: 'use_ai',
      target: 20,
      conditions: { timeframe: 'this_week' }
    },
    rewards: {
      points: 75,
      badges: ['ai_collaboration_badge']
    }
  },

  // Monthly Challenges
  {
    id: 'monthly_course_builder',
    name: 'Course Builder Challenge',
    description: 'Complete a full course with chapters and sections',
    icon: '🏗️',
    difficulty: 'expert',
    duration: 30,
    category: 'monthly',
    points: 500,
    bonusMultiplier: 2.0,
    requirements: {
      type: 'create_content',
      target: 1,
      conditions: {
        complete_course: true,
        min_chapters: 5,
        min_sections: 20,
        timeframe: 'this_month'
      }
    },
    rewards: {
      points: 500,
      badges: ['course_builder_master', 'monthly_champion'],
      specialRewards: ['featured_course', 'mentor_badge']
    }
  },

  // Special Event Challenges
  {
    id: 'sam_anniversary',
    name: 'SAM Anniversary Celebration',
    description: 'Help celebrate SAM\'s anniversary by trying all AI features',
    icon: '🎉',
    difficulty: 'medium',
    duration: 7,
    category: 'special',
    points: 200,
    bonusMultiplier: 3.0,
    requirements: {
      type: 'completion',
      target: 6,
      conditions: {
        actions: [
          'content_generated',
          'content_improved', 
          'content_rephrased',
          'suggestion_applied',
          'feedback_provided',
          'form_completed_with_ai'
        ]
      }
    },
    rewards: {
      points: 200,
      badges: ['anniversary_celebrant', 'sam_explorer'],
      specialRewards: ['exclusive_theme', 'priority_support']
    }
  }
];

// Level calculation based on points
export function calculateLevel(points: number): number {
  if (points < 100) return 1;
  if (points < 300) return 2;
  if (points < 600) return 3;
  if (points < 1000) return 4;
  if (points < 1500) return 5;
  if (points < 2500) return 6;
  if (points < 4000) return 7;
  if (points < 6000) return 8;
  if (points < 9000) return 9;
  return 10;
}

// Get achievements by category
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return TEACHER_ACHIEVEMENTS.filter(achievement => achievement.category === category);
}

// Get available challenges for user
export function getAvailableChallenges(
  userLevel: number, 
  completedChallenges: string[] = []
): Challenge[] {
  return CHALLENGES.filter(challenge => {
    // Filter out completed challenges
    if (completedChallenges.includes(challenge.id)) return false;
    
    // Basic level requirements for different difficulties
    const levelRequirements = {
      easy: 1,
      medium: 3,
      hard: 5,
      expert: 8
    };
    
    return userLevel >= levelRequirements[challenge.difficulty];
  });
}

// Check if user meets achievement requirements
export function checkAchievementProgress(
  achievement: Achievement,
  userStats: Record<string, any>
): {
  unlocked: boolean;
  progress: number;
  progressPercent: number;
} {
  const { requirements } = achievement;
  let currentValue = 0;
  
  switch (requirements.type) {
    case 'count':
      currentValue = userStats[requirements.conditions?.action] || 0;
      break;
    case 'streak':
      currentValue = userStats.streaks?.[requirements.conditions?.action]?.current || 0;
      break;
    case 'quality':
      currentValue = userStats[requirements.conditions?.metric] || 0;
      break;
    case 'completion':
      if (requirements.conditions?.actions) {
        const completedActions = requirements.conditions.actions.filter(
          (action: string) => userStats[action] > 0
        );
        currentValue = completedActions.length;
      }
      break;
  }
  
  const progress = Math.min(currentValue, requirements.target);
  const progressPercent = Math.round((progress / requirements.target) * 100);
  const unlocked = progress >= requirements.target;
  
  return { unlocked, progress, progressPercent };
}

// Get achievement recommendations based on user progress
export function getAchievementRecommendations(
  userStats: Record<string, any>,
  currentAchievements: string[] = []
): Achievement[] {
  return TEACHER_ACHIEVEMENTS
    .filter(achievement => !currentAchievements.includes(achievement.id))
    .map(achievement => ({
      achievement,
      progress: checkAchievementProgress(achievement, userStats)
    }))
    .filter(({ progress }) => progress.progressPercent >= 50 && !progress.unlocked)
    .sort((a, b) => b.progress.progressPercent - a.progress.progressPercent)
    .slice(0, 3)
    .map(({ achievement }) => achievement);
}