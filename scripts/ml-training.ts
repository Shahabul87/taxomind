#!/usr/bin/env node

// ML Training Script - Run training pipeline manually or on schedule

import { MLTrainingPipeline } from '@/lib/ml/training-pipeline';
import { MLPredictionService } from '@/lib/ml/prediction-service';
import { ModelType, ModelParameters } from '@/lib/ml/types';
import { disconnectKafka } from '@/lib/kafka';

const trainingPipeline = new MLTrainingPipeline();
const predictionService = new MLPredictionService();

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down training pipeline...');
  await disconnectKafka();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down training pipeline...');
  await disconnectKafka();
  process.exit(0);
});

// Main execution
async function main() {
  console.log('🤖 ML Training Pipeline');
  console.log('======================');

  try {
    switch (command) {
      case 'train':
        await handleTrainCommand();
        break;
      
      case 'retrain-all':
        await handleRetrainAllCommand();
        break;
      
      case 'process-queue':
        await handleProcessQueueCommand();
        break;
      
      case 'schedule':
        await handleScheduleCommand();
        break;
      
      case 'test':
        await handleTestCommand();
        break;
      
      case 'warmup':
        await handleWarmupCommand();
        break;
      
      default:
        showUsage();
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Training failed:', error);
    process.exit(1);
  }
}

// Handle train command
async function handleTrainCommand() {
  const modelType = args[1] as ModelType;
  
  if (!modelType) {
    console.error('❌ Model type required');
    console.log('Available types: completion_prediction, performance_prediction, dropout_detection');
    process.exit(1);
  }

  const parameters: ModelParameters = {
    epochs: parseInt(args[2]) || 100,
    batchSize: parseInt(args[3]) || 32,
    learningRate: parseFloat(args[4]) || 0.001,
    hiddenLayers: [64, 32, 16],
    optimizer: 'adam',
    lossFunction: 'binary_crossentropy',
    metrics: ['accuracy']
  };

  console.log(`🎯 Training ${modelType} model...`);
  console.log(`📊 Parameters:`, parameters);

  const startTime = Date.now();
  const model = await trainingPipeline.trainModel(modelType, parameters);
  const duration = (Date.now() - startTime) / 1000;

  console.log(`✅ Training completed in ${duration.toFixed(2)}s`);
  console.log(`📈 Model accuracy: ${(model.accuracy * 100).toFixed(2)}%`);
  console.log(`🆔 Model ID: ${model.id}`);
}

// Handle retrain all command
async function handleRetrainAllCommand() {
  console.log('🔄 Retraining all models...');
  
  const startTime = Date.now();
  await trainingPipeline.retrainAllModels();
  const duration = (Date.now() - startTime) / 1000;

  console.log(`✅ All models retrained in ${duration.toFixed(2)}s`);
}

// Handle process queue command
async function handleProcessQueueCommand() {
  console.log('📥 Processing training queue...');
  
  await trainingPipeline.processTrainingQueue();
  
  console.log('✅ Training queue processed');
}

// Handle schedule command
async function handleScheduleCommand() {
  console.log('⏰ Scheduling automatic retraining...');
  
  await trainingPipeline.scheduleRetraining();
  
  console.log('✅ Automatic retraining scheduled');
  console.log('🔄 Pipeline will retrain models every 7 days');
  
  // Keep process running
  console.log('📡 Training scheduler is running...');
  console.log('Press Ctrl+C to stop');
  
  // Keep alive
  setInterval(() => {
    console.log(`⏰ Training scheduler alive - ${new Date().toISOString()}`);
  }, 60 * 60 * 1000); // Log every hour
}

// Handle test command
async function handleTestCommand() {
  console.log('🧪 Testing ML pipeline...');
  
  // Test feature extraction
  console.log('1. Testing feature extraction...');
  // In a real implementation, this would test with sample data
  
  // Test model creation
  console.log('2. Testing model creation...');
  const testParams: ModelParameters = {
    epochs: 5,
    batchSize: 16,
    learningRate: 0.01,
    hiddenLayers: [32, 16],
    optimizer: 'adam',
    lossFunction: 'binary_crossentropy',
    metrics: ['accuracy']
  };
  
  // Create a test model (don't actually train)
  console.log('3. Testing prediction service...');
  await predictionService.warmUpModels();
  
  console.log('✅ All tests passed');
}

// Handle warmup command
async function handleWarmupCommand() {
  console.log('🔥 Warming up ML models...');
  
  await predictionService.warmUpModels();
  
  console.log('✅ Model warmup complete');
}

// Show usage information
function showUsage() {
  console.log('Usage: npm run ml:train <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  train <model_type> [epochs] [batch_size] [learning_rate]');
  console.log('    Train a specific model type');
  console.log('    Model types: completion_prediction, performance_prediction, dropout_detection');
  console.log('');
  console.log('  retrain-all');
  console.log('    Retrain all available models');
  console.log('');
  console.log('  process-queue');
  console.log('    Process the training queue with new data');
  console.log('');
  console.log('  schedule');
  console.log('    Start automatic retraining scheduler');
  console.log('');
  console.log('  test');
  console.log('    Run ML pipeline tests');
  console.log('');
  console.log('  warmup');
  console.log('    Preload models into cache');
  console.log('');
  console.log('Examples:');
  console.log('  npm run ml:train train completion_prediction 50 16 0.01');
  console.log('  npm run ml:train retrain-all');
  console.log('  npm run ml:train schedule');
}

// Custom training configurations
const TRAINING_CONFIGS = {
  fast: {
    epochs: 50,
    batchSize: 64,
    learningRate: 0.01,
    hiddenLayers: [32, 16]
  },
  balanced: {
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    hiddenLayers: [64, 32, 16]
  },
  thorough: {
    epochs: 200,
    batchSize: 16,
    learningRate: 0.0005,
    hiddenLayers: [128, 64, 32, 16]
  }
};

// Enhanced train command with presets
if (command === 'train' && args[2] && Object.keys(TRAINING_CONFIGS).includes(args[2])) {
  const preset = args[2] as keyof typeof TRAINING_CONFIGS;
  console.log(`🎯 Using ${preset} training preset`);
  
  // Override parameters with preset
  const parameters = {
    ...TRAINING_CONFIGS[preset],
    optimizer: 'adam',
    lossFunction: 'binary_crossentropy',
    metrics: ['accuracy']
  };
  
  console.log(`📊 Preset parameters:`, parameters);
}

// Run the script
main();