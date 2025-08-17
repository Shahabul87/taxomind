# ADR-0009: Implement Service-Oriented Architecture with Microservices Patterns

## Status
Accepted

## Context
The Taxomind LMS has grown to encompass multiple domains:
- Core learning management (courses, chapters, enrollments)
- AI content generation and tutoring
- Real-time collaboration and communication
- Analytics and reporting
- Payment processing and billing
- User management and authentication
- Content delivery and media processing
- Email and notification services

As the platform scales, we need an architecture that:
- Allows independent scaling of different features
- Enables parallel development by multiple teams
- Provides fault isolation
- Supports polyglot development if needed
- Facilitates gradual migration and updates
- Maintains high availability
- Enables A/B testing and canary deployments

## Decision
We will adopt a hybrid approach using microservices patterns within a monolithic Next.js application, preparing for future service extraction while maintaining development velocity.

## Consequences

### Positive
- **Incremental Migration**: Can extract services gradually as needed
- **Development Speed**: Monolith-first approach maintains velocity
- **Deployment Simplicity**: Single deployment unit initially
- **Code Sharing**: Easy to share code and types
- **Service Boundaries**: Clear domain boundaries established early
- **Future Ready**: Architecture supports future service extraction
- **Cost Effective**: Lower operational overhead initially
- **Testing Simplicity**: Easier integration testing

### Negative
- **Scaling Limitations**: Can't scale components independently initially
- **Technology Lock-in**: Tied to Node.js/TypeScript stack
- **Deployment Risk**: Single point of failure
- **Resource Competition**: Services compete for resources
- **Refactoring Cost**: Future service extraction requires effort
- **Team Coordination**: Teams still need to coordinate deployments

## Alternatives Considered

### 1. Pure Microservices
- **Pros**: Maximum scalability, technology flexibility, team autonomy
- **Cons**: High complexity, operational overhead, network latency
- **Reason for rejection**: Premature optimization for current scale

### 2. Serverless Functions
- **Pros**: Auto-scaling, pay-per-use, no infrastructure management
- **Cons**: Vendor lock-in, cold starts, debugging challenges
- **Reason for rejection**: Complexity for stateful operations

### 3. Traditional Monolith
- **Pros**: Simple deployment, easy debugging, fast development
- **Cons**: Scaling challenges, technology lock-in, team bottlenecks
- **Reason for rejection**: Doesn't prepare for future growth

### 4. Service Mesh Architecture
- **Pros**: Advanced traffic management, security, observability
- **Cons**: High complexity, steep learning curve, operational overhead
- **Reason for rejection**: Over-engineered for current needs

## Implementation Notes

### Service Domain Boundaries
```typescript
// lib/services/index.ts
export const services = {
  // Core Learning Service
  learning: {
    courses: '/api/courses',
    chapters: '/api/chapters',
    sections: '/api/sections',
    enrollments: '/api/enrollments',
    progress: '/api/progress',
  },
  
  // AI Service
  ai: {
    contentGeneration: '/api/sam/content-generation',
    tutoring: '/api/sam/ai-tutor',
    assessment: '/api/sam/assessment-engine',
    analytics: '/api/sam/learning-analytics',
  },
  
  // User Service
  users: {
    profiles: '/api/users',
    authentication: '/api/auth',
    permissions: '/api/permissions',
    preferences: '/api/preferences',
  },
  
  // Payment Service
  payments: {
    checkout: '/api/payments/checkout',
    subscriptions: '/api/payments/subscriptions',
    invoices: '/api/payments/invoices',
    refunds: '/api/payments/refunds',
  },
  
  // Analytics Service
  analytics: {
    events: '/api/analytics/events',
    reports: '/api/analytics/reports',
    dashboards: '/api/analytics/dashboards',
    exports: '/api/analytics/exports',
  },
  
  // Notification Service
  notifications: {
    email: '/api/notifications/email',
    push: '/api/notifications/push',
    inApp: '/api/notifications/in-app',
    sms: '/api/notifications/sms',
  },
  
  // Media Service
  media: {
    upload: '/api/media/upload',
    process: '/api/media/process',
    deliver: '/api/media/deliver',
    optimize: '/api/media/optimize',
  },
}
```

### Service Interface Pattern
```typescript
// lib/services/base-service.ts
export abstract class BaseService {
  protected readonly name: string
  protected readonly version: string
  protected readonly timeout: number = 30000
  
  constructor(name: string, version: string = 'v1') {
    this.name = name
    this.version = version
  }
  
  protected async call<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': this.name,
          'X-Service-Version': this.version,
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...options,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new ServiceError(
          `Service call failed: ${response.statusText}`,
          response.status
        )
      }
      
      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw this.handleError(error)
    }
  }
  
  protected handleError(error: any): Error {
    if (error.name === 'AbortError') {
      return new ServiceTimeoutError(`Service timeout: ${this.name}`)
    }
    return error
  }
}
```

