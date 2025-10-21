# SAM AI Tutor - System Workflows & Data Flow

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Purpose**: Abstract workflow descriptions for system understanding

---

## 📋 Table of Contents

1. [Core Workflow Patterns](#core-workflow-patterns)
2. [User Interaction Workflows](#user-interaction-workflows)
3. [Engine Operation Workflows](#engine-operation-workflows)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Integration Patterns](#integration-patterns)

---

## 🔄 Core Workflow Patterns

### 1. Request-Response Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    Standard SAM Request Cycle                    │
└─────────────────────────────────────────────────────────────────┘

User Action (Click/Type)
         │
         ▼
React Component
  ├─ Capture event
  ├─ Prepare request data
  └─ Call API endpoint
         │
         ▼
API Route Handler (/api/sam/*)
  ├─ Authenticate user
  ├─ Validate input (Zod schemas)
  ├─ Check rate limits
  └─ Route to appropriate engine
         │
         ▼
SAM Engine
  ├─ Check initialization
  ├─ Validate inputs
  ├─ Check cache (if applicable)
  ├─ Execute core logic
  │   ├─ Database queries
  │   ├─ AI API calls
  │   └─ Calculations
  ├─ Monitor performance
  ├─ Handle errors
  ├─ Update cache
  └─ Record interaction
         │
         ▼
Response Generation
  ├─ Format response
  ├─ Add metadata
  └─ Return JSON
         │
         ▼
API Route Handler
  ├─ Validate response
  └─ Send to client
         │
         ▼
React Component
  ├─ Update state
  ├─ Render UI
  └─ Show result to user
         │
         ▼
User sees result
```

### 2. Engine Initialization Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Engine Initialization Flow                    │
└─────────────────────────────────────────────────────────────────┘

First Engine Call
         │
         ▼
Check initialized flag
         │
         ├─ TRUE → Skip to operation
         │
         └─ FALSE
               │
               ▼
         Call performInitialization()
               │
               ├─ Load configuration
               ├─ Establish connections
               ├─ Warm up AI models
               └─ Prepare caches
               │
               ▼
         Mark initialized = true
               │
               ▼
         Proceed with operation
```

### 3. Caching Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Caching Strategy Flow                       │
└─────────────────────────────────────────────────────────────────┘

Engine Operation Request
         │
         ▼
Generate cache key
  (based on inputs)
         │
         ▼
Check cache
         │
         ├─ HIT (and not expired)
         │    │
         │    ▼
         │  Return cached value
         │  (Fast path: < 10ms)
         │
         └─ MISS or Expired
              │
              ▼
         Execute operation
           (Slow path: 2-5s)
              │
              ▼
         Store in cache
           with TTL expiration
              │
              ▼
         Return fresh value
              │
              ▼
       (Optional) Cleanup
         expired entries
```

---

## 👤 User Interaction Workflows

### 1. Chat with SAM Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SAM Chat Interaction                        │
└─────────────────────────────────────────────────────────────────┘

User types message in chat
         │
         ▼
React chat component captures input
         │
         ▼
POST /api/sam/ai-tutor/chat
  {
    message: "How do I solve this problem?",
    context: {
      courseId, chapterId, sectionId,
      userHistory, currentContent
    }
  }
         │
         ▼
API Handler
  ├─ Authenticate user
  ├─ Load conversation history
  ├─ Gather context (current course, section, user profile)
  └─ Call multiple engines:
      │
      ├─ Contextual Intelligence Engine
      │   └─ Determines user intent
      │       └─ Identifies relevant context
      │
      ├─ Memory Engine
      │   └─ Retrieves past conversation
      │       └─ Identifies patterns
      │
      ├─ Personalization Engine
      │   └─ Gets user learning style
      │       └─ Checks emotional state
      │
      └─ Main AI Processing (Anthropic)
          └─ Constructs enhanced prompt:
              ├─ User message
              ├─ Conversation history
              ├─ Current content context
              ├─ User learning style
              ├─ Emotional state considerations
              └─ Educational standards
          │
          ▼
      AI generates response
          │
          ▼
  ├─ Analytics Engine records interaction
  ├─ Memory Engine stores message
  └─ Achievement Engine checks milestones
         │
         ▼
Response sent to client
  {
    message: "AI response...",
    suggestions: [...],
    relatedContent: [...],
    metadata: {
      confidence: 0.95,
      sources: [...]
    }
  }
         │
         ▼
Chat component renders response
  ├─ Display message
  ├─ Show suggestions
  └─ Update conversation history
```

### 2. Bloom's Taxonomy Analysis Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Bloom's Analysis Workflow                      │
└─────────────────────────────────────────────────────────────────┘

Instructor clicks "Analyze Course"
         │
         ▼
POST /api/sam/blooms-analysis
  { courseId: "course-123" }
         │
         ▼
API Handler
  ├─ Fetch course data from database
  │   ├─ Course metadata
  │   ├─ All chapters
  │   ├─ All sections
  │   └─ Learning objectives
  │
  └─ Call Bloom's Analysis Engine
         │
         ▼
Bloom's Engine
  ├─ Generate content hash
  ├─ Check cache (key: hash)
  │
  └─ Cache MISS → Perform analysis
         │
         ├─ For each chapter:
         │   └─ For each section:
         │       ├─ Extract content
         │       ├─ Send to Anthropic Claude
         │       │   with Bloom's taxonomy prompt
         │       ├─ Receive cognitive classification
         │       └─ Calculate percentages
         │
         ├─ Aggregate chapter results
         │
         ├─ Calculate course-level distribution:
         │   ├─ REMEMBER: 15%
         │   ├─ UNDERSTAND: 25%
         │   ├─ APPLY: 20%
         │   ├─ ANALYZE: 20%
         │   ├─ EVALUATE: 10%
         │   └─ CREATE: 10%
         │
         ├─ Determine cognitive depth score (65/100)
         │
         ├─ Classify balance (well-balanced)
         │
         ├─ Generate learning pathway:
         │   ├─ Current path (what student learned)
         │   ├─ Recommended path (optimal progression)
         │   └─ Gaps (missing cognitive skills)
         │
         ├─ Generate recommendations:
         │   ├─ Content adjustments
         │   ├─ Assessment changes
         │   └─ Activity suggestions
         │
         └─ Predict student impact:
             ├─ Skills developed
             ├─ Cognitive growth
             └─ Career alignment
         │
         ▼
  ├─ Store analysis in cache (TTL: 24h)
  ├─ Save analysis to database
  └─ Record interaction
         │
         ▼
Response sent to client
  {
    courseLevel: {
      distribution: {...},
      cognitiveDepth: 65,
      balance: "well-balanced"
    },
    chapterAnalysis: [...],
    learningPathway: {...},
    recommendations: {...},
    studentImpact: {...}
  }
         │
         ▼
UI renders analysis dashboard
  ├─ Distribution pie chart
  ├─ Cognitive depth gauge
  ├─ Chapter breakdown table
  ├─ Recommendations list
  └─ Action buttons
```

### 3. Personalized Learning Path Generation

```
┌─────────────────────────────────────────────────────────────────┐
│              Personalized Learning Path Creation                 │
└─────────────────────────────────────────────────────────────────┘

Student enrolls in course
         │
         ▼
System triggers personalization
         │
         ▼
POST /api/sam/personalization
  { userId, courseId }
         │
         ▼
Personalization Engine
         │
         ├─ Gather student data:
         │   ├─ Historical performance
         │   ├─ Content interactions
         │   ├─ Assessment results
         │   ├─ Session patterns
         │   └─ Device usage
         │
         ├─ Detect Learning Style
         │   ├─ Analyze interaction patterns
         │   │   └─ Video vs text preference
         │   ├─ Analyze assessment patterns
         │   │   └─ Visual vs verbal problems
         │   ├─ Analyze session patterns
         │   │   └─ Focus and engagement
         │   └─ Calculate style strengths
         │       ├─ Visual: 40%
         │       ├─ Auditory: 15%
         │       ├─ Kinesthetic: 25%
         │       ├─ Reading-Writing: 15%
         │       └─ Mixed: 5%
         │   │
         │   └─ Primary style: Visual
         │       Secondary: Kinesthetic
         │
         ├─ Recognize Emotional State
         │   ├─ Analyze recent interactions
         │   ├─ Extract emotion indicators:
         │   │   ├─ Response times
         │   │   ├─ Error patterns
         │   │   ├─ Help-seeking behavior
         │   │   └─ Progress velocity
         │   └─ Infer emotion: Confident
         │
         ├─ Analyze Motivation Patterns
         │   ├─ Intrinsic factors:
         │   │   └─ Mastery orientation: High
         │   ├─ Extrinsic factors:
         │   │   └─ Achievement recognition: Medium
         │   └─ Current level: 0.75
         │
         ├─ Assess Cognitive Capacity
         │   ├─ Review recent performance
         │   └─ Determine capacity ranges
         │
         ├─ Generate Personalized Path
         │   ├─ Define learning objectives
         │   ├─ Create learning nodes:
         │   │   ├─ Content nodes
         │   │   ├─ Assessment nodes
         │   │   ├─ Project nodes
         │   │   └─ Break nodes
         │   ├─ Determine optimal sequencing
         │   ├─ Calculate difficulty progression
         │   ├─ Estimate duration
         │   └─ Generate alternative paths
         │
         └─ Apply Content Adaptations
             ├─ Prioritize visual content
             ├─ Add interactive elements
             ├─ Adjust cognitive load
             └─ Provide motivational support
         │
         ▼
Response with personalized experience
  {
    learningStyle: {
      primary: "visual",
      confidence: 0.85
    },
    emotionalState: "confident",
    recommendations: [...],
    adaptations: [...],
    personalizedPath: {
      nodes: [...],
      estimatedDuration: 480 // minutes
    }
  }
         │
         ▼
System applies personalization
  ├─ Filter content by learning style
  ├─ Adjust presentation order
  ├─ Customize difficulty
  └─ Provide adapted materials
```

### 4. Content Generation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  AI Content Generation Flow                      │
└─────────────────────────────────────────────────────────────────┘

Instructor clicks "Generate Course"
         │
         ▼
SAM Course Creator Modal opens
         │
         ├─ User fills form:
         │   ├─ Course topic
         │   ├─ Difficulty level
         │   ├─ Target audience
         │   ├─ Learning objectives
         │   └─ Bloom's level focus
         │
         └─ Click "Generate"
         │
         ▼
POST /api/sam/generate-course-structure-complete
  {
    topic: "Machine Learning Basics",
    level: "intermediate",
    audience: "Software Engineers",
    objectives: [...]
  }
         │
         ▼
Generation Engine
         │
         ├─ Validate inputs
         │
         ├─ Construct AI prompt:
         │   ├─ Course topic and level
         │   ├─ Educational standards
         │   ├─ Bloom's taxonomy guidelines
         │   ├─ Industry best practices
         │   └─ Output format specifications
         │
         ├─ Call Anthropic Claude API
         │   └─ Request comprehensive course structure
         │
         ├─ Receive AI response (JSON):
         │   ├─ Course metadata
         │   ├─ Chapter outlines
         │   ├─ Section details
         │   ├─ Learning objectives
         │   └─ Assessment suggestions
         │
         ├─ Validate generated structure
         │
         ├─ Store in database:
         │   ├─ Create Course record
         │   ├─ Create Chapter records
         │   ├─ Create Section records
         │   └─ Link relationships
         │
         └─ Record generation interaction
         │
         ▼
Response with course structure
  {
    courseId: "generated-course-id",
    structure: {
      chapters: [
        {
          title: "...",
          sections: [...]
        }
      ]
    },
    metadata: {
      generationTime: 4500, // ms
      confidence: 0.92
    }
  }
         │
         ▼
Modal shows success
  ├─ Display course structure preview
  ├─ Option to edit before saving
  └─ Redirect to course page
```

---

## ⚙️ Engine Operation Workflows

### 1. Analytics Engine Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics Processing Flow                     │
└─────────────────────────────────────────────────────────────────┘

Continuous Background Process
         │
         ▼
Analytics Engine (Scheduled)
         │
         ├─ Collect interaction data:
         │   ├─ User sessions
         │   ├─ Content views
         │   ├─ Assessment submissions
         │   ├─ Chat interactions
         │   └─ Feature usage
         │
         ├─ Aggregate metrics:
         │   ├─ By time period (hourly, daily, weekly)
         │   ├─ By user segment
         │   ├─ By content type
         │   └─ By cognitive level
         │
         ├─ Calculate KPIs:
         │   ├─ Engagement rate
         │   ├─ Completion rate
         │   ├─ Average session duration
         │   ├─ Learning velocity
         │   └─ Retention rate
         │
         ├─ Detect patterns:
         │   ├─ Usage trends
         │   ├─ Performance correlations
         │   ├─ Anomalies
         │   └─ Opportunities
         │
         ├─ Generate insights:
         │   ├─ What's working well
         │   ├─ What needs improvement
         │   ├─ Student segments
         │   └─ Actionable recommendations
         │
         └─ Store analytics results
         │
         ▼
Dashboard displays insights
  ├─ Real-time metrics
  ├─ Trend charts
  ├─ Segment analysis
  └─ Recommendations
```

### 2. Predictive Engine Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Predictive Analysis Flow                      │
└─────────────────────────────────────────────────────────────────┘

Predictive Engine (Triggered)
         │
         ├─ TRIGGER 1: Student enrollment
         ├─ TRIGGER 2: Weekly scheduled analysis
         └─ TRIGGER 3: API request
         │
         ▼
Collect student data
  ├─ Historical performance
  ├─ Engagement patterns
  ├─ Assessment scores
  ├─ Session consistency
  └─ Learning velocity
         │
         ▼
Extract features
  ├─ Attendance rate
  ├─ Average session duration
  ├─ Quiz score trend
  ├─ Help-seeking frequency
  └─ Time between sessions
         │
         ▼
Apply predictive model
  ├─ Completion likelihood: 75%
  ├─ Expected final grade: B+
  ├─ Time to completion: 6 weeks
  ├─ Dropout risk: Low
  └─ Struggle areas: [...]
         │
         ▼
Generate interventions (if needed)
  ├─ IF dropout risk HIGH:
  │   └─ Recommend outreach
  ├─ IF performance declining:
  │   └─ Suggest remedial content
  └─ IF completion slow:
      └─ Provide motivation boost
         │
         ▼
Store predictions
  └─ Track accuracy over time
```

### 3. Achievement Engine Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Gamification Processing Flow                    │
└─────────────────────────────────────────────────────────────────┘

User Action (Any interaction)
         │
         ▼
POST /api/sam/track-achievement
  { userId, action, context }
         │
         ▼
Achievement Engine
         │
         ├─ Record interaction
         │
         ├─ Check achievement rules:
         │   ├─ Content completion
         │   ├─ Streak maintenance
         │   ├─ High assessment scores
         │   ├─ Helping peers
         │   └─ Special milestones
         │
         ├─ Evaluate conditions
         │
         └─ IF achievement unlocked:
             │
             ├─ Award points
             ├─ Grant badge
             ├─ Update streak
             ├─ Update leaderboard
             ├─ Trigger notification
             └─ Record in database
         │
         ▼
Response with achievement status
  {
    unlocked: true,
    achievement: {
      id: "...",
      name: "Fast Learner",
      points: 50,
      badge: "..."
    },
    totalPoints: 350,
    newLevel: 5,
    nextMilestone: {...}
  }
         │
         ▼
UI shows achievement notification
  ├─ Animated popup
  ├─ Points +50
  └─ Badge display
```

---

## 📊 Data Flow Diagrams

### 1. Multi-Engine Coordination

```
┌─────────────────────────────────────────────────────────────────┐
│              Complex Request with Multiple Engines               │
└─────────────────────────────────────────────────────────────────┘

API Request: "Analyze course and personalize for student"
         │
         ▼
API Handler (Orchestrator)
         │
         ├─────────────────┬─────────────────┬─────────────────┐
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
   Bloom's Engine   Analytics Engine  Personalization  Achievement
         │                 │            Engine             Engine
         │                 │                 │                 │
         ├─ Analyze        ├─ Get metrics   ├─ Get profile   ├─ Check
         │  cognitive      │  and trends    │  and style     │  progress
         │  levels         │                │                │
         │                 │                 │                 │
         └────────┬────────┴────────┬────────┴────────┬────────┘
                  │                 │                 │
                  ▼                 ▼                 ▼
                      Combine results
                            │
                            ▼
                   Format response
                            │
                            ▼
                   Return to client
```

### 2. Database Interaction Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    Database Access Pattern                       │
└─────────────────────────────────────────────────────────────────┘

Engine Operation
         │
         ▼
safeDbOperation() wrapper
         │
         ├─ try {
         │    │
         │    ▼
         │  Execute Prisma query
         │    │
         │    ├─ Connection pooling
         │    ├─ Query building
         │    ├─ Transaction management
         │    └─ Result mapping
         │    │
         │    ▼
         │  Return result
         │
         └─ catch (error) {
              │
              ├─ Log error (sanitized)
              ├─ Check for fallback
              │   │
              │   ├─ YES → Return fallback
              │   └─ NO → Throw error
              │
              └─ Never expose DB details
```

### 3. AI Provider Integration Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI API Call Pattern                           │
└─────────────────────────────────────────────────────────────────┘

Engine needs AI analysis
         │
         ▼
Check rate limits
  (sam-rate-limiter.ts)
         │
         ▼
Construct prompt
  ├─ System instructions
  ├─ Educational context
  ├─ User data (if relevant)
  ├─ Expected format
  └─ Quality criteria
         │
         ▼
Call Anthropic Claude API
  {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    temperature: 0.7,
    messages: [...]
  }
         │
         ▼
Receive AI response
         │
         ├─ Parse JSON (if structured)
         ├─ Validate format
         └─ Extract content
         │
         ▼
Post-process response
  ├─ Sanitize output
  ├─ Validate quality
  └─ Format for storage
         │
         ▼
Return processed result
```

---

## 🔗 Integration Patterns

### 1. React Component ↔ API Integration

```
Component mounting
  │
  ▼
useEffect(() => {
  │
  ├─ Check loading state
  ├─ Fetch data from API
  │   │
  │   └─ fetch('/api/sam/...')
  │       │
  │       ├─ Send auth token
  │       ├─ Send request data
  │       └─ Handle response
  │           │
  │           ├─ Success → Update state
  │           └─ Error → Show error UI
  │
  └─ Cleanup on unmount
}, [dependencies]);
```

### 2. Context Provider Pattern

```
SAM Global Provider
  │
  ├─ Initialize SAM context
  ├─ Load user preferences
  ├─ Set up event listeners
  │
  └─ Provide to children:
      ├─ samAssistant
      ├─ personalizedContent
      ├─ analyticsTracker
      └─ achievementSystem
         │
         ▼
  Child components access context
    via use-sam-context hook
```

### 3. Cache Invalidation Strategy

```
Content Update Event
  │
  ▼
Trigger cache invalidation
  │
  ├─ Identify affected cache keys
  │   ├─ Course-level cache
  │   ├─ Chapter-level cache
  │   └─ Section-level cache
  │
  ├─ Clear relevant caches
  │
  └─ Next request will:
      └─ Cache MISS
          └─ Regenerate fresh data
```

---

## 🎯 Workflow Best Practices

### 1. Error Handling Strategy

```
Every workflow layer has error handling:

1. UI Layer:
   ├─ Display user-friendly messages
   ├─ Provide retry options
   └─ Maintain app stability

2. API Layer:
   ├─ Validate inputs
   ├─ Return structured errors
   └─ Log for debugging

3. Engine Layer:
   ├─ Catch all exceptions
   ├─ Provide fallbacks
   ├─ Record errors
   └─ Prevent cascading failures

4. Database Layer:
   ├─ Handle connection issues
   ├─ Retry transient errors
   └─ Use transactions
```

### 2. Performance Optimization

```
Optimization points in workflows:

1. Caching:
   └─ Cache expensive operations
       └─ AI API calls, complex queries

2. Parallelization:
   └─ Execute independent operations concurrently
       └─ Multiple engine calls

3. Lazy Loading:
   └─ Load data only when needed
       └─ Paginated results

4. Debouncing:
   └─ Rate-limit frequent operations
       └─ Search, real-time chat

5. Connection Pooling:
   └─ Reuse database connections
       └─ Prisma connection pool
```

### 3. Security Checkpoints

```
Security enforcement at every layer:

1. Input Validation:
   └─ Validate all user inputs
       └─ Zod schemas, sanitization

2. Authentication:
   └─ Verify user identity
       └─ JWT tokens, sessions

3. Authorization:
   └─ Check user permissions
       └─ Role-based access control

4. Data Sanitization:
   └─ Clean all outputs
       └─ XSS prevention, SQL injection

5. Rate Limiting:
   └─ Prevent abuse
       └─ API throttling, quotas
```

---

## 📖 Related Documentation

- [00-OVERVIEW.md](./00-OVERVIEW.md) - System overview
- [02-CORE-ENGINES.md](./02-CORE-ENGINES.md) - Core engine abstractions
- [04-API-ROUTES.md](./04-API-ROUTES.md) - API endpoint documentation
- [08-FILE-MAPPING.md](./08-FILE-MAPPING.md) - Complete file structure

---

**Maintained by**: Taxomind Development Team
**Status**: ✅ Comprehensive Workflow Documentation
**Purpose**: System understanding for npm package preparation
