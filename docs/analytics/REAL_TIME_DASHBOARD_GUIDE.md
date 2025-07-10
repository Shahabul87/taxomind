# Real-Time Analytics Dashboard Guide

## Overview
The real-time analytics dashboard provides live insights into student learning activities, content engagement, and system health. It aggregates data from all tracking systems to deliver actionable intelligence for educators and administrators.

## Features

### 🔴 Live Metrics
- **Active Users**: Current number of users online
- **Engagement Score**: Real-time average engagement across all activities
- **Video Sessions**: Number of users currently watching videos
- **Completion Rate**: Live course completion statistics

### 📊 Visual Analytics
- **Activity Timeline**: Real-time charts showing user activity trends
- **Engagement Distribution**: Pie charts showing performance segments
- **Content Performance**: Bar charts comparing different content types
- **System Health**: Load monitoring and performance metrics

### 🚨 Intelligent Alerts
- **Struggle Detection**: Automatic alerts when students have difficulty
- **Dropout Risk**: Early warning for students at risk of dropping out
- **Technical Issues**: System errors and performance problems
- **Content Quality**: Low-performing content identification

### 👥 Student Activity Monitoring
- **Live Activity Feed**: See what students are doing in real-time
- **Status Indicators**: Active, idle, or struggling status
- **Engagement Tracking**: Individual student engagement scores
- **Progress Monitoring**: Real-time progress updates

## Implementation

### Basic Usage

```typescript
import { RealTimeDashboard } from '@/components/analytics/real-time-dashboard';

function TeacherDashboard({ courseId }) {
  return (
    <RealTimeDashboard 
      courseId={courseId}
      view="teacher"
      refreshInterval={5000}
    />
  );
}
```

### Using the Hook

```typescript
import { useRealTimeAnalytics } from '@/hooks/use-real-time-analytics';

function CustomDashboard() {
  const {
    metrics,
    studentActivities,
    alerts,
    isConnected,
    refreshAll,
    resolveAlert
  } = useRealTimeAnalytics({
    courseId: 'course123',
    autoRefresh: true,
    refreshInterval: 5000
  });

  return (
    <div>
      <h2>Live Metrics</h2>
      <p>Active Users: {metrics?.activeUsers}</p>
      <p>Engagement: {metrics?.avgEngagementScore}%</p>
      
      {alerts.map(alert => (
        <div key={alert.id} className={`alert-${alert.severity}`}>
          {alert.title}
          <button onClick={() => resolveAlert(alert.id)}>
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Dashboard Views

### Student View
```typescript
<RealTimeDashboard 
  view="student"
  courseId="course123"
/>
```

**Features for Students:**
- Personal engagement score with trends
- Time spent learning today
- Course progress with completion rate
- Leaderboard position (optional)
- Personal recommendations

### Teacher View
```typescript
<RealTimeDashboard 
  view="teacher"
  courseId="course123"
/>
```

**Features for Teachers:**
- Course-wide analytics
- Student activity monitoring
- Content performance metrics
- Struggling student identification
- Alert management system

### Admin View
```typescript
<RealTimeDashboard 
  view="admin"
/>
```

**Features for Administrators:**
- System-wide metrics
- Multi-course analytics
- Technical health monitoring
- Performance optimization insights

## Alert System

### Alert Types

#### 1. Struggle Alerts
```json
{
  "type": "struggle",
  "severity": "high",
  "title": "Students struggling with content",
  "description": "15 students having difficulty with video",
  "affectedStudents": 15,
  "contentId": "video123"
}
```

#### 2. Dropout Risk Alerts
```json
{
  "type": "dropout",
  "severity": "critical", 
  "title": "High dropout risk detected",
  "description": "20 students inactive for over a week",
  "affectedStudents": 20
}
```

#### 3. Engagement Alerts
```json
{
  "type": "engagement",
  "severity": "medium",
  "title": "Low engagement in course",
  "description": "Average engagement below 40%",
  "affectedStudents": 12
}
```

#### 4. Technical Alerts
```json
{
  "type": "technical",
  "severity": "high",
  "title": "Video playback errors",
  "description": "Multiple video loading failures",
  "affectedStudents": 8
}
```

### Alert Management

```typescript
// Resolve an alert
await resolveAlert(alertId);

// Get critical alerts
const criticalAlerts = alerts.filter(
  alert => alert.severity === 'critical' && !alert.resolved
);

