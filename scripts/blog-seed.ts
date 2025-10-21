// scripts/blog-seed.ts
import { PrismaClient } from "@prisma/client";

const database = new PrismaClient();

// Enterprise-level blog dummy data
const blogCategories = [
  "Technology",
  "AI & Machine Learning", 
  "Programming",
  "UI/UX Design",
  "Business Strategy",
  "Data Science",
  "Cybersecurity",
  "Web Development",
  "Mobile Development",
  "Cloud Computing",
  "Blockchain",
  "Digital Marketing",
  "Product Management",
  "Software Engineering",
  "DevOps",
];

const blogPosts = [
  {
    title: "The Future of Artificial Intelligence in Enterprise Solutions",
    description: "Exploring how AI is transforming modern business operations and driving innovation across industries. From automated decision-making to predictive analytics, discover the strategic advantages of implementing AI solutions in your organization.",
    category: "AI & Machine Learning",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000",
    body: `
# The Future of Artificial Intelligence in Enterprise Solutions

Artificial Intelligence is no longer a futuristic concept—it's a present reality reshaping how businesses operate, compete, and deliver value to customers. In this comprehensive analysis, we explore the transformative impact of AI on enterprise solutions and what the future holds for organizations embracing this technology.

## Current State of AI in Enterprise

The adoption of AI in enterprise environments has accelerated dramatically over the past five years. Organizations are leveraging AI for:

- **Automated Decision Making**: AI systems can process vast amounts of data to make informed decisions faster than human counterparts
- **Predictive Analytics**: Machine learning models help predict market trends, customer behavior, and operational challenges
- **Process Optimization**: AI-driven automation streamlines repetitive tasks and reduces operational costs

## Key Benefits for Modern Businesses

### Enhanced Efficiency
AI solutions eliminate manual processes, reducing the time required for data analysis and routine tasks. This efficiency gain allows employees to focus on strategic initiatives that drive business growth.

### Improved Customer Experience
Personalization engines powered by AI create tailored experiences for each customer, increasing satisfaction and loyalty. Chatbots and virtual assistants provide 24/7 support, ensuring customer queries are addressed promptly.

### Data-Driven Insights
AI transforms raw data into actionable insights, enabling better strategic planning and informed decision-making across all business functions.

## Implementation Strategies

Successful AI implementation requires a structured approach:

1. **Assessment Phase**: Evaluate current processes to identify AI opportunities
2. **Pilot Programs**: Start with small-scale implementations to test and refine
3. **Scaling**: Gradually expand successful pilot programs across the organization
4. **Continuous Learning**: Establish feedback loops for ongoing optimization

## Challenges and Considerations

While AI offers tremendous opportunities, organizations must navigate several challenges:

- **Data Quality**: AI systems require high-quality, clean data to function effectively
- **Skills Gap**: The shortage of AI talent remains a significant barrier to adoption
- **Ethical Considerations**: Ensuring AI systems are fair, transparent, and unbiased
- **Integration Complexity**: Incorporating AI into existing systems can be technically challenging

## Future Outlook

The future of AI in enterprise solutions looks promising, with emerging trends including:

- **Explainable AI**: Systems that can explain their decision-making processes
- **Edge AI**: Processing data locally to reduce latency and improve performance
- **AI Democratization**: Tools that make AI accessible to non-technical users
- **Autonomous Systems**: Fully self-managing AI solutions that require minimal human intervention

## Conclusion

Organizations that embrace AI today will have a significant competitive advantage tomorrow. The key is to start with clear objectives, invest in the right talent and infrastructure, and maintain a commitment to ethical AI practices. As technology continues to evolve, businesses must remain agile and ready to adapt their AI strategies to capitalize on new opportunities.

The future belongs to organizations that can effectively harness the power of AI to drive innovation, improve efficiency, and deliver exceptional value to their stakeholders.
    `,
    views: 2847,
    published: true,
  },
  {
    title: "Mastering React Performance: Advanced Optimization Techniques",
    description: "Deep dive into React performance optimization strategies that can significantly improve your application's speed and user experience. Learn about memo, useMemo, useCallback, and code splitting techniques.",
    category: "Programming",
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000",
    body: `
# Mastering React Performance: Advanced Optimization Techniques

Performance is crucial for modern web applications. Slow, unresponsive interfaces lead to poor user experiences and higher bounce rates. In this comprehensive guide, we'll explore advanced React performance optimization techniques that can transform your application's speed and responsiveness.

## Understanding React's Rendering Process

Before diving into optimizations, it's essential to understand how React renders components:

1. **Trigger Phase**: Something triggers a re-render (state change, props change, parent re-render)
2. **Render Phase**: React calls component functions and calculates what needs to change
3. **Commit Phase**: React applies changes to the DOM

## Performance Optimization Strategies

### 1. React.memo for Component Memoization

\`\`\`jsx
import React, { memo } from 'react';

const ExpensiveComponent = memo(({ data, config }) => {
  // Component logic here
  return <div>{/* Render logic */}</div>;
});

// With custom comparison function
const OptimizedComponent = memo(({ user, settings }) => {
  return <div>{user.name}</div>;
}, (prevProps, nextProps) => {
  return prevProps.user.id === nextProps.user.id;
});
\`\`\`

### 2. useMemo for Expensive Calculations

\`\`\`jsx
import { useMemo } from 'react';

function DataVisualization({ dataset, filters }) {
  const processedData = useMemo(() => {
    return dataset
      .filter(item => filters.includes(item.category))
      .map(item => ({
        ...item,
        calculated: heavyCalculation(item)
      }));
  }, [dataset, filters]);

  return <Chart data={processedData} />;
}
\`\`\`

### 3. useCallback for Function References

\`\`\`jsx
import { useCallback, useState } from 'react';

function ParentComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  const handleItemClick = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ItemList items={items} onItemClick={handleItemClick} />
    </div>
  );
}
\`\`\`

## Advanced Techniques

### Code Splitting with React.lazy

\`\`\`jsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}
\`\`\`

### Virtual Scrolling for Large Lists

For applications dealing with large datasets, virtual scrolling is essential:

\`\`\`jsx
import { FixedSizeList as List } from 'react-window';

const Row = ({ index, style, data }) => (
  <div style={style}>
    {data[index].name}
  </div>
);

function VirtualizedList({ items }) {
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={50}
      itemData={items}
    >
      {Row}
    </List>
  );
}
\`\`\`

## Performance Monitoring

### Using React DevTools Profiler

The React DevTools Profiler helps identify performance bottlenecks:

1. Install React DevTools browser extension
2. Navigate to the Profiler tab
3. Start recording and interact with your app
4. Analyze the flame graph for slow components

### Key Metrics to Monitor

- **Render time**: How long components take to render
- **Re-render frequency**: How often components re-render unnecessarily  
- **Bundle size**: The size of your JavaScript bundles
- **Time to Interactive (TTI)**: When the page becomes fully interactive

## Best Practices

### 1. Avoid Inline Objects and Functions

\`\`\`jsx
// ❌ Bad - creates new object on every render
<Component style={{ marginTop: 10 }} />

// ✅ Good - define outside component or use useMemo
const styles = { marginTop: 10 };
<Component style={styles} />
\`\`\`

### 2. Optimize Context Usage

\`\`\`jsx
// ❌ Bad - single context for everything
const AppContext = createContext();

// ✅ Good - separate contexts for different concerns
const UserContext = createContext();
const ThemeContext = createContext();
const DataContext = createContext();
\`\`\`

### 3. Use Production Builds

Always test performance with production builds, as development builds include additional overhead for debugging.

## Conclusion

React performance optimization is an ongoing process that requires understanding your application's specific needs and bottlenecks. Start by measuring performance, identify the most impactful optimizations, and implement them systematically.

Remember: premature optimization can lead to complex code without significant benefits. Focus on optimizations that provide measurable improvements to user experience.

By implementing these techniques strategically, you can create React applications that are both performant and maintainable, delivering exceptional user experiences across all devices and network conditions.
    `,
    views: 1923,
    published: true,
  },
  {
    title: "The Complete Guide to Modern UI/UX Design Principles",
    description: "Comprehensive exploration of contemporary design principles that create intuitive, accessible, and visually appealing user interfaces. Learn about design systems, accessibility, and user psychology.",
    category: "UI/UX Design",
    imageUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=1000",
    body: `
# The Complete Guide to Modern UI/UX Design Principles

User experience design has evolved significantly over the past decade, driven by changing user expectations, technological advances, and a deeper understanding of human psychology. This comprehensive guide explores the fundamental principles that define exceptional UI/UX design in today's digital landscape.

## Foundation Principles

### 1. User-Centered Design

Every design decision should prioritize the user's needs, goals, and context:

- **User Research**: Conduct interviews, surveys, and usability testing
- **Personas**: Create detailed user profiles to guide design decisions
- **User Journey Mapping**: Visualize the complete user experience
- **Empathy**: Understand users' emotions, frustrations, and motivations

### 2. Simplicity and Clarity

Simplicity is the ultimate sophistication in design:

- **Reduce Cognitive Load**: Minimize the mental effort required to use your interface
- **Clear Hierarchy**: Use size, color, and spacing to guide attention
- **Progressive Disclosure**: Reveal information and options gradually
- **Familiar Patterns**: Leverage established UI conventions

## Visual Design Principles

### Typography Excellence

Typography is the foundation of great interface design:

\`\`\`css
/* Modern typography scale */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */

/* Reading optimization */
line-height: 1.5;           /* Optimal for readability */
letter-spacing: -0.025em;   /* Subtle tracking for larger text */
\`\`\`

### Color Psychology and Accessibility

Colors convey meaning and emotion while ensuring accessibility:

- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color Blindness**: Test designs with tools like Stark or Colour Contrast Analyser
- **Semantic Colors**: Use consistent colors for actions (blue for links, red for errors)
- **Brand Alignment**: Ensure color choices reflect brand personality

### Spacing and Layout

Consistent spacing creates visual harmony:

\`\`\`css
/* 8-point grid system */
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
\`\`\`

## Interaction Design

### Micro-interactions

Small animations and feedback mechanisms that enhance user experience:

- **Button States**: Hover, active, and disabled states
- **Loading Indicators**: Provide feedback during wait times
- **Form Validation**: Real-time feedback for user input
- **Transitions**: Smooth transitions between states and pages

### Gesture Design for Touch Interfaces

Designing for touch requires understanding human ergonomics:

- **Touch Targets**: Minimum 44x44 pixels for comfortable tapping
- **Thumb Zones**: Consider reachable areas on mobile devices
- **Swipe Gestures**: Implement intuitive swipe actions
- **Pull-to-Refresh**: Provide natural interaction patterns

## Accessibility and Inclusion

### WCAG Guidelines

Web Content Accessibility Guidelines ensure inclusive design:

#### Perceivable
- Provide text alternatives for images
- Offer captions for videos
- Ensure sufficient color contrast
- Make content adaptable to different presentations

#### Operable
- Make all functionality keyboard accessible
- Give users control over time limits
- Avoid content that causes seizures
- Help users navigate and find content

#### Understandable
- Make text readable and understandable
- Make content appear and operate predictably
- Help users avoid and correct mistakes

#### Robust
- Maximize compatibility with assistive technologies
- Use valid, semantic HTML
- Ensure content works across different browsers and devices

### Inclusive Design Practices

\`\`\`html
<!-- Semantic HTML for screen readers -->
<nav aria-label="Primary navigation">
  <ul>
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

<!-- Descriptive form labels -->
<label for="email">
  Email Address
  <span aria-label="required">*</span>
</label>
<input 
  type="email" 
  id="email" 
  required 
  aria-describedby="email-help"
/>
<div id="email-help">We'll never share your email</div>
\`\`\`

## Design Systems and Consistency

### Building Scalable Design Systems

A design system ensures consistency across products:

1. **Design Tokens**: Define colors, typography, spacing as reusable variables
2. **Component Library**: Create reusable UI components
3. **Documentation**: Provide clear usage guidelines
4. **Governance**: Establish processes for updates and contributions

### Component-Based Thinking

\`\`\`jsx
// Example of a well-designed Button component
const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  children,
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]}\`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
\`\`\`

## User Testing and Iteration

### Testing Methods

- **Usability Testing**: Observe users completing tasks
- **A/B Testing**: Compare different design variations
- **Card Sorting**: Understand user mental models
- **First Click Testing**: Analyze initial user interactions

### Metrics That Matter

- **Task Success Rate**: Percentage of users who complete tasks successfully
- **Time on Task**: How long it takes users to complete actions
- **Error Rate**: Frequency of user errors
- **System Usability Scale (SUS)**: Standardized usability questionnaire

## Future-Proofing Your Design

### Emerging Trends

- **Voice Interfaces**: Designing for conversational UI
- **Augmented Reality**: Spatial design considerations
- **Dark Mode**: Supporting multiple color schemes
- **Personalization**: Adaptive interfaces based on user behavior

### Design for Multiple Devices

\`\`\`css
/* Responsive design patterns */
@media (max-width: 768px) {
  .navigation {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .navigation.open {
    transform: translateX(0);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
\`\`\`

## Conclusion

Exceptional UI/UX design is the result of understanding users deeply, applying proven principles consistently, and iterating based on real feedback. By focusing on accessibility, usability, and aesthetic excellence, designers can create digital experiences that not only look beautiful but also serve users effectively.

The key to success lies in balancing user needs with business goals, staying current with design trends while respecting timeless principles, and never stopping the process of learning and improvement.

Remember: great design is invisible—when users can accomplish their goals effortlessly, you've succeeded in creating truly exceptional user experiences.
    `,
    views: 3156,
    published: true,
  },
  {
    title: "Building Scalable Backend Systems with Node.js and PostgreSQL",
    description: "Comprehensive guide to architecting robust backend systems that can handle millions of users. Learn about microservices, database optimization, caching strategies, and deployment best practices.",
    category: "Web Development",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000",
    body: `
# Building Scalable Backend Systems with Node.js and PostgreSQL

Creating backend systems that can scale from thousands to millions of users requires careful architectural planning, robust database design, and strategic optimization. This comprehensive guide explores proven patterns and practices for building scalable backend systems using Node.js and PostgreSQL.

## Architecture Fundamentals

### Microservices vs. Monolithic Architecture

**Monolithic Approach:**
- Single deployable unit
- Easier to develop initially
- Simpler debugging and testing
- Good for small to medium applications

**Microservices Approach:**
- Independent, loosely coupled services
- Better scalability and fault isolation
- Technology diversity
- Increased operational complexity

### API Design Principles

#### RESTful API Best Practices

\`\`\`javascript
// Express.js route structure
const express = require('express');
const router = express.Router();

// Resource-based URLs
router.get('/api/v1/users', getAllUsers);           // GET collection
router.get('/api/v1/users/:id', getUserById);       // GET specific resource
router.post('/api/v1/users', createUser);           // CREATE resource
router.put('/api/v1/users/:id', updateUser);        // UPDATE resource
router.delete('/api/v1/users/:id', deleteUser);     // DELETE resource

// Nested resources
router.get('/api/v1/users/:id/orders', getUserOrders);
router.post('/api/v1/users/:id/orders', createUserOrder);
\`\`\`

#### Error Handling and Status Codes

\`\`\`javascript
class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message } = err;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Usage in routes
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new APIError('User not found', 404);
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    next(error);
  }
};
\`\`\`

## Database Design and Optimization

### PostgreSQL Schema Design

\`\`\`sql
-- Optimized user table with indexes
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_profile_data_gin ON users USING GIN(profile_data);

-- Partial index for active users
CREATE INDEX idx_users_active ON users(id) WHERE is_active = true;
\`\`\`

### Connection Pooling and Query Optimization

\`\`\`javascript
const { Pool } = require('pg');

// Connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Maximum pool size
  min: 5,                     // Minimum pool size
  idle: 10000,               // Close idle connections after 10s
  acquire: 60000,            // Maximum time to acquire connection
  evict: 1000                // Check for idle connections every 1s
});

// Prepared statements for performance
const getUserByEmail = {
  name: 'get-user-by-email',
  text: 'SELECT id, email, username, profile_data FROM users WHERE email = $1 AND is_active = true',
  values: []
};

// Usage with proper error handling
const findUserByEmail = async (email) => {
  const client = await pool.connect();
  try {
    const result = await client.query(getUserByEmail.text, [email]);
    return result.rows[0];
  } catch (error: any) {
    console.error('Database query error:', error);
    throw new APIError('Database operation failed', 500);
  } finally {
    client.release();
  }
};
\`\`\`

## Caching Strategies

### Redis Implementation

\`\`\`javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Cache middleware
const cache = (duration = 300) => {
  return async (req, res, next) => {
    const key = \`cache:\${req.originalUrl}\`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Store original send function
      const originalSend = res.json;
      
      // Override send to cache response
      res.json = function(data) {
        client.setex(key, duration, JSON.stringify(data));
        originalSend.call(this, data);
      };
      
      next();
    } catch (error: any) {
      console.error('Cache error:', error);
      next();
    }
  };
};

// Usage
router.get('/api/v1/users/:id', cache(600), getUserById);
\`\`\`

### Cache Invalidation Patterns

\`\`\`javascript
// Cache-aside pattern
const getUserWithCache = async (userId) => {
  const cacheKey = \`user:\${userId}\`;
  
  // Try cache first
  let user = await client.get(cacheKey);
  if (user) {
    return JSON.parse(user);
  }
  
  // Fetch from database
  user = await User.findById(userId);
  if (user) {
    // Cache for 1 hour
    await client.setex(cacheKey, 3600, JSON.stringify(user));
  }
  
  return user;
};

// Cache invalidation on update
const updateUser = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
  
  // Invalidate cache
  await client.del(\`user:\${userId}\`);
  
  return user;
};
\`\`\`

## Authentication and Security

### JWT Implementation

\`\`\`javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Token generation
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new APIError('Access token required', 401);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      throw new APIError('Invalid token', 401);
    }
    
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new APIError('Token expired', 401));
    }
    next(new APIError('Invalid token', 401));
  }
};
\`\`\`

### Rate Limiting

\`\`\`javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Rate limiting configuration
const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 100,                     // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Different limits for different endpoints
const strictLimiter = rateLimit({
  store: new RedisStore({ client: redis, prefix: 'rl:strict:' }),
  windowMs: 15 * 60 * 1000,
  max: 5,                       // Stricter limit for sensitive endpoints
  skipSuccessfulRequests: true
});

// Usage
app.use('/api/', limiter);
app.use('/api/auth/login', strictLimiter);
\`\`\`

## Performance Monitoring and Logging

### Structured Logging

\`\`\`javascript
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};
\`\`\`

### Health Checks and Monitoring

\`\`\`javascript
// Health check endpoint
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version
  };
  
  try {
    // Database health check
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (error: any) {
    health.database = 'disconnected';
    health.status = 'error';
  }
  
  try {
    // Redis health check
    await client.ping();
    health.cache = 'connected';
  } catch (error: any) {
    health.cache = 'disconnected';
    health.status = 'warning';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
\`\`\`

## Deployment and DevOps

### Docker Configuration

\`\`\`dockerfile
# Multi-stage Dockerfile for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Security configurations
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node health-check.js

CMD ["node", "server.js"]
\`\`\`

### Environment Configuration

\`\`\`yaml
# docker-compose.yml for development
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: \${DB_NAME}
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
\`\`\`

## Load Testing and Performance Optimization

### Database Query Optimization

\`\`\`sql
-- Use EXPLAIN ANALYZE to understand query performance
EXPLAIN ANALYZE 
SELECT u.id, u.username, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.username
ORDER BY post_count DESC
LIMIT 10;

-- Optimize with proper indexes
CREATE INDEX CONCURRENTLY idx_users_created_at_recent 
ON users(created_at) WHERE created_at > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY idx_posts_user_id_created 
ON posts(user_id, created_at);
\`\`\`

### Load Testing with Artillery

\`\`\`yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  payload:
    path: "users.csv"
    fields:
      - "email"
      - "password"

scenarios:
  - name: "Authentication flow"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.accessToken"
              as: "token"
      - get:
          url: "/api/users/profile"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Public API endpoints"
    weight: 30
    flow:
      - get:
          url: "/api/posts"
      - get:
          url: "/api/posts/{{ $randomInt(1, 1000) }}"
\`\`\`

## Conclusion

Building scalable backend systems requires a holistic approach that considers architecture, database design, caching, security, monitoring, and deployment. The key principles include:

1. **Design for Scale**: Plan your architecture to handle growth from day one
2. **Optimize Early**: Implement caching and database optimization proactively
3. **Monitor Everything**: Use comprehensive logging and monitoring
4. **Security First**: Implement robust authentication and authorization
5. **Test Continuously**: Regular load testing and performance monitoring

By following these patterns and continuously monitoring performance, you can build backend systems that scale efficiently and maintain reliability under increasing load.

Remember that scalability is not just about handling more users—it's about maintaining performance, reliability, and maintainability as your system grows. Start with solid fundamentals and iterate based on real-world performance data.
    `,
    views: 2765,
    published: true,
  },
  {
    title: "Cybersecurity Best Practices for Modern Web Applications",
    description: "Essential security practices every developer should implement to protect web applications from common vulnerabilities and cyber threats. Learn about OWASP Top 10, secure coding practices, and incident response.",
    category: "Cybersecurity",
    imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=1000",
    body: `
# Cybersecurity Best Practices for Modern Web Applications

In today's digital landscape, web application security is not optional—it's a fundamental requirement. With cyber attacks becoming more sophisticated and frequent, developers must implement robust security measures from the ground up. This comprehensive guide covers essential security practices that every development team should adopt.

## The OWASP Top 10: Understanding Critical Vulnerabilities

### 1. Injection Attacks

Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query.

**SQL Injection Prevention:**

\`\`\`javascript
// ❌ Vulnerable code
const query = \`SELECT * FROM users WHERE email = '\${userEmail}'\`;
db.query(query);

// ✅ Secure code using parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
db.query(query, [userEmail]);

// ✅ Using an ORM with built-in protection
const user = await User.findOne({ where: { email: userEmail } });
\`\`\`

**NoSQL Injection Prevention:**

\`\`\`javascript
// ❌ Vulnerable to NoSQL injection
const user = await User.findOne({ email: req.body.email });

// ✅ Sanitize input
const validator = require('validator');
const email = validator.isEmail(req.body.email) ? req.body.email : null;
if (!email) throw new Error('Invalid email format');

const user = await User.findOne({ email: email });
\`\`\`

### 2. Broken Authentication

**Secure Password Handling:**

\`\`\`javascript
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Password hashing
const hashPassword = async (password) => {
  // Validate password strength
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }
  
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Secure password verification
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Account lockout mechanism
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const checkAccountLockout = async (email) => {
  const user = await User.findOne({ email });
  
  if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
    throw new Error('Account temporarily locked due to too many failed attempts');
  }
  
  return user;
};
\`\`\`

**Multi-Factor Authentication (MFA):**

\`\`\`javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate MFA secret
const generateMFASecret = (userEmail, appName) => {
  return speakeasy.generateSecret({
    name: userEmail,
    issuer: appName,
    length: 32
  });
};

// Verify MFA token
const verifyMFAToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2-step window for clock drift
  });
};

// Generate QR code for setup
const generateQRCode = async (secret) => {
  return await QRCode.toDataURL(secret.otpauth_url);
};
\`\`\`

### 3. Sensitive Data Exposure

**Data Encryption:**

\`\`\`javascript
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY; // 32 bytes key
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.secretKey, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Usage for sensitive data
const encryptionService = new EncryptionService();
const sensitiveData = 'Credit card: 4532-1234-5678-9012';
const encrypted = encryptionService.encrypt(sensitiveData);
\`\`\`

**Secure Headers Configuration:**

\`\`\`javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
\`\`\`

## Input Validation and Sanitization

### Comprehensive Input Validation

\`\`\`javascript
const Joi = require('joi');
const DOMPurify = require('isomorphic-dompurify');

// Define validation schemas
const userRegistrationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .max(254), // RFC 5321 limit
  
  password: Joi.string()
    .min(12)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
    }),
  
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),
  
  age: Joi.number()
    .integer()
    .min(13)
    .max(120)
    .required()
});

// Validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }
    
    req.validatedData = value;
    next();
  };
};

// HTML sanitization for user content
const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: []
  });
};

// Usage
app.post('/api/users/register', 
  validateInput(userRegistrationSchema), 
  async (req, res) => {
    const userData = req.validatedData;
    // Proceed with registration
  }
);
\`\`\`

## Authentication and Authorization

### JWT Security Best Practices

\`\`\`javascript
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
  }

  generateTokenPair(payload) {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      this.accessTokenSecret,
      { 
        expiresIn: this.accessTokenExpiry,
        issuer: 'your-app',
        audience: 'your-app-users'
      }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.refreshTokenSecret,
      { 
        expiresIn: this.refreshTokenExpiry,
        issuer: 'your-app',
        audience: 'your-app-users'
      }
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token) {
    try {
      const decoded = await promisify(jwt.verify)(token, this.accessTokenSecret);
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error: any) {
      throw new Error('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token) {
    try {
      const decoded = await promisify(jwt.verify)(token, this.refreshTokenSecret);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error: any) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}

// Token blacklist using Redis
class TokenBlacklist {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async blacklistToken(token, expiresIn) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.setex(\`blacklist:\${tokenHash}\`, expiresIn, 'true');
  }

  async isTokenBlacklisted(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await this.redis.get(\`blacklist:\${tokenHash}\`);
    return result === 'true';
  }
}
\`\`\`

### Role-Based Access Control (RBAC)

\`\`\`javascript
// Permission system
const permissions = {
  'user:read': 'Read user information',
  'user:write': 'Create and update users',
  'user:delete': 'Delete users',
  'admin:dashboard': 'Access admin dashboard',
  'admin:system': 'System administration'
};

const roles = {
  user: ['user:read'],
  moderator: ['user:read', 'user:write'],
  admin: ['user:read', 'user:write', 'user:delete', 'admin:dashboard'],
  superadmin: Object.keys(permissions)
};

// Authorization middleware
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // From authentication middleware
      const userPermissions = roles[user.role] || [];
      
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
      
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// Usage
app.get('/api/admin/users', 
  authenticate, 
  authorize('admin:dashboard'), 
  getAllUsers
);

app.delete('/api/users/:id', 
  authenticate, 
  authorize('user:delete'), 
  deleteUser
);
\`\`\`

## Security Monitoring and Incident Response

### Logging Security Events

\`\`\`javascript
const winston = require('winston');

// Security-focused logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'warn'
    }),
    new winston.transports.Console({
      level: 'info'
    })
  ]
});

// Security event logging
const logSecurityEvent = (eventType, details, req) => {
  securityLogger.warn({
    eventType,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    ...details
  });
};

// Usage in middleware
const securityEventLogger = (req, res, next) => {
  // Log failed authentication attempts
  if (req.path === '/api/auth/login' && res.statusCode === 401) {
    logSecurityEvent('FAILED_LOGIN', {
      email: req.body.email,
      reason: 'Invalid credentials'
    }, req);
  }
  
  // Log privilege escalation attempts
  if (res.statusCode === 403) {
    logSecurityEvent('UNAUTHORIZED_ACCESS', {
      attemptedResource: req.originalUrl,
      userRole: req.user?.role
    }, req);
  }
  
  next();
};
\`\`\`

### Intrusion Detection

\`\`\`javascript
// Anomaly detection for unusual patterns
class SecurityMonitor {
  constructor(redisClient) {
    this.redis = redisClient;
    this.suspiciousThresholds = {
      requestsPerMinute: 100,
      failedLoginsPerHour: 5,
      differentIPsPerUser: 3
    };
  }

  async checkSuspiciousActivity(req) {
    const ip = req.ip;
    const userId = req.user?.id;
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);

    // Check request rate per IP
    const requestKey = \`requests:\${ip}:\${minute}\`;
    const requestCount = await this.redis.incr(requestKey);
    await this.redis.expire(requestKey, 60);

    if (requestCount > this.suspiciousThresholds.requestsPerMinute) {
      await this.reportSuspiciousActivity('HIGH_REQUEST_RATE', {
        ip,
        requestCount,
        timeWindow: 'per_minute'
      });
    }

    // Check failed logins
    if (req.path === '/api/auth/login' && req.method === 'POST') {
      const failedLoginKey = \`failed_logins:\${ip}:\${hour}\`;
      const failedCount = await this.redis.incr(failedLoginKey);
      await this.redis.expire(failedLoginKey, 3600);

      if (failedCount > this.suspiciousThresholds.failedLoginsPerHour) {
        await this.reportSuspiciousActivity('BRUTE_FORCE_ATTEMPT', {
          ip,
          failedAttempts: failedCount,
          timeWindow: 'per_hour'
        });
      }
    }

    // Check multiple IPs for same user
    if (userId) {
      const userIPKey = \`user_ips:\${userId}:\${hour}\`;
      await this.redis.sadd(userIPKey, ip);
      await this.redis.expire(userIPKey, 3600);
      
      const ipCount = await this.redis.scard(userIPKey);
      if (ipCount > this.suspiciousThresholds.differentIPsPerUser) {
        await this.reportSuspiciousActivity('MULTIPLE_IP_ACCESS', {
          userId,
          ipCount,
          timeWindow: 'per_hour'
        });
      }
    }
  }

  async reportSuspiciousActivity(type, details) {
    // Log the incident
    securityLogger.error({
      alertType: 'SECURITY_INCIDENT',
      incidentType: type,
      details,
      timestamp: new Date().toISOString()
    });

    // Trigger automated response (e.g., temporary IP block)
    if (type === 'BRUTE_FORCE_ATTEMPT') {
      await this.temporaryIPBlock(details.ip, 3600); // 1 hour block
    }

    // Send alert to security team (implement based on your notification system)
    await this.sendSecurityAlert(type, details);
  }

  async temporaryIPBlock(ip, duration) {
    await this.redis.setex(\`blocked_ip:\${ip}\`, duration, 'true');
  }

  async isIPBlocked(ip) {
    const blocked = await this.redis.get(\`blocked_ip:\${ip}\`);
    return blocked === 'true';
  }

  async sendSecurityAlert(type, details) {
    // Implement your alerting mechanism (email, Slack, PagerDuty, etc.)
    console.log(\`SECURITY ALERT: \${type}\`, details);
  }
}
\`\`\`

## Secure Deployment Practices

### Environment Security

\`\`\`javascript
// Environment variable validation
const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'ENCRYPTION_KEY'
];

const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
  }

  // Validate secret lengths
  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    console.error('JWT_ACCESS_SECRET must be at least 32 characters');
    process.exit(1);
  }

  if (process.env.ENCRYPTION_KEY.length !== 32) {
    console.error('ENCRYPTION_KEY must be exactly 32 bytes');
    process.exit(1);
  }
};

// Call during application startup
validateEnvironment();
\`\`\`

### Production Security Checklist

\`\`\`yaml
# Security checklist for production deployment

Infrastructure:
  - [ ] HTTPS/TLS 1.3 properly configured
  - [ ] Security headers implemented (CSP, HSTS, etc.)
  - [ ] Web Application Firewall (WAF) configured
  - [ ] DDoS protection enabled
  - [ ] Regular security patches applied

Application:
  - [ ] Input validation on all endpoints
  - [ ] SQL injection protection verified
  - [ ] XSS protection implemented
  - [ ] CSRF protection enabled
  - [ ] Rate limiting configured
  - [ ] Authentication and authorization tested
  - [ ] Sensitive data encrypted at rest and in transit
  - [ ] Error messages don't leak sensitive information

Monitoring:
  - [ ] Security event logging implemented
  - [ ] Intrusion detection system active
  - [ ] Anomaly detection configured
  - [ ] Security alerts set up
  - [ ] Regular security audits scheduled
  - [ ] Incident response plan documented

Configuration:
  - [ ] Default passwords changed
  - [ ] Unnecessary services disabled
  - [ ] File permissions properly set
  - [ ] Database access restricted
  - [ ] API endpoints secured
  - [ ] Environment variables secured
\`\`\`

## Conclusion

Web application security requires a comprehensive, layered approach that addresses threats at every level. Key takeaways include:

1. **Defense in Depth**: Implement multiple layers of security controls
2. **Secure by Default**: Build security into your application from the ground up
3. **Continuous Monitoring**: Actively monitor for threats and anomalies
4. **Regular Updates**: Keep all dependencies and systems up to date
5. **Security Culture**: Foster a security-minded development culture

Remember that security is not a one-time implementation but an ongoing process. Stay informed about emerging threats, regularly review and update your security measures, and always assume that attacks will happen—prepare accordingly.

The cost of implementing proper security measures is minimal compared to the potential impact of a security breach. Invest in security early and continuously to protect your users, your data, and your business reputation.
    `,
    views: 1745,
    published: true,
  }
];

