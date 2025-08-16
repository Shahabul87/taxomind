# Analytics API Documentation

## Overview
The Analytics API provides comprehensive endpoints for tracking student behavior, analyzing learning patterns, and generating insights for both students and teachers.

## Base URL
All API endpoints are prefixed with `/api/analytics/`

## Authentication
All endpoints require authentication via NextAuth session.

## Endpoints

### 1. Event Tracking
**POST** `/api/analytics/events`

Track student interactions and behavior.

#### Request Body
```json
{
  "eventType": "click|view|scroll|video|quiz|interaction|custom",
  "eventName": "string",
  "properties": {
    // Event-specific properties
  },
  "timestamp": "ISO 8601 date",
  "sessionId": "string",
  "courseId": "string (optional)",
  "chapterId": "string (optional)",
  "sectionId": "string (optional)",
  "url": "string (optional)",
  "userAgent": "string (optional)"
}
```

#### Response
```json
{
  "success": true,
  "processed": 1
}
```

### 2. Get Analytics Data
**GET** `/api/analytics/events`

Retrieve analytics data based on type.

#### Query Parameters
- `type`: `student|course|patterns|interactions|content-flags` (required)
- `courseId`: Course ID (required for some types)
- `studentId`: Student ID (optional, defaults to current user)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `limit`: Number (optional, for interactions)

#### Response Examples

##### Student Metrics (`type=student`)
```json
{
  "userId": "string",
  "courseId": "string",
  "totalTimeSpent": 3600,
  "totalInteractions": 150,
  "videoWatchTime": 2400,
  "quizAttempts": 5,
  "engagementScore": 85,
  "learningVelocity": 1.2,
  "completionRate": 65,
  "lastActiveAt": "2024-01-15T10:30:00Z",
  "averageSessionDuration": 1800,
  "returnFrequency": 0.8
}
```

##### Course Analytics (`type=course`)
```json
{
  "totalInteractions": 5000,
  "uniqueStudents": 45,
  "eventBreakdown": {
    "clicks": 2000,
    "views": 1500,
    "videos": 1000,
    "quizzes": 500
  },
  "topStruggles": [{
    "videoId": "video123",
    "timestamp": 125,
    "count": 15
  }],
  "leaderboard": [{
    "userId": "user123",
    "score": 92
  }]
}
```

