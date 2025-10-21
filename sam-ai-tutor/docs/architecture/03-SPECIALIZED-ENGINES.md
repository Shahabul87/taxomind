# SAM AI Tutor - Specialized Engines Documentation

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Purpose**: Individual engine documentation with abstractions

---

## 🎯 Overview

SAM AI Tutor consists of 35+ specialized engines, each focused on a specific aspect of the learning experience. This document provides detailed abstractions for each engine, their capabilities, inputs/outputs, and integration patterns.

All engines inherit from `SAMBaseEngine` and follow the same architectural patterns described in [02-CORE-ENGINES.md](./02-CORE-ENGINES.md).

---

## 📚 Educational Engines

### 1. Bloom&apos;s Taxonomy Analysis Engine

**File**: `lib/sam-blooms-engine.ts`

**Purpose**: Analyze educational content across Bloom&apos;s 6 cognitive levels

**Core Capabilities**:
- **Course-Level Analysis**: Analyzes entire course structure for cognitive depth
- **Chapter-Level Analysis**: Evaluates individual chapters for cognitive level distribution
- **Section-Level Analysis**: Provides granular analysis of learning content
- **Learning Pathway Generation**: Creates cognitive development paths for students
- **Recommendation Engine**: Suggests improvements for better cognitive balance

**Key Interfaces**:
```typescript
export interface BloomsAnalysisRequest {
  entityType: 'course' | 'chapter' | 'section';
  entityId: string;
  options?: {
    includeRecommendations?: boolean;
    includeLearningPath?: boolean;
    forceRefresh?: boolean;
  };
}

export interface BloomsAnalysisResponse {
  distribution: {
    REMEMBER: number;    // 0-100%
    UNDERSTAND: number;  // 0-100%
    APPLY: number;       // 0-100%
    ANALYZE: number;     // 0-100%
    EVALUATE: number;    // 0-100%
    CREATE: number;      // 0-100%
  };
  cognitiveDepth: number; // 0-100 score
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  recommendations?: ContentRecommendation[];
  learningPathway?: LearningPathway;
}
```

**Analysis Process**:
1. Extract content text from course/chapter/section
2. Generate content hash for cache key
3. Check cache for existing analysis
4. If cache miss, send to Anthropic Claude API with Bloom&apos;s-specific prompt
5. Parse AI response into cognitive level percentages
6. Calculate aggregate statistics (depth, balance)
7. Generate recommendations if requested
8. Cache result with 15-minute TTL

**Usage Context**: Teachers use this to ensure course content provides appropriate cognitive challenge and progression.

---

### 2. Personalization Engine

**File**: `lib/sam-personalization-engine.ts`

**Purpose**: Create individualized learning experiences based on student behavior and preferences

**Core Capabilities**:

#### A. Learning Style Detection
**Process**: Analyzes student interaction patterns to determine learning preferences

**Detected Styles**:
- **Visual**: Prefers diagrams, infographics, videos
- **Auditory**: Prefers lectures, podcasts, discussions
- **Kinesthetic**: Prefers hands-on activities, simulations
- **Reading-Writing**: Prefers articles, documents, note-taking
- **Mixed**: Combination of multiple styles

**Evidence Factors**:
- Video completion rates vs text completion rates
- Interaction time with visual vs textual content
- Assessment performance by content type
- Help-seeking behavior patterns

**Output**:
```typescript
export interface LearningStyleProfile {
  primaryStyle: LearningStyle;
  secondaryStyle?: LearningStyle;
  styleStrengths: Record<LearningStyle, number>; // 0-1 scores
  evidenceFactors: string[];
  confidence: number; // 0-1
  lastUpdated: Date;
}
```

#### B. Cognitive Load Optimization
**Process**: Adjusts content complexity based on student&apos;s current cognitive capacity

**Load Factors Analyzed**:
- Word count and sentence complexity
- Concept density (new concepts per paragraph)
- Multimedia element count
- Interactivity requirements

