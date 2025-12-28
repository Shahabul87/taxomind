# Kafka Usage Guide for Intelligent Learning Platform

## Quick Start

### 1. Start Kafka Services
```bash
# Start all Kafka services
docker-compose -f docker-compose.kafka.yml up -d

# Verify services are running
docker-compose -f docker-compose.kafka.yml ps
```

### 2. Run Kafka Consumers
```bash
# In a separate terminal, run the consumer service
npm run kafka:consumer

# Or run directly with TypeScript
npx ts-node scripts/kafka-consumer.ts
```

### 3. Access Kafka UI
Open http://localhost:8090 to monitor:
- Topics and messages
- Consumer groups and lag
- Broker health

## Development Workflow

### Publishing Events from Your Code

#### 1. Student Interaction Events
```typescript
import { publishInteractionEvent } from '@/lib/kafka/producers/interaction-producer';

// Example: Track video play event
await publishInteractionEvent({
  studentId: user.id,
  courseId: 'course123',
  sectionId: 'section456',
  eventName: 'video_play',
  metadata: {
    videoId: 'video789',
    currentTime: 0,
    duration: 600
  },
  timestamp: new Date(),
  sessionId: session.id
});
```

#### 2. Video Analytics Events
```typescript
import { publishVideoAnalyticsEvent } from '@/lib/kafka/producers/interaction-producer';

// Track video completion
await publishVideoAnalyticsEvent({
  studentId: user.id,
  videoId: 'video789',
  courseId: 'course123',
  action: 'complete',
  position: 600,
  duration: 600,
  metadata: {
    watchTime: 595,
    completionRate: 0.99
  }
});
```

#### 3. Learning Metrics Updates
```typescript
import { publishLearningMetricsUpdate } from '@/lib/kafka/producers/interaction-producer';

// Update student metrics
await publishLearningMetricsUpdate({
  studentId: user.id,
  courseId: 'course123',
  metrics: {
    engagementScore: 85,
    progressPercentage: 67,
    timeSpent: 3600,
    strugglingAreas: ['advanced-concepts']
  }
});
```

#### 4. Real-time Dashboard Events
```typescript
import { publishRealTimeEvent } from '@/lib/kafka/producers/interaction-producer';

// Send alert to dashboard
await publishRealTimeEvent({
  type: 'alert',
  courseId: 'course123',
  payload: {
    severity: 'high',
    title: 'Multiple students struggling',
    affectedStudents: 15
  }
});
```

## API Integration

### Automatic Kafka Publishing
The analytics API automatically publishes to Kafka:

```typescript
// POST /api/analytics/events
const response = await fetch('/api/analytics/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventName: 'section_view',
    courseId: 'course123',
    sectionId: 'section456',
    metadata: { timeSpent: 120 },
    sessionId: 'session123'
  })
});
// This automatically publishes to Kafka
```

## Consumer Patterns

### 1. Real-time Metrics Processing
Events flow through the analytics consumer to update:
- Active user counts
- Engagement scores
- Video analytics
- Struggle detection

### 2. ML Data Aggregation
The ML consumer collects:
- Interaction patterns
- Learning velocities
- Content preferences
- Performance indicators

### 3. WebSocket Broadcasting
Real-time consumer enables:
- Live dashboard updates
- Instant alerts
- Student activity monitoring

## Monitoring & Debugging

### View Messages in Kafka UI
1. Navigate to http://localhost:8090
2. Click on "Topics" in the sidebar
3. Select a topic (e.g., "student-interactions")
4. Click "Messages" tab to see recent events

### Command Line Monitoring
```bash
# View consumer group status
docker exec -it alam-lms-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group analytics-interactions

# Check topic message count
docker exec -it alam-lms-kafka kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic student-interactions

# Tail messages from a topic
docker exec -it alam-lms-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic real-time-events \
  --from-beginning --max-messages 10
```

### Debug Consumer Issues
```bash
# Check consumer logs
docker-compose -f docker-compose.kafka.yml logs -f kafka

# View consumer service logs
# If running with npm run kafka:consumer, check terminal output

# Reset consumer offset (use with caution)
docker exec -it alam-lms-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group analytics-interactions \
  --reset-offsets --to-earliest \
  --topic student-interactions --execute
```

