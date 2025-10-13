# SAM AI Tutor - API Routes Documentation

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Purpose**: API endpoint documentation and usage patterns

---

## 🎯 Overview

SAM AI Tutor exposes 80+ RESTful API endpoints organized by feature domain. All endpoints follow consistent patterns for authentication, error handling, and response format.

**Base URL**: `/api/sam/`

**API Version**: v1 (implicit)

---

## 📋 Standard API Patterns

### Request Format

**Headers**:
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <session-token>', // From NextAuth
  'X-Request-ID': '<unique-id>', // Optional, for tracking
}
```

**Body** (POST/PUT/PATCH):
```typescript
{
  // Request-specific fields
  // Always validated with Zod schemas
}
```

### Response Format

**Success Response**:
```typescript
{
  success: true,
  data: T, // Type varies by endpoint
  metadata: {
    timestamp: string; // ISO 8601
    requestId: string;
    version: string;
  }
}
```

**Error Response**:
```typescript
{
  success: false,
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: Record<string, unknown>; // Additional error context
  }
}
```

### Status Codes

- **200 OK**: Successful GET/PUT/PATCH
- **201 Created**: Successful POST with resource creation
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn&apos;t exist
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

---

## 🧠 Core AI Tutor Endpoints

### 1. Chat with SAM

**Endpoint**: `POST /api/sam/ai-tutor/chat`

**Purpose**: Real-time conversational tutoring

**Request**:
```typescript
{
  message: string; // User message (max 2000 chars)
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    problemContext?: string; // Code snippet, math problem, etc.
  };
  conversationId?: string; // For continuing conversations
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    message: string; // SAM's response
    conversationId: string; // For follow-up messages
    suggestions: string[]; // Follow-up questions/actions
    relatedContent: {
      sectionId: string;
      title: string;
      relevance: number; // 0-1
    }[];
    emotionalTone: 'encouraging' | 'neutral' | 'corrective';
  }
}
```

**Example**:
```bash
curl -X POST https://taxomind.com/api/sam/ai-tutor/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "message": "Can you explain how React hooks work?",
    "context": {
      "courseId": "react-fundamentals",
      "sectionId": "hooks-intro"
    }
  }'
