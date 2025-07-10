// ML Data Pipeline Kafka Consumer
import { EachMessagePayload } from 'kafkajs';
import { initializeConsumer, KAFKA_TOPICS, KafkaMessage } from '../index';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

// Data aggregation for ML training
interface MLTrainingData {
  studentId: string;
  courseId: string;
  features: {
    engagementScore: number;
    completionRate: number;
    timeSpent: number;
    videoWatchTime: number;
    pauseCount: number;
    seekCount: number;
    clickRate: number;
    scrollDepth: number;
    quizScores: number[];
    strugglingAreas: string[];
    learningStyle: string;
    preferredContentType: string;
  };
  labels: {
    willComplete: boolean;
    performanceLevel: 'low' | 'medium' | 'high';
    dropoutRisk: number;
    nextContentRecommendation: string;
  };
}

// Process data for ML training
export async function processMLDataMessage(
  payload: EachMessagePayload
): Promise<void> {
  const { message } = payload;
  
  if (!message.value) return;
  
  try {
    const kafkaMessage: KafkaMessage = JSON.parse(message.value.toString());
    const { data, eventType } = kafkaMessage;
    
    // Aggregate data based on event type
    switch (eventType) {
      case 'student_interaction':
        await aggregateInteractionData(data);
        break;
      case 'video_analytics':
        await aggregateVideoData(data);
        break;
      case 'metrics_update':
        await aggregateMetricsData(data);
        break;
    }
    
    // Check if we have enough data for training
    await checkDataReadiness(data.studentId, data.courseId);
    
  } catch (error) {
    console.error('Error processing ML data:', error);
  }
}

// Aggregate interaction data
async function aggregateInteractionData(data: any): Promise<void> {
  const key = `ml_data:${data.studentId}:${data.courseId}`;
  
  // Count interactions by type
  await redis.hincrby(key, `${data.eventName}_count`, 1);
  
  // Track session data
  if (data.sessionId) {
    await redis.sadd(`sessions:${data.studentId}`, data.sessionId);
  }
  
  // Calculate click rate
  if (data.eventName === 'click') {
    await redis.hincrby(key, 'total_clicks', 1);
  }
  
  // Track scroll depth
  if (data.eventName === 'scroll_milestone') {
    const currentDepth = await redis.hget(key, 'max_scroll_depth');
    const newDepth = data.metadata?.depth || 0;
    if (!currentDepth || newDepth > parseInt(currentDepth)) {
      await redis.hset(key, 'max_scroll_depth', newDepth.toString());
    }
  }
}

// Aggregate video analytics data
async function aggregateVideoData(data: any): Promise<void> {
  const key = `ml_data:${data.studentId}:${data.courseId}`;
  
  // Track video metrics
  await redis.hincrby(key, `video_${data.action}_count`, 1);
  await redis.hincrby(key, 'total_watch_time', data.metadata?.watchTime || 0);
  
  // Track completion patterns
  if (data.action === 'complete') {
    await redis.sadd(`completed_videos:${data.studentId}`, data.videoId);
  }
  
  // Store seek patterns for learning style detection
  if (data.action === 'seek') {
    await redis.lpush(
      `seek_patterns:${data.studentId}`,
      JSON.stringify({
        videoId: data.videoId,
        from: data.metadata?.from,
        to: data.metadata?.to,
        timestamp: Date.now()
      })
    );
    await redis.ltrim(`seek_patterns:${data.studentId}`, 0, 49);
  }
}

// Aggregate metrics data
async function aggregateMetricsData(data: any): Promise<void> {
  const key = `ml_data:${data.studentId}:${data.courseId}`;
  
  // Store latest metrics
  if (data.metrics.engagementScore !== undefined) {
    await redis.hset(key, 'engagement_score', data.metrics.engagementScore.toString());
  }
  
  if (data.metrics.completionRate !== undefined) {
    await redis.hset(key, 'completion_rate', data.metrics.completionRate.toString());
  }
  
  if (data.metrics.timeSpent !== undefined) {
    await redis.hincrby(key, 'total_time_spent', data.metrics.timeSpent);
  }
  
  // Track struggling areas
  if (data.metrics.strugglingAreas?.length > 0) {
    for (const area of data.metrics.strugglingAreas) {
      await redis.sadd(`struggling_areas:${data.studentId}`, area);
    }
  }
}

// Check if we have enough data for ML training
async function checkDataReadiness(
  studentId: string,
  courseId: string
): Promise<void> {
  const key = `ml_data:${studentId}:${courseId}`;
  const data = await redis.hgetall(key);
  
  // Check minimum data requirements
  const totalInteractions = Object.entries(data)
    .filter(([k]) => k.endsWith('_count'))
    .reduce((sum, [, v]) => sum + parseInt(v), 0);
  
  if (totalInteractions >= 100) {
    // Prepare training data
    const trainingData = await prepareTrainingData(studentId, courseId, data);
    
    if (trainingData) {
      // Send to ML training pipeline
      await sendToMLPipeline(trainingData);
      
      // Mark as processed
      await redis.hset(key, 'last_ml_update', Date.now().toString());
    }
  }
}