##### Learning Patterns (`type=patterns`)
```json
{
  "optimalStudyHours": [9, 10, 19, 20],
  "contentPreferences": {
    "video": 45,
    "text": 20,
    "interactive": 25,
    "quiz": 10
  },
  "learningStyle": {
    "style": "visual",
    "confidence": 85
  },
  "averageVelocity": 1.5,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### 3. Active Sessions
**GET** `/api/analytics/sessions/active`

Get count of currently active learning sessions.

#### Response
```json
{
  "count": 25,
  "courses": [{
    "courseId": "course123",
    "count": 10,
    "uniqueStudents": 8
  }],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. Learning Velocity
**GET** `/api/analytics/learning-velocity`

Calculate learning speed and progress predictions.

#### Query Parameters
- `courseId`: Course ID (required)
- `studentId`: Student ID (optional)
- `days`: Number of days to analyze (default: 30)

#### Response
```json
{
  "studentId": "string",
  "courseId": "string",
  "velocity": {
    "currentVelocity": 2.5,
    "averageVelocity": 2.0,
    "accelerating": true,
    "weeklyProgress": [{
      "week": "2024-01-08",
      "completions": 15,
      "velocity": 2.14
    }]
  },
  "peerComparison": {
    "averageVelocity": 1.8,
    "percentile": 75
  },
  "projectedCompletion": "2024-02-15T00:00:00Z"
}
```

### 5. Struggle Detection
**GET** `/api/analytics/struggle-detection`

Identify content areas where students are struggling.

#### Query Parameters
- `courseId`: Course ID (required)
- `threshold`: Minimum occurrence count (default: 3)

#### Response
```json
{
  "courseId": "string",
  "struggles": [{
    "type": "video_pause_cluster",
    "contentType": "video",
    "contentId": "video123",
    "location": "2:35",
    "count": 12,
    "severity": "high",
    "students": []
  }],
  "summary": {
    "totalStruggles": 8,
    "affectedStudents": 25,
    "criticalAreas": 3
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**POST** `/api/analytics/struggle-detection`

Record a struggle indicator.

#### Request Body
```json
{
  "contentType": "video|quiz|section",
  "contentId": "string",
  "studentId": "string (optional)",
  "indicator": "string"
}
```

### 6. Analytics Dashboard
**GET** `/api/analytics/dashboard`

Get comprehensive dashboard data.

#### Query Parameters
- `view`: `student|teacher` (default: student)
- `courseId`: Course ID (optional for student, required for teacher)
- `timeframe`: `1d|7d|30d|all` (default: 7d)

#### Student Dashboard Response
```json
{
  "overview": {
    "totalLearningTime": 36000,
    "coursesEnrolled": 5,
    "averageEngagement": 78,
    "currentStreak": 7
  },
  "courseStats": {
    "progress": 65,
    "sectionsCompleted": 13,
    "totalSections": 20,
    "timeSpent": 7200,
    "interactions": 350,
    "videoTime": 5400,
    "quizAttempts": 8,
    "engagementScore": 82
  },
  "recentActivity": [{
    "type": "SECTION_COMPLETED",
    "description": "Completed section: Introduction to AI",
    "courseTitle": "Machine Learning Basics",
    "timestamp": "2024-01-15T10:30:00Z"
  }],
  "learningPatterns": {
    "preferredTimes": [9, 10, 19, 20],
    "contentPreferences": {"video": 45, "text": 20, "interactive": 25, "quiz": 10},
    "learningVelocity": 1.5
  },
  "achievements": [{
    "type": "STUDY_STREAK",
    "title": "7-Day Streak",
    "earnedAt": "2024-01-15T00:00:00Z"
  }],
  "recommendations": [{
    "type": "study_time",
    "message": "Your optimal study times are 9, 10, 19, 20:00",
    "priority": "high"
  }]
}
```

#### Teacher Dashboard Response
```json
{
  "overview": {
    "totalEnrollments": 150,
    "activeStudents": 98,
    "completions": 45,
    "averageProgress": 62.5,
    "completionRate": 30
  },
  "studentPerformance": [{
    "studentId": "student123",
    "timeSpent": 7200,
    "interactions": 450,
    "engagementScore": 88
  }],
  "contentAnalytics": [{
    "sectionId": "section123",
    "title": "Introduction",
    "views": 145,
    "completions": 120,
    "averageTime": 900,
    "completionRate": 82.8
  }],
  "engagementTrends": [{
    "time": "2024-01-15T10:00:00Z",
    "interactions": 125
  }],
  "atRiskStudents": [{
    "studentId": "student456",
    "name": "John Doe",
    "email": "john@example.com",
    "progress": 15,
    "lastActive": "2024-01-01T00:00:00Z",
    "recentInteractions": 2,
    "engagementScore": 25,
    "riskLevel": "high"
  }],
  "contentIssues": [{
    "type": "struggle_point",
    "contentId": "video123",
    "count": 15,
    "metadata": {"timestamp": 125}
  }],
  "insights": [{
    "type": "completion",
    "severity": "warning",
    "message": "Course completion rate is 30.0%. Consider reviewing course difficulty."
  }]
}
```

## Event Types

### Click Events
- `button_click`: Button interactions
- `link_click`: Link navigation
- `menu_click`: Menu interactions

### View Events
- `page_view`: Page loads
- `section_view`: Section access
- `content_view`: Content display

### Video Events
- `video_play`: Video started
- `video_pause`: Video paused
- `video_seek`: Video position changed
- `video_complete`: Video finished
- `video_progress`: Progress updates

### Quiz Events
- `quiz_start`: Quiz attempted
- `quiz_submit`: Answer submitted
- `quiz_complete`: Quiz finished
- `quiz_retry`: Quiz retried

### Custom Events
- `struggle_indicator`: Manual struggle flag
- `content_revisit`: Repeated access
- `help_request`: Help button clicked

## Rate Limits
- Event tracking: 1000 events per minute
- Data retrieval: 100 requests per minute

## Error Codes
- `400`: Bad Request - Missing or invalid parameters
- `401`: Unauthorized - No valid session
- `403`: Forbidden - No access to requested resource
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

## Best Practices

1. **Batch Events**: Send multiple events in a single request when possible
2. **Session Management**: Maintain consistent sessionId across user sessions
3. **Error Handling**: Implement retry logic with exponential backoff
4. **Data Privacy**: Only track necessary information, respect user privacy
5. **Performance**: Use appropriate date ranges to avoid large data sets

## Example Integration

```javascript
// Initialize event tracker
import { EventTracker } from '@/lib/analytics/event-tracker';

const tracker = new EventTracker({
  endpoint: '/api/analytics/events',
  batchSize: 20,
  flushInterval: 5000
});

// Track an event
tracker.track({
  eventType: 'video',
  eventName: 'video_play',
  properties: {
    videoId: 'video123',
    currentTime: 0,
    duration: 300
  }
});

// Fetch analytics
const response = await fetch('/api/analytics/events?type=student&courseId=course123');
const data = await response.json();
```