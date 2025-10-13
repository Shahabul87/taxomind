# Understanding SAM AI Tutor Architecture

You are tasked with understanding the SAM (Smart Adaptive Mentor) AI Tutor architecture. Follow this structured learning path to gain comprehensive knowledge of the system.

## 📚 Required Reading Order

### Step 1: System Overview (15 minutes)
**Read**: `docs/architecture/sam-ai-tutor/00-OVERVIEW.md`

**Focus on**:
- What SAM AI Tutor is (mission and purpose)
- High-level architecture diagram
- Key features: Bloom's Taxonomy, Personalization, Analytics, Gamification
- Technology stack: Anthropic Claude, Next.js 15, Prisma, PostgreSQL
- System scale: 35+ engines, 80+ API endpoints, 30+ React components

**Key Questions to Answer**:
1. What problem does SAM solve?
2. What are the 6 levels of Bloom's Taxonomy?
3. What is the primary AI provider used?
4. How many specialized engines exist?

**Summary Required**: In 3-5 sentences, explain what SAM AI Tutor is and its core capabilities.

---

### Step 2: Core Engine Architecture (20 minutes)
**Read**: `docs/architecture/sam-ai-tutor/02-CORE-ENGINES.md`

**Focus on**:
- SAMBaseEngine abstract class (foundation of all engines)
- 9 core responsibilities: initialization, caching, performance monitoring, error handling, etc.
- Specialized engine patterns (Bloom's, Personalization, Analytics)
- Design principles: SOLID, Clean Architecture

**Key Questions to Answer**:
1. What does SAMBaseEngine provide to all child engines?
2. How does the caching mechanism work?
3. What is the engine initialization lifecycle?
4. How are errors handled in engines?

**Practical Exercise**: Explain in your own words how a new engine would inherit from SAMBaseEngine and what functionality it gets for free.

---

### Step 3: File Organization (10 minutes)
**Read**: `docs/architecture/sam-ai-tutor/08-FILE-MAPPING.md`

**Focus on**:
- Core Engine Files location: `lib/sam-*-engine.ts`
- API Route Files location: `app/api/sam/*/route.ts`
- React Component Files location: `components/sam/` and `app/(protected)/teacher/_components/`
- Hook Files location: `hooks/use-sam*.ts`

**Key Questions to Answer**:
1. Where are the core engine files located?
2. How many API endpoints exist?
3. Where would you find the Bloom's Analysis Engine?
4. Where are the React components for SAM chat?

**Practical Exercise**: If you needed to modify the Personalization Engine, what file would you open? Provide the exact path.

---

### Step 4: System Workflows (20 minutes)
**Read**: `docs/architecture/sam-ai-tutor/07-WORKFLOWS.md`

**Focus on**:
- Request-response cycle (User → Component → API → Engine → AI → Response)
- Chat with SAM workflow (complete interaction flow)
- Bloom's Taxonomy Analysis workflow
- Personalized Learning Path Generation
- Multi-engine coordination

**Key Questions to Answer**:
1. What happens when a user sends a chat message?
2. How does Bloom's Analysis workflow process a course?
3. How do multiple engines coordinate in a single request?
4. What is the role of caching in workflows?

**Practical Exercise**: Trace the complete flow of "Student enrolls in course and receives personalized learning path" from start to finish.

---

### Step 5: NPM Package Preparation (15 minutes)
**Read**: `docs/architecture/sam-ai-tutor/09-NPM-PACKAGE-GUIDE.md`

**Focus on**:
- Package structure and organization
- Dependency injection strategy
- API design for consumers
- Build configuration (TypeScript, tsup)
- Release strategy

**Key Questions to Answer**:
1. What is the proposed package name?
2. How will dependencies be injected into engines?
3. What are the main export entry points?
4. What testing strategy is recommended?

**Practical Exercise**: Write a code snippet showing how a developer would use the published npm package to analyze a course with Bloom's Taxonomy.

---

## 🎯 Comprehensive Understanding Check

After completing all 5 steps, you should be able to:

### Architecture Questions
- [ ] Explain the engine-based architecture pattern
- [ ] Describe the role of SAMBaseEngine
- [ ] List at least 10 specialized engines and their purposes
- [ ] Explain how caching reduces AI API costs

### Implementation Questions
- [ ] Locate any SAM-related file in the codebase
- [ ] Trace a complete user interaction workflow
- [ ] Explain how engines coordinate for complex requests
- [ ] Describe the data flow from UI to database

### NPM Package Questions
- [ ] Explain the package structure
- [ ] Describe how to extract SAM from Taxomind
- [ ] List the steps to prepare for npm release
- [ ] Write example code using the published package

---

## 💡 Quick Reference Guide

### Most Important Files to Know

1. **SAMBaseEngine** (`lib/sam-base-engine.ts`): Foundation of all engines
2. **BloomsAnalysisEngine** (`lib/sam-blooms-engine.ts`): Cognitive level analysis
3. **PersonalizationEngine** (`lib/sam-personalization-engine.ts`): Learning customization
4. **Main Chat API** (`app/api/sam/ai-tutor/chat/route.ts`): Real-time tutoring
5. **SAM Provider** (`app/(protected)/teacher/_components/sam-ai-tutor-provider.tsx`): React context

### Key Concepts Hierarchy

```
SAM AI Tutor System
├── Core Layer
│   └── SAMBaseEngine (abstract foundation)
│       ├── Initialization
│       ├── Caching (TTL-based)
│       ├── Performance Monitoring
│       └── Error Handling
│
├── Engine Layer (35+ engines)
│   ├── Educational Engines
│   │   ├── Bloom's Taxonomy Analysis
│   │   ├── Personalization (learning style, emotion, motivation)
│   │   ├── Analytics (engagement, performance)
│   │   └── Predictive (outcomes, risk)
│   ├── Content Engines
│   │   ├── Generation (courses, chapters)
│   │   ├── Architect (structure design)
│   │   └── Exam (assessment creation)
│   └── Business Engines
│       ├── Financial (pricing, ROI)
│       ├── Market (trends, competition)
│       └── Enterprise (multi-tenant)
│
├── API Layer (80+ endpoints)
│   └── RESTful routes in app/api/sam/
│
├── UI Layer (30+ components)
│   ├── Providers (SAMProvider, GlobalSAMProvider)
│   ├── Assistants (Chat, Course, Intelligent)
│   └── Hooks (useSAM, useSAMChat, useSAMCache)
│
└── Data Layer
    ├── Prisma ORM (PostgreSQL)
    └── Redis Cache (optional)
```

### Common Workflows to Memorize

1. **Simple Chat**: User types → API → Context gathering → AI call → Response
2. **Bloom's Analysis**: Course ID → Fetch content → Anthropic analysis → Distribution calculation → Recommendations
3. **Personalization**: User behavior → Pattern detection → Style classification → Path generation → Content adaptation
4. **Multi-Engine**: Request → Orchestrator → Parallel engine calls → Result aggregation → Unified response

---

## 🔍 Advanced Topics (Optional)

After mastering the basics, explore:

1. **API Design Patterns**: How SAM uses dependency injection
2. **Caching Strategies**: Multi-layer caching with TTL expiration
3. **Error Handling**: Graceful degradation and fallback mechanisms
4. **Performance Optimization**: Parallelization and lazy loading
5. **Security Patterns**: Input validation, sanitization, rate limiting

---

## 📊 Self-Assessment Quiz

### Beginner Level
1. What does SAM stand for?
2. What is Bloom's Taxonomy used for?
3. How many cognitive levels are in Bloom's Taxonomy?
4. What is the primary AI provider?

### Intermediate Level
5. What does SAMBaseEngine provide to child engines?
6. How does the caching mechanism reduce costs?
7. What happens during engine initialization?
8. Name 5 specialized engines and their purposes.

### Advanced Level
9. Trace the complete flow of a Bloom's Analysis request from UI to response.
10. Explain how multiple engines coordinate in a personalization request.
11. How would you add a new custom engine to the system?
12. Describe the dependency injection strategy for the npm package.

**Scoring**:
- 12/12: Expert - Ready to contribute
- 9-11/12: Proficient - Good understanding
- 6-8/12: Intermediate - Review specific sections
- 0-5/12: Beginner - Re-read documentation

---

## 🚀 Next Steps After Understanding

Once you understand the architecture:

1. **Explore the Codebase**: Use file mapping to locate and read actual implementations
2. **Run Examples**: Test API endpoints and React components locally
3. **Modify Code**: Make small changes to understand behavior
4. **Contribute**: Add new features or improve existing engines
5. **Prepare Package**: Follow the npm package guide to extract SAM

---

## 💬 Getting Help

If you're stuck on any concept:

1. **Re-read relevant section**: Most answers are in the documentation
2. **Check cross-references**: Documents link to related topics
3. **Review diagrams**: ASCII diagrams visualize complex flows
4. **Read examples**: Code snippets demonstrate usage patterns
5. **Ask specific questions**: Reference document and section when asking

---

## ✅ Completion Checklist

- [ ] Read all 5 required documents in order
- [ ] Answered all key questions for each step
- [ ] Completed practical exercises
- [ ] Can explain SAM architecture in your own words
- [ ] Passed the self-assessment quiz (9+ correct)
- [ ] Can locate any SAM file in the codebase
- [ ] Understand at least 3 complete workflows
- [ ] Ready to work with SAM codebase or prepare npm package

**Estimated Total Time**: 80 minutes (1 hour 20 minutes)

**Difficulty Level**: Intermediate to Advanced

**Prerequisites**: Understanding of TypeScript, React, Next.js, and AI concepts

---

**Note**: This is a comprehensive learning path. Focus on understanding concepts over memorizing details. The goal is to build a mental model of how SAM works, not to memorize every file location or API endpoint.
