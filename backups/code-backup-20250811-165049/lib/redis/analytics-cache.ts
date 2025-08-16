// Analytics Data Caching Layer for Performance and Scalability

import { cacheManager, CacheLayer, CACHE_CONFIGS } from './cache-manager';
import { redis, REDIS_KEYS, REDIS_TTL } from './config';
import { RateLimiter } from './rate-limiter';
import { logger } from '@/lib/logger';

// Analytics data types
interface AnalyticsData {
  timestamp: number;
  value: number | string | object;
  metadata?: Record<string, any>;
  tags?: string[];
}

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  dimensions: Record<string, string>;
  unit?: string;
}

interface AggregatedData {
  period: string;
  metrics: Record<string, any>;
  computedAt: number;
  validUntil: number;
}

// Time series data structure
interface TimeSeriesData {
  metric: string;
  dataPoints: Array<{
    timestamp: number;
    value: number;
    tags?: Record<string, string>;
  }>;
  aggregations: {
    avg: number;
    min: number;
    max: number;
    sum: number;
    count: number;
  };
}

// Cache configuration for different analytics types
const ANALYTICS_CACHE_CONFIG = {
  REAL_TIME_METRICS: {
    ttl: 30, // 30 seconds
    layer: CacheLayer.ANALYTICS,
    tags: ['analytics', 'realtime'],
    prefix: 'rt_metrics'
  },
  DASHBOARD_DATA: {
    ttl: 300, // 5 minutes
    layer: CacheLayer.ANALYTICS,
    tags: ['analytics', 'dashboard'],
    prefix: 'dashboard'
  },
  REPORTS_DATA: {
    ttl: 1800, // 30 minutes
    layer: CacheLayer.ANALYTICS,
    tags: ['analytics', 'reports'],
    prefix: 'reports'
  },
  AGGREGATED_DATA: {
    ttl: 3600, // 1 hour
    layer: CacheLayer.ANALYTICS,
    tags: ['analytics', 'aggregated'],
    prefix: 'aggregated'
  },
  USER_ANALYTICS: {
    ttl: 600, // 10 minutes
    layer: CacheLayer.ANALYTICS,
    tags: ['analytics', 'user'],
    prefix: 'user_analytics'
  }
} as const;