async function main() {
  try {
    console.log("🌱 Seeding blog posts for development database...");

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      console.log("❌ This script only runs in development environment");
      return;
    }

    // Get the first user (teacher) to be the author
    const author = await database.user.findFirst({
      where: {
        OR: [
          { email: 'teacher@dev.local' },
          { email: { contains: 'teacher' } },
          { email: { contains: '@taxomind.com' } }
        ]
      }
    });

    if (!author) {
      console.log("❌ No users found. Please run the main dev-seed script first.");
      return;
    }

    console.log("🗑️ Clearing existing blog posts...");
    await database.post.deleteMany({});

    console.log("✅ Cleared existing blog posts");

    // Create blog posts
    const posts = [];
    for (let i = 0; i < blogPosts.length; i++) {
      const post = blogPosts[i];
      
      const createdPost = await database.post.create({
        data: {
          id: `post_${Date.now()}_${i}`,
          title: post.title,
          description: post.description,
          body: post.body,
          category: post.category,
          imageUrl: post.imageUrl,
          views: post.views,
          published: post.published,
          userId: author.id,
          authorId: author.id,
        }
      });

      posts.push(createdPost);
      
      // Add some variety in creation dates
      const randomDaysAgo = Math.floor(Math.random() * 30) + 1;
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - randomDaysAgo);
      
      await database.post.update({
        where: { id: createdPost.id },
        data: { createdAt }
      });
    }

    console.log(`✅ Created ${posts.length} blog posts`);

    // Create some sample comments for engagement
    const sampleUsers = await database.user.findMany({
      take: 3,
      skip: 1 // Skip the teacher, get other users
    });

    if (sampleUsers.length > 0) {
      const comments = [];
      for (let i = 0; i < Math.min(15, posts.length * 3); i++) {
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        
        const commentTexts = [
          "Excellent article! Really helped me understand the concepts better.",
          "Thanks for sharing this detailed explanation. Very useful!",
          "Great insights. I'll definitely implement some of these practices.",
          "Well written and comprehensive. Looking forward to more content like this.",
          "This is exactly what I was looking for. Thank you!",
          "Fantastic guide! Bookmarked for future reference.",
          "Clear explanations and practical examples. Much appreciated!",
          "Very informative. The code examples are particularly helpful.",
          "Great work! This will definitely help in my current project.",
          "Comprehensive coverage of the topic. Well done!"
        ];

        const comment = await database.comment.create({
          data: {
            id: `comment_${Date.now()}_${i}`,
            content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
            postId: randomPost.id,
            userId: randomUser.id,
          }
        });

        comments.push(comment);
      }

      console.log(`✅ Created ${comments.length} sample comments`);
    }

    console.log("🎉 Blog seeding completed successfully!");

    console.log(`
📝 Blog Summary:
- ${posts.length} professional blog posts
- ${blogCategories.length} different categories
- Sample comments for engagement
- Author: ${author.name} (${author.email})

📊 Categories covered:
${blogCategories.map(cat => `  - ${cat}`).join('\n')}

🚀 View the blog at: http://localhost:3000/blog
    `);

  } catch (error: any) {
    console.error("❌ Error seeding blog:", error);
    throw error;
  } finally {
    await database.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = main;