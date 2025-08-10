// Learning Pattern Detection with Redis

import { redis, REDIS_KEYS, REDIS_TTL } from './config';
import { TrackingEvent } from '@/lib/analytics/types';
import { logger } from '@/lib/logger';

interface StudySession {
  startTime: number;
  endTime?: number;
  duration?: number;
  interactions: number;
  coursesVisited: string[];
}

export class LearningPatternDetector {
  // Detect optimal study times for a student
  static async detectOptimalStudyTimes(userId: string): Promise<number[]> {
    if (!redis) return [];

    const key = `patterns:${userId}:study_hours`;
    const hourlyActivity = await redis.hgetall(key) || {};
    
    // Find hours with highest engagement
    const hoursWithScores = Object.entries(hourlyActivity)
      .map(([hour, score]) => ({
        hour: parseInt(hour),
        score: parseInt(score as string)
      }))
      .sort((a, b) => b.score - a.score);
    
    // Return top 3 hours
    return hoursWithScores.slice(0, 3).map(item => item.hour);
  }

  // Track study session patterns
  static async trackStudySession(userId: string, event: TrackingEvent): Promise<void> {
    if (!redis) return;

    const sessionKey = `session:current:${userId}`;
    const session = await redis.get(sessionKey);
    
    if (!session) {
      // Start new session
      const newSession: StudySession = {
        startTime: Date.now(),
        interactions: 1,
        coursesVisited: event.courseId ? [event.courseId] : []
      };
      
      await redis.setex(
        sessionKey,
        REDIS_TTL.SESSION,
        JSON.stringify(newSession)
      );
    } else {
      // Update existing session
      try {
        const currentSession: StudySession = JSON.parse(session as string);
        currentSession.interactions++;
      
        if (event.courseId && !currentSession.coursesVisited.includes(event.courseId)) {
          currentSession.coursesVisited.push(event.courseId);
        }
        
        await redis.setex(
          sessionKey,
          REDIS_TTL.SESSION,
          JSON.stringify(currentSession)
        );
      } catch (error) {
        logger.warn('Failed to parse learning session data for user:', userId, error);
        // Clear corrupted session and create new one
        await redis.del(sessionKey);
        const newSession: StudySession = {
          userId,
          startTime: new Date(),
          interactions: 1,
          coursesVisited: event.courseId ? [event.courseId] : [],
        };
        await redis.setex(
          sessionKey,
          REDIS_TTL.SESSION,
          JSON.stringify(newSession)
        );
      }
    }
    
    // Track hourly patterns
    const hour = new Date().getHours();
    await redis.hincrby(`patterns:${userId}:study_hours`, hour.toString(), 1);
  }

  // Detect content preference patterns
  static async detectContentPreferences(userId: string): Promise<{
    video: number;
    text: number;
    interactive: number;
    quiz: number;
  }> {
    if (!redis) return { video: 0, text: 0, interactive: 0, quiz: 0 };

    const key = `patterns:${userId}:content_prefs`;
    const prefs = await redis.hgetall(key) || {};
    
    const total = Object.values(prefs).reduce((sum, val) => sum + parseInt(val as string), 0);
    
    if (total === 0) {
      return { video: 25, text: 25, interactive: 25, quiz: 25 };
    }
    
    return {
      video: Math.round((parseInt(prefs.video || '0') / total) * 100),
      text: Math.round((parseInt(prefs.text || '0') / total) * 100),
      interactive: Math.round((parseInt(prefs.interactive || '0') / total) * 100),
      quiz: Math.round((parseInt(prefs.quiz || '0') / total) * 100)
    };
  }

  // Detect struggling topics based on behavior
  static async detectStrugglingTopics(
    userId: string,
    courseId: string
  ): Promise<string[]> {
    if (!redis) return [];

    const key = `struggles:${userId}:${courseId}`;
    const struggles = await redis.zrange(key, 0, -1, { rev: true, withScores: true });
    
    // Topics with high struggle scores
    return struggles
      ?.filter((item: any) => item.score > 5)
      .map((item: any) => item.value) || [];
  }