**Optimization Strategies**:
- **Overload Detected**: Break down concepts, add visual aids, include practice breaks
- **Underload Detected**: Add challenging scenarios, deeper analysis, real-world applications

#### C. Emotional State Recognition
**Process**: Infers student emotional state from interaction patterns

**Recognized Emotions**:
- **Motivated**: Fast progress, high engagement, minimal errors
- **Frustrated**: Slow progress, repeated errors, help-seeking
- **Confused**: Random behavior, frequent revisits, incomplete tasks
- **Confident**: Steady progress, few errors, explores beyond requirements
- **Anxious**: Hesitant actions, frequent saves, avoids assessments
- **Neutral**: Consistent baseline behavior

**Indicators**:
- Response time patterns (slower = confused/frustrated)
- Error rates (higher = frustrated/anxious)
- Help request frequency (more = confused/anxious)
- Session duration changes (shorter = frustrated/anxious)
- Progress velocity (faster = motivated/confident)

#### D. Motivation Pattern Analysis
**Process**: Identifies what motivates the student

**Intrinsic Factors**:
- Mastery orientation (focuses on improvement)
- Intellectual curiosity (explores beyond requirements)
- Autonomy preference (self-directed learning)

**Extrinsic Factors**:
- Achievement recognition (badges, certificates)
- Social comparison (leaderboards, rankings)
- External pressure (deadlines, grades)

**Sustainability Score**: Predicts long-term engagement based on motivation type

#### E. Personalized Learning Path Generation
**Process**: Creates customized learning journey for student

**Path Components**:
```typescript
export interface LearningPath {
  objectives: LearningObjective[];
  nodes: LearningNode[];
  estimatedDuration: number; // in hours
  difficulty: 'easy' | 'medium' | 'hard';
  alternatives: {
    fastTrack: LearningPath;
    thorough: LearningPath;
  };
}

export type LearningNode =
  | { type: 'content'; sectionId: string; estimatedTime: number }
  | { type: 'assessment'; quizId: string; requiredScore: number }
  | { type: 'project'; projectId: string; deliverables: string[] }
  | { type: 'break'; duration: number };
```

**Usage Context**: Students receive personalized content recommendations, difficulty adjustments, and optimal learning sequences.

---

### 3. Analytics Engine

**File**: `lib/sam-analytics-engine.ts`

**Purpose**: Track, aggregate, and analyze learning metrics

**Core Capabilities**:

#### A. Engagement Metrics
**Tracked Data**:
- Session frequency and duration
- Content completion rates
- Assessment attempt rates
- Feature usage patterns
- Time spent per section/chapter

**Aggregations**:
- Daily/weekly/monthly active users
- Average session duration trends
- Engagement score (0-100)
- Retention rate (day 1, day 7, day 30)

#### B. Content Effectiveness Metrics
**Tracked Data**:
- Content view duration vs expected duration
- Completion rates by content type
- Drop-off points in courses
- Most/least engaging content

**Insights**:
- Which sections cause drop-offs
- Optimal content length
- Content type preferences by demographics

#### C. Assessment Analytics
**Tracked Data**:
- Score distributions
- Question difficulty analysis
- Common wrong answers
- Time spent per question

**Insights**:
- Which questions are too easy/hard
- Which concepts students struggle with
- Assessment predictability

#### D. Learning Velocity
**Tracked Data**:
- Progress rate (sections/week)
- Time to complete courses
- Acceleration/deceleration patterns

**Predictions**:
- Estimated completion date
- Risk of slowing down
- Optimal pacing recommendations

**Usage Context**: Teachers and administrators use analytics to improve content quality and identify struggling students early.

---

### 4. Predictive Engine

**File**: `lib/sam-predictive-engine.ts`

**Purpose**: Forecast student outcomes and provide early intervention recommendations

**Core Capabilities**:

#### A. Course Completion Prediction
**Input Features**:
- Current progress percentage
- Days since enrollment
- Session frequency
- Assessment scores
- Engagement metrics

