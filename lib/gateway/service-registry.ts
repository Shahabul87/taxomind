/**
 * Service Registry
 * Service discovery and health checks for microservices
 */

import { Redis } from 'ioredis';

export interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date;
  metadata?: Record<string, any>;
  tags?: string[];
  weight?: number; // For load balancing
}

export interface ServiceConfiguration {
  name: string;
  healthCheckPath: string;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxFailures: number;
  loadBalancingStrategy: 'round-robin' | 'weighted' | 'least-connections';
}

export interface HealthCheckResult {
  serviceId: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  error?: string;
}

/**
 * Service Registry Class
 */
export class ServiceRegistry {
  private redis: Redis;
  private services: Map<string, ServiceInstance[]> = new Map();
  private serviceConfigs: Map<string, ServiceConfiguration> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private roundRobinCounters: Map<string, number> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializeDefaultServices();
    this.startHealthChecks();
  }

  /**
   * Initialize default service configurations
   */
  private initializeDefaultServices(): void {
    const defaultServices: ServiceConfiguration[] = [
      {
        name: 'auth-service',
        healthCheckPath: '/health',
        healthCheckInterval: 30000, // 30 seconds
        healthCheckTimeout: 5000,
        maxFailures: 3,
        loadBalancingStrategy: 'round-robin',
      },
      {
        name: 'course-service',
        healthCheckPath: '/health',
        healthCheckInterval: 30000,
        healthCheckTimeout: 5000,
        maxFailures: 3,
        loadBalancingStrategy: 'weighted',
      },
      {
        name: 'analytics-service',
        healthCheckPath: '/health',
        healthCheckInterval: 30000,
        healthCheckTimeout: 5000,
        maxFailures: 3,
        loadBalancingStrategy: 'round-robin',
      },
      {
        name: 'sam-service',
        healthCheckPath: '/health',
        healthCheckInterval: 45000, // Longer interval for AI service
        healthCheckTimeout: 10000,
        maxFailures: 2,
        loadBalancingStrategy: 'least-connections',
      },
      {
        name: 'admin-service',
        healthCheckPath: '/health',
        healthCheckInterval: 30000,
        healthCheckTimeout: 5000,
        maxFailures: 3,
        loadBalancingStrategy: 'round-robin',
      },
      {
        name: 'upload-service',
        healthCheckPath: '/health',
        healthCheckInterval: 30000,
        healthCheckTimeout: 8000, // Longer timeout for upload service
        maxFailures: 3,
        loadBalancingStrategy: 'round-robin',
      },
      {
        name: 'websocket-service',
        healthCheckPath: '/health',
        healthCheckInterval: 20000, // Shorter interval for real-time service
        healthCheckTimeout: 3000,
        maxFailures: 2,
        loadBalancingStrategy: 'least-connections',
      },
    ];

    defaultServices.forEach(config => {
      this.serviceConfigs.set(config.name, config);
      this.roundRobinCounters.set(config.name, 0);
    });

    // Initialize with default local instances
    this.registerDefaultInstances();
  }

  /**
   * Register default service instances for development
   */
  private registerDefaultInstances(): void {
    const basePort = 3000;
    const services = [
      'auth-service',
      'course-service',
      'analytics-service',
      'sam-service',
      'admin-service',
      'upload-service',
      'websocket-service',
    ];

    services.forEach((serviceName, index) => {
      this.registerService({
        id: `${serviceName}-local-001`,
        name: serviceName,
        host: 'localhost',
        port: basePort + index + 1,
        protocol: 'http',
        status: 'unknown',
        lastHealthCheck: new Date(),
        weight: 1,
        tags: ['local', 'development'],
        metadata: {
          version: '1.0.0',
          environment: 'development',
        },
      });
    });
  }

  /**
   * Register a new service instance
   */
  async registerService(instance: ServiceInstance): Promise<void> {
    const instances = this.services.get(instance.name) || [];
    
    // Remove existing instance with same ID
    const filteredInstances = instances.filter(i => i.id !== instance.id);
    filteredInstances.push(instance);
    
    this.services.set(instance.name, filteredInstances);
    
    // Store in Redis for persistence
    await this.redis.hset(
      `service_registry:${instance.name}`,
      instance.id,
      JSON.stringify(instance)
    );

    console.log(`[SERVICE_REGISTRY] Registered service: ${instance.name}:${instance.id}`);
  }

  /**
   * Deregister a service instance
   */
  async deregisterService(serviceName: string, instanceId: string): Promise<void> {
    const instances = this.services.get(serviceName);
    if (!instances) return;

    const filteredInstances = instances.filter(i => i.id !== instanceId);
    this.services.set(serviceName, filteredInstances);

    // Remove from Redis
    await this.redis.hdel(`service_registry:${serviceName}`, instanceId);

    console.log(`[SERVICE_REGISTRY] Deregistered service: ${serviceName}:${instanceId}`);
  }

  /**
   * Get healthy service instance using load balancing
   */
  async getHealthyService(serviceName: string): Promise<string | null> {
    const instances = this.services.get(serviceName);
    if (!instances || instances.length === 0) {
      console.warn(`[SERVICE_REGISTRY] No instances found for service: ${serviceName}`);
      return null;
    }

    const healthyInstances = instances.filter(i => i.status === 'healthy');
    if (healthyInstances.length === 0) {
      console.warn(`[SERVICE_REGISTRY] No healthy instances found for service: ${serviceName}`);
      return null;
    }

    const config = this.serviceConfigs.get(serviceName);
    const selectedInstance = this.selectInstance(healthyInstances, config?.loadBalancingStrategy || 'round-robin');

    if (!selectedInstance) {
      return null;
    }

    return `${selectedInstance.protocol}://${selectedInstance.host}:${selectedInstance.port}`;
  }

  /**
   * Select instance based on load balancing strategy
   */
  private selectInstance(instances: ServiceInstance[], strategy: string): ServiceInstance | null {
    if (instances.length === 0) return null;
    if (instances.length === 1) return instances[0];

    switch (strategy) {
      case 'round-robin':
        return this.roundRobinSelection(instances);
      
      case 'weighted':
        return this.weightedSelection(instances);
      
      case 'least-connections':
        return this.leastConnectionsSelection(instances);
      
      default:
        return instances[0];
    }
  }

  /**
   * Round-robin load balancing
   */
  private roundRobinSelection(instances: ServiceInstance[]): ServiceInstance {
    const serviceName = instances[0].name;
    const counter = this.roundRobinCounters.get(serviceName) || 0;
    const selectedInstance = instances[counter % instances.length];
    
    this.roundRobinCounters.set(serviceName, counter + 1);
    return selectedInstance;
  }

  /**
   * Weighted load balancing
   */
  private weightedSelection(instances: ServiceInstance[]): ServiceInstance {
    const totalWeight = instances.reduce((sum, instance) => sum + (instance.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      random -= (instance.weight || 1);
      if (random <= 0) {
        return instance;
      }
    }
    
    return instances[0]; // Fallback
  }

  /**
   * Least connections load balancing
   */
  private leastConnectionsSelection(instances: ServiceInstance[]): ServiceInstance {
    // In a real implementation, you would track active connections per instance
    // For now, return the instance with the lowest response time or random
    return instances.reduce((best, current) => {
      const bestResponseTime = best.metadata?.averageResponseTime || Infinity;
      const currentResponseTime = current.metadata?.averageResponseTime || Infinity;
      return currentResponseTime < bestResponseTime ? current : best;
    });
  }

  /**
   * Perform health check on service instance
   */
  private async performHealthCheck(instance: ServiceInstance): Promise<HealthCheckResult> {
    const config = this.serviceConfigs.get(instance.name);
    if (!config) {
      return {
        serviceId: instance.id,
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date(),
        error: 'No configuration found',
      };
    }

    const startTime = Date.now();
    const healthUrl = `${instance.protocol}://${instance.host}:${instance.port}${config.healthCheckPath}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.healthCheckTimeout);

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ServiceRegistry-HealthCheck/1.0',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        serviceId: instance.id,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        timestamp: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        serviceId: instance.id,
        status: 'unhealthy',
        responseTime,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Start health checks for all services
   */
  private startHealthChecks(): void {
    for (const [serviceName, config] of this.serviceConfigs.entries()) {
      const intervalId = setInterval(async () => {
        await this.checkServiceHealth(serviceName);
      }, config.healthCheckInterval);

      this.healthCheckIntervals.set(serviceName, intervalId);
      
      // Perform initial health check
      setTimeout(() => this.checkServiceHealth(serviceName), 1000);
    }

    console.log('[SERVICE_REGISTRY] Started health checks for all services');
  }

  /**
   * Check health of all instances of a service
   */
  private async checkServiceHealth(serviceName: string): Promise<void> {
    const instances = this.services.get(serviceName);
    if (!instances || instances.length === 0) return;

    const config = this.serviceConfigs.get(serviceName);
    if (!config) return;

    const healthCheckPromises = instances.map(async (instance) => {
      const result = await this.performHealthCheck(instance);
      
      // Update instance status
      instance.status = result.status;
      instance.lastHealthCheck = result.timestamp;
      
      // Update response time metadata
      if (!instance.metadata) instance.metadata = {};
      instance.metadata.lastResponseTime = result.responseTime;
      
      // Calculate average response time
      const avgResponseTime = instance.metadata.averageResponseTime || result.responseTime;
      instance.metadata.averageResponseTime = (avgResponseTime + result.responseTime) / 2;

      // Store health check result in Redis
      await this.redis.zadd(
        `health_checks:${serviceName}:${instance.id}`,
        result.timestamp.getTime(),
        JSON.stringify(result)
      );

      // Keep only last 100 health check results
      await this.redis.zremrangebyrank(`health_checks:${serviceName}:${instance.id}`, 0, -101);

      if (result.status === 'unhealthy') {
        console.warn(
          `[SERVICE_REGISTRY] Health check failed for ${serviceName}:${instance.id} - ${result.error}`
        );
      }

      return result;
    });

    await Promise.all(healthCheckPromises);
  }

  /**
   * Get service health information
   */
  async getServiceHealth(serviceName?: string): Promise<Record<string, any>> {
    if (serviceName) {
      const instances = this.services.get(serviceName) || [];
      return {
        [serviceName]: {
          instances: instances.map(instance => ({
            id: instance.id,
            status: instance.status,
            lastHealthCheck: instance.lastHealthCheck,
            responseTime: instance.metadata?.lastResponseTime,
          })),
          totalInstances: instances.length,
          healthyInstances: instances.filter(i => i.status === 'healthy').length,
        },
      };
    }

    const allServices: Record<string, any> = {};
    
    for (const [name, instances] of this.services.entries()) {
      allServices[name] = {
        instances: instances.map(instance => ({
          id: instance.id,
          status: instance.status,
          lastHealthCheck: instance.lastHealthCheck,
          responseTime: instance.metadata?.lastResponseTime,
        })),
        totalInstances: instances.length,
        healthyInstances: instances.filter(i => i.status === 'healthy').length,
      };
    }

    return allServices;
  }

  /**
   * Get service discovery information
   */
  async getServiceDiscovery(): Promise<Record<string, ServiceInstance[]>> {
    const discovery: Record<string, ServiceInstance[]> = {};
    
    for (const [serviceName, instances] of this.services.entries()) {
      discovery[serviceName] = instances.map(instance => ({
        ...instance,
        // Don't expose internal metadata in discovery
        metadata: {
          version: instance.metadata?.version,
          environment: instance.metadata?.environment,
        },
      }));
    }

    return discovery;
  }

  /**
   * Add service configuration
   */
  addServiceConfig(config: ServiceConfiguration): void {
    this.serviceConfigs.set(config.name, config);
    this.roundRobinCounters.set(config.name, 0);

    // Start health checks for new service
    const intervalId = setInterval(async () => {
      await this.checkServiceHealth(config.name);
    }, config.healthCheckInterval);

    this.healthCheckIntervals.set(config.name, intervalId);
    
    console.log(`[SERVICE_REGISTRY] Added configuration for service: ${config.name}`);
  }

  /**
   * Remove service configuration
   */
  removeServiceConfig(serviceName: string): void {
    this.serviceConfigs.delete(serviceName);
    this.roundRobinCounters.delete(serviceName);

    // Stop health checks
    const intervalId = this.healthCheckIntervals.get(serviceName);
    if (intervalId) {
      clearInterval(intervalId);
      this.healthCheckIntervals.delete(serviceName);
    }

    // Remove all instances
    this.services.delete(serviceName);
    
    console.log(`[SERVICE_REGISTRY] Removed configuration for service: ${serviceName}`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    // Stop all health check intervals
    for (const intervalId of this.healthCheckIntervals.values()) {
      clearInterval(intervalId);
    }

    this.healthCheckIntervals.clear();
    console.log('[SERVICE_REGISTRY] Shutdown completed');
  }
}

export default ServiceRegistry;