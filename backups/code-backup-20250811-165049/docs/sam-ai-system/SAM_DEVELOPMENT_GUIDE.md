# SAM AI Development Guide
**Taxomind LMS - Developer Setup & Best Practices**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Docker (optional, for containerized development)
- Git

### Environment Setup

1. **Clone and Install**
```bash
git clone https://github.com/your-org/taxomind-lms.git
cd taxomind-lms
npm install
```

2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
# See Environment Variables section below
```

3. **Database Setup**
```bash
# Start local PostgreSQL (Docker)
npm run dev:docker:start

# Reset and seed database
npm run dev:setup

# Or just seed with test data
npm run dev:db:seed
```

4. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## ⚙️ Environment Variables

### Required SAM Configuration
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/taxomind"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# SAM AI Configuration
SAM_API_KEY="your-sam-api-key"
SAM_ENGINE_URL="https://api.sam-ai.com"

# OpenAI Integration (for content generation)
OPENAI_API_KEY="your-openai-key"

# Collaboration Features
WEBSOCKET_URL="ws://localhost:3001"
COLLABORATION_SECRET="your-collaboration-secret"

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Analytics & Monitoring
ANALYTICS_API_KEY="your-analytics-key"
MONITORING_URL="https://monitoring.example.com"

# Enterprise Features
ENTERPRISE_MODE="true"
STRICT_ENV_MODE="false" # Set to true in production
```

### Optional Configuration
```bash
# Real-time Features
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="your-cluster"

# Email Service
EMAIL_SERVER="smtp://username:password@smtp.example.com:587"
EMAIL_FROM="noreply@taxomind.com"

# Storage
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_BUCKET="taxomind-storage"
```

---

## 🏗️ SAM Architecture Deep Dive

### System Components
```
SAM AI System Architecture:
├── Frontend Layer
│   ├── React Components (UI)
│   ├── Next.js App Router (Routing)
│   └── State Management (Hooks/Context)
├── API Layer
│   ├── Next.js API Routes
│   ├── SAM Engine Integrations
│   └── Real-time WebSocket Server
├── SAM Engine Layer
│   ├── Content Intelligence Engine
│   ├── Learning Analytics Engine
│   ├── Personalization Engine
│   ├── Enterprise Intelligence Engine
│   └── Financial Intelligence Engine
├── Data Layer
│   ├── PostgreSQL Database
│   ├── Prisma ORM
│   └── Redis Cache (optional)
└── External Services
    ├── OpenAI API
    ├── Cloudinary CDN
    └── Analytics Services
```

### Data Flow
```mermaid
graph TD
    A[User Interaction] --> B[React Component]
    B --> C[API Route]
    C --> D[SAM Engine]
    D --> E[Database/External API]
    E --> F[Process & Analyze]
    F --> G[Return Results]
    G --> H[Update UI]
    H --> I[Real-time Updates]
```

---

## 🧠 SAM Engine Integration

### 1. Content Intelligence Integration

```typescript
// lib/sam-content-engine.ts
export class SAMContentEngine {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SAM_API_KEY!;
    this.baseUrl = process.env.SAM_ENGINE_URL!;
  }

  async analyzeContent(params: ContentAnalysisParams): Promise<ContentAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/content/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`SAM API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SAM Content Analysis failed:', error);
      throw new Error('Content analysis unavailable');
    }
  }
}
```

### 2. Learning Analytics Integration

```typescript
// lib/sam-learning-engine.ts
export class SAMLearningEngine {
  async generatePredictiveInsights(
    params: LearningAnalysisParams
  ): Promise<LearningInsights> {
    // Implementation with error handling, caching, and fallbacks
    try {
      const insights = await this.callSAMAPI('/learning/insights', params);
      
      // Cache results for performance
      await this.cacheInsights(params.userId, insights);
      
      return insights;
    } catch (error) {
      // Fallback to cached data or default insights
      return this.getFallbackInsights(params.userId);
    }
  }

