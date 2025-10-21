# SAM AI Tutor - Detailed Architecture Patterns

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Purpose**: Deep dive into architectural patterns and design decisions

---

## 🎯 Overview

This document explores the architectural patterns, design decisions, and technical trade-offs that shape the SAM AI Tutor system. Understanding these patterns is essential for extending the system, preparing the npm package, and maintaining code quality.

---

## 🏛️ Architecture Layers

### Layer 1: Domain Layer (Core Business Logic)

**Purpose**: Pure business logic independent of frameworks and external systems

**Components**:
- Engine interfaces and abstract classes
- Domain models and entities
- Business rules and validations
- Educational concepts (Bloom&apos;s Taxonomy, learning styles)

**Characteristics**:
- No framework dependencies
- No database dependencies
- No external service dependencies
- Pure TypeScript functions and classes

**Example Pattern**:
```typescript
// Domain layer - pure business logic
export interface BloomsCognitiveLevel {
  level: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  percentage: number;
  description: string;
}

// Business rule - no external dependencies
export function validateBloomsDistribution(
  distribution: Record<BloomsCognitiveLevel['level'], number>
): boolean {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  return Math.abs(total - 100) < 0.01; // Allow floating point precision
}
```

### Layer 2: Application Layer (Use Cases)

**Purpose**: Orchestrate domain logic to fulfill specific use cases

**Components**:
- Engine implementations (BloomsAnalysisEngine, PersonalizationEngine)
- Use case orchestrators
- Application services
- Transaction coordinators

**Characteristics**:
- Depends on domain layer
- Independent of UI/API frameworks
- Coordinates multiple domain objects
- Implements business workflows

**Example Pattern**:
```typescript
// Application layer - orchestrates domain logic
export class BloomsAnalysisEngine extends SAMBaseEngine {
  async analyzeCourse(courseId: string): Promise<BloomsAnalysisResponse> {
    // 1. Load domain entities
    const course = await this.loadCourse(courseId);

    // 2. Apply business rules
    const chapters = await this.analyzeChapters(course.chapters);

    // 3. Calculate aggregate results
    const distribution = this.calculateDistribution(chapters);

    // 4. Generate recommendations (domain logic)
    const recommendations = this.generateRecommendations(distribution);

    return { distribution, chapters, recommendations };
  }
}
```

### Layer 3: Infrastructure Layer (External Integrations)

**Purpose**: Implement interfaces to external systems

**Components**:
- Database adapters (Prisma)
- AI provider adapters (Anthropic, OpenAI)
- Cache implementations (in-memory, Redis)
- Logger implementations
- File storage adapters (Cloudinary, S3)

**Characteristics**:
- Implements interfaces defined in domain/application layers
- Contains framework-specific code
- Handles external system communication
- Manages technical concerns (retries, timeouts, error mapping)

**Example Pattern**:
```typescript
// Infrastructure layer - external system adapter
export class AnthropicAIProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyzeContent(content: string, prompt: string): Promise<AIResponse> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt + '\n\n' + content }]
      });

      return this.mapToAIResponse(response);
    } catch (error) {
      throw new AIProviderError('Anthropic API failed', error);
    }
  }
}
```

### Layer 4: Presentation Layer (UI/API)

**Purpose**: Handle user interactions and API requests

**Components**:
- Next.js API routes
- React components
- React hooks
- Context providers

**Characteristics**:
- Framework-specific implementations
- Handles HTTP/UI concerns
- Maps between external formats and domain models
- Implements authentication/authorization

**Example Pattern**:
```typescript
// Presentation layer - API route handler
export async function POST(request: Request) {
  try {
    // 1. Extract and validate input
    const body = await request.json();
    const { courseId } = CourseIdSchema.parse(body);

    // 2. Check authorization
    const user = await currentUser();
    if (!user) return unauthorized();

    // 3. Call application layer
    const engine = BloomsAnalysisEngine.getInstance();
    const result = await engine.analyzeCourse(courseId);

    // 4. Map to API response format
    return NextResponse.json({
      success: true,
      data: result,
      metadata: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 🎨 Design Patterns

### 1. Abstract Factory Pattern

**Used For**: Engine instantiation with dependency injection

**Implementation**:
```typescript
// Factory creates engines with injected dependencies
export class SAMEngineFactory {
  static createBloomsEngine(deps: SAMDependencies): BloomsAnalysisEngine {
    return new BloomsAnalysisEngine(deps);
  }

