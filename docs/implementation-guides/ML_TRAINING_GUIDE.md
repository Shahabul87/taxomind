# ML Model Training Pipeline Guide

## Overview

The ML training pipeline provides predictive analytics for the intelligent learning platform, including:
- **Completion Prediction**: Will a student complete the course?
- **Performance Prediction**: What will be the student's final score?
- **Dropout Detection**: Is a student at risk of dropping out?

## Architecture

### Components

1. **Feature Engineering** (`lib/ml/feature-engineering.ts`)
   - Extracts 55+ features from student data
   - Behavioral patterns, engagement metrics, learning preferences

2. **Neural Network Models** (`lib/ml/models/neural-network.ts`)
   - Custom neural network implementation
   - Configurable architecture and hyperparameters

3. **Training Pipeline** (`lib/ml/training-pipeline.ts`)
   - Data collection and preprocessing
   - Model training and evaluation
   - Automated retraining

4. **Prediction Service** (`lib/ml/prediction-service.ts`)
   - Real-time predictions with caching
   - Batch processing capabilities
   - Model management

## Quick Start

### 1. Training Your First Model

```bash
# Train completion prediction model
npm run ml:train train completion_prediction

# Train with custom parameters
npm run ml:train train completion_prediction 100 32 0.001

# Train all models
npm run ml:train retrain-all
```

### 2. Getting Predictions

```typescript
import { MLPredictionService } from '@/lib/ml/prediction-service';

const predictionService = new MLPredictionService();

// Get all predictions for a student
const predictions = await predictionService.getPredictions(
  'student123',
  'course456'
);

console.log('Completion probability:', predictions.completion_prediction.willComplete);
console.log('Dropout risk:', predictions.dropout_detection.dropoutRisk);
```

### 3. API Usage

```javascript
// Get predictions via API
const response = await fetch('/api/ml/predictions?courseId=course123&studentId=student456');
const { predictions } = await response.json();

// Get specific model prediction
const completionResponse = await fetch(
  '/api/ml/predictions?courseId=course123&modelType=completion_prediction'
);
```

## Feature Engineering

### Student Features (55 total)

#### Engagement Metrics
- `engagementScore` (0-100)
- `averageSessionDuration` (minutes)
- `totalInteractions` (count)
- `clickRate` (clicks per view)
- `scrollDepth` (0-100%)

#### Video Analytics
- `videoCompletionRate` (0-100%)
- `averageWatchTime` (seconds)
- `pauseFrequency` (pauses per video)
- `seekCount` (total seeks)
- `replayCount` (total replays)

#### Learning Metrics
- `quizScore` (0-100)
- `assignmentCompletionRate` (0-100%)
- `timeToComplete` (estimated days)
- `strugglingTopicsCount` (number)

#### Behavioral Patterns
- `preferredStudyTime` (24-hour distribution)
- `studyFrequency` (sessions per day)
- `contentTypePreference` (video/text/interactive/quiz weights)
- `learningStyle` (visual/auditory/kinesthetic/reading weights)

#### Progress Metrics
- `courseProgress` (0-100%)
- `moduleCompletionRate` (0-100%)
- `consistencyScore` (0-100)

### Feature Extraction Example

```typescript
import { FeatureEngineer } from '@/lib/ml/feature-engineering';

const featureEngineer = new FeatureEngineer();

const features = await featureEngineer.extractStudentFeatures(
  'student123',
  'course456'
);

console.log('Features extracted:', {
  engagement: features.engagementScore,
  videoCompletion: features.videoCompletionRate,
  learningStyle: features.learningStyle
});
```

## Model Training

### Training Configuration

```typescript
const parameters = {
  epochs: 100,           // Training iterations
  batchSize: 32,         // Samples per batch
  learningRate: 0.001,   // Learning step size
  hiddenLayers: [64, 32, 16], // Network architecture
  optimizer: 'adam',
  lossFunction: 'binary_crossentropy',
  metrics: ['accuracy']
};
```

### Training Process

1. **Data Collection**
   - Gathers student enrollment data
   - Filters for sufficient interaction history
   - Generates labels based on actual outcomes

2. **Feature Extraction**
   - Processes raw interaction data
   - Calculates behavioral metrics
   - Normalizes features to 0-1 range

3. **Model Training**
   - Splits data (80% train, 20% test)
   - Trains neural network with backpropagation
   - Validates on test set

4. **Evaluation**
   - Calculates accuracy, precision, recall, F1
   - Computes feature importance
   - Saves model if performance > 70%

### Training Commands

```bash
# Basic training
npm run ml:train train completion_prediction

# With custom parameters
npm run ml:train train completion_prediction 150 64 0.0005

# Using presets
npm run ml:train train completion_prediction fast     # Quick training
npm run ml:train train completion_prediction balanced # Default settings
npm run ml:train train completion_prediction thorough # High accuracy

# Train all models
npm run ml:train retrain-all

# Process incremental training queue
npm run ml:train process-queue

# Start automatic retraining scheduler
npm run ml:train schedule
```

## API Endpoints

### Predictions API

#### Get Student Predictions
```http
GET /api/ml/predictions?courseId={id}&studentId={id}
```

#### Get Specific Model Prediction
```http
GET /api/ml/predictions?courseId={id}&modelType=completion_prediction
```