// Auto-resolve based on conditions
useEffect(() => {
  alerts.forEach(alert => {
    if (alert.type === 'struggle' && alert.affectedStudents < 3) {
      resolveAlert(alert.id);
    }
  });
}, [alerts]);
```

## API Endpoints

### Real-time Metrics
```http
GET /api/analytics/real-time/metrics?courseId=123&timeRange=1h
```

**Response:**
```json
{
  "activeUsers": 45,
  "totalInteractions": 1250,
  "avgEngagementScore": 78.5,
  "completionRate": 65.2,
  "currentVideosWatching": 12,
  "strugglingStudents": 3,
  "topPerformers": 18,
  "systemLoad": 23.4,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Student Activities
```http
GET /api/analytics/real-time/activities?courseId=123
```

**Response:**
```json
{
  "activities": [
    {
      "studentId": "student123",
      "studentName": "John Doe",
      "currentActivity": "Watching: React Hooks",
      "engagementScore": 85,
      "timeSpent": 45,
      "status": "active",
      "progress": 67
    }
  ]
}
```

### Content Alerts
```http
GET /api/analytics/real-time/alerts?courseId=123
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert123",
      "type": "struggle",
      "severity": "high",
      "title": "Students struggling with quiz",
      "description": "8 students failed the React quiz",
      "affectedStudents": 8,
      "timestamp": "2024-01-15T10:25:00Z",
      "resolved": false
    }
  ]
}
```

## Performance Optimization

### Efficient Data Fetching
```typescript
// Use polling for real-time updates
const { metrics } = useRealTimeAnalytics({
  refreshInterval: 5000, // 5 seconds
  autoRefresh: true
});

// For high-frequency updates, consider WebSockets
const { metrics } = useRealTimeAnalytics({
  enableWebSocket: true,
  refreshInterval: 30000 // Fallback polling
});
```

### Memory Management
```typescript
// Limit metrics history
const maxHistoryPoints = 50; // Keep last 50 data points

// Clean up subscriptions
useEffect(() => {
  return () => {
    stopAutoRefresh();
    if (wsRef.current) {
      wsRef.current.close();
    }
  };
}, []);
```

### Conditional Rendering
```typescript
// Only show detailed views for teachers/admins
{view !== 'student' && (
  <StudentActivityPanel activities={studentActivities} />
)}

// Lazy load heavy components
const HeatmapChart = lazy(() => import('./HeatmapChart'));
```

## Customization

### Custom Metrics Cards

```typescript
function CustomMetricCard({ title, value, icon, trend }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs">
          <TrendIcon trend={trend} />
          <span>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Custom Alert Handlers

```typescript
function useCustomAlertHandlers() {
  const handleStruggleAlert = async (alert) => {
    // Send notification to teacher
    await sendTeacherNotification(alert);
    
    // Create intervention task
    await createInterventionTask(alert.affectedStudents);
  };

  const handleDropoutAlert = async (alert) => {
    // Send re-engagement email
    await sendReengagementEmail(alert.metadata.inactiveStudents);
    
    // Schedule follow-up check
    await scheduleFollowUp(alert.id, 24); // 24 hours
  };

  return { handleStruggleAlert, handleDropoutAlert };
}
```

### Custom Chart Components

```typescript
function EngagementTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="timestamp"
          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="avgEngagementScore" 
          stroke="#8884d8"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Integration Examples

### Course Page Integration

```typescript
function CoursePage({ course }) {
  return (
    <div>
      <CourseHeader course={course} />
      
      {/* Real-time analytics for teachers */}
      {isTeacher && (
        <div className="mb-6">
          <RealTimeDashboard 
            courseId={course.id}
            view="teacher"
          />
        </div>
      )}
      
      <CourseContent course={course} />
    </div>
  );
}
```

### Admin Dashboard Integration

```typescript
function AdminDashboard() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Real-time Analytics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="analytics">
        <RealTimeDashboard view="admin" />
      </TabsContent>
    </Tabs>
  );
}
```

### Mobile-Optimized Dashboard

```typescript
function MobileDashboard({ courseId }) {
  const { metrics, alerts } = useRealTimeAnalytics({ courseId });
  
  return (
    <div className="space-y-4 p-4">
      {/* Simplified metrics for mobile */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard title="Active" value={metrics?.activeUsers} />
        <MetricCard title="Engagement" value={`${metrics?.avgEngagementScore}%`} />
      </div>
      
      {/* Critical alerts only */}
      {alerts
        .filter(alert => alert.severity === 'critical')
        .map(alert => (
          <AlertCard key={alert.id} alert={alert} compact />
        ))}
    </div>
  );
}
```

## Best Practices

### 1. Performance
- Use appropriate refresh intervals (5-30 seconds)
- Implement proper error handling and retries
- Limit data history to prevent memory issues
- Use lazy loading for complex components

### 2. User Experience
- Show connection status clearly
- Provide manual refresh options
- Use skeleton loading states
- Handle offline scenarios gracefully

### 3. Data Quality
- Validate incoming metrics data
- Handle missing or invalid data points
- Implement data smoothing for noisy metrics
- Set reasonable thresholds for alerts

### 4. Security
- Ensure proper authorization for different views
- Sanitize user inputs in filters
- Rate limit API requests
- Protect sensitive student data

### 5. Accessibility
- Use semantic HTML for charts
- Provide text alternatives for visual data
- Ensure sufficient color contrast
- Support keyboard navigation

The real-time analytics dashboard provides powerful insights while maintaining excellent performance and user experience across all device types and user roles.