export class AnalyticsCacheManager {
  private static instance: AnalyticsCacheManager;
  private aggregationTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startAggregationTimer();
  }

  static getInstance(): AnalyticsCacheManager {
    if (!AnalyticsCacheManager.instance) {
      AnalyticsCacheManager.instance = new AnalyticsCacheManager();
    }
    return AnalyticsCacheManager.instance;
  }

  // Cache real-time metrics
  async cacheRealTimeMetric(
    metricName: string,
    value: number,
    dimensions: Record<string, string> = {},
    ttl: number = 60
  ): Promise<void> {
    try {
      const cacheKey = `realtime:${metricName}:${this.hashDimensions(dimensions)}`;
      const timestamp = Date.now();
      
      const metricData: MetricData = {
        name: metricName,
        value,
        timestamp,
        dimensions
      };

      await cacheManager.set(cacheKey, metricData, {
        ...ANALYTICS_CACHE_CONFIG.REAL_TIME_METRICS,
        ttl
      });

      // Also store in time series for aggregation
      await this.addToTimeSeries(metricName, value, timestamp, dimensions);
    } catch (error: any) {
      logger.error('Error caching real-time metric:', error);
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics(
    metricName: string,
    dimensions: Record<string, string> = {
}
  ): Promise<MetricData[]> {
    try {
      const pattern = `realtime:${metricName}:*`;
      const keys = await redis.keys(pattern);
      
      const metrics: MetricData[] = [];
      
      for (const key of keys) {
        const metric = await cacheManager.get<MetricData>(key, ANALYTICS_CACHE_CONFIG.REAL_TIME_METRICS);
        if (metric) {
          metrics.push(metric);
        }
      }

      return metrics.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error: any) {
      logger.error('Error getting real-time metrics:', error);
      return [];
    }
  }

  // Cache dashboard data
  async cacheDashboardData(
    dashboardId: string,
    userId: string,
    data: Record<string, any>,
    ttl: number = 300
  ): Promise<void> {
    try {
      const cacheKey = `dashboard:${dashboardId}:${userId}`;
      
      const dashboardData = {
        ...data,
        cachedAt: Date.now(),
        userId,
        dashboardId
      };

      await cacheManager.set(cacheKey, dashboardData, {
        ...ANALYTICS_CACHE_CONFIG.DASHBOARD_DATA,
        ttl,
        tags: ['dashboard', `user:${userId}`, `dashboard:${dashboardId}`]
      });
    } catch (error: any) {
      logger.error('Error caching dashboard data:', error);
    }
  }

  // Get cached dashboard data
  async getCachedDashboardData(
    dashboardId: string,
    userId: string
  ): Promise<Record<string, any> | null> {
    try {
      const cacheKey = `dashboard:${dashboardId}:${userId}`;
      
      return await cacheManager.get<Record<string, any>>(
        cacheKey,
        ANALYTICS_CACHE_CONFIG.DASHBOARD_DATA
      );
    } catch (error: any) {
      logger.error('Error getting cached dashboard data:', error);
      return null;
    }
  }

  // Cache aggregated analytics data
  async cacheAggregatedData(
    period: string,
    metrics: Record<string, any>,
    ttl: number = 3600
  ): Promise<void> {
    try {
      const cacheKey = `aggregated:${period}`;
      
      const aggregatedData: AggregatedData = {
        period,
        metrics,
        computedAt: Date.now(),
        validUntil: Date.now() + (ttl * 1000)
      };

      await cacheManager.set(cacheKey, aggregatedData, {
        ...ANALYTICS_CACHE_CONFIG.AGGREGATED_DATA,
        ttl,
        tags: ['aggregated', `period:${period}`]
      });
    } catch (error: any) {
      logger.error('Error caching aggregated data:', error);
    }
  }

  // Get cached aggregated data
  async getCachedAggregatedData(period: string): Promise<AggregatedData | null> {
    try {
      const cacheKey = `aggregated:${period}`;
      
      const data = await cacheManager.get<AggregatedData>(
        cacheKey,
        ANALYTICS_CACHE_CONFIG.AGGREGATED_DATA
      );

      // Check if data is still valid
      if (data && Date.now() > data.validUntil) {
        return null;
      }

      return data;
    } catch (error: any) {
      logger.error('Error getting cached aggregated data:', error);
      return null;
    }
  }

  // Cache user analytics data
  async cacheUserAnalytics(
    userId: string,
    analyticsData: Record<string, any>,
    ttl: number = 600
  ): Promise<void> {
    try {
      const cacheKey = `user_analytics:${userId}`;
      
      const userAnalytics = {
        ...analyticsData,
        userId,
        cachedAt: Date.now()
      };

      await cacheManager.set(cacheKey, userAnalytics, {
        ...ANALYTICS_CACHE_CONFIG.USER_ANALYTICS,
        ttl,
        tags: ['user_analytics', `user:${userId}`]
      });
    } catch (error: any) {
      logger.error('Error caching user analytics:', error);
    }
  }

  // Get cached user analytics
  async getCachedUserAnalytics(userId: string): Promise<Record<string, any> | null> {
    try {
      const cacheKey = `user_analytics:${userId}`;
      
      return await cacheManager.get<Record<string, any>>(
        cacheKey,
        ANALYTICS_CACHE_CONFIG.USER_ANALYTICS
      );
    } catch (error: any) {
      logger.error('Error getting cached user analytics:', error);
      return null;
    }
  }

  // Cache report data
  async cacheReportData(
    reportId: string,
    parameters: Record<string, any>,
    data: Record<string, any>,
    ttl: number = 1800
  ): Promise<void> {
    try {
      const paramHash = this.hashParameters(parameters);
      const cacheKey = `report:${reportId}:${paramHash}`;
      
      const reportData = {
        ...data,
        reportId,
        parameters,
        generatedAt: Date.now()
      };

      await cacheManager.set(cacheKey, reportData, {
        ...ANALYTICS_CACHE_CONFIG.REPORTS_DATA,
        ttl,
        tags: ['report', `report:${reportId}`]
      });
    } catch (error: any) {
      logger.error('Error caching report data:', error);
    }
  }

  // Get cached report data
  async getCachedReportData(
    reportId: string,
    parameters: Record<string, any>
  ): Promise<Record<string, any> | null> {
    try {
      const paramHash = this.hashParameters(parameters);
      const cacheKey = `report:${reportId}:${paramHash}`;
      
      return await cacheManager.get<Record<string, any>>(
        cacheKey,
        ANALYTICS_CACHE_CONFIG.REPORTS_DATA
      );
    } catch (error: any) {
      logger.error('Error getting cached report data:', error);
      return null;
    }
  }

  // Add data to time series for aggregation
  async addToTimeSeries(
    metricName: string,
    value: number,
    timestamp: number,
    dimensions: Record<string, string> = {
}
  ): Promise<void> {
    try {
      const key = `timeseries:${metricName}:${this.hashDimensions(dimensions)}`;
      
      // Use Redis sorted set for time series data
      await redis.zadd(key, { score: timestamp, member: JSON.stringify({ value, timestamp, dimensions }) });
      
      // Keep only last 24 hours of data
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      await redis.zremrangebyscore(key, 0, oneDayAgo);
      
      // Set expiry
      await redis.expire(key, 24 * 60 * 60); // 24 hours
    } catch (error: any) {
      logger.error('Error adding to time series:', error);
    }
  }

  // Get time series data
  async getTimeSeries(
    metricName: string,
    dimensions: Record<string, string> = {},
    startTime?: number,
    endTime?: number
  ): Promise<TimeSeriesData | null> {
    try {
      const key = `timeseries:${metricName}:${this.hashDimensions(dimensions)}`;
      
      const start = startTime || (Date.now() - (24 * 60 * 60 * 1000));
      const end = endTime || Date.now();
      
      const rawData = await redis.zrangebyscore(key, start, end, { withScores: true });
      
      if (!rawData || rawData.length === 0) {
        return null;
      }

      const dataPoints = rawData.map((item: any) => {
        const parsed = JSON.parse(item.member);
        return {
          timestamp: parsed.timestamp,
          value: parsed.value,
          tags: parsed.dimensions
        };
      });

      // Calculate aggregations
      const values = dataPoints.map(dp => dp.value);
      const aggregations = {
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        sum: values.reduce((sum, val) => sum + val, 0),
        count: values.length
      };

      return {
        metric: metricName,
        dataPoints,
        aggregations
      };
    } catch (error: any) {
      logger.error('Error getting time series data:', error);
      return null;
    }
  }

  // Invalidate analytics cache by type
  async invalidateAnalyticsCache(type: string): Promise<void> {
    try {
      const tags = [`analytics`, type];
      await cacheManager.invalidateByTags(tags, CacheLayer.ANALYTICS);
    } catch (error: any) {
      logger.error('Error invalidating analytics cache:', error);
    }
  }

  // Invalidate user analytics cache
  async invalidateUserAnalyticsCache(userId: string): Promise<void> {
    try {
      const tags = [`user:${userId}`, 'user_analytics'];
      await cacheManager.invalidateByTags(tags, CacheLayer.ANALYTICS);
    } catch (error: any) {
      logger.error('Error invalidating user analytics cache:', error);
    }
  }

  // Get analytics cache statistics
  async getAnalyticsCacheStats(): Promise<{
    totalKeys: number;
    hitRate: number;
    memoryUsage: number;
    topMetrics: string[];
  }> {
    try {
      const keys = await redis.keys('analytics:*');
      const metrics = await cacheManager.getMetrics();
      
      // Get top metrics by frequency
      const metricCounts: Record<string, number> = {};
      
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 3) {
          const metricName = parts[2];
          metricCounts[metricName] = (metricCounts[metricName] || 0) + 1;
        }
      }

      const topMetrics = Object.entries(metricCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([metric]) => metric);

      return {
        totalKeys: keys.length,
        hitRate: metrics.hitRate,
        memoryUsage: metrics.memoryUsage,
        topMetrics
      };
    } catch (error: any) {
      logger.error('Error getting analytics cache stats:', error);
      return {
        totalKeys: 0,
        hitRate: 0,
        memoryUsage: 0,
        topMetrics: []
      };
    }
  }

  // Start background aggregation timer
  private startAggregationTimer(): void {
    this.aggregationTimer = setInterval(async () => {
      await this.performBackgroundAggregation();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Perform background aggregation
  private async performBackgroundAggregation(): Promise<void> {
    try {
      const patterns = ['timeseries:*'];
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        
        for (const key of keys) {
          const [, metricName, dimensionHash] = key.split(':');
          
          // Get recent data for aggregation
          const recentData = await redis.zrangebyscore(
            key,
            Date.now() - (5 * 60 * 1000), // Last 5 minutes
            Date.now(),
            { withScores: true }
          );

          if (recentData.length > 0) {
            // Calculate aggregations and cache them
            const values = recentData.map((item: any) => {
              const parsed = JSON.parse(item.member);
              return parsed.value;
            });

            const aggregation = {
              avg: values.reduce((sum, val) => sum + val, 0) / values.length,
              min: Math.min(...values),
              max: Math.max(...values),
              sum: values.reduce((sum, val) => sum + val, 0),
              count: values.length,
              period: '5m',
              timestamp: Date.now()
            };

            await this.cacheAggregatedData(
              `${metricName}:${dimensionHash}:5m`,
              aggregation,
              300 // 5 minutes
            );
          }
        }
      }
    } catch (error: any) {
      logger.error('Error in background aggregation:', error);
    }
  }

  // Helper methods
  private hashDimensions(dimensions: Record<string, string>): string {
    const sortedDimensions = Object.keys(dimensions)
      .sort()
      .reduce((acc, key) => {
        acc[key] = dimensions[key];
        return acc;
      }, {} as Record<string, string>);

    return Buffer.from(JSON.stringify(sortedDimensions)).toString('base64');
  }

  private hashParameters(parameters: Record<string, any>): string {
    const sortedParams = Object.keys(parameters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = parameters[key];
        return acc;
      }, {} as Record<string, any>);

    return Buffer.from(JSON.stringify(sortedParams)).toString('base64');
  }

  // Cleanup method
  cleanup(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }
  }
}

// Export singleton instance
export const analyticsCacheManager = AnalyticsCacheManager.getInstance();

// Helper functions for analytics caching
export class AnalyticsCacheUtils {
  // Create cache key for analytics data
  static createAnalyticsKey(type: string, identifier: string, params?: Record<string, any>): string {
    const paramHash = params ? Buffer.from(JSON.stringify(params)).toString('base64') : '';
    return `analytics:${type}:${identifier}:${paramHash}`;
  }

  // Format time series data for caching
  static formatTimeSeriesData(data: any[]): TimeSeriesData {
    const values = data.map((item: any) => item.value);
    
    return {
      metric: data[0]?.metric || 'unknown',
      dataPoints: data.map((item: any) => ({
        timestamp: item.timestamp,
        value: item.value,
        tags: item.tags || {
}
      })),
      aggregations: {
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        sum: values.reduce((sum, val) => sum + val, 0),
        count: values.length
      }
    };
  }

  // Check if analytics data is fresh
  static isDataFresh(cachedAt: number, maxAge: number): boolean {
    return Date.now() - cachedAt < maxAge * 1000;
  }
}