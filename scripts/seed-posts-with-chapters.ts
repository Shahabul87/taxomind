import { db } from '../lib/db';

const userId = 'cmgvy101v0000h4uvpd1enrp6';

// Unsplash image URLs for posts and chapters
const postImages = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800',
];

const chapterImages = [
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800',
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
  'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?w=800',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
];

const postsData = [
  {
    title: 'The Complete Guide to Modern Web Development',
    description: 'Master the fundamentals of modern web development from frontend to backend, including best practices and industry standards.',
    category: 'Web Development',
    imageUrl: postImages[0],
    published: true,
    chapters: [
      {
        title: 'Introduction to Modern Web Stack',
        description: 'Understanding the core technologies that power modern web applications',
        content: `<h2>Welcome to Modern Web Development</h2>
<p>The web development landscape has evolved dramatically over the past decade. Today&apos;s developers need to master a wide range of technologies and tools to build robust, scalable applications.</p>
<p>In this comprehensive guide, we&apos;ll explore the essential components of the modern web stack, including:</p>
<ul>
<li>Frontend frameworks and libraries (React, Vue, Angular)</li>
<li>Backend technologies (Node.js, Python, Go)</li>
<li>Database systems (SQL and NoSQL)</li>
<li>DevOps and deployment strategies</li>
</ul>
<p>Whether you&apos;re a beginner or an experienced developer looking to update your skills, this guide will provide you with the knowledge you need to succeed in today&apos;s competitive development landscape.</p>`,
        imageUrl: chapterImages[0],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Frontend Development Essentials',
        description: 'Deep dive into React, TypeScript, and modern frontend tools',
        content: `<h2>Building Modern User Interfaces</h2>
<p>Frontend development has become increasingly sophisticated. Modern frameworks like React have revolutionized how we build user interfaces.</p>
<h3>Key Concepts</h3>
<p>Component-based architecture allows us to build reusable, maintainable code. TypeScript adds type safety, catching errors before they reach production.</p>
<p>Essential tools and libraries include:</p>
<ul>
<li>React 19 with Server Components</li>
<li>TypeScript for type safety</li>
<li>Tailwind CSS for styling</li>
<li>Next.js for full-stack React applications</li>
</ul>`,
        imageUrl: chapterImages[1],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Backend Architecture and APIs',
        description: 'Building scalable backend systems with Node.js and databases',
        content: `<h2>Server-Side Development</h2>
<p>A solid backend architecture is crucial for application success. We&apos;ll explore REST APIs, GraphQL, and microservices.</p>
<p>Modern backend development requires understanding of:</p>
<ul>
<li>API design principles</li>
<li>Database modeling and optimization</li>
<li>Authentication and authorization</li>
<li>Caching strategies</li>
<li>Error handling and logging</li>
</ul>`,
        imageUrl: chapterImages[2],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Deployment and DevOps',
        description: 'Taking your application from development to production',
        content: `<h2>Production-Ready Applications</h2>
<p>Deploying applications requires more than just pushing code. Learn about CI/CD, containerization, and cloud platforms.</p>
<p>Modern deployment strategies include Docker, Kubernetes, and serverless architectures. We&apos;ll cover monitoring, logging, and maintaining production systems.</p>`,
        imageUrl: chapterImages[3],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Mastering React Performance Optimization',
    description: 'Advanced techniques to make your React applications lightning fast and highly efficient.',
    category: 'React',
    imageUrl: postImages[1],
    published: true,
    chapters: [
      {
        title: 'Understanding React Rendering',
        description: 'How React updates the DOM and when re-renders occur',
        content: `<h2>The React Rendering Cycle</h2>
<p>Understanding how React renders components is fundamental to optimization. Every state change can trigger re-renders, affecting performance.</p>
<p>Key concepts include:</p>
<ul>
<li>Virtual DOM and reconciliation</li>
<li>Component lifecycle and hooks</li>
<li>Render phases and commit phases</li>
</ul>`,
        imageUrl: chapterImages[0],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Memoization Techniques',
        description: 'Using React.memo, useMemo, and useCallback effectively',
        content: `<h2>Optimizing with Memoization</h2>
<p>React provides several tools for preventing unnecessary re-renders. React.memo wraps components, useMemo caches values, and useCallback memoizes functions.</p>
<p>Best practices for memoization:</p>
<ul>
<li>Profile before optimizing</li>
<li>Don&apos;t over-memoize</li>
<li>Use dependency arrays correctly</li>
</ul>`,
        imageUrl: chapterImages[1],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Code Splitting and Lazy Loading',
        description: 'Reduce bundle size and improve initial load time',
        content: `<h2>Dynamic Imports in React</h2>
<p>Code splitting allows you to load only the code users need, when they need it. React.lazy and Suspense make this straightforward.</p>
<p>Implement route-based code splitting to dramatically reduce initial bundle size and improve Time to Interactive metrics.</p>`,
        imageUrl: chapterImages[2],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Building Scalable Node.js Applications',
    description: 'Learn how to architect and build Node.js applications that can handle millions of requests.',
    category: 'Backend',
    imageUrl: postImages[2],
    published: true,
    chapters: [
      {
        title: 'Node.js Architecture Patterns',
        description: 'MVC, microservices, and event-driven architectures',
        content: `<h2>Architecting Node.js Applications</h2>
<p>Choosing the right architecture is crucial for scalability. We&apos;ll explore MVC patterns, microservices, and event-driven designs.</p>
<p>Each pattern has trade-offs in complexity, scalability, and maintainability. Understanding these helps you make informed architectural decisions.</p>`,
        imageUrl: chapterImages[3],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Database Integration and ORMs',
        description: 'Working with PostgreSQL, MongoDB, and Prisma',
        content: `<h2>Database Best Practices</h2>
<p>Effective database integration is key to application performance. Learn about connection pooling, query optimization, and migration strategies.</p>
<p>We&apos;ll cover both SQL (PostgreSQL) and NoSQL (MongoDB) databases, along with modern ORMs like Prisma and Sequelize.</p>`,
        imageUrl: chapterImages[4],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'API Security and Authentication',
        description: 'Implementing JWT, OAuth, and securing your endpoints',
        content: `<h2>Securing Your APIs</h2>
<p>Security cannot be an afterthought. Implement proper authentication, authorization, rate limiting, and input validation.</p>
<p>Topics covered include JWT tokens, OAuth flows, API keys, and preventing common vulnerabilities like SQL injection and XSS attacks.</p>`,
        imageUrl: chapterImages[5],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Performance Monitoring and Scaling',
        description: 'Tools and strategies for production Node.js apps',
        content: `<h2>Production-Ready Node.js</h2>
<p>Monitor application performance with tools like PM2, New Relic, and DataDog. Implement horizontal scaling with load balancers.</p>
<p>Learn about clustering, worker threads, and optimizing for high-traffic scenarios.</p>`,
        imageUrl: chapterImages[6],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'TypeScript for JavaScript Developers',
    description: 'Transform your JavaScript code with TypeScript&apos;s powerful type system and modern features.',
    category: 'TypeScript',
    imageUrl: postImages[3],
    published: true,
    chapters: [
      {
        title: 'Why TypeScript Matters',
        description: 'Understanding the benefits of static typing',
        content: `<h2>The TypeScript Advantage</h2>
<p>TypeScript adds static typing to JavaScript, catching errors at compile time rather than runtime. This leads to more maintainable and reliable code.</p>
<p>Benefits include better IDE support, refactoring confidence, and improved documentation through types.</p>`,
        imageUrl: chapterImages[0],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'TypeScript Fundamentals',
        description: 'Types, interfaces, and generics',
        content: `<h2>Core TypeScript Concepts</h2>
<p>Master the basics: primitive types, union types, intersection types, and type aliases. Learn when to use interfaces versus types.</p>
<p>Generics provide powerful abstractions while maintaining type safety. We&apos;ll explore common generic patterns and best practices.</p>`,
        imageUrl: chapterImages[1],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Advanced Type Patterns',
        description: 'Conditional types, mapped types, and utility types',
        content: `<h2>Advanced TypeScript Features</h2>
<p>Take your TypeScript skills to the next level with conditional types, mapped types, and template literal types.</p>
<p>Learn to leverage TypeScript&apos;s utility types like Partial, Pick, Omit, and Record to write more concise and expressive code.</p>`,
        imageUrl: chapterImages[2],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'CSS Grid and Flexbox Mastery',
    description: 'Create complex, responsive layouts with modern CSS layout systems.',
    category: 'CSS',
    imageUrl: postImages[4],
    published: true,
    chapters: [
      {
        title: 'Understanding CSS Grid',
        description: 'Two-dimensional layouts made simple',
        content: `<h2>CSS Grid Fundamentals</h2>
<p>CSS Grid is a powerful layout system that allows you to create complex two-dimensional layouts with ease.</p>
<p>Learn about grid containers, grid items, grid lines, and grid areas. Master explicit and implicit grids.</p>`,
        imageUrl: chapterImages[3],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Flexbox Deep Dive',
        description: 'One-dimensional layouts and alignment',
        content: `<h2>Mastering Flexbox</h2>
<p>Flexbox excels at one-dimensional layouts and aligning items. Understand flex containers, flex items, and the flex shorthand property.</p>
<p>Learn when to use Flexbox versus Grid, and how to combine them for optimal layouts.</p>`,
        imageUrl: chapterImages[4],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Responsive Design Patterns',
        description: 'Building layouts that work on all devices',
        content: `<h2>Mobile-First Responsive Design</h2>
<p>Create layouts that adapt seamlessly to different screen sizes using Grid and Flexbox together.</p>
<p>Explore common responsive patterns: the sidebar layout, the holy grail, card layouts, and more.</p>`,
        imageUrl: chapterImages[5],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Git and Version Control Best Practices',
    description: 'Master Git workflows, branching strategies, and collaboration techniques.',
    category: 'DevOps',
    imageUrl: postImages[5],
    published: true,
    chapters: [
      {
        title: 'Git Fundamentals',
        description: 'Commits, branches, and basic workflows',
        content: `<h2>Getting Started with Git</h2>
<p>Git is the industry standard for version control. Learn the fundamentals: commits, branches, merges, and rebases.</p>
<p>Understand the staging area, the Git object model, and basic commands that every developer should know.</p>`,
        imageUrl: chapterImages[6],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Branching Strategies',
        description: 'Git Flow, GitHub Flow, and trunk-based development',
        content: `<h2>Effective Branching Models</h2>
<p>Different projects require different branching strategies. Explore Git Flow for release-based projects and GitHub Flow for continuous deployment.</p>
<p>Learn about feature branches, release branches, and hotfix branches. Understand when to use each strategy.</p>`,
        imageUrl: chapterImages[7],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Collaboration and Code Review',
        description: 'Pull requests, code reviews, and team workflows',
        content: `<h2>Working in Teams</h2>
<p>Effective collaboration requires good Git practices. Master pull requests, code reviews, and conflict resolution.</p>
<p>Learn to write meaningful commit messages, structure your commits logically, and use Git hooks for automation.</p>`,
        imageUrl: chapterImages[8],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'RESTful API Design Principles',
    description: 'Design clean, maintainable, and scalable REST APIs following industry best practices.',
    category: 'API Development',
    imageUrl: postImages[6],
    published: true,
    chapters: [
      {
        title: 'REST API Fundamentals',
        description: 'HTTP methods, status codes, and resource naming',
        content: `<h2>Understanding REST</h2>
<p>REST (Representational State Transfer) is an architectural style for designing networked applications. Learn the core principles and constraints.</p>
<p>Master HTTP methods (GET, POST, PUT, DELETE), status codes, and proper resource naming conventions.</p>`,
        imageUrl: chapterImages[0],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'API Versioning and Documentation',
        description: 'Managing API changes and documenting endpoints',
        content: `<h2>Maintaining API Stability</h2>
<p>APIs evolve over time. Learn versioning strategies (URI, header, content negotiation) to maintain backward compatibility.</p>
<p>Document your APIs effectively using OpenAPI (Swagger), Postman collections, and comprehensive README files.</p>`,
        imageUrl: chapterImages[1],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Authentication and Security',
        description: 'Securing your API with modern authentication methods',
        content: `<h2>API Security Best Practices</h2>
<p>Implement robust authentication using JWT tokens, API keys, or OAuth 2.0. Add rate limiting to prevent abuse.</p>
<p>Validate all inputs, sanitize outputs, and use HTTPS everywhere. Protect against common vulnerabilities.</p>`,
        imageUrl: chapterImages[2],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Error Handling and Pagination',
        description: 'Handling errors gracefully and managing large datasets',
        content: `<h2>Production-Ready APIs</h2>
<p>Proper error handling includes meaningful error messages, appropriate status codes, and detailed error responses.</p>
<p>Implement pagination (offset-based or cursor-based) to handle large datasets efficiently. Add filtering and sorting capabilities.</p>`,
        imageUrl: chapterImages[3],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Docker and Containerization',
    description: 'Package and deploy applications consistently across environments using Docker.',
    category: 'DevOps',
    imageUrl: postImages[7],
    published: true,
    chapters: [
      {
        title: 'Introduction to Docker',
        description: 'Containers, images, and the Docker ecosystem',
        content: `<h2>Why Docker Matters</h2>
<p>Docker solves the &quot;it works on my machine&quot; problem by packaging applications with their dependencies into containers.</p>
<p>Learn about Docker images, containers, registries, and how containerization differs from virtualization.</p>`,
        imageUrl: chapterImages[4],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Writing Dockerfiles',
        description: 'Creating efficient and secure Docker images',
        content: `<h2>Dockerfile Best Practices</h2>
<p>A well-written Dockerfile is crucial for image size, build time, and security. Use multi-stage builds to minimize image size.</p>
<p>Learn about layer caching, .dockerignore files, and choosing the right base images.</p>`,
        imageUrl: chapterImages[5],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Docker Compose and Networking',
        description: 'Multi-container applications and service communication',
        content: `<h2>Orchestrating Multiple Containers</h2>
<p>Docker Compose allows you to define multi-container applications in a single file. Perfect for development environments.</p>
<p>Understand Docker networking: bridge networks, host networks, and custom networks. Enable containers to communicate securely.</p>`,
        imageUrl: chapterImages[6],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'GraphQL API Development',
    description: 'Build flexible and efficient APIs with GraphQL, Apollo, and modern tools.',
    category: 'API Development',
    imageUrl: postImages[8],
    published: true,
    chapters: [
      {
        title: 'GraphQL vs REST',
        description: 'Understanding when to use GraphQL',
        content: `<h2>The GraphQL Advantage</h2>
<p>GraphQL provides a complete description of your API and gives clients the power to ask for exactly what they need.</p>
<p>Compare GraphQL and REST: benefits, drawbacks, and use cases for each approach.</p>`,
        imageUrl: chapterImages[7],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Schema Design and Resolvers',
        description: 'Creating types, queries, and mutations',
        content: `<h2>Building GraphQL Schemas</h2>
<p>Design your GraphQL schema using the Schema Definition Language (SDL). Define types, queries, mutations, and subscriptions.</p>
<p>Implement resolvers to fetch data from various sources. Handle authentication and authorization at the resolver level.</p>`,
        imageUrl: chapterImages[8],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Apollo Server and Client',
        description: 'Full-stack GraphQL with Apollo',
        content: `<h2>The Apollo Ecosystem</h2>
<p>Apollo Server simplifies GraphQL server implementation. Apollo Client provides powerful caching and state management for frontend applications.</p>
<p>Learn about subscriptions for real-time data, batching queries, and optimizing performance.</p>`,
        imageUrl: chapterImages[9],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'MongoDB and NoSQL Database Design',
    description: 'Master document-based databases and learn when to use NoSQL over SQL.',
    category: 'Database',
    imageUrl: postImages[9],
    published: true,
    chapters: [
      {
        title: 'NoSQL Fundamentals',
        description: 'Understanding document databases',
        content: `<h2>Introduction to MongoDB</h2>
<p>MongoDB is a popular NoSQL database that stores data in flexible, JSON-like documents. Perfect for applications with evolving schemas.</p>
<p>Learn about collections, documents, and BSON format. Understand when to use MongoDB versus relational databases.</p>`,
        imageUrl: chapterImages[0],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Schema Design Patterns',
        description: 'Embedding vs referencing and data modeling',
        content: `<h2>MongoDB Data Modeling</h2>
<p>Unlike SQL databases, MongoDB schema design requires different thinking. Learn about embedding documents versus referencing.</p>
<p>Explore common patterns: one-to-few, one-to-many, one-to-squillions. Optimize for your application&apos;s access patterns.</p>`,
        imageUrl: chapterImages[1],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Aggregation and Indexing',
        description: 'Advanced queries and performance optimization',
        content: `<h2>MongoDB Performance</h2>
<p>The aggregation framework is powerful for data processing. Build complex queries with $match, $group, $project, and more.</p>
<p>Proper indexing is crucial for query performance. Learn about single-field, compound, and text indexes.</p>`,
        imageUrl: chapterImages[2],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Transactions and Replication',
        description: 'ACID guarantees and high availability',
        content: `<h2>Enterprise MongoDB</h2>
<p>MongoDB supports multi-document ACID transactions for critical operations. Understand when to use them and their performance implications.</p>
<p>Set up replica sets for high availability and read scaling. Learn about sharding for horizontal scalability.</p>`,
        imageUrl: chapterImages[3],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Next.js 15 Complete Guide',
    description: 'Build full-stack React applications with Next.js 15, App Router, and Server Components.',
    category: 'React',
    imageUrl: postImages[0],
    published: true,
    chapters: [
      {
        title: 'Next.js App Router',
        description: 'File-based routing and layouts',
        content: `<h2>The New App Router</h2>
<p>Next.js 15 introduces the App Router with powerful features like layouts, loading states, and error boundaries.</p>
<p>Learn about nested routing, route groups, and dynamic segments. Master the file-system based routing conventions.</p>`,
        imageUrl: chapterImages[4],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Server Components',
        description: 'React Server Components and streaming',
        content: `<h2>Server-Side Rendering Evolution</h2>
<p>React Server Components allow you to render components on the server, reducing client-side JavaScript and improving performance.</p>
<p>Understand the difference between Server and Client Components. Learn when to use each and how to compose them.</p>`,
        imageUrl: chapterImages[5],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Data Fetching and Caching',
        description: 'Server actions, mutations, and revalidation',
        content: `<h2>Modern Data Fetching</h2>
<p>Next.js provides powerful data fetching with automatic caching and revalidation. Use server actions for mutations.</p>
<p>Learn about Static Site Generation (SSG), Server-Side Rendering (SSR), and Incremental Static Regeneration (ISR).</p>`,
        imageUrl: chapterImages[6],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Tailwind CSS Advanced Techniques',
    description: 'Build beautiful, responsive UIs faster with Tailwind CSS utility classes and plugins.',
    category: 'CSS',
    imageUrl: postImages[1],
    published: true,
    chapters: [
      {
        title: 'Tailwind Fundamentals',
        description: 'Utility-first CSS methodology',
        content: `<h2>Why Tailwind CSS</h2>
<p>Tailwind CSS is a utility-first framework that lets you build custom designs without leaving your HTML.</p>
<p>Learn about responsive design with breakpoint modifiers, dark mode, and the JIT (Just-In-Time) compiler.</p>`,
        imageUrl: chapterImages[7],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Customization and Theming',
        description: 'Extending Tailwind with custom configurations',
        content: `<h2>Custom Tailwind Configurations</h2>
<p>Extend Tailwind with custom colors, spacing, fonts, and more. Create design systems with consistent theming.</p>
<p>Use @apply to extract component classes and maintain consistency across your application.</p>`,
        imageUrl: chapterImages[8],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Plugins and Advanced Features',
        description: 'Forms, typography, and custom plugins',
        content: `<h2>Extending Tailwind&apos;s Capabilities</h2>
<p>Official plugins like @tailwindcss/forms and @tailwindcss/typography enhance Tailwind&apos;s functionality.</p>
<p>Learn to create custom plugins for project-specific utilities. Master arbitrary values for one-off customizations.</p>`,
        imageUrl: chapterImages[9],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'PostgreSQL Performance Tuning',
    description: 'Optimize PostgreSQL databases for maximum performance and scalability.',
    category: 'Database',
    imageUrl: postImages[2],
    published: true,
    chapters: [
      {
        title: 'Query Optimization',
        description: 'EXPLAIN, indexes, and query planning',
        content: `<h2>Understanding Query Performance</h2>
<p>Use EXPLAIN ANALYZE to understand how PostgreSQL executes your queries. Identify slow queries and optimization opportunities.</p>
<p>Learn about sequential scans, index scans, and join strategies. Optimize your WHERE clauses and JOINs.</p>`,
        imageUrl: chapterImages[0],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Indexing Strategies',
        description: 'B-tree, GiST, GIN, and specialized indexes',
        content: `<h2>Advanced Indexing</h2>
<p>Different queries benefit from different index types. B-tree indexes are the default, but GIN and GiST indexes excel for specific use cases.</p>
<p>Learn when to use partial indexes, multi-column indexes, and covering indexes. Understand index maintenance.</p>`,
        imageUrl: chapterImages[1],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Connection Pooling and Scaling',
        description: 'PgBouncer, read replicas, and horizontal scaling',
        content: `<h2>Scaling PostgreSQL</h2>
<p>Connection pooling with PgBouncer reduces overhead and improves throughput. Set up read replicas for scaling read operations.</p>
<p>Explore partitioning strategies for large tables. Learn about connection limits and resource management.</p>`,
        imageUrl: chapterImages[2],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Testing Modern Web Applications',
    description: 'Comprehensive testing strategies including unit, integration, and end-to-end tests.',
    category: 'Testing',
    imageUrl: postImages[3],
    published: true,
    chapters: [
      {
        title: 'Testing Fundamentals',
        description: 'Unit tests, integration tests, and E2E tests',
        content: `<h2>The Testing Pyramid</h2>
<p>A solid testing strategy includes multiple layers: unit tests form the base, integration tests the middle, and E2E tests the top.</p>
<p>Learn when to use each type of test and how to balance coverage with maintenance costs.</p>`,
        imageUrl: chapterImages[3],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Jest and React Testing Library',
        description: 'Testing React components effectively',
        content: `<h2>Component Testing Best Practices</h2>
<p>React Testing Library encourages testing components the way users interact with them, focusing on behavior over implementation.</p>
<p>Write maintainable tests that provide confidence without being brittle. Mock external dependencies appropriately.</p>`,
        imageUrl: chapterImages[4],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Playwright for E2E Testing',
        description: 'Reliable end-to-end tests across browsers',
        content: `<h2>Modern E2E Testing</h2>
<p>Playwright provides fast, reliable automation for testing web applications across Chrome, Firefox, and Safari.</p>
<p>Learn about page objects, test fixtures, and visual regression testing. Integrate E2E tests into your CI/CD pipeline.</p>`,
        imageUrl: chapterImages[5],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Microservices Architecture Patterns',
    description: 'Design and implement scalable microservices with modern patterns and practices.',
    category: 'Architecture',
    imageUrl: postImages[4],
    published: true,
    chapters: [
      {
        title: 'Microservices Fundamentals',
        description: 'When and why to use microservices',
        content: `<h2>Understanding Microservices</h2>
<p>Microservices architecture decomposes applications into small, independent services. Each service is responsible for a specific business capability.</p>
<p>Learn the benefits (scalability, technology flexibility) and challenges (complexity, distributed systems) of microservices.</p>`,
        imageUrl: chapterImages[6],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Service Communication',
        description: 'REST, gRPC, message queues, and event-driven architecture',
        content: `<h2>Inter-Service Communication</h2>
<p>Services need to communicate efficiently. Synchronous communication (REST, gRPC) suits some scenarios, while asynchronous messaging (RabbitMQ, Kafka) works better for others.</p>
<p>Implement event-driven architectures for loose coupling and improved resilience.</p>`,
        imageUrl: chapterImages[7],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Service Discovery and API Gateway',
        description: 'Managing service locations and routing',
        content: `<h2>Infrastructure Patterns</h2>
<p>Service discovery allows services to find each other dynamically. Use tools like Consul or Kubernetes DNS.</p>
<p>API gateways provide a single entry point, handling routing, authentication, rate limiting, and request aggregation.</p>`,
        imageUrl: chapterImages[8],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Observability and Monitoring',
        description: 'Logs, metrics, and distributed tracing',
        content: `<h2>Microservices Observability</h2>
<p>Distributed systems require comprehensive observability. Implement centralized logging, metrics collection, and distributed tracing.</p>
<p>Tools like Prometheus, Grafana, Jaeger, and ELK stack help you understand system behavior and troubleshoot issues.</p>`,
        imageUrl: chapterImages[9],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Redis Caching Strategies',
    description: 'Improve application performance with Redis caching, pub/sub, and data structures.',
    category: 'Backend',
    imageUrl: postImages[5],
    published: true,
    chapters: [
      {
        title: 'Redis Basics',
        description: 'In-memory data store fundamentals',
        content: `<h2>Introduction to Redis</h2>
<p>Redis is an in-memory data structure store used as a cache, database, and message broker. It&apos;s extremely fast and supports various data types.</p>
<p>Learn about strings, hashes, lists, sets, sorted sets, and their use cases in application development.</p>`,
        imageUrl: chapterImages[0],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Caching Patterns',
        description: 'Cache-aside, write-through, and write-behind',
        content: `<h2>Effective Caching Strategies</h2>
<p>Different caching patterns suit different scenarios. Cache-aside is simple and common, while write-through ensures consistency.</p>
<p>Implement cache invalidation strategies and set appropriate TTLs (Time To Live) to balance freshness and performance.</p>`,
        imageUrl: chapterImages[1],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Pub/Sub and Real-time Features',
        description: 'Building real-time applications with Redis',
        content: `<h2>Real-time Communication</h2>
<p>Redis Pub/Sub enables message broadcasting for real-time features like chat applications, notifications, and live updates.</p>
<p>Combine Redis with WebSockets for scalable real-time applications. Use Redis Streams for event sourcing patterns.</p>`,
        imageUrl: chapterImages[2],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Kubernetes for Developers',
    description: 'Deploy and manage containerized applications at scale with Kubernetes.',
    category: 'DevOps',
    imageUrl: postImages[6],
    published: true,
    chapters: [
      {
        title: 'Kubernetes Architecture',
        description: 'Pods, services, and cluster components',
        content: `<h2>Understanding Kubernetes</h2>
<p>Kubernetes orchestrates containers across a cluster of machines. Learn about the control plane, worker nodes, and key components.</p>
<p>Understand pods (the smallest deployable units), services (networking abstraction), and deployments (managing replicas).</p>`,
        imageUrl: chapterImages[3],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Deployments and ConfigMaps',
        description: 'Managing application deployments and configuration',
        content: `<h2>Application Deployment</h2>
<p>Deployments manage rolling updates and rollbacks. ConfigMaps and Secrets externalize configuration from container images.</p>
<p>Learn about liveness and readiness probes to ensure application health and availability.</p>`,
        imageUrl: chapterImages[4],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Ingress and Networking',
        description: 'Exposing applications and managing traffic',
        content: `<h2>Kubernetes Networking</h2>
<p>Ingress controllers route external traffic to services. Implement SSL/TLS termination and path-based routing.</p>
<p>Understand service types: ClusterIP, NodePort, and LoadBalancer. Configure network policies for security.</p>`,
        imageUrl: chapterImages[5],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'OAuth 2.0 and Authentication',
    description: 'Implement secure authentication and authorization with OAuth 2.0 and OpenID Connect.',
    category: 'Security',
    imageUrl: postImages[7],
    published: true,
    chapters: [
      {
        title: 'OAuth 2.0 Fundamentals',
        description: 'Flows, tokens, and authorization',
        content: `<h2>Understanding OAuth 2.0</h2>
<p>OAuth 2.0 is the industry-standard protocol for authorization. It enables secure delegated access without sharing passwords.</p>
<p>Learn about authorization code flow, implicit flow, client credentials flow, and when to use each.</p>`,
        imageUrl: chapterImages[6],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'JWT Tokens',
        description: 'JSON Web Tokens for stateless authentication',
        content: `<h2>Working with JWT</h2>
<p>JSON Web Tokens (JWT) are compact, URL-safe tokens containing claims about a user. They&apos;re self-contained and verifiable.</p>
<p>Understand token structure (header, payload, signature), expiration, refresh tokens, and security considerations.</p>`,
        imageUrl: chapterImages[7],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'OpenID Connect',
        description: 'Identity layer on top of OAuth 2.0',
        content: `<h2>User Authentication with OIDC</h2>
<p>OpenID Connect extends OAuth 2.0 to provide user authentication and identity information.</p>
<p>Implement social login (Google, GitHub) and Single Sign-On (SSO). Validate ID tokens and retrieve user profile information.</p>`,
        imageUrl: chapterImages[8],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'AWS Cloud Architecture',
    description: 'Design and deploy scalable applications on Amazon Web Services.',
    category: 'Cloud',
    imageUrl: postImages[8],
    published: true,
    chapters: [
      {
        title: 'AWS Core Services',
        description: 'EC2, S3, RDS, and foundational services',
        content: `<h2>Getting Started with AWS</h2>
<p>Amazon Web Services offers hundreds of services. Start with the core: EC2 for compute, S3 for storage, and RDS for databases.</p>
<p>Learn about VPCs for networking, IAM for access management, and CloudWatch for monitoring.</p>`,
        imageUrl: chapterImages[9],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Serverless with Lambda',
        description: 'Event-driven computing without managing servers',
        content: `<h2>AWS Lambda and Serverless</h2>
<p>Lambda functions run code in response to events without provisioning servers. Pay only for compute time used.</p>
<p>Build serverless APIs with API Gateway, process events from S3, SQS, or DynamoDB. Understand cold starts and optimization.</p>`,
        imageUrl: chapterImages[0],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Infrastructure as Code',
        description: 'CloudFormation and CDK for AWS resources',
        content: `<h2>Automating AWS Deployments</h2>
<p>Infrastructure as Code (IaC) allows you to define AWS resources in code. CloudFormation uses JSON/YAML, while CDK uses programming languages.</p>
<p>Version control your infrastructure, enable reproducible deployments, and manage environments consistently.</p>`,
        imageUrl: chapterImages[1],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Web Security Best Practices',
    description: 'Protect your web applications from common vulnerabilities and attacks.',
    category: 'Security',
    imageUrl: postImages[9],
    published: true,
    chapters: [
      {
        title: 'OWASP Top 10',
        description: 'Most critical web application security risks',
        content: `<h2>Common Web Vulnerabilities</h2>
<p>The OWASP Top 10 lists the most critical security risks to web applications. Learn about injection attacks, broken authentication, and XSS.</p>
<p>Understand each vulnerability, how attackers exploit it, and how to prevent it in your applications.</p>`,
        imageUrl: chapterImages[2],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Input Validation and Sanitization',
        description: 'Protecting against injection attacks',
        content: `<h2>Validating User Input</h2>
<p>Never trust user input. Validate and sanitize all data on both client and server sides. Use parameterized queries to prevent SQL injection.</p>
<p>Implement Content Security Policy (CSP) to mitigate XSS attacks. Encode output when rendering user data.</p>`,
        imageUrl: chapterImages[3],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Authentication Security',
        description: 'Secure password storage and session management',
        content: `<h2>Protecting User Accounts</h2>
<p>Hash passwords with bcrypt or Argon2. Never store passwords in plain text. Implement multi-factor authentication (MFA) for sensitive operations.</p>
<p>Manage sessions securely: use httpOnly and secure cookies, implement CSRF protection, and handle session expiration properly.</p>`,
        imageUrl: chapterImages[4],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'HTTPS and Security Headers',
        description: 'Transport security and browser protections',
        content: `<h2>Network Security</h2>
<p>Always use HTTPS in production. Implement HSTS to enforce HTTPS. Set security headers: X-Frame-Options, X-Content-Type-Options, and CSP.</p>
<p>Configure CORS properly to prevent unauthorized cross-origin requests. Use Subresource Integrity (SRI) for third-party scripts.</p>`,
        imageUrl: chapterImages[5],
        isPublished: true,
        isFree: false,
      },
    ],
  },
  {
    title: 'Progressive Web Apps (PWA)',
    description: 'Build app-like experiences for the web with service workers, offline support, and installability.',
    category: 'Web Development',
    imageUrl: postImages[0],
    published: true,
    chapters: [
      {
        title: 'PWA Fundamentals',
        description: 'Service workers, manifest, and core concepts',
        content: `<h2>What Makes a PWA</h2>
<p>Progressive Web Apps combine the best of web and mobile apps. They&apos;re reliable (work offline), fast (instant loading), and engaging (app-like experience).</p>
<p>Key components include service workers for offline functionality, a web app manifest for installability, and HTTPS for security.</p>`,
        imageUrl: chapterImages[6],
        isPublished: true,
        isFree: true,
      },
      {
        title: 'Service Workers',
        description: 'Caching strategies and background sync',
        content: `<h2>Offline-First Applications</h2>
<p>Service workers are scripts that run in the background, intercepting network requests and serving cached content when offline.</p>
<p>Implement caching strategies: cache-first, network-first, stale-while-revalidate. Use background sync for reliable data submission.</p>`,
        imageUrl: chapterImages[7],
        isPublished: true,
        isFree: false,
      },
      {
        title: 'Push Notifications',
        description: 'Engaging users with web push',
        content: `<h2>Re-engaging Users</h2>
<p>Web push notifications allow you to reach users even when they&apos;re not actively using your application.</p>
<p>Implement push notifications using the Push API and service workers. Request permission thoughtfully and provide value with notifications.</p>`,
        imageUrl: chapterImages[8],
        isPublished: true,
        isFree: false,
      },
    ],
  },
];

async function seedPosts() {
  try {
    console.log('🌱 Starting post seeding...\n');

    // Delete existing posts for this user
    console.log(`🗑️  Deleting existing posts for user: ${userId}`);
    await db.postChapterSection.deleteMany({
      where: {
        Post: {
          userId: userId,
        },
      },
    });
    await db.post.deleteMany({
      where: {
        userId: userId,
      },
    });

    console.log('✅ Cleanup complete\n');

    // Create posts with chapters
    for (const [index, postData] of postsData.entries()) {
      console.log(`📝 Creating post ${index + 1}/${postsData.length}: ${postData.title}`);

      const post = await db.post.create({
        data: {
          id: `post_${Date.now()}_${index}`,
          userId: userId,
          title: postData.title,
          description: postData.description,
          category: postData.category,
          imageUrl: postData.imageUrl,
          published: postData.published,
          views: Math.floor(Math.random() * 5000) + 500, // Random views between 500-5500
          body: '', // Will be populated from chapters
          createdAt: new Date(Date.now() - (20 - index) * 24 * 60 * 60 * 1000), // Spread posts over 20 days
        },
      });

      // Create chapters for this post
      for (const [chapterIndex, chapterData] of postData.chapters.entries()) {
        await db.postChapterSection.create({
          data: {
            id: `chapter_${Date.now()}_${index}_${chapterIndex}`,
            postId: post.id,
            title: chapterData.title,
            description: chapterData.description,
            content: chapterData.content,
            imageUrl: chapterData.imageUrl,
            position: chapterIndex,
            isPublished: chapterData.isPublished,
            isFree: chapterData.isFree,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      console.log(`   ✅ Created ${postData.chapters.length} chapters for "${postData.title}"\n`);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Posts created: ${postsData.length}`);
    console.log(`   - Total chapters: ${postsData.reduce((sum, p) => sum + p.chapters.length, 0)}`);
    console.log(`   - User ID: ${userId}`);

    // Count to verify
    const postCount = await db.post.count({ where: { userId } });
    const chapterCount = await db.postChapterSection.count({
      where: { Post: { userId } },
    });

    console.log(`\n✅ Verification:`);
    console.log(`   - Posts in database: ${postCount}`);
    console.log(`   - Chapters in database: ${chapterCount}`);
  } catch (error) {
    console.error('❌ Error seeding posts:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

seedPosts();
