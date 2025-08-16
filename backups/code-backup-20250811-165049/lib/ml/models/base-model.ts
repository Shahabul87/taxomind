// Base ML Model Class

import { ModelType, ModelParameters, StudentFeatures, PredictionOutput, ModelMetrics } from '../types';

export abstract class BaseMLModel {
  protected modelId: string;
  protected modelType: ModelType;
  protected version: string;
  protected parameters: ModelParameters;
  protected isTraining: boolean = false;
  protected weights: any = null;

  constructor(modelType: ModelType, version: string, parameters: ModelParameters) {
    this.modelId = `${modelType}_${version}_${Date.now()}`;
    this.modelType = modelType;
    this.version = version;
    this.parameters = parameters;
  }

  // Abstract methods that must be implemented by specific models
  abstract train(data: any[]): Promise<void>;
  abstract predict(features: StudentFeatures): Promise<PredictionOutput>;
  abstract evaluate(testData: any[]): Promise<ModelMetrics>;
  abstract saveModel(): Promise<void>;
  abstract loadModel(modelPath: string): Promise<void>;

  // Common preprocessing methods
  protected normalizeFeatures(features: StudentFeatures): number[] {
    // Convert features to normalized array
    const featureArray = [
      features.engagementScore / 100,
      features.averageSessionDuration / 120, // Normalize to 2 hours
      features.totalInteractions / 1000,
      features.clickRate,
      features.scrollDepth / 100,
      features.videoCompletionRate / 100,
      features.averageWatchTime / 3600, // Normalize to 1 hour
      features.pauseFrequency / 10,
      features.seekCount / 50,
      features.replayCount / 10,
      features.quizScore / 100,
      features.assignmentCompletionRate / 100,
      features.timeToComplete / 365, // Normalize to 1 year
      features.strugglingTopicsCount / 10,
      ...features.preferredStudyTime, // Already normalized
      features.studyFrequency,
      features.contentTypePreference.video,
      features.contentTypePreference.text,
      features.contentTypePreference.interactive,
      features.contentTypePreference.quiz,
      features.learningStyle.visual,
      features.learningStyle.auditory,
      features.learningStyle.kinesthetic,
      features.learningStyle.reading,
      features.courseProgress / 100,
      features.moduleCompletionRate / 100,
      features.consistencyScore / 100
    ];

    return featureArray;
  }

  // Calculate feature importance using permutation
  protected async calculateFeatureImportance(
    testData: any[],
    baselineScore: number
  ): Promise<Record<string, number>> {
    const featureNames = this.getFeatureNames();
    const importance: Record<string, number> = {};

    for (let i = 0; i < featureNames.length; i++) {
      // Permute feature i
      const permutedData = testData.map(sample => {
        const features = [...sample.features];
        // Shuffle values for feature i across all samples
        const shuffledValues = testData.map(s => s.features[i]).sort(() => Math.random() - 0.5);
        features[i] = shuffledValues[testData.indexOf(sample)];
        return { ...sample, features };
      });

      // Evaluate with permuted feature
      const permutedMetrics = await this.evaluate(permutedData);
      const performanceDrop = baselineScore - permutedMetrics.accuracy;
      
      importance[featureNames[i]] = Math.max(0, performanceDrop);
    }

    // Normalize importance scores
    const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(importance).forEach(key => {
        importance[key] = importance[key] / total;
      });
    }

    return importance;
  }

  // Get feature names for interpretability
  private getFeatureNames(): string[] {
    return [
      'engagementScore',
      'averageSessionDuration',
      'totalInteractions',
      'clickRate',
      'scrollDepth',
      'videoCompletionRate',
      'averageWatchTime',
      'pauseFrequency',
      'seekCount',
      'replayCount',
      'quizScore',
      'assignmentCompletionRate',
      'timeToComplete',
      'strugglingTopicsCount',
      ...Array.from({ length: 24 }, (_, i) => `studyHour_${i}`),
      'studyFrequency',
      'contentPref_video',
      'contentPref_text',
      'contentPref_interactive',
      'contentPref_quiz',
      'style_visual',
      'style_auditory',
      'style_kinesthetic',
      'style_reading',
      'courseProgress',
      'moduleCompletionRate',
      'consistencyScore'
    ];
  }

  // Common metrics calculation
  protected calculateMetrics(predictions: number[], actuals: number[]): ModelMetrics {
    const n = predictions.length;
    let tp = 0, tn = 0, fp = 0, fn = 0;

    // For binary classification (threshold at 0.5)
    for (let i = 0; i < n; i++) {
      const pred = predictions[i] >= 0.5 ? 1 : 0;
      const actual = actuals[i] >= 0.5 ? 1 : 0;

      if (pred === 1 && actual === 1) tp++;
      else if (pred === 0 && actual === 0) tn++;
      else if (pred === 1 && actual === 0) fp++;
      else if (pred === 0 && actual === 1) fn++;
    }

    const accuracy = (tp + tn) / n;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    // Calculate AUC (simplified)
    const auc = this.calculateAUC(predictions, actuals);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      auc,
      confusionMatrix: [[tn, fp], [fn, tp]],
      featureImportance: {}
    };
  }

  // Calculate AUC using trapezoidal rule
  private calculateAUC(predictions: number[], actuals: number[]): number {
    // Sort by predictions
    const sorted = predictions
      .map((pred, i) => ({ pred, actual: actuals[i] }))
      .sort((a, b) => b.pred - a.pred);

    let auc = 0;
    let tpCount = 0;
    let fpCount = 0;
    const totalPositives = actuals.filter(a => a >= 0.5).length;
    const totalNegatives = actuals.length - totalPositives;

    for (const { pred, actual } of sorted) {
      if (actual >= 0.5) {
        tpCount++;
      } else {
        fpCount++;
        auc += tpCount;
      }
    }

    return totalNegatives > 0 ? auc / (totalPositives * totalNegatives) : 0;
  }

  // Get model info
  getModelInfo() {
    return {
      id: this.modelId,
      type: this.modelType,
      version: this.version,
      parameters: this.parameters,
      isTraining: this.isTraining
    };
  }
}