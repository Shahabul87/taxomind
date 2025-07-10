// Analytics Worker - Handles real-time analytics processing and aggregation

const { db } = require('../lib/db');
const { redis } = require('../lib/redis');
const { AnalyticsEngine } = require('../lib/analytics/analytics-engine');
const { RealTimeDashboard } = require('../lib/analytics/real-time-dashboard');

class AnalyticsWorker {
  constructor() {
    this.analyticsEngine = new AnalyticsEngine();
    this.dashboard = new RealTimeDashboard();
    this.isRunning = false;
    this.batchSize = 1000;
    this.aggregationInterval = 60000; // 1 minute
    this.eventBuffer = [];
  }

  async initialize() {
    console.log('📊 Starting Analytics Worker...');
    
    try {
      // Initialize analytics services
      await this.analyticsEngine.initialize();
      await this.dashboard.initialize();
      
      // Setup event processing
      await this.setupEventProcessing();
      
      // Setup aggregation
      await this.setupAggregation();
      
      // Setup health monitoring
      await this.setupHealthMonitoring();
      
      this.isRunning = true;
      console.log('✅ Analytics Worker initialized successfully');
      
      // Start processing loops
      this.startEventProcessing();
      this.startAggregation();
      
    } catch (error) {
      console.error('❌ Analytics Worker initialization failed:', error);
      process.exit(1);
    }
  }

  async setupEventProcessing() {
    // Subscribe to analytics events
    await redis.subscribe('analytics:events');
    await redis.subscribe('analytics:interactions');
    await redis.subscribe('analytics:learning');
    await redis.subscribe('analytics:assessment');

    redis.on('message', async (channel, message) => {
      try {
        const event = JSON.parse(message);
        await this.processEvent(event, channel);
      } catch (error) {
        console.error('Error processing analytics event:', error);
      }
    });
  }

  async processEvent(event, channel) {
    // Add timestamp and source
    event.processedAt = new Date();
    event.source = channel;
    event.id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to buffer
    this.eventBuffer.push(event);
    
    // Process immediately for real-time updates
    await this.processRealTimeEvent(event);
    
    // Batch process when buffer is full
    if (this.eventBuffer.length >= this.batchSize) {
      await this.processBatch();
    }
  }

  async processRealTimeEvent(event) {
    try {
      // Update real-time metrics
      await this.updateRealTimeMetrics(event);
      
      // Trigger dashboard updates
      await this.dashboard.updateRealTime(event);
      
      // Check for alerts
      await this.checkAlerts(event);
      
    } catch (error) {
      console.error('Error processing real-time event:', error);
    }
  }

  async updateRealTimeMetrics(event) {
    const metrics = await this.calculateEventMetrics(event);
    
    // Update Redis with real-time data
    await redis.setex(
      `analytics:realtime:${event.type}`,
      300, // 5 minutes TTL
      JSON.stringify(metrics)
    );
    
    // Update global metrics
    await this.updateGlobalMetrics(event, metrics);
  }

  async calculateEventMetrics(event) {
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    
    switch (event.type) {
      case 'student_interaction':
        return {
          type: 'interaction',
          count: 1,
          studentId: event.studentId,
          courseId: event.courseId,
          duration: event.duration || 0,
          hourKey
        };
        
      case 'content_viewed':
        return {
          type: 'content_view',
          count: 1,
          contentId: event.contentId,
          studentId: event.studentId,
          viewDuration: event.viewDuration || 0,
          hourKey
        };
        
      case 'assessment_completed':
        return {
          type: 'assessment',
          count: 1,
          assessmentId: event.assessmentId,
          studentId: event.studentId,
          score: event.score || 0,
          timeSpent: event.timeSpent || 0,
          hourKey
        };
        
      case 'learning_progress':
        return {
          type: 'progress',
          count: 1,
          studentId: event.studentId,
          courseId: event.courseId,
          progressPercent: event.progressPercent || 0,
          hourKey
        };
        
      default:
        return {
          type: 'unknown',
          count: 1,
          hourKey
        };
    }
  }