**Output**:
```typescript
export interface CompletionPrediction {
  likelihood: number; // 0-1 probability
  estimatedCompletionDate: Date;
  confidence: number; // 0-1
  riskFactors: string[];
  recommendations: InterventionRecommendation[];
}
```

#### B. Performance Prediction
**Input Features**:
- Historical assessment scores
- Study patterns
- Content completion rates
- Engagement levels

**Output**: Expected final grade with confidence interval

#### C. At-Risk Student Identification
**Risk Indicators**:
- Declining session frequency
- Increasing time per section (struggling)
- Lower assessment scores
- Reduced engagement

**Output**:
```typescript
export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  primaryRiskFactors: RiskFactor[];
  interventions: Intervention[];
  urgency: 'immediate' | 'soon' | 'monitor';
}
```

#### D. Skill Mastery Timeline
**Process**: Predicts when student will master specific skills

**Output**: Timeline with checkpoints and estimated dates

**Usage Context**: Instructors receive alerts about at-risk students and can intervene proactively.

---

### 5. Achievement Engine

**File**: `lib/sam-achievement-engine.ts`

**Purpose**: Manage gamification elements (points, badges, streaks)

**Core Capabilities**:

#### A. Points System
**Point Awards**:
- Complete section: 10 points
- Complete chapter: 50 points
- Complete course: 200 points
- High assessment score (>90%): 20 bonus points
- Help another student: 15 points
- Maintain 7-day streak: 50 points

**Point Multipliers**:
- Streak multiplier: 1.5x for 7+ day streaks
- Difficulty multiplier: Easy (1x), Medium (1.5x), Hard (2x)

#### B. Badge System
**Badge Categories**:
- **Achievement**: Complete 5 courses, 10 courses, 25 courses
- **Skill**: Master specific skills (coding, mathematics, writing)
- **Social**: Help 10 students, create study group
- **Consistency**: 30-day streak, 90-day streak, 365-day streak
- **Excellence**: Score 100% on 5 assessments

**Badge Metadata**:
```typescript
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: AchievementCriteria;
  rewardPoints: number;
}
```

#### C. Streak Tracking
**Tracked Activities**:
- Daily login
- Daily content completion
- Daily assessment attempts

**Streak Features**:
- Streak counter
- Streak freeze (1 per week)
- Longest streak record
- Streak leaderboard

#### D. Leaderboards
**Leaderboard Types**:
- Global points leaderboard
- Course-specific leaderboard
- Weekly challenge leaderboard
- Skill mastery leaderboard

**Privacy Options**: Opt-in/opt-out, anonymous participation

**Usage Context**: Students are motivated through gamification elements and social recognition.

---

## 🎨 Content Engines

### 6. Generation Engine

**File**: `lib/sam-generation-engine.ts`

**Purpose**: Generate educational content using AI

**Core Capabilities**:

#### A. Course Generation
**Input**:
```typescript
export interface CourseGenerationRequest {
  topic: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in weeks
  learningObjectives: string[];
  style?: 'academic' | 'practical' | 'conversational';
}
```

**Output**: Complete course outline with chapters, sections, and learning objectives

**Process**:
1. Construct generation prompt with requirements
2. Send to Anthropic Claude API
3. Parse structured response
4. Validate content quality
5. Store in database

#### B. Chapter Generation
**Input**: Course context + chapter topic
**Output**: Chapter with multiple sections, examples, and assessments

#### C. Assessment Generation
**Input**: Section content + difficulty level
**Output**: Multiple-choice questions, short answer questions, and explanations

**Question Types**:
- Multiple choice (4 options)
- True/False
- Short answer
- Fill in the blank
- Matching

#### D. Learning Resource Generation
**Input**: Topic + resource type
**Output**: Blog posts, code examples, video scripts, infographics

**Usage Context**: Teachers rapidly create course content with AI assistance.

---

### 7. Architect Engine

**File**: `lib/sam-architect-engine.ts`

