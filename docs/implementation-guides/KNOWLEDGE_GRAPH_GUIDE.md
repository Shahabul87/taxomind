# Knowledge Graph System Implementation Guide

## Overview

The Knowledge Graph system creates intelligent content relationships and learning paths by analyzing course structure, content dependencies, and student behavior patterns. It enables adaptive learning, personalized recommendations, and optimal learning path generation.

## Architecture

### Core Components

1. **Knowledge Graph Types** (`lib/knowledge-graph/types.ts`)
   - Comprehensive type system for nodes, edges, and graph structures
   - Learning path and concept map definitions
   - Analytics and query interfaces

2. **Graph Builder** (`lib/knowledge-graph/graph-builder.ts`)
   - Builds knowledge graphs from course structure
   - Analyzes content relationships and dependencies
   - Infers learning patterns from student behavior

3. **Graph Analyzer** (`lib/knowledge-graph/graph-analyzer.ts`)
   - Calculates graph metrics and centrality measures
   - Performs community detection and clustering
   - Generates learning paths and recommendations

4. **Graph Service** (`lib/knowledge-graph/graph-service.ts`)
   - Main interface for graph operations
   - Caching and performance optimization
   - Query processing and validation

## Key Features

### Node Types
- **Concept**: Abstract learning concepts
- **Skill**: Practical abilities and competencies  
- **Topic**: Subject matter areas
- **Lesson**: Individual learning units (sections)
- **Course**: Complete learning programs
- **Assessment**: Quizzes and assignments
- **Media**: Videos and documents

### Relationship Types
- **Prerequisite**: Required prior knowledge
- **Builds_on**: Conceptual progression
- **Related_to**: Semantic similarity
- **Part_of**: Hierarchical containment
- **Sequence**: Ordered learning progression
- **Depends_on**: Functional dependencies

### Analytics Capabilities
- **Centrality Analysis**: Identify key concepts
- **Community Detection**: Find learning clusters
- **Path Analysis**: Optimize learning sequences
- **Gap Detection**: Identify missing prerequisites

## Quick Start

### 1. Generate Knowledge Graph

```bash
# Build graph for a course
curl -X GET "/api/knowledge-graph?action=get_graph&courseId=course123&rebuild=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get Learning Path

```bash
# Generate personalized learning path
curl -X POST "/api/knowledge-graph" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "generate_path",
    "courseId": "course123",
    "data": {
      "targetNodeId": "lesson_section456"
    }
  }'
```

### 3. Query Graph Relationships

```bash
# Find prerequisites for a concept
curl -X POST "/api/knowledge-graph" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "query_graph",
    "courseId": "course123",
    "data": {
      "query": {
        "type": "find_prerequisites",
        "parameters": {
          "targetId": "lesson_section456"
        }
      }
    }
  }'
```

## Development Usage

### Programmatic Graph Access

```typescript
import { KnowledgeGraphService } from '@/lib/knowledge-graph/graph-service';

const graphService = new KnowledgeGraphService();

// Get or build knowledge graph
const graph = await graphService.getKnowledgeGraph('course123');

// Generate learning path
const learningPath = await graphService.generateLearningPath(
  'course123',
  'student456',
  'lesson_target789'
);

// Get adaptive recommendations
const recommendations = await graphService.getAdaptiveRecommendations(
  'course123',
  'student456',
  'lesson_current123'
);
```

### Graph Analysis

```typescript
import { KnowledgeGraphAnalyzer } from '@/lib/knowledge-graph/graph-analyzer';

const analyzer = await graphService.getGraphAnalyzer('course123');

// Perform comprehensive analysis
const analytics = await analyzer.analyzeGraph();

console.log('Central concepts:', analytics.centralityMeasures.pagerank);
console.log('Learning communities:', analytics.clusteringMetrics.communities);
console.log('Critical paths:', analytics.pathMetrics.criticalPaths);
```

### Custom Queries

```typescript
import { GraphQuery } from '@/lib/knowledge-graph/types';

// Find similar concepts
const similarQuery: GraphQuery = {
  type: 'find_similar',
  parameters: {
    sourceId: 'lesson_123',
    minWeight: 0.7
  },
  limit: 5
};

const similarConcepts = await graphService.queryGraph('course123', similarQuery);

// Find learning gaps for student
const gapsQuery: GraphQuery = {
  type: 'find_gaps',
  parameters: {
    studentId: 'student456'
  }
};

