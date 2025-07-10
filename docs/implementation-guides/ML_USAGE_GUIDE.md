# ML Model Training Pipeline Usage Guide

## Quick Start

### 1. Training Your First Model

```bash
# Start with completion prediction
npm run ml:train train completion_prediction

# Check training status
curl -X GET "/api/ml/training" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Getting Predictions for Students

```bash
# Get all predictions for a student
curl -X GET "/api/ml/predictions?courseId=course123&studentId=student456" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific model prediction
curl -X GET "/api/ml/predictions?courseId=course123&modelType=completion_prediction" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Development Workflow

### Setting Up ML Training

#### 1. Install Dependencies
The ML pipeline uses built-in JavaScript implementations, no additional ML libraries needed.

#### 2. Database Setup
Ensure you have the required tables:
```sql
-- ML Models table
CREATE TABLE MLModel (
  id String @id @default(cuid())
  modelId String @unique
  name String
  version String
  type String
  accuracy Float
  parameters String
  metrics String?
  status String @default("training")
  trainedAt DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
)

-- Training Jobs table
CREATE TABLE MLTrainingJob (
  id String @id @default(cuid())
  modelType String
  parameters String?
  status String @default("pending")
  startedAt DateTime?
  completedAt DateTime?
  modelId String?
  accuracy Float?
  error String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
)
```

#### 3. Environment Variables
```env
# No additional ML-specific environment variables needed
# Uses existing database and Redis connections
```

### Training Models

#### Basic Training Commands
```bash
# Train completion prediction model
npm run ml:train train completion_prediction

# Train performance prediction model  
npm run ml:train train performance_prediction

# Train dropout detection model
npm run ml:train train dropout_detection

# Train all models
npm run ml:train retrain-all
```

#### Advanced Training with Parameters
```bash
# Custom parameters: epochs, batch_size, learning_rate
npm run ml:train train completion_prediction 150 64 0.001

# Using training presets
npm run ml:train train completion_prediction fast     # 50 epochs, quick training
npm run ml:train train completion_prediction balanced # 100 epochs, default
npm run ml:train train completion_prediction thorough # 200 epochs, high accuracy
```

#### Background Training
```bash
# Process training queue with new data
npm run ml:train process-queue

# Start automatic retraining scheduler (runs every 7 days)
npm run ml:train schedule

# Test ML pipeline
npm run ml:train test

# Warm up models (preload into cache)
npm run ml:train warmup
```

### Using the Prediction API

#### Individual Student Predictions
```javascript
// Get all predictions for a student
const response = await fetch(`/api/ml/predictions?courseId=${courseId}&studentId=${studentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { predictions } = await response.json();

console.log('Completion probability:', predictions.completion_prediction.willComplete);
console.log('Expected score:', predictions.performance_prediction.predictedFinalScore);
console.log('Dropout risk:', predictions.dropout_detection.dropoutRisk);
```

#### Batch Predictions
```javascript
// Get predictions for multiple students
const response = await fetch('/api/ml/predictions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    action: 'batch_predictions',
    data: {
      requests: [
        { studentId: 'student1', courseId: 'course1' },
        { studentId: 'student2', courseId: 'course1' },
        { studentId: 'student3', courseId: 'course1' }
      ]
    }
  })
});

const { predictions } = await response.json();
// predictions['student1:course1'] contains all model predictions
```

#### Course-wide Analytics
```javascript
// Get predictions for all students in a course (teachers/admins only)
const response = await fetch('/api/ml/predictions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    action: 'course_predictions',
    data: { courseId: 'course123' }
  })
});

const { results } = await response.json();

// Filter at-risk students
const atRiskStudents = results.filter(
  result => result.predictions.dropout_detection.dropoutRisk > 0.7
);

console.log(`${atRiskStudents.length} students at risk of dropping out`);
```

### Programmatic Usage

#### Direct Service Usage
```javascript
import { MLPredictionService } from '@/lib/ml/prediction-service';
import { MLTrainingPipeline } from '@/lib/ml/training-pipeline';

// Initialize services
const predictionService = new MLPredictionService();
const trainingPipeline = new MLTrainingPipeline();

// Get predictions
const predictions = await predictionService.getPredictions('student123', 'course456');

// Train a model
const model = await trainingPipeline.trainModel('completion_prediction', {
  epochs: 100,
  batchSize: 32,
  learningRate: 0.001,
  hiddenLayers: [64, 32, 16],
  optimizer: 'adam',
  lossFunction: 'binary_crossentropy',
  metrics: ['accuracy']
});
```

#### Feature Engineering
```javascript
import { FeatureEngineer } from '@/lib/ml/feature-engineering';

const featureEngineer = new FeatureEngineer();

// Extract features for a student
const features = await featureEngineer.extractStudentFeatures('student123', 'course456');

console.log('Student features:', {
  engagement: features.engagementScore,
  videoCompletion: features.videoCompletionRate,
  consistencyScore: features.consistencyScore,
  learningStyle: features.learningStyle
});
```

## Integration Examples

### React Dashboard Component
```jsx
import { useState, useEffect } from 'react';

