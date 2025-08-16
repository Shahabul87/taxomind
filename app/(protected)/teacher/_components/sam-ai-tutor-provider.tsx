"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

// Import Global SAM AI Tutor instead
import { useSAMGlobal } from '@/components/sam/sam-global-provider';

// Import database functions - Note: These should only be used in server actions/API routes
import {
  awardSAMPoints,
  unlockSAMBadge,
  updateSAMStreak,
  recordSAMInteraction,
  updateSAMLearningProfile,
  getSAMLearningProfile
} from '@/lib/sam-database';
import { SAMBadgeType, BadgeLevel, SAMInteractionType } from '@prisma/client';
import { trackAchievementProgress } from '@/lib/sam-achievement-engine';

// Educational context types
interface LearningContext {
  userRole: 'student' | 'teacher' | 'admin';
  currentCourse?: {
    id: string;
    title: string;
    progress?: number;
    lastAccessed?: Date;
  };
  currentChapter?: {
    id: string;
    title: string;
    sectionCount?: number;
    completedSections?: number;
  };
  currentSection?: {
    id: string;
    title: string;
    type: 'video' | 'article' | 'code' | 'exam' | 'notes';
    completed?: boolean;
  };
  learningStats?: {
    totalTimeSpent?: number;
    averageSessionDuration?: number;
    lastSevenDaysActivity?: number[];
    strongTopics?: string[];
    weakTopics?: string[];
  };
}

interface LearningStyle {
  type: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';
  preferences: {
    contentFormat: ('video' | 'text' | 'interactive' | 'audio')[];
    pacePreference: 'slow' | 'medium' | 'fast';
    practiceFrequency: 'high' | 'medium' | 'low';
  };
  adaptationHistory: Array<{
    timestamp: Date;
    adaptation: string;
    effectiveness: number;
  }>;
}

interface GamificationState {
  points: number;
  level: number;
  badges: Array<{
    id: string;
    name: string;
    earnedAt: Date;
    description: string;
  }>;
  streaks: {
    current: number;
    longest: number;
    lastActivity: Date;
  };
  achievements: Array<{
    id: string;
    title: string;
    progress: number;
    total: number;
  }>;
}

interface TutorPersonality {
  tone: 'encouraging' | 'professional' | 'friendly' | 'challenging';
  teachingMethod: 'socratic' | 'direct' | 'scaffolding' | 'discovery';
  responseStyle: 'detailed' | 'concise' | 'visual' | 'example-heavy';
  motivationalApproach: 'achievement' | 'mastery' | 'social' | 'intrinsic';
}

interface SamAITutorContextType {
  // All Enhanced SAM features are inherited
  
  // Educational context
  learningContext: LearningContext;
  updateLearningContext: (context: Partial<LearningContext>) => void;
  
  // Learning style adaptation
  learningStyle: LearningStyle;
  detectLearningStyle: () => Promise<LearningStyle>;
  adaptToLearningStyle: (style: Partial<LearningStyle>) => void;
  
  // Gamification
  gamificationState: GamificationState;
  awardPoints: (points: number, reason: string) => void;
  unlockBadge: (badgeId: string) => void;
  updateStreak: () => void;
  
  // Tutor personality
  tutorPersonality: TutorPersonality;
  adjustPersonality: (personality: Partial<TutorPersonality>) => void;
  
  // Teaching methods
  useSocraticMethod: (topic: string, studentAnswer: string) => Promise<string>;
  generateGuidingQuestion: (concept: string, difficulty: 'easy' | 'medium' | 'hard') => Promise<string>;
  provideScaffoldedHelp: (problem: string, currentStep: number) => Promise<string>;
  
  // Content generation
  generateAdaptiveContent: (topic: string, format: 'explanation' | 'example' | 'practice') => Promise<string>;
  createVisualization: (concept: string) => Promise<{ type: string; data: any }>;
  generatePracticeProblems: (topic: string, count: number, difficulty: string) => Promise<any[]>;
  
  // Progress tracking
  trackInteraction: (type: string, data: any) => void;
  getProgressInsights: () => Promise<any>;
  predictLearningOutcome: (assessmentData: any) => Promise<number>;
  
