// Analytics Kafka Consumer
import { EachMessagePayload } from 'kafkajs';
import { initializeConsumer, KAFKA_TOPICS, KafkaMessage } from '../index';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Process student interaction messages
export async function processInteractionMessage(
  payload: EachMessagePayload
): Promise<void> {
  const { message } = payload;
  
  if (!message.value) return;
  
  try {
    const kafkaMessage: KafkaMessage = JSON.parse(message.value.toString());
    const { data, metadata } = kafkaMessage;
    
    // Store in database
    await db.sAMInteraction.create({
      data: {
        userId: data.studentId,
        courseId: data.courseId,
        interactionType: data.eventName,
        context: { sessionId: data.sessionId, timestamp: data.timestamp }
      }
    });
    
    // Update Redis cache for real-time metrics
    await updateRealTimeMetrics(data);
    
    // Check for patterns that need alerts
    await checkForAlertPatterns(data);
    
  } catch (error: any) {
    logger.error('Error processing interaction message:', error);
  }
}

// Process video analytics messages
export async function processVideoAnalyticsMessage(
  payload: EachMessagePayload
): Promise<void> {
  const { message } = payload;
  
  if (!message.value) return;
  
  try {
    const kafkaMessage: KafkaMessage = JSON.parse(message.value.toString());
    const { data } = kafkaMessage;
    
    // Update video analytics in Redis
    const key = `video:${data.videoId}:analytics`;
    await redis.hincrby(key, `${data.action}_count`, 1);
    
    // Track video completion
    if (data.action === 'complete') {
      await redis.hincrby(key, 'completions', 1);
      
      // Update student progress
      await updateStudentProgress(data.studentId, data.courseId);
    }
    
    // Detect struggling patterns
    if (data.action === 'seek' && data.metadata?.seekCount > 5) {
      await flagStrugglePoint(data.videoId, data.position, data.studentId);
    }
    
  } catch (error: any) {
    logger.error('Error processing video analytics:', error);
  }
}