  static createPersonalizationEngine(deps: SAMDependencies): PersonalizationEngine {
    return new PersonalizationEngine(deps);
  }
}
```

**Benefits**:
- Centralizes object creation
- Easy to swap implementations
- Simplifies testing with mock dependencies

### 2. Singleton Pattern

**Used For**: Engine instances, database connections

**Implementation**:
```typescript
export class BloomsAnalysisEngine extends SAMBaseEngine {
  private static instance: BloomsAnalysisEngine;

  static getInstance(): BloomsAnalysisEngine {
    if (!this.instance) {
      this.instance = new BloomsAnalysisEngine();
    }
    return this.instance;
  }

  private constructor() {
    super('BloomsAnalysis');
  }
}
```

**Benefits**:
- Shared state across application
- Reduced memory footprint
- Ensures single database connection pool

### 3. Template Method Pattern

**Used For**: Engine initialization lifecycle

**Implementation**:
```typescript
export abstract class SAMBaseEngine {
  protected async initialize(): Promise<void> {
    if (this.initialized) return;

    // Template method - calls abstract method
    await this.performInitialization();

    this.initialized = true;
  }

  // Abstract method - child classes implement
  protected abstract performInitialization(): Promise<void>;
}
```

**Benefits**:
- Consistent initialization across all engines
- Child classes customize specific steps
- Prevents duplicate initialization code

### 4. Strategy Pattern

**Used For**: Pluggable AI providers

**Implementation**:
```typescript
// Strategy interface
export interface AIProvider {
  analyzeContent(content: string, prompt: string): Promise<AIResponse>;
}

// Concrete strategies
export class AnthropicProvider implements AIProvider { /* ... */ }
export class OpenAIProvider implements AIProvider { /* ... */ }

// Context uses strategy
export class BloomsAnalysisEngine {
  constructor(private aiProvider: AIProvider) {}

  async analyze(content: string): Promise<Analysis> {
    const response = await this.aiProvider.analyzeContent(content, prompt);
    return this.parseResponse(response);
  }
}
```

**Benefits**:
- Easy to switch AI providers
- Can test with mock provider
- Supports multiple providers simultaneously

### 5. Repository Pattern

**Used For**: Database abstraction

**Implementation**:
```typescript
// Repository interface
export interface CourseRepository {
  findById(id: string): Promise<Course | null>;
  findAll(filters: CourseFilters): Promise<Course[]>;
  save(course: Course): Promise<Course>;
}

// Concrete implementation
export class PrismaCourseRepository implements CourseRepository {
  async findById(id: string): Promise<Course | null> {
    return await db.course.findUnique({ where: { id } });
  }
}
```

**Benefits**:
- Isolates database logic
- Easy to swap database implementations
- Simplifies testing with in-memory repository

### 6. Observer Pattern

**Used For**: Event-driven interaction tracking

**Implementation**:
```typescript
// Event emitter
export class SAMEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, handler: Function): void {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
  }

  emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}

