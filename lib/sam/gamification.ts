/**
 * SAM Gamification System
 * XP, achievements, streaks, and learning rewards
 */

// ============================================================================
// TYPES
// ============================================================================

export interface UserProgress {
  userId: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  achievements: Achievement[];
  badges: Badge[];
  stats: UserStats;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  category: 'learning' | 'engagement' | 'mastery' | 'social';
  tier: 1 | 2 | 3;
}

export interface UserStats {
  totalQuestions: number;
  correctAnswers: number;
  coursesCompleted: number;
  chaptersCompleted: number;
  sectionsCompleted: number;
  quizzesTaken: number;
  averageScore: number;
  totalStudyTime: number; // in minutes
  contentCreated: number;
  helpfulResponses: number;
}

export interface XPEvent {
  type: XPEventType;
  amount: number;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export type XPEventType =
  | 'question_asked'
  | 'question_answered'
  | 'quiz_completed'
  | 'quiz_perfect'
  | 'section_completed'
  | 'chapter_completed'
  | 'course_completed'
  | 'streak_maintained'
  | 'content_created'
  | 'content_generated'
  | 'first_interaction'
  | 'daily_login'
  | 'weekly_goal'
  | 'blooms_level_up'
  | 'mastery_achieved';

export interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  perks: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const XP_VALUES: Record<XPEventType, number> = {
  question_asked: 5,
  question_answered: 10,
  quiz_completed: 25,
  quiz_perfect: 50,
  section_completed: 30,
  chapter_completed: 75,
  course_completed: 200,
  streak_maintained: 15,
  content_created: 40,
  content_generated: 20,
  first_interaction: 25,
  daily_login: 10,
  weekly_goal: 100,
  blooms_level_up: 35,
  mastery_achieved: 150,
};

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Novice Learner', minXP: 0, maxXP: 100, perks: ['Basic SAM access'] },
  { level: 2, name: 'Curious Mind', minXP: 100, maxXP: 250, perks: ['Extended conversations'] },
  { level: 3, name: 'Active Student', minXP: 250, maxXP: 500, perks: ['Content generation'] },
  { level: 4, name: 'Knowledge Seeker', minXP: 500, maxXP: 1000, perks: ['Advanced insights'] },
  { level: 5, name: 'Dedicated Scholar', minXP: 1000, maxXP: 2000, perks: ['Priority responses'] },
  { level: 6, name: 'Expert Learner', minXP: 2000, maxXP: 4000, perks: ['Custom themes'] },
  { level: 7, name: 'Master Student', minXP: 4000, maxXP: 7500, perks: ['Beta features'] },
  { level: 8, name: 'Learning Champion', minXP: 7500, maxXP: 12500, perks: ['Exclusive badges'] },
  { level: 9, name: 'Wisdom Keeper', minXP: 12500, maxXP: 20000, perks: ['Mentor status'] },
  { level: 10, name: 'Grand Master', minXP: 20000, maxXP: Infinity, perks: ['All perks unlocked'] },
];