## Testing Your Integration

### 1. Manual Event Publishing
```typescript
// Test script: test-kafka.ts
import { publishInteractionEvent } from '@/lib/kafka/producers/interaction-producer';

async function testKafka() {
  try {
    await publishInteractionEvent({
      studentId: 'test-user',
      courseId: 'test-course',
      eventName: 'test_event',
      metadata: { test: true },
      timestamp: new Date(),
      sessionId: 'test-session'
    });
    console.log('✅ Event published successfully');
  } catch (error) {
    console.error('❌ Failed to publish:', error);
  }
  process.exit();
}

testKafka();
```

### 2. Verify Processing
1. Check Kafka UI for the message
2. Monitor Redis for metric updates:
```bash
# Connect to Redis
docker exec -it alam-lms-redis redis-cli

# Check active users
SMEMBERS active_users:test-course

# Check metrics
HGETALL metrics:test-course:*
```

## Production Deployment

### Environment Variables
```env
# Production Kafka settings
KAFKA_BROKERS=kafka1.prod:9092,kafka2.prod:9092,kafka3.prod:9092
KAFKA_CLIENT_ID=alam-lms-prod
KAFKA_SSL_ENABLED=true
KAFKA_SASL_MECHANISM=scram-sha-512
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
```

### Kubernetes Deployment
```bash
# Deploy consumer as a separate service
kubectl apply -f k8s/kafka-consumer-deployment.yaml

# Scale consumers
kubectl scale deployment kafka-consumer --replicas=3

# Check consumer health
kubectl logs -f deployment/kafka-consumer
```

## Common Use Cases

### 1. Track Custom Events
```typescript
// Track form submission
await publishInteractionEvent({
  studentId: user.id,
  courseId: course.id,
  eventName: 'form_submit',
  metadata: {
    formId: 'quiz-1',
    score: 85,
    timeSpent: 300
  },
  timestamp: new Date(),
  sessionId: session.id
});
```

### 2. Batch Event Processing
```typescript
import { publishInteractionEventBatch } from '@/lib/kafka/producers/interaction-producer';

// Send multiple events at once
const events = clickEvents.map(click => ({
  studentId: user.id,
  courseId: course.id,
  eventName: 'click',
  metadata: click,
  timestamp: new Date(click.timestamp),
  sessionId: session.id
}));

await publishInteractionEventBatch(events);
```

### 3. Content Quality Flags
```typescript
import { publishContentFlagEvent } from '@/lib/kafka/producers/interaction-producer';

// Flag difficult content
await publishContentFlagEvent({
  contentId: 'video123',
  contentType: 'video',
  flagType: 'high_dropout',
  studentId: user.id,
  courseId: course.id,
  metadata: {
    dropoutRate: 0.4,
    averageWatchTime: 120
  }
});
```

## Troubleshooting

### Issue: Consumer Not Processing Messages
1. Check if consumer is running: `ps aux | grep kafka-consumer`
2. Verify consumer group: Check Kafka UI consumer groups
3. Check for errors in logs
4. Ensure topics exist: `docker exec -it alam-lms-kafka kafka-topics --list --bootstrap-server localhost:9092`

### Issue: High Consumer Lag
1. Check lag in Kafka UI
2. Scale up consumers
3. Optimize processing logic
4. Increase batch size

### Issue: Connection Errors
1. Verify Kafka is running: `docker-compose -f docker-compose.kafka.yml ps`
2. Check network connectivity
3. Verify environment variables
4. Review broker configuration

## Best Practices

1. **Always handle errors** when publishing events
2. **Use appropriate topics** for different event types
3. **Include sessionId** for tracking user sessions
4. **Batch events** when possible for efficiency
5. **Monitor consumer lag** regularly
6. **Set up alerts** for critical issues

## Next Steps

- Set up monitoring dashboards
- Configure production Kafka cluster
- Implement custom consumers for specific use cases
- Set up data retention policies
- Configure backup and disaster recovery

For more details on Kafka architecture and setup, see the [Kafka Setup Guide](./KAFKA_SETUP_GUIDE.md).