// Prepare data for ML training
async function prepareTrainingData(
  studentId: string,
  courseId: string,
  aggregatedData: any
): Promise<MLTrainingData | null> {
  try {
    // Get historical data
    const enrollment = await db.userCourseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId
        }
      }
    });
    
    if (!enrollment) return null;
    
    // Get quiz scores
    const quizScores = await getQuizScores(studentId, courseId);
    
    // Detect learning style from patterns
    const learningStyle = await detectLearningStyle(studentId, aggregatedData);
    
    // Calculate features
    const features = {
      engagementScore: parseFloat(aggregatedData.engagement_score || '0'),
      completionRate: parseFloat(aggregatedData.completion_rate || '0'),
      timeSpent: parseInt(aggregatedData.total_time_spent || '0'),
      videoWatchTime: parseInt(aggregatedData.total_watch_time || '0'),
      pauseCount: parseInt(aggregatedData.video_pause_count || '0'),
      seekCount: parseInt(aggregatedData.video_seek_count || '0'),
      clickRate: calculateClickRate(aggregatedData),
      scrollDepth: parseInt(aggregatedData.max_scroll_depth || '0'),
      quizScores,
      strugglingAreas: await getStrugglingAreas(studentId),
      learningStyle,
      preferredContentType: detectPreferredContentType(aggregatedData)
    };
    
    // Generate labels (in production, these would come from historical data)
    const labels = {
      willComplete: enrollment.progressPercentage > 80,
      performanceLevel: getPerformanceLevel(features.engagementScore),
      dropoutRisk: calculateDropoutRisk(features),
      nextContentRecommendation: 'adaptive' // Placeholder
    };
    
    return {
      studentId,
      courseId,
      features,
      labels
    };
    
  } catch (error) {
    console.error('Error preparing training data:', error);
    return null;
  }
}

// Helper functions
async function getQuizScores(
  studentId: string,
  courseId: string
): Promise<number[]> {
  // In production, fetch from quiz results table
  return [85, 92, 78, 88]; // Placeholder
}

async function detectLearningStyle(
  studentId: string,
  data: any
): Promise<string> {
  const videoCompleteRate = parseInt(data.video_complete_count || '0') / 
                           (parseInt(data.video_play_count || '1'));
  const seekRate = parseInt(data.video_seek_count || '0') / 
                  (parseInt(data.video_play_count || '1'));
  
  if (videoCompleteRate > 0.8 && seekRate < 0.2) {
    return 'sequential';
  } else if (seekRate > 0.5) {
    return 'exploratory';
  } else if (parseInt(data.click_count || '0') > 100) {
    return 'interactive';
  }
  
  return 'balanced';
}

function detectPreferredContentType(data: any): string {
  const videoTime = parseInt(data.total_watch_time || '0');
  const readingTime = parseInt(data.total_time_spent || '0') - videoTime;
  
  if (videoTime > readingTime * 1.5) {
    return 'video';
  } else if (readingTime > videoTime * 1.5) {
    return 'text';
  }
  
  return 'mixed';
}

function calculateClickRate(data: any): number {
  const clicks = parseInt(data.total_clicks || '0');
  const time = parseInt(data.total_time_spent || '1');
  return Math.min(clicks / (time / 60), 10); // Clicks per minute, capped at 10
}

async function getStrugglingAreas(studentId: string): Promise<string[]> {
  const areas = await redis.smembers(`struggling_areas:${studentId}`);
  return areas.slice(0, 5); // Top 5 areas
}

function getPerformanceLevel(
  engagementScore: number
): 'low' | 'medium' | 'high' {
  if (engagementScore >= 80) return 'high';
  if (engagementScore >= 60) return 'medium';
  return 'low';
}

function calculateDropoutRisk(features: any): number {
  // Simple dropout risk calculation
  let risk = 0;
  
  if (features.engagementScore < 50) risk += 0.3;
  if (features.completionRate < 30) risk += 0.3;
  if (features.timeSpent < 600) risk += 0.2; // Less than 10 minutes
  if (features.strugglingAreas.length > 3) risk += 0.2;
  
  return Math.min(risk, 1);
}

// Send data to ML pipeline
async function sendToMLPipeline(data: MLTrainingData): Promise<void> {
  // In production, this would send to ML training service
  console.log('Sending to ML pipeline:', {
    studentId: data.studentId,
    courseId: data.courseId,
    featureCount: Object.keys(data.features).length
  });
  
  // Store in ML training queue
  await redis.lpush('ml_training_queue', JSON.stringify(data));
  
  // Trigger ML model update if queue is large enough
  const queueSize = await redis.llen('ml_training_queue');
  if (queueSize >= 1000) {
    // Trigger batch training
    await redis.publish('ml_training_trigger', 'start_training');
  }
}

// Start ML data consumer
export async function startMLDataConsumer(): Promise<void> {
  try {
    const consumer = await initializeConsumer(
      'ml-data-pipeline',
      [
        KAFKA_TOPICS.STUDENT_INTERACTIONS,
        KAFKA_TOPICS.VIDEO_ANALYTICS,
        KAFKA_TOPICS.LEARNING_METRICS
      ]
    );
    
    await consumer.run({
      eachMessage: processMLDataMessage
    });
    
    console.log('ML data consumer started');
  } catch (error) {
    console.error('Failed to start ML data consumer:', error);
    throw error;
  }
}