const learningGaps = await graphService.queryGraph('course123', gapsQuery);
```

## API Reference

### GET Endpoints

#### Get Knowledge Graph
```http
GET /api/knowledge-graph?action=get_graph&courseId={id}
```

**Parameters:**
- `courseId` (required): Course identifier
- `rebuild` (optional): Force graph rebuild
- `metadata` (optional): Include graph metadata

**Response:**
```json
{
  "nodeCount": 45,
  "edgeCount": 78,
  "nodes": [...],
  "edges": [...],
  "metadata": {...}
}
```

#### Get Graph Analytics
```http
GET /api/knowledge-graph?action=get_analytics&courseId={id}
```

**Response:**
```json
{
  "analytics": {
    "centralityMeasures": {...},
    "clusteringMetrics": {...},
    "pathMetrics": {...},
    "learningMetrics": {...}
  },
  "insights": [
    "Most central concepts: React Hooks, State Management",
    "Found 4 distinct learning communities"
  ]
}
```

#### Get Learning Path
```http
GET /api/knowledge-graph?action=get_learning_path&courseId={id}&targetId={nodeId}
```

**Response:**
```json
{
  "learningPath": {
    "id": "path_student123_lesson456_1234567890",
    "name": "Learning Path to React Hooks",
    "nodes": [
      {
        "nodeId": "lesson_basics",
        "order": 0,
        "isRequired": true,
        "estimatedTime": 30
      }
    ],
    "totalEstimatedTime": 120,
    "difficulty": "intermediate"
  }
}
```

### POST Endpoints

#### Query Graph
```http
POST /api/knowledge-graph
{
  "action": "query_graph",
  "courseId": "course123",
  "data": {
    "query": {
      "type": "find_prerequisites",
      "parameters": {
        "targetId": "lesson_456"
      }
    }
  }
}
```

#### Create Concept Map
```http
POST /api/knowledge-graph
{
  "action": "create_concept_map",
  "courseId": "course123",
  "data": {
    "rootConceptId": "concept_react",
    "depth": 3,
    "layoutType": "hierarchical"
  }
}
```

## Integration Examples

### React Component for Learning Path

```jsx
import { useState, useEffect } from 'react';