  private async cacheInsights(userId: string, insights: LearningInsights) {
    // Implementation depends on your caching strategy
    // Redis, in-memory, or database caching
  }
}
```

### 3. Error Handling Strategy

```typescript
// lib/sam-error-handler.ts
export class SAMErrorHandler {
  static handleAPIError(error: any, context: string) {
    const errorDetails = {
      context,
      error: error.message,
      timestamp: new Date().toISOString(),
      userId: 'current-user-id' // Get from session
    };

    // Log to monitoring service
    console.error(`SAM Error [${context}]:`, errorDetails);

    // Determine appropriate fallback
    switch (context) {
      case 'content-analysis':
        return this.getContentAnalysisFallback();
      case 'learning-insights':
        return this.getLearningInsightsFallback();
      case 'personalization':
        return this.getPersonalizationFallback();
      default:
        throw new Error('SAM service temporarily unavailable');
    }
  }
}
```

---

## 🎨 Component Development Patterns

### 1. SAM Component Template

```typescript
// components/sam/sam-component-template.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SAMComponentProps {
  // Required props
  userId: string;
  
  // Optional props with defaults
  enableRealTime?: boolean;
  showLoadingState?: boolean;
  enableErrorBoundary?: boolean;
  
  // Event handlers
  onDataLoaded?: (data: any) => void;
  onError?: (error: Error) => void;
  
  // Styling
  className?: string;
}

