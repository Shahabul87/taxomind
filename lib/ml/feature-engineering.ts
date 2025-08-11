// Feature Engineering for ML Models

import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { StudentFeatures, ContentPreference, LearningStyle } from './types';

export class FeatureEngineer {
  // Extract features for a student in a course
  async extractStudentFeatures(
    studentId: string,
    courseId: string
  ): Promise<StudentFeatures> {
    // Get raw data from multiple sources
    const [
      interactions,
      metrics,
      enrollment,
      videoStats,
      quizScores,
      patterns
    ] = await Promise.all([
      this.getInteractionData(studentId, courseId),
      this.getMetricsData(studentId, courseId),
      this.getEnrollmentData(studentId, courseId),
      this.getVideoStats(studentId, courseId),
      this.getQuizScores(studentId, courseId),
      this.getLearningPatterns(studentId)
    ]);

    // Engineer features
    const features: StudentFeatures = {
      // Engagement metrics
      engagementScore: metrics.avgEngagement || 50,
      averageSessionDuration: this.calculateAvgSessionDuration(interactions),
      totalInteractions: interactions.length,
      clickRate: this.calculateClickRate(interactions),
      scrollDepth: this.calculateAvgScrollDepth(interactions),
      
      // Video metrics
      videoCompletionRate: videoStats.completionRate,
      averageWatchTime: videoStats.avgWatchTime,
      pauseFrequency: videoStats.pauseFrequency,
      seekCount: videoStats.seekCount,
      replayCount: videoStats.replayCount,
      
      // Learning metrics
      quizScore: quizScores.average,
      assignmentCompletionRate: enrollment?.progressPercentage || 0,
      timeToComplete: this.estimateTimeToComplete(enrollment, patterns),
      strugglingTopicsCount: await this.getStrugglingTopicsCount(studentId, courseId),
      
      // Behavioral patterns
      preferredStudyTime: patterns?.preferredStudyTime || this.getDefaultStudyTime(),
      studyFrequency: this.calculateStudyFrequency(interactions),
      contentTypePreference: this.calculateContentPreference(interactions),
      learningStyle: await this.detectLearningStyle(studentId, interactions),
      
      // Progress metrics
      courseProgress: enrollment?.progressPercentage || 0,
      moduleCompletionRate: await this.calculateModuleCompletionRate(studentId, courseId),
      consistencyScore: this.calculateConsistencyScore(interactions)
    };

    return features;
  }