  async updateGlobalMetrics(event, metrics) {
    // Update hourly counters
    await redis.hincrby(
      `analytics:hourly:${metrics.hourKey}`,
      metrics.type,
      metrics.count
    );
    
    // Update daily counters
    const dayKey = metrics.hourKey.substring(0, 10); // YYYY-MM-DD
    await redis.hincrby(
      `analytics:daily:${dayKey}`,
      metrics.type,
      metrics.count
    );
    
    // Update active users
    if (event.studentId) {
      await redis.sadd(
        `analytics:active_users:${dayKey}`,
        event.studentId
      );
      await redis.expire(`analytics:active_users:${dayKey}`, 86400 * 7); // 7 days
    }
  }

  async processBatch() {
    if (this.eventBuffer.length === 0) return;
    
    console.log(`📦 Processing batch of ${this.eventBuffer.length} events...`);
    
    try {
      const batch = [...this.eventBuffer];
      this.eventBuffer = [];
      
      // Store events in database
      await this.storeEventsBatch(batch);
      
      // Update aggregated metrics
      await this.updateAggregatedMetrics(batch);
      
      // Generate insights
      await this.generateInsights(batch);
      
      console.log(`✅ Processed batch of ${batch.length} events`);
      
    } catch (error) {
      console.error('Error processing batch:', error);
      // Re-add events to buffer on error
      this.eventBuffer = [...this.eventBuffer, ...batch];
    }
  }

  async storeEventsBatch(events) {
    // Batch insert events into database
    const dbEvents = events.map(event => ({
      id: event.id,
      type: event.type,
      studentId: event.studentId,
      courseId: event.courseId,
      contentId: event.contentId,
      data: JSON.stringify(event.data || {}),
      timestamp: event.timestamp || event.processedAt,
      source: event.source
    }));
    
    await db.analyticsEvent.createMany({
      data: dbEvents,
      skipDuplicates: true
    });
  }

  async updateAggregatedMetrics(events) {
    // Group events by type
    const eventsByType = events.reduce((acc, event) => {
      if (!acc[event.type]) acc[event.type] = [];
      acc[event.type].push(event);
      return acc;
    }, {});
    
    // Process each type
    for (const [type, typeEvents] of Object.entries(eventsByType)) {
      await this.processEventTypeAggregation(type, typeEvents);
    }
  }

  async processEventTypeAggregation(type, events) {
    switch (type) {
      case 'student_interaction':
        await this.aggregateInteractionMetrics(events);
        break;
        
      case 'content_viewed':
        await this.aggregateContentMetrics(events);
        break;
        
      case 'assessment_completed':
        await this.aggregateAssessmentMetrics(events);
        break;
        
      case 'learning_progress':
        await this.aggregateProgressMetrics(events);
        break;
    }
  }

  async aggregateInteractionMetrics(events) {
    // Calculate interaction statistics
    const stats = {
      totalInteractions: events.length,
      uniqueStudents: new Set(events.map(e => e.studentId)).size,
      uniqueCourses: new Set(events.map(e => e.courseId)).size,
      totalDuration: events.reduce((sum, e) => sum + (e.duration || 0), 0),
      averageDuration: 0
    };
    
    stats.averageDuration = stats.totalDuration / stats.totalInteractions;
    
    // Store aggregated data
    await redis.setex(
      'analytics:aggregated:interactions',
      3600, // 1 hour TTL
      JSON.stringify(stats)
    );
  }

