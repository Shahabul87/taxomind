# Dynamic Content Reordering System Implementation Guide

## Overview

The Dynamic Content Reordering System intelligently adapts the sequence of learning content based on individual student profiles, learning patterns, and contextual factors. It uses advanced algorithms to optimize content delivery for engagement, comprehension, and completion rates.

## Architecture

### Core Components

1. **Adaptive Content Types** (`lib/adaptive-content/types.ts`)
   - Comprehensive type system for content items, student profiles, and reordering strategies
   - Defines 9 different reordering algorithms and adaptation mechanisms
   - Includes analytics and feedback interfaces

2. **Reordering Engine** (`lib/adaptive-content/reordering-engine.ts`)
   - Core algorithmic engine with 9 specialized reordering strategies
   - Multi-factor optimization with configurable weights and constraints
   - Alternative sequence generation and impact estimation

3. **Adaptive Content Service** (`lib/adaptive-content/adaptive-content-service.ts`)
   - Main interface for content adaptation operations
   - Student profile building and strategy selection
   - Caching and performance optimization

4. **API Endpoint** (`app/api/adaptive-content/route.ts`)
   - RESTful API for content reordering operations
   - Real-time analytics and feedback collection
   - Integration with existing authentication and database systems

## Key Features

### Reordering Algorithms

1. **Difficulty Adaptive** - Adjusts content order based on student ability
2. **Engagement Optimized** - Prioritizes high-engagement content
3. **Time Constrained** - Optimizes for limited session time
4. **Learning Style Matched** - Aligns with visual/auditory/kinesthetic preferences
5. **Prerequisite Optimized** - Ensures proper knowledge dependencies
6. **Spaced Repetition** - Interleaves review and new content
7. **Cognitive Load Balanced** - Manages mental effort distribution
8. **Performance Based** - Focuses on struggling areas
9. **Hybrid Multi-Factor** - Combines multiple optimization criteria

### Student Profile Components

- **Learning Style**: Visual, auditory, kinesthetic, reading preferences
- **Performance Metrics**: Completion rates, engagement scores, learning velocity
- **Learning Context**: Time constraints, motivation, energy levels
- **Adaptation History**: Previous adaptations and their effectiveness

### Adaptive Factors

- **Engagement Score**: Historical engagement with content (0-100)
- **Difficulty Rating**: Perceived difficulty level (0-1)
- **Success Rate**: Completion success rate (0-1)
- **Struggle Indicators**: Detailed struggle pattern analysis
- **Time Factors**: Time to complete, replay rates, skip rates

## Quick Start

### 1. Get Adaptive Content Sequence

```bash
# Get optimized content sequence for a student
curl -X GET "/api/adaptive-content?action=get_adaptive_sequence&courseId=course123&sessionTime=60" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Reorder Content with Specific Strategy

```bash
# Request content reordering with specific parameters
curl -X POST "/api/adaptive-content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "reorder_content",
    "courseId": "course123",
    "data": {
      "chapterId": "chapter456",
      "sessionTime": 45,
      "urgency": "high",
      "strategyId": "engagement_optimized"
    }
  }'
```

### 3. Record Student Feedback

```bash
# Submit feedback on adaptation effectiveness
curl -X POST "/api/adaptive-content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "record_feedback",
    "courseId": "course123",
    "data": {
      "sequenceId": "seq_student123_1234567890",
      "feedback": {
        "rating": 4,
        "helpful": true,
        "engaging": true,
        "comments": "The reordered content felt much more natural to follow"
      }
    }
  }'
```

## Development Usage

### Programmatic Content Adaptation

```typescript
import { AdaptiveContentService } from '@/lib/adaptive-content/adaptive-content-service';
import { ReorderingRequest } from '@/lib/adaptive-content/types';

const adaptiveService = new AdaptiveContentService();

// Create reordering request
const request: ReorderingRequest = {
  studentId: 'student123',
  courseId: 'course456',
  chapterId: 'chapter789',
  context: {
    sessionTime: 60,
    currentProgress: 0.4,
    recentPerformance: {
      lastSessionEngagement: 72,
      recentCompletionRate: 0.85,
      strugglingTopics: ['advanced-algorithms'],
      strongTopics: ['basic-concepts'],
      learningTrend: 'improving'
    },
    immediateGoals: ['complete_chapter'],
    urgency: 'medium'
  }
};

// Get adaptive content sequence
const result = await adaptiveService.getAdaptiveContentSequence(request);

