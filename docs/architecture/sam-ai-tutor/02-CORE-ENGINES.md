# SAM AI Tutor - Core Engines Architecture

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Purpose**: Detailed core engine abstractions and patterns

---

## 🎯 Overview

SAM's engine architecture follows a **hierarchical inheritance pattern** where a base engine provides common functionality, and specialized engines extend it with domain-specific logic. This design ensures:

- **Code Reusability**: Common features implemented once
- **Consistency**: Standardized error handling, logging, and caching
- **Extensibility**: Easy to add new engines without affecting existing ones
- **Maintainability**: Clear separation of concerns

---

## 🏗️ Base Engine Architecture (SAMBaseEngine)

### Purpose
Abstract foundation providing essential infrastructure for all SAM engines:
- Initialization framework
- Database operation wrappers
- Caching mechanisms
- Performance monitoring
- Error handling patterns
- Input validation helpers

### Core Responsibilities

#### 1. **Initialization Management**
```
Pattern: Template Method
- Initialize engine once on first use
- Handle initialization errors gracefully
- Track initialization state to prevent redundant init
- Abstract method for child-specific initialization
```

**Abstract Concept**:
- Engine starts in uninitialized state
- First operation triggers initialization
- Child engines implement their specific setup (e.g., loading AI models, setting up connections)
- Errors during initialization are caught and logged
- Failed initialization prevents further operations

#### 2. **Safe Database Operations**
```
Pattern: Wrapper with Fallback
- Wrap database calls in try-catch
- Log errors without exposing sensitive data
- Provide optional fallback values
- Continue operation gracefully when possible
```

**Protection Features**:
- Prevents database errors from crashing the engine
- Logging captures context without exposing user data
- Fallback values allow degraded operation
- Errors are tracked for monitoring

#### 3. **Interaction Recording**
```
Pattern: Fire-and-Forget with Error Suppression
- Record user interactions for analytics
- Never fail primary operation if recording fails
- Store context, action, timestamp
- Tag with engine name for attribution
```

**Use Cases**:
- Track content generation requests
- Log analysis operations
- Record personalization applications
- Monitor feature usage

#### 4. **Input Validation**
```
Pattern: Validator Function Pattern
- Generic validation helper
- Throws on invalid input
- Type-safe validation
- Prevents processing of malicious/malformed data
```

**Validation Types**:
- Required field checks
- Type validation
- Range validation
- Format validation (email, URL, etc.)
- Business rule validation

#### 5. **Caching System**
```
Pattern: In-Memory Cache with TTL
- Key-value storage in memory
- Time-To-Live expiration (default: 5 minutes)
- Probabilistic cleanup (10% chance on cache access)
- Factory function for cache misses
```

**Cache Strategy**:
- Check cache first (fast path)
- If hit and not expired, return cached value
- If miss or expired, execute factory function
- Store result with expiration timestamp
- Periodic cleanup of expired entries

**Benefits**:
- Reduces AI API calls (cost savings)
- Faster response times for repeated queries
- Configurable TTL per operation
- Automatic memory management

#### 6. **Performance Monitoring**
```
Pattern: Decorator with Timing
- Measure operation duration
- Log slow operations (> 1 second)
- Capture errors with timing context
- Enable performance profiling
```

**Metrics Tracked**:
- Operation start time
- Operation end time
- Duration in milliseconds
- Success/failure status
- Error details if failed

#### 7. **Sanitization Helpers**
```
Pattern: Input Cleaning
- Strip HTML/script tags (XSS prevention)
- Limit string length (prevent overload)
- Validate and clamp numbers
- Whitespace normalization
```

**Security Benefits**:
- Prevents XSS attacks
- Protects against buffer overflows
- Prevents integer overflow/underflow
- Sanitizes user-generated content

#### 8. **Pagination Support**
```
Pattern: Slice and Metadata
- Paginate any array
- Return items for current page
- Provide metadata (total, page count, navigation flags)
- Zero-indexed page numbers
```

**Pagination Response**:
- `items`: Current page items
- `total`: Total item count
- `page`: Current page number
- `totalPages`: Total pages
- `hasNext`: Has next page flag
- `hasPrev`: Has previous page flag

#### 9. **Error Creation Helper**
```
Pattern: Typed Error Factory
- Create standardized errors
- Type-safe error categories
- Consistent error format
- Easy error handling in consumers
```

