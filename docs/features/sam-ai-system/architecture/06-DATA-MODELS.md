# SAM AI Tutor - Data Models Documentation

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Purpose**: Prisma schema abstractions and database relationships

---

## 🎯 Overview

SAM AI Tutor uses Prisma ORM with PostgreSQL for data persistence. The database schema includes 12+ SAM-specific models integrated with the existing Taxomind LMS schema. This document provides abstract explanations of data models, relationships, and design patterns.

---

## 📊 Core Data Model Categories

### 1. Educational Analysis Models
- **BloomsAnalysis**: Stores Bloom&apos;s Taxonomy analysis results
- **ContentQualityMetric**: Tracks content quality scores

### 2. Personalization Models
- **LearningStyleProfile**: Student learning style data
- **EmotionalStateSnapshot**: Historical emotional states
- **MotivationProfile**: Motivation patterns and triggers

### 3. Analytics Models
- **SAMInteraction**: Tracks all user interactions with SAM
- **EngagementMetric**: Aggregated engagement data
- **PerformanceSnapshot**: Point-in-time performance records

### 4. Achievement Models
- **PointTransaction**: Points earned/spent history
- **Badge**: Available badges definition
- **UserBadge**: Badges earned by users
- **Streak**: Learning streak tracking

### 5. Content Generation Models
- **GenerationRequest**: AI content generation requests
- **GeneratedContent**: AI-generated content storage

### 6. Collaboration Models
- **StudyGroup**: Study groups created by SAM
- **PeerMatch**: Peer matching recommendations

---

## 🔍 Detailed Model Abstractions

### Model 1: BloomsAnalysis

**Purpose**: Store Bloom&apos;s Taxonomy analysis results for courses, chapters, and sections

**Key Fields**:
```typescript
model BloomsAnalysis {
  id: string; // UUID
  entityType: 'COURSE' | 'CHAPTER' | 'SECTION';
  entityId: string; // References course/chapter/section
  contentHash: string; // For cache invalidation

  // Distribution percentages (sum to 100)
  rememberPercentage: number;
  understandPercentage: number;
  applyPercentage: number;
  analyzePercentage: number;
  evaluatePercentage: number;
  createPercentage: number;

  cognitiveDepth: number; // 0-100 score
  balance: 'WELL_BALANCED' | 'BOTTOM_HEAVY' | 'TOP_HEAVY';

  // Analysis metadata
  analyzedAt: DateTime;
  analyzedBy: string; // User ID
  cacheUntil: DateTime; // TTL expiration

  // Relationships
  recommendations: BloomsRecommendation[];
}
```

**Indexes**:
- `entityType + entityId` (unique composite) - Fast lookup by entity
- `contentHash` - Cache key lookup
- `cacheUntil` - TTL-based queries

**Usage Pattern**:
```typescript
// Store analysis result
const analysis = await db.bloomsAnalysis.create({
  data: {
    entityType: 'COURSE',
    entityId: courseId,
    contentHash: generateHash(courseContent),
    rememberPercentage: 15,
    understandPercentage: 25,
    applyPercentage: 20,
    analyzePercentage: 20,
    evaluatePercentage: 10,
    createPercentage: 10,
    cognitiveDepth: 65,
    balance: 'WELL_BALANCED',
    cacheUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 min TTL
    analyzedBy: userId
  }
});

// Retrieve cached analysis
const cached = await db.bloomsAnalysis.findUnique({
  where: {
    entityType_entityId: {
      entityType: 'COURSE',
      entityId: courseId
    }
  }
});

if (cached && cached.cacheUntil > new Date()) {
  // Use cached result
  return cached;
} else {
  // Perform new analysis
  return await analyzeContent(courseId);
}
```

**Design Decisions**:
- Content hash prevents re-analysis of unchanged content
- TTL-based caching reduces AI API costs
- Separate entity types allow granular analysis
- Composite index optimizes entity lookups

---

### Model 2: LearningStyleProfile

**Purpose**: Store detected learning style for each student

