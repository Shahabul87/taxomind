// Kafka Configuration and Client
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '@/lib/logger';

// Lazy-initialized Kafka client - only created when KAFKA_BROKERS is set
let kafka: Kafka | null = null;

function getKafka(): Kafka | null {
  if (kafka) return kafka;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    return null;
  }
  kafka = new Kafka({
    clientId: 'alam-lms-analytics',
    brokers: brokers.split(','),
    retry: {
      initialRetryTime: 100,
      retries: 8
    }
  });
  return kafka;
}

// Producer instance
let producer: Producer | null = null;

// Consumer instances
const consumers = new Map<string, Consumer>();

// Initialize Kafka producer
export async function initializeProducer(): Promise<Producer | null> {
  if (producer) return producer;
  const kafkaClient = getKafka();
  if (!kafkaClient) {
    logger.debug('[KAFKA] Not configured (KAFKA_BROKERS not set) - skipping producer init');
    return null;
  }
  producer = kafkaClient.producer();
  await producer.connect();
  return producer;
}

// Initialize Kafka consumer
export async function initializeConsumer(
  groupId: string,
  topics: string[]
): Promise<Consumer | null> {
  if (consumers.has(groupId)) return consumers.get(groupId)!;
  const kafkaClient = getKafka();
  if (!kafkaClient) {
    logger.debug('[KAFKA] Not configured - skipping consumer init');
    return null;
  }
  const consumer = kafkaClient.consumer({ groupId });
  await consumer.connect();

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  consumers.set(groupId, consumer);
  return consumers.get(groupId)!;
}

// Send message to Kafka topic
export async function sendToKafka(
  topic: string,
  messages: Array<{ key?: string; value: any }>
): Promise<void> {
  const prod = await initializeProducer();
  if (!prod) return; // Kafka not configured, silently skip

  const kafkaMessages = messages.map(msg => ({
    key: msg.key,
    value: JSON.stringify(msg.value),
    timestamp: Date.now().toString()
  }));

  await prod.send({
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