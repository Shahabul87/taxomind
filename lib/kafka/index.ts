// Kafka Configuration and Client
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '@/lib/logger';

// Kafka client configuration
const kafka = new Kafka({
  clientId: 'alam-lms-analytics',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Producer instance
let producer: Producer | null = null;

// Consumer instances
const consumers = new Map<string, Consumer>();

// Initialize Kafka producer
export async function initializeProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();

  }
  return producer;
}

// Initialize Kafka consumer
export async function initializeConsumer(
  groupId: string,
  topics: string[]
): Promise<Consumer> {
  if (!consumers.has(groupId)) {
    const consumer = kafka.consumer({ groupId });
    await consumer.connect();
    
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }
    
    consumers.set(groupId, consumer);

  }
  
  return consumers.get(groupId)!;
}

// Send message to Kafka topic
export async function sendToKafka(
  topic: string,
  messages: Array<{ key?: string; value: any }>
): Promise<void> {
  const producer = await initializeProducer();
  
  const kafkaMessages = messages.map(msg => ({
    key: msg.key,
    value: JSON.stringify(msg.value),
    timestamp: Date.now().toString()
  }));
  
  await producer.send({
    topic,
    messages: kafkaMessages
  });
}

// Graceful shutdown
export async function disconnectKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
  
  for (const [groupId, consumer] of consumers) {
    await consumer.disconnect();

  }
  consumers.clear();
}

// Error handler
export function handleKafkaError(error: Error): void {
  logger.error('Kafka error:', error);
  // In production, send to monitoring service
}

// Topic names
export const KAFKA_TOPICS = {
  STUDENT_INTERACTIONS: 'student-interactions',
  LEARNING_METRICS: 'learning-metrics',
  VIDEO_ANALYTICS: 'video-analytics',
  CONTENT_FLAGS: 'content-flags',
  REAL_TIME_EVENTS: 'real-time-events',
  ML_TRAINING_DATA: 'ml-training-data',
  SYSTEM_ALERTS: 'system-alerts'
} as const;

// Message types
export interface KafkaMessage<T = any> {
  eventId: string;
  eventType: string;
  timestamp: Date;
  data: T;
  metadata?: {
    userId?: string;
    courseId?: string;
    sessionId?: string;
    [key: string]: any;
  };
}