**Key Fields**:
```typescript
model LearningStyleProfile {
  id: string;
  userId: string; // Foreign key to User

  // Primary and secondary styles
  primaryStyle: 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'READING_WRITING' | 'MIXED';
  secondaryStyle?: 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'READING_WRITING';

  // Style strength scores (0-1)
  visualStrength: number;
  auditoryStrength: number;
  kinestheticStrength: number;
  readingWritingStrength: number;

  // Detection metadata
  confidence: number; // 0-1
  evidenceCount: number; // Number of interactions analyzed
  lastUpdated: DateTime;

  // Relationships
  user: User;
  evidenceFactors: StyleEvidenceFactor[];
}
```

**Evidence Factor Model**:
```typescript
model StyleEvidenceFactor {
  id: string;
  profileId: string; // Foreign key

  factor: string; // "Prefers video content", "High text engagement"
  weight: number; // 0-1 importance
  observedAt: DateTime;

  profile: LearningStyleProfile;
}
```

**Indexes**:
- `userId` (unique) - One profile per user
- `lastUpdated` - Recent profile queries

**Usage Pattern**:
```typescript
// Detect and store learning style
const profile = await db.learningStyleProfile.upsert({
  where: { userId },
  create: {
    userId,
    primaryStyle: 'VISUAL',
    secondaryStyle: 'KINESTHETIC',
    visualStrength: 0.85,
    auditoryStrength: 0.45,
    kinestheticStrength: 0.70,
    readingWritingStrength: 0.55,
    confidence: 0.8,
    evidenceCount: 50,
    evidenceFactors: {
      create: [
        { factor: 'Video completion rate 90%', weight: 0.9 },
        { factor: 'High engagement with diagrams', weight: 0.85 }
      ]
    }
  },
  update: {
    // Update if already exists
    primaryStyle: 'VISUAL',
    visualStrength: 0.85,
    lastUpdated: new Date()
  }
});
```

**Design Decisions**:
- Separate evidence factors for transparency
- Strength scores allow multi-modal learners
- Confidence score indicates reliability
- Upsert pattern prevents duplicate profiles

---

### Model 3: SAMInteraction

**Purpose**: Track all user interactions with SAM features for analytics

**Key Fields**:
```typescript
model SAMInteraction {
  id: string;
  userId: string;
  engineName: string; // 'BloomsAnalysis', 'Personalization', etc.

  // Interaction details
  action: string; // 'analyze_course', 'generate_content', 'chat'
  entityType?: string; // 'course', 'chapter', 'section'
  entityId?: string;

  // Metadata
  context: Json; // Flexible metadata storage
  durationMs: number; // How long the operation took
  success: boolean;
  errorMessage?: string;

  createdAt: DateTime;

  // Relationships
  user: User;
}
```

**Indexes**:
- `userId + createdAt` - User activity timeline
- `engineName + createdAt` - Engine usage analytics
- `action` - Action type queries

**Usage Pattern**:
```typescript
// Record interaction
const interaction = await db.sAMInteraction.create({
  data: {
    userId: user.id,
    engineName: 'BloomsAnalysis',
    action: 'analyze_course',
    entityType: 'course',
    entityId: courseId,
    context: {
      includeRecommendations: true,
      forceRefresh: false
    },
    durationMs: 4523,
    success: true
  }
});

// Query user interactions
const recentInteractions = await db.sAMInteraction.findMany({
  where: {
    userId: user.id,
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 50
});

// Analyze engine usage
const engineStats = await db.sAMInteraction.groupBy({
  by: ['engineName'],
  where: {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  },
  _count: { id: true },
  _avg: { durationMs: true }
});
```

**Design Decisions**:
- JSON context field allows flexible metadata without schema changes
- Duration tracking enables performance monitoring
- Success flag enables error rate analytics
- No foreign key cascade for historical preservation

---

### Model 4: EmotionalStateSnapshot

**Purpose**: Store point-in-time emotional state assessments

**Key Fields**:
```typescript
model EmotionalStateSnapshot {
  id: string;
  userId: string;

  // Detected emotion
  emotion: 'MOTIVATED' | 'FRUSTRATED' | 'CONFUSED' | 'CONFIDENT' | 'ANXIOUS' | 'NEUTRAL';
  confidence: number; // 0-1

  // Indicators that led to this conclusion
  indicators: Json; // {responseTime, errorRate, helpSeeking, etc.}
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';

  // Metadata
  assessedAt: DateTime;
  lookbackHours: number; // Hours of data analyzed

  // Relationships
  user: User;
}
```

**Indexes**:
- `userId + assessedAt` - Temporal emotion tracking
- `assessedAt` - Recent snapshots queries

