// Student Interaction Kafka Producer
import { sendToKafka, KAFKA_TOPICS, KafkaMessage } from '../index';
import { nanoid } from 'nanoid';

export interface InteractionEvent {
  studentId: string;
  courseId: string;
  sectionId?: string;
  eventName: string;
  metadata: any;
  timestamp: Date;
  sessionId: string;
}

// Send interaction event to Kafka
export async function publishInteractionEvent(
  event: InteractionEvent
): Promise<void> {
  const kafkaMessage: KafkaMessage<InteractionEvent> = {
    eventId: nanoid(),
    eventType: 'student_interaction',
    timestamp: new Date(),
    data: event,
    metadata: {
      userId: event.studentId,
      courseId: event.courseId,
      sessionId: event.sessionId
    }
  };

  await sendToKafka(KAFKA_TOPICS.STUDENT_INTERACTIONS, [{
    key: event.studentId,
    value: kafkaMessage
  }]);
}

// Batch publish multiple interaction events
export async function publishInteractionEventBatch(
  events: InteractionEvent[]
): Promise<void> {
  const messages = events.map(event => ({
    key: event.studentId,
    value: {
      eventId: nanoid(),
      eventType: 'student_interaction',
      timestamp: new Date(),
      data: event,
      metadata: {
        userId: event.studentId,
        courseId: event.courseId,
        sessionId: event.sessionId
      }
    } as KafkaMessage<InteractionEvent>
  }));

  await sendToKafka(KAFKA_TOPICS.STUDENT_INTERACTIONS, messages);
}

// Publish video analytics event
export async function publishVideoAnalyticsEvent(data: {
  studentId: string;
  videoId: string;
  courseId: string;
  action: 'play' | 'pause' | 'seek' | 'complete' | 'speed_change';
  position: number;
  duration: number;
  metadata?: any;
}): Promise<void> {
  const kafkaMessage: KafkaMessage = {
    eventId: nanoid(),
    eventType: 'video_analytics',
    timestamp: new Date(),
    data,
    metadata: {
      userId: data.studentId,
      courseId: data.courseId,
      videoId: data.videoId
    }
  };

  await sendToKafka(KAFKA_TOPICS.VIDEO_ANALYTICS, [{
    key: data.studentId,
    value: kafkaMessage
  }]);
}

// Publish learning metrics update
export async function publishLearningMetricsUpdate(data: {
  studentId: string;
  courseId: string;
  metrics: {
    engagementScore?: number;
    progressPercentage?: number;
    completionRate?: number;
    timeSpent?: number;
    strugglingAreas?: string[];
  };
}): Promise<void> {
  const kafkaMessage: KafkaMessage = {
    eventId: nanoid(),
    eventType: 'metrics_update',
    timestamp: new Date(),
    data,
    metadata: {
      userId: data.studentId,
      courseId: data.courseId
    }
  };

  await sendToKafka(KAFKA_TOPICS.LEARNING_METRICS, [{
    key: data.studentId,
    value: kafkaMessage
  }]);
}

// Publish content flag event
export async function publishContentFlagEvent(data: {
  contentId: string;
  contentType: string;
  flagType: string;
  studentId?: string;
  courseId?: string;
  metadata?: any;
}): Promise<void> {
  const kafkaMessage: KafkaMessage = {
    eventId: nanoid(),
    eventType: 'content_flag',
    timestamp: new Date(),
    data,
    metadata: {
      userId: data.studentId,
      courseId: data.courseId,
      contentId: data.contentId
    }
  };

  await sendToKafka(KAFKA_TOPICS.CONTENT_FLAGS, [{
    key: data.contentId,
    value: kafkaMessage
  }]);
}

// Publish real-time event for dashboard updates
export async function publishRealTimeEvent(data: {
  type: 'metric_update' | 'student_activity' | 'alert' | 'system_status';
  courseId?: string;
  payload: any;
}): Promise<void> {
  const kafkaMessage: KafkaMessage = {
    eventId: nanoid(),
    eventType: data.type,
    timestamp: new Date(),
    data: data.payload,
    metadata: {
      courseId: data.courseId
    }
  };

  await sendToKafka(KAFKA_TOPICS.REAL_TIME_EVENTS, [{
    key: data.courseId || 'global',
    value: kafkaMessage
  }]);
}