**Error Types**:
- `NOT_FOUND`: Resource doesn't exist
- `VALIDATION`: Invalid input
- `PERMISSION`: Unauthorized access
- `INTERNAL`: System error

---

## 🔧 Specialized Engine Patterns

### 1. **Bloom's Taxonomy Analysis Engine**

#### Purpose
Analyze educational content across 6 cognitive levels defined by Bloom's Taxonomy (Anderson & Krathwohl, 2001).

#### Core Capabilities

**A. Cognitive Level Analysis**
```
Process:
1. Accept course/chapter/section content
2. Send to Anthropic Claude API for analysis
3. Classify content into 6 levels:
   - REMEMBER (recall facts)
   - UNDERSTAND (explain concepts)
   - APPLY (use in new situations)
   - ANALYZE (break down, find patterns)
   - EVALUATE (justify, critique)
   - CREATE (design, construct)
4. Calculate distribution percentages
5. Determine cognitive depth score (0-100)
6. Identify balance (well-balanced/bottom-heavy/top-heavy)
```

**B. Content Hashing for Cache**
```
Strategy:
- Generate hash from content text
- Use hash as cache key
- Reuse analysis for identical content
- Invalidate cache when content changes
```

**C. Learning Pathway Generation**
```
Output:
- Current cognitive path (levels student has mastered)
- Recommended path (optimal progression)
- Learning gaps (missing cognitive skills)
- Skill alignment with career paths
```

**D. Recommendation Engine**
```
Provides:
- Content adjustments (add higher-level questions)
- Assessment changes (balance difficulty)
- Activity suggestions (projects for CREATE level)
- Student impact predictions (skills developed)
```

#### Bloom's Taxonomy Levels Explained

| Level | Cognitive Action | Example Keywords | Student Activity |
|-------|------------------|------------------|------------------|
| **REMEMBER** | Recall facts | Define, list, name, identify | Memorize definitions |
| **UNDERSTAND** | Explain concepts | Describe, explain, summarize | Paraphrase concepts |
| **APPLY** | Use knowledge | Apply, demonstrate, solve | Use formulas |
| **ANALYZE** | Break down | Analyze, compare, contrast | Find patterns |
| **EVALUATE** | Judge/critique | Evaluate, justify, critique | Assess quality |
| **CREATE** | Produce new | Design, construct, create | Build projects |

#### Key Interfaces
```typescript
// Distribution across 6 levels (percentages sum to 100)
BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

// Complete analysis response
BloomsAnalysisResponse {
  courseLevel: {
    distribution: BloomsDistribution;
    cognitiveDepth: number;  // 0-100 score
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  };
  chapterAnalysis: ChapterBloomsAnalysis[];
  learningPathway: {
    current: CognitivePath;
    recommended: CognitivePath;
    gaps: LearningGap[];
  };
  recommendations: {...};
  studentImpact: {...};
}
```

### 2. **Personalization Engine**

#### Purpose
Create individualized learning experiences based on student behavior, learning style, cognitive capacity, and emotional state.

#### Core Capabilities

**A. Learning Style Detection**
```
Process:
1. Analyze content interaction patterns
2. Analyze assessment performance patterns
3. Analyze session behavior patterns
4. Calculate style strengths for 5 learning styles:
   - Visual (diagrams, infographics, videos)
   - Auditory (podcasts, lectures, discussions)
   - Kinesthetic (hands-on, interactive simulations)
   - Reading-Writing (articles, documents, notes)
   - Mixed (combination of above)
5. Determine primary and secondary styles
6. Calculate confidence score
7. Cache and store profile
```

**Evidence Factors**:
- Video preference over text
- High engagement with interactive elements
- Better performance on visual assessments
- Session duration and focus consistency

**B. Cognitive Load Optimization**
```
Process:
1. Assess current content cognitive load
2. Get student's cognitive capacity (based on performance history)
3. Compare load vs capacity
4. If overload: Simplify content
   - Break down concepts
   - Add visual aids
   - Include practice breaks
5. If underload: Enrich content
   - Add challenging scenarios
   - Include deeper analysis
   - Provide real-world applications
```

**Load Factors**:
- Word count and complexity
- Concept density
- Multimedia elements count
- Interactivity requirements