**Usage Pattern**:
```typescript
// Store emotional state
const snapshot = await db.emotionalStateSnapshot.create({
  data: {
    userId: user.id,
    emotion: 'FRUSTRATED',
    confidence: 0.75,
    indicators: {
      responseTime: 'slow',
      errorRate: 'high',
      helpSeeking: 'frequent',
      sessionDuration: 'shortened'
    },
    trend: 'DECLINING',
    lookbackHours: 24
  }
});

// Track emotional trend
const emotionHistory = await db.emotionalStateSnapshot.findMany({
  where: { userId: user.id },
  orderBy: { assessedAt: 'desc' },
  take: 10 // Last 10 assessments
});

// Analyze emotion patterns
const pattern = analyzeEmotionPattern(emotionHistory);
```

**Design Decisions**:
- Snapshot model preserves historical data
- JSON indicators allow flexible evidence storage
- Trend field enables quick pattern analysis
- No cascade delete to preserve emotional history

---

### Model 5: PointTransaction

**Purpose**: Track all point earnings and spending

**Key Fields**:
```typescript
model PointTransaction {
  id: string;
  userId: string;

  // Transaction details
  type: 'EARN' | 'SPEND';
  amount: number; // Positive for earn, negative for spend
  balance: number; // Balance after transaction
  reason: string; // 'Completed section', 'Purchased badge'

  // Source tracking
  sourceType: 'CONTENT_COMPLETION' | 'ASSESSMENT' | 'SOCIAL' | 'STREAK' | 'PURCHASE';
  sourceId?: string; // ID of related entity
  multiplier: number; // Streak or event multiplier (default: 1.0)

  createdAt: DateTime;

  // Relationships
  user: User;
}
```

**Indexes**:
- `userId + createdAt` - User transaction history
- `userId + type` - Earn/spend analytics
- `createdAt` - Recent transactions

**Usage Pattern**:
```typescript
// Award points for activity
const transaction = await db.pointTransaction.create({
  data: {
    userId: user.id,
    type: 'EARN',
    amount: 50,
    balance: user.currentPoints + 50,
    reason: 'Completed React Fundamentals chapter',
    sourceType: 'CONTENT_COMPLETION',
    sourceId: chapterId,
    multiplier: 1.5 // Streak bonus
  }
});

// Update user's point balance
await db.user.update({
  where: { id: user.id },
  data: { currentPoints: { increment: 50 } }
});

// Query transaction history
const history = await db.pointTransaction.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: 'desc' },
  take: 20
});

// Calculate total earned
const totalEarned = await db.pointTransaction.aggregate({
  where: {
    userId: user.id,
    type: 'EARN'
  },
  _sum: { amount: true }
});
```

**Design Decisions**:
- Immutable transaction log (no updates or deletes)
- Balance snapshot for historical accuracy
- Multiplier tracking for analytics
- Source tracking enables reward analysis

---

### Model 6: Badge & UserBadge

**Purpose**: Define badges and track user achievements

**Badge Definition**:
```typescript
model Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon identifier or URL
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

  // Criteria (stored as JSON for flexibility)
  criteria: Json; // {type: 'course_completion', count: 5}
  rewardPoints: number;

  // Display settings
  isVisible: boolean; // Hidden badges are surprises
  category: string; // 'achievement', 'skill', 'social', 'consistency'

  createdAt: DateTime;

  // Relationships
  userBadges: UserBadge[];
}
```

**User Badge Junction**:
```typescript
model UserBadge {
  id: string;
  userId: string;
  badgeId: string;

  earnedAt: DateTime;
  progress: number; // 0-1 for partially completed badges

  // Relationships
  user: User;
  badge: Badge;
}
```

**Indexes**:
- Badge: `rarity + isVisible` - Badge listings
- UserBadge: `userId + badgeId` (unique composite) - Prevent duplicates
- UserBadge: `userId + earnedAt` - User badge timeline

**Usage Pattern**:
```typescript
// Check if user earned badge
const courseCompletions = await db.enrollment.count({
  where: {
    userId: user.id,
    completed: true
  }
});

if (courseCompletions >= 5) {
  // Award "Course Completer" badge
  const badge = await db.badge.findFirst({
    where: { name: 'Course Completer' }
  });

  await db.userBadge.create({
    data: {
      userId: user.id,
      badgeId: badge.id,
      progress: 1.0
    }
  });

  // Award points
  await awardPoints(user.id, badge.rewardPoints, 'Earned Course Completer badge');
}

// Get user badges
const earnedBadges = await db.userBadge.findMany({
  where: { userId: user.id },
  include: { badge: true },
  orderBy: { earnedAt: 'desc' }
});
```