### Learning Service Implementation
```typescript
// lib/services/learning-service.ts
export class LearningService extends BaseService {
  constructor() {
    super('learning-service')
  }
  
  async getCourse(courseId: string): Promise<Course> {
    return this.call('GET', `/api/courses/${courseId}`)
  }
  
  async createCourse(data: CreateCourseInput): Promise<Course> {
    return this.call('POST', '/api/courses', data)
  }
  
  async enrollUser(courseId: string, userId: string): Promise<Enrollment> {
    return this.call('POST', '/api/enrollments', { courseId, userId })
  }
  
  async trackProgress(progressData: ProgressInput): Promise<Progress> {
    return this.call('POST', '/api/progress', progressData)
  }
  
  async getRecommendations(userId: string): Promise<Course[]> {
    return this.call('GET', `/api/recommendations/${userId}`)
  }
}
```

### AI Service Implementation
```typescript
// lib/services/ai-service.ts
export class AIService extends BaseService {
  constructor() {
    super('ai-service')
  }
  
  async generateCourseContent(prompt: string): Promise<GeneratedContent> {
    return this.call('POST', '/api/sam/content-generation', { prompt })
  }
  
  async createAssessment(
    courseId: string,
    options: AssessmentOptions
  ): Promise<Assessment> {
    return this.call('POST', '/api/sam/assessment-engine', {
      courseId,
      ...options,
    })
  }
  
  async getTutoringResponse(
    context: TutoringContext
  ): Promise<TutoringResponse> {
    return this.call('POST', '/api/sam/ai-tutor/socratic', context)
  }
  
  async analyzeContent(content: string): Promise<ContentAnalysis> {
    return this.call('POST', '/api/sam/ai-tutor/content-analysis', {
      content,
    })
  }
}
```

### Service Registry
```typescript
// lib/services/registry.ts
export class ServiceRegistry {
  private static instance: ServiceRegistry
  private services: Map<string, BaseService> = new Map()
  
  private constructor() {
    this.registerServices()
  }
  
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry()
    }
    return ServiceRegistry.instance
  }
  
  private registerServices() {
    this.services.set('learning', new LearningService())
    this.services.set('ai', new AIService())
    this.services.set('payment', new PaymentService())
    this.services.set('analytics', new AnalyticsService())
    this.services.set('notification', new NotificationService())
    this.services.set('media', new MediaService())
  }
  
  getService<T extends BaseService>(name: string): T {
    const service = this.services.get(name)
    if (!service) {
      throw new Error(`Service not found: ${name}`)
    }
    return service as T
  }
  
  // Health check for all services
  async healthCheck(): Promise<ServiceHealth[]> {
    const checks = Array.from(this.services.entries()).map(
      async ([name, service]) => {
        try {
          const start = Date.now()
          await service.call('GET', `/api/${name}/health`)
          return {
            name,
            status: 'healthy' as const,
            responseTime: Date.now() - start,
          }
        } catch (error) {
          return {
            name,
            status: 'unhealthy' as const,
            error: error.message,
          }
        }
      }
    )
    
    return Promise.all(checks)
  }
}
```

### Event Bus for Service Communication
```typescript
// lib/services/event-bus.ts
export interface DomainEvent {
  id: string
  type: string
  timestamp: Date
  aggregateId: string
  payload: any
  metadata?: Record<string, any>
}

export class EventBus {
  private static instance: EventBus
  private handlers: Map<string, Set<EventHandler>> = new Map()
  private deadLetterQueue: DomainEvent[] = []
  
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }
  
  subscribe(eventType: string, handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)
  }
  
  async publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) || new Set()
    
    const results = await Promise.allSettled(
      Array.from(handlers).map(handler => handler(event))
    )
    
    // Handle failed events
    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      this.deadLetterQueue.push(event)
      console.error(`Event processing failed for ${event.type}`, failures)
    }
    
    // Persist event for event sourcing
    await this.persistEvent(event)
  }
  
  private async persistEvent(event: DomainEvent) {
    await db.domainEvent.create({
      data: {
        id: event.id,
        type: event.type,
        aggregateId: event.aggregateId,
        payload: event.payload,
        metadata: event.metadata,
        timestamp: event.timestamp,
      },
    })
  }
}

// Event definitions
export const DomainEvents = {
  // Learning events
  COURSE_CREATED: 'course.created',
  COURSE_PUBLISHED: 'course.published',
  USER_ENROLLED: 'user.enrolled',
  LESSON_COMPLETED: 'lesson.completed',
  
  // Payment events
  PAYMENT_COMPLETED: 'payment.completed',
  SUBSCRIPTION_CREATED: 'subscription.created',
  REFUND_ISSUED: 'refund.issued',
  
  // User events
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  ROLE_CHANGED: 'role.changed',
} as const
```

