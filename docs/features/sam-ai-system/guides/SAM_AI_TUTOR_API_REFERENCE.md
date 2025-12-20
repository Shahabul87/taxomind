# SAM AI Tutor API Reference

## Overview

This document provides comprehensive API documentation for the SAM AI Tutor system, including endpoints, request/response formats, authentication, and usage examples.

## Base URL

- **Development**: `http://localhost:3000/api/sam`
- **Production**: `https://yourdomain.com/api/sam`

## Authentication

All API endpoints require authentication via NextAuth.js session cookies. Include the session cookie in your requests.

```javascript
// Example with fetch
const response = await fetch('/api/sam/enhanced-universal-assistant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'next-auth.session-token=your-session-token'
  },
  body: JSON.stringify(requestData)
});
```

## Core APIs

### 1. Enhanced Universal Assistant

The main conversational AI interface for the SAM AI Tutor.

#### Endpoint
```
POST /api/sam/enhanced-universal-assistant
```

#### Request Body
```json
{
  "message": "Explain photosynthesis to me",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "learningContext": {
    "courseId": "course-123",
    "subject": "Biology",
    "currentTopic": "Plant Biology",
    "difficulty": "intermediate",
    "learningObjectives": ["understand cellular processes"],
    "studentLevel": "high_school"
  },
  "tutorMode": "student",
  "tutorType": "socratic",
  "learningStyle": "visual",
  "personalityProfile": {
    "communicationStyle": "encouraging",
    "motivationFactors": ["achievement", "curiosity"],
    "preferredPacing": "moderate"
  }
}
```

#### Response
```json
{
  "success": true,
  "response": "Great question! Let me guide you through photosynthesis using the Socratic method...",
  "suggestions": [
    "Can you tell me what plants need to survive?",
    "What do you notice about the color of most leaves?",
    "Where do you think plants get their energy from?"
  ],
  "adaptations": {
    "styleAdaptations": [
      "Added visual descriptions for better understanding",
      "Used analogies to everyday objects"
    ],
    "difficultyAdjustment": "Simplified terminology for intermediate level"
  },
  "assessmentRecommendations": [
    "Test understanding with photosynthesis diagram labeling",
    "Create a concept map of the process"
  ],
  "motivationalElements": {
    "encouragement": "You're asking excellent questions about biology!",
    "progressUpdate": "You've mastered 3 out of 5 key concepts in plant biology",
    "nextMilestone": "Complete photosynthesis unit to unlock cellular respiration"
  },
  "metadata": {
    "responseTime": 1.2,
    "tokensUsed": 450,
    "confidenceScore": 0.92
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Invalid learning context provided",
  "details": "courseId is required when tutorMode is 'student'",
  "code": "VALIDATION_ERROR"
}
```

### 2. Assessment Generator

Creates intelligent assessments based on learning objectives and content.

#### Endpoint
```
POST /api/sam/assessment-generator
```

#### Request Body
```json
{
  "topic": "Photosynthesis",
  "difficulty": "intermediate",
  "questionTypes": ["multiple_choice", "true_false", "fill_blank", "essay"],
  "numberOfQuestions": 10,
  "learningObjectives": [
    "Identify the reactants and products of photosynthesis",
    "Explain the role of chlorophyll in photosynthesis",
    "Describe the light-dependent and light-independent reactions"
  ],
  "timeLimit": 30,
  "adaptiveSettings": {
    "adjustDifficulty": true,
    "provideFeedback": true,
    "allowRetries": true
  },
  "questionDistribution": {
    "multiple_choice": 5,
    "true_false": 2,
    "fill_blank": 2,
    "essay": 1
  }
}
```