console.log('Reordered content:', result.sequence.adaptedSequence);
console.log('Adaptations made:', result.sequence.adaptations.length);
console.log('Strategy used:', result.sequence.strategy.name);
console.log('Expected impact:', result.estimatedImpact);
```

### Custom Reordering Engine Usage

```typescript
import { ContentReorderingEngine } from '@/lib/adaptive-content/reordering-engine';

const engine = new ContentReorderingEngine();

// Define custom strategy
const customStrategy: ReorderingStrategy = {
  id: 'custom_strategy',
  name: 'Custom Learning Strategy',
  description: 'Tailored for specific learning objectives',
  algorithm: 'hybrid_multi_factor',
  parameters: {
    weights: {
      difficulty: 0.3,
      engagement: 0.4,
      prerequisite: 0.2,
      learningStyle: 0.1,
      timeConstraint: 0.0,
      cognitiveLoad: 0.0,
      performance: 0.0,
      novelty: 0.0
    },
    constraints: {
      maxPositionShift: 3,
      preserveSequentialContent: true,
      respectHardPrerequisites: true,
      maintainOriginalFlow: 0.4,
      maxCognitiveLoad: 'medium',
      sessionTimeLimit: 60
    },
    optimization: {
      objective: 'maximize_engagement',
      iterations: 100,
      convergenceThreshold: 0.005
    }
  },
  applicabilityRules: [],
  effectiveness: {
    completionImprovement: 0,
    engagementImprovement: 0,
    timeReduction: 0,
    studentSatisfaction: 0,
    usageFrequency: 0,
    successRate: 0
  }
};

// Apply custom reordering
const result = await engine.reorderContent(
  request,
  originalContent,
  studentProfile,
  customStrategy
);
```

## API Reference

### GET Endpoints

#### Get Adaptive Content Sequence
```http
GET /api/adaptive-content?action=get_adaptive_sequence&courseId={id}
```

**Parameters:**
- `courseId` (required): Course identifier
- `chapterId` (optional): Specific chapter to reorder
- `sectionId` (optional): Specific section to reorder
- `sessionTime` (optional): Available session time in minutes (default: 60)
- `urgency` (optional): Session urgency level (low/medium/high, default: medium)
- `cache` (optional): Use cached results (default: true)

**Response:**
```json
{
  "success": true,
  "result": {
    "sequenceId": "seq_student123_1234567890",
    "originalCount": 12,
    "adaptedCount": 12,
    "adaptations": 5,
    "strategy": "Engagement Optimized",
    "estimatedImpact": {
      "completionProbability": 0.85,
      "engagementScore": 82,
      "learningEfficiency": 0.78,
      "timeToCompletion": 45,
      "retentionProbability": 0.73
    },
    "rationale": {
      "strategy": "Engagement Optimized",
      "keyFactors": [
        {
          "factor": "Learning Style Preference",
          "importance": 0.8,
          "influence": 0.6,
          "description": "Optimized for visual learning style"
        }
      ],
      "confidence": 0.85
    },
    "adaptedSequence": [
      {
        "id": "section123",
        "title": "Introduction to React Hooks",
        "type": "video",
        "originalPosition": 3,
        "currentPosition": 0,
        "duration": 25,
        "difficulty": "intermediate",
        "cognitiveLoad": "medium",
        "engagementScore": 85
      }
    ],
    "alternatives": [
      {
        "strategy": "difficulty_adaptive",
        "score": 0.78,
        "description": "Alternative approach using difficulty adaptive optimization",
        "sequenceLength": 12
      }
    ]
  }
}
```

#### Get Analytics
```http
GET /api/adaptive-content?action=get_analytics&courseId={id}
```

**Parameters:**
- `courseId` (required): Course identifier
- `startDate` (optional): Start date for analytics range
- `endDate` (optional): End date for analytics range

**Response:**
```json
{
  "success": true,
  "analytics": {
    "summary": {
      "totalAdaptations": 1247,
      "successRate": 0.83,
      "studentSatisfaction": 4.2,
      "adoptionRate": 0.75
    },
    "improvements": {
      "engagement": 18,
      "completion": 22,
      "time": 12,
      "retention": 15
    },
    "strategyEffectiveness": {
      "engagement_optimized": 0.85,
      "difficulty_adaptive": 0.78,
      "time_constrained": 0.72,
      "learning_style_matched": 0.80
    },
    "insights": [
      "High success rate of 83.0% indicates effective adaptations",
      "Significant engagement improvement of 18% observed",
      "engagement_optimized strategy shows highest effectiveness at 85.0%"
    ]
  }
}
```

#### Get Available Strategies
```http
GET /api/adaptive-content?action=get_strategies
```

**Response:**
```json
{
  "success": true,
  "strategies": [
    {
      "id": "engagement_optimized",
      "name": "Engagement Optimized",
      "description": "Prioritizes content based on historical engagement patterns",
      "algorithm": "engagement_optimized",
      "bestFor": "Students with low engagement scores",
      "expectedImprovements": {
        "engagement": "+25%",
        "completion": "+15%",
        "satisfaction": "+20%"
      }
    }
  ]
}
```

### POST Endpoints

#### Reorder Content
```http
POST /api/adaptive-content
{
  "action": "reorder_content",
  "courseId": "course123",
  "data": {
    "chapterId": "chapter456",
    "sessionTime": 45,
    "urgency": "high",
    "strategyId": "engagement_optimized"
  }
}
```

#### Record Feedback
```http
POST /api/adaptive-content
{
  "action": "record_feedback",
  "courseId": "course123",
  "data": {
    "sequenceId": "seq_student123_1234567890",
    "feedback": {
      "rating": 4,
      "helpful": true,
      "tooEasy": false,
      "tooHard": false,
      "confusing": false,
      "engaging": true,
      "comments": "The reordered content felt much more natural"
    }
  }
}
```

#### Update Student Preferences
```http
POST /api/adaptive-content
{
  "action": "update_preferences",
  "courseId": "course123",
  "data": {
    "learningStyle": {
      "visual": 0.8,
      "auditory": 0.3,
      "kinesthetic": 0.6
    },
    "difficultyPreference": "intermediate",
    "sessionLength": 45,
    "contentTypePreferences": {
      "video": 0.9,
      "text": 0.6,
      "interactive": 0.8
    }
  }
}
```

## Integration Examples

### React Component for Adaptive Content

```jsx
import { useState, useEffect } from 'react';