function LearningPathVisualization({ courseId, targetNodeId }) {
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLearningPath() {
      try {
        const response = await fetch(
          `/api/knowledge-graph?action=get_learning_path&courseId=${courseId}&targetId=${targetNodeId}`
        );
        const data = await response.json();
        setLearningPath(data.learningPath);
      } catch (error) {
        console.error('Failed to fetch learning path:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLearningPath();
  }, [courseId, targetNodeId]);

  if (loading) return <div>Loading learning path...</div>;
  if (!learningPath) return <div>No learning path available</div>;

  return (
    <div className="learning-path">
      <h3>{learningPath.name}</h3>
      <p>Estimated time: {learningPath.totalEstimatedTime} minutes</p>
      <p>Difficulty: {learningPath.difficulty}</p>
      
      <div className="path-nodes">
        {learningPath.nodes.map((node, index) => (
          <div key={node.nodeId} className="path-node">
            <div className="node-order">{index + 1}</div>
            <div className="node-info">
              <span className="node-id">{node.nodeId}</span>
              <span className="node-time">{node.estimatedTime}min</span>
              {node.isRequired && <span className="required">Required</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Graph Analytics Dashboard

```jsx
function GraphAnalyticsDashboard({ courseId }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      const response = await fetch(
        `/api/knowledge-graph?action=get_analytics&courseId=${courseId}`
      );
      const data = await response.json();
      setAnalytics(data.analytics);
    }

    fetchAnalytics();
  }, [courseId]);

  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="analytics-dashboard">
      <div className="metric-cards">
        <div className="metric-card">
          <h4>Graph Density</h4>
          <div className="metric-value">
            {(analytics.metadata?.density * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Communities</h4>
          <div className="metric-value">
            {analytics.clusteringMetrics.communities.length}
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Average Path Length</h4>
          <div className="metric-value">
            {analytics.pathMetrics.averagePathLength.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="communities-section">
        <h4>Learning Communities</h4>
        {analytics.clusteringMetrics.communities.map((community, index) => (
          <div key={community.id} className="community">
            <h5>{community.theme} Community</h5>
            <p>Nodes: {community.nodeIds.length}</p>
            <p>Coherence: {(community.coherenceScore * 100).toFixed(1)}%</p>
            <div className="keywords">
              {community.keywords.map(keyword => (
                <span key={keyword} className="keyword">{keyword}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Adaptive Recommendations Component

```jsx
function AdaptiveRecommendations({ courseId, currentNodeId }) {
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    async function fetchRecommendations() {
      const url = `/api/knowledge-graph?action=get_recommendations&courseId=${courseId}`;
      const fullUrl = currentNodeId ? `${url}&currentId=${currentNodeId}` : url;
      
      const response = await fetch(fullUrl);
      const data = await response.json();
      setRecommendations(data.recommendations);
    }

    fetchRecommendations();
  }, [courseId, currentNodeId]);

  if (!recommendations) return <div>Loading recommendations...</div>;

  return (
    <div className="adaptive-recommendations">
      <h3>Recommended Next Steps</h3>
      <p className="difficulty">Difficulty: {recommendations.difficulty}</p>
      <p className="estimated-time">Estimated time: {recommendations.estimatedTime} minutes</p>
      
      <div className="recommended-nodes">
        {recommendations.recommendedNodes.map((node, index) => (
          <div key={node.id} className="recommended-node">
            <h4>{node.title}</h4>
            <p>{node.description}</p>
            <div className="node-metadata">
              <span className="difficulty">{node.metadata.difficulty}</span>
              <span className="time">{node.metadata.estimatedTime}min</span>
              <span className="blooms">{node.metadata.bloomsLevel}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="reasoning">
        <h4>Why these recommendations?</h4>
        <ul>
          {recommendations.reasoning.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Advanced Features

### Custom Graph Queries

```typescript
// Complex query for finding optimal learning sequences
const sequenceQuery: GraphQuery = {
  type: 'find_path',
  parameters: {
    sourceId: 'lesson_intro',
    targetId: 'lesson_advanced',
    maxDepth: 5
  },
  filters: [
    {
      field: 'difficulty',
      operator: 'in',
      value: ['beginner', 'intermediate']
    },
    {
      field: 'estimatedTime',
      operator: 'less_than',
      value: 60
    }
  ]
};

const optimalPath = await graphService.queryGraph(courseId, sequenceQuery);
```

### Graph Validation and Quality Assurance

```typescript
// Validate graph structure
const validation = await graphService.validateGraph(courseId);

if (!validation.isValid) {
  console.log('Graph validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.log('Graph warnings:', validation.warnings);
}

// Apply suggested improvements
validation.suggestions.forEach(suggestion => {
  console.log(`Suggestion: ${suggestion.description}`);
  console.log(`Effort: ${suggestion.effort}, Impact: ${suggestion.potentialImpact}`);
});
```

### Dynamic Graph Updates

```typescript
import { GraphUpdate } from '@/lib/knowledge-graph/types';

// Add new relationship based on student behavior
const newRelationship: GraphUpdate = {
  type: 'create_edge',
  edgeId: 'lesson_123_prerequisite_lesson_456',
  data: {
    id: 'lesson_123_prerequisite_lesson_456',
    sourceId: 'lesson_123',
    targetId: 'lesson_456',
    type: 'prerequisite',
    weight: 0.8,
    metadata: {
      strength: 0.8,
      confidence: 0.9,
      source: 'behavior_analysis',
      verified: false,
      learningPathRelevance: 0.85,
      conceptualDistance: 0.2
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  timestamp: new Date(),
  source: 'student_behavior_analysis'
};

await graphService.updateGraph(courseId, newRelationship);
```

## Performance Optimization

### Caching Strategy
- **Graph Cache**: In-memory caching of complete graphs
- **Redis Cache**: Persistent caching with 1-hour TTL
- **Analyzer Cache**: Cached analysis results
- **Query Cache**: Cached query results for common patterns

### Batch Operations
```typescript
// Process multiple queries efficiently
const batchQueries = [
  { type: 'find_prerequisites', parameters: { targetId: 'lesson_1' } },
  { type: 'find_prerequisites', parameters: { targetId: 'lesson_2' } },
  { type: 'find_prerequisites', parameters: { targetId: 'lesson_3' } }
];

const results = await Promise.all(
  batchQueries.map(query => graphService.queryGraph(courseId, query))
);
```

## Best Practices

1. **Graph Building**
   - Build graphs incrementally
   - Update relationships based on new data
   - Validate graph structure regularly

2. **Performance**
   - Cache frequently accessed graphs
   - Use appropriate query filters
   - Limit graph depth for complex operations

3. **Learning Paths**
   - Consider student progress and preferences
   - Adapt paths based on performance
   - Provide alternative routes

4. **Data Quality**
   - Validate node and edge data
   - Monitor graph metrics
   - Clean orphaned nodes

The Knowledge Graph system provides intelligent content organization and adaptive learning capabilities, enabling personalized educational experiences at scale.