  // Emotional intelligence
  detectLearnerEmotion: (text: string) => Promise<'frustrated' | 'confused' | 'confident' | 'bored' | 'engaged'>;
  respondToEmotion: (emotion: string) => Promise<string>;
  
  // Collaboration features
  findStudyPartners: (criteria: any) => Promise<any[]>;
  facilitatePeerLearning: (topic: string, peers: string[]) => Promise<void>;
  
  // Teacher support
  generateStudentInsights: (studentId: string) => Promise<any>;
  suggestInterventions: (studentPerformance: any) => Promise<string[]>;
  createRubric: (assignment: any) => Promise<any>;
}

const SamAITutorContext = createContext<SamAITutorContextType | undefined>(undefined);

interface SamAITutorProviderProps {
  children: ReactNode;
}

export function SamAITutorProvider({ children }: SamAITutorProviderProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  
  // Educational state
  const [learningContext, setLearningContext] = useState<LearningContext>({
    userRole: 'teacher', // Default, will be updated based on auth
  });
  
  const [learningStyle, setLearningStyle] = useState<LearningStyle>({
    type: 'mixed',
    preferences: {
      contentFormat: ['video', 'text', 'interactive'],
      pacePreference: 'medium',
      practiceFrequency: 'medium',
    },
    adaptationHistory: [],
  });
  
  const [gamificationState, setGamificationState] = useState<GamificationState>({
    points: 0,
    level: 1,
    badges: [],
    streaks: {
      current: 0,
      longest: 0,
      lastActivity: new Date(),
    },
    achievements: [],
  });
  
  // Load gamification data from API
  useEffect(() => {
    const loadGamificationData = async () => {
      if (!user?.id) return;
      
      try {
        const courseId = learningContext.currentCourse?.id;
        const params = new URLSearchParams();
        if (courseId) {
          params.set('courseId', courseId);
        }
        
        const response = await fetch(`/api/sam/stats?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch SAM stats');
        }
        
        const { data: stats } = await response.json();
        
        setGamificationState(prev => ({
          ...prev,
          points: stats.totalPoints,
          level: Math.floor(stats.totalPoints / 1000) + 1,
          badges: [], // Will be populated from SAMBadge records
          streaks: {
            current: stats.streaks[0]?.currentStreak || 0,
            longest: stats.streaks[0]?.longestStreak || 0,
            lastActivity: stats.streaks[0]?.lastActivityDate || new Date(),
          },
          achievements: [] // Will be populated from achievements system
        }));
      } catch (error: any) {
        logger.error('Error loading gamification data:', error);
      }
    };
    
    loadGamificationData();
  }, [user?.id, learningContext.currentCourse?.id]);
  
  const [tutorPersonality, setTutorPersonality] = useState<TutorPersonality>({
    tone: 'encouraging',
    teachingMethod: 'socratic',
    responseStyle: 'detailed',
    motivationalApproach: 'mastery',
  });
  
  // Update learning context based on route
  useEffect(() => {
    const updateContextFromRoute = () => {
      const context: Partial<LearningContext> = {};
      
      // Determine user role
      if (pathname.includes('/teacher/')) {
        context.userRole = 'teacher';
      } else if (pathname.includes('/admin/')) {
        context.userRole = 'admin';
      } else if (pathname.includes('/learn/')) {
        context.userRole = 'student';
      }
      
      // Extract course context
      if (params.courseId) {
        context.currentCourse = {
          id: params.courseId as string,
          title: '', // Will be populated by page context
        };
      }
      
      // Extract chapter context
      if (params.chapterId) {
        context.currentChapter = {
          id: params.chapterId as string,
          title: '', // Will be populated by page context
        };
      }
      
      // Extract section context
      if (params.sectionId) {
        context.currentSection = {
          id: params.sectionId as string,
          title: '', // Will be populated by page context
          type: 'article', // Default, will be updated
        };
      }
      
      setLearningContext(prev => ({ ...prev, ...context }));
    };
    
    updateContextFromRoute();
  }, [pathname, params]);
  
  // Load user preferences from localStorage
  useEffect(() => {
    const loadUserPreferences = () => {
      const savedStyle = localStorage.getItem('sam-learning-style');
      if (savedStyle) {
        setLearningStyle(JSON.parse(savedStyle));
      }
      
      const savedGamification = localStorage.getItem('sam-gamification');
      if (savedGamification) {
        setGamificationState(JSON.parse(savedGamification));
      }
      
      const savedPersonality = localStorage.getItem('sam-personality');
      if (savedPersonality) {
        setTutorPersonality(JSON.parse(savedPersonality));
      }
    };
    
    loadUserPreferences();
  }, []);
  
  // Save preferences on change
  useEffect(() => {
    localStorage.setItem('sam-learning-style', JSON.stringify(learningStyle));
  }, [learningStyle]);
  
  useEffect(() => {
    localStorage.setItem('sam-gamification', JSON.stringify(gamificationState));
  }, [gamificationState]);
  
  useEffect(() => {
    localStorage.setItem('sam-personality', JSON.stringify(tutorPersonality));
  }, [tutorPersonality]);
  
  // Learning context update
  const updateLearningContext = useCallback((context: Partial<LearningContext>) => {
    setLearningContext(prev => ({ ...prev, ...context }));
  }, []);
  
  // Learning style detection
  const detectLearningStyle = useCallback(async (): Promise<LearningStyle> => {
    try {
      const response = await fetch('/api/sam/ai-tutor/detect-learning-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          interactions: [], // Would include past interaction data
        }),
      });
      
      if (response.ok) {
        const detectedStyle = await response.json();
        setLearningStyle(detectedStyle);
        return detectedStyle;
      }
    } catch (error: any) {
      logger.error('Error detecting learning style:', error);
    }
    
    return learningStyle;
  }, [user, learningStyle]);
  
  // Adapt to learning style
  const adaptToLearningStyle = useCallback((style: Partial<LearningStyle>) => {
    setLearningStyle(prev => ({
      ...prev,
      ...style,
      adaptationHistory: [
        ...prev.adaptationHistory,
        {
          timestamp: new Date(),
          adaptation: JSON.stringify(style),
          effectiveness: 0, // Will be measured later
        },
      ],
    }));
  }, []);
  
  // Gamification methods
  const awardPoints = useCallback(async (points: number, reason: string) => {
    if (!user?.id) return;
    
    try {
      // Update local state immediately for responsiveness
      setGamificationState(prev => {
        const newPoints = prev.points + points;
        const newLevel = Math.floor(newPoints / 1000) + 1;
        
        return {
          ...prev,
          points: newPoints,
          level: newLevel,
        };
      });
      
      // Save to database using API
      await fetch('/api/sam/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points,
          reason,
          source: 'ai_tutor',
          courseId: learningContext.currentCourse?.id,
          chapterId: learningContext.currentChapter?.id,
          sectionId: learningContext.currentSection?.id,
        }),
      });
      
      // Record the interaction
      await fetch('/api/sam/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: SAMInteractionType.GAMIFICATION_ACTION,
          context: { points, reason, learningContext },
          result: { newPoints: gamificationState.points + points },
          courseId: learningContext.currentCourse?.id,
          chapterId: learningContext.currentChapter?.id,
          sectionId: learningContext.currentSection?.id,
        }),
      });
    } catch (error: any) {
      logger.error('Error awarding points:', error);
    }
  }, [user?.id, learningContext, gamificationState.points]);
  
  const unlockBadge = useCallback(async (badgeId: string) => {
    if (!user?.id) return;
    
    const badges: Record<string, { name: string; description: string; type: SAMBadgeType; level: BadgeLevel }> = {
      first_lesson: { 
        name: 'First Steps', 
        description: 'Completed your first lesson',
        type: 'LEARNING_MILESTONE' as SAMBadgeType,
        level: 'BRONZE' as BadgeLevel
      },
      week_streak: { 
        name: 'Dedicated Learner', 
        description: 'Maintained a 7-day streak',
        type: 'CONSISTENCY' as SAMBadgeType,
        level: 'SILVER' as BadgeLevel
      },
      perfect_exam: { 
        name: 'Perfectionist', 
        description: 'Scored 100% on an exam',
        type: 'ACHIEVEMENT' as SAMBadgeType,
        level: 'GOLD' as BadgeLevel
      },
      helper: { 
        name: 'Peer Helper', 
        description: 'Helped 5 other students',
        type: 'COLLABORATION' as SAMBadgeType,
        level: 'SILVER' as BadgeLevel
      },
    };
    
    const badge = badges[badgeId];
    if (badge) {
      try {
        // Update local state
        const newBadge = {
          id: badgeId,
          name: badge.name,
          description: badge.description,
          earnedAt: new Date(),
        };
        
        setGamificationState(prev => ({
          ...prev,
          badges: [...prev.badges, newBadge],
        }));
        
        // Save to database using API
        await fetch('/api/sam/badges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            badgeType: badge.type,
            level: badge.level,
            description: badge.description,
            requirements: { badgeId, context: learningContext },
            courseId: learningContext.currentCourse?.id,
            chapterId: learningContext.currentChapter?.id,
          }),
        });
        
        // Record the interaction
        await fetch('/api/sam/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interactionType: SAMInteractionType.GAMIFICATION_ACTION,
            context: { badgeId, badge: newBadge, learningContext },
            result: { badgeUnlocked: true },
            courseId: learningContext.currentCourse?.id,
            chapterId: learningContext.currentChapter?.id,
            sectionId: learningContext.currentSection?.id,
          }),
        });
      } catch (error: any) {
        logger.error('Error unlocking badge:', error);
      }
    }
  }, [user?.id, learningContext]);
  
  const updateStreak = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const today = new Date();
      
      setGamificationState(prev => {
        const lastActivity = new Date(prev.streaks.lastActivity);
        const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        let newCurrent = prev.streaks.current;
        if (daysDiff === 1) {
          newCurrent = prev.streaks.current + 1;
        } else if (daysDiff > 1) {
          newCurrent = 1;
        }
        
        const newStreaks = {
          current: newCurrent,
          longest: Math.max(newCurrent, prev.streaks.longest),
          lastActivity: today,
        };
        
        // Save to database using API
        fetch('/api/sam/streaks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streakType: 'daily_learning',
            currentStreak: newCurrent,
            longestStreak: newStreaks.longest,
            courseId: learningContext.currentCourse?.id,
          }),
        }).catch(console.error);
        
        // Record the interaction
        fetch('/api/sam/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interactionType: SAMInteractionType.GAMIFICATION_ACTION,
            context: { streakType: 'daily_learning', streaks: newStreaks, learningContext },
            result: { newCurrent, newLongest: newStreaks.longest },
            courseId: learningContext.currentCourse?.id,
            chapterId: learningContext.currentChapter?.id,
            sectionId: learningContext.currentSection?.id,
          }),
        }).catch(console.error);
        
        return {
          ...prev,
          streaks: newStreaks,
        };
      });
    } catch (error: any) {
      logger.error('Error updating streak:', error);
    }
  }, [user?.id, learningContext]);
  
  // Personality adjustment
  const adjustPersonality = useCallback((personality: Partial<TutorPersonality>) => {
    setTutorPersonality(prev => ({ ...prev, ...personality }));
  }, []);
  
  // Teaching methods
  const useSocraticMethod = useCallback(async (topic: string, studentAnswer: string): Promise<string> => {
    const response = await fetch('/api/sam/ai-tutor/socratic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        studentAnswer,
        context: learningContext,
        personality: tutorPersonality,
      }),
    });
    
    if (response.ok) {
      const { question } = await response.json();
      return question;
    }
    
    return "Can you tell me more about your reasoning?";
  }, [learningContext, tutorPersonality]);
  
  const generateGuidingQuestion = useCallback(async (
    concept: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<string> => {
    const response = await fetch('/api/sam/ai-tutor/guiding-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concept,
        difficulty,
        learningStyle,
        context: learningContext,
      }),
    });
    
    if (response.ok) {
      const { question } = await response.json();
      return question;
    }
    
    return "What do you already know about this concept?";
  }, [learningContext, learningStyle]);
  
  const provideScaffoldedHelp = useCallback(async (
    problem: string,
    currentStep: number
  ): Promise<string> => {
    const response = await fetch('/api/sam/ai-tutor/scaffolded-help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problem,
        currentStep,
        learningStyle,
        context: learningContext,
      }),
    });
    
    if (response.ok) {
      const { help } = await response.json();
      return help;
    }
    
    return "Let's break this down step by step...";
  }, [learningContext, learningStyle]);
  
  // Content generation
  const generateAdaptiveContent = useCallback(async (
    topic: string,
    format: 'explanation' | 'example' | 'practice'
  ): Promise<string> => {
    const response = await fetch('/api/sam/ai-tutor/adaptive-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        format,
        learningStyle,
        context: learningContext,
        personality: tutorPersonality,
      }),
    });
    
    if (response.ok) {
      const { content } = await response.json();
      return content;
    }
    
    return "";
  }, [learningContext, learningStyle, tutorPersonality]);
  
  const createVisualization = useCallback(async (concept: string): Promise<{ type: string; data: any }> => {
    // This would generate visualization data based on the concept
    return {
      type: 'flowchart',
      data: {
        nodes: [],
        edges: [],
      },
    };
  }, []);
  
  const generatePracticeProblems = useCallback(async (
    topic: string,
    count: number,
    difficulty: string
  ): Promise<any[]> => {
    const response = await fetch('/api/sam/ai-tutor/practice-problems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        count,
        difficulty,
        learningStyle,
        context: learningContext,
      }),
    });
    
    if (response.ok) {
      const { problems } = await response.json();
      return problems;
    }
    
    return [];
  }, [learningContext, learningStyle]);
  
  // Progress tracking with achievement engine
  const trackInteraction = useCallback(async (type: string, data: any) => {
    if (!user?.id) return;
    
    try {
      // Track achievements and get rewards
      const result = await trackAchievementProgress(
        user.id,
        type,
        data,
        {
          courseId: learningContext.currentCourse?.id,
          chapterId: learningContext.currentChapter?.id,
          sectionId: learningContext.currentSection?.id,
        }
      );
      
      // Update local gamification state with new points and achievements
      if (result.pointsAwarded > 0) {
        setGamificationState(prev => ({
          ...prev,
          points: prev.points + result.pointsAwarded,
          level: Math.floor((prev.points + result.pointsAwarded) / 1000) + 1,
        }));
      }
      
      // Show notifications for achievements and level ups
      if (result.achievementsUnlocked.length > 0) {
        result.achievementsUnlocked.forEach(achievement => {

        });
      }
      
      if (result.challengesCompleted.length > 0) {
        result.challengesCompleted.forEach(challenge => {

        });
      }
      
      if (result.levelUp) {
}
    } catch (error: any) {
      logger.error('Error tracking interaction with achievement engine:', error);
      
      // Fallback to basic interaction recording
      const interactionTypeMap: Record<string, SAMInteractionType> = {
        'question_asked': SAMInteractionType.CHAT_MESSAGE,
        'answer_provided': SAMInteractionType.CHAT_MESSAGE,
        'content_generated': SAMInteractionType.CONTENT_GENERATE,
        'feedback_given': SAMInteractionType.CHAT_MESSAGE,
        'explanation_requested': SAMInteractionType.LEARNING_ASSISTANCE,
        'help_requested': SAMInteractionType.LEARNING_ASSISTANCE,
        'concept_explained': SAMInteractionType.LEARNING_ASSISTANCE,
        'practice_completed': SAMInteractionType.GAMIFICATION_ACTION,
        'assessment_taken': SAMInteractionType.GAMIFICATION_ACTION,
        'progress_reviewed': SAMInteractionType.ANALYTICS_VIEW,
      };
      
      const interactionType = interactionTypeMap[type] || SAMInteractionType.CHAT_MESSAGE;
      
      fetch('/api/sam/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType,
          context: { type, data, learningContext },
          result: data,
          courseId: learningContext.currentCourse?.id,
          chapterId: learningContext.currentChapter?.id,
          sectionId: learningContext.currentSection?.id,
        }),
      }).catch(console.error);
    }
  }, [user?.id, learningContext]);
  
  const getProgressInsights = useCallback(async (): Promise<any> => {
    const response = await fetch('/api/sam/ai-tutor/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id,
        context: learningContext,
      }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return {};
  }, [user, learningContext]);
  
  const predictLearningOutcome = useCallback(async (assessmentData: any): Promise<number> => {
    const response = await fetch('/api/sam/ai-tutor/predict-outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentData,
        learningHistory: [],
        context: learningContext,
      }),
    });
    
    if (response.ok) {
      const { probability } = await response.json();
      return probability;
    }
    
    return 0.5;
  }, [learningContext]);
  
  // Emotional intelligence
  const detectLearnerEmotion = useCallback(async (
    text: string
  ): Promise<'frustrated' | 'confused' | 'confident' | 'bored' | 'engaged'> => {
    const response = await fetch('/api/sam/ai-tutor/detect-emotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    
    if (response.ok) {
      const { emotion } = await response.json();
      return emotion;
    }
    
    return 'engaged';
  }, []);
  
  const respondToEmotion = useCallback(async (emotion: string): Promise<string> => {
    const responses: Record<string, string> = {
      frustrated: "I understand this can be challenging. Let's take a different approach and break it down together.",
      confused: "No worries! Let's clarify this concept. What specific part would you like me to explain differently?",
      confident: "Excellent! You're really grasping this concept. Ready for a more challenging problem?",
      bored: "Let's make this more interesting! How about we try a real-world application of this concept?",
      engaged: "Great to see you're engaged! Keep up the excellent work!",
    };
    
    return responses[emotion] || "Let's continue learning together!";
  }, []);
  
  // Collaboration features
  const findStudyPartners = useCallback(async (criteria: any): Promise<any[]> => {
    // This would connect to a matching service
    return [];
  }, []);
  
  const facilitatePeerLearning = useCallback(async (topic: string, peers: string[]): Promise<void> => {
    // This would create a collaborative learning session
  }, []);
  
  // Teacher support
  const generateStudentInsights = useCallback(async (studentId: string): Promise<any> => {
    const response = await fetch('/api/sam/ai-tutor/student-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return {};
  }, []);
  
  const suggestInterventions = useCallback(async (studentPerformance: any): Promise<string[]> => {
    const response = await fetch('/api/sam/ai-tutor/suggest-interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentPerformance }),
    });
    
    if (response.ok) {
      const { interventions } = await response.json();
      return interventions;
    }
    
    return [];
  }, []);
  
  const createRubric = useCallback(async (assignment: any): Promise<any> => {
    const response = await fetch('/api/sam/ai-tutor/create-rubric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return {};
  }, []);
  
  // Create the value object with all methods
  const value: SamAITutorContextType = {
    learningContext,
    updateLearningContext,
    learningStyle,
    detectLearningStyle,
    adaptToLearningStyle,
    gamificationState,
    awardPoints,
    unlockBadge,
    updateStreak,
    tutorPersonality,
    adjustPersonality,
    useSocraticMethod,
    generateGuidingQuestion,
    provideScaffoldedHelp,
    generateAdaptiveContent,
    createVisualization,
    generatePracticeProblems,
    trackInteraction,
    getProgressInsights,
    predictLearningOutcome,
    detectLearnerEmotion,
    respondToEmotion,
    findStudyPartners,
    facilitatePeerLearning,
    generateStudentInsights,
    suggestInterventions,
    createRubric,
  };
  
  // Use Global SAM Provider (already available globally)
  return (
    <SamAITutorContext.Provider value={value}>
      {children}
    </SamAITutorContext.Provider>
  );
}

// Combined hook that provides both Enhanced SAM and AI Tutor features
export function useSamAITutor() {
  const tutorContext = useContext(SamAITutorContext);
  const globalSamContext = useSAMGlobal();
  
  if (!tutorContext) {
    throw new Error('useSamAITutor must be used within SamAITutorProvider');
  }
  
  // Combine both contexts
  return {
    ...globalSamContext,
    ...tutorContext,
  };
}

// Export specific hooks for convenience
export function useLearningContext() {
  const context = useSamAITutor();
  return {
    learningContext: context.learningContext,
    updateLearningContext: context.updateLearningContext,
  };
}

export function useGamification() {
  const context = useSamAITutor();
  return {
    gamificationState: context.gamificationState,
    awardPoints: context.awardPoints,
    unlockBadge: context.unlockBadge,
    updateStreak: context.updateStreak,
  };
}

export function useTeachingMethods() {
  const context = useSamAITutor();
  return {
    useSocraticMethod: context.useSocraticMethod,
    generateGuidingQuestion: context.generateGuidingQuestion,
    provideScaffoldedHelp: context.provideScaffoldedHelp,
    generateAdaptiveContent: context.generateAdaptiveContent,
  };
}