// Process learning metrics messages
export async function processLearningMetricsMessage(
  payload: EachMessagePayload
): Promise<void> {
  const { message } = payload;
  
  if (!message.value) return;
  
  try {
    const kafkaMessage: KafkaMessage = JSON.parse(message.value.toString());
    const { data } = kafkaMessage;
    
    // Update or create learning metrics - simplified for now
    try {
      await db.analytics.create({
        data: {
          studentId: data.studentId,
          courseId: data.courseId,
          eventType: 'learning_metrics',
          metadata: data.metrics,
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Handle error or use alternative storage
    }
    
    // Update real-time dashboard
    await publishDashboardUpdate(data.courseId, {
      type: 'metrics_update',
      studentId: data.studentId,
      metrics: data.metrics
    });
    
  } catch (error: any) {
    logger.error('Error processing learning metrics:', error);
  }
}

// Update real-time metrics in Redis
async function updateRealTimeMetrics(data: any): Promise<void> {
  const now = new Date();
  const hourKey = `metrics:${data.courseId}:${now.getHours()}`;
  
  // Increment interaction count
  await redis.hincrby(hourKey, 'interactions', 1);
  
  // Track active users
  await redis.sadd(`active_users:${data.courseId}`, data.studentId);
  await redis.expire(`active_users:${data.courseId}`, 300); // 5 minutes
  
  // Update engagement score
  if (data.metadata?.engagementScore) {
    await redis.lpush(
      `engagement:${data.courseId}`,
      data.metadata.engagementScore
    );
    await redis.ltrim(`engagement:${data.courseId}`, 0, 99); // Keep last 100
  }
}

// Check for alert patterns
async function checkForAlertPatterns(data: any): Promise<void> {
  // Check for rapid clicking (possible confusion)
  if (data.eventName === 'click') {
    const clickKey = `clicks:${data.studentId}:${data.sectionId}`;
    const clicks = await redis.incr(clickKey);
    await redis.expire(clickKey, 60); // 1 minute window
    
    if (clicks > 10) {
      await createAlert({
        type: 'struggle',
        severity: 'medium',
        title: 'Rapid clicking detected',
        studentId: data.studentId,
        courseId: data.courseId,
        contentId: data.sectionId
      });
    }
  }
  
  // Check for repeated video pauses
  if (data.eventName === 'video_pause') {
    const pauseKey = `pauses:${data.studentId}:${data.metadata?.videoId}`;
    const pauses = await redis.incr(pauseKey);
    await redis.expire(pauseKey, 300); // 5 minute window
    
    if (pauses > 5) {
      await createAlert({
        type: 'struggle',
        severity: 'high',
        title: 'Multiple video pauses',
        studentId: data.studentId,
        courseId: data.courseId,
        contentId: data.metadata?.videoId
      });
    }
  }
}

// Flag struggle point in content
async function flagStrugglePoint(
  contentId: string,
  position: number,
  studentId: string
): Promise<void> {
  await db.contentFlag.upsert({
    where: {
      id: `${contentId}_struggle_point`
    },
    update: {
      metadata: {
        position,
        lastStudentId: studentId,
        timestamp: new Date()
      }
    },
    create: {
      id: `${contentId}_struggle_point`,
      contentType: 'video',
      contentId,
      flagType: 'struggle_point',
      flaggedBy: { connect: { id: studentId } },
      status: 'active',
      metadata: {
        position,
        lastStudentId: studentId,
        timestamp: new Date()
      }
    }
  });
}

// Update student progress
async function updateStudentProgress(
  studentId: string,
  courseId: string
): Promise<void> {
  // Calculate new progress based on completed content
  const enrollment = await db.userCourseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId: studentId,
        courseId
      }
    }
  });
  
  if (enrollment) {
    // In a real implementation, calculate actual progress
    const newProgress = Math.min(enrollment.progress + 5, 100);
    
    await db.userCourseEnrollment.update({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId
        }
      },
      data: {
        progress: newProgress,
        lastAccessedAt: new Date()
      }
    });
  }
}

// Create alert
async function createAlert(alert: any): Promise<void> {
  // Store alert in Redis for real-time dashboard
  const alertKey = `alerts:${alert.courseId || 'global'}`;
  await redis.lpush(alertKey, JSON.stringify({
    ...alert,
    id: `alert_${Date.now()}`,
    timestamp: new Date(),
    resolved: false
  }));
  await redis.ltrim(alertKey, 0, 99); // Keep last 100 alerts
}

// Publish dashboard update
async function publishDashboardUpdate(
  courseId: string,
  update: any
): Promise<void> {
  await redis.publish(`dashboard:${courseId}`, JSON.stringify(update));
}

// Start analytics consumer
export async function startAnalyticsConsumer(): Promise<void> {
  try {
    // Initialize consumers for different topics
    const interactionConsumer = await initializeConsumer(
      'analytics-interactions',
      [KAFKA_TOPICS.STUDENT_INTERACTIONS]
    );

    const videoConsumer = await initializeConsumer(
      'analytics-video',
      [KAFKA_TOPICS.VIDEO_ANALYTICS]
    );

    const metricsConsumer = await initializeConsumer(
      'analytics-metrics',
      [KAFKA_TOPICS.LEARNING_METRICS]
    );

    // Skip if Kafka is not configured
    if (!interactionConsumer || !videoConsumer || !metricsConsumer) {
      logger.debug('[KAFKA] Not configured - skipping analytics consumers');
      return;
    }

    // Run consumers
    await Promise.all([
      interactionConsumer.run({
        eachMessage: processInteractionMessage
      }),
      videoConsumer.run({
        eachMessage: processVideoAnalyticsMessage
      }),
      metricsConsumer.run({
        eachMessage: processLearningMetricsMessage
      })
    ]);

  } catch (error: any) {
    logger.error('Failed to start analytics consumers:', error);
    throw error;
  }
}