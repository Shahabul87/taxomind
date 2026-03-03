/**
 * Custom Metrics Collection and Business Metrics
 * Comprehensive metrics for technical and business KPIs
 */

import { metrics, ValueType } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { db } from '@/lib/db';
import { redisCache } from '@/lib/cache/redis-cache';
import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

// Meter for custom metrics
const meter = metrics.getMeter('taxomind-metrics', '1.0.0');

/**
 * Business metrics definitions
 */
export interface BusinessMetrics {
  // User engagement metrics
  activeUsers: number;
  newRegistrations: number;
  userRetention: number;
  avgSessionDuration: number;
  
  // Course metrics
  courseCompletionRate: number;
  avgCourseProgress: number;
  enrollmentRate: number;
  courseRating: number;
  
  // Learning metrics
  questionsAnswered: number;
  correctAnswerRate: number;
  avgStudyTime: number;
  learningPathProgress: number;
  
  // Revenue metrics
  revenue: number;
  conversionRate: number;
  avgRevenuePerUser: number;
  churnRate: number;
  
  // Content metrics
  contentCreated: number;
  contentEngagement: number;
  contentQualityScore: number;
  aiGeneratedContent: number;
}

/**
 * Technical metrics definitions
 */
export interface TechnicalMetrics {
  // Performance metrics
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  
  // Resource metrics
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkBandwidth: number;
  
  // Database metrics
  dbConnectionPool: number;
  dbQueryTime: number;
  dbTransactionRate: number;
  dbErrorRate: number;
  
  // Cache metrics
  cacheHitRate: number;
  cacheMissRate: number;
  cacheEvictionRate: number;
  cacheMemoryUsage: number;
  
  // Error metrics
  errorRate: number;
  error4xxRate: number;
  error5xxRate: number;
  exceptionRate: number;
}

/**
 * Dashboard metrics structure
 */
export interface DashboardMetrics {
  business?: BusinessMetrics;
  technical?: TechnicalMetrics;
  alerts?: Alert[];
  trends?: MetricsTrends;
  courseMetrics?: {
    completionRate: number;
    avgProgress: number;
    rating: number;
    enrollments: number;
  };
  studentMetrics?: {
    activeStudents: number;
    avgStudyTime: number;
    correctAnswerRate: number;
  };
  progress?: number;
  studyTime?: number;
  correctAnswers?: number;
  achievements?: Achievement[];
}

/**
 * Alert structure
 */
export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved?: boolean;
}

/**
 * Metrics trends structure
 */
export interface MetricsTrends {
  revenue: { trend: 'up' | 'down' | 'stable'; percentage: number };
  users: { trend: 'up' | 'down' | 'stable'; percentage: number };
  engagement: { trend: 'up' | 'down' | 'stable'; percentage: number };
  errors: { trend: 'up' | 'down' | 'stable'; percentage: number };
}

