# Apache Kafka Setup Guide for Intelligent Learning Platform

## Overview
Apache Kafka is used in the intelligent learning platform for real-time data streaming, enabling:
- Real-time analytics processing
- Event-driven architecture
- ML data pipeline
- Scalable message processing
- Decoupled microservices communication

## Architecture

### Kafka Topics
1. **student-interactions** - All student interaction events
2. **learning-metrics** - Aggregated learning metrics
3. **video-analytics** - Video-specific analytics events
4. **content-flags** - Content quality and struggle point flags
5. **real-time-events** - Real-time dashboard updates
6. **ml-training-data** - Preprocessed data for ML models
7. **system-alerts** - System-wide alerts and notifications

### Producers
- **Interaction Producer** - Publishes student interaction events
- **Analytics API** - Sends events from the REST API
- **Real-time Dashboard** - Publishes dashboard updates

### Consumers
- **Analytics Consumer** - Processes interaction data and updates metrics
- **ML Data Consumer** - Aggregates data for ML training
- **Real-time Consumer** - Broadcasts updates via WebSocket

## Setup Instructions

### 1. Using Docker Compose (Recommended)

```bash
# Start Kafka cluster
docker-compose -f docker-compose.kafka.yml up -d

# Check if services are running
docker-compose -f docker-compose.kafka.yml ps

# View logs
docker-compose -f docker-compose.kafka.yml logs -f kafka
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=alam-lms-analytics
KAFKA_GROUP_ID=analytics-group

# Optional: For production
KAFKA_SSL_ENABLED=false
KAFKA_SASL_MECHANISM=plain
KAFKA_USERNAME=
KAFKA_PASSWORD=
```

### 3. Running Consumers

#### Development Mode
```bash
# Run the consumer service
npm run kafka:consumer

# Or with TypeScript directly
npx ts-node scripts/kafka-consumer.ts
```

#### Production Mode
```bash
# Build the consumer
npm run build:consumer

# Run with PM2
pm2 start dist/scripts/kafka-consumer.js --name kafka-consumer

# Or as a systemd service
sudo systemctl start alam-lms-kafka-consumer
```

### 4. Monitoring

#### Kafka UI
Access the Kafka UI at http://localhost:8090 to:
- View topics and partitions
- Monitor consumer groups
- Browse messages
- Check lag and throughput

#### Command Line Tools
```bash
# List topics
docker exec -it alam-lms-kafka kafka-topics --list --bootstrap-server localhost:9092

# View consumer groups
docker exec -it alam-lms-kafka kafka-consumer-groups --list --bootstrap-server localhost:9092

# Check consumer lag
docker exec -it alam-lms-kafka kafka-consumer-groups --describe --group analytics-interactions --bootstrap-server localhost:9092
```

## Implementation Details

### Publishing Events

```typescript
import { publishInteractionEvent } from '@/lib/kafka/producers/interaction-producer';

// Publish a student interaction
await publishInteractionEvent({
  studentId: 'user123',
  courseId: 'course456',
  sectionId: 'section789',
  eventName: 'video_play',
  metadata: {
    videoId: 'video123',
    currentTime: 0,
    duration: 300
  },
  timestamp: new Date(),
  sessionId: 'session123'
});
```

### Creating Custom Consumers

```typescript
import { initializeConsumer, KAFKA_TOPICS } from '@/lib/kafka';

async function startCustomConsumer() {
  const consumer = await initializeConsumer(
    'custom-consumer-group',
    [KAFKA_TOPICS.STUDENT_INTERACTIONS]
  );

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = JSON.parse(message.value.toString());
      console.log('Received:', value);
      // Process message
    }
  });
}
```

## Data Flow

1. **User Action** → Browser tracking captures event
2. **API Call** → Event sent to `/api/analytics/events`
3. **Database** → Event stored in PostgreSQL
4. **Kafka Producer** → Event published to topic
5. **Consumers** → Multiple consumers process in parallel:
   - Analytics Consumer → Updates Redis metrics
   - ML Consumer → Aggregates training data
   - Real-time Consumer → Broadcasts via WebSocket
6. **Dashboard** → Real-time updates displayed

## Performance Optimization

### Producer Settings
```typescript
const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
  compression: CompressionTypes.GZIP,
  maxInFlightRequests: 5
});
```

### Consumer Settings
```typescript
const consumer = kafka.consumer({
  groupId: 'analytics-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576, // 1MB
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});
```

### Batch Processing
```typescript
// Process messages in batches
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    for (const message of batch.messages) {
      // Process message
      await processMessage(message);
      
      // Heartbeat to prevent timeout
      await heartbeat();
      
      // Commit offset
      resolveOffset(message.offset);
    }
  }
});
```

## Scaling Considerations

### Horizontal Scaling
- Increase partitions for high-volume topics
- Run multiple consumer instances per group
- Use different consumer groups for different processing needs

### Partition Strategy
```typescript
// Custom partitioner for even distribution
const partitioner = ({ topic, partitionMetadata, message }) => {
  const numPartitions = partitionMetadata.length;
  const key = message.key?.toString() || '';
  
  // Hash-based partitioning
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash = hash & hash;
  }
  
  return Math.abs(hash) % numPartitions;
};
```

## Troubleshooting

### Common Issues

1. **Consumer Lag**
   - Check consumer group status
   - Increase consumer instances
   - Optimize processing logic

2. **Connection Errors**
   - Verify Kafka is running
   - Check network connectivity
   - Review broker configuration

3. **Message Loss**
   - Enable idempotent producer
   - Set proper acks configuration
   - Implement retry logic

### Debug Mode
```typescript
// Enable debug logging
const kafka = new Kafka({
  clientId: 'debug-client',
  brokers: ['localhost:9092'],
  logLevel: logLevel.DEBUG,
  logCreator: customLogCreator
});
```

## Production Deployment

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafka-consumer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kafka-consumer
  template:
    spec:
      containers:
      - name: consumer
        image: alam-lms/kafka-consumer:latest
        env:
        - name: KAFKA_BROKERS
          value: "kafka-0.kafka:9092,kafka-1.kafka:9092"
        - name: CONSUMER_GROUP
          value: "analytics-production"
```

### Health Checks
```typescript
// Health check endpoint for consumers
app.get('/health/kafka', async (req, res) => {
  try {
    const admin = kafka.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();
    
    res.json({
      status: 'healthy',
      topics: topics.length,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## Security

### SSL/TLS Configuration
```typescript
const kafka = new Kafka({
  clientId: 'secure-client',
  brokers: ['kafka1:9093', 'kafka2:9093'],
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./ca-cert.pem'),
    key: fs.readFileSync('./client-key.pem'),
    cert: fs.readFileSync('./client-cert.pem')
  }
});
```

### SASL Authentication
```typescript
const kafka = new Kafka({
  clientId: 'sasl-client',
  brokers: ['kafka1:9092'],
  sasl: {
    mechanism: 'scram-sha-512',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  }
});
```

## Best Practices

1. **Message Format**: Use consistent schema (consider Avro)
2. **Error Handling**: Implement proper retry and DLQ
3. **Monitoring**: Set up alerts for lag and errors
4. **Testing**: Use embedded Kafka for unit tests
5. **Documentation**: Document message schemas
6. **Versioning**: Handle schema evolution gracefully

The Kafka integration provides a robust foundation for real-time analytics and scalable event processing in the intelligent learning platform.