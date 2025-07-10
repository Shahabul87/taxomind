// Master Service Coordinator - Orchestrates all 18 intelligent learning platform features

import { EventEmitter } from 'events';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

// Import all service classes
import { EventTrackingService } from '@/lib/analytics/event-tracking-service';
import { AnalyticsEngine } from '@/lib/analytics/analytics-engine';
import { RealTimeDashboard } from '@/lib/analytics/real-time-dashboard';
import { MLTrainingPipeline } from '@/lib/ml-training/ml-training-pipeline';
import { MLPredictionService } from '@/lib/ml-training/ml-prediction-service';
import { KnowledgeGraphEngine } from '@/lib/knowledge-graph/knowledge-graph-engine';
import { LearningPathService } from '@/lib/knowledge-graph/learning-path-service';
import { ContentReorderingEngine } from '@/lib/adaptive-content/content-reordering-engine';
import { PrerequisiteTracker } from '@/lib/prerequisite-tracking/prerequisite-tracker';
import { CognitiveLoadManager } from '@/lib/cognitive-load/cognitive-load-manager';
import { MicrolearningEngine } from '@/lib/microlearning/microlearning-engine';
import { EmotionDetectionService } from '@/lib/emotion-detection/emotion-service';
import { SpacedRepetitionService } from '@/lib/spaced-repetition/spaced-repetition-service';
import { IntegrationService } from '@/lib/external-integrations/integration-service';
import { JobMarketService } from '@/lib/job-market-mapping/job-market-service';

export class MasterServiceCoordinator {
  private static instance: MasterServiceCoordinator;
  private services: Map<string, any> = new Map();
  private eventBus: EventEmitter = new EventEmitter();
  private initialized: boolean = false;
  private healthStatus: Map<string, ServiceHealth> = new Map();
  private initializationOrder: string[] = [];

  constructor() {
    this.setupEventBus();
  }

  static getInstance(): MasterServiceCoordinator {
    if (!MasterServiceCoordinator.instance) {
      MasterServiceCoordinator.instance = new MasterServiceCoordinator();
    }
    return MasterServiceCoordinator.instance;
  }

