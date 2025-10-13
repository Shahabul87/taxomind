/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { GET, HEAD } from '@/app/api/health/route';

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn((data: any, init?: any) => ({
    json: () => Promise.resolve(data),
    status: init?.status || 200,
  })),
};

// Create a mock constructor function
const MockNextResponse = jest.fn((body: any, init?: any) => ({
  status: init?.status || 200,
  body,
}));

// Add static methods to the constructor
Object.assign(MockNextResponse, mockNextResponse);

jest.mock('next/server', () => ({
  NextRequest: jest.requireActual('next/server').NextRequest,
  NextResponse: MockNextResponse,
}));

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('@/lib/data-fetching/enterprise-data-api', () => ({
  enterpriseDataAPI: {
    healthCheck: jest.fn(),
  },
}));

jest.mock('@/lib/config/news-config', () => ({
  shouldUseRealNews: jest.fn().mockReturnValue(false),
  isProductionEnvironment: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

const { db } = require('@/lib/db');
const { enterpriseDataAPI } = require('@/lib/data-fetching/enterprise-data-api');
const { shouldUseRealNews, isProductionEnvironment } = require('@/lib/config/news-config');

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.RAILWAY_ENVIRONMENT;
    delete process.env.RAILWAY_PROJECT_ID;
    delete process.env.RAILWAY_PUBLIC_DOMAIN;
    delete process.env.VERCEL_ENV;
    delete process.env.npm_package_version;
    
    // Mock process.uptime
    jest.spyOn(process, 'uptime').mockReturnValue(3600);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return healthy status when all services are up', async () => {
      // Mock successful database connection
      db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      
      // Mock successful enterprise API
      enterpriseDataAPI.healthCheck.mockResolvedValue({
        success: true,
        data: { status: 'ok' },
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.services.database.status).toBe('up');
      expect(data.services.database.responseTime).toBeGreaterThanOrEqual(0);
      expect(data.uptime).toBe(3600);
      expect(data.enterpriseAPI).toEqual({ status: 'ok' });
    });

    it('should return unhealthy status when database is down', async () => {
      // Mock database connection failure
      db.$queryRaw.mockRejectedValue(new Error('Connection failed'));
      
      // Mock successful enterprise API
      enterpriseDataAPI.healthCheck.mockResolvedValue({
        success: true,
        data: { status: 'ok' },
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.services.database.status).toBe('down');
      expect(data.services.database.error).toBe('Connection failed');
    });

    it('should include Redis status when configured', async () => {
      // Set up environment variables for Redis
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      // Mock successful database connection
      db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      
      // Mock successful Redis ping
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.services.redis?.status).toBe('up');
      expect(data.services.redis?.responseTime).toBeGreaterThanOrEqual(0);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://redis.upstash.com/ping',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    it('should return degraded status when Redis is down but database is up', async () => {
      // Set up environment variables for Redis
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      // Mock successful database connection
      db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      
      // Mock Redis connection failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.services.database.status).toBe('up');
      expect(data.services.redis?.status).toBe('down');
      expect(data.services.redis?.error).toBe('Redis connection failed');
    });

    it('should handle Redis HTTP error responses', async () => {
      // Set up environment variables for Redis
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      // Mock successful database connection
      db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      
      // Mock Redis HTTP error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.services.redis?.status).toBe('down');
      expect(data.services.redis?.error).toBe('HTTP 401');
    });

    it('should include environment information', async () => {
      // Set environment variables
      process.env.NODE_ENV = 'test';
      process.env.RAILWAY_ENVIRONMENT = 'production';
      process.env.RAILWAY_PROJECT_ID = 'test-project';
      process.env.RAILWAY_PUBLIC_DOMAIN = 'test.railway.app';
      process.env.VERCEL_ENV = 'production';
      process.env.npm_package_version = '2.1.0';

      // Mock production environment
      isProductionEnvironment.mockReturnValue(true);
      
      // Mock successful database connection
      db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.environment.NODE_ENV).toBe('test');
      expect(data.environment.isProduction).toBe(true);
      expect(data.environment.platform.isRailway).toBe(true);
      expect(data.environment.platform.railwayEnvironment).toBe('production');
      expect(data.environment.platform.railwayDomain).toBe('test.railway.app');
      expect(data.environment.platform.isVercel).toBe(true);
      expect(data.environment.platform.vercelEnv).toBe('production');
      expect(data.version).toBe('2.1.0');
    });

    it('should include AI news configuration', async () => {
      // Mock real news mode
      shouldUseRealNews.mockReturnValue(true);
      isProductionEnvironment.mockReturnValue(true);
      
      // Mock successful database connection
      db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.aiNews.mode).toBe('real');
      expect(data.aiNews.willFetchRealNews).toBe(true);
      expect(data.aiNews.isProduction).toBe(true);
    });

    it('should handle enterprise API failure gracefully', async () => {
      // Mock successful database connection
      db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      
      // Mock enterprise API failure
      enterpriseDataAPI.healthCheck.mockRejectedValue(new Error('Enterprise API down'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy'); // Database is still up
      expect(data.enterpriseAPI).toBeUndefined();
    });

    it('should handle unknown database errors', async () => {
      // Mock database connection with non-Error object
      db.$queryRaw.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.services.database.status).toBe('down');
      expect(data.services.database.error).toBe('Unknown error');
    });

    it('should return timestamp and uptime', async () => {
      const startTime = Date.now();
      
      // Mock successful database connection
      db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).getTime()).toBeGreaterThanOrEqual(startTime);
      expect(data.uptime).toBe(3600);
    });
  });

  describe('HEAD /api/health', () => {
    it('should return 200 status for liveness probe', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await HEAD(request);

      expect(response.status).toBe(200);
      expect(response.body).toBe(null);
    });
  });
});