export const ACHIEVEMENTS_CONFIG: Omit<Achievement, 'unlockedAt'>[] = [
  // Learning Achievements
  { id: 'first_question', name: 'Curious Mind', description: 'Ask your first question to SAM', icon: '❓', rarity: 'common' },
  { id: 'ten_questions', name: 'Inquisitive', description: 'Ask 10 questions', icon: '🔍', rarity: 'common' },
  { id: 'hundred_questions', name: 'Question Master', description: 'Ask 100 questions', icon: '🎯', rarity: 'rare' },

  // Quiz Achievements
  { id: 'first_quiz', name: 'Quiz Taker', description: 'Complete your first quiz', icon: '📝', rarity: 'common' },
  { id: 'perfect_quiz', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '💯', rarity: 'uncommon' },
  { id: 'ten_perfect', name: 'Perfectionist', description: 'Get 10 perfect quiz scores', icon: '🌟', rarity: 'rare' },

  // Streak Achievements
  { id: 'three_day_streak', name: 'Getting Started', description: 'Maintain a 3-day streak', icon: '🔥', rarity: 'common' },
  { id: 'week_streak', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚡', rarity: 'uncommon' },
  { id: 'month_streak', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🏆', rarity: 'epic' },
  { id: 'hundred_streak', name: 'Legendary Learner', description: 'Maintain a 100-day streak', icon: '👑', rarity: 'legendary' },

  // Completion Achievements
  { id: 'first_section', name: 'Section Complete', description: 'Complete your first section', icon: '📚', rarity: 'common' },
  { id: 'first_chapter', name: 'Chapter Champion', description: 'Complete your first chapter', icon: '📖', rarity: 'common' },
  { id: 'first_course', name: 'Course Conqueror', description: 'Complete your first course', icon: '🎓', rarity: 'uncommon' },
  { id: 'five_courses', name: 'Multi-Course Master', description: 'Complete 5 courses', icon: '🎖️', rarity: 'rare' },

  // Bloom's Achievements
  { id: 'blooms_apply', name: 'Practical Thinker', description: 'Reach Apply level in Bloom\'s Taxonomy', icon: '🔧', rarity: 'uncommon' },
  { id: 'blooms_analyze', name: 'Analytical Mind', description: 'Reach Analyze level', icon: '🔬', rarity: 'rare' },
  { id: 'blooms_evaluate', name: 'Critical Evaluator', description: 'Reach Evaluate level', icon: '⚖️', rarity: 'epic' },
  { id: 'blooms_create', name: 'Creative Genius', description: 'Reach Create level', icon: '💡', rarity: 'legendary' },

  // Content Creation
  { id: 'content_creator', name: 'Content Creator', description: 'Generate content with SAM', icon: '✍️', rarity: 'common' },
  { id: 'prolific_creator', name: 'Prolific Creator', description: 'Generate 50 pieces of content', icon: '📝', rarity: 'rare' },
];

// ============================================================================
// GAMIFICATION ENGINE
// ============================================================================

export class GamificationEngine {
  private userId: string;
  private progress: UserProgress;
  private pendingXP: XPEvent[] = [];
  private listeners: ((event: GamificationEvent) => void)[] = [];

  constructor(userId: string, initialProgress?: Partial<UserProgress>) {
    this.userId = userId;
    this.progress = {
      userId,
      xp: initialProgress?.xp ?? 0,
      level: initialProgress?.level ?? 1,
      streak: initialProgress?.streak ?? 0,
      lastActiveDate: initialProgress?.lastActiveDate ?? new Date().toISOString().split('T')[0],
      achievements: initialProgress?.achievements ?? [],
      badges: initialProgress?.badges ?? [],
      stats: initialProgress?.stats ?? {
        totalQuestions: 0,
        correctAnswers: 0,
        coursesCompleted: 0,
        chaptersCompleted: 0,
        sectionsCompleted: 0,
        quizzesTaken: 0,
        averageScore: 0,
        totalStudyTime: 0,
        contentCreated: 0,
        helpfulResponses: 0,
      },
    };
  }

  /**
   * Award XP for an event
   */
  awardXP(eventType: XPEventType, metadata?: Record<string, unknown>): XPEvent {
    const amount = XP_VALUES[eventType];
    const event: XPEvent = {
      type: eventType,
      amount,
      description: this.getEventDescription(eventType),
      timestamp: new Date(),
      metadata,
    };

    this.progress.xp += amount;
    this.pendingXP.push(event);

    // Check for level up
    const newLevel = this.calculateLevel(this.progress.xp);
    if (newLevel > this.progress.level) {
      this.progress.level = newLevel;
      this.emit({ type: 'level_up', data: { level: newLevel, levelInfo: LEVELS[newLevel - 1] } });
    }

    // Update stats
    this.updateStats(eventType);

    // Check for achievements
    this.checkAchievements(eventType);

    this.emit({ type: 'xp_gained', data: event });

    return event;
  }

  /**
   * Check and update streak
   */
  checkStreak(): { maintained: boolean; streak: number; bonus: number } {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.progress.lastActiveDate;

    const todayDate = new Date(today);
    const lastActiveDate = new Date(lastActive);
    const diffDays = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

    let maintained = false;
    let bonus = 0;

    if (diffDays === 0) {
      // Same day, streak continues
      maintained = true;
    } else if (diffDays === 1) {
      // Next day, increment streak
      this.progress.streak += 1;
      this.progress.lastActiveDate = today;
      maintained = true;

      // Award streak XP
      bonus = XP_VALUES.streak_maintained;
      this.awardXP('streak_maintained');

      // Check streak achievements
      this.checkStreakAchievements();
    } else {
      // Streak broken
      this.progress.streak = 1;
      this.progress.lastActiveDate = today;
      maintained = false;
    }

    return { maintained, streak: this.progress.streak, bonus };
  }

  /**
   * Get current progress
   */
  getProgress(): UserProgress {
    return { ...this.progress };
  }

  /**
   * Get level info for current level
   */
  getCurrentLevelInfo(): LevelInfo {
    return LEVELS[Math.min(this.progress.level - 1, LEVELS.length - 1)];
  }

  /**
   * Get XP needed for next level
   */
  getXPToNextLevel(): { current: number; needed: number; percentage: number } {
    const currentLevel = this.getCurrentLevelInfo();
    const current = this.progress.xp - currentLevel.minXP;
    const needed = currentLevel.maxXP - currentLevel.minXP;
    const percentage = Math.min((current / needed) * 100, 100);

    return { current, needed, percentage };
  }

  /**
   * Get pending XP events (for display)
   */
  getPendingXP(): XPEvent[] {
    const events = [...this.pendingXP];
    this.pendingXP = [];
    return events;
  }

  /**
   * Subscribe to gamification events
   */
  subscribe(listener: (event: GamificationEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private calculateLevel(xp: number): number {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXP) {
        return LEVELS[i].level;
      }
    }
    return 1;
  }

  private getEventDescription(eventType: XPEventType): string {
    const descriptions: Record<XPEventType, string> = {
      question_asked: 'Asked a question',
      question_answered: 'Answered correctly',
      quiz_completed: 'Completed a quiz',
      quiz_perfect: 'Perfect quiz score!',
      section_completed: 'Completed a section',
      chapter_completed: 'Completed a chapter',
      course_completed: 'Completed a course!',
      streak_maintained: 'Streak maintained',
      content_created: 'Created content',
      content_generated: 'Generated with AI',
      first_interaction: 'First SAM interaction',
      daily_login: 'Daily login bonus',
      weekly_goal: 'Weekly goal achieved!',
      blooms_level_up: 'Bloom\'s level increased',
      mastery_achieved: 'Mastery achieved!',
    };
    return descriptions[eventType];
  }

  private updateStats(eventType: XPEventType): void {
    switch (eventType) {
      case 'question_asked':
        this.progress.stats.totalQuestions++;
        break;
      case 'question_answered':
        this.progress.stats.correctAnswers++;
        break;
      case 'quiz_completed':
        this.progress.stats.quizzesTaken++;
        break;
      case 'section_completed':
        this.progress.stats.sectionsCompleted++;
        break;
      case 'chapter_completed':
        this.progress.stats.chaptersCompleted++;
        break;
      case 'course_completed':
        this.progress.stats.coursesCompleted++;
        break;
      case 'content_created':
      case 'content_generated':
        this.progress.stats.contentCreated++;
        break;
    }
  }

  private checkAchievements(eventType: XPEventType): void {
    const achievementsToCheck: { id: string; condition: () => boolean }[] = [
      { id: 'first_question', condition: () => eventType === 'question_asked' && this.progress.stats.totalQuestions === 1 },
      { id: 'ten_questions', condition: () => this.progress.stats.totalQuestions >= 10 },
      { id: 'hundred_questions', condition: () => this.progress.stats.totalQuestions >= 100 },
      { id: 'first_quiz', condition: () => eventType === 'quiz_completed' && this.progress.stats.quizzesTaken === 1 },
      { id: 'perfect_quiz', condition: () => eventType === 'quiz_perfect' },
      { id: 'first_section', condition: () => eventType === 'section_completed' && this.progress.stats.sectionsCompleted === 1 },
      { id: 'first_chapter', condition: () => eventType === 'chapter_completed' && this.progress.stats.chaptersCompleted === 1 },
      { id: 'first_course', condition: () => eventType === 'course_completed' && this.progress.stats.coursesCompleted === 1 },
      { id: 'five_courses', condition: () => this.progress.stats.coursesCompleted >= 5 },
      { id: 'content_creator', condition: () => eventType === 'content_generated' && this.progress.stats.contentCreated === 1 },
      { id: 'prolific_creator', condition: () => this.progress.stats.contentCreated >= 50 },
    ];

    for (const check of achievementsToCheck) {
      if (!this.hasAchievement(check.id) && check.condition()) {
        this.unlockAchievement(check.id);
      }
    }
  }

  private checkStreakAchievements(): void {
    const streakAchievements: { id: string; days: number }[] = [
      { id: 'three_day_streak', days: 3 },
      { id: 'week_streak', days: 7 },
      { id: 'month_streak', days: 30 },
      { id: 'hundred_streak', days: 100 },
    ];

    for (const { id, days } of streakAchievements) {
      if (!this.hasAchievement(id) && this.progress.streak >= days) {
        this.unlockAchievement(id);
      }
    }
  }

  private hasAchievement(id: string): boolean {
    return this.progress.achievements.some(a => a.id === id);
  }

  private unlockAchievement(id: string): void {
    const config = ACHIEVEMENTS_CONFIG.find(a => a.id === id);
    if (!config) return;

    const achievement: Achievement = {
      ...config,
      unlockedAt: new Date(),
    };

    this.progress.achievements.push(achievement);
    this.emit({ type: 'achievement_unlocked', data: achievement });
  }

  private emit(event: GamificationEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Gamification event listener error:', error);
      }
    }
  }
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type GamificationEvent =
  | { type: 'xp_gained'; data: XPEvent }
  | { type: 'level_up'; data: { level: number; levelInfo: LevelInfo } }
  | { type: 'achievement_unlocked'; data: Achievement }
  | { type: 'badge_earned'; data: Badge }
  | { type: 'streak_updated'; data: { streak: number; maintained: boolean } };

// ============================================================================
// HOOKS FOR SAM INTEGRATION
// ============================================================================

/**
 * Create gamification hooks for SAM context
 */
export function createGamificationHooks(engine: GamificationEngine) {
  return {
    /**
     * Called when user asks a question
     */
    onQuestionAsked: () => {
      engine.checkStreak();
      engine.awardXP('question_asked');
    },

    /**
     * Called when user answers correctly
     */
    onCorrectAnswer: () => {
      engine.awardXP('question_answered');
    },

    /**
     * Called when quiz is completed
     */
    onQuizComplete: (score: number, total: number) => {
      engine.awardXP('quiz_completed');
      if (score === total) {
        engine.awardXP('quiz_perfect');
      }
    },

    /**
     * Called when section is completed
     */
    onSectionComplete: () => {
      engine.awardXP('section_completed');
    },

    /**
     * Called when chapter is completed
     */
    onChapterComplete: () => {
      engine.awardXP('chapter_completed');
    },

    /**
     * Called when course is completed
     */
    onCourseComplete: () => {
      engine.awardXP('course_completed');
    },

    /**
     * Called when content is generated
     */
    onContentGenerated: () => {
      engine.awardXP('content_generated');
    },

    /**
     * Called on first SAM interaction
     */
    onFirstInteraction: () => {
      engine.awardXP('first_interaction');
    },

    /**
     * Called when Bloom's level increases
     */
    onBloomsLevelUp: (newLevel: string) => {
      engine.awardXP('blooms_level_up', { level: newLevel });
    },

    /**
     * Get current progress for display
     */
    getProgress: () => engine.getProgress(),

    /**
     * Get XP to next level
     */
    getXPToNextLevel: () => engine.getXPToNextLevel(),

    /**
     * Get pending XP notifications
     */
    getPendingXP: () => engine.getPendingXP(),

    /**
     * Subscribe to events
     */
    subscribe: (listener: (event: GamificationEvent) => void) => engine.subscribe(listener),
  };
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new gamification engine instance
 */
export function createGamificationEngine(
  userId: string,
  initialProgress?: Partial<UserProgress>
): GamificationEngine {
  return new GamificationEngine(userId, initialProgress);
}