#### Response
```json
{
  "success": true,
  "assessment": {
    "id": "assessment-456",
    "title": "Photosynthesis Assessment",
    "description": "Test your understanding of photosynthesis processes",
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "Which of the following is the correct equation for photosynthesis?",
        "options": [
          "6CO2 + 6H2O + light energy → C6H12O6 + 6O2",
          "C6H12O6 + 6O2 → 6CO2 + 6H2O + ATP",
          "6CO2 + 6O2 → C6H12O6 + 6H2O",
          "C6H12O6 + light energy → 6CO2 + 6H2O"
        ],
        "correctAnswer": 0,
        "explanation": "Photosynthesis converts carbon dioxide and water into glucose and oxygen using light energy.",
        "difficulty": "intermediate",
        "points": 2,
        "tags": ["equation", "reactants", "products"]
      },
      {
        "id": "q2",
        "type": "true_false",
        "question": "Chlorophyll is found in the mitochondria of plant cells.",
        "correctAnswer": false,
        "explanation": "Chlorophyll is found in chloroplasts, not mitochondria.",
        "difficulty": "beginner",
        "points": 1,
        "tags": ["chlorophyll", "cell_structure"]
      },
      {
        "id": "q3",
        "type": "fill_blank",
        "question": "The light-dependent reactions occur in the _____ of the chloroplast.",
        "correctAnswer": "thylakoid",
        "alternateAnswers": ["thylakoids", "grana"],
        "explanation": "Light-dependent reactions take place in the thylakoid membranes.",
        "difficulty": "intermediate",
        "points": 2,
        "tags": ["light_reactions", "chloroplast_structure"]
      },
      {
        "id": "q4",
        "type": "essay",
        "question": "Compare and contrast the light-dependent and light-independent reactions of photosynthesis.",
        "rubric": {
          "criteria": [
            "Identifies key differences between reactions",
            "Explains where each reaction occurs",
            "Describes the inputs and outputs of each reaction",
            "Uses appropriate scientific terminology"
          ],
          "maxPoints": 10
        },
        "difficulty": "advanced",
        "points": 10,
        "tags": ["light_reactions", "calvin_cycle", "comparison"]
      }
    ],
    "metadata": {
      "totalQuestions": 4,
      "totalPoints": 15,
      "estimatedTime": 30,
      "difficultyDistribution": {
        "beginner": 1,
        "intermediate": 2,
        "advanced": 1
      }
    }
  }
}
```

### 3. Teacher Insights

Provides analytics and insights for educators.

#### Endpoint
```
GET /api/sam/ai-tutor/teacher-insights
```

#### Query Parameters
- `courseId` (required): Course identifier
- `metric` (optional): `overview|engagement|performance|at_risk|learning_patterns|content_effectiveness`
- `timeframe` (optional): `7_days|30_days|90_days|all_time`
- `studentIds` (optional): Comma-separated list of student IDs

#### Example Request
```
GET /api/sam/ai-tutor/teacher-insights?courseId=course-123&metric=overview&timeframe=30_days
```

#### Response
```json
{
  "success": true,
  "insights": {
    "summary": "Your students are showing strong engagement with the current biology unit. Average performance has improved 15% over the last 30 days.",
    "recommendations": [
      "Consider introducing more challenging material for the top 20% of students",
      "Provide additional support for 5 students showing declining performance",
      "The photosynthesis unit is performing well - consider expanding similar interactive content"
    ],
    "metrics": {
      "totalStudents": 28,
      "averageScore": 82.5,
      "engagementRate": 87.3,
      "completionRate": 91.2,
      "strugglingStudents": [
        {
          "id": "student-789",
          "name": "John Doe",
          "currentScore": 65,
          "riskLevel": "medium",
          "issues": ["concept_understanding", "time_management"]
        }
      ],
      "topPerformers": [
        {
          "id": "student-101",
          "name": "Jane Smith",
          "currentScore": 96,
          "strengths": ["analytical_thinking", "consistent_engagement"]
        }
      ]
    },
    "trends": {
      "performanceChange": 15.2,
      "engagementChange": 8.7,
      "completionChange": 12.1
    },
    "alerts": [
      {
        "type": "warning",
        "message": "5 students haven't accessed the course in the last 7 days",
        "action": "Send reminder notifications or check in with these students",
        "priority": "high"
      },
      {
        "type": "info",
        "message": "New assessment results available for review",
        "action": "Review assessment performance data",
        "priority": "medium"
      }
    ]
  }
}
```

### 4. Lesson Planner

Generates AI-powered lesson plans for educators.

#### Endpoint
```
POST /api/sam/ai-tutor/lesson-planner
```

#### Request Body
```json
{
  "planType": "detailed_lesson",
  "subject": "Biology",
  "topic": "Photosynthesis",
  "duration": 90,
  "studentLevel": "high_school",
  "learningObjectives": [
    "Students will be able to explain the process of photosynthesis",
    "Students will identify the reactants and products of photosynthesis",
    "Students will understand the role of chloroplasts in photosynthesis"
  ],
  "constraints": [
    "Limited lab equipment",
    "90-minute block schedule",
    "Mixed ability levels"
  ],
  "teachingStyle": "interactive",
  "classSize": 25,
  "resources": [
    "Microscopes",
    "Plant samples",
    "Whiteboard",
    "Projector"
  ],
  "assessmentPreferences": {
    "formative": true,
    "summative": true,
    "peer_assessment": false
  }
}
```

