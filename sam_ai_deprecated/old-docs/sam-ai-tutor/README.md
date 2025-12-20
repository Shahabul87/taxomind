# SAM AI Tutor - Architecture Documentation

**Last Updated**: 2025-01-12
**Status**: ✅ Complete
**Purpose**: Comprehensive system architecture for npm package preparation

---

## 📚 Documentation Index

This folder contains complete architecture documentation for the SAM (Smart Adaptive Mentor) AI Tutor system. The documentation is designed to be:
- **Abstract-focused**: Emphasizes concepts over code details
- **Agent-friendly**: Easy for AI agents to understand and navigate
- **NPM-ready**: Prepared for npm package release

---

## 📖 Reading Order

For best understanding, read the documents in this order:

### 1. [00-OVERVIEW.md](./00-OVERVIEW.md) - Start Here! 🚀
**What it covers**:
- What is SAM AI Tutor?
- High-level architecture diagram
- Key features and capabilities
- Technology stack
- System scale and statistics
- Use cases for students, teachers, and administrators

**When to read**: First document - provides context for everything else

**Key takeaways**:
- SAM is a modular, engine-based AI educational assistant
- 35+ specialized engines for different aspects of learning
- Built on Anthropic Claude API, Next.js 15, and Prisma
- Designed for enterprise-grade performance and reliability

---