**C. Emotional State Recognition**
```
Process:
1. Analyze recent interactions (last 24 hours)
2. Extract emotion indicators:
   - Response time patterns
   - Error patterns
   - Help-seeking behavior
   - Progress velocity
   - Session duration changes
3. Weight indicators to infer emotion
4. Determine current emotion:
   - Motivated
   - Frustrated
   - Confused
   - Confident
   - Anxious
   - Neutral
5. Analyze emotional trend (improving/stable/declining)
6. Generate personalized recommendations
```

**Indicator Examples**:
- Slow response times → Confused/Frustrated
- High error rate → Frustrated/Anxious
- Frequent help requests → Confused/Anxious
- Fast progress → Motivated/Confident
- Shortened sessions → Frustrated/Anxious

**D. Motivation Pattern Analysis**
```
Process:
1. Identify intrinsic motivation factors:
   - Mastery orientation (improvement focus)
   - Intellectual curiosity (explores beyond requirements)
   - Autonomy preference (self-directed learning)
2. Identify extrinsic motivation factors:
   - Achievement recognition (badges, rewards)
   - Social comparison (leaderboards)
   - External pressure (deadlines)
3. Calculate current motivation level (0-1)
4. Identify triggers (what motivates)
5. Identify barriers (what demotivates)
6. Calculate sustainability score
```

**Sustainability Factors**:
- Intrinsic motivation is more sustainable
- Consistency in learning patterns
- Adequate breaks to prevent burnout

**E. Personalized Learning Path Generation**
```
Process:
1. Define learning objectives based on:
   - Skill gaps
   - Career goals
   - Course completion criteria
2. Create learning nodes:
   - Content nodes (lessons)
   - Assessment nodes (quizzes)
   - Project nodes (capstone)
   - Break nodes (rest periods)
3. Determine optimal sequencing
4. Calculate difficulty progression
5. Estimate total duration
6. Generate alternative paths (fast track, thorough)
7. Validate path integrity
```

**Path Features**:
- Prerequisites tracked
- Conditional edges (skip if high performance)
- Estimated time per node
- Difficulty escalation
- Alternative routes for different learning speeds

### 3. **Analytics Engine** (Abstract Pattern)

#### Purpose
Track, aggregate, and analyze learning metrics across the platform.

#### Typical Responsibilities
```
- User engagement metrics (session duration, frequency)
- Content effectiveness metrics (completion rates, time spent)
- Assessment analytics (average scores, difficulty analysis)
- Learning velocity (pace of progress)
- Retention rates (knowledge retention over time)
- Predictive analytics (dropout risk, success likelihood)
```

#### Common Patterns
```
1. Time-series data collection
2. Aggregation by time period (daily, weekly, monthly)
3. Cohort analysis (compare user groups)
4. Trend detection (improving, declining patterns)
5. Anomaly detection (unusual behavior)
6. Visualization data preparation (charts, graphs)
```

### 4. **Generation Engine** (Abstract Pattern)

#### Purpose
Generate educational content using AI (courses, chapters, assessments, resources).

#### Typical Process Flow
```
1. Receive generation request (topic, level, objectives)
2. Construct AI prompt with:
   - Content type specification
   - Learning objectives
   - Difficulty level
   - Style guidelines
3. Send to Anthropic Claude API
4. Parse AI response
5. Validate generated content:
   - Check format compliance
   - Verify learning objectives addressed
   - Validate length and structure
6. Store in database
7. Return generated content with metadata
```

#### Content Types Generated
```
- Course outlines (titles, descriptions, structure)
- Chapter content (text, learning objectives, prerequisites)
- Section content (detailed lessons, examples)
- Assessments (questions, answer choices, explanations)
- Learning resources (blog posts, code examples, videos)
```

### 5. **Predictive Engine** (Abstract Pattern)

#### Purpose
Forecast student outcomes and provide early intervention recommendations.

#### Prediction Types
```
- Course completion likelihood
- Expected final grade
- Time to completion
- At-risk student identification
- Dropout probability
- Skill mastery timeline
```

#### Prediction Process
```
1. Collect student historical data
2. Extract features:
   - Engagement patterns
   - Performance trends
   - Learning velocity
   - Session consistency
3. Apply predictive model (regression, classification)
4. Generate confidence score
5. Provide intervention recommendations if risk detected
```

### 6. **Achievement Engine** (Abstract Pattern)

#### Purpose
Manage gamification elements (points, badges, streaks, leaderboards).