// Usage in engine
export class BloomsAnalysisEngine {
  async analyzeCourse(courseId: string): Promise<Analysis> {
    const result = await this.performAnalysis(courseId);

    // Emit event - observers will handle
    this.events.emit('course:analyzed', { courseId, result });

    return result;
  }
}
```

**Benefits**:
- Decoupled components
- Easy to add new event handlers
- Supports audit logging without modifying core logic

### 7. Decorator Pattern

**Used For**: Performance monitoring, caching

**Implementation**:
```typescript
// Decorator wraps engine methods
export function withPerformanceMonitoring<T>(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args: unknown[]): Promise<T> {
    const start = Date.now();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;

      if (duration > 1000) {
        console.warn(`Slow operation: ${propertyKey} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      console.error(`Error in ${propertyKey}:`, error);
      throw error;
    }
  };

  return descriptor;
}

// Usage
export class BloomsAnalysisEngine {
  @withPerformanceMonitoring
  async analyzeCourse(courseId: string): Promise<Analysis> {
    // Method automatically monitored
  }
}
```

**Benefits**:
- Non-invasive functionality addition
- Reusable across multiple methods/classes
- Separates cross-cutting concerns

---

## 🔄 Data Flow Architecture

### Request Flow Pattern

```
1. Client Request
   ↓
2. Next.js API Route Handler
   ├─ Authentication check
   ├─ Input validation (Zod schemas)
   └─ Request sanitization
   ↓
3. Application Layer (Engine)
   ├─ Check cache
   ├─ Load domain entities
   ├─ Apply business rules
   └─ Coordinate external services
   ↓
4. Infrastructure Layer
   ├─ Database queries (Prisma)
   ├─ AI API calls (Anthropic)
   └─ Cache updates
   ↓
5. Response Transformation
   ├─ Map to API response format
   ├─ Add metadata
   └─ Handle errors gracefully
   ↓
6. Client Receives Response
```

### Error Flow Pattern

```
1. Error Occurs (any layer)
   ↓
2. Error Classification
   ├─ ValidationError → 400 Bad Request
   ├─ AuthenticationError → 401 Unauthorized
   ├─ AuthorizationError → 403 Forbidden
   ├─ NotFoundError → 404 Not Found
   └─ InternalError → 500 Internal Server Error
   ↓
3. Error Sanitization
   ├─ Remove stack traces
   ├─ Remove sensitive data
   └─ Create user-friendly message
   ↓
4. Error Logging
   ├─ Log full error details (server-side)
   ├─ Add context (user, request, timestamp)
   └─ Store in audit log
   ↓
5. Error Response to Client
   └─ { success: false, error: { code, message } }
```

---

## 🗄️ Caching Strategy

### Multi-Layer Caching

**Layer 1: In-Memory Cache (Base Engine)**
- TTL: 5 minutes (default)
- Scope: Single server instance
- Use case: Frequently accessed, rarely changing data
- Example: User learning profiles, course metadata

**Layer 2: Distributed Cache (Redis - optional)**
- TTL: 15 minutes - 1 hour
- Scope: Across all server instances
- Use case: API responses, AI analysis results
- Example: Bloom&apos;s analysis for popular courses

**Layer 3: Database Query Result Cache (Prisma)**
- TTL: Managed by Prisma
- Scope: Database connection
- Use case: Automatic query result caching
- Example: Course listings, chapter details

### Cache Invalidation Strategy

**Time-Based Invalidation**:
```typescript
// Automatically expires after TTL
await engine.withCache(
  'course:123:blooms',
  async () => await analyzeCourse('123'),
  300 // 5 minutes
);
```

**Event-Based Invalidation**:
```typescript
// Clear cache when content changes
events.on('course:updated', (courseId) => {
  cache.delete(`course:${courseId}:blooms`);
  cache.delete(`course:${courseId}:metadata`);
});
```

**Manual Invalidation**:
```typescript
// Force fresh analysis
await engine.analyzeCourse(courseId, { forceRefresh: true });
```

---

## 🔒 Security Architecture

### Authentication Flow

```
1. User Login
   ↓
2. NextAuth.js Authentication
   ├─ Verify credentials
   ├─ Check MFA if enabled
   └─ Generate session token
   ↓
3. Session Token
   ├─ Stored in HTTP-only cookie
   ├─ Encrypted with secret key
   └─ Expires after 30 days
   ↓
4. Request Authentication
   ├─ Extract session from cookie
   ├─ Decrypt and validate
   └─ Load user data
```

### Authorization Pattern

```typescript
// Role-based access control
export async function checkAuthorization(
  user: User,
  resource: Resource,
  action: Action
): Promise<boolean> {
  // 1. Check role-based permissions
  if (user.role === 'ADMIN') return true;

  // 2. Check resource ownership
  if (resource.userId === user.id) return true;

  // 3. Check specific permissions
  const hasPermission = await db.permission.findFirst({
    where: {
      userId: user.id,
      resourceType: resource.type,
      action: action
    }
  });

  return !!hasPermission;
}
```

### Input Validation Architecture

```typescript
// Three-layer validation

// Layer 1: Schema validation (Zod)
const CourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
});

// Layer 2: Business rule validation
function validateCourseBusinessRules(course: Course): ValidationResult {
  if (course.price < 0) return { valid: false, error: 'Price must be non-negative' };
  if (course.chapters.length === 0) return { valid: false, error: 'Course must have chapters' };
  return { valid: true };
}

// Layer 3: Security validation
function validateCourseSecurity(course: Course, user: User): ValidationResult {
  if (!user.canCreateCourse) return { valid: false, error: 'No permission to create courses' };
  return { valid: true };
}
```

---

## 📊 Performance Architecture

### Scalability Design Decisions

**Stateless Engines**:
- No shared state between requests
- Each request processed independently
- Horizontal scaling supported

**Connection Pooling**:
```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Pool configuration
  connectionLimit = 10
  poolTimeout     = 20
}
```

**Lazy Loading**:
```typescript
// Load expensive data only when needed
export class PersonalizationEngine {
  private learningStyleModel?: MLModel;

  private async getModel(): Promise<MLModel> {
    if (!this.learningStyleModel) {
      this.learningStyleModel = await loadMLModel('learning-styles');
    }
    return this.learningStyleModel;
  }
}
```

### Performance Optimization Patterns

**Parallel Processing**:
```typescript
// Analyze multiple chapters in parallel
async analyzeCourse(courseId: string): Promise<Analysis> {
  const course = await this.loadCourse(courseId);

  // Process chapters concurrently
  const chapterAnalyses = await Promise.all(
    course.chapters.map(chapter => this.analyzeChapter(chapter))
  );

  return this.aggregateResults(chapterAnalyses);
}
```

**Query Optimization**:
```typescript
// Minimize database queries with proper includes
const course = await db.course.findUnique({
  where: { id: courseId },
  include: {
    chapters: {
      include: {
        sections: {
          select: { id: true, title: true, content: true }
        }
      }
    },
    category: true,
    user: { select: { id: true, name: true } }
  }
});
```

---

## 🔧 Dependency Injection Architecture

### NPM Package Dependency Strategy

**Problem**: Current implementation tightly coupled to Taxomind infrastructure

**Solution**: Dependency injection for all external systems

```typescript
// Define dependency interfaces
export interface SAMDependencies {
  // Database access
  database: DatabaseClient;

  // AI providers
  ai: {
    anthropic?: AnthropicClient;
    openai?: OpenAIClient;
  };

  // Caching
  cache?: CacheProvider;

  // Logging
  logger: Logger;

  // Authentication
  auth: AuthProvider;

  // File storage
  storage?: StorageProvider;
}

// Engine constructor accepts dependencies
export class BloomsAnalysisEngine extends SAMBaseEngine {
  constructor(protected deps: SAMDependencies) {
    super('BloomsAnalysis', deps);
  }

  async analyzeCourse(courseId: string): Promise<Analysis> {
    // Use injected dependencies
    const course = await this.deps.database.course.findUnique({ where: { id: courseId } });
    const aiResponse = await this.deps.ai.anthropic.analyze(course.content);
    await this.deps.cache?.set(`course:${courseId}`, aiResponse);

    return this.parseAnalysis(aiResponse);
  }
}
```

**Benefits for NPM Package**:
- Consumers provide their own database client
- Supports multiple AI providers
- Optional dependencies (cache, storage)
- Easy to mock for testing

---

## 📖 Related Documentation

- [00-OVERVIEW.md](./00-OVERVIEW.md) - System overview
- [02-CORE-ENGINES.md](./02-CORE-ENGINES.md) - Core engine details
- [03-SPECIALIZED-ENGINES.md](./03-SPECIALIZED-ENGINES.md) - Individual engines
- [09-NPM-PACKAGE-GUIDE.md](./09-NPM-PACKAGE-GUIDE.md) - Package preparation

---

**Next Document**: [03-SPECIALIZED-ENGINES.md](./03-SPECIALIZED-ENGINES.md) - Detailed documentation of each specialized engine

**Maintained by**: Taxomind Development Team
**Status**: ✅ Active Development