**Design Decisions**:
- Flexible criteria as JSON allows complex requirements
- Progress field supports partially completed badges
- Rarity system adds gamification depth
- Hidden badges create surprise factor

---

### Model 7: Streak

**Purpose**: Track consecutive days of learning activity

**Key Fields**:
```typescript
model Streak {
  id: string;
  userId: string;

  // Current streak
  currentStreak: number; // Consecutive days
  longestStreak: number; // All-time record

  // Freeze system
  freezeCount: number; // Available freezes (default: 1/week)
  lastFreezeUsed?: DateTime;

  // Activity tracking
  lastActiveDate: DateTime;
  streakStartDate: DateTime;

  // Relationships
  user: User;
}
```

**Indexes**:
- `userId` (unique) - One streak per user
- `currentStreak` - Leaderboard queries

**Usage Pattern**:
```typescript
// Daily activity check
const today = new Date();
today.setHours(0, 0, 0, 0);

const streak = await db.streak.findUnique({
  where: { userId: user.id }
});

const lastActive = new Date(streak.lastActiveDate);
lastActive.setHours(0, 0, 0, 0);

const daysDiff = Math.floor((today - lastActive) / (24 * 60 * 60 * 1000));

if (daysDiff === 0) {
  // Already active today
  return streak;
} else if (daysDiff === 1) {
  // Consecutive day - increment streak
  return await db.streak.update({
    where: { userId: user.id },
    data: {
      currentStreak: { increment: 1 },
      longestStreak: Math.max(streak.currentStreak + 1, streak.longestStreak),
      lastActiveDate: today
    }
  });
} else if (daysDiff === 2 && streak.freezeCount > 0) {
  // Missed one day but can use freeze
  return await db.streak.update({
    where: { userId: user.id },
    data: {
      currentStreak: { increment: 1 },
      freezeCount: { decrement: 1 },
      lastFreezeUsed: today,
      lastActiveDate: today
    }
  });
} else {
  // Streak broken
  return await db.streak.update({
    where: { userId: user.id },
    data: {
      currentStreak: 1,
      streakStartDate: today,
      lastActiveDate: today
    }
  });
}
```

**Design Decisions**:
- Freeze mechanic improves retention without being punishing
- Longest streak preserved for achievement
- Daily activity tracking, not exact timestamps
- Automatic reset after missed days

---

### Model 8: GenerationRequest

**Purpose**: Track AI content generation requests

**Key Fields**:
```typescript
model GenerationRequest {
  id: string;
  userId: string;
  engineType: 'COURSE' | 'CHAPTER' | 'SECTION' | 'ASSESSMENT' | 'RESOURCE';

  // Request parameters
  parameters: Json; // Flexible parameter storage
  targetEntityType?: string;
  targetEntityId?: string;

  // Processing status
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: DateTime;
  completedAt?: DateTime;
  durationMs?: number;

  // Result
  resultId?: string; // FK to GeneratedContent
  errorMessage?: string;

  // Relationships
  user: User;
  result?: GeneratedContent;
}
```

**Generated Content Model**:
```typescript
model GeneratedContent {
  id: string;
  requestId: string; // FK to GenerationRequest

  contentType: 'COURSE_OUTLINE' | 'CHAPTER' | 'SECTION' | 'QUESTIONS' | 'RESOURCE';
  content: Json; // Generated content structure
  qualityScore: number; // 0-100

  // Review status
  reviewed: boolean;
  acceptedBy?: string; // User ID
  rejectedReason?: string;

  createdAt: DateTime;

  // Relationships
  request: GenerationRequest;
}
```

**Indexes**:
- GenerationRequest: `userId + status` - User&apos;s active requests
- GenerationRequest: `status + startedAt` - Processing queue
- GeneratedContent: `requestId` (unique) - One result per request

