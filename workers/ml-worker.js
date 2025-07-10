// ML Worker - Handles machine learning training and inference

const { db } = require('../lib/db');
const { redis } = require('../lib/redis');
const { MLTrainingPipeline } = require('../lib/ml-training/ml-training-pipeline');
const { MLPredictionService } = require('../lib/ml-training/ml-prediction-service');

class MLWorker {
  constructor() {
    this.pipeline = new MLTrainingPipeline();
    this.predictionService = new MLPredictionService();
    this.isRunning = false;
    this.jobQueue = [];
    this.currentJob = null;
  }

  async initialize() {
    console.log('🤖 Starting ML Worker...');
    
    try {
      // Initialize ML services
      await this.pipeline.initialize();
      await this.predictionService.initialize();
      
      // Setup job processing
      await this.setupJobProcessing();
      
      // Setup health monitoring
      await this.setupHealthMonitoring();
      
      this.isRunning = true;
      console.log('✅ ML Worker initialized successfully');
      
      // Start processing loop
      this.startProcessingLoop();
      
    } catch (error) {
      console.error('❌ ML Worker initialization failed:', error);
      process.exit(1);
    }
  }

  async setupJobProcessing() {
    // Listen for ML training jobs from Redis queue
    await redis.subscribe('ml:training:queue');
    await redis.subscribe('ml:prediction:queue');
    await redis.subscribe('ml:model:update');

    redis.on('message', async (channel, message) => {
      try {
        const job = JSON.parse(message);
        console.log(`📥 Received job from ${channel}:`, job.type);
        
        await this.enqueueJob(job);
      } catch (error) {
        console.error('Error processing job message:', error);
      }
    });
  }

  async enqueueJob(job) {
    job.id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    job.status = 'queued';
    job.enqueuedAt = new Date();
    
    this.jobQueue.push(job);
    
    // Store job status in Redis
    await redis.setex(`ml:job:${job.id}`, 3600, JSON.stringify(job));
    
    console.log(`📝 Job ${job.id} queued (${this.jobQueue.length} jobs pending)`);
  }

  async startProcessingLoop() {
    console.log('🔄 Starting ML job processing loop...');
    
    while (this.isRunning) {
      try {
        if (this.jobQueue.length > 0 && !this.currentJob) {
          this.currentJob = this.jobQueue.shift();
          await this.processJob(this.currentJob);
          this.currentJob = null;
        }
        
        // Check every 5 seconds
        await this.sleep(5000);
        
      } catch (error) {
        console.error('Error in processing loop:', error);
        this.currentJob = null;
        await this.sleep(10000); // Wait longer on error
      }
    }
  }

