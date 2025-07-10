#!/usr/bin/env node

// Kafka Consumer Service - Run this as a separate process
import { startAnalyticsConsumer } from '@/lib/kafka/consumers/analytics-consumer';
import { startMLDataConsumer } from '@/lib/kafka/consumers/ml-data-consumer';
import { startRealTimeConsumer } from '@/lib/kafka/consumers/real-time-consumer';
import { disconnectKafka, handleKafkaError } from '@/lib/kafka';

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\nShutting down Kafka consumers...');
  await disconnectKafka();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down Kafka consumers...');
  await disconnectKafka();
  process.exit(0);
});

// Error handler
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled rejection:', error);
  handleKafkaError(error);
});

// Start consumers
async function start() {
  console.log('Starting Kafka consumers...');
  
  try {
    // Start all consumers in parallel
    await Promise.all([
      startAnalyticsConsumer(),
      startMLDataConsumer(),
      startRealTimeConsumer()
    ]);
    
    console.log('All Kafka consumers started successfully');
  } catch (error) {
    console.error('Failed to start Kafka consumers:', error);
    process.exit(1);
  }
}

// Run the consumer service
start();