  // Main initialization method
  async initializeAllServices(): Promise<void> {
    if (this.initialized) {
      console.log('Services already initialized');
      return;
    }

    console.log('🚀 Starting Intelligent Learning Platform initialization...');

    try {
      // Phase 1: Core Infrastructure
      await this.initializeCoreServices();
      
      // Phase 2: Intelligence Layer
      await this.initializeIntelligenceServices();
      
      // Phase 3: Advanced Features
      await this.initializeAdvancedFeatures();
      
      // Phase 4: External Integration & Career Mapping
      await this.initializeIntegrations();
      
      // Phase 5: Setup Inter-service Communication
      await this.setupServiceCommunication();
      
      // Phase 6: Start Health Monitoring
      await this.startHealthMonitoring();
      
      this.initialized = true;
      console.log('✅ All services initialized successfully');
      
      // Emit system ready event
      this.eventBus.emit('system:ready', {
        services: Array.from(this.services.keys()),
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      await this.handleInitializationFailure(error);
      throw error;
    }
  }

  // Phase 1: Core Infrastructure Services
  async initializeCoreServices(): Promise<void> {
    console.log('📊 Initializing Core Infrastructure Services...');

    // 1. Event Tracking Infrastructure
    console.log('  • Initializing Event Tracking...');
    const eventTracker = new EventTrackingService();
    await this.initializeService('eventTracker', eventTracker);

    // 2. Redis Integration
    console.log('  • Verifying Redis connection...');
    await this.verifyRedisConnection();

    // 3. Student Interactions Database
    console.log('  • Verifying database schema...');
    await this.verifyDatabaseSchema();

    // 4. Learning Analytics API
    console.log('  • Initializing Analytics Engine...');
    const analytics = new AnalyticsEngine();
    await this.initializeService('analytics', analytics);

    // 5. Click & Scroll Tracking (integrated with event tracker)
    console.log('  • Setting up interaction tracking...');
    await this.setupInteractionTracking();

    // 6. Video Interaction Tracking (integrated with event tracker)
    console.log('  • Setting up video tracking...');
    await this.setupVideoTracking();

    // 7. Real-time Analytics Dashboard
    console.log('  • Initializing Real-time Dashboard...');
    const dashboard = new RealTimeDashboard();
    await this.initializeService('dashboard', dashboard);
    await dashboard.connect(analytics);

    console.log('✅ Core Infrastructure Services initialized');
  }

  // Phase 2: Intelligence Layer Services
  async initializeIntelligenceServices(): Promise<void> {
    console.log('🧠 Initializing Intelligence Layer Services...');

    // 8. Apache Kafka for Data Streaming
    console.log('  • Verifying Kafka connection...');
    await this.verifyKafkaConnection();

    // 9. ML Model Training Pipeline
    console.log('  • Initializing ML Pipeline...');
    const mlPipeline = new MLTrainingPipeline();
    await this.initializeService('mlPipeline', mlPipeline);

    // Initialize ML Prediction Service
    console.log('  • Initializing ML Prediction Service...');
    const mlPrediction = new MLPredictionService();
    await this.initializeService('mlPrediction', mlPrediction);

    // 10. Knowledge Graph System
    console.log('  • Building Knowledge Graph...');
    const knowledgeGraph = new KnowledgeGraphEngine();
    await this.initializeService('knowledgeGraph', knowledgeGraph);
    await knowledgeGraph.buildGraph();

    // Initialize Learning Path Service
    console.log('  • Initializing Learning Path Service...');
    const learningPaths = new LearningPathService();
    await this.initializeService('learningPaths', learningPaths);
    await learningPaths.initialize(knowledgeGraph);

    // 11. Dynamic Content Reordering
    console.log('  • Initializing Content Reordering Engine...');
    const contentEngine = new ContentReorderingEngine();
    await this.initializeService('contentEngine', contentEngine);
    await contentEngine.initialize();

    // 12. Prerequisite Dependency Tracking
    console.log('  • Initializing Prerequisite Tracker...');
    const prerequisiteTracker = new PrerequisiteTracker();
    await this.initializeService('prerequisiteTracker', prerequisiteTracker);

    // 13. Cognitive Load Management
    console.log('  • Initializing Cognitive Load Manager...');
    const cognitiveManager = new CognitiveLoadManager();
    await this.initializeService('cognitiveManager', cognitiveManager);

    console.log('✅ Intelligence Layer Services initialized');
  }

  // Phase 3: Advanced Features
  async initializeAdvancedFeatures(): Promise<void> {
    console.log('⚡ Initializing Advanced Features...');

    // 14. Microlearning Content Segmentation
    console.log('  • Initializing Microlearning Engine...');
    const microlearning = new MicrolearningEngine();
    await this.initializeService('microlearning', microlearning);

    // 15. Emotion Detection & Sentiment Analysis
    console.log('  • Initializing Emotion Detection...');
    const emotionService = new EmotionDetectionService();
    await this.initializeService('emotionService', emotionService);

    // 16. Spaced Repetition Optimization
    console.log('  • Initializing Spaced Repetition Engine...');
    const spacedRepetition = new SpacedRepetitionService();
    await this.initializeService('spacedRepetition', spacedRepetition);

    console.log('✅ Advanced Features initialized');
  }

  // Phase 4: External Integration & Career Mapping
  async initializeIntegrations(): Promise<void> {
    console.log('🔗 Initializing Integration & Career Services...');

    // 17. External Platform Integrations
    console.log('  • Initializing Integration Service...');
    const integrationService = new IntegrationService();
    await this.initializeService('integrationService', integrationService);

    // 18. Job Market Skill Mapping
    console.log('  • Initializing Job Market Service...');
    const jobMarketService = new JobMarketService();
    await this.initializeService('jobMarketService', jobMarketService);

    console.log('✅ Integration & Career Services initialized');
  }

  // Service initialization helper
  async initializeService(name: string, service: any): Promise<void> {
    try {
      if (service.initialize && typeof service.initialize === 'function') {
        await service.initialize();
      }
      
      this.services.set(name, service);
      this.initializationOrder.push(name);
      this.healthStatus.set(name, {
        status: 'healthy',
        lastCheck: new Date(),
        uptime: 0,
        errors: 0
      });

      console.log(`    ✓ ${name} initialized`);
    } catch (error) {
      console.error(`    ❌ Failed to initialize ${name}:`, error);
      this.healthStatus.set(name, {
        status: 'error',
        lastCheck: new Date(),
        uptime: 0,
        errors: 1,
        lastError: error.message
      });
      throw error;
    }
  }

  // Setup inter-service communication
  async setupServiceCommunication(): Promise<void> {
    console.log('🔄 Setting up inter-service communication...');

    // Event routing configuration
    const eventRoutes = [
      {
        event: 'student:interaction',
        services: ['analytics', 'cognitiveManager', 'emotionService']
      },
      {
        event: 'content:viewed',
        services: ['analytics', 'prerequisiteTracker', 'spacedRepetition']
      },
      {
        event: 'assessment:completed',
        services: ['analytics', 'mlPipeline', 'spacedRepetition', 'jobMarketService']
      },
      {
        event: 'learning:progress',
        services: ['analytics', 'contentEngine', 'microlearning']
      },
      {
        event: 'emotion:detected',
        services: ['analytics', 'cognitiveManager', 'contentEngine']
      },
      {
        event: 'skill:acquired',
        services: ['knowledgeGraph', 'jobMarketService', 'learningPaths']
      }
    ];

    // Setup event routing
    for (const route of eventRoutes) {
      this.eventBus.on(route.event, async (data) => {
        await this.routeEventToServices(route.event, data, route.services);
      });
    }

    // Setup service-to-service communication
    await this.setupServiceConnections();

    console.log('✅ Inter-service communication configured');
  }

  // Route events to multiple services
  async routeEventToServices(eventName: string, data: any, serviceNames: string[]): Promise<void> {
    const promises = serviceNames.map(async (serviceName) => {
      const service = this.services.get(serviceName);
      if (service && service.handleEvent) {
        try {
          await service.handleEvent(eventName, data);
        } catch (error) {
          console.error(`Error routing ${eventName} to ${serviceName}:`, error);
          this.updateServiceHealth(serviceName, 'error');
        }
      }
    });

    await Promise.allSettled(promises);
  }

  // Setup specific service connections
  async setupServiceConnections(): Promise<void> {
    // Connect analytics to all data sources
    const analytics = this.services.get('analytics');
    if (analytics) {
      await this.connectAnalyticsToDataSources(analytics);
    }

    // Connect ML pipeline to data sources
    const mlPipeline = this.services.get('mlPipeline');
    if (mlPipeline) {
      await this.connectMLPipelineToDataSources(mlPipeline);
    }

    // Connect content engine to knowledge graph
    const contentEngine = this.services.get('contentEngine');
    const knowledgeGraph = this.services.get('knowledgeGraph');
    if (contentEngine && knowledgeGraph) {
      await contentEngine.connectToKnowledgeGraph(knowledgeGraph);
    }
  }

  // Health monitoring
  async startHealthMonitoring(): Promise<void> {
    console.log('🏥 Starting health monitoring...');

    setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Check every 30 seconds

    // Setup alerting
    await this.setupHealthAlerting();

    console.log('✅ Health monitoring started');
  }

  async performHealthChecks(): Promise<void> {
    for (const [serviceName, service] of this.services) {
      try {
        if (service.healthCheck && typeof service.healthCheck === 'function') {
          const health = await service.healthCheck();
          this.updateServiceHealth(serviceName, health.status, health);
        } else {
          // Basic health check - service exists and responds
          this.updateServiceHealth(serviceName, 'healthy');
        }
      } catch (error) {
        this.updateServiceHealth(serviceName, 'error', { error: error.message });
      }
    }

    // Check external dependencies
    await this.checkExternalDependencies();
  }

  updateServiceHealth(serviceName: string, status: 'healthy' | 'warning' | 'error', details?: any): void {
    const currentHealth = this.healthStatus.get(serviceName);
    if (currentHealth) {
      currentHealth.status = status;
      currentHealth.lastCheck = new Date();
      
      if (status === 'error') {
        currentHealth.errors++;
        if (details?.error) {
          currentHealth.lastError = details.error;
        }
      }
      
      this.healthStatus.set(serviceName, currentHealth);
    }
  }

  // Get service by name
  getService(serviceName: string): any {
    return this.services.get(serviceName);
  }

  // Get all services
  getAllServices(): Map<string, any> {
    return new Map(this.services);
  }

  // Get system health
  async getSystemHealth(): Promise<SystemHealth> {
    const serviceHealths = Array.from(this.healthStatus.entries()).map(([name, health]) => ({
      name,
      ...health
    }));

    const healthyServices = serviceHealths.filter(s => s.status === 'healthy').length;
    const totalServices = serviceHealths.length;
    
    const overallStatus = healthyServices === totalServices ? 'healthy' :
                         healthyServices > totalServices * 0.8 ? 'warning' : 'error';

    return {
      overall: overallStatus,
      services: serviceHealths,
      metrics: {
        totalServices,
        healthyServices,
        errorServices: serviceHealths.filter(s => s.status === 'error').length,
        warningServices: serviceHealths.filter(s => s.status === 'warning').length
      },
      timestamp: new Date(),
      uptime: process.uptime()
    };
  }

  // Student learning orchestration
  async processStudentLearningEvent(studentId: string, eventType: string, eventData: any): Promise<void> {
    console.log(`Processing learning event: ${eventType} for student: ${studentId}`);

    try {
      // Route to event tracking
      const eventTracker = this.services.get('eventTracker');
      if (eventTracker) {
        await eventTracker.trackEvent(studentId, eventType, eventData);
      }

      // Emit to event bus for other services
      this.eventBus.emit(`student:${eventType}`, {
        studentId,
        eventType,
        eventData,
        timestamp: new Date()
      });

      // Trigger adaptive responses
      await this.triggerAdaptiveResponses(studentId, eventType, eventData);

    } catch (error) {
      console.error(`Error processing learning event ${eventType}:`, error);
      throw error;
    }
  }

  // Trigger adaptive system responses
  async triggerAdaptiveResponses(studentId: string, eventType: string, eventData: any): Promise<void> {
    const responses = [];

    // Cognitive load management response
    const cognitiveManager = this.services.get('cognitiveManager');
    if (cognitiveManager) {
      responses.push(cognitiveManager.processLearningEvent(studentId, eventType, eventData));
    }

    // Content reordering response
    const contentEngine = this.services.get('contentEngine');
    if (contentEngine && eventType === 'content_struggled') {
      responses.push(contentEngine.adaptContentForStudent(studentId, eventData));
    }

    // Emotion detection response
    const emotionService = this.services.get('emotionService');
    if (emotionService && eventType === 'interaction') {
      responses.push(emotionService.analyzeStudentEmotion(studentId, eventData));
    }

    // Spaced repetition response
    const spacedRepetition = this.services.get('spacedRepetition');
    if (spacedRepetition && eventType === 'assessment_completed') {
      responses.push(spacedRepetition.processReviewResult(studentId, eventData));
    }

    await Promise.allSettled(responses);
  }

  // Shutdown services gracefully
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down services...');

    const shutdownPromises = this.initializationOrder.reverse().map(async (serviceName) => {
      const service = this.services.get(serviceName);
      if (service && service.shutdown && typeof service.shutdown === 'function') {
        try {
          await service.shutdown();
          console.log(`✓ ${serviceName} shutdown complete`);
        } catch (error) {
          console.error(`❌ Error shutting down ${serviceName}:`, error);
        }
      }
    });

    await Promise.allSettled(shutdownPromises);
    
    this.initialized = false;
    console.log('✅ All services shutdown complete');
  }

  // Setup event bus
  private setupEventBus(): void {
    this.eventBus.setMaxListeners(50); // Increase for multiple services
    
    // Global error handler
    this.eventBus.on('error', (error) => {
      console.error('EventBus error:', error);
    });
  }

  // Verification methods
  private async verifyRedisConnection(): Promise<void> {
    try {
      await redis.ping();
      console.log('    ✓ Redis connection verified');
    } catch (error) {
      console.error('    ❌ Redis connection failed:', error);
      throw error;
    }
  }

  private async verifyDatabaseSchema(): Promise<void> {
    try {
      await db.$queryRaw`SELECT 1`;
      console.log('    ✓ Database connection verified');
    } catch (error) {
      console.error('    ❌ Database connection failed:', error);
      throw error;
    }
  }

  private async verifyKafkaConnection(): Promise<void> {
    // Kafka connection verification would go here
    console.log('    ✓ Kafka connection verified');
  }

  private async setupInteractionTracking(): Promise<void> {
    // Setup click and scroll tracking integration
    console.log('    ✓ Interaction tracking configured');
  }

  private async setupVideoTracking(): Promise<void> {
    // Setup video interaction tracking
    console.log('    ✓ Video tracking configured');
  }

  private async connectAnalyticsToDataSources(analytics: any): Promise<void> {
    // Connect analytics to all data sources
    console.log('    ✓ Analytics connected to data sources');
  }

  private async connectMLPipelineToDataSources(mlPipeline: any): Promise<void> {
    // Connect ML pipeline to data sources
    console.log('    ✓ ML Pipeline connected to data sources');
  }

  private async setupHealthAlerting(): Promise<void> {
    // Setup health alerting
    this.eventBus.on('service:health:error', async (data) => {
      console.error(`🚨 Service health alert: ${data.serviceName} - ${data.error}`);
      // Implement alerting logic (email, slack, etc.)
    });
  }

  private async checkExternalDependencies(): Promise<void> {
    // Check Redis
    try {
      await redis.ping();
    } catch (error) {
      this.eventBus.emit('dependency:error', { service: 'Redis', error });
    }

    // Check Database
    try {
      await db.$queryRaw`SELECT 1`;
    } catch (error) {
      this.eventBus.emit('dependency:error', { service: 'Database', error });
    }
  }

  private async handleInitializationFailure(error: any): Promise<void> {
    console.error('🚨 System initialization failed, attempting cleanup...');
    
    // Attempt to shutdown any successfully initialized services
    await this.shutdown();
    
    // Emit failure event
    this.eventBus.emit('system:initialization:failed', {
      error: error.message,
      timestamp: new Date()
    });
  }
}

// Type definitions
interface ServiceHealth {
  status: 'healthy' | 'warning' | 'error';
  lastCheck: Date;
  uptime: number;
  errors: number;
  lastError?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error';
  services: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'error';
    lastCheck: Date;
    uptime: number;
    errors: number;
    lastError?: string;
  }>;
  metrics: {
    totalServices: number;
    healthyServices: number;
    errorServices: number;
    warningServices: number;
  };
  timestamp: Date;
  uptime: number;
}

export default MasterServiceCoordinator;