**Usage Pattern**:
```typescript
// Create generation request
const request = await db.generationRequest.create({
  data: {
    userId: user.id,
    engineType: 'COURSE',
    parameters: {
      topic: 'React Hooks',
      difficulty: 'beginner',
      duration: 4 // weeks
    },
    status: 'PENDING'
  }
});

// Process request (background job)
const generatedContent = await generateCourse(request.parameters);

// Store result
const result = await db.generatedContent.create({
  data: {
    requestId: request.id,
    contentType: 'COURSE_OUTLINE',
    content: generatedContent,
    qualityScore: 85
  }
});

// Update request status
await db.generationRequest.update({
  where: { id: request.id },
  data: {
    status: 'COMPLETED',
    completedAt: new Date(),
    durationMs: Date.now() - request.startedAt.getTime(),
    resultId: result.id
  }
});

// User reviews generated content
await db.generatedContent.update({
  where: { id: result.id },
  data: {
    reviewed: true,
    acceptedBy: user.id
  }
});
```

**Design Decisions**:
- Separate request and result for async processing
- Status tracking enables job queue management
- Quality score helps improve generation
- Review workflow ensures content approval

---

### Model 9: StudyGroup

**Purpose**: SAM-recommended study groups

**Key Fields**:
```typescript
model StudyGroup {
  id: string;
  name: string;
  description?: string;
  courseId: string;

  // Group settings
  maxMembers: number;
  schedule: Json; // {day: 'Monday', time: '18:00', duration: 60}
  isPrivate: boolean;

  // SAM recommendation
  createdBySAM: boolean; // true if SAM recommended
  compatibilityAlgorithm?: string; // Algorithm version used

  createdAt: DateTime;
  createdBy: string; // User ID

  // Relationships
  course: Course;
  members: StudyGroupMember[];
}
```

**Study Group Member Model**:
```typescript
model StudyGroupMember {
  id: string;
  groupId: string;
  userId: string;

  role: 'MEMBER' | 'MODERATOR';
  joinedAt: DateTime;
  leftAt?: DateTime; // null if still member

  // Relationships
  group: StudyGroup;
  user: User;
}
```

**Indexes**:
- StudyGroup: `courseId + isPrivate` - Course study groups
- StudyGroupMember: `groupId + userId` (unique composite) - Prevent duplicates
- StudyGroupMember: `userId + leftAt` - User&apos;s active groups

**Usage Pattern**:
```typescript
// SAM recommends study group
const group = await db.studyGroup.create({
  data: {
    name: 'React Beginners Study Group',
    courseId: 'react-fundamentals',
    maxMembers: 10,
    schedule: {
      day: 'Monday',
      time: '18:00',
      duration: 60 // minutes
    },
    isPrivate: false,
    createdBySAM: true,
    compatibilityAlgorithm: 'v1.0',
    createdBy: 'sam-system'
  }
});

// Add members
await db.studyGroupMember.createMany({
  data: matchedUsers.map(userId => ({
    groupId: group.id,
    userId,
    role: 'MEMBER'
  }))
});

// Get user&apos;s active groups
const activeGroups = await db.studyGroupMember.findMany({
  where: {
    userId: user.id,
    leftAt: null
  },
  include: {
    group: {
      include: {
        course: true,
        _count: { select: { members: true } }
      }
    }
  }
});
```

**Design Decisions**:
- Soft delete (leftAt) preserves historical membership
- SAM flag distinguishes algorithm-created groups
- Schedule as JSON for flexible formats
- Compatibility algorithm version for A/B testing

---

## 🔗 Key Relationships

### User-Centric Relationships

```
User (core model)
├── hasMany LearningStyleProfile (1:1 in practice)
├── hasMany EmotionalStateSnapshot (1:many, temporal)
├── hasMany SAMInteraction (1:many, audit trail)
├── hasMany PointTransaction (1:many, financial)
├── hasMany UserBadge (many:many through junction)
├── hasMany Streak (1:1 in practice)
├── hasMany GenerationRequest (1:many)
└── hasMany StudyGroupMember (many:many through junction)
```

### Content-Centric Relationships

```
Course
├── hasMany BloomsAnalysis (1:many, entity type filter)
├── hasMany SAMInteraction (polymorphic)
├── hasMany StudyGroup (1:many)
└── hasMany GenerationRequest (polymorphic)

Chapter
├── hasMany BloomsAnalysis (1:many, entity type filter)
└── hasMany SAMInteraction (polymorphic)

Section
├── hasMany BloomsAnalysis (1:many, entity type filter)
├── hasMany SAMInteraction (polymorphic)
└── hasMany GeneratedContent (polymorphic)
```