  async processJob(job) {
    console.log(`🔄 Processing job ${job.id}: ${job.type}`);
    
    try {
      // Update job status
      job.status = 'processing';
      job.startedAt = new Date();
      await redis.setex(`ml:job:${job.id}`, 3600, JSON.stringify(job));
      
      let result = null;
      
      switch (job.type) {
        case 'train_student_model':
          result = await this.trainStudentModel(job.data);
          break;
          
        case 'train_content_recommendation':
          result = await this.trainContentRecommendationModel(job.data);
          break;
          
        case 'update_knowledge_graph':
          result = await this.updateKnowledgeGraph(job.data);
          break;
          
        case 'generate_predictions':
          result = await this.generatePredictions(job.data);
          break;
          
        case 'analyze_learning_patterns':
          result = await this.analyzeLearningPatterns(job.data);
          break;
          
        case 'optimize_learning_path':
          result = await this.optimizeLearningPath(job.data);
          break;
          
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
      
      // Update job with success
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      job.duration = job.completedAt - job.startedAt;
      
      await redis.setex(`ml:job:${job.id}`, 86400, JSON.stringify(job)); // Keep for 24 hours
      
      console.log(`✅ Job ${job.id} completed in ${job.duration}ms`);
      
      // Publish completion event
      await redis.publish('ml:job:completed', JSON.stringify({
        jobId: job.id,
        type: job.type,
        result: result,
        duration: job.duration
      }));
      
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      
      // Update job with error
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
      
      await redis.setex(`ml:job:${job.id}`, 86400, JSON.stringify(job));
      
      // Publish failure event
      await redis.publish('ml:job:failed', JSON.stringify({
        jobId: job.id,
        type: job.type,
        error: error.message
      }));
    }
  }

  async trainStudentModel(data) {
    console.log(`🎓 Training student model for student: ${data.studentId}`);
    
    // Get student learning data
    const studentData = await this.getStudentLearningData(data.studentId);
    
    // Train personalized model
    const model = await this.pipeline.trainStudentPersonalizationModel(
      data.studentId,
      studentData
    );
    
    // Save model
    await this.predictionService.saveStudentModel(data.studentId, model);
    
    return {
      modelId: model.id,
      accuracy: model.accuracy,
      features: model.features.length,
      trainingTime: model.trainingTime
    };
  }

  async trainContentRecommendationModel(data) {
    console.log('📚 Training content recommendation model...');
    
    // Get interaction data
    const interactionData = await this.getContentInteractionData();
    
    // Train recommendation model
    const model = await this.pipeline.trainContentRecommendationModel(interactionData);
    
    // Deploy model
    await this.predictionService.deployRecommendationModel(model);
    
    return {
      modelId: model.id,
      accuracy: model.accuracy,
      contentItems: model.contentItems,
      trainingTime: model.trainingTime
    };
  }

  async updateKnowledgeGraph(data) {
    console.log('🕸️ Updating knowledge graph...');
    
    // Process new content relationships
    const relationships = await this.extractContentRelationships(data.content);
    
    // Update graph
    await this.pipeline.updateKnowledgeGraph(relationships);
    
    return {
      newRelationships: relationships.length,
      totalNodes: await this.getGraphNodeCount(),
      totalEdges: await this.getGraphEdgeCount()
    };
  }

  async generatePredictions(data) {
    console.log(`🔮 Generating predictions for: ${data.type}`);
    
    switch (data.type) {
      case 'learning_outcome':
        return await this.predictionService.predictLearningOutcome(
          data.studentId,
          data.courseId
        );
        
      case 'completion_time':
        return await this.predictionService.predictCompletionTime(
          data.studentId,
          data.contentId
        );
        
      case 'difficulty_adjustment':
        return await this.predictionService.predictOptimalDifficulty(
          data.studentId,
          data.currentPerformance
        );
        
      default:
        throw new Error(`Unknown prediction type: ${data.type}`);
    }
  }

  async analyzeLearningPatterns(data) {
    console.log('📊 Analyzing learning patterns...');
    
    // Get learning behavior data
    const patterns = await this.pipeline.analyzeLearningPatterns(
      data.timeRange,
      data.studentGroups
    );
    
    return {
      patterns: patterns.length,
      insights: patterns.map(p => p.insight),
      recommendations: patterns.map(p => p.recommendation)
    };
  }

  async optimizeLearningPath(data) {
    console.log(`🎯 Optimizing learning path for student: ${data.studentId}`);
    
    // Get current progress
    const progress = await this.getStudentProgress(data.studentId);
    
    // Generate optimized path
    const optimizedPath = await this.pipeline.optimizeLearningPath(
      data.studentId,
      progress,
      data.goals
    );
    
    return {
      pathId: optimizedPath.id,
      modules: optimizedPath.modules.length,
      estimatedTime: optimizedPath.estimatedTime,
      difficultyProgression: optimizedPath.difficultyProgression
    };
  }

  async setupHealthMonitoring() {
    // Health check endpoint
    this.healthStatus = {
      status: 'healthy',
      uptime: 0,
      jobsProcessed: 0,
      jobsQueued: 0,
      currentJob: null,
      lastHeartbeat: new Date()
    };

    // Update health status every 30 seconds
    setInterval(() => {
      this.healthStatus.uptime = process.uptime();
      this.healthStatus.jobsQueued = this.jobQueue.length;
      this.healthStatus.currentJob = this.currentJob?.id || null;
      this.healthStatus.lastHeartbeat = new Date();
      
      // Store in Redis
      redis.setex('ml:worker:health', 60, JSON.stringify(this.healthStatus));
    }, 30000);
  }

  // Helper methods
  async getStudentLearningData(studentId) {
    return await db.studentInteraction.findMany({
      where: { studentId },
      include: {
        course: true,
        content: true
      },
      orderBy: { timestamp: 'desc' },
      take: 1000
    });
  }

  async getContentInteractionData() {
    return await db.studentInteraction.findMany({
      include: {
        student: true,
        course: true,
        content: true
      },
      orderBy: { timestamp: 'desc' },
      take: 10000
    });
  }

  async getStudentProgress(studentId) {
    return await db.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
                modules: {
                  include: {
                    lessons: true
                  }
                }
              }
            }
          }
        },
        interactions: {
          orderBy: { timestamp: 'desc' },
          take: 100
        }
      }
    });
  }

  async extractContentRelationships(content) {
    // Placeholder for content relationship extraction
    return [];
  }

  async getGraphNodeCount() {
    // Placeholder for knowledge graph node count
    return 0;
  }

  async getGraphEdgeCount() {
    // Placeholder for knowledge graph edge count
    return 0;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown() {
    console.log('🛑 Shutting down ML Worker...');
    this.isRunning = false;
    
    // Wait for current job to complete
    if (this.currentJob) {
      console.log('⏳ Waiting for current job to complete...');
      while (this.currentJob) {
        await this.sleep(1000);
      }
    }
    
    console.log('✅ ML Worker shutdown complete');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  if (worker) {
    await worker.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (worker) {
    await worker.shutdown();
  }
  process.exit(0);
});

// Start worker
const worker = new MLWorker();
worker.initialize().catch(error => {
  console.error('Failed to start ML Worker:', error);
  process.exit(1);
});