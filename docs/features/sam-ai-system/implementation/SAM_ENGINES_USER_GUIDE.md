# SAM AI Tutor - Complete User Guide for All Engines

## Table of Contents
1. [Overview](#overview)
2. [Accessing SAM Engines](#accessing-sam-engines)
3. [For Teachers/Administrators](#for-teachersadministrators)
4. [For Students](#for-students)
5. [Engine-Specific Guides](#engine-specific-guides)
6. [Integration Features](#integration-features)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

## Overview

SAM AI Tutor now includes 5 sophisticated engines that provide comprehensive educational intelligence:

1. **Market Analysis Engine** - Course market positioning and growth insights
2. **Bloom's Taxonomy Engine** - Cognitive depth and learning effectiveness analysis
3. **Advanced Exam Engine** - Adaptive testing with cognitive alignment
4. **Student Learning Dashboard** - Progress tracking and personalized recommendations
5. **Course Guide Engine** - Comprehensive course improvement insights

## Accessing SAM Engines

### Method 1: SAM Engines Dashboard (Recommended)

The easiest way to access all engines is through the unified dashboard:

```tsx
// Add to your page component
import { SAMEnginesDashboard } from '@/components/sam/sam-engines-dashboard';

// In your page
<SAMEnginesDashboard 
  userId={currentUser.id}
  courseId={selectedCourse?.id}
  role={currentUser.role}
/>
```

### Method 2: Direct Component Integration

For specific engine access in your application:

```tsx
// Student Dashboard
import { StudentDashboard } from '@/components/sam/student-dashboard';

<StudentDashboard userId={userId} courseId={courseId} />
```

### Method 3: API Integration

Direct API calls for programmatic access:

```typescript
// Example: Run market analysis
const response = await fetch('/api/sam/course-market-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    courseId: 'course-123',
    analysisType: 'comprehensive'
  })
});
```

## For Teachers/Administrators

### 1. Market Analysis Engine

**Purpose**: Understand your course's market position and growth potential

**Access Methods**:
```typescript
// Via Dashboard
Navigate to SAM Engines Dashboard > Market Analysis Engine > Run Analysis

// Via API
POST /api/sam/course-market-analysis
{
  "courseId": "your-course-id",
  "analysisType": "comprehensive",
  "includeRecommendations": true
}
```

**What You Get**:
- Market value score (0-100)
- Competitor analysis
- Pricing recommendations
- Growth predictions
- Brand strength assessment

**Example Usage**:
```typescript
// Get competitor data
GET /api/sam/course-market-analysis/competitors?courseId=your-course-id

// Add competitor for tracking
POST /api/sam/course-market-analysis/competitors
{
  "courseId": "your-course-id",
  "competitorData": {
    "title": "Competitor Course",
    "price": 99,
    "enrollmentCount": 500
  }
}
```

### 2. Bloom's Taxonomy Engine

**Purpose**: Evaluate cognitive depth of your course content

**Access Methods**:
```typescript
// Via Dashboard
Navigate to SAM Engines Dashboard > Bloom's Taxonomy Engine > Analyze Course

// Via API
POST /api/sam/blooms-analysis
{
  "courseId": "your-course-id",
  "depth": "detailed",
  "includeRecommendations": true
}
```

**What You Get**:
- Cognitive level distribution (Remember → Create)
- Learning pathway visualization
- Gap analysis
- Content recommendations
- Student impact predictions

### 3. Course Guide Engine

**Purpose**: Get comprehensive insights for course improvement

**Access Methods**:
```typescript
// Via Dashboard
Navigate to SAM Engines Dashboard > Course Guide Engine > Generate Guide

// Via API
POST /api/sam/course-guide
{
  "courseId": "your-course-id",
  "includeComparison": true,
  "includeProjections": true
}
```

**What You Get**:
- Depth, engagement, and market acceptance metrics
- Competitive analysis
- Success predictions
- Prioritized action plan
- Implementation roadmap

**Export Options**:
```typescript
// Export as HTML report
GET /api/sam/course-guide?courseId=your-course-id&format=html

// Get teacher insights
GET /api/sam/course-guide/insights?teacherId=your-id

// Get detailed recommendations
POST /api/sam/course-guide/recommendations
{
  "courseId": "your-course-id",
  "focusArea": "all", // or "content", "engagement", "marketing"
  "detailed": true
}
```

### 4. Advanced Exam Engine

**Purpose**: Create adaptive exams aligned with Bloom's taxonomy

**Access Methods**:
```typescript
// Via Dashboard
Navigate to SAM Engines Dashboard > Advanced Exam Engine > Generate Exam

// Via API
POST /api/sam/exam-engine
{
  "courseId": "your-course-id",
  "sectionIds": ["section1", "section2"],
  "config": {
    "totalQuestions": 20,
    "duration": 60,
    "bloomsDistribution": {
      "REMEMBER": 20,
      "UNDERSTAND": 25,
      "APPLY": 25,
      "ANALYZE": 15,
      "EVALUATE": 10,
      "CREATE": 5
    },
    "difficultyDistribution": {
      "EASY": 30,
      "MEDIUM": 50,
      "HARD": 20
    },
    "questionTypes": ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"],
    "adaptiveMode": true
  }
}
```

**Question Bank Management**:
```typescript
// Add questions to bank
POST /api/sam/exam-engine/question-bank
{
  "courseId": "your-course-id",
  "subject": "Mathematics",
  "topic": "Algebra",
  "questions": [
    {
      "text": "What is 2x + 3 when x = 5?",
      "questionType": "SHORT_ANSWER",
      "bloomsLevel": "APPLY",
      "difficulty": "EASY",
      "correctAnswer": "13",
      "explanation": "Substitute x=5: 2(5) + 3 = 10 + 3 = 13"
    }
  ]
}

// Query question bank
GET /api/sam/exam-engine/question-bank?courseId=your-course-id&bloomsLevel=APPLY
```

## For Students

### 1. Student Learning Dashboard

**Purpose**: Track your cognitive development and learning progress

**Access Methods**:
```typescript
// Via Dashboard
Navigate to SAM Engines Dashboard > Student Learning Dashboard > Open Dashboard

// Direct Navigation
/student/dashboard

// Component Integration
<StudentDashboard userId={userId} courseId={courseId} />
```

**Features Available**:
- **Progress Tab**: Bloom's taxonomy progress visualization
- **Performance Tab**: Detailed performance metrics and trends
- **Learning Path Tab**: Personalized learning journey
- **Skills Tab**: Cognitive skills inventory

### 2. Adaptive Testing

**Purpose**: Take personalized exams that adapt to your level

**Access During Exam**:
```typescript
// The exam automatically adapts based on your responses
// After each question, the system adjusts difficulty

// Track adaptive metrics
GET /api/sam/exam-engine/adaptive?attemptId=your-attempt-id
```

### 3. Study Guide Generation

**Purpose**: Get personalized study recommendations

**Access Methods**:
```typescript
// Generate study guide
POST /api/sam/exam-engine/study-guide
{
  "courseId": "your-course-id",
  "focusAreas": ["ANALYZE", "EVALUATE"],
  "includeWeakAreas": true
}

// View past study guides
GET /api/sam/exam-engine/study-guide?courseId=your-course-id
```

## Engine-Specific Guides

### Market Analysis Engine Details

**Key Metrics Explained**:
- **Market Value (0-100)**: Overall course market potential
- **Demand Score (0-100)**: Current market demand for your topic
- **Competition Level**: Low/Medium/High based on competitor count
- **Price Optimality**: How well your price fits the market
- **Growth Rate**: Projected enrollment growth percentage

**Recommendations Types**:
1. **Pricing**: Optimal price points based on market
2. **Content**: What to add to compete better
3. **Marketing**: How to position your course
4. **Timing**: When to launch or update

### Bloom's Taxonomy Engine Details

**Cognitive Levels**:
1. **Remember** (🧠): Recall facts and basic concepts
2. **Understand** (💡): Explain ideas or concepts
3. **Apply** (⚙️): Use information in new situations
4. **Analyze** (🔍): Draw connections among ideas
5. **Evaluate** (⚖️): Justify a stand or decision
6. **Create** (🎨): Produce new or original work

**Balance Types**:
- **Well-balanced**: Good distribution across all levels
- **Bottom-heavy**: Too much focus on lower levels
- **Top-heavy**: May be too advanced for beginners

### Exam Engine Configuration

**Adaptive Mode Settings**:
```typescript
{
  "adaptiveMode": true,
  "startingDifficulty": "MEDIUM",
  "minQuestions": 15,
  "maxQuestions": 30,
  "adjustmentThreshold": 3  // Consecutive correct/incorrect
}
```

**Question Types**:
- `MULTIPLE_CHOICE`: 4 options with single correct answer
- `TRUE_FALSE`: Binary choice questions
- `SHORT_ANSWER`: Text input (1-2 sentences)
- `ESSAY`: Long-form answers
- `FILL_IN_THE_BLANK`: Complete the sentence

## Integration Features

### Running Integrated Analysis

**Purpose**: Get insights from all engines combined

**Access**:
```typescript
POST /api/sam/integrated-analysis
{
  "courseId": "your-course-id",
  "userId": "user-id",
  "analysisDepth": "comprehensive",
  "enginePreferences": {
    "enableMarketAnalysis": true,
    "enableBloomsTracking": true,
    "enableAdaptiveLearning": true,
    "enableCourseGuide": true
  }
}
```

**What You Get**:
- Cross-engine correlations
- Prioritized recommendations
- Unified action plan
- Success predictions

### SAM Context Integration

The engines automatically integrate with SAM's conversational AI:

```typescript
// When chatting with SAM, the AI has access to:
- Your learning progress (Bloom's levels)
- Course quality metrics
- Personalized recommendations
- Adaptive learning insights
```

## API Reference

### Common Parameters

All API endpoints accept these common headers:
```typescript
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

### Response Format

All endpoints return:
```typescript
{
  "success": boolean,
  "data": object,
  "metadata": {
    "timestamp": string,
    "userId": string,
    "courseId": string
  },
  "error": string // Only on failure
}
```

### Rate Limits
- Market Analysis: 10 requests per hour per course
- Bloom's Analysis: 20 requests per hour
- Exam Generation: 5 exams per hour
- Study Guide: 10 requests per day

## Troubleshooting

### Common Issues

1. **"Course not found" error**
   - Ensure courseId is valid
   - Check user has access to the course

2. **"Unauthorized" error**
   - Verify authentication token
   - Check user role permissions

3. **Analysis takes too long**
   - Comprehensive analysis can take 30-60 seconds
   - Use basic/detailed mode for faster results

4. **Missing recommendations**
   - Ensure course has sufficient content
   - Run analysis with includeRecommendations: true

### Debug Mode

Enable debug logging:
```typescript
// Add to API calls
{
  "debug": true,
  "verbose": true
}
```

### Support

For issues or questions:
1. Check the integration logs in SAM interactions
2. Review error messages in browser console
3. Contact support with courseId and timestamp

## Best Practices

1. **Regular Analysis**: Run integrated analysis monthly
2. **Act on Recommendations**: Implement high-priority items first
3. **Track Progress**: Monitor metrics after changes
4. **Student Engagement**: Encourage dashboard usage
5. **Iterative Improvement**: Use insights for continuous enhancement

---

This comprehensive guide ensures you can fully utilize all SAM AI Tutor engines to enhance your educational experience.