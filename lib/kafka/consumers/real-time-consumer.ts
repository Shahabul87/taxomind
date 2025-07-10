// Real-time Events Kafka Consumer for WebSocket Broadcasting
import { EachMessagePayload } from 'kafkajs';
import { initializeConsumer, KAFKA_TOPICS, KafkaMessage } from '../index';
import { Server as SocketIOServer } from 'socket.io';
import { redis } from '@/lib/redis';

let io: SocketIOServer | null = null;

// Initialize Socket.IO server
export function initializeSocketIO(server: any): void {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join course-specific rooms
    socket.on('join_course', (courseId: string) => {
      socket.join(`course:${courseId}`);
      console.log(`Socket ${socket.id} joined course:${courseId}`);
    });

    // Join admin room
    socket.on('join_admin', () => {
      socket.join('admin');
      console.log(`Socket ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

// Process real-time event messages
export async function processRealTimeMessage(
  payload: EachMessagePayload
): Promise<void> {
  const { message } = payload;
  
  if (!message.value || !io) return;
  
  try {
    const kafkaMessage: KafkaMessage = JSON.parse(message.value.toString());
    const { eventType, data, metadata } = kafkaMessage;
    
    switch (eventType) {
      case 'metric_update':
        await broadcastMetricUpdate(data, metadata);
        break;
      case 'student_activity':
        await broadcastStudentActivity(data, metadata);
        break;
      case 'alert':
        await broadcastAlert(data, metadata);
        break;
      case 'system_status':
        await broadcastSystemStatus(data);
        break;
    }
    
  } catch (error) {
    console.error('Error processing real-time message:', error);
  }
}

// Broadcast metric updates
async function broadcastMetricUpdate(
  data: any,
  metadata: any
): Promise<void> {
  if (!io) return;

  // Calculate aggregated metrics
  const metrics = await calculateRealTimeMetrics(metadata.courseId);
  
  // Broadcast to course room
  if (metadata.courseId) {
    io.to(`course:${metadata.courseId}`).emit('metrics_update', {
      courseId: metadata.courseId,
      metrics,
      timestamp: new Date()
    });
  }
  
  // Broadcast to admin room
  io.to('admin').emit('global_metrics_update', {
    metrics: await calculateGlobalMetrics(),
    timestamp: new Date()
  });
}

// Broadcast student activity updates
async function broadcastStudentActivity(
  data: any,
  metadata: any
): Promise<void> {
  if (!io) return;

  // Format activity data
  const activity = {
    studentId: data.studentId,
    studentName: data.studentName,
    currentActivity: data.currentActivity,
    engagementScore: data.engagementScore,
    status: data.status,
    lastSeen: data.timestamp
  };
  
  // Broadcast to course room
  if (metadata.courseId) {
    io.to(`course:${metadata.courseId}`).emit('student_activity', {
      courseId: metadata.courseId,
      activity,
      timestamp: new Date()
    });
  }
}

// Broadcast alerts
async function broadcastAlert(
  data: any,
  metadata: any
): Promise<void> {
  if (!io) return;

  const alert = {
    id: data.id,
    type: data.type,
    severity: data.severity,
    title: data.title,
    description: data.description,
    affectedStudents: data.affectedStudents,
    timestamp: new Date()
  };
  
  // Broadcast to relevant rooms
  if (metadata.courseId) {
    io.to(`course:${metadata.courseId}`).emit('new_alert', alert);
  } else {
    io.to('admin').emit('new_alert', alert);
  }
  
  // Store alert for persistence
  await storeAlert(alert, metadata.courseId);
}

// Broadcast system status
async function broadcastSystemStatus(data: any): Promise<void> {
  if (!io) return;

  io.to('admin').emit('system_status', {
    status: data,
    timestamp: new Date()
  });
}

// Calculate real-time metrics from Redis
async function calculateRealTimeMetrics(courseId: string): Promise<any> {
  const activeUsersKey = `active_users:${courseId}`;
  const engagementKey = `engagement:${courseId}`;
  const metricsKey = `metrics:${courseId}:${new Date().getHours()}`;
  
  const [activeUsers, engagementScores, hourlyMetrics] = await Promise.all([
    redis.scard(activeUsersKey),
    redis.lrange(engagementKey, 0, -1),
    redis.hgetall(metricsKey)
  ]);
  
  // Calculate average engagement
  const avgEngagement = engagementScores.length > 0
    ? engagementScores.reduce((sum, score) => sum + parseFloat(score), 0) / engagementScores.length
    : 0;
  
  return {
    activeUsers,
    avgEngagementScore: Math.round(avgEngagement),
    totalInteractions: parseInt(hourlyMetrics.interactions || '0'),
    currentVideosWatching: await redis.scard(`watching_videos:${courseId}`),
    strugglingStudents: await redis.scard(`struggling:${courseId}`)
  };
}

// Calculate global metrics
async function calculateGlobalMetrics(): Promise<any> {
  const pattern = 'active_users:*';
  const keys = await redis.keys(pattern);
  
  let totalActiveUsers = 0;
  for (const key of keys) {
    totalActiveUsers += await redis.scard(key);
  }
  
  // Get system load from monitoring
  const systemLoad = await getSystemLoad();
  
  return {
    totalActiveUsers,
    systemLoad,
    totalCourses: keys.length,
    timestamp: new Date()
  };
}

// Store alert in Redis
async function storeAlert(alert: any, courseId?: string): Promise<void> {
  const key = courseId ? `alerts:${courseId}` : 'alerts:global';
  
  await redis.lpush(key, JSON.stringify(alert));
  await redis.ltrim(key, 0, 99); // Keep last 100 alerts
  
  // Set expiry for auto-cleanup
  await redis.expire(key, 86400); // 24 hours
}

// Get system load metrics
async function getSystemLoad(): Promise<number> {
  // In production, get from monitoring service
  // For now, return a simulated value
  const activeConnections = io?.engine?.clientsCount || 0;
  const load = Math.min((activeConnections / 100) * 100, 100);
  
  return Math.round(load);
}

// Start real-time consumer
export async function startRealTimeConsumer(): Promise<void> {
  try {
    const consumer = await initializeConsumer(
      'real-time-events',
      [KAFKA_TOPICS.REAL_TIME_EVENTS]
    );
    
    await consumer.run({
      eachMessage: processRealTimeMessage
    });
    
    console.log('Real-time consumer started');
  } catch (error) {
    console.error('Failed to start real-time consumer:', error);
    throw error;
  }
}

// WebSocket event handlers for client requests
export function setupWebSocketHandlers(): void {
  if (!io) return;

  io.on('connection', (socket) => {
    // Request current metrics
    socket.on('request_metrics', async (courseId: string) => {
      const metrics = await calculateRealTimeMetrics(courseId);
      socket.emit('metrics_update', {
        courseId,
        metrics,
        timestamp: new Date()
      });
    });

    // Request alerts
    socket.on('request_alerts', async (courseId: string) => {
      const key = courseId ? `alerts:${courseId}` : 'alerts:global';
      const alerts = await redis.lrange(key, 0, 49);
      
      socket.emit('alerts_list', {
        alerts: alerts.map(a => JSON.parse(a)),
        timestamp: new Date()
      });
    });

    // Resolve alert
    socket.on('resolve_alert', async (alertId: string) => {
      // Broadcast alert resolution
      io?.emit('alert_resolved', {
        alertId,
        resolvedBy: socket.id,
        timestamp: new Date()
      });
    });
  });
}