#### Response
```json
{
  "success": true,
  "lessonPlan": {
    "id": "lesson-plan-789",
    "title": "Understanding Photosynthesis: From Sunlight to Sugar",
    "subject": "Biology",
    "topic": "Photosynthesis",
    "duration": 90,
    "learningObjectives": [
      "Students will be able to explain the process of photosynthesis",
      "Students will identify the reactants and products of photosynthesis",
      "Students will understand the role of chloroplasts in photosynthesis"
    ],
    "structure": {
      "opening": {
        "duration": 15,
        "activities": [
          {
            "name": "Hook Activity",
            "description": "Show students a wilted plant and a healthy plant. Ask them to hypothesize what the difference is.",
            "materials": ["Two plants", "Water"],
            "time": 5
          },
          {
            "name": "Learning Objectives Review",
            "description": "Present the day's learning objectives and connect to previous lessons.",
            "materials": ["Projector", "Slides"],
            "time": 5
          },
          {
            "name": "Prior Knowledge Assessment",
            "description": "Quick poll: What do plants need to survive?",
            "materials": ["Polling system or raised hands"],
            "time": 5
          }
        ]
      },
      "main_content": {
        "duration": 60,
        "activities": [
          {
            "name": "Photosynthesis Equation Introduction",
            "description": "Introduce the chemical equation for photosynthesis using visual aids.",
            "materials": ["Whiteboard", "Colored markers"],
            "time": 15,
            "differentiation": "Visual learners: Use diagrams; Kinesthetic learners: Act out the equation"
          },
          {
            "name": "Chloroplast Investigation",
            "description": "Students observe leaf cells under microscopes to identify chloroplasts.",
            "materials": ["Microscopes", "Leaf samples", "Slides"],
            "time": 25,
            "assessment": "Formative assessment through observation and questioning"
          },
          {
            "name": "Light and Dark Reactions Explanation",
            "description": "Interactive presentation on light-dependent and light-independent reactions.",
            "materials": ["Projector", "Interactive slides"],
            "time": 20,
            "differentiation": "Advanced students: Additional enzyme pathway details"
          }
        ]
      },
      "closing": {
        "duration": 15,
        "activities": [
          {
            "name": "Exit Ticket",
            "description": "Students complete a quick assessment on key concepts learned.",
            "materials": ["Exit tickets", "Pencils"],
            "time": 10,
            "assessment": "Summative assessment of lesson objectives"
          },
          {
            "name": "Preview Next Lesson",
            "description": "Brief preview of cellular respiration and how it relates to photosynthesis.",
            "materials": ["Slides"],
            "time": 5
          }
        ]
      }
    },
    "assessments": [
      {
        "type": "formative",
        "name": "Microscope Observation Checklist",
        "description": "Students check off chloroplasts they observe",
        "timing": "during_activity"
      },
      {
        "type": "summative",
        "name": "Exit Ticket Quiz",
        "description": "5 multiple choice questions on photosynthesis basics",
        "timing": "end_of_lesson"
      }
    ],
    "materials": [
      "Microscopes (25)",
      "Leaf samples (various types)",
      "Slides and coverslips",
      "Projector and screen",
      "Whiteboard and markers",
      "Exit tickets (printed)",
      "Two plants (healthy and wilted)"
    ],
    "differentiation": {
      "advanced_learners": "Additional enzyme pathway information, research extension activity",
      "struggling_learners": "Simplified vocabulary, peer partnerships, visual aids",
      "english_learners": "Vocabulary support, visual representations, translated materials"
    },
    "homework": "Read textbook chapter 8, complete vocabulary worksheet",
    "extension_activities": [
      "Research different types of photosynthesis (C3, C4, CAM)",
      "Design an experiment to test factors affecting photosynthesis rate"
    ]
  }
}
```

### 5. Gamification APIs

#### Achievements

##### Get User Achievements
```
GET /api/sam/ai-tutor/achievements
```

