# SAM AI API Documentation
**Taxomind LMS - API Reference Guide**

## 📋 API Overview

This documentation covers all SAM (Smart AI Mentor) API endpoints implemented in the Taxomind LMS platform. All APIs follow RESTful conventions and return JSON responses.

---

## 🔒 Authentication

All SAM API endpoints require authentication using NextAuth.js session tokens.

```typescript
// Authentication header required for all requests
headers: {
  'Authorization': `Bearer ${sessionToken}`,
  'Content-Type': 'application/json'
}
```

---

## 🧠 Content Intelligence API

### Base URL: `/api/sam/content-analysis`

#### Analyze Content
**POST** `/api/sam/content-analysis`

Analyzes content for complexity, readability, and learning insights.

**Request Body:**
```json
{
  "action": "analyze-content",
  "data": {
    "content": "string",
    "type": "text|video|audio|image|document",
    "context": {
      "courseId": "string",
      "level": "beginner|intermediate|advanced",
      "subject": "string"
    },
    "options": {
      "includeComplexity": true,
      "includeSuggestions": true,
      "includePrerequisites": true,
      "includeObjectives": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "analyze-content",
  "data": {
    "complexityScore": 75,
    "readabilityLevel": "intermediate",
    "estimatedReadingTime": 12,
    "difficulty": "intermediate",
    "learningObjectives": [
      "Understand React hooks fundamentals",
      "Implement useState and useEffect"
    ],
    "prerequisites": [
      "JavaScript ES6",
      "React components"
    ],
    "suggestedEnhancements": [
      {
        "type": "add_example",
        "description": "Add practical code example",
        "priority": "high"
      }
    ],
    "metadata": {
      "analysisId": "analysis-123",
      "timestamp": "2025-01-21T10:00:00Z",
      "version": "1.0"
    }
  }
}
```

#### Generate Content Enhancements
**POST** `/api/sam/content-analysis`

Generates AI-powered content improvements and suggestions.

**Request Body:**
```json
{
  "action": "generate-enhancements",
  "data": {
    "contentId": "string",
    "analysisId": "string",
    "enhancementTypes": [
      "examples",
      "exercises",
      "explanations",
      "visuals"
    ],
    "targetAudience": "string",
    "difficultyLevel": "beginner|intermediate|advanced"
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "generate-enhancements",
  "data": {
    "enhancements": [
      {
        "id": "enhancement-001",
        "type": "code_example",
        "title": "Interactive useState Example",
        "content": "// Enhanced code example here",
        "position": "after_paragraph_2",
        "priority": "high"
      }
    ],
    "estimatedImprovementScore": 25
  }
}
```

---

## 📊 Learning Analytics API

### Base URL: `/api/sam/learning-analytics`

#### Generate Learning Insights
**POST** `/api/sam/learning-analytics`

Analyzes learning patterns and generates predictive insights.

**Request Body:**
```json
{
  "action": "generate-insights",
  "data": {
    "userId": "string",
    "courseId": "string",
    "timeRange": "7d|30d|90d|1y",
    "includePredictivenInsights": true,
    "includeLearningPath": true,
    "includePerformanceMetrics": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "generate-insights",
  "data": {
    "learningInsights": {
      "overallProgress": 78,
      "engagementLevel": "high",
      "learningVelocity": 2.3,
      "strongAreas": [
        "JavaScript fundamentals",
        "React components"
      ],
      "improvementAreas": [
        "State management",
        "API integration"
      ]
    },
    "predictions": [
      {
        "type": "completion_time",
        "prediction": "14 days",
        "confidence": 0.85
      },
      {
        "type": "performance_forecast",
        "prediction": "92% success rate",
        "confidence": 0.78
      }
    ],
    "recommendations": [
      {
        "id": "rec-001",
        "type": "content",
        "title": "Additional State Management Practice",
        "priority": "high",
        "estimatedTime": "2 hours"
      }
    ]
  }
}
```

#### Get Learning Path
**POST** `/api/sam/learning-analytics`

Generates optimized learning paths based on user progress and goals.

**Request Body:**
```json
{
  "action": "generate-learning-path",
  "data": {
    "userId": "string",
    "courseId": "string",
    "learningGoals": ["string"],
    "currentSkillLevel": "beginner|intermediate|advanced",
    "timeConstraints": {
      "totalHours": 40,
      "hoursPerWeek": 10
    },
    "learningStyle": "visual|auditory|kinesthetic|reading"
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "generate-learning-path",
  "data": {
    "learningPath": {
      "id": "path-123",
      "title": "Personalized React Development Path",
      "estimatedDuration": "6 weeks",
      "milestones": [
        {
          "id": "milestone-1",
          "title": "React Fundamentals",
          "estimatedTime": "1 week",
          "resources": [
            {
              "type": "video",
              "title": "React Basics",
              "duration": "2 hours"
            }
          ]
        }
      ],
      "adaptiveElements": [
        "difficulty_adjustment",
        "pace_modification",
        "content_personalization"
      ]
    }
  }
}
```