function AdaptiveContentViewer({ courseId, chapterId }) {
  const [adaptedContent, setAdaptedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function fetchAdaptedContent() {
      try {
        const response = await fetch(
          `/api/adaptive-content?action=get_adaptive_sequence&courseId=${courseId}&chapterId=${chapterId}&sessionTime=60`
        );
        const data = await response.json();
        setAdaptedContent(data.result);
      } catch (error) {
        console.error('Failed to fetch adapted content:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdaptedContent();
  }, [courseId, chapterId]);

  const handleFeedback = async (rating, helpful, engaging) => {
    try {
      await fetch('/api/adaptive-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_feedback',
          courseId,
          data: {
            sequenceId: adaptedContent.sequenceId,
            feedback: { rating, helpful, engaging }
          }
        })
      });
      setFeedback({ rating, helpful, engaging });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (loading) return <div>Loading adaptive content...</div>;
  if (!adaptedContent) return <div>No content available</div>;

  return (
    <div className="adaptive-content-viewer">
      <div className="adaptation-summary">
        <h3>Content Optimized for You</h3>
        <p>Strategy: {adaptedContent.strategy}</p>
        <p>Adaptations: {adaptedContent.adaptations} changes made</p>
        <div className="expected-impact">
          <span>Expected engagement: +{((adaptedContent.estimatedImpact.engagementScore - 70) / 70 * 100).toFixed(0)}%</span>
          <span>Completion probability: {(adaptedContent.estimatedImpact.completionProbability * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="content-sequence">
        {adaptedContent.adaptedSequence.map((item, index) => (
          <div key={item.id} className="content-item">
            <div className="item-header">
              <h4>{item.title}</h4>
              <div className="item-metadata">
                <span className="type">{item.type}</span>
                <span className="difficulty">{item.difficulty}</span>
                <span className="duration">{item.duration}min</span>
                {item.originalPosition !== item.currentPosition && (
                  <span className="moved">Moved from position {item.originalPosition + 1}</span>
                )}
              </div>
            </div>
            <div className="engagement-indicator">
              <div 
                className="engagement-bar" 
                style={{ width: `${item.engagementScore}%` }}
              />
              <span>{item.engagementScore}% engagement</span>
            </div>
          </div>
        ))}
      </div>

      {adaptedContent.alternatives && (
        <div className="alternatives">
          <h4>Alternative Approaches</h4>
          {adaptedContent.alternatives.map((alt, index) => (
            <div key={index} className="alternative">
              <span className="strategy">{alt.strategy}</span>
              <span className="score">Score: {(alt.score * 100).toFixed(0)}%</span>
              <span className="description">{alt.description}</span>
            </div>
          ))}
        </div>
      )}

      <div className="feedback-section">
        <h4>How was this adaptation?</h4>
        <div className="rating-buttons">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              onClick={() => handleFeedback(rating, true, true)}
              className={feedback?.rating === rating ? 'active' : ''}
            >
              {rating}⭐
            </button>
          ))}
        </div>
        <div className="feedback-options">
          <label>
            <input 
              type="checkbox" 
              onChange={(e) => handleFeedback(feedback?.rating || 4, e.target.checked, feedback?.engaging)}
            />
            This reordering was helpful
          </label>
          <label>
            <input 
              type="checkbox" 
              onChange={(e) => handleFeedback(feedback?.rating || 4, feedback?.helpful, e.target.checked)}
            />
            The content felt more engaging
          </label>
        </div>
      </div>
    </div>
  );
}
```

### Analytics Dashboard Component

```jsx
function AdaptiveContentAnalytics({ courseId }) {
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    async function fetchAnalytics() {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (timeRange === '30d' ? 30 : 7));

      const response = await fetch(
        `/api/adaptive-content?action=get_analytics&courseId=${courseId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();
      setAnalytics(data.analytics);
    }

    fetchAnalytics();
  }, [courseId, timeRange]);

  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="adaptive-analytics-dashboard">
      <div className="time-range-selector">
        <button 
          onClick={() => setTimeRange('7d')}
          className={timeRange === '7d' ? 'active' : ''}
        >
          Last 7 days
        </button>
        <button 
          onClick={() => setTimeRange('30d')}
          className={timeRange === '30d' ? 'active' : ''}
        >
          Last 30 days
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Adaptations</h3>
          <div className="metric-value">{analytics.summary.totalAdaptations}</div>
        </div>
        
        <div className="summary-card">
          <h3>Success Rate</h3>
          <div className="metric-value">
            {(analytics.summary.successRate * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="summary-card">
          <h3>Student Satisfaction</h3>
          <div className="metric-value">
            {analytics.summary.studentSatisfaction.toFixed(1)}/5.0
          </div>
        </div>
        
        <div className="summary-card">
          <h3>Adoption Rate</h3>
          <div className="metric-value">
            {(analytics.summary.adoptionRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="improvements-section">
        <h3>Average Improvements</h3>
        <div className="improvement-metrics">
          <div className="improvement-item">
            <span>Engagement</span>
            <div className="improvement-bar">
              <div 
                className="improvement-fill" 
                style={{ width: `${analytics.improvements.engagement * 5}%` }}
              />
              <span>+{analytics.improvements.engagement}%</span>
            </div>
          </div>
          
          <div className="improvement-item">
            <span>Completion</span>
            <div className="improvement-bar">
              <div 
                className="improvement-fill" 
                style={{ width: `${analytics.improvements.completion * 5}%` }}
              />
              <span>+{analytics.improvements.completion}%</span>
            </div>
          </div>
          
          <div className="improvement-item">
            <span>Time Efficiency</span>
            <div className="improvement-bar">
              <div 
                className="improvement-fill" 
                style={{ width: `${analytics.improvements.time * 5}%` }}
              />
              <span>+{analytics.improvements.time}%</span>
            </div>
          </div>
          
          <div className="improvement-item">
            <span>Retention</span>
            <div className="improvement-bar">
              <div 
                className="improvement-fill" 
                style={{ width: `${analytics.improvements.retention * 5}%` }}
              />
              <span>+{analytics.improvements.retention}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="strategy-effectiveness">
        <h3>Strategy Effectiveness</h3>
        <div className="strategy-list">
          {Object.entries(analytics.strategyEffectiveness)
            .sort(([,a], [,b]) => b - a)
            .map(([strategy, effectiveness]) => (
              <div key={strategy} className="strategy-item">
                <span className="strategy-name">
                  {strategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <div className="effectiveness-bar">
                  <div 
                    className="effectiveness-fill" 
                    style={{ width: `${effectiveness * 100}%` }}
                  />
                  <span>{(effectiveness * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="insights-section">
        <h3>Key Insights</h3>
        <ul className="insights-list">
          {analytics.insights.map((insight, index) => (
            <li key={index} className="insight-item">{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Advanced Features

### Custom Algorithm Development

```typescript
// Example: Create a custom reordering algorithm
class CustomReorderingAlgorithm {
  static apply(
    content: ContentItem[],
    profile: StudentProfile,
    strategy: ReorderingStrategy
  ): ContentItem[] {
    // Custom algorithm implementation
    return content.slice().sort((a, b) => {
      // Your custom sorting logic here
      const aScore = this.calculateCustomScore(a, profile);
      const bScore = this.calculateCustomScore(b, profile);
      return bScore - aScore;
    }).map((item, index) => ({
      ...item,
      currentPosition: index
    }));
  }

  private static calculateCustomScore(item: ContentItem, profile: StudentProfile): number {
    // Custom scoring logic
    let score = 0;
    
    // Factor in student's current energy level
    if (profile.context.energy === 'low' && item.metadata.cognitiveLoad === 'low') {
      score += 0.5;
    }
    
    // Factor in time of day preferences
    const currentHour = new Date().getHours();
    if (profile.preferences.timeOfDay.includes(currentHour)) {
      score += 0.3;
    }
    
    // Factor in recent performance on similar content
    if (item.metadata.concepts.some(concept => 
      profile.performance.strengths.includes(concept)
    )) {
      score += 0.2;
    }
    
    return score;
  }
}
```

### Machine Learning Integration

```typescript
// Example: Integrate ML predictions for better adaptation
class MLEnhancedAdaptation {
  private mlModel: any; // Your ML model interface

  constructor(modelEndpoint: string) {
    this.mlModel = new MLModelClient(modelEndpoint);
  }

  async predictOptimalSequence(
    content: ContentItem[],
    profile: StudentProfile
  ): Promise<ContentItem[]> {
    // Prepare features for ML model
    const features = this.extractFeatures(content, profile);
    
    // Get ML predictions
    const predictions = await this.mlModel.predict(features);
    
    // Convert predictions to content sequence
    return this.applyMLPredictions(content, predictions);
  }

  private extractFeatures(content: ContentItem[], profile: StudentProfile): any[] {
    return content.map(item => ({
      contentType: this.encodeContentType(item.type),
      difficulty: this.encodeDifficulty(item.metadata.difficulty),
      duration: item.metadata.duration,
      studentEngagement: item.adaptiveFactors.engagementScore,
      studentLearningStyle: this.encodeLearningStyle(profile.learningStyle),
      recentPerformance: profile.performance.averageCompletionRate,
      timeContext: this.encodeTimeContext(profile.context)
    }));
  }

  private applyMLPredictions(content: ContentItem[], predictions: any[]): ContentItem[] {
    // Sort content based on ML-predicted optimal order
    const contentWithScores = content.map((item, index) => ({
      item,
      mlScore: predictions[index]?.score || 0
    }));

    return contentWithScores
      .sort((a, b) => b.mlScore - a.mlScore)
      .map(({ item }, index) => ({
        ...item,
        currentPosition: index
      }));
  }
}
```

## Performance Optimization

### Caching Strategy
- **Sequence Cache**: In-memory caching of adaptive sequences (30 min TTL)
- **Profile Cache**: Student profile caching with smart invalidation
- **Strategy Cache**: Reordering strategy effectiveness caching
- **Content Cache**: Original content structure caching

### Batch Processing
```typescript
// Example: Process multiple adaptation requests efficiently
class BatchAdaptationProcessor {
  async processBatch(requests: ReorderingRequest[]): Promise<ReorderingResult[]> {
    // Group requests by course for efficient data loading
    const courseGroups = this.groupByCourse(requests);
    
    const results = await Promise.all(
      courseGroups.map(async group => {
        // Load course data once per group
        const courseData = await this.loadCourseData(group.courseId);
        
        // Process all requests for this course
        return Promise.all(
          group.requests.map(request => 
            this.processRequest(request, courseData)
          )
        );
      })
    );

    return results.flat();
  }
}
```

## Best Practices

1. **Algorithm Selection**
   - Start with engagement_optimized for low-engagement students
   - Use difficulty_adaptive for struggling students
   - Apply time_constrained for busy learners
   - Combine strategies using hybrid_multi_factor

2. **Performance**
   - Cache student profiles and content metadata
   - Use batch processing for multiple requests
   - Implement smart cache invalidation
   - Monitor algorithm performance metrics

3. **Personalization**
   - Collect continuous feedback from students
   - Update profiles based on real behavior
   - A/B test different strategies
   - Gradually increase adaptation aggressiveness

4. **Quality Assurance**
   - Validate reordering constraints
   - Maintain content prerequisite integrity
   - Monitor student satisfaction scores
   - Analyze adaptation effectiveness

5. **Ethical Considerations**
   - Provide transparency about adaptations
   - Allow students to opt-out or customize
   - Avoid creating filter bubbles
   - Ensure algorithmic fairness across demographics

The Dynamic Content Reordering System provides intelligent, personalized learning experiences that adapt to individual student needs, preferences, and contexts, resulting in improved engagement, comprehension, and completion rates.