  // Track topic struggles
  static async trackTopicStruggle(
    userId: string,
    courseId: string,
    topicId: string,
    event: TrackingEvent
  ): Promise<void> {
    if (!redis) return;

    const key = `struggles:${userId}:${courseId}`;
    let score = 0;
    
    // Different events indicate different levels of struggle
    if (event.eventType === 'video' && event.eventName === 'video_pause') {
      score = 1;
    } else if (event.eventType === 'video' && event.eventName === 'video_seek') {
      const seekDistance = Math.abs(event.properties.seekDistance || 0);
      if (seekDistance > 10) score = 2; // Significant rewind
    } else if (event.eventType === 'quiz' && event.properties.score < 70) {
      score = 3;
    } else if (event.eventName === 'content_revisit') {
      score = 2;
    }
    
    if (score > 0) {
      await redis.zincrby(key, score, topicId);
      await redis.expire(key, REDIS_TTL.METRICS);
    }
  }

  // Calculate learning velocity
  static async calculateLearningVelocity(
    userId: string,
    courseId: string
  ): Promise<number> {
    if (!redis) return 0;

    const key = `velocity:${userId}:${courseId}`;
    const progressData = await redis.hgetall(key) || {};
    
    const sectionsCompleted = parseInt(progressData.sectionsCompleted || '0');
    const timeSpent = parseInt(progressData.timeSpent || '1');
    
    // Sections per hour
    const velocity = (sectionsCompleted / (timeSpent / 3600)) || 0;
    
    // Store velocity
    await redis.hset(REDIS_KEYS.LEARNING_VELOCITY(userId), courseId, velocity);
    
    return Math.round(velocity * 100) / 100;
  }

  // Detect learning style
  static async detectLearningStyle(userId: string): Promise<{
    style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    confidence: number;
  }> {
    if (!redis) return { style: 'mixed', confidence: 0 };

    const patterns = await redis.hgetall(`patterns:${userId}:interactions`) || {};
    
    const scores = {
      visual: parseInt(patterns.video_watch || '0') + parseInt(patterns.image_view || '0'),
      auditory: parseInt(patterns.audio_play || '0') + parseInt(patterns.video_audio || '0'),
      kinesthetic: parseInt(patterns.code_interact || '0') + parseInt(patterns.quiz_complete || '0')
    };
    
    const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    if (total === 0) return { style: 'mixed', confidence: 0 };
    
    const percentages = {
      visual: (scores.visual / total) * 100,
      auditory: (scores.auditory / total) * 100,
      kinesthetic: (scores.kinesthetic / total) * 100
    };
    
    // Determine dominant style
    const dominant = Object.entries(percentages)
      .sort(([, a], [, b]) => b - a)[0];
    
    const style = dominant[1] > 50 ? dominant[0] : 'mixed';
    const confidence = Math.min(dominant[1], 100);
    
    return {
      style: style as any,
      confidence: Math.round(confidence)
    };
  }

  // Get comprehensive learning patterns
  static async getLearningPatterns(userId: string): Promise<any> {
    const [
      optimalHours,
      contentPrefs,
      learningStyle,
      velocity
    ] = await Promise.all([
      this.detectOptimalStudyTimes(userId),
      this.detectContentPreferences(userId),
      this.detectLearningStyle(userId),
      redis?.hgetall(REDIS_KEYS.LEARNING_VELOCITY(userId)) || {
}
    ]);
    
    return {
      optimalStudyHours: optimalHours,
      contentPreferences: contentPrefs,
      learningStyle: learningStyle,
      averageVelocity: Object.values(velocity)
        .reduce((sum, val) => sum + parseFloat(val as string), 0) / 
        Object.keys(velocity).length || 0,
      lastUpdated: new Date()
    };
  }
}