### 2. [02-CORE-ENGINES.md](./02-CORE-ENGINES.md) - Understanding the Foundation
**What it covers**:
- SAMBaseEngine abstract class (foundation for all engines)
- Core functionality (caching, performance monitoring, error handling)
- Specialized engine patterns (Bloom's, Personalization, Analytics, etc.)
- Engine design principles (SOLID, Clean Architecture)
- Performance characteristics and security features

**When to read**: After understanding the overview

**Key takeaways**:
- All engines inherit from SAMBaseEngine
- Common patterns: initialization, caching, safe DB operations
- Each engine specializes in one aspect (Single Responsibility)
- Engines are stateless and horizontally scalable

---

### 3. [08-FILE-MAPPING.md](./08-FILE-MAPPING.md) - Where Everything Lives
**What it covers**:
- Complete file and folder structure (150+ files)
- Organized by category (engines, API routes, components, hooks)
- File statistics and metrics
- Quick lookup commands
- Proposed npm package structure

**When to read**: When you need to find specific files or understand organization

**Key sections**:
- Core Engine Files (35+ engine files in `lib/`)
- API Route Files (80+ endpoints in `app/api/sam/`)
- React Component Files (30+ components)
- Hook Files, Type Definitions, Utilities
- Proposed npm package directory layout

---

### 4. [07-WORKFLOWS.md](./07-WORKFLOWS.md) - How It All Works
**What it covers**:
- Request-response cycles
- User interaction workflows (chat, analysis, learning paths)
- Engine operation workflows (analytics, prediction, achievements)
- Data flow diagrams
- Integration patterns

**When to read**: After understanding files and engines

**Key workflows**:
- Chat with SAM: User → API → Multiple Engines → AI Response
- Bloom's Analysis: Course → Engine → Anthropic → Distribution Analysis
- Personalized Path: Student Data → Analysis → Customized Learning Journey
- Content Generation: Topic → AI → Complete Course Structure

---

### 5. [09-NPM-PACKAGE-GUIDE.md](./09-NPM-PACKAGE-GUIDE.md) - Releasing SAM 📦
**What it covers**:
- Complete roadmap for npm package release
- Pre-release preparation steps
- Package structure and configuration
- API design for consumers
- Testing strategy and documentation
- Release process and maintenance plan

**When to read**: When ready to prepare the npm package

**Major sections**:
- Pre-Release Preparation (code extraction, dependency audit, licensing)
- Package Structure (recommended directory layout)
- Build Configuration (TypeScript, tsup, package.json)
- API Design (simple and advanced usage examples)
- Testing Strategy (unit, integration, component tests)
- Release Strategy (semantic versioning, checklist, metrics)

---

## 🎯 Quick Navigation

### Looking for...

| Need | Document | Section |
|------|----------|---------|
| **System overview** | 00-OVERVIEW.md | Entire document |
| **What SAM does** | 00-OVERVIEW.md | Key Features & Capabilities |
| **How engines work** | 02-CORE-ENGINES.md | Base Engine Architecture |
| **Bloom's Taxonomy** | 02-CORE-ENGINES.md | Bloom's Taxonomy Analysis Engine |
| **Personalization** | 02-CORE-ENGINES.md | Personalization Engine |
| **File locations** | 08-FILE-MAPPING.md | By Category sections |
| **API endpoints** | 08-FILE-MAPPING.md | API Route Files |
| **React components** | 08-FILE-MAPPING.md | React Component Files |
| **How chat works** | 07-WORKFLOWS.md | Chat with SAM Workflow |
| **Data flow** | 07-WORKFLOWS.md | Data Flow Diagrams |
| **NPM release steps** | 09-NPM-PACKAGE-GUIDE.md | Release Strategy |
| **Package structure** | 09-NPM-PACKAGE-GUIDE.md | Package Structure |
| **API examples** | 09-NPM-PACKAGE-GUIDE.md | API Design |

---

## 📊 Documentation Statistics

| Metric | Count |
|--------|-------|
| **Total Documents** | 5 comprehensive guides |
| **Total Pages** | ~100+ pages (estimated) |
| **Code Examples** | 50+ abstract examples |
| **Diagrams** | 20+ ASCII diagrams |
| **Tables** | 30+ reference tables |
| **Files Documented** | 150+ SAM-related files |

---

## 🔑 Key Concepts

### 1. Engine-Based Architecture
```
SAMBaseEngine (abstract)
    ├── BloomsAnalysisEngine
    ├── PersonalizationEngine
    ├── AnalyticsEngine
    ├── GenerationEngine
    └── ... 30+ more engines
```

### 2. Core Design Patterns
- **Inheritance**: All engines extend SAMBaseEngine
- **Singleton**: Engines use getInstance() pattern
- **Factory**: Engine instantiation and initialization
- **Observer**: Event-driven interaction tracking
- **Strategy**: Pluggable AI providers
- **Caching**: Multi-layer caching with TTL

### 3. Data Flow
```
User → React Component → API Route → SAM Engine → AI Provider → Response → UI
```

### 4. Engine Capabilities

| Engine Type | Primary Purpose | Example |
|-------------|-----------------|---------|
| **Educational** | Cognitive analysis, personalization | Bloom's Taxonomy, Learning Styles |
| **Content** | Generate and architect content | Course generation, Exam creation |
| **Resources** | Manage learning materials | Resource curation, Multimedia processing |
| **Social** | Collaborative learning | Study groups, Peer matching |
| **Business** | Intelligence and analytics | Financial analysis, Market trends |
| **News** | Information aggregation | AI news, Trend detection |

---

## 🚀 Getting Started (For Developers)

### For Understanding SAM
1. Read [00-OVERVIEW.md](./00-OVERVIEW.md)
2. Explore [02-CORE-ENGINES.md](./02-CORE-ENGINES.md)
3. Review [07-WORKFLOWS.md](./07-WORKFLOWS.md)

### For Finding Code
1. Check [08-FILE-MAPPING.md](./08-FILE-MAPPING.md)
2. Use quick lookup commands
3. Navigate to specific file categories

### For NPM Package Preparation
1. Read [09-NPM-PACKAGE-GUIDE.md](./09-NPM-PACKAGE-GUIDE.md)
2. Follow the pre-release checklist
3. Implement package structure recommendations

---

## 🎓 For AI Agents

This documentation is optimized for AI agent comprehension:

### Document Structure
- Clear section headers with emoji icons
- Consistent markdown formatting
- Abstract concepts with minimal code
- Hierarchical organization
- Cross-references between documents

### Navigation Pattern
```
1. Start with 00-OVERVIEW.md for context
2. Deep dive into 02-CORE-ENGINES.md for architecture
3. Reference 08-FILE-MAPPING.md for specific files
4. Understand flows via 07-WORKFLOWS.md
5. Prepare package with 09-NPM-PACKAGE-GUIDE.md
```

### Search Strategy
```bash
# Find specific topic
grep -r "Bloom's Taxonomy" docs/architecture/sam-ai-tutor/

# Find specific engine
grep -r "PersonalizationEngine" docs/architecture/sam-ai-tutor/

# Find API endpoint
grep -r "/api/sam/blooms-analysis" docs/architecture/sam-ai-tutor/
```

---

## 📦 NPM Package Vision

**Package Name**: `@taxomind/sam-ai-tutor`

**Installation** (Future):
```bash
npm install @taxomind/sam-ai-tutor
```

**Usage Example** (Future):
```typescript
import { BloomsAnalysisEngine } from '@taxomind/sam-ai-tutor/engines/blooms';

const engine = new BloomsAnalysisEngine(config);
const analysis = await engine.analyzeCourse('course-123');
console.log(analysis.courseLevel.distribution);
```

---

## 🛠️ Maintenance

### Document Updates
- **Weekly**: Add new features as they're developed
- **Monthly**: Review and refine documentation clarity
- **Quarterly**: Update statistics and metrics
- **Before Release**: Final review and completeness check

### Version Control
All documentation follows semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes in architecture
- **Minor** (1.0.0 → 1.1.0): New engines or major features
- **Patch** (1.0.0 → 1.0.1): Documentation improvements

---

## 📞 Support

### For Questions About Documentation
- Create GitHub issue with label `documentation`
- Reference specific document and section
- Suggest improvements via pull request

### For SAM System Questions
- Review relevant documentation sections
- Check workflow diagrams
- Consult API examples in npm guide

---

## ✅ Documentation Completeness

| Document | Status | Completeness | Last Updated |
|----------|--------|--------------|--------------|
| 00-OVERVIEW.md | ✅ Complete | 100% | 2025-01-12 |
| 02-CORE-ENGINES.md | ✅ Complete | 100% | 2025-01-12 |
| 07-WORKFLOWS.md | ✅ Complete | 100% | 2025-01-12 |
| 08-FILE-MAPPING.md | ✅ Complete | 100% | 2025-01-12 |
| 09-NPM-PACKAGE-GUIDE.md | ✅ Complete | 100% | 2025-01-12 |

**Overall Status**: ✅ Ready for npm package preparation

---

## 🎉 Success Criteria

This documentation is considered successful when:

- [x] All 35+ engines documented with abstractions
- [x] Complete file mapping with 150+ files
- [x] All major workflows explained with diagrams
- [x] NPM package preparation guide complete
- [x] Easy navigation for developers and AI agents
- [x] Abstract enough for understanding, detailed enough for implementation
- [x] Ready for external developers to use SAM independently

---

**Maintained by**: Taxomind Development Team
**Documentation Version**: 1.0.0
**Next Steps**: Begin npm package preparation following 09-NPM-PACKAGE-GUIDE.md

---

## 📚 Additional Resources

- [Taxomind Main Repository](https://github.com/Shahabul87/taxomind)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [Bloom's Taxonomy (Anderson & Krathwohl, 2001)](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