function StudentPredictionDashboard({ studentId, courseId }) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const response = await fetch(`/api/ml/predictions?courseId=${courseId}&studentId=${studentId}`);
        const data = await response.json();
        setPredictions(data.predictions);
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPredictions();
  }, [studentId, courseId]);

  if (loading) return <div>Loading predictions...</div>;
  if (!predictions) return <div>No predictions available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Completion Prediction */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Completion Likelihood</h3>
        <div className="text-2xl font-bold text-green-600">
          {Math.round(predictions.completion_prediction.willComplete * 100)}%
        </div>
        <p className="text-sm text-gray-600">
          Expected completion: {new Date(predictions.completion_prediction.estimatedCompletionDate).toLocaleDateString()}
        </p>
      </div>

      {/* Performance Prediction */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Predicted Performance</h3>
        <div className="text-2xl font-bold text-blue-600">
          {Math.round(predictions.performance_prediction.predictedFinalScore)}%
        </div>
        <p className="text-sm text-gray-600">
          Level: {predictions.performance_prediction.performanceLevel}
        </p>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Risk Assessment</h3>
        <div className={`text-2xl font-bold ${
          predictions.dropout_detection.dropoutRisk > 0.7 ? 'text-red-600' :
          predictions.dropout_detection.dropoutRisk > 0.4 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {predictions.dropout_detection.dropoutRisk > 0.7 ? 'High Risk' :
           predictions.dropout_detection.dropoutRisk > 0.4 ? 'Medium Risk' : 'Low Risk'}
        </div>
        <p className="text-sm text-gray-600">
          Dropout risk: {Math.round(predictions.dropout_detection.dropoutRisk * 100)}%
        </p>
      </div>
    </div>
  );
}
```

### Teacher Analytics Component
```jsx
function TeacherCourseAnalytics({ courseId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourseAnalytics() {
      try {
        const response = await fetch('/api/ml/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'course_predictions',
            data: { courseId }
          })
        });
        
        const { results } = await response.json();
        setStudents(results);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseAnalytics();
  }, [courseId]);

  if (loading) return <div>Loading analytics...</div>;

  const atRiskStudents = students.filter(
    s => s.predictions?.dropout_detection?.dropoutRisk > 0.7
  );

  const highPerformers = students.filter(
    s => s.predictions?.performance_prediction?.performanceLevel === 'high'
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800">At-Risk Students</h3>
          <div className="text-2xl font-bold text-red-600">{atRiskStudents.length}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">High Performers</h3>
          <div className="text-2xl font-bold text-green-600">{highPerformers.length}</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Total Students</h3>
          <div className="text-2xl font-bold text-blue-600">{students.length}</div>
        </div>
      </div>

      {/* At-risk students list */}
      {atRiskStudents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-4">Students Needing Attention</h3>
          <div className="space-y-2">
            {atRiskStudents.map(student => (
              <div key={student.student.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                <div>
                  <span className="font-medium">{student.student.name}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    Risk: {Math.round(student.predictions.dropout_detection.dropoutRisk * 100)}%
                  </span>
                </div>
                <button className="text-red-600 hover:text-red-800">
                  Contact Student
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Server-side Integration
```javascript
// pages/api/student-dashboard.js
import { MLPredictionService } from '@/lib/ml/prediction-service';

const predictionService = new MLPredictionService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { studentId, courseId } = req.query;

  try {
    // Get predictions
    const predictions = await predictionService.getPredictions(studentId, courseId);
    
    // Get confidence scores
    const confidence = await predictionService.getPredictionConfidence(
      studentId, 
      courseId, 
      'completion_prediction'
    );

    // Generate recommendations
    const recommendations = generateRecommendations(predictions);

    res.json({
      predictions,
      confidence,
      recommendations
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to get student data' });
  }
}

function generateRecommendations(predictions) {
  const recommendations = [];

  if (predictions.dropout_detection.dropoutRisk > 0.7) {
    recommendations.push({
      type: 'urgent',
      message: 'Student needs immediate support',
      action: 'schedule_meeting'
    });
  }

  if (predictions.completion_prediction.willComplete < 0.5) {
    recommendations.push({
      type: 'warning',
      message: 'Consider adjusting study plan',
      action: 'modify_content'
    });
  }

  return recommendations;
}
```

## Monitoring and Maintenance

### Model Performance Monitoring
```javascript
// Check model accuracy
const response = await fetch('/api/ml/predictions', { method: 'OPTIONS' });
const { availableModels } = await response.json();

availableModels.forEach(model => {
  console.log(`${model.type}: ${(model.accuracy * 100).toFixed(1)}% accuracy`);
});
```

### Training Status Monitoring
```javascript
// Get training history
const response = await fetch('/api/ml/training');
const { trainingHistory, currentModels } = await response.json();

console.log('Recent training jobs:', trainingHistory);
console.log('Current models:', currentModels);
```

### Cache Management
```javascript
// Clear prediction cache for updated data
const response = await fetch('/api/ml/predictions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update_features',
    data: { studentId: 'student123', courseId: 'course456' }
  })
});
```

## Best Practices

### 1. Data Quality
- Ensure students have sufficient interaction data (100+ events)
- Validate feature extraction before training
- Handle missing values gracefully

### 2. Model Training
- Start with small datasets for testing
- Use balanced training presets initially
- Monitor training accuracy and adjust parameters

### 3. Production Usage
- Cache predictions for better performance
- Use batch processing for multiple students
- Implement fallback predictions for new users

### 4. User Experience
- Show prediction confidence to users
- Provide explanations for recommendations
- Allow users to provide feedback on predictions

## Troubleshooting

### Common Issues

1. **"No trained model found"**
   - Train models using: `npm run ml:train train completion_prediction`
   - Check training status: `GET /api/ml/training`

2. **Low prediction accuracy**
   - Increase training data size
   - Use 'thorough' training preset
   - Check feature quality

3. **Slow predictions**
   - Warm up models: `npm run ml:train warmup`
   - Use batch predictions for multiple requests
   - Check Redis cache configuration

4. **Training failures**
   - Verify sufficient student data exists
   - Check database connectivity
   - Review training logs for specific errors

For detailed technical information, see the [ML Training Guide](./ML_TRAINING_GUIDE.md).