---

## 🎯 Personalization API

### Base URL: `/api/sam/personalization`

#### Get Personalized Recommendations
**POST** `/api/sam/personalization`

Provides personalized content and learning recommendations.

**Request Body:**
```json
{
  "action": "get-recommendations",
  "data": {
    "userId": "string",
    "courseId": "string",
    "currentContext": {
      "chapterId": "string",
      "sectionId": "string",
      "timeSpent": 1800,
      "lastInteraction": "2025-01-21T09:00:00Z"
    },
    "learningPreferences": {
      "contentFormat": "visual|auditory|kinesthetic|reading",
      "pacePreference": "slow|normal|fast",
      "difficultyAdjustment": "auto|manual"
    },
    "includeStudyBuddy": true,
    "includeEmotionalAnalysis": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "get-recommendations",
  "data": {
    "personalizedContent": [
      {
        "id": "content-001",
        "type": "interactive_exercise",
        "title": "React Hooks Practice",
        "reason": "Matches visual learning style",
        "priority": "high"
      }
    ],
    "studyBuddy": {
      "id": "sam-buddy-1",
      "personality": "encouraging",
      "message": "Great progress! Ready for the next challenge?",
      "suggestions": [
        "Take a 5-minute break",
        "Try the interactive exercise",
        "Review key concepts"
      ]
    },
    "emotionalInsights": {
      "engagement": 82,
      "confidence": 75,
      "motivation": 88,
      "stress": 25,
      "recommendation": "Continue current pace, high engagement detected"
    },
    "adaptiveSettings": {
      "recommendedPace": "normal",
      "suggestedBreakTime": 15,
      "nextOptimalContent": "hands_on_practice"
    }
  }
}
```

#### Update Learning Preferences
**POST** `/api/sam/personalization`

Updates user learning preferences and personalization settings.

**Request Body:**
```json
{
  "action": "update-preferences",
  "data": {
    "userId": "string",
    "preferences": {
      "contentFormat": "visual",
      "pacePreference": "fast",
      "difficultyAdjustment": "auto",
      "interactionStyle": "exploratory",
      "notificationLevel": "moderate",
      "visualTheme": "dark",
      "fontSize": 16,
      "autoPlay": false,
      "showHints": true,
      "enableGamification": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "update-preferences",
  "data": {
    "updated": true,
    "preferences": {
      // Updated preferences object
    },
    "adaptationPlan": {
      "changes": [
        "Increased visual content recommendations",
        "Faster paced content delivery",
        "Auto difficulty adjustment enabled"
      ],
      "effectiveFrom": "2025-01-21T10:30:00Z"
    }
  }
}
```

---

## 🤝 Collaboration API

### Base URL: `/api/collaboration`

#### Session Management
**GET** `/api/collaboration/session`

Retrieves or creates collaboration sessions.

**Query Parameters:**
- `courseId` (required): Course identifier
- `chapterId` (required): Chapter identifier
- `sectionId` (required): Section identifier

**Response:**
```json
{
  "session": {
    "id": "session-123",
    "title": "React Hooks Study Session",
    "hostId": "user-456",
    "startTime": "2025-01-21T10:00:00Z",
    "isActive": true,
    "maxParticipants": 20,
    "sessionType": "study-group"
  },
  "participants": [
    {
      "id": "user-123",
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg",
      "status": "online",
      "role": "student",
      "joinedAt": "2025-01-21T10:05:00Z",
      "isVideoEnabled": false,
      "isAudioEnabled": true,
      "isScreenSharing": false
    }
  ]
}
```

**POST** `/api/collaboration/session`

Creates a new collaboration session.

**Request Body:**
```json
{
  "courseId": "string",
  "chapterId": "string",
  "sectionId": "string",
  "title": "string",
  "sessionType": "study-group|tutoring|discussion|presentation",
  "maxParticipants": 20,
  "isPublic": true
}
```

#### Message Management
**POST** `/api/collaboration/message`

Sends messages in collaboration sessions.

**Request Body:**
```json
{
  "sessionId": "string",
  "message": {
    "content": "string",
    "type": "text|file|drawing|question|answer",
    "isPrivate": false,
    "replyTo": "message-id" // optional
  }
}
```

**GET** `/api/collaboration/message`

Retrieves chat messages for a session.

**Query Parameters:**
- `sessionId` (required): Session identifier
- `limit` (optional): Number of messages (default: 50)
- `offset` (optional): Pagination offset (default: 0)