export function SAMComponentTemplate({
  userId,
  enableRealTime = true,
  showLoadingState = true,
  enableErrorBoundary = true,
  onDataLoaded,
  onError,
  className
}: SAMComponentProps) {
  // State management
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Data fetching with error handling
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sam/your-endpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data);
      
      if (onDataLoaded) {
        onDataLoaded(result.data);
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (onError) {
        onError(error);
      }

      // Show user-friendly toast
      toast.error('Failed to load SAM data. Please try again.');

    } finally {
      setIsLoading(false);
    }
  }, [userId, onDataLoaded, onError]);

  // Retry mechanism
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      fetchData();
    } else {
      toast.error('Maximum retry attempts reached. Please refresh the page.');
    }
  }, [retryCount, fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates (if enabled)
  useEffect(() => {
    if (!enableRealTime) return;

    const eventSource = new EventSource(`/api/sam/stream?userId=${userId}`);
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setData(prevData => ({ ...prevData, ...update }));
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userId, enableRealTime]);

  // Loading state
  if (isLoading && showLoadingState) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span className="text-sm text-gray-600">Loading SAM insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && enableErrorBoundary) {
    return (
      <Card className={cn("w-full border-red-200", className)}>
        <CardContent className="py-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mb-4">
              {error.message || 'Something went wrong with SAM AI service.'}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              disabled={retryCount >= 3}
            >
              {retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main content
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full", className)}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            SAM Component Title
            {enableRealTime && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Live
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your component content here */}
          <div className="space-y-4">
            {data && (
              <pre className="text-sm bg-gray-100 p-4 rounded">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

### 2. Custom Hooks Pattern

```typescript
// hooks/use-sam-analytics.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseSAMAnalyticsOptions {
  userId: string;
  courseId?: string;
  timeRange?: '7d' | '30d' | '90d';
  enableRealTime?: boolean;
  refreshInterval?: number;
}

export function useSAMAnalytics(options: UseSAMAnalyticsOptions) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/sam/learning-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-insights',
          data: {
            userId: options.userId,
            courseId: options.courseId,
            timeRange: options.timeRange || '30d'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setAnalytics(result.data);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [options.userId, options.courseId, options.timeRange]);

  // Auto-refresh
  useEffect(() => {
    const interval = options.refreshInterval;
    if (interval && interval > 0) {
      const timer = setInterval(fetchAnalytics, interval);
      return () => clearInterval(timer);
    }
  }, [fetchAnalytics, options.refreshInterval]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refresh: fetchAnalytics,
    isStale: false // Could implement staleness detection
  };
}
```

---

## 🧪 Testing SAM Components

### 1. Unit Testing Setup

```typescript
// __tests__/components/sam/multi-modal-content-intelligence.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MultiModalContentIntelligence } from '@/components/sam/multi-modal-content-intelligence';
import { mockSAMResponse } from '../__mocks__/sam-responses';

// Mock the SAM API
jest.mock('@/lib/sam-content-engine', () => ({
  samContentEngine: {
    analyzeContent: jest.fn().mockResolvedValue(mockSAMResponse.contentAnalysis)
  }
}));

describe('MultiModalContentIntelligence', () => {
  const defaultProps = {
    contentId: 'test-content-123',
    userId: 'user-456',
    enableAutoEnhancement: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<MultiModalContentIntelligence {...defaultProps} />);
    expect(screen.getByText(/analyzing content/i)).toBeInTheDocument();
  });

  it('displays analysis results after loading', async () => {
    render(<MultiModalContentIntelligence {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/complexity score/i)).toBeInTheDocument();
    });

    expect(screen.getByText('75')).toBeInTheDocument(); // Mock complexity score
  });

  it('handles API errors gracefully', async () => {
    const mockAnalyze = jest.spyOn(require('@/lib/sam-content-engine'), 'samContentEngine');
    mockAnalyze.analyzeContent.mockRejectedValueOnce(new Error('API Error'));

    render(<MultiModalContentIntelligence {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('calls onAnalysisComplete callback when analysis finishes', async () => {
    const mockCallback = jest.fn();
    
    render(
      <MultiModalContentIntelligence 
        {...defaultProps}
        onAnalysisComplete={mockCallback}
      />
    );

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockSAMResponse.contentAnalysis);
    });
  });
});
```

### 2. Integration Testing

```typescript
// __tests__/integration/sam-api.test.ts
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '@/app/api/sam/content-analysis/route';

describe('/api/sam/content-analysis', () => {
  it('should analyze content successfully', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze-content',
            data: {
              content: 'Test content for analysis',
              type: 'text',
              context: {
                courseId: 'test-course',
                level: 'intermediate'
              }
            }
          })
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.complexityScore).toBeDefined();
      }
    });
  });
});
```

### 3. E2E Testing with Playwright

```typescript
// e2e/sam-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SAM Integration', () => {
  test('content intelligence analyzes uploaded content', async ({ page }) => {
    await page.goto('/course/test-course/content/upload');

    // Upload content
    await page.setInputFiles('#content-upload', 'test-content.txt');
    await page.click('#analyze-button');

    // Wait for SAM analysis
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Verify complexity score is displayed
    await expect(page.locator('[data-testid="complexity-score"]')).toContainText(/\d+/);

    // Verify suggestions are shown
    await expect(page.locator('[data-testid="enhancement-suggestions"]')).toBeVisible();
  });

  test('personalized learning dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard/student');

    // Wait for personalized content
    await expect(page.locator('[data-testid="personalized-recommendations"]')).toBeVisible();
    
    // Verify study buddy appears
    await expect(page.locator('[data-testid="study-buddy"]')).toBeVisible();

    // Test interaction with recommendations
    await page.click('[data-testid="recommendation-0"]');
    await expect(page).toHaveURL(/.*course.*/);
  });
});
```

---

## 🚀 Deployment Guide

### 1. Production Environment Setup

```bash
# Production environment variables
ENVIRONMENT="production"
STRICT_ENV_MODE="true"
DATABASE_URL="postgresql://prod-user:password@prod-db:5432/taxomind_prod"

# SAM Production Configuration
SAM_API_KEY="prod-sam-api-key"
SAM_ENGINE_URL="https://prod-api.sam-ai.com"
SAM_RATE_LIMIT="1000"

# Security
NEXTAUTH_SECRET="production-secret-key-256-chars"
NEXTAUTH_URL="https://taxomind.com"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
DATADOG_API_KEY="your-datadog-key"
```

### 2. Docker Deployment

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

# Health check for SAM services
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SAM_API_KEY=${SAM_API_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: taxomind_prod
      POSTGRES_USER: prod_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### 3. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy SAM Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Lint code
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          SAM_API_KEY: ${{ secrets.SAM_API_KEY }}
      
      - name: Build Docker image
        run: docker build -t taxomind/sam-platform:${{ github.sha }} .
      
      - name: Push to registry
        run: docker push taxomind/sam-platform:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: |
          # Your deployment script here
          ./scripts/deploy.sh ${{ github.sha }}
```

---

## 📊 Monitoring and Analytics

### 1. Performance Monitoring

```typescript
// lib/monitoring.ts
import { performance } from 'perf_hooks';

export class SAMMonitoring {
  static trackAPICall(endpoint: string, duration: number, success: boolean) {
    const metric = {
      endpoint,
      duration,
      success,
      timestamp: Date.now()
    };

    // Send to your monitoring service
    this.sendToDatadog(metric);
    this.sendToSentry(metric);
  }

  static trackComponentRender(componentName: string, renderTime: number) {
    const metric = {
      component: componentName,
      renderTime,
      timestamp: Date.now()
    };

    this.sendMetric('component_render', metric);
  }

  static trackUserEngagement(action: string, metadata: any) {
    const event = {
      action,
      metadata,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.sendToAnalytics(event);
  }
}

// Usage in components
export function withSAMMonitoring<T extends {}>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function MonitoredComponent(props: T) {
    const startTime = performance.now();

    useEffect(() => {
      const endTime = performance.now();
      SAMMonitoring.trackComponentRender(componentName, endTime - startTime);
    }, []);

    return <Component {...props} />;
  };
}
```

### 2. Error Tracking

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

export class SAMErrorTracking {
  static captureException(error: Error, context: any) {
    Sentry.withScope((scope) => {
      scope.setTag('component', 'SAM');
      scope.setContext('sam_context', context);
      scope.setLevel('error');
      Sentry.captureException(error);
    });
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error') {
    Sentry.captureMessage(message, level);
  }

  static addBreadcrumb(message: string, category: string, data?: any) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      timestamp: Date.now() / 1000
    });
  }
}
```

---

## 🔧 Development Tools

### 1. SAM CLI Tool

```bash
# Install SAM CLI globally
npm install -g @taxomind/sam-cli

# Generate SAM component
sam generate component MyAnalyticsDashboard --type=analytics

# Test SAM API endpoints
sam test api --endpoint=content-analysis --payload=test-content.json

# Validate SAM configuration
sam validate config

# Deploy SAM updates
sam deploy --environment=staging
```

### 2. VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "prisma.prisma",
    "taxomind.sam-intellisense" // Custom extension for SAM
  ]
}
```

### 3. Development Scripts

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "dev:sam": "next dev --experimental-app --experimental-sam",
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:sam": "jest --testPathPattern=sam",
    "test:e2e": "playwright test",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx scripts/seed.ts",
    "sam:health": "tsx scripts/sam-health-check.ts",
    "sam:migrate": "tsx scripts/sam-migrate.ts"
  }
}
```

---

## 📋 Troubleshooting

### Common Issues

#### 1. SAM API Connection Issues
```bash
# Check API health
curl -f http://localhost:3000/api/sam/health

# Verify environment variables
npm run env:check

# Test database connection
npm run db:health
```

#### 2. Component Not Loading
```typescript
// Debug component loading
console.log('Component props:', props);
console.log('SAM API available:', process.env.SAM_API_KEY ? 'Yes' : 'No');

// Check error boundaries
<SAMErrorBoundary>
  <YourSAMComponent />
</SAMErrorBoundary>
```

#### 3. Performance Issues
```typescript
// Profile component performance
import { Profiler } from 'react';

<Profiler id="SAMComponent" onRender={onRenderCallback}>
  <SAMComponent />
</Profiler>
```

### Debug Commands

```bash
# Enable debug mode
DEBUG=sam:* npm run dev

# Check SAM engine status
npm run sam:status

# Clear SAM cache
npm run sam:cache:clear

# Validate SAM configuration
npm run sam:config:validate

# Generate SAM report
npm run sam:report --format=json
```

---

## 🎓 Learning Resources

### Documentation
- [SAM AI Official Documentation](https://docs.sam-ai.com)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Video Tutorials
- SAM Integration Masterclass (Internal)
- Building AI-Powered Learning Platforms
- Next.js Performance Optimization

### Code Examples
- [SAM Component Library Storybook](https://storybook.taxomind.com)
- [SAM Integration Examples Repository](https://github.com/taxomind/sam-examples)
- [Performance Optimization Patterns](https://github.com/taxomind/performance-patterns)

---

## 🚀 What's Next?

### Upcoming Features
- **Advanced AI Tutoring**: GPT-4 powered personal tutors
- **VR/AR Integration**: Immersive learning experiences  
- **Blockchain Certification**: Decentralized credential verification
- **Advanced Analytics**: ML-powered learning outcome predictions
- **Mobile App**: Native iOS/Android applications

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/sam-enhancement`)
3. Commit your changes (`git commit -am 'Add SAM enhancement'`)
4. Push to the branch (`git push origin feature/sam-enhancement`)
5. Create a Pull Request

### Community
- [Discord Server](https://discord.gg/taxomind)
- [GitHub Discussions](https://github.com/taxomind/discussions)
- [Developer Blog](https://blog.taxomind.com/developers)

---

**Happy SAM Development! 🧠✨**

*Last Updated: January 2025*  
*Guide Version: 1.0*  
*Compatibility: SAM AI v1.0, Next.js 15+*