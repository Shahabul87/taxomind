// ML Prediction Service

import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { FeatureEngineer } from './feature-engineering';
import { NeuralNetworkModel } from './models/neural-network';
import { ModelType, PredictionOutput, StudentFeatures } from './types';
import { logger } from '@/lib/logger';

export class MLPredictionService {
  private featureEngineer: FeatureEngineer;
  private modelCache: Map<ModelType, NeuralNetworkModel> = new Map();
  private lastCacheUpdate: Map<ModelType, Date> = new Map();
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.featureEngineer = new FeatureEngineer();
  }

  // Get predictions for a student
  async getPredictions(
    studentId: string,
    courseId: string
  ): Promise<Record<ModelType, PredictionOutput>> {
    try {
      // Extract student features
      const features = await this.featureEngineer.extractStudentFeatures(
        studentId,
        courseId
      );

      // Get predictions from all models
      const predictions: Record<string, PredictionOutput> = {};
      
      const modelTypes: ModelType[] = [
        'completion_prediction',
        'performance_prediction',
        'dropout_detection'
      ];

      for (const modelType of modelTypes) {
        try {
          const model = await this.getModel(modelType);
          if (model) {
            predictions[modelType] = await model.predict(features);
          } else {
            predictions[modelType] = this.getDefaultPrediction(features);
          }
        } catch (error) {
          logger.error(`Prediction failed for ${modelType}:`, error);
          predictions[modelType] = this.getDefaultPrediction(features);
        }
      }

      // Cache predictions
      await this.cachePredictions(studentId, courseId, predictions);

      return predictions as Record<ModelType, PredictionOutput>;

    } catch (error) {
      logger.error('Failed to get predictions:', error);
      throw error;
    }
  }

  // Get specific prediction type
  async getSpecificPrediction(
    studentId: string,
    courseId: string,
    modelType: ModelType
  ): Promise<PredictionOutput> {
    try {
      // Check cache first
      const cached = await this.getCachedPrediction(studentId, courseId, modelType);
      if (cached) return cached;

      // Extract features and predict
      const features = await this.featureEngineer.extractStudentFeatures(
        studentId,
        courseId
      );

      const model = await this.getModel(modelType);
      const prediction = model 
        ? await model.predict(features)
        : this.getDefaultPrediction(features);

      // Cache single prediction
      await this.cacheSinglePrediction(studentId, courseId, modelType, prediction);

      return prediction;

    } catch (error) {
      logger.error(`Failed to get ${modelType} prediction:`, error);
      const features = await this.featureEngineer.extractStudentFeatures(studentId, courseId);
      return this.getDefaultPrediction(features);
    }
  }

  // Get model instance with caching
  private async getModel(modelType: ModelType): Promise<NeuralNetworkModel | null> {
    // Check if model is cached and not expired
    const lastUpdate = this.lastCacheUpdate.get(modelType);
    const now = new Date();
    
    if (
      this.modelCache.has(modelType) && 
      lastUpdate && 
      (now.getTime() - lastUpdate.getTime()) < this.cacheTimeout
    ) {
      return this.modelCache.get(modelType)!;
    }

    // Load latest model from database
    try {
      const modelRecord = await db.mLModel.findFirst({
        where: { 
          type: modelType, 
          status: 'ready' 
        },
        orderBy: { trainedAt: 'desc' }
      });

      if (!modelRecord) {
        logger.warn(`No trained model found for ${modelType}`);
        return null;
      }

      // Create model instance
      const parameters = JSON.parse(modelRecord.parameters as string);
      const model = new NeuralNetworkModel(modelType, modelRecord.version, parameters);
      
      // In production, load actual trained weights
      // await model.loadModel(`models/${modelRecord.modelId}`);

      // Cache model
      this.modelCache.set(modelType, model);
      this.lastCacheUpdate.set(modelType, now);

      return model;

    } catch (error) {
      logger.error(`Failed to load model ${modelType}:`, error);
      return null;
    }
  }

  // Generate default prediction when model is unavailable
  private getDefaultPrediction(features: StudentFeatures): PredictionOutput {
    // Use simple heuristics based on features
    const engagementScore = features.engagementScore;
    const progress = features.courseProgress;
    const consistency = features.consistencyScore;

    const overallScore = (engagementScore + progress + consistency) / 3;

    return {
      willComplete: overallScore > 60 ? 0.7 : 0.3,
      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      predictedFinalScore: Math.max(50, overallScore),
      performanceLevel: overallScore > 80 ? 'high' : overallScore > 60 ? 'medium' : 'low',
      dropoutRisk: overallScore < 40 ? 0.7 : 0.2,
      strugglingProbability: features.strugglingTopicsCount > 3 ? 0.6 : 0.2,
      recommendedContent: this.getRecommendedContent(features),
      suggestedInterventions: this.getSuggestedInterventions(overallScore),
      optimalStudyTime: features.preferredStudyTime,
      adaptiveDifficulty: overallScore > 70 ? 0.7 : 0.4,
      recommendedPace: overallScore > 70 ? 'fast' : overallScore > 50 ? 'normal' : 'slow',
      nextBestAction: this.getNextBestAction(features)
    };
  }

  // Get recommended content based on preferences
  private getRecommendedContent(features: StudentFeatures): string[] {
    const recommendations = [];
    
    if (features.contentTypePreference.video > 0.4) {
      recommendations.push('video_content');
    }
    
    if (features.contentTypePreference.interactive > 0.3) {
      recommendations.push('interactive_exercises');
    }
    
    if (features.quizScore < 70) {
      recommendations.push('practice_quizzes');
    }

    return recommendations;
  }

  // Get suggested interventions
  private getSuggestedInterventions(overallScore: number) {
    const interventions = [];
    
    if (overallScore < 50) {
      interventions.push({
        type: 'support' as const,
        priority: 'high' as const,
        action: 'Schedule one-on-one session',
        reason: 'Low overall performance',
        timing: 'immediate' as const
      });
    }
    
    if (overallScore < 70) {
      interventions.push({
        type: 'content' as const,
        priority: 'medium' as const,
        action: 'Provide additional practice materials',
        reason: 'Below average performance',
        timing: 'next_session' as const
      });
    }

    return interventions;
  }

  // Get next best action
  private getNextBestAction(features: StudentFeatures): string {
    if (features.quizScore < 60) {
      return 'focus_on_fundamentals';
    }
    
    if (features.videoCompletionRate < 50) {
      return 'improve_video_engagement';
    }
    
    if (features.consistencyScore < 60) {
      return 'establish_study_routine';
    }
    
    return 'continue_current_path';
  }

  // Cache predictions in Redis
  private async cachePredictions(
    studentId: string,
    courseId: string,
    predictions: Record<string, PredictionOutput>
  ): Promise<void> {
    try {
      const cacheKey = `predictions:${studentId}:${courseId}`;
      const cacheData = {
        predictions,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      };

      await redis.setex(cacheKey, 3600, JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Failed to cache predictions:', error);
    }
  }

  // Cache single prediction
  private async cacheSinglePrediction(
    studentId: string,
    courseId: string,
    modelType: ModelType,
    prediction: PredictionOutput
  ): Promise<void> {
    try {
      const cacheKey = `prediction:${studentId}:${courseId}:${modelType}`;
      await redis.setex(cacheKey, 3600, JSON.stringify(prediction));
    } catch (error) {
      logger.error('Failed to cache single prediction:', error);
    }
  }

  // Get cached prediction
  private async getCachedPrediction(
    studentId: string,
    courseId: string,
    modelType: ModelType
  ): Promise<PredictionOutput | null> {
    try {
      const cacheKey = `prediction:${studentId}:${courseId}:${modelType}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.error('Failed to get cached prediction:', error);
    }
    
    return null;
  }

  // Batch predictions for multiple students
  async getBatchPredictions(
    requests: Array<{ studentId: string; courseId: string }>
  ): Promise<Record<string, Record<ModelType, PredictionOutput>>> {
    const results: Record<string, Record<ModelType, PredictionOutput>> = {};

    // Process in parallel batches
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (request) => {
        const key = `${request.studentId}:${request.courseId}`;
        try {
          results[key] = await this.getPredictions(request.studentId, request.courseId);
        } catch (error) {
          logger.error(`Batch prediction failed for ${key}:`, error);
          // Use default predictions for failed requests
          const features = await this.featureEngineer.extractStudentFeatures(
            request.studentId,
            request.courseId
          );
          results[key] = {
            completion_prediction: this.getDefaultPrediction(features),
            performance_prediction: this.getDefaultPrediction(features),
            dropout_detection: this.getDefaultPrediction(features)
          } as Record<ModelType, PredictionOutput>;
        }
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  // Get prediction confidence scores
  async getPredictionConfidence(
    studentId: string,
    courseId: string,
    modelType: ModelType
  ): Promise<number> {
    try {
      // Get model metadata
      const modelRecord = await db.mLModel.findFirst({
        where: { type: modelType, status: 'ready' },
        orderBy: { trainedAt: 'desc' }
      });

      if (modelRecord) {
        // Return model accuracy as confidence
        return modelRecord.accuracy;
      }

      return 0.5; // Default confidence
    } catch (error) {
      logger.error('Failed to get prediction confidence:', error);
      return 0.5;
    }
  }

  // Clear model cache (useful for updates)
  clearModelCache(modelType?: ModelType): void {
    if (modelType) {
      this.modelCache.delete(modelType);
      this.lastCacheUpdate.delete(modelType);
    } else {
      this.modelCache.clear();
      this.lastCacheUpdate.clear();
    }
  }

  // Warm up models (preload into cache)
  async warmUpModels(): Promise<void> {
    const modelTypes: ModelType[] = [
      'completion_prediction',
      'performance_prediction',
      'dropout_detection'
    ];

    const warmupPromises = modelTypes.map(async (modelType) => {
      try {
        await this.getModel(modelType);

      } catch (error) {
        logger.error(`✗ Failed to load ${modelType} model:`, error);
      }
    });

    await Promise.all(warmupPromises);

  }
}