#### Breakout Room Management
**POST** `/api/collaboration/breakout-room`

Creates breakout rooms for focused group discussions.

**Request Body:**
```json
{
  "sessionId": "string",
  "room": {
    "name": "string",
    "topic": "string",
    "timeLimit": 15, // minutes
    "maxParticipants": 6
  }
}
```

**GET** `/api/collaboration/breakout-room`

Retrieves available breakout rooms.

**Query Parameters:**
- `sessionId` (required): Session identifier

---

## 🏢 Enterprise Intelligence API

### Base URL: `/api/sam/enterprise-intelligence`

#### Comprehensive Analytics
**POST** `/api/sam/enterprise-intelligence`

Generates enterprise-level analytics and insights.

**Request Body:**
```json
{
  "action": "get-comprehensive-analytics",
  "data": {
    "organizationId": "string",
    "timeRange": "24h|7d|30d|90d",
    "metrics": [
      "security",
      "performance",
      "engagement",
      "financial"
    ],
    "includePredictivenInsights": true,
    "enableRealTimeData": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "get-comprehensive-analytics",
  "data": {
    "securityMetrics": {
      "threatLevel": "low",
      "activeThreats": 0,
      "vulnerabilitiesDetected": 2,
      "securityScore": 95,
      "incidents": []
    },
    "performanceMetrics": {
      "systemHealth": 98,
      "averageResponseTime": 145,
      "uptime": 99.9,
      "errorRate": 0.02,
      "throughput": 1250
    },
    "engagementMetrics": {
      "activeUsers": 1245,
      "sessionDuration": 28.5,
      "bounceRate": 12.3,
      "completionRate": 78.9,
      "satisfactionScore": 4.2
    },
    "predictiveInsights": [
      {
        "category": "performance",
        "insight": "Server load expected to increase by 25% next week",
        "confidence": 0.87,
        "recommendation": "Scale infrastructure proactively"
      }
    ]
  }
}
```

#### Security Monitoring
**POST** `/api/sam/enterprise-intelligence`

Retrieves security monitoring and threat analysis.

**Request Body:**
```json
{
  "action": "get-security-analysis",
  "data": {
    "organizationId": "string",
    "includeThreats": true,
    "includeVulnerabilities": true,
    "includeAuditLog": true,
    "timeRange": "24h"
  }
}
```

---

## 💰 Financial Intelligence API

### Base URL: `/api/sam/financial-intelligence`

#### Comprehensive Financial Analysis
**POST** `/api/sam/financial-intelligence`

Analyzes financial data and generates business intelligence.

**Request Body:**
```json
{
  "action": "analyze-financials",
  "data": {
    "organizationId": "string",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    },
    "includeForecasting": true,
    "includeOptimization": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "analyze-financials",
  "data": {
    "revenue": {
      "totalRevenue": 125000,
      "recurringRevenue": 85000,
      "oneTimeRevenue": 40000,
      "revenueGrowth": {
        "monthly": 15,
        "yearly": 250
      },
      "averageRevenuePerUser": 89.50
    },
    "costs": {
      "totalCosts": 75000,
      "fixedCosts": 35000,
      "variableCosts": 40000,
      "costCategories": [
        {
          "category": "Infrastructure",
          "amount": 15000,
          "percentage": 20,
          "optimizationPotential": 0.3
        }
      ]
    },
    "profitability": {
      "grossProfit": 50000,
      "netProfit": 25000,
      "grossMargin": 40,
      "netMargin": 20
    },
    "forecasts": {
      "shortTerm": {
        "period": "3 months",
        "projectedRevenue": 425000,
        "projectedProfit": 95000,
        "confidence": 0.85
      }
    },
    "recommendations": [
      {
        "category": "cost",
        "priority": "high",
        "recommendation": "Optimize infrastructure costs",
        "expectedImpact": {
          "cost": 5000,
          "timeframe": "3 months"
        }
      }
    ]
  }
}
```

#### Revenue Optimization
**POST** `/api/sam/financial-intelligence`

Provides revenue analysis and optimization strategies.

**Request Body:**
```json
{
  "action": "revenue-analysis",
  "data": {
    "organizationId": "string",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    },
    "includeSegmentation": true,
    "includePricingAnalysis": true
  }
}
```

#### Cost Analysis
**POST** `/api/sam/financial-intelligence`

Analyzes costs and identifies optimization opportunities.

**Request Body:**
```json
{
  "action": "cost-analysis",
  "data": {
    "organizationId": "string",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    },
    "includeOptimizationSuggestions": true,
    "includeBenchmarking": true
  }
}
```

---

## 🔄 Real-Time Features

### WebSocket Integration