```

**Rate Limit**: 30 requests/minute per user

---

### 2. Intelligent Course Creation

**Endpoint**: `POST /api/sam/ai-tutor/create-course`

**Purpose**: Generate complete course with AI assistance

**Request**:
```typescript
{
  topic: string; // Course topic
  targetAudience: string; // "beginners", "professionals", etc.
  duration: number; // Expected duration in weeks
  learningObjectives: string[];
  style?: 'academic' | 'practical' | 'conversational';
  includeAssessments?: boolean;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    courseOutline: {
      title: string;
      description: string;
      chapters: {
        title: string;
        sections: {
          title: string;
          content: string;
          estimatedTime: number; // minutes
        }[];
      }[];
    };
    assessments: Assessment[];
    estimatedTotalTime: number; // hours
  }
}
```

**Processing Time**: 30-60 seconds for complete course

**Rate Limit**: 5 requests/hour per user

---

### 3. Adaptive Question Generation

**Endpoint**: `POST /api/sam/ai-tutor/generate-questions`

**Purpose**: Generate adaptive questions for current learning content

**Request**:
```typescript
{
  sectionId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number; // Number of questions (default: 5)
  questionTypes?: ('multiple-choice' | 'short-answer' | 'true-false')[];
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    questions: {
      id: string;
      type: 'multiple-choice' | 'short-answer' | 'true-false';
      question: string;
      options?: string[]; // For multiple-choice
      correctAnswer: string;
      explanation: string;
      difficulty: string;
      bloomsLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
    }[];
  }
}
```

**Rate Limit**: 10 requests/minute per user

---

## 📊 Educational Analysis Endpoints

### 4. Bloom&apos;s Taxonomy Analysis

**Endpoint**: `POST /api/sam/blooms-analysis`

**Purpose**: Analyze content for cognitive depth

**Request**:
```typescript
{
  entityType: 'course' | 'chapter' | 'section';
  entityId: string;
  options?: {
    includeRecommendations?: boolean;
    forceRefresh?: boolean; // Bypass cache
  };
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    distribution: {
      REMEMBER: number; // Percentage (0-100)
      UNDERSTAND: number;
      APPLY: number;
      ANALYZE: number;
      EVALUATE: number;
      CREATE: number;
    };
    cognitiveDepth: number; // Score 0-100
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    recommendations?: {
      type: 'add-higher-level' | 'balance-distribution' | 'add-practical';
      description: string;
      impact: 'high' | 'medium' | 'low';
    }[];
  }
}
```

**Processing Time**: 5-15 seconds (cached after first run)

**Cache TTL**: 15 minutes

---

### 5. Content Quality Assessment

**Endpoint**: `POST /api/sam/content-quality`

**Purpose**: Assess educational content quality

**Request**:
```typescript
{
  contentId: string;
  contentType: 'course' | 'chapter' | 'section';
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    overallScore: number; // 0-100
    dimensions: {
      clarity: number; // 0-100
      accuracy: number;
      engagement: number;
      accessibility: number;
      completeness: number;
    };
    issues: {
      severity: 'critical' | 'warning' | 'suggestion';
      message: string;
      location?: string; // Section/paragraph reference
    }[];
    suggestions: string[];
  }
}
```

---

## 👤 Personalization Endpoints

### 6. Learning Style Detection

**Endpoint**: `GET /api/sam/personalization/learning-style`

**Purpose**: Get or detect student&apos;s learning style

**Query Parameters**:
```typescript
{
  userId?: string; // Defaults to current user
  forceRefresh?: boolean; // Re-analyze instead of using cache
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    primaryStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';
    secondaryStyle?: string;
    styleStrengths: {
      visual: number; // 0-1
      auditory: number;
      kinesthetic: number;
      readingWriting: number;
    };
    confidence: number; // 0-1
    evidenceFactors: string[];
    lastUpdated: string; // ISO 8601
  }
}
```

---

### 7. Personalized Learning Path

**Endpoint**: `POST /api/sam/personalization/learning-path`

**Purpose**: Generate personalized learning path for student

**Request**:
```typescript
{
  courseId: string;
  userId?: string; // Defaults to current user
  options?: {
    pace?: 'fast' | 'medium' | 'slow';
    includeAlternatives?: boolean;
  };
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    path: {
      objectives: string[];
      nodes: {
        type: 'content' | 'assessment' | 'project' | 'break';
        id: string;
        title: string;
        estimatedTime: number; // minutes
        difficulty: string;
      }[];
      estimatedDuration: number; // total hours
    };
    alternatives?: {
      fastTrack: LearningPath;
      thorough: LearningPath;
    };
  }
}
```

---

### 8. Cognitive Load Assessment

**Endpoint**: `POST /api/sam/personalization/cognitive-load`

**Purpose**: Assess if content matches student&apos;s cognitive capacity

**Request**:
```typescript
{
  sectionId: string;
  userId?: string;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    contentLoad: number; // 0-100
    studentCapacity: number; // 0-100
    loadStatus: 'underload' | 'optimal' | 'overload';
    recommendations: {
      action: 'simplify' | 'enrich' | 'maintain';
      suggestions: string[];
    };
  }
}
```

---

### 9. Emotional State Recognition

**Endpoint**: `GET /api/sam/personalization/emotional-state`

**Purpose**: Infer student&apos;s current emotional state

**Query Parameters**:
```typescript
{
  userId?: string;
  lookbackHours?: number; // Default: 24
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    currentEmotion: 'motivated' | 'frustrated' | 'confused' | 'confident' | 'anxious' | 'neutral';
    confidence: number; // 0-1
    indicators: {
      responseTime: 'fast' | 'normal' | 'slow';
      errorRate: 'low' | 'normal' | 'high';
      helpSeeking: 'rare' | 'normal' | 'frequent';
    };
    trend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  }
}
```

---

## 📈 Analytics Endpoints

### 10. Student Analytics

**Endpoint**: `GET /api/sam/analytics/student`

**Purpose**: Get comprehensive student analytics

**Query Parameters**:
```typescript
{
  userId?: string; // Defaults to current user
  timeRange?: 'day' | 'week' | 'month' | 'all';
  metrics?: ('engagement' | 'performance' | 'progress' | 'velocity')[];
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    engagement: {
      sessionCount: number;
      averageSessionDuration: number; // minutes
      totalTimeSpent: number; // hours
      engagementScore: number; // 0-100
    };
    performance: {
      averageScore: number; // 0-100
      completionRate: number; // 0-1
      assessmentsPassed: number;
      assessmentsFailed: number;
    };
    progress: {
      coursesInProgress: number;
      coursesCompleted: number;
      sectionsCompleted: number;
      percentageComplete: number; // 0-100
    };
    velocity: {
      sectionsPerWeek: number;
      averageTimePerSection: number; // minutes
      projectedCompletionDate: string; // ISO 8601
    };
  }
}
```

---

### 11. Course Analytics

**Endpoint**: `GET /api/sam/analytics/course`

**Purpose**: Get course-level analytics

**Query Parameters**:
```typescript
{
  courseId: string;
  timeRange?: 'day' | 'week' | 'month' | 'all';
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    enrollmentStats: {
      totalEnrollments: number;
      activeStudents: number;
      completionRate: number; // 0-1
      averageCompletionTime: number; // days
    };
    engagementStats: {
      averageSessionDuration: number;
      averageProgress: number; // 0-100
      dropOffPoints: {
        sectionId: string;
        sectionTitle: string;
        dropOffRate: number; // 0-1
      }[];
    };
    performanceStats: {
      averageScore: number; // 0-100
      passRate: number; // 0-1
      strugglingStudents: number;
    };
  }
}
```

---

### 12. Instructor Dashboard

**Endpoint**: `GET /api/sam/analytics/instructor-dashboard`

**Purpose**: Comprehensive instructor analytics dashboard

**Query Parameters**:
```typescript
{
  instructorId?: string; // Defaults to current user
  timeRange?: 'week' | 'month' | 'quarter';
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    courses: {
      totalCourses: number;
      totalStudents: number;
      averageRating: number; // 0-5
    };
    studentInsights: {
      atRiskStudents: {
        userId: string;
        name: string;
        riskLevel: 'high' | 'medium';
        reason: string;
      }[];
      topPerformers: {
        userId: string;
        name: string;
        score: number;
      }[];
    };
    contentPerformance: {
      mostEngaging: Section[];
      needsImprovement: Section[];
    };
  }
}
```

---

## 🎯 Predictive Endpoints

### 13. Completion Prediction

**Endpoint**: `POST /api/sam/predictive/completion`

**Purpose**: Predict course completion likelihood

**Request**:
```typescript
{
  courseId: string;
  userId?: string;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    completionLikelihood: number; // 0-1
    estimatedCompletionDate: string; // ISO 8601
    confidence: number; // 0-1
    riskFactors: {
      factor: string;
      impact: 'high' | 'medium' | 'low';
    }[];
    recommendations: {
      type: 'pacing' | 'content' | 'support';
      action: string;
    }[];
  }
}
```

---

### 14. At-Risk Student Detection

**Endpoint**: `GET /api/sam/predictive/at-risk-students`

**Purpose**: Identify students at risk of dropping out

**Query Parameters**:
```typescript
{
  courseId?: string; // Specific course or all courses
  riskThreshold?: 'medium' | 'high'; // Minimum risk level
  limit?: number; // Max results (default: 50)
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    atRiskStudents: {
      userId: string;
      name: string;
      courseId: string;
      riskLevel: 'medium' | 'high' | 'critical';
      riskScore: number; // 0-100
      primaryRiskFactors: string[];
      recommendedInterventions: {
        type: string;
        description: string;
        urgency: 'immediate' | 'soon' | 'monitor';
      }[];
      lastActive: string; // ISO 8601
    }[];
  }
}
```

---

## 🏆 Achievement Endpoints

### 15. Award Points

**Endpoint**: `POST /api/sam/achievements/award-points`

**Purpose**: Award points to student for activity

**Request**:
```typescript
{
  userId?: string; // Defaults to current user
  points: number;
  reason: string;
  activityType: 'content-completion' | 'assessment' | 'social' | 'streak';
  metadata?: Record<string, unknown>;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    newBalance: number;
    pointsAwarded: number;
    multiplier: number; // If streak active
    achievements: {
      badgeId: string;
      badgeName: string;
      description: string;
      rarity: string;
    }[]; // Newly unlocked badges
  }
}
```

---

### 16. Get Badges

**Endpoint**: `GET /api/sam/achievements/badges`

**Purpose**: Get user&apos;s badges or available badges

**Query Parameters**:
```typescript
{
  userId?: string;
  filter?: 'earned' | 'available' | 'all';
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    earned: Badge[];
    available: Badge[];
    progress: {
      badgeId: string;
      completionPercentage: number; // 0-100
      remaining: string; // Description of what&apos;s left
    }[];
  }
}
```

---

### 17. Leaderboard

**Endpoint**: `GET /api/sam/achievements/leaderboard`

**Purpose**: Get leaderboard rankings

**Query Parameters**:
```typescript
{
  type: 'global' | 'course' | 'weekly';
  courseId?: string; // Required if type is 'course'
  limit?: number; // Default: 100
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    leaderboard: {
      rank: number;
      userId: string;
      name: string;
      points: number;
      badges: number;
      streak: number;
    }[];
    currentUserRank: number;
  }
}
```

---

## 🎨 Content Generation Endpoints

### 18. Generate Chapter

**Endpoint**: `POST /api/sam/generation/chapter`

**Purpose**: Generate chapter content with AI

**Request**:
```typescript
{
  courseId: string;
  chapterTitle: string;
  chapterDescription?: string;
  sectionCount?: number; // Default: 3-5
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    chapter: {
      title: string;
      description: string;
      sections: {
        title: string;
        content: string;
        learningObjectives: string[];
        estimatedTime: number; // minutes
      }[];
    };
  }
}
```

**Processing Time**: 20-40 seconds

---

### 19. Generate Assessment

**Endpoint**: `POST /api/sam/generation/assessment`

**Purpose**: Generate assessment questions for content

**Request**:
```typescript
{
  sectionId: string;
  questionCount: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionTypes?: ('multiple-choice' | 'short-answer' | 'true-false')[];
  bloomsLevels?: ('REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE')[];
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    questions: Question[];
    metadata: {
      avgDifficulty: string;
      bloomsDistribution: Record<string, number>;
    };
  }
}
```

---

## 🔍 Search & Discovery Endpoints

### 20. Semantic Search

**Endpoint**: `POST /api/sam/search/semantic`

**Purpose**: Search content by meaning, not just keywords

**Request**:
```typescript
{
  query: string;
  scope?: {
    courseId?: string;
    chapterId?: string;
  };
  limit?: number; // Default: 10
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    results: {
      type: 'section' | 'chapter' | 'resource';
      id: string;
      title: string;
      excerpt: string;
      relevanceScore: number; // 0-1
      path: string; // Breadcrumb path
    }[];
  }
}
```

---

### 21. Resource Recommendations

**Endpoint**: `GET /api/sam/resources/recommendations`

**Purpose**: Get personalized resource recommendations

**Query Parameters**:
```typescript
{
  sectionId?: string;
  topic?: string;
  learningStyle?: string;
  limit?: number;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    recommendations: {
      resourceId: string;
      title: string;
      type: 'video' | 'article' | 'tutorial' | 'documentation';
      url: string;
      relevanceScore: number; // 0-1
      matchReason: string;
      estimatedTime: number; // minutes
    }[];
  }
}
```

---

## 🤝 Collaboration Endpoints

### 22. Study Group Recommendations

**Endpoint**: `GET /api/sam/collaboration/study-groups`

**Purpose**: Find or create study groups

**Query Parameters**:
```typescript
{
  courseId?: string;
  action: 'find' | 'recommend';
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    groups: {
      groupId: string;
      name: string;
      memberCount: number;
      courseId: string;
      schedule: string;
      compatibilityScore: number; // 0-1, if action is 'recommend'
    }[];
  }
}
```

---

### 23. Peer Matching

**Endpoint**: `POST /api/sam/collaboration/peer-match`

**Purpose**: Find study partners or mentors

**Request**:
```typescript
{
  matchType: 'study-partner' | 'tutor' | 'mentor';
  courseId?: string;
  criteria?: {
    skillLevel?: string;
    schedule?: string[];
    goals?: string[];
  };
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    matches: {
      userId: string;
      name: string;
      matchScore: number; // 0-1
      matchReasons: string[];
      availability: string[];
    }[];
  }
}
```

---

## 💼 Business Intelligence Endpoints

### 24. Pricing Optimization

**Endpoint**: `POST /api/sam/financial/pricing-optimization`

**Purpose**: Get pricing recommendations for course

**Request**:
```typescript
{
  courseId: string;
  targetMarket?: string;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    currentPrice: number;
    recommendedPrice: number;
    priceRange: {
      min: number;
      max: number;
    };
    competitorPrices: number[];
    marketAnalysis: {
      demand: 'low' | 'medium' | 'high';
      competition: 'low' | 'medium' | 'high';
    };
    reasoning: string[];
  }
}
```

---

### 25. Market Trends

**Endpoint**: `GET /api/sam/market/trends`

**Purpose**: Get market trends and opportunities

**Query Parameters**:
```typescript
{
  category?: string;
  timeRange?: 'month' | 'quarter' | 'year';
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    trendingTopics: {
      topic: string;
      growthRate: number; // Percentage
      demandScore: number; // 0-100
      competitionLevel: 'low' | 'medium' | 'high';
    }[];
    opportunities: {
      topic: string;
      description: string;
      potentialRevenue: number;
      difficulty: 'easy' | 'medium' | 'hard';
    }[];
  }
}
```

---

## 🔧 Administrative Endpoints

### 26. System Health

**Endpoint**: `GET /api/sam/admin/health`

**Purpose**: Get SAM system health status

**Authentication**: Admin only

**Response**:
```typescript
{
  success: true,
  data: {
    status: 'healthy' | 'degraded' | 'down';
    engines: {
      engineName: string;
      status: 'operational' | 'slow' | 'error';
      responseTime: number; // ms
      cacheHitRate: number; // 0-1
    }[];
    aiProviders: {
      name: string;
      status: 'operational' | 'slow' | 'error';
      quotaUsed: number; // 0-1
    }[];
  }
}
```

---

### 27. Cache Management

**Endpoint**: `POST /api/sam/admin/cache`

**Purpose**: Manage SAM caches

**Authentication**: Admin only

**Request**:
```typescript
{
  action: 'clear' | 'stats';
  scope?: 'all' | string; // Engine name or 'all'
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    action: string;
    itemsCleared?: number;
    stats?: {
      totalEntries: number;
      hitRate: number;
      missRate: number;
      avgResponseTime: number; // ms
    };
  }
}
```

---

## 🔐 Authentication & Rate Limiting

### Authentication

All SAM API endpoints (except public ones) require authentication:

1. User must be signed in via NextAuth.js
2. Session token passed in Authorization header or cookie
3. User role checked for admin endpoints

**Example Authentication**:
```typescript
// Automatic with Next.js API routes
const user = await currentUser();
if (!user) {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
    { status: 401 }
  );
}
```

### Rate Limiting

Rate limits vary by endpoint type:

- **Chat/Real-time**: 30 requests/minute
- **Analysis**: 10 requests/minute
- **Generation**: 5 requests/hour
- **Analytics**: 60 requests/minute
- **Standard CRUD**: 100 requests/minute

**Rate Limit Response**:
```typescript
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
    details: {
      limit: 30,
      remaining: 0,
      resetAt: '2025-01-12T10:45:00Z'
    }
  }
}
```

**Headers**:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1705057500
```

---

## 📖 Related Documentation

- [00-OVERVIEW.md](./00-OVERVIEW.md) - System overview
- [03-SPECIALIZED-ENGINES.md](./03-SPECIALIZED-ENGINES.md) - Engine details
- [07-WORKFLOWS.md](./07-WORKFLOWS.md) - Request workflows
- [09-NPM-PACKAGE-GUIDE.md](./09-NPM-PACKAGE-GUIDE.md) - Package preparation

---

**Next Document**: [05-COMPONENTS.md](./05-COMPONENTS.md) - React component documentation

**Maintained by**: Taxomind Development Team
**Status**: ✅ Active Development