**Response:**
```json
{
  "success": true,
  "achievements": [
    {
      "id": "achievement-123",
      "title": "Biology Explorer",
      "description": "Complete 10 biology lessons",
      "icon": "🧬",
      "category": "learning",
      "earned": true,
      "earnedDate": "2024-07-15T10:30:00Z",
      "points": 50,
      "rarity": "common",
      "progress": {
        "current": 10,
        "target": 10
      }
    }
  ]
}
```

##### Unlock Achievement
```
POST /api/sam/ai-tutor/achievements
```

**Request Body:**
```json
{
  "action": "unlock_achievement",
  "achievementId": "achievement-123",
  "studentId": "student-456"
}
```

#### Leaderboard

##### Get Leaderboard
```
GET /api/sam/ai-tutor/leaderboard
```

**Query Parameters:**
- `timeframe`: `daily|weekly|monthly|all_time`
- `category`: `points|achievements|streak|course_completion`
- `limit`: number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user-123",
      "name": "Jane Smith",
      "points": 1250,
      "achievements": 15,
      "streak": 7,
      "avatar": "https://example.com/avatar.jpg"
    }
  ],
  "userRank": {
    "rank": 5,
    "points": 850,
    "achievements": 8,
    "streak": 3
  }
}
```

#### Challenges

##### Get Active Challenges
```
GET /api/sam/ai-tutor/challenges
```

**Response:**
```json
{
  "success": true,
  "challenges": [
    {
      "id": "challenge-789",
      "title": "Biology Week Challenge",
      "description": "Complete 5 biology lessons this week",
      "category": "learning",
      "difficulty": "medium",
      "startDate": "2024-07-15T00:00:00Z",
      "endDate": "2024-07-21T23:59:59Z",
      "rewards": {
        "points": 100,
        "achievement": "Weekly Warrior",
        "badge": "🏆"
      },
      "progress": {
        "current": 3,
        "target": 5
      },
      "participants": 156,
      "status": "active"
    }
  ]
}
```

##### Join Challenge
```
POST /api/sam/ai-tutor/challenges
```

**Request Body:**
```json
{
  "action": "join_challenge",
  "challengeId": "challenge-789"
}
```

### 6. Motivation Engine

Provides personalized motivation and encouragement.

#### Endpoint
```
POST /api/sam/ai-tutor/motivation-engine
```

#### Request Body
```json
{
  "motivationType": "encouragement",
  "learningContext": {
    "courseId": "course-123",
    "recentPerformance": "declining",
    "strugglingAreas": ["photosynthesis", "cellular_respiration"],
    "strengths": ["genetics", "evolution"]
  },
  "userState": {
    "consecutiveDays": 3,
    "recentScore": 72,
    "streakBroken": false,
    "timeOfDay": "morning"
  },
  "personalityProfile": {
    "learningStyle": "visual",
    "motivationFactors": ["achievement", "progress"],
    "communicationStyle": "encouraging",
    "preferredTone": "friendly"
  }
}
```

#### Response
```json
{
  "success": true,
  "motivation": {
    "message": "I notice you're working hard on biology! Your genetics scores show real strength. Let's build on that success and tackle photosynthesis with the same confidence. You've got this! 🌱",
    "type": "encouragement",
    "tone": "friendly",
    "elements": {
      "acknowledgment": "recognizes effort in biology",
      "strength_highlight": "excellence in genetics",
      "challenge_reframe": "frames photosynthesis as achievable",
      "confidence_boost": "affirms capability"
    },
    "suggested_actions": [
      "Review the photosynthesis visual diagram",
      "Try the interactive photosynthesis simulation",
      "Connect photosynthesis concepts to genetics knowledge"
    ],
    "follow_up": {
      "timing": "after_next_lesson",
      "type": "progress_check"
    }
  }
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message description",
  "details": "Additional error details",
  "code": "ERROR_CODE",
  "timestamp": "2024-07-18T10:30:00Z"
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid request parameters | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT` | Too many requests | 429 |
| `AI_SERVICE_ERROR` | AI service unavailable | 503 |
| `INTERNAL_ERROR` | Server error | 500 |

## Rate Limiting

- **Standard endpoints**: 100 requests per minute per user
- **AI endpoints**: 30 requests per minute per user
- **Assessment generation**: 10 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1627123456
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// SAM AI Tutor SDK
class SAMTutorAPI {
  private baseURL: string;
  private sessionToken: string;

  constructor(baseURL: string, sessionToken: string) {
    this.baseURL = baseURL;
    this.sessionToken = sessionToken;
  }

  async sendMessage(message: string, context: any) {
    const response = await fetch(`${this.baseURL}/enhanced-universal-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sessionToken}`
      },
      body: JSON.stringify({
        message,
        learningContext: context,
        tutorMode: 'student',
        tutorType: 'socratic'
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async generateAssessment(topic: string, difficulty: string) {
    const response = await fetch(`${this.baseURL}/assessment-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sessionToken}`
      },
      body: JSON.stringify({
        topic,
        difficulty,
        questionTypes: ['multiple_choice', 'true_false'],
        numberOfQuestions: 10
      })
    });

    return response.json();
  }

  async getTeacherInsights(courseId: string, metric: string = 'overview') {
    const response = await fetch(
      `${this.baseURL}/ai-tutor/teacher-insights?courseId=${courseId}&metric=${metric}`,
      {
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`
        }
      }
    );

    return response.json();
  }
}