  async aggregateContentMetrics(events) {
    // Calculate content engagement statistics
    const contentStats = events.reduce((acc, event) => {
      const contentId = event.contentId;
      if (!acc[contentId]) {
        acc[contentId] = {
          views: 0,
          totalDuration: 0,
          uniqueViewers: new Set()
        };
      }
      
      acc[contentId].views++;
      acc[contentId].totalDuration += event.viewDuration || 0;
      acc[contentId].uniqueViewers.add(event.studentId);
      
      return acc;
    }, {});
    
    // Convert sets to counts
    const processedStats = Object.keys(contentStats).reduce((acc, contentId) => {
      acc[contentId] = {
        ...contentStats[contentId],
        uniqueViewers: contentStats[contentId].uniqueViewers.size,
        averageDuration: contentStats[contentId].totalDuration / contentStats[contentId].views
      };
      return acc;
    }, {});
    
    // Store content statistics
    await redis.setex(
      'analytics:aggregated:content',
      3600,
      JSON.stringify(processedStats)
    );
  }

  async aggregateAssessmentMetrics(events) {
    // Calculate assessment performance statistics
    const assessmentStats = events.reduce((acc, event) => {
      const assessmentId = event.assessmentId;
      if (!acc[assessmentId]) {
        acc[assessmentId] = {
          completions: 0,
          totalScore: 0,
          totalTime: 0,
          scores: []
        };
      }
      
      acc[assessmentId].completions++;
      acc[assessmentId].totalScore += event.score || 0;
      acc[assessmentId].totalTime += event.timeSpent || 0;
      acc[assessmentId].scores.push(event.score || 0);
      
      return acc;
    }, {});
    
    // Calculate derived metrics
    const processedStats = Object.keys(assessmentStats).reduce((acc, assessmentId) => {
      const stats = assessmentStats[assessmentId];
      acc[assessmentId] = {
        completions: stats.completions,
        averageScore: stats.totalScore / stats.completions,
        averageTime: stats.totalTime / stats.completions,
        medianScore: this.calculateMedian(stats.scores),
        passRate: stats.scores.filter(score => score >= 70).length / stats.completions
      };
      return acc;
    }, {});
    
    // Store assessment statistics
    await redis.setex(
      'analytics:aggregated:assessments',
      3600,
      JSON.stringify(processedStats)
    );
  }

  async aggregateProgressMetrics(events) {
    // Calculate learning progress statistics
    const progressStats = {
      totalProgressEvents: events.length,
      averageProgress: events.reduce((sum, e) => sum + (e.progressPercent || 0), 0) / events.length,
      coursesInProgress: new Set(events.map(e => e.courseId)).size,
      studentsProgressing: new Set(events.map(e => e.studentId)).size
    };
    
    // Store progress statistics
    await redis.setex(
      'analytics:aggregated:progress',
      3600,
      JSON.stringify(progressStats)
    );
  }

  async generateInsights(events) {
    // Generate actionable insights from events
    const insights = [];
    
    // Identify engagement patterns
    const engagementInsight = await this.analyzeEngagementPatterns(events);
    if (engagementInsight) insights.push(engagementInsight);
    
    // Identify learning difficulties
    const difficultyInsight = await this.analyzeLearningDifficulties(events);
    if (difficultyInsight) insights.push(difficultyInsight);
    
    // Identify popular content
    const popularityInsight = await this.analyzeContentPopularity(events);
    if (popularityInsight) insights.push(popularityInsight);
    
    // Store insights
    if (insights.length > 0) {
      await redis.lpush(
        'analytics:insights',
        ...insights.map(insight => JSON.stringify(insight))
      );
      await redis.ltrim('analytics:insights', 0, 99); // Keep only latest 100 insights
    }
  }

  async analyzeEngagementPatterns(events) {
    const interactionEvents = events.filter(e => e.type === 'student_interaction');
    if (interactionEvents.length < 10) return null;
    
    const avgDuration = interactionEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / interactionEvents.length;
    
    if (avgDuration < 30000) { // Less than 30 seconds
      return {
        type: 'low_engagement',
        message: 'Low average interaction duration detected',
        value: avgDuration,
        recommendation: 'Consider improving content engagement strategies',
        timestamp: new Date()
      };
    }
    
    return null;
  }

