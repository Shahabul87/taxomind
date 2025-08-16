// Health Check for Worker Services

const { redis } = require('../lib/redis');

async function performHealthCheck() {
  try {
    const workerType = process.env.WORKER_TYPE;
    
    // Basic checks
    const checks = {
      process: checkProcess(),
      memory: checkMemory(),
      redis: await checkRedis(),
      timestamp: new Date()
    };
    
    // Worker-specific checks
    switch (workerType) {
      case 'ml':
        checks.ml = await checkMLWorker();
        break;
      case 'analytics':
        checks.analytics = await checkAnalyticsWorker();
        break;
      case 'job_market':
        checks.jobMarket = await checkJobMarketWorker();
        break;
    }
    
    // Determine overall health
    const allHealthy = Object.values(checks).every(check => 
      typeof check === 'object' ? check.status === 'healthy' : true
    );
    
    const healthStatus = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      worker: workerType,
      uptime: process.uptime()
    };
    
    console.log(JSON.stringify(healthStatus, null, 2));
    
    // Exit with appropriate code
    process.exit(allHealthy ? 0 : 1);
    
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

function checkProcess() {
  return {
    status: 'healthy',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
}

function checkMemory() {
  const usage = process.memoryUsage();
  const maxHeap = 1024 * 1024 * 1024; // 1GB threshold
  
  return {
    status: usage.heapUsed < maxHeap ? 'healthy' : 'warning',
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss
  };
}

async function checkRedis() {
  try {
    await redis.ping();
    return {
      status: 'healthy',
      connected: true
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message
    };
  }
}

async function checkMLWorker() {
  try {
    const healthData = await redis.get('ml:worker:health');
    if (!healthData) {
      return {
        status: 'unhealthy',
        error: 'No health data found'
      };
    }
    
    const health = JSON.parse(healthData);
    const now = new Date();
    const lastHeartbeat = new Date(health.lastHeartbeat);
    const timeSinceHeartbeat = now - lastHeartbeat;
    
    return {
      status: timeSinceHeartbeat < 120000 ? 'healthy' : 'unhealthy', // 2 minutes threshold
      lastHeartbeat: health.lastHeartbeat,
      jobsQueued: health.jobsQueued,
      currentJob: health.currentJob
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkAnalyticsWorker() {
  try {
    const healthData = await redis.get('analytics:worker:health');
    if (!healthData) {
      return {
        status: 'unhealthy',
        error: 'No health data found'
      };
    }
    
    const health = JSON.parse(healthData);
    const now = new Date();
    const lastHeartbeat = new Date(health.lastHeartbeat);
    const timeSinceHeartbeat = now - lastHeartbeat;
    
    return {
      status: timeSinceHeartbeat < 120000 ? 'healthy' : 'unhealthy',
      lastHeartbeat: health.lastHeartbeat,
      eventsInBuffer: health.eventsInBuffer,
      eventsProcessed: health.eventsProcessed
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkJobMarketWorker() {
  try {
    const healthData = await redis.get('job_market:worker:health');
    if (!healthData) {
      return {
        status: 'unhealthy',
        error: 'No health data found'
      };
    }
    
    const health = JSON.parse(healthData);
    const now = new Date();
    const lastHeartbeat = new Date(health.lastHeartbeat);
    const timeSinceHeartbeat = now - lastHeartbeat;
    
    return {
      status: timeSinceHeartbeat < 300000 ? 'healthy' : 'unhealthy', // 5 minutes threshold
      lastHeartbeat: health.lastHeartbeat,
      lastUpdate: health.lastUpdate,
      jobsUpdated: health.jobsUpdated
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Run health check
performHealthCheck();