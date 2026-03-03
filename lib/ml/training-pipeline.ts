// ML Training Pipeline

import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { FeatureEngineer } from './feature-engineering';
import { NeuralNetworkModel } from './models/neural-network';
import { ModelType, ModelParameters, TrainingData, MLModel } from './types';
import { logger } from '@/lib/logger';

export class MLTrainingPipeline {
  private featureEngineer: FeatureEngineer;

  constructor() {
    this.featureEngineer = new FeatureEngineer();
  }

  // Main training pipeline
  async trainModel(
    modelType: ModelType,
    parameters: ModelParameters
  ): Promise<MLModel> {

    try {
      // 1. Collect training data
      const trainingData = await this.collectTrainingData(modelType);

      // 2. Split data
      const { trainSet, testSet } = this.splitData(trainingData);

      // 3. Create and train model
      const model = new NeuralNetworkModel(modelType, '1.0', parameters);
      const formattedTrainSet = this.prepareDataForModel(trainSet, modelType);
      await model.train(formattedTrainSet);

      // 4. Evaluate model
      const formattedTestSet = this.prepareDataForModel(testSet, modelType);
      const metrics = await model.evaluate(formattedTestSet);
      logger.info(`Model accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);

      // 5. Save model if performance is acceptable
      if (metrics.accuracy > 0.7) {
        await model.saveModel();
        await this.saveModelMetadata(model, metrics);

        return {
          id: model.getModelInfo().id,
          name: modelType,
          version: model.getModelInfo().version,
          type: modelType,
          accuracy: metrics.accuracy,
          trainedAt: new Date(),
          parameters,
          status: 'ready'
        };
      } else {
        throw new Error(`Model accuracy ${metrics.accuracy} below threshold`);
      }

    } catch (error: any) {
      logger.error('Training failed:', error);
      throw error;
    }
  }

  // Collect training data from database
  private async collectTrainingData(modelType: ModelType): Promise<TrainingData[]> {
    const trainingData: TrainingData[] = [];

    // Get students with sufficient interaction data
    const students = await db.userCourseEnrollment.findMany({
      where: {
        OR: [
          { completedAt: { not: null } }, // Completed courses
          { 
            AND: [
              { enrolledAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Enrolled > 30 days ago
              { progress: { gt: 0 } } // Has some progress
            ]
          }
        ]
      },
      include: {
        course: true
      },
      take: 1000 // Limit for initial training
    });

    for (const enrollment of students) {
      try {
        // Extract features
        const features = await this.featureEngineer.extractStudentFeatures(
          enrollment.userId,
          enrollment.courseId
        );

        // Generate labels based on model type
        const labels = this.generateLabels(enrollment, modelType);

        trainingData.push({
          features,
          labels,
          metadata: {
            studentId: enrollment.userId,
            courseId: enrollment.courseId,
            timestamp: new Date()
          }
        });

      } catch (error: any) {
        logger.error(`Failed to process student ${enrollment.userId}:`, error);
      }
    }

    return trainingData;
  }

  // Generate labels based on model type and enrollment data
  private generateLabels(enrollment: any, modelType: ModelType) {
    const baseLabels = {
      completed: !!enrollment.completedAt,
      finalScore: enrollment.progress || 0,
      droppedOut: this.isDroppedOut(enrollment),
      timeToComplete: this.calculateTimeToComplete(enrollment)
    };

    return baseLabels;
  }

  // Check if student dropped out
  private isDroppedOut(enrollment: any): boolean {
    if (enrollment.completedAt) return false;
    
    const daysSinceLastAccess = enrollment.lastAccessedAt
      ? (Date.now() - new Date(enrollment.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    
    const daysSinceEnrollment = (Date.now() - new Date(enrollment.enrolledAt).getTime()) / (1000 * 60 * 60 * 24);
    
    // Consider dropped out if no access for 30+ days and enrolled for 14+ days
    return daysSinceLastAccess > 30 && daysSinceEnrollment > 14 && (enrollment.progress || 0) < 20;
  }

  // Calculate time to complete in days
  private calculateTimeToComplete(enrollment: any): number {
    if (!enrollment.completedAt) {
      return 365; // Max time for incomplete
    }
    
    const enrolledDate = new Date(enrollment.enrolledAt);
    const completedDate = new Date(enrollment.completedAt);
    
    return Math.ceil((completedDate.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Split data into training and test sets
  private splitData(data: TrainingData[], testRatio: number = 0.2) {
    // Shuffle data
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    
    const testSize = Math.floor(shuffled.length * testRatio);
    const testSet = shuffled.slice(0, testSize);
    const trainSet = shuffled.slice(testSize);

    return { trainSet, testSet };
  }

  // Convert training data to format expected by neural network
  private prepareDataForModel(
    data: TrainingData[],
    modelType: ModelType
  ): Array<{ features: any; label: number }> {
    return data.map(sample => ({
      features: sample.features,
      label: this.extractLabel(sample.labels, modelType)
    }));
  }

  // Extract specific label based on model type
  private extractLabel(labels: any, modelType: ModelType): number {
    switch (modelType) {
      case 'completion_prediction':
        return labels.completed ? 1 : 0;
      case 'performance_prediction':
        return labels.finalScore / 100; // Normalize to 0-1
      case 'dropout_detection':
        return labels.droppedOut ? 1 : 0;
      default:
        return labels.completed ? 1 : 0;
    }
  }

  // Save model metadata to database
  private async saveModelMetadata(model: any, metrics: any): Promise<void> {
    const modelInfo = model.getModelInfo();
    
    // Store model metadata (in production, use proper ML model table)
    logger.info('Model trained and saved:', {
      modelId: modelInfo.id,
      type: modelInfo.type,
      accuracy: metrics.accuracy
    });
    
    // For now, just log instead of saving to DB
    // TODO: Implement proper model storage when ML model table is available

    // Cache model info in Redis
    await redis.hset(
      'ml_models',
      modelInfo.type,
      JSON.stringify({
        id: modelInfo.id,
        accuracy: metrics.accuracy,
        trainedAt: new Date()
      })
    );
  }

  // Retrain all models
  async retrainAllModels(): Promise<void> {
    const modelTypes: ModelType[] = [
      'completion_prediction',
      'performance_prediction',
      'dropout_detection'
    ];

    const defaultParameters: ModelParameters = {
      epochs: 100,
      batchSize: 32,
      learningRate: 0.001,
      hiddenLayers: [64, 32, 16],
      optimizer: 'adam',
      lossFunction: 'binary_crossentropy',
      metrics: ['accuracy']
    };

    for (const modelType of modelTypes) {
      try {

        await this.trainModel(modelType, defaultParameters);
      } catch (error: any) {
        logger.error(`Failed to train ${modelType}:`, error);
      }
    }
  }

  // Schedule automatic retraining
  async scheduleRetraining(): Promise<void> {
    const retrainingInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    setInterval(async () => {

      try {
        await this.retrainAllModels();

      } catch (error: any) {
        logger.error('Scheduled retraining failed:', error);
      }
    }, retrainingInterval);

  }

  // Get training queue from Redis
  async processTrainingQueue(): Promise<void> {
    // Use proper Redis list methods
    const queueLength = (redis as any).llen ? await (redis as any).llen('ml_training_queue') : 0;
    
    if (queueLength >= 1000) {

      // Get samples from queue
      const samples = [];
      for (let i = 0; i < 1000; i++) {
        const sample = (redis as any).rpop ? await (redis as any).rpop('ml_training_queue') : null;
        if (sample) {
          samples.push(JSON.parse(sample));
        }
      }

      // Process samples for incremental training
      await this.incrementalTraining(samples);
    }
  }

  // Incremental training with new data
  private async incrementalTraining(newSamples: any[]): Promise<void> {

    // For each model type, update with new data
    const modelTypes: ModelType[] = ['completion_prediction', 'performance_prediction', 'dropout_detection'];

    for (const modelType of modelTypes) {
      try {
        // Load existing model
        const existingModel = await this.loadLatestModel(modelType);
        
        if (existingModel) {
          // Prepare new training data
          const trainingData = newSamples.map(sample => ({
            features: sample.features,
            label: this.extractLabel(sample.labels, modelType)
          }));

          // Continue training existing model
          await existingModel.train(trainingData);
          
          // Re-evaluate and save if improved
          const testData = await this.getTestData(modelType);
          const metrics = await existingModel.evaluate(testData);
          
          if (metrics.accuracy > 0.7) {
            await existingModel.saveModel();
            await this.saveModelMetadata(existingModel, metrics);
            logger.info(`Updated ${modelType} model - Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
          }
        }
      } catch (error: any) {
        logger.error(`Incremental training failed for ${modelType}:`, error);
      }
    }
  }

  // Load latest model of given type
  private async loadLatestModel(modelType: ModelType): Promise<NeuralNetworkModel | null> {
    try {
      // In production, load from proper ML model table
      // For now, return null since we don't have ML model table
      const modelRecord = null;

      if (modelRecord) {
        // This would work in production with actual model record
        // const parameters = JSON.parse(modelRecord.parameters as string);
        // const model = new NeuralNetworkModel(modelType, modelRecord.version, parameters);
        // return model;
      }
    } catch (error: any) {
      logger.error(`Failed to load model ${modelType}:`, error);
    }

    return null;
  }

  // Get test data for evaluation
  private async getTestData(modelType: ModelType): Promise<any[]> {
    // Get recent test data from database
    const recentEnrollments = await db.userCourseEnrollment.findMany({
      where: {
        enrolledAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      take: 100
    });

    const testData = [];
    for (const enrollment of recentEnrollments) {
      try {
        const features = await this.featureEngineer.extractStudentFeatures(
          enrollment.userId,
          enrollment.courseId
        );
        const labels = this.generateLabels(enrollment, modelType);
        
        testData.push({
          features,
          label: this.extractLabel(labels, modelType)
        });
      } catch (error: any) {
        // Skip failed feature extraction
      }
    }

    return testData;
  }
}