**Purpose**: Design optimal course structures and learning sequences

**Core Capabilities**:

#### A. Course Structure Optimization
**Analysis**:
- Logical flow of topics
- Prerequisite dependencies
- Cognitive load distribution
- Pacing and breaks

**Recommendations**:
- Optimal chapter order
- Section length recommendations
- Assessment placement
- Review session timing

#### B. Learning Path Architecture
**Process**: Designs branching learning paths with:
- Prerequisites clearly defined
- Alternative paths for different learning speeds
- Checkpoint assessments
- Remediation loops

#### C. Curriculum Mapping
**Process**: Maps course content to educational standards (Common Core, state standards)

**Usage Context**: Teachers ensure courses are well-structured and meet educational standards.

---

### 8. Exam Engine

**File**: `lib/sam-exam-engine.ts`

**Purpose**: Create, manage, and analyze assessments

**Core Capabilities**:

#### A. Assessment Creation
**Features**:
- Question bank management
- Randomized question selection
- Difficulty balancing
- Time limit configuration

#### B. Grading Automation
**Features**:
- Instant grading for objective questions
- Rubric-based grading for subjective questions
- Partial credit support
- Grade distribution analysis

#### C. Assessment Analytics
**Metrics**:
- Average score
- Score distribution
- Question difficulty analysis
- Common misconceptions

**Usage Context**: Teachers create and manage assessments efficiently.

---

## 📦 Resource Engines

### 9. Resource Engine

**File**: `lib/sam-resource-engine.ts`

**Purpose**: Manage learning resources (videos, PDFs, code examples)

**Core Capabilities**:

#### A. Resource Curation
**Features**:
- Search and filter resources
- Tag-based organization
- Quality scoring
- Relevance ranking

#### B. Resource Recommendations
**Process**: Recommends resources based on:
- Current learning topic
- Student learning style
- Difficulty level
- Resource effectiveness metrics

#### C. Resource Analytics
**Metrics**:
- View count
- Completion rate
- Helpfulness ratings
- Time spent

**Usage Context**: Students find relevant supplementary resources easily.

---

### 10. Multimedia Engine

**File**: `lib/sam-multimedia-engine.ts`

**Purpose**: Process and optimize multimedia content

**Core Capabilities**:

#### A. Video Processing
**Features**:
- Video transcription
- Timestamp generation for key concepts
- Quiz generation from video content
- Thumbnail optimization

#### B. Image Processing
**Features**:
- Image compression
- Alt text generation
- Diagram analysis
- OCR for text extraction

#### C. Audio Processing
**Features**:
- Audio transcription
- Noise reduction
- Speed adjustment
- Podcast episode segmentation

**Usage Context**: Multimedia content is automatically processed for accessibility and searchability.

---

## 🤝 Social Engines

### 11. Collaboration Engine

**File**: `lib/sam-collaboration-engine.ts`

**Purpose**: Facilitate collaborative learning experiences

**Core Capabilities**:

#### A. Study Group Formation
**Process**: Creates study groups based on:
- Similar learning goals
- Compatible schedules
- Complementary skills
- Learning style compatibility

#### B. Peer Matching
**Process**: Matches students for:
- Peer tutoring
- Project collaboration
- Study partners
- Accountability partners

#### C. Discussion Facilitation
**Features**:
- Discussion prompts generation
- Moderation assistance
- Engagement tracking
- Knowledge sharing metrics

**Usage Context**: Students collaborate effectively with AI-facilitated groupings.

---

### 12. Social Learning Engine

**File**: `lib/sam-social-engine.ts`

**Purpose**: Enable social learning features

**Core Capabilities**:

#### A. Peer Learning
**Features**:
- Question and answer forums
- Peer review of projects
- Collaborative notes
- Study group chat

#### B. Mentorship Matching
**Process**: Matches students with mentors based on:
- Subject expertise
- Career goals
- Availability
- Teaching style

#### C. Community Building
**Features**:
- Interest-based communities
- Learning circles
- Expert Q&A sessions
- Live study events