#### Gamification Elements
```
- Points system (earn for completing activities)
- Badges (milestones, special achievements)
- Streaks (consecutive days of learning)
- Leaderboards (competition, motivation)
- Progress visualization (progress bars, charts)
- Level system (beginner → intermediate → expert)
```

#### Achievement Triggers
```
- Content completion
- Assessment high scores
- Streak maintenance
- Helping peers
- Content creation
- Community contribution
```

---

## 🔄 Engine Lifecycle

### Initialization Phase
```
1. Engine instance created
2. initialized = false
3. First operation called
4. Check initialized flag
5. If false: call performInitialization()
6. Mark initialized = true
7. Proceed with operation
```

### Operation Phase
```
1. Validate input
2. Check cache (if applicable)
3. Perform core logic:
   - Database queries
   - AI API calls
   - Calculations
4. Monitor performance
5. Handle errors gracefully
6. Update cache (if applicable)
7. Record interaction (fire-and-forget)
8. Return result
```

### Error Handling Phase
```
1. Catch exceptions
2. Log error with context
3. Determine error type
4. Return appropriate error response
5. Never expose internal details
6. Provide actionable error messages
```

---

## 🎯 Engine Design Principles

### 1. **Single Responsibility**
Each engine handles one aspect of the learning experience:
- Bloom's analysis = cognitive level assessment
- Personalization = individual adaptation
- Analytics = metrics and insights
- Generation = content creation

### 2. **Open-Closed Principle**
- Open for extension (add new engines)
- Closed for modification (don't change base engine)

### 3. **Liskov Substitution**
Any specialized engine can be used where base engine is expected.

### 4. **Interface Segregation**
Engines expose only relevant methods for their domain.

### 5. **Dependency Inversion**
Engines depend on abstractions (database interface, AI provider interface), not concrete implementations.

---

## 📊 Performance Characteristics

### Caching Impact
- **Cache Hit**: < 10ms response time
- **Cache Miss**: 2-5 seconds (AI API call)
- **Target Hit Rate**: 70%+

### Resource Usage
- **Memory**: In-memory cache ~10MB per engine
- **Database**: Connection pooling prevents exhaustion
- **AI API**: Rate-limited to prevent overload

### Scalability
- **Stateless Design**: Engines can run on any server
- **Horizontal Scaling**: Add more instances as needed
- **No Shared State**: Each request independent

---

## 🔒 Security Features

### Input Sanitization
- Strip HTML/script tags (XSS prevention)
- Length limits (DoS prevention)
- Type validation (injection prevention)

### Error Handling
- Never expose stack traces
- Generic error messages for users
- Detailed logs for developers (in secure location)

### Data Protection
- Sensitive data never cached
- User PII handled according to policy
- Audit trails for compliance

---

## 🚀 NPM Package Considerations

### Export Strategy
```typescript
// Base engine
export { SAMBaseEngine } from '@taxomind/sam-ai-tutor/core';

// Specialized engines
export { BloomsAnalysisEngine } from '@taxomind/sam-ai-tutor/engines/blooms';
export { PersonalizationEngine } from '@taxomind/sam-ai-tutor/engines/personalization';

// Types
export * from '@taxomind/sam-ai-tutor/types';
```

### Configuration Interface
```typescript
interface SAMConfig {
  anthropic: {
    apiKey: string;
    model: string;
  };
  database: {
    url: string;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

### Usage Example
```typescript
import { BloomsAnalysisEngine } from '@taxomind/sam-ai-tutor';

const engine = new BloomsAnalysisEngine(config);
const analysis = await engine.analyzeCourse(courseId);
console.log(analysis.courseLevel.distribution);
```

---

## 📖 Related Documentation

- [00-OVERVIEW.md](./00-OVERVIEW.md) - System overview
- [03-SPECIALIZED-ENGINES.md](./03-SPECIALIZED-ENGINES.md) - Individual engine details
- [04-API-ROUTES.md](./04-API-ROUTES.md) - API endpoint documentation
- [07-WORKFLOWS.md](./07-WORKFLOWS.md) - Data flow diagrams

---

**Next Document**: [03-SPECIALIZED-ENGINES.md](./03-SPECIALIZED-ENGINES.md) - Detailed documentation of each specialized engine

**Maintained by**: Taxomind Development Team
**Status**: ✅ Active Development