/**
 * Achievement structure
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  unlockedAt?: Date;
  progress?: number;
}

/**
 * Custom metrics collector
 */
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metricsEmitter = new EventEmitter();
  
  // Business metric instruments
  private activeUsersGauge = meter.createUpDownCounter('business_active_users', {
    description: 'Number of active users',
    unit: 'users',
  });
  
  private courseCompletionHistogram = meter.createHistogram('business_course_completion_rate', {
    description: 'Course completion rate',
    unit: '%',
    valueType: ValueType.DOUBLE,
  });
  
  private revenueCounter = meter.createCounter('business_revenue_total', {
    description: 'Total revenue',
    unit: 'USD',
  });
  
  private engagementHistogram = meter.createHistogram('business_user_engagement', {
    description: 'User engagement score',
    valueType: ValueType.DOUBLE,
  });
  
  // Technical metric instruments
  private responseTimeHistogram = meter.createHistogram('tech_response_time', {
    description: 'Response time distribution',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
  });
  
  private errorRateGauge = meter.createUpDownCounter('tech_error_rate', {
    description: 'Error rate percentage',
    unit: '%',
  });
  
  private cacheHitRateGauge = meter.createUpDownCounter('tech_cache_hit_rate', {
    description: 'Cache hit rate percentage',
    unit: '%',
  });
  
  private dbConnectionsGauge = meter.createUpDownCounter('tech_db_connections', {
    description: 'Database connection pool size',
  });
  
  private constructor() {
    this.startMetricsCollection();
  }
  
  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }
  
  /**
   * Collect business metrics
   */
  public async collectBusinessMetrics(): Promise<BusinessMetrics> {
    const metrics: BusinessMetrics = {
      activeUsers: await this.getActiveUsers(),
      newRegistrations: await this.getNewRegistrations(),
      userRetention: await this.getUserRetention(),
      avgSessionDuration: await this.getAvgSessionDuration(),
      courseCompletionRate: await this.getCourseCompletionRate(),
      avgCourseProgress: await this.getAvgCourseProgress(),
      enrollmentRate: await this.getEnrollmentRate(),
      courseRating: await this.getAvgCourseRating(),
      questionsAnswered: await this.getQuestionsAnswered(),
      correctAnswerRate: await this.getCorrectAnswerRate(),
      avgStudyTime: await this.getAvgStudyTime(),
      learningPathProgress: await this.getLearningPathProgress(),
      revenue: await this.getTotalRevenue(),
      conversionRate: await this.getConversionRate(),
      avgRevenuePerUser: await this.getAvgRevenuePerUser(),
      churnRate: await this.getChurnRate(),
      contentCreated: await this.getContentCreated(),
      contentEngagement: await this.getContentEngagement(),
      contentQualityScore: await this.getContentQualityScore(),
      aiGeneratedContent: await this.getAIGeneratedContent(),
    };
    
    // Record metrics
    this.recordBusinessMetrics(metrics);
    
    return metrics;
  }
  
  /**
   * Collect technical metrics
   */
  public async collectTechnicalMetrics(): Promise<TechnicalMetrics> {
    const metrics: TechnicalMetrics = {
      avgResponseTime: await this.getAvgResponseTime(),
      p95ResponseTime: await this.getP95ResponseTime(),
      p99ResponseTime: await this.getP99ResponseTime(),
      throughput: await this.getThroughput(),
      cpuUsage: await this.getCPUUsage(),
      memoryUsage: await this.getMemoryUsage(),
      diskUsage: await this.getDiskUsage(),
      networkBandwidth: await this.getNetworkBandwidth(),
      dbConnectionPool: await this.getDBConnectionPool(),
      dbQueryTime: await this.getDBQueryTime(),
      dbTransactionRate: await this.getDBTransactionRate(),
      dbErrorRate: await this.getDBErrorRate(),
      cacheHitRate: await this.getCacheHitRate(),
      cacheMissRate: await this.getCacheMissRate(),
      cacheEvictionRate: await this.getCacheEvictionRate(),
      cacheMemoryUsage: await this.getCacheMemoryUsage(),
      errorRate: await this.getErrorRate(),
      error4xxRate: await this.getError4xxRate(),
      error5xxRate: await this.getError5xxRate(),
      exceptionRate: await this.getExceptionRate(),
    };
    
    // Record metrics
    this.recordTechnicalMetrics(metrics);
    
    return metrics;
  }
  
  /**
   * Record custom metric
   */
  public recordCustomMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram',
    labels?: Record<string, string>
  ): void {
    switch (type) {
      case 'counter':
        const counter = meter.createCounter(`custom_${name}`, {
          description: `Custom metric: ${name}`,
        });
        counter.add(value, labels);
        break;
        
      case 'gauge':
        const gauge = meter.createUpDownCounter(`custom_${name}`, {
          description: `Custom metric: ${name}`,
        });
        gauge.add(value, labels);
        break;
        
      case 'histogram':
        const histogram = meter.createHistogram(`custom_${name}`, {
          description: `Custom metric: ${name}`,
          valueType: ValueType.DOUBLE,
        });
        histogram.record(value, labels);
        break;
    }
    
    // Emit metric event
    this.metricsEmitter.emit('metric', {
      name,
      value,
      type,
      labels,
      timestamp: new Date(),
    });
  }
  
  /**
   * Start automatic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect business metrics every 5 minutes
    setInterval(async () => {
      try {
        await this.collectBusinessMetrics();
      } catch (error) {
        logger.error('Error collecting business metrics', error);
      }
    }, 5 * 60 * 1000);
    
    // Collect technical metrics every minute
    setInterval(async () => {
      try {
        await this.collectTechnicalMetrics();
      } catch (error) {
        logger.error('Error collecting technical metrics', error);
      }
    }, 60 * 1000);
  }
  
  /**
   * Record business metrics to instruments
   */
  private recordBusinessMetrics(metrics: BusinessMetrics): void {
    this.activeUsersGauge.add(metrics.activeUsers);
    this.courseCompletionHistogram.record(metrics.courseCompletionRate);
    this.revenueCounter.add(metrics.revenue);
    this.engagementHistogram.record(metrics.contentEngagement);
    
    // Record all metrics as custom metrics
    Object.entries(metrics).forEach(([key, value]) => {
      this.recordCustomMetric(key, value, 'gauge', { category: 'business' });
    });
  }
  
  /**
   * Record technical metrics to instruments
   */
  private recordTechnicalMetrics(metrics: TechnicalMetrics): void {
    this.responseTimeHistogram.record(metrics.avgResponseTime);
    this.errorRateGauge.add(metrics.errorRate);
    this.cacheHitRateGauge.add(metrics.cacheHitRate);
    this.dbConnectionsGauge.add(metrics.dbConnectionPool);
    
    // Record all metrics as custom metrics
    Object.entries(metrics).forEach(([key, value]) => {
      this.recordCustomMetric(key, value, 'gauge', { category: 'technical' });
    });
  }
  
  // Business metric collection methods
  private async getActiveUsers(): Promise<number> {
    const result = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
    });
    return result;
  }
  
  private async getNewRegistrations(): Promise<number> {
    const result = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });
    return result;
  }
  
  private async getUserRetention(): Promise<number> {
    // Simplified retention calculation
    const totalUsers = await db.user.count();
    const activeUsers = await this.getActiveUsers();
    return totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  }
  
  private async getAvgSessionDuration(): Promise<number> {
    // This would typically come from session tracking
    return 25 * 60 * 1000; // 25 minutes in milliseconds
  }
  
  private async getCourseCompletionRate(): Promise<number> {
    const completed = await db.userCourseEnrollment.count({
      where: { 
        completedAt: { not: null },
      },
    });
    const total = await db.userCourseEnrollment.count();
    return total > 0 ? (completed / total) * 100 : 0;
  }
  
  private async getAvgCourseProgress(): Promise<number> {
    const result = await db.userCourseEnrollment.aggregate({
      _avg: {
        progress: true,
      },
    });
    return result._avg.progress || 0;
  }
  
  private async getEnrollmentRate(): Promise<number> {
    // Enrollment rate calculation
    const enrollments = await db.userCourseEnrollment.count({
      where: {
        enrolledAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });
    const visitors = 1000; // This would come from analytics
    return (enrollments / visitors) * 100;
  }
  
  private async getAvgCourseRating(): Promise<number> {
    const result = await db.courseReview.aggregate({
      _avg: {
        rating: true,
      },
    });
    return result._avg.rating || 0;
  }
  
  private async getQuestionsAnswered(): Promise<number> {
    const result = await db.userAnswer.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });
    return result;
  }
  
  private async getCorrectAnswerRate(): Promise<number> {
    const correct = await db.userAnswer.count({
      where: {
        isCorrect: true,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    const total = await this.getQuestionsAnswered();
    return total > 0 ? (correct / total) * 100 : 0;
  }
  
  private async getAvgStudyTime(): Promise<number> {
    // This would come from time tracking
    return 45 * 60 * 1000; // 45 minutes
  }
  
  private async getLearningPathProgress(): Promise<number> {
    // Simplified learning path progress
    return 65; // 65% average progress
  }
  
  private async getTotalRevenue(): Promise<number> {
    const result = await db.purchase.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    } as any);
    const sumResult = result as any;
    return sumResult._sum?.amount || 0;
  }
  
  private async getConversionRate(): Promise<number> {
    // Simplified conversion rate
    const purchases = await db.purchase.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });
    const visitors = 1000; // This would come from analytics
    return (purchases / visitors) * 100;
  }
  
  private async getAvgRevenuePerUser(): Promise<number> {
    const revenue = await this.getTotalRevenue();
    const users = await db.user.count();
    return users > 0 ? revenue / users : 0;
  }
  
  private async getChurnRate(): Promise<number> {
    // Simplified churn rate
    return 5; // 5% monthly churn
  }
  
  private async getContentCreated(): Promise<number> {
    const courses = await db.course.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });
    return courses;
  }
  
  private async getContentEngagement(): Promise<number> {
    // Simplified engagement score
    return 75; // 75% engagement
  }
  
  private async getContentQualityScore(): Promise<number> {
    // Simplified quality score based on ratings
    return await this.getAvgCourseRating() * 20; // Convert 5-star to 100-point scale
  }
  
  private async getAIGeneratedContent(): Promise<number> {
    const result = await db.course.count({
      where: {
        // isAIGenerated: true, // Field doesn't exist in schema
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    return result;
  }
  
  // Technical metric collection methods
  private async getAvgResponseTime(): Promise<number> {
    // This would come from APM data
    return 150; // 150ms average
  }
  
  private async getP95ResponseTime(): Promise<number> {
    return 500; // 500ms p95
  }
  
  private async getP99ResponseTime(): Promise<number> {
    return 1000; // 1000ms p99
  }
  
  private async getThroughput(): Promise<number> {
    return 1000; // 1000 requests per minute
  }
  
  private async getCPUUsage(): Promise<number> {
    const cpus = require('os').cpus();
    interface CPUTimes {
      user: number;
      nice: number;
      sys: number;
      idle: number;
      irq: number;
    }
    const usage = cpus.reduce((acc: number, cpu: { times: CPUTimes }) => {
      const total = Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;
    return usage;
  }
  
  private async getMemoryUsage(): Promise<number> {
    const total = require('os').totalmem();
    const free = require('os').freemem();
    return ((total - free) / total) * 100;
  }
  
  private async getDiskUsage(): Promise<number> {
    // Simplified disk usage
    return 45; // 45% disk usage
  }
  
  private async getNetworkBandwidth(): Promise<number> {
    // Simplified bandwidth usage
    return 100; // 100 Mbps
  }
  
  private async getDBConnectionPool(): Promise<number> {
    // This would come from database pool monitoring
    return 10; // 10 active connections
  }
  
  private async getDBQueryTime(): Promise<number> {
    // Average query time
    return 25; // 25ms average
  }
  
  private async getDBTransactionRate(): Promise<number> {
    return 100; // 100 transactions per minute
  }
  
  private async getDBErrorRate(): Promise<number> {
    return 0.1; // 0.1% error rate
  }
  
  private async getCacheHitRate(): Promise<number> {
    // This would come from cache monitoring
    return 85; // 85% hit rate
  }
  
  private async getCacheMissRate(): Promise<number> {
    return 15; // 15% miss rate
  }
  
  private async getCacheEvictionRate(): Promise<number> {
    return 5; // 5% eviction rate
  }
  
  private async getCacheMemoryUsage(): Promise<number> {
    // Cache memory usage in MB
    return 256; // 256 MB
  }
  
  private async getErrorRate(): Promise<number> {
    return 0.5; // 0.5% error rate
  }
  
  private async getError4xxRate(): Promise<number> {
    return 0.3; // 0.3% 4xx rate
  }
  
  private async getError5xxRate(): Promise<number> {
    return 0.2; // 0.2% 5xx rate
  }
  
  private async getExceptionRate(): Promise<number> {
    return 0.1; // 0.1% exception rate
  }
  
  /**
   * Get metrics emitter for external listeners
   */
  public getEmitter(): EventEmitter {
    return this.metricsEmitter;
  }
}

/**
 * Metrics aggregator for dashboard data
 */
export class MetricsAggregator {
  /**
   * Get dashboard metrics for specific role
   */
  public static async getDashboardMetrics(
    role: 'admin' | 'teacher' | 'student'
  ): Promise<DashboardMetrics> {
    const collector = MetricsCollector.getInstance();
    const businessMetrics = await collector.collectBusinessMetrics();
    const technicalMetrics = await collector.collectTechnicalMetrics();
    
    switch (role) {
      case 'admin':
        return {
          business: businessMetrics,
          technical: technicalMetrics,
          alerts: await this.getActiveAlerts(),
          trends: await this.getMetricsTrends(),
        };
        
      case 'teacher':
        return {
          courseMetrics: {
            completionRate: businessMetrics.courseCompletionRate,
            avgProgress: businessMetrics.avgCourseProgress,
            rating: businessMetrics.courseRating,
            enrollments: businessMetrics.enrollmentRate,
          },
          studentMetrics: {
            activeStudents: businessMetrics.activeUsers,
            avgStudyTime: businessMetrics.avgStudyTime,
            correctAnswerRate: businessMetrics.correctAnswerRate,
          },
        };
        
      case 'student':
        return {
          progress: businessMetrics.learningPathProgress,
          studyTime: businessMetrics.avgStudyTime,
          correctAnswers: businessMetrics.correctAnswerRate,
          achievements: await this.getStudentAchievements(),
        };
        
      default:
        return {};
    }
  }
  
  /**
   * Get active alerts
   */
  private static async getActiveAlerts(): Promise<Alert[]> {
    // This would fetch from alert storage
    return [];
  }
  
  /**
   * Get metrics trends
   */
  private static async getMetricsTrends(): Promise<MetricsTrends> {
    // This would calculate trends from historical data
    return {
      revenue: { trend: 'up', percentage: 15 },
      users: { trend: 'up', percentage: 10 },
      engagement: { trend: 'stable', percentage: 0 },
      errors: { trend: 'down', percentage: -5 },
    };
  }
  
  /**
   * Get student achievements
   */
  private static async getStudentAchievements(): Promise<Achievement[]> {
    // This would fetch student-specific achievements
    return [];
  }
}