**Usage Context**: Students learn from peers and build supportive learning communities.

---

## 💼 Business Intelligence Engines

### 13. Financial Engine

**File**: `lib/sam-financial-engine.ts`

**Purpose**: Provide financial intelligence and optimization

**Core Capabilities**:

#### A. Pricing Optimization
**Analysis**:
- Market price analysis
- Competitor pricing
- Value-based pricing recommendations
- Dynamic pricing strategies

#### B. Revenue Forecasting
**Process**: Predicts revenue based on:
- Historical enrollment trends
- Seasonal patterns
- Marketing campaigns
- Course popularity

#### C. ROI Calculation
**Metrics**:
- Course development ROI
- Marketing campaign ROI
- Student lifetime value
- Churn cost analysis

**Usage Context**: Administrators optimize pricing and forecast financial performance.

---

### 14. Market Analysis Engine

**File**: `lib/sam-market-engine.ts`

**Purpose**: Analyze market trends and competition

**Core Capabilities**:

#### A. Trend Detection
**Analysis**:
- Emerging skill demands
- Popular course topics
- Industry hiring trends
- Technology adoption rates

#### B. Competitive Analysis
**Metrics**:
- Competitor course offerings
- Pricing comparison
- Feature gap analysis
- Market positioning

#### C. Opportunity Identification
**Process**: Identifies opportunities for:
- New course topics
- Underserved markets
- Partnership opportunities
- Expansion markets

**Usage Context**: Administrators make data-driven decisions about course offerings.

---

### 15. Enterprise Engine

**File**: `lib/sam-enterprise-engine.ts`

**Purpose**: Support enterprise and B2B features

**Core Capabilities**:

#### A. Multi-Tenant Management
**Features**:
- Organization-level dashboards
- Team management
- Bulk user provisioning
- SSO integration

#### B. Compliance Reporting
**Features**:
- Training completion reports
- Certification tracking
- Audit logs
- SCORM/xAPI compatibility

#### C. Custom Branding
**Features**:
- White-label support
- Custom domain
- Brand guidelines enforcement
- Custom certificate templates

**Usage Context**: Enterprise customers manage large-scale training programs.

---

## 📰 Information Engines

### 16. News Engine

**File**: `lib/sam-news-engine.ts`

**Purpose**: Aggregate and curate AI/tech news

**Core Capabilities**:

#### A. News Aggregation
**Sources**:
- AI research papers
- Tech news websites
- Industry blogs
- Academic publications

#### B. Content Curation
**Process**: Filters and ranks news based on:
- Relevance to learning topics
- Source credibility
- Recency
- User interests

#### C. Trend Analysis
**Analysis**:
- Emerging technologies
- Industry shifts
- Skill demand changes
- Research breakthroughs

**Usage Context**: Students stay updated on industry trends relevant to their learning.

---

## 🧠 Advanced AI Engines

### 17. Contextual Intelligence Engine

**File**: `lib/sam-contextual-engine.ts`

**Purpose**: Understand conversation context for intelligent responses

**Core Capabilities**:

#### A. Intent Recognition
**Process**: Determines user intent from message:
- Question (seeking explanation)
- Help (stuck on problem)
- Feedback (commenting on content)
- Social (general conversation)

#### B. Context Gathering
**Process**: Gathers relevant context:
- Current course/chapter/section
- Recent learning history
- User profile (learning style, level)
- Conversation history

#### C. Response Generation
**Process**: Generates contextually appropriate response using gathered context

**Usage Context**: SAM chat provides contextually relevant and personalized responses.

---

### 18. Memory Engine

**File**: `lib/sam-memory-engine.ts`

**Purpose**: Maintain conversation history and long-term memory

**Core Capabilities**:

#### A. Conversation History
**Storage**:
- Recent conversation (last 10 messages)
- Key facts extracted from conversation
- Important decisions/agreements