---

## 📐 Database Design Patterns

### 1. Polymorphic Associations

**Pattern**: Entity type + entity ID for flexible relationships

```typescript
// Instead of separate foreign keys
model BloomsAnalysis {
  entityType: 'COURSE' | 'CHAPTER' | 'SECTION';
  entityId: string;

  // No direct foreign key
  // Flexible association to any entity type
}
```

**Benefits**:
- Single table for all entity types
- Easier to add new entity types
- Consistent query patterns

**Trade-offs**:
- No database-enforced referential integrity
- Must validate entity existence in application code

---

### 2. JSON Fields for Flexibility

**Pattern**: Use JSON for schema-flexible data

```typescript
model Badge {
  criteria: Json; // {type: 'course_completion', count: 5}
}

model SAMInteraction {
  context: Json; // Flexible metadata
}
```

**When to Use**:
- Criteria that vary by badge type
- Metadata that changes frequently
- Data that doesn&apos;t require querying

**When NOT to Use**:
- Data used in WHERE clauses
- Data requiring validation
- Relational data

---

### 3. Snapshot Pattern

**Pattern**: Store point-in-time records for historical analysis

```typescript
model EmotionalStateSnapshot {
  assessedAt: DateTime;
  emotion: string;
  // ... other fields
}

model PerformanceSnapshot {
  snapshotDate: DateTime;
  metrics: Json;
  // ... other fields
}
```

**Benefits**:
- Historical trend analysis
- No data loss from updates
- Audit trail

**Trade-offs**:
- Storage growth over time
- Requires data cleanup strategy

---

### 4. Soft Delete Pattern

**Pattern**: Use timestamp field instead of actual deletion

```typescript
model StudyGroupMember {
  joinedAt: DateTime;
  leftAt?: DateTime; // null = still active
}
```

**Benefits**:
- Preserve historical data
- Enable &quot;rejoin&quot; features
- Analytics on past memberships

**Query Pattern**:
```typescript
// Active members
where: { leftAt: null }

// Historical members
where: { leftAt: { not: null } }
```

---

### 5. Balance/Aggregate Denormalization

**Pattern**: Store calculated values to avoid expensive aggregations

```typescript
model User {
  currentPoints: number; // Denormalized from PointTransaction
}

model PointTransaction {
  balance: number; // Denormalized balance snapshot
}
```

**Benefits**:
- Fast balance queries
- Historical balance preservation
- Reduced database load

**Trade-offs**:
- Must maintain consistency with transactions
- Potential for drift (requires periodic reconciliation)

---

## 🚀 NPM Package Database Strategy

### Dependency Injection Approach

For the npm package, database access should be injected:

```typescript
// Package consumer provides database client
export interface SAMDatabaseClient {
  // Minimal interface engines need
  bloomsAnalysis: {
    findUnique: (args) => Promise<BloomsAnalysis | null>;
    create: (args) => Promise<BloomsAnalysis>;
    update: (args) => Promise<BloomsAnalysis>;
  };
  // ... other models
}

// Engine accepts injected database
export class BloomsAnalysisEngine extends SAMBaseEngine {
  constructor(deps: { database: SAMDatabaseClient }) {
    super('BloomsAnalysis', deps);
  }
}
```

### Migration Strategy

```typescript
// Package provides Prisma schema files
export const samSchemaFiles = {
  'blooms-analysis': './prisma/sam-blooms-analysis.prisma',
  'personalization': './prisma/sam-personalization.prisma',
  // ... other schemas
};

// Consumer runs migrations
import { samSchemaFiles } from '@taxomind/sam-ai-tutor';
// Run prisma migrate with SAM schemas
```

---

## 📖 Related Documentation

- [00-OVERVIEW.md](./00-OVERVIEW.md) - System overview
- [02-CORE-ENGINES.md](./02-CORE-ENGINES.md) - Engine architecture
- [04-API-ROUTES.md](./04-API-ROUTES.md) - API endpoints
- [09-NPM-PACKAGE-GUIDE.md](./09-NPM-PACKAGE-GUIDE.md) - Package preparation

---

**Maintained by**: Taxomind Development Team
**Status**: ✅ Active Development