  async analyzeLearningDifficulties(events) {
    const assessmentEvents = events.filter(e => e.type === 'assessment_completed');
    if (assessmentEvents.length < 5) return null;
    
    const avgScore = assessmentEvents.reduce((sum, e) => sum + (e.score || 0), 0) / assessmentEvents.length;
    
    if (avgScore < 60) {
      return {
        type: 'learning_difficulty',
        message: 'Low average assessment scores detected',
        value: avgScore,
        recommendation: 'Consider providing additional learning support',
        timestamp: new Date()
      };
    }
    
    return null;
  }

  async analyzeContentPopularity(events) {
    const contentEvents = events.filter(e => e.type === 'content_viewed');
    if (contentEvents.length < 10) return null;
    
    const contentViews = contentEvents.reduce((acc, event) => {
      acc[event.contentId] = (acc[event.contentId] || 0) + 1;
      return acc;
    }, {});
    
    const sortedContent = Object.entries(contentViews)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return {
      type: 'popular_content',
      message: 'Most popular content identified',
      value: sortedContent,
      recommendation: 'Consider promoting similar content',
      timestamp: new Date()
    };
  }

  async setupAggregation() {
    // Run aggregation every minute
    setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.processBatch();
      }
    }, this.aggregationInterval);
  }

  async startEventProcessing() {
    console.log('🔄 Starting event processing loop...');
    // Event processing is handled by Redis subscriptions
  }

  async startAggregation() {
    console.log('📈 Starting aggregation loop...');
    // Aggregation is handled by setInterval in setupAggregation
  }

  async checkAlerts(event) {
    // Check for alert conditions
    const alerts = [];
    
    // High error rate
    if (event.type === 'error' && event.severity === 'high') {
      alerts.push({
        type: 'high_error_rate',
        message: 'High severity error detected',
        event: event
      });
    }
    
    // Low engagement
    if (event.type === 'student_interaction' && (event.duration || 0) < 5000) {
      alerts.push({
        type: 'low_engagement',
        message: 'Very short interaction detected',
        event: event
      });
    }
    
    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  async sendAlert(alert) {
    // Publish alert to notification system
    await redis.publish('notifications:alerts', JSON.stringify(alert));
    
    // Store alert in Redis
    await redis.lpush('analytics:alerts', JSON.stringify({
      ...alert,
      timestamp: new Date()
    }));
    await redis.ltrim('analytics:alerts', 0, 49); // Keep only latest 50 alerts
  }

  async setupHealthMonitoring() {
    this.healthStatus = {
      status: 'healthy',
      uptime: 0,
      eventsProcessed: 0,
      eventsInBuffer: 0,
      lastProcessedAt: new Date(),
      aggregationStatus: 'running'
    };

    // Update health status every 30 seconds
    setInterval(() => {
      this.healthStatus.uptime = process.uptime();
      this.healthStatus.eventsInBuffer = this.eventBuffer.length;
      this.healthStatus.lastHeartbeat = new Date();
      
      // Store in Redis
      redis.setex('analytics:worker:health', 60, JSON.stringify(this.healthStatus));
    }, 30000);
  }

  calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  async shutdown() {
    console.log('🛑 Shutting down Analytics Worker...');
    this.isRunning = false;
    
    // Process remaining events
    if (this.eventBuffer.length > 0) {
      console.log('⏳ Processing remaining events...');
      await this.processBatch();
    }
    
    console.log('✅ Analytics Worker shutdown complete');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  if (worker) {
    await worker.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (worker) {
    await worker.shutdown();
  }
  process.exit(0);
});

// Start worker
const worker = new AnalyticsWorker();
worker.initialize().catch(error => {
  console.error('Failed to start Analytics Worker:', error);
  process.exit(1);
});