#### B. Long-Term Memory
**Storage**:
- Student preferences stated in past conversations
- Recurring questions/issues
- Learning milestones discussed

#### C. Memory Retrieval
**Process**: Retrieves relevant memories based on current context

**Usage Context**: SAM remembers past interactions for continuity in conversations.

---

### 19. Adaptive Question Engine

**File**: `lib/sam-adaptive-question-engine.ts`

**Purpose**: Generate adaptive questions that adjust difficulty based on performance

**Core Capabilities**:

#### A. Difficulty Calibration
**Process**: Starts with medium difficulty, adjusts based on answers:
- Correct answer → Increase difficulty
- Incorrect answer → Decrease difficulty
- Target: Find student&apos;s current skill level

#### B. Question Generation
**Process**: Generates questions at specific difficulty levels using AI

#### C. Skill Assessment
**Output**: Precise skill level assessment based on adaptive questioning

**Usage Context**: Accurate skill assessments without overwhelming or boring students.

---

### 20. Semantic Search Engine

**File**: `lib/sam-semantic-search-engine.ts`

**Purpose**: Enable semantic search across course content

**Core Capabilities**:

#### A. Content Indexing
**Process**: Creates semantic embeddings of all content using AI

#### B. Semantic Search
**Process**: Finds content by meaning, not just keywords:
- Student searches &quot;how to loop through array&quot;
- Finds content about &quot;for loops&quot;, &quot;array iteration&quot;, &quot;forEach method&quot;

#### C. Answer Extraction
**Process**: Extracts specific answers from content based on questions

**Usage Context**: Students find relevant content even with imprecise search terms.

---

## 🎓 Specialized Learning Engines

### 21-35. Additional Engines

The following engines follow similar patterns but specialize in specific domains:

**21. Code Explanation Engine** (`lib/sam-code-explanation-engine.ts`): Explains code snippets in natural language

**22. Math Equation Engine** (`lib/sam-math-equation-engine.ts`): Solves and explains mathematical equations

**23. Career Guidance Engine** (`lib/sam-career-guidance-engine.ts`): Provides career path recommendations

**24. Skill Gap Engine** (`lib/sam-skill-gap-engine.ts`): Identifies skill gaps and recommends learning paths

**25. Certification Engine** (`lib/sam-certification-engine.ts`): Manages certification programs

**26. Onboarding Engine** (`lib/sam-onboarding-engine.ts`): Guides new users through platform

**27. Notification Engine** (`lib/sam-notification-engine.ts`): Manages intelligent notifications

**28. Scheduling Engine** (`lib/sam-scheduling-engine.ts`): Optimizes study schedules

**29. Research Engine** (`lib/sam-research-engine.ts`): Assists with research and citations

**30. Writing Assistant Engine** (`lib/sam-writing-assistant-engine.ts`): Helps improve writing

**31. Language Learning Engine** (`lib/sam-language-engine.ts`): Specialized for language learning

**32. Accessibility Engine** (`lib/sam-accessibility-engine.ts`): Ensures content accessibility

**33. Mobile Learning Engine** (`lib/sam-mobile-learning-engine.ts`): Optimizes for mobile devices

**34. Offline Learning Engine** (`lib/sam-offline-learning-engine.ts`): Enables offline learning

**35. Emotion Recognition Engine** (`lib/sam-emotion-recognition-engine.ts`): Advanced emotional state analysis

---

## 📖 Related Documentation

- [00-OVERVIEW.md](./00-OVERVIEW.md) - System overview
- [02-CORE-ENGINES.md](./02-CORE-ENGINES.md) - Core engine architecture
- [08-FILE-MAPPING.md](./08-FILE-MAPPING.md) - File locations
- [09-NPM-PACKAGE-GUIDE.md](./09-NPM-PACKAGE-GUIDE.md) - Package preparation

---

**Next Document**: [04-API-ROUTES.md](./04-API-ROUTES.md) - API endpoint documentation

**Maintained by**: Taxomind Development Team
**Status**: ✅ Active Development