#### Batch Predictions
```http
POST /api/ml/predictions
{
  "action": "batch_predictions",
  "data": {
    "requests": [
      { "studentId": "student1", "courseId": "course1" },
      { "studentId": "student2", "courseId": "course1" }
    ]
  }
}
```

#### Course-wide Predictions
```http
POST /api/ml/predictions
{
  "action": "course_predictions",
  "data": { "courseId": "course123" }
}
```

### Training API (Admin Only)

#### Start Training
```http
POST /api/ml/training
{
  "action": "train_model",
  "modelType": "completion_prediction",
  "parameters": {
    "epochs": 100,
    "batchSize": 32,
    "learningRate": 0.001
  }
}
```

#### Get Training Status
```http
GET /api/ml/training?jobId={id}
```

#### Cancel Training
```http
DELETE /api/ml/training?jobId={id}
```

## Prediction Output

### Completion Prediction
```json
{
  "willComplete": 0.85,
  "estimatedCompletionDate": "2024-03-15T00:00:00Z",
  "predictedFinalScore": 87,
  "performanceLevel": "high",
  "recommendedContent": ["video_content", "practice_quizzes"],
  "nextBestAction": "continue_current_path"
}
```

### Dropout Detection
```json
{
  "dropoutRisk": 0.15,
  "strugglingProbability": 0.23,
  "suggestedInterventions": [
    {
      "type": "support",
      "priority": "medium",
      "action": "Provide additional practice materials",
      "reason": "Below average quiz performance",
      "timing": "next_session"
    }
  ]
}
```

## Integration Examples

### Dashboard Integration

```typescript
// Student dashboard
function StudentDashboard({ studentId, courseId }) {
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    fetch(`/api/ml/predictions?courseId=${courseId}&studentId=${studentId}`)
      .then(res => res.json())
      .then(data => setPredictions(data.predictions));
  }, [studentId, courseId]);

  if (!predictions) return <div>Loading predictions...</div>;

  return (
    <div>
      <CompletionPrediction data={predictions.completion_prediction} />
      <PerformancePrediction data={predictions.performance_prediction} />
      <RiskAssessment data={predictions.dropout_detection} />
    </div>
  );
}
```

### Teacher Analytics

```typescript
// Teacher course analytics
async function getCourseAnalytics(courseId) {
  const response = await fetch('/api/ml/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'course_predictions',
      data: { courseId }
    })
  });

  const { results } = await response.json();
  
  // Process results for dashboard
  const atRiskStudents = results.filter(
    r => r.predictions.dropout_detection.dropoutRisk > 0.7
  );
  
  const highPerformers = results.filter(
    r => r.predictions.performance_prediction.performanceLevel === 'high'
  );

  return { atRiskStudents, highPerformers, allResults: results };
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Predictions are cached for 1 hour
const cacheKey = `predictions:${studentId}:${courseId}`;
await redis.setex(cacheKey, 3600, JSON.stringify(predictions));

// Model instances are cached for 24 hours
const modelCacheTimeout = 24 * 60 * 60 * 1000;
```

### Batch Processing

```typescript
// Process multiple predictions efficiently
const batchRequests = [
  { studentId: 'student1', courseId: 'course1' },
  { studentId: 'student2', courseId: 'course1' },
  // ... more requests
];

const batchResults = await predictionService.getBatchPredictions(batchRequests);
```

## Monitoring and Maintenance

### Model Performance Tracking

```typescript
// Get model confidence scores
const confidence = await predictionService.getPredictionConfidence(
  studentId,
  courseId,
  'completion_prediction'
);

// Model accuracy tracking
const modelInfo = await fetch('/api/ml/predictions', { method: 'OPTIONS' });
const { availableModels } = await modelInfo.json();
```

### Automatic Retraining

The system automatically retrains models:
- **Weekly**: Scheduled retraining with new data
- **Queue-based**: When 1000+ new samples are available
- **Performance-based**: When model accuracy drops below threshold

### Data Quality Checks

```typescript
// Ensure minimum data requirements
if (totalInteractions >= 100) {
  // Include in training data
  const trainingData = await prepareTrainingData(studentId, courseId, data);
  await sendToMLPipeline(trainingData);
}
```

## Best Practices

1. **Feature Quality**
   - Ensure sufficient interaction data (100+ events)
   - Handle missing values gracefully
   - Normalize features consistently

2. **Model Training**
   - Use stratified sampling for balanced datasets
   - Implement early stopping to prevent overfitting
   - Cross-validate on different time periods

3. **Production Deployment**
   - Cache predictions to reduce latency
   - Implement fallback predictions for new users
   - Monitor model drift and retrain regularly

4. **Privacy and Ethics**
   - Anonymize training data
   - Provide prediction explanations to users
   - Allow users to opt out of prediction systems

## Troubleshooting

### Common Issues

1. **Low Model Accuracy**
   - Increase training data size
   - Adjust hyperparameters
   - Add more relevant features

2. **Slow Predictions**
   - Check model cache status
   - Optimize feature extraction
   - Use batch predictions for multiple requests

3. **Training Failures**
   - Verify data quality and completeness
   - Check for sufficient system resources
   - Review training logs for specific errors

The ML training pipeline provides powerful predictive capabilities while maintaining good performance and user privacy standards.