SAM supports real-time features through WebSocket connections:

```typescript
// WebSocket connection for real-time updates
const wsUrl = process.env.NODE_ENV === 'production' 
  ? 'wss://api.taxomind.com/ws' 
  : 'ws://localhost:3001/ws';

const socket = new WebSocket(wsUrl);

socket.onopen = () => {
  // Subscribe to SAM updates
  socket.send(JSON.stringify({
    type: 'subscribe',
    channels: ['analytics', 'collaboration', 'personalization']
  }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'analytics_update':
      updateAnalyticsDashboard(data.payload);
      break;
    case 'collaboration_event':
      handleCollaborationEvent(data.payload);
      break;
    case 'personalization_update':
      updatePersonalizedContent(data.payload);
      break;
  }
};
```

---

## 📊 Response Formats

### Standard Success Response
```json
{
  "success": true,
  "action": "string",
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2025-01-21T10:00:00Z",
    "version": "1.0",
    "executionTime": 245
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "string",
  "code": "SAM_ERROR_CODE",
  "details": {
    "message": "Detailed error message",
    "field": "fieldName", // if validation error
    "suggestion": "Try checking your input parameters"
  },
  "metadata": {
    "timestamp": "2025-01-21T10:00:00Z",
    "requestId": "req-123"
  }
}
```

---

## 🔒 Rate Limits

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| Content Analysis | 100 requests | 1 hour |
| Learning Analytics | 200 requests | 1 hour |
| Personalization | 500 requests | 1 hour |
| Collaboration | 1000 requests | 1 hour |
| Enterprise Intelligence | 50 requests | 1 hour |
| Financial Intelligence | 100 requests | 1 hour |

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642781400
X-RateLimit-Window: 3600
```

---

## 🛠️ SDKs and Integration Examples

### JavaScript/TypeScript SDK
```typescript
import { SAMClient } from '@taxomind/sam-sdk';

const sam = new SAMClient({
  apiKey: process.env.SAM_API_KEY,
  baseUrl: 'https://api.taxomind.com'
});

// Content analysis
const analysis = await sam.content.analyze({
  content: 'Learning content here...',
  type: 'text',
  options: {
    includeComplexity: true,
    includeSuggestions: true
  }
});

// Learning insights
const insights = await sam.learning.getInsights({
  userId: 'user-123',
  courseId: 'course-456',
  timeRange: '30d'
});

// Personalization
const recommendations = await sam.personalization.getRecommendations({
  userId: 'user-123',
  context: { courseId: 'course-456' }
});
```

### Python SDK
```python
from taxomind_sam import SAMClient

sam = SAMClient(
    api_key=os.environ['SAM_API_KEY'],
    base_url='https://api.taxomind.com'
)

# Content analysis
analysis = sam.content.analyze(
    content='Learning content here...',
    content_type='text',
    options={
        'include_complexity': True,
        'include_suggestions': True
    }
)

# Financial analysis
financials = sam.financial.analyze(
    organization_id='org-123',
    date_range={
        'start': '2025-01-01',
        'end': '2025-01-31'
    }
)
```

---

## 🧪 Testing Endpoints

### Postman Collection
A comprehensive Postman collection is available for testing all SAM API endpoints:

[Download SAM API Postman Collection](./postman/sam-api-collection.json)

### cURL Examples
```bash
# Content Analysis
curl -X POST "https://api.taxomind.com/api/sam/content-analysis" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze-content",
    "data": {
      "content": "React hooks are functions that let you use state and other React features in functional components.",
      "type": "text",
      "context": {
        "courseId": "react-101",
        "level": "intermediate"
      }
    }
  }'

# Learning Analytics
curl -X POST "https://api.taxomind.com/api/sam/learning-analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate-insights",
    "data": {
      "userId": "user-123",
      "courseId": "react-101",
      "timeRange": "30d"
    }
  }'
```

---

## 📈 Monitoring and Observability

### Health Check Endpoint
**GET** `/api/sam/health`

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "content_engine": "healthy",
    "learning_engine": "healthy",
    "personalization_engine": "healthy",
    "collaboration_service": "healthy",
    "enterprise_intelligence": "healthy",
    "financial_intelligence": "healthy"
  },
  "timestamp": "2025-01-21T10:00:00Z"
}
```

### Metrics Endpoint
**GET** `/api/sam/metrics`

```json
{
  "requests_total": 12543,
  "requests_per_second": 4.2,
  "average_response_time": 245,
  "error_rate": 0.02,
  "cache_hit_rate": 0.85,
  "ai_processing_time": 1250
}
```

---

**API Documentation Complete**  
*Last Updated: January 2025*  
*API Version: 1.0*  
*Total Endpoints: 25+*