  // Get interaction data
  private async getInteractionData(studentId: string, courseId: string) {
    return db.sAMInteraction.findMany({
      where: {
        studentId,
        courseId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  // Get metrics data
  private async getMetricsData(studentId: string, courseId: string) {
    const metrics = await db.learning_metrics.aggregate({
      where: { studentId, courseId },
      _avg: {
        engagementScore: true,
        timeSpent: true,
        videoWatchTime: true
      }
    });

    return {
      avgEngagement: metrics._avg.engagementScore || 0,
      avgTimeSpent: metrics._avg.timeSpent || 0,
      avgVideoTime: metrics._avg.videoWatchTime || 0
    };
  }

  // Get enrollment data
  private async getEnrollmentData(studentId: string, courseId: string) {
    return db.userCourseEnrollment.findUnique({
      where: {
        userId_courseId: { userId: studentId, courseId }
      }
    });
  }

  // Get video statistics
  private async getVideoStats(studentId: string, courseId: string) {
    const videoEvents = await db.sAMInteraction.findMany({
      where: {
        studentId,
        courseId,
        eventName: {
          in: ['video_play', 'video_pause', 'video_complete', 'video_seek']
        }
      }
    });

    const stats = {
      completionRate: 0,
      avgWatchTime: 0,
      pauseFrequency: 0,
      seekCount: 0,
      replayCount: 0
    };

    if (videoEvents.length === 0) return stats;

    // Calculate statistics
    const videoSessions = new Map<string, any[]>();
    videoEvents.forEach(event => {
      const videoId = event.metadata?.videoId;
      if (!videoId) return;
      
      if (!videoSessions.has(videoId)) {
        videoSessions.set(videoId, []);
      }
      videoSessions.get(videoId)!.push(event);
    });

    let totalCompleted = 0;
    let totalWatchTime = 0;
    let totalPauses = 0;
    let totalSeeks = 0;

    videoSessions.forEach((events, videoId) => {
      const completed = events.some(e => e.eventName === 'video_complete');
      if (completed) totalCompleted++;
      
      const pauses = events.filter((e: any) => e.eventName === 'video_pause').length;
      totalPauses += pauses;
      
      const seeks = events.filter((e: any) => e.eventName === 'video_seek').length;
      totalSeeks += seeks;
      
      // Estimate watch time from events
      const watchTime = this.estimateVideoWatchTime(events);
      totalWatchTime += watchTime;
    });

    stats.completionRate = videoSessions.size > 0 
      ? (totalCompleted / videoSessions.size) * 100 
      : 0;
    stats.avgWatchTime = videoSessions.size > 0 
      ? totalWatchTime / videoSessions.size 
      : 0;
    stats.pauseFrequency = videoSessions.size > 0 
      ? totalPauses / videoSessions.size 
      : 0;
    stats.seekCount = totalSeeks;

    return stats;
  }

  // Get quiz scores
  private async getQuizScores(studentId: string, courseId: string) {
    const quizEvents = await db.sAMInteraction.findMany({
      where: {
        studentId,
        courseId,
        eventName: 'quiz_submit'
      }
    });

    if (quizEvents.length === 0) {
      return { average: 0, count: 0 };
    }

    const scores = quizEvents
      .map(e => e.metadata?.score)
      .filter(score => score !== undefined);

    const average = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    return { average, count: scores.length };
  }

  // Get learning patterns (replaced with learning_metrics)
  private async getLearningPatterns(studentId: string) {
    return db.learning_metrics.findFirst({
      where: { userId: studentId }
    });
  }

  // Calculate average session duration
  private calculateAvgSessionDuration(interactions: any[]): number {
    if (interactions.length === 0) return 0;

    const sessions = new Map<string, { start: Date; end: Date }>();
    
    interactions.forEach(interaction => {
      const sessionId = interaction.sessionId;
      const timestamp = new Date(interaction.timestamp);
      
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { start: timestamp, end: timestamp });
      } else {
        const session = sessions.get(sessionId)!;
        if (timestamp < session.start) session.start = timestamp;
        if (timestamp > session.end) session.end = timestamp;
      }
    });

    let totalDuration = 0;
    sessions.forEach(session => {
      const duration = session.end.getTime() - session.start.getTime();
      totalDuration += duration;
    });

    return sessions.size > 0 ? totalDuration / sessions.size / 1000 / 60 : 0; // Minutes
  }

  // Calculate click rate
  private calculateClickRate(interactions: any[]): number {
    const clicks = interactions.filter(i => i.eventName === 'click').length;
    const views = interactions.filter(i => i.eventName === 'section_view').length;
    
    return views > 0 ? clicks / views : 0;
  }

  // Calculate average scroll depth
  private calculateAvgScrollDepth(interactions: any[]): number {
    const scrollEvents = interactions.filter(i => i.eventName === 'scroll_milestone');
    
    if (scrollEvents.length === 0) return 0;
    
    const depths = scrollEvents
      .map(e => e.metadata?.depth)
      .filter(d => d !== undefined);
    
    return depths.length > 0
      ? depths.reduce((sum, depth) => sum + depth, 0) / depths.length
      : 0;
  }

  // Estimate time to complete
  private estimateTimeToComplete(enrollment: any, patterns: any): number {
    if (!enrollment) return 0;
    
    const progress = enrollment.progressPercentage || 0;
    const velocity = patterns?.learningVelocity || 5; // Default 5% per week
    
    if (progress >= 100) return 0;
    if (velocity <= 0) return 999; // Max value
    
    const remainingProgress = 100 - progress;
    const weeksToComplete = remainingProgress / velocity;
    
    return Math.round(weeksToComplete * 7); // Days
  }

  // Get struggling topics count
  private async getStrugglingTopicsCount(
    studentId: string,
    courseId: string
  ): Promise<number> {
    const key = `struggling_areas:${studentId}`;
    const areas = await redis.smembers(key);
    return areas.length;
  }

  // Get default study time distribution
  private getDefaultStudyTime(): number[] {
    // Default: higher probability during evening hours
    const distribution = new Array(24).fill(0);
    // Morning (6-9)
    for (let i = 6; i < 9; i++) distribution[i] = 0.1;
    // Evening (18-22)
    for (let i = 18; i < 22; i++) distribution[i] = 0.2;
    // Late night (22-24)
    for (let i = 22; i < 24; i++) distribution[i] = 0.15;
    
    return distribution;
  }

  // Calculate study frequency
  private calculateStudyFrequency(interactions: any[]): number {
    if (interactions.length === 0) return 0;
    
    const uniqueDays = new Set(
      interactions.map(i => 
        new Date(i.timestamp).toISOString().split('T')[0]
      )
    );
    
    const firstDay = new Date(interactions[0].timestamp);
    const lastDay = new Date(interactions[interactions.length - 1].timestamp);
    const totalDays = Math.ceil(
      (lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return totalDays > 0 ? uniqueDays.size / totalDays : 0;
  }

  // Calculate content preference
  private calculateContentPreference(interactions: any[]): ContentPreference {
    const counts = {
      video: 0,
      text: 0,
      interactive: 0,
      quiz: 0
    };

    interactions.forEach(interaction => {
      if (interaction.eventName.includes('video')) counts.video++;
      else if (interaction.eventName.includes('quiz')) counts.quiz++;
      else if (interaction.eventName === 'form_submit') counts.interactive++;
      else counts.text++;
    });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    return {
      video: total > 0 ? counts.video / total : 0.25,
      text: total > 0 ? counts.text / total : 0.25,
      interactive: total > 0 ? counts.interactive / total : 0.25,
      quiz: total > 0 ? counts.quiz / total : 0.25
    };
  }

  // Detect learning style
  private async detectLearningStyle(
    studentId: string,
    interactions: any[]
  ): Promise<LearningStyle> {
    // Analyze interaction patterns to determine learning style
    const videoInteractions = interactions.filter(i => i.eventName.includes('video'));
    const readingTime = interactions.filter(i => 
      i.eventName === 'section_view' || i.eventName === 'scroll_milestone'
    );
    const interactiveElements = interactions.filter(i => 
      i.eventName === 'click' || i.eventName === 'form_submit'
    );

    const total = interactions.length;
    
    return {
      visual: total > 0 ? videoInteractions.length / total * 0.5 : 0.25,
      auditory: total > 0 ? videoInteractions.length / total * 0.5 : 0.25,
      kinesthetic: total > 0 ? interactiveElements.length / total : 0.25,
      reading: total > 0 ? readingTime.length / total : 0.25
    };
  }

  // Estimate video watch time
  private estimateVideoWatchTime(events: any[]): number {
    let watchTime = 0;
    let lastPlayTime = 0;
    
    events.forEach(event => {
      if (event.eventName === 'video_play') {
        lastPlayTime = event.metadata?.currentTime || 0;
      } else if (event.eventName === 'video_pause' || event.eventName === 'video_complete') {
        const currentTime = event.metadata?.currentTime || 0;
        if (lastPlayTime !== null) {
          watchTime += currentTime - lastPlayTime;
        }
        lastPlayTime = 0;
      }
    });
    
    return watchTime;
  }

  // Calculate module completion rate
  private async calculateModuleCompletionRate(
    studentId: string,
    courseId: string
  ): Promise<number> {
    const course = await db.Course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: true
          }
        }
      }
    });

    if (!course) return 0;

    const completedSections = await db.sAMInteraction.findMany({
      where: {
        studentId,
        courseId,
        eventName: 'section_complete'
      },
      distinct: ['sectionId']
    });

    const totalSections = course.chapters.reduce(
      (sum, chapter) => sum + chapter.sections.length,
      0
    );

    return totalSections > 0 
      ? (completedSections.length / totalSections) * 100 
      : 0;
  }

  // Calculate consistency score
  private calculateConsistencyScore(interactions: any[]): number {
    if (interactions.length < 7) return 0;

    // Group interactions by day
    const dayActivity = new Map<string, number>();
    
    interactions.forEach(interaction => {
      const day = new Date(interaction.timestamp).toISOString().split('T')[0];
      dayActivity.set(day, (dayActivity.get(day) || 0) + 1);
    });

    // Calculate standard deviation of daily activity
    const dailyCounts = Array.from(dayActivity.values());
    const avg = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
    const variance = dailyCounts.reduce((sum, count) => 
      sum + Math.pow(count - avg, 2), 0
    ) / dailyCounts.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, 100 - (stdDev / avg) * 100);
    
    return Math.round(consistencyScore);
  }
}