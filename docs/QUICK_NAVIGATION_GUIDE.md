# Quick Navigation Guide 🗺️

> Fast access to documentation across the Taxomind project

---

## 🚀 Getting Started (First Time)

1. **Project Overview** → [`/README.md`](../README.md)
2. **Development Guidelines** → [`/CLAUDE.md`](../CLAUDE.md)
3. **Documentation Index** → [`/docs/DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md)
4. **Setup Guides** → [`/docs/setup/`](./setup/)

---

## 📖 Common Documentation Paths

### Development
```
Development Guidelines:  /CLAUDE.md
Project Setup:           /docs/setup/
Implementation Guides:   /docs/implementation/
Code Standards:          /docs/enterprise/
```

### SAM AI System
```
SAM Overview:            /docs/features/sam-ai-system/
SAM Integration:         /docs/features/sam-ai-system/integration/
SAM Implementation:      /docs/features/sam-ai-system/implementation/
SAM Tutor Code:          /sam-ai-tutor/
```

### Features & UI
```
Responsive Design:       /docs/features/responsive-design/
Header Components:       /docs/features/responsive-design/headers/
Icon System:            /docs/features/responsive-design/icons/
Design System:          /docs/design/
```

### Backend & API
```
API Documentation:       /docs/api/
Architecture:           /docs/architecture/
System Design:          /docs/system-architecture/
Database:               /docs/database/
Authentication:         /docs/auth/
```

### Deployment & Operations
```
Deployment Guides:       /docs/deployment/
Railway Deployment:      /docs/railway-deployment/
Troubleshooting:        /docs/troubleshooting/
Runbooks:               /docs/runbooks/
```

### Testing & QA
```
Testing Guides:          /docs/testing/
Testing Performance:     /docs/testing-performance/
```

### Project Progress
```
Phase 1:                 /docs/phases/phase-1/
Phase 1 Weeklies:       /docs/phases/phase-1/weekly-summaries/
Phase 2:                /docs/phases/
Quick Wins:             /docs/phases/quick-wins/
```

---

## 🎯 By Task

### "I need to..."

#### Deploy the Application
1. [`/docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md`](./deployment/RAILWAY_DEPLOYMENT_GUIDE.md)
2. [`/docs/deployment/NEXTJS_BUILD_OPTIMIZATION_GUIDE.md`](./deployment/NEXTJS_BUILD_OPTIMIZATION_GUIDE.md)
3. [`/docs/troubleshooting/`](./troubleshooting/)

#### Implement SAM AI Features
1. [`/docs/features/sam-ai-system/`](./features/sam-ai-system/)
2. [`/docs/features/sam-ai-system/implementation/`](./features/sam-ai-system/implementation/)
3. [`/sam-ai-tutor/`](../sam-ai-tutor/)

#### Work on UI Components
1. [`/docs/features/responsive-design/`](./features/responsive-design/)
2. [`/docs/design/`](./design/)
3. [`/app/(homepage)/components/`](../app/(homepage)/components/)

#### Build API Endpoints
1. [`/docs/api/`](./api/)
2. [`/docs/architecture/`](./architecture/)
3. [`/docs/auth/`](./auth/)

#### Fix Bugs
1. [`/docs/fixes/`](./fixes/)
2. [`/docs/troubleshooting/`](./troubleshooting/)
3. [`/CLAUDE.md`](../CLAUDE.md) (debugging protocols)

#### Run Tests
1. [`/docs/testing/`](./testing/)
2. [`/docs/testing-performance/`](./testing-performance/)

#### Understand Architecture
1. [`/docs/architecture/`](./architecture/)
2. [`/docs/system-architecture/`](./system-architecture/)
3. [`/docs/enterprise/`](./enterprise/)

---

## 🔍 Quick Search Tips

### Find by Category
```bash
# Phase documentation
ls docs/phases/

# SAM AI
ls docs/features/sam-ai-system/

# Features
ls docs/features/

# Deployment
ls docs/deployment/
```

### Search for Keywords
```bash
# Find all documentation about "authentication"
grep -r "authentication" docs/

# Find all Railway-related docs
find docs/ -name "*RAILWAY*"

# Find all Phase 1 documents
find docs/phases/phase-1/ -name "*.md"
```

---

## 📊 Documentation Statistics

- **Total Documentation Files**: 100+ markdown files
- **Main Categories**: 20+ organized folders
- **Root Files**: 2 (README.md, CLAUDE.md)
- **Recently Organized**: 37 files moved to proper locations
- **Comprehensive Index**: Available at `/docs/DOCUMENTATION_INDEX.md`

---

## 🆘 Need Help?

1. **Check the Index**: [`/docs/DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md)
2. **Project README**: [`/README.md`](../README.md)
3. **Development Guidelines**: [`/CLAUDE.md`](../CLAUDE.md)
4. **Search Documentation**: Use `grep -r "keyword" docs/`

---

## 📂 Complete Folder Map

```
/
├── README.md                    # Project overview
├── CLAUDE.md                    # Development guidelines
├── docs/
│   ├── DOCUMENTATION_INDEX.md  # Main documentation index
│   ├── QUICK_NAVIGATION_GUIDE.md # This file
│   ├── api/                    # API documentation
│   ├── architecture/           # Architecture docs
│   ├── auth/                   # Authentication
│   ├── course-management/      # Course features
│   ├── deployment/             # Deployment guides
│   ├── design/                 # Design system
│   ├── enterprise/             # Enterprise patterns
│   ├── features/               # Feature documentation
│   │   ├── responsive-design/  # Responsive UI
│   │   │   ├── headers/        # Header components
│   │   │   └── icons/          # Icon system
│   │   └── sam-ai-system/      # SAM docs + implementation
│   │       └── implementation/ # SAM implementation
│   ├── fixes/                  # Bugfixes
│   ├── implementation/         # Implementation guides
│   ├── misc/                   # Miscellaneous
│   ├── phases/                 # Project phases
│   │   ├── phase-1/           # Phase 1
│   │   │   └── weekly-summaries/ # Weekly progress
│   │   └── quick-wins/        # Quick wins
│   ├── setup/                 # Setup guides
│   ├── system-architecture/   # System design
│   ├── testing/               # Testing guides
│   └── troubleshooting/       # Troubleshooting
└── sam-ai-tutor/              # SAM AI source code
```

---

**Last Updated**: October 23, 2025
**Maintained by**: Taxomind Development Team

---

**Pro Tip**: Bookmark this page for quick access to all documentation! 🔖