### Service Orchestration
```typescript
// lib/services/orchestrator.ts
export class ServiceOrchestrator {
  private registry = ServiceRegistry.getInstance()
  private eventBus = EventBus.getInstance()
  
  // Complex workflow example: Course enrollment
  async enrollUserInCourse(
    userId: string,
    courseId: string,
    paymentMethod?: string
  ): Promise<EnrollmentResult> {
    try {
      // Step 1: Validate user and course
      const [user, course] = await Promise.all([
        this.registry.getService<UserService>('user').getUser(userId),
        this.registry.getService<LearningService>('learning').getCourse(courseId),
      ])
      
      // Step 2: Process payment if required
      let paymentResult = null
      if (course.price > 0) {
        paymentResult = await this.registry
          .getService<PaymentService>('payment')
          .processPayment({
            userId,
            courseId,
            amount: course.price,
            method: paymentMethod,
          })
      }
      
      // Step 3: Create enrollment
      const enrollment = await this.registry
        .getService<LearningService>('learning')
        .enrollUser(courseId, userId)
      
      // Step 4: Send notifications
      await Promise.all([
        this.registry
          .getService<NotificationService>('notification')
          .sendEmail({
            to: user.email,
            template: 'enrollment-confirmation',
            data: { course, enrollment },
          }),
        this.eventBus.publish({
          id: randomUUID(),
          type: DomainEvents.USER_ENROLLED,
          timestamp: new Date(),
          aggregateId: enrollment.id,
          payload: { userId, courseId, enrollmentId: enrollment.id },
        }),
      ])
      
      return {
        success: true,
        enrollment,
        payment: paymentResult,
      }
    } catch (error) {
      // Compensating transaction
      await this.rollbackEnrollment(userId, courseId)
      throw error
    }
  }
  
  private async rollbackEnrollment(userId: string, courseId: string) {
    // Implement rollback logic
  }
}
```

### API Gateway Pattern
```typescript
// app/api/gateway/[...path]/route.ts
export async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api/gateway/', '')
  const [service, ...rest] = path.split('/')
  
  // Rate limiting
  const rateLimitResult = await rateLimiter.check(req)
  if (!rateLimitResult.success) {
    return new Response('Rate limit exceeded', { status: 429 })
  }
  
  // Authentication
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Route to appropriate service
  const serviceRegistry = ServiceRegistry.getInstance()
  const targetService = serviceRegistry.getService(service)
  
  if (!targetService) {
    return new Response('Service not found', { status: 404 })
  }
  
  // Forward request with context
  const response = await targetService.forward(rest.join('/'), {
    method: req.method,
    headers: {
      ...req.headers,
      'X-User-Id': session.user.id,
      'X-User-Role': session.user.role,
    },
    body: await req.text(),
  })
  
  // Log request for analytics
  await logApiRequest({
    service,
    path: rest.join('/'),
    userId: session.user.id,
    statusCode: response.status,
  })
  
  return response
}
```

### Service Health Monitoring
```typescript
// app/api/health/services/route.ts
export async function GET() {
  const registry = ServiceRegistry.getInstance()
  const healthChecks = await registry.healthCheck()
  
  const allHealthy = healthChecks.every(check => check.status === 'healthy')
  
  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      services: healthChecks,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  )
}
```

### Circuit Breaker Pattern
```typescript
// lib/services/circuit-breaker.ts
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime?: Date
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private resetTimeout = 30000 // 30 seconds
  ) {}
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.resetTimeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = new Date()
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }
}
```

## Migration Path to Microservices
1. **Phase 1**: Current - Modular monolith with clear boundaries
2. **Phase 2**: Extract AI service to separate deployment
3. **Phase 3**: Extract payment service for PCI compliance
4. **Phase 4**: Extract media service for CDN integration
5. **Phase 5**: Extract notification service for scaling
6. **Phase 6**: Full microservices with service mesh

## Monitoring and Observability
1. Distributed tracing with OpenTelemetry
2. Centralized logging with correlation IDs
3. Service health dashboards
4. Performance metrics per service
5. Error tracking and alerting

## References
- [Microservices Patterns](https://microservices.io/patterns/)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
- [Building Microservices](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/)
- [The Twelve-Factor App](https://12factor.net/)

## Date
2024-01-23

## Authors
- Taxomind Architecture Team