// Usage
const sam = new SAMTutorAPI('https://api.example.com/sam', 'your-session-token');

// Send a message
const response = await sam.sendMessage('Explain photosynthesis', {
  courseId: 'bio-101',
  subject: 'Biology',
  currentTopic: 'Plant Biology'
});

// Generate assessment
const assessment = await sam.generateAssessment('Photosynthesis', 'intermediate');

// Get teacher insights
const insights = await sam.getTeacherInsights('bio-101', 'engagement');
```

### Python

```python
import requests
import json

class SAMTutorAPI:
    def __init__(self, base_url: str, session_token: str):
        self.base_url = base_url
        self.session_token = session_token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {session_token}'
        }
    
    def send_message(self, message: str, context: dict) -> dict:
        """Send a message to the SAM AI Tutor"""
        payload = {
            'message': message,
            'learningContext': context,
            'tutorMode': 'student',
            'tutorType': 'socratic'
        }
        
        response = requests.post(
            f'{self.base_url}/enhanced-universal-assistant',
            headers=self.headers,
            json=payload
        )
        
        response.raise_for_status()
        return response.json()
    
    def generate_assessment(self, topic: str, difficulty: str) -> dict:
        """Generate an assessment for a given topic"""
        payload = {
            'topic': topic,
            'difficulty': difficulty,
            'questionTypes': ['multiple_choice', 'true_false'],
            'numberOfQuestions': 10
        }
        
        response = requests.post(
            f'{self.base_url}/assessment-generator',
            headers=self.headers,
            json=payload
        )
        
        response.raise_for_status()
        return response.json()
    
    def get_teacher_insights(self, course_id: str, metric: str = 'overview') -> dict:
        """Get teacher insights for a course"""
        response = requests.get(
            f'{self.base_url}/ai-tutor/teacher-insights',
            headers=self.headers,
            params={'courseId': course_id, 'metric': metric}
        )
        
        response.raise_for_status()
        return response.json()

# Usage
sam = SAMTutorAPI('https://api.example.com/sam', 'your-session-token')

# Send a message
response = sam.send_message('Explain photosynthesis', {
    'courseId': 'bio-101',
    'subject': 'Biology',
    'currentTopic': 'Plant Biology'
})

# Generate assessment
assessment = sam.generate_assessment('Photosynthesis', 'intermediate')

# Get teacher insights
insights = sam.get_teacher_insights('bio-101', 'engagement')
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SAMTutorAPI } from './sam-tutor-api';

describe('SAM Tutor API', () => {
  const mockAPI = new SAMTutorAPI('http://localhost:3000/api/sam', 'test-token');

  it('should send message successfully', async () => {
    const mockResponse = {
      success: true,
      response: 'Test response',
      suggestions: ['suggestion1', 'suggestion2']
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await mockAPI.sendMessage('Test message', {
      courseId: 'test-course'
    });

    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' })
    });

    await expect(mockAPI.sendMessage('Test', {})).rejects.toThrow('API Error: 400');
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '../pages/api/sam/enhanced-universal-assistant';

describe('/api/sam/enhanced-universal-assistant', () => {
  it('should return valid response', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          body: JSON.stringify({
            message: 'Test message',
            learningContext: { courseId: 'test' },
            tutorMode: 'student'
          })
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.response).toBeDefined();
      }
    });
  });
});
```

---

*Last updated: July 2025*
*Version: 1.0.0*
*API Version: v1*