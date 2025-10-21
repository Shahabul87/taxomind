# 📦 SAM AI Tutor - NPM Package Creation Guide

**Package Name**: `@taxomind/sam-ai-tutor`
**Version**: 1.0.0
**Status**: Ready for Package Preparation
**Last Updated**: January 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pre-requisites](#pre-requisites)
3. [Package Structure](#package-structure)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Build Configuration](#build-configuration)
6. [Testing Strategy](#testing-strategy)
7. [Publishing Process](#publishing-process)
8. [Usage Documentation](#usage-documentation)
9. [Maintenance Guidelines](#maintenance-guidelines)

---

## 🎯 Overview

### What is SAM AI Tutor?

SAM (Smart Adaptive Mentor) is an intelligent learning management system with:
- **35+ AI Engines** for educational content generation and analysis
- **80+ API Endpoints** for comprehensive learning features
- **30+ React Components** for rich UI interactions
- **Bloom's Taxonomy Integration** for cognitive depth analysis
- **Personalization Engine** for adaptive learning experiences

### Package Goals

1. **Reusability**: Enable other projects to integrate SAM's AI capabilities
2. **Modularity**: Allow selective import of engines and components
3. **TypeScript Support**: Full type definitions for developer experience
4. **Tree-shaking**: Optimized bundle size with unused code elimination
5. **Zero Config**: Works out of the box with sensible defaults

---

## ✅ Pre-requisites

### Required Tools

```bash
# Node.js and npm
node --version  # v18.0.0 or higher
npm --version   # v9.0.0 or higher

# TypeScript compiler
npm install -g typescript

# Package bundler (choose one)
npm install -g tsup  # Recommended for libraries
# OR
npm install -g rollup
```

### Required Accounts

1. **npm Account**: Create at [npmjs.com](https://www.npmjs.com/signup)
2. **GitHub Account**: For repository hosting
3. **npm Organization** (optional): For scoped packages like `@taxomind/sam-ai-tutor`

### Environment Setup

```bash
# Login to npm
npm login

# Verify login
npm whoami

# Create organization (if using scoped package)
npm org create taxomind
```

---

## 📁 Package Structure

### Recommended Directory Structure

```
sam-ai-tutor/                    # Root package directory
├── package.json                 # Package configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.build.json         # Build-specific TS config
├── README.md                   # Package documentation
├── LICENSE                     # MIT or your chosen license
├── .npmignore                  # Files to exclude from npm
├── .gitignore                  # Files to exclude from git
│
├── src/                        # Source code (gets compiled)
│   ├── index.ts               # Main entry point
│   ├── engines/               # AI Engines
│   │   ├── index.ts          # Engine exports
│   │   ├── core/
│   │   ├── educational/
│   │   ├── content/
│   │   ├── business/
│   │   ├── social/
│   │   └── advanced/
│   ├── components/            # React components
│   │   ├── index.ts          # Component exports
│   │   ├── global/
│   │   ├── contextual/
│   │   ├── integration/
│   │   └── ui/
│   ├── hooks/                 # React hooks
│   │   └── index.ts
│   ├── utils/                 # Utilities
│   │   └── index.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   └── config/                # Configuration
│       └── index.ts
│
├── dist/                       # Compiled output (gitignored)
│   ├── index.js               # CommonJS bundle
│   ├── index.mjs              # ES Module bundle
│   ├── index.d.ts             # Type definitions
│   └── ...
│
├── examples/                   # Usage examples
│   ├── basic-usage/
│   ├── nextjs-integration/
│   └── react-integration/
│
├── docs/                       # Documentation
│   ├── API.md
│   ├── ENGINES.md
│   ├── COMPONENTS.md
│   └── MIGRATION.md
│
└── tests/                      # Test files
    ├── engines/
    ├── components/
    └── utils/
```

---

## 🔧 Step-by-Step Setup

### Step 1: Create Package Configuration

Create `sam-ai-tutor/package.json`:

```json
{
  "name": "@taxomind/sam-ai-tutor",
  "version": "1.0.0",
  "description": "AI-powered intelligent learning management system with 35+ engines for adaptive education",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./engines": {
      "import": "./dist/engines/index.mjs",
      "require": "./dist/engines/index.js",
      "types": "./dist/engines/index.d.ts"
    },
    "./components": {
      "import": "./dist/components/index.mjs",
      "require": "./dist/components/index.js",
      "types": "./dist/components/index.d.ts"
    },
    "./hooks": {
      "import": "./dist/hooks/index.mjs",
      "require": "./dist/hooks/index.js",
      "types": "./dist/hooks/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.mjs",
      "require": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "prepublishOnly": "npm run typecheck && npm run build && npm test",
    "publish:dry": "npm publish --dry-run",
    "publish:beta": "npm publish --tag beta",
    "publish:stable": "npm publish"
  },
  "keywords": [
    "ai",
    "education",
    "learning",
    "lms",
    "adaptive-learning",
    "personalization",
    "blooms-taxonomy",
    "course-generation",
    "assessment",
    "analytics",
    "nextjs",
    "react",
    "typescript"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/sam-ai-tutor.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/sam-ai-tutor/issues"
  },
  "homepage": "https://github.com/yourusername/sam-ai-tutor#readme",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "next": "^14.0.0 || ^15.0.0"
  },
  "peerDependenciesMeta": {
    "next": {
      "optional": true
    }
  },
  "dependencies": {
    "@ai-sdk/anthropic": "^1.0.5",
    "@ai-sdk/openai": "^1.0.8",
    "ai": "^4.0.28",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "@types/node": "^22.10.5",
    "typescript": "^5.7.3",
    "tsup": "^8.0.1",
    "eslint": "^9.18.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Step 2: Create TypeScript Configuration

Create `sam-ai-tutor/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": false,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.test.tsx"]
}
```

Create `sam-ai-tutor/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false
  },
  "exclude": ["node_modules", "dist", "tests", "examples", "**/*.test.ts", "**/*.test.tsx"]
}
```

### Step 3: Create Build Configuration

Create `sam-ai-tutor/tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    engines: 'src/engines/index.ts',
    components: 'src/components/index.ts',
    hooks: 'src/hooks/index.ts',
    utils: 'src/utils/index.ts',
    types: 'src/types/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false, // Set to true for production
  treeshake: true,
  external: [
    'react',
    'react-dom',
    'next',
    '@prisma/client',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";', // For Next.js App Router compatibility
    };
  },
});
```

### Step 4: Create Entry Points

Create `sam-ai-tutor/src/index.ts`:

```typescript
// Main entry point - exports everything
export * from './engines';
export * from './components';
export * from './hooks';
export * from './utils';
export * from './types';
export * from './config';

// Named exports for convenience
export { default as SAMEngines } from './engines';
export { default as SAMComponents } from './components';
export { default as SAMHooks } from './hooks';
export { default as SAMUtils } from './utils';
```

Create `sam-ai-tutor/src/engines/index.ts`:

```typescript
// Export all engines with proper categorization
export * from './core/sam-base-engine';
export * from './core/sam-engine-integration';

// Educational engines
export * from './educational/sam-blooms-engine';
export * from './educational/sam-personalization-engine';
export * from './educational/sam-exam-engine';
export * from './educational/sam-course-guide-engine';

// Content engines
export * from './content/sam-generation-engine';
export * from './content/sam-multimedia-engine';
export * from './content/sam-resource-engine';
export * from './content/sam-news-engine';

// Business engines
export * from './business/sam-market-engine';

// Social engines
export * from './social/sam-collaboration-engine';

// Advanced engines
export * from './advanced/sam-analytics-engine';
export * from './advanced/sam-memory-engine';
export * from './advanced/sam-trends-engine';
export * from './advanced/sam-research-engine';

// Default export with all engines organized
const SAMEngines = {
  core: {
    BaseEngine: () => import('./core/sam-base-engine'),
    Integration: () => import('./core/sam-engine-integration'),
  },
  educational: {
    Blooms: () => import('./educational/sam-blooms-engine'),
    Personalization: () => import('./educational/sam-personalization-engine'),
    Exam: () => import('./educational/sam-exam-engine'),
    CourseGuide: () => import('./educational/sam-course-guide-engine'),
  },
  content: {
    Generation: () => import('./content/sam-generation-engine'),
    Multimedia: () => import('./content/sam-multimedia-engine'),
    Resource: () => import('./content/sam-resource-engine'),
    News: () => import('./content/sam-news-engine'),
  },
  business: {
    Market: () => import('./business/sam-market-engine'),
  },
  social: {
    Collaboration: () => import('./social/sam-collaboration-engine'),
  },
  advanced: {
    Analytics: () => import('./advanced/sam-analytics-engine'),
    Memory: () => import('./advanced/sam-memory-engine'),
    Trends: () => import('./advanced/sam-trends-engine'),
    Research: () => import('./advanced/sam-research-engine'),
  },
};

export default SAMEngines;
```

Create `sam-ai-tutor/src/components/index.ts`:

```typescript
// Export all components
export * from './global/sam-global-provider';
export * from './global/sam-global-assistant';

export * from './contextual/sam-context-manager';
export * from './contextual/sam-contextual-chat';

export * from './integration/sam-enhanced-editor';
export * from './integration/sam-standards-info';
export * from './integration/sam-tiptap-integration';

export * from './ui/sam-loading-state';
export * from './ui/sam-error-boundary';

// Default export
const SAMComponents = {
  Global: {
    Provider: () => import('./global/sam-global-provider'),
    Assistant: () => import('./global/sam-global-assistant'),
  },
  Contextual: {
    Manager: () => import('./contextual/sam-context-manager'),
    Chat: () => import('./contextual/sam-contextual-chat'),
  },
  Integration: {
    Editor: () => import('./integration/sam-enhanced-editor'),
    Standards: () => import('./integration/sam-standards-info'),
    Tiptap: () => import('./integration/sam-tiptap-integration'),
  },
  UI: {
    Loading: () => import('./ui/sam-loading-state'),
    ErrorBoundary: () => import('./ui/sam-error-boundary'),
  },
};

export default SAMComponents;
```

### Step 5: Create .npmignore

Create `sam-ai-tutor/.npmignore`:

```
# Source files (we ship compiled dist)
src/

# Tests
tests/
__tests__/
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx

# Examples
examples/

# Documentation (except README)
docs/
*.md
!README.md
!LICENSE

# Build configs
tsconfig.json
tsconfig.build.json
tsup.config.ts
jest.config.js
.eslintrc.js

# IDE
.vscode/
.idea/

# Misc
.DS_Store
.env
.env.*
node_modules/
*.log
coverage/
.git/
.github/
```

### Step 6: Create README.md

Create `sam-ai-tutor/README.md`:

```markdown
# 🎓 SAM AI Tutor

> Smart Adaptive Mentor - AI-powered intelligent learning management system

[![npm version](https://img.shields.io/npm/v/@taxomind/sam-ai-tutor.svg)](https://www.npmjs.com/package/@taxomind/sam-ai-tutor)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🧠 **35+ AI Engines** for comprehensive educational capabilities
- 📚 **Bloom's Taxonomy Integration** for cognitive depth analysis
- 🎯 **Personalization Engine** for adaptive learning experiences
- 📊 **Real-time Analytics** for learning insights
- 🔄 **Multi-modal Content** generation and analysis
- ⚡ **Tree-shakeable** - only bundle what you use
- 🎨 **React Components** with Next.js optimization
- 📘 **Full TypeScript** support with type definitions

## Installation

```bash
npm install @taxomind/sam-ai-tutor
# or
yarn add @taxomind/sam-ai-tutor
# or
pnpm add @taxomind/sam-ai-tutor
```

## Quick Start

```typescript
import { SAMEngines, SAMComponents } from '@taxomind/sam-ai-tutor';

// Use individual engines
import { samBloomsEngine } from '@taxomind/sam-ai-tutor/engines';

// Analyze content depth
const analysis = await samBloomsEngine.analyzeContent(
  'Explain the concept of recursion in programming'
);

console.log(analysis);
// { bloomsLevel: 'Understand', depth: 85, suggestions: [...] }
```

## Documentation

- [API Reference](./docs/API.md)
- [Engines Guide](./docs/ENGINES.md)
- [Components Guide](./docs/COMPONENTS.md)
- [Migration Guide](./docs/MIGRATION.md)

## License

MIT © Taxomind
```

### Step 7: Create LICENSE

Create `sam-ai-tutor/LICENSE`:

```
MIT License

Copyright (c) 2025 Taxomind

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🏗️ Build Configuration

### Build Commands

```bash
# Development build with watch mode
npm run build:watch

# Production build
npm run build

# Type check only
npm run typecheck

# Test before publishing
npm test

# Dry run publish (see what would be published)
npm run publish:dry
```

### Build Output Structure

```
dist/
├── index.js              # CommonJS bundle
├── index.mjs             # ES Module bundle
├── index.d.ts            # TypeScript definitions
├── engines/
│   ├── index.js
│   ├── index.mjs
│   └── index.d.ts
├── components/
│   ├── index.js
│   ├── index.mjs
│   └── index.d.ts
└── ...
```

---

## 🧪 Testing Strategy

### Test Setup

Create `sam-ai-tutor/jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Example Test

Create `sam-ai-tutor/tests/engines/blooms-engine.test.ts`:

```typescript
import { samBloomsEngine } from '../../src/engines/educational/sam-blooms-engine';

describe('SAM Blooms Engine', () => {
  it('should analyze content cognitive level', async () => {
    const result = await samBloomsEngine.analyzeContent(
      'Define what a function is in programming'
    );

    expect(result).toHaveProperty('bloomsLevel');
    expect(result.bloomsLevel).toBe('Remember');
  });

  it('should provide improvement suggestions', async () => {
    const result = await samBloomsEngine.analyzeContent('Explain recursion');

    expect(result).toHaveProperty('suggestions');
    expect(Array.isArray(result.suggestions)).toBe(true);
  });
});
```

---

## 📤 Publishing Process

### Pre-publish Checklist

```bash
# 1. Ensure all tests pass
npm test

# 2. Type check
npm run typecheck

# 3. Build the package
npm run build

# 4. Verify package contents
npm run publish:dry

# 5. Check package size
npm pack --dry-run
```

### Version Management

```bash
# Patch version (bug fixes): 1.0.0 → 1.0.1
npm version patch

# Minor version (new features): 1.0.0 → 1.1.0
npm version minor

# Major version (breaking changes): 1.0.0 → 2.0.0
npm version major
```

### Publishing Commands

```bash
# 1. Beta release (for testing)
npm run publish:beta
# Users install with: npm install @taxomind/sam-ai-tutor@beta

# 2. Stable release
npm run publish:stable

# 3. Publish with specific tag
npm publish --tag next
```

### Post-publish

```bash
# View package info
npm info @taxomind/sam-ai-tutor

# Test installation in a separate project
mkdir test-sam && cd test-sam
npm init -y
npm install @taxomind/sam-ai-tutor
```

---

## 📚 Usage Documentation

### Example: Using Engines

```typescript
// Import specific engine
import { samBloomsEngine } from '@taxomind/sam-ai-tutor/engines';

// Analyze learning objectives
const objectives = [
  'Understand the concept of variables',
  'Create a simple program',
  'Evaluate algorithm efficiency',
];

for (const objective of objectives) {
  const analysis = await samBloomsEngine.analyzeObjective(objective);
  console.log(`${objective} → ${analysis.bloomsLevel}`);
}
```

### Example: Using Components

```tsx
import { SAMGlobalProvider, SAMGlobalAssistant } from '@taxomind/sam-ai-tutor/components';

function App() {
  return (
    <SAMGlobalProvider>
      <YourApp />
      <SAMGlobalAssistant />
    </SAMGlobalProvider>
  );
}
```

### Example: Using Hooks

```tsx
import { useContextAwareSAM } from '@taxomind/sam-ai-tutor/hooks';

function MyComponent() {
  const {
    currentContext,
    getContextualGreeting
  } = useContextAwareSAM();

  return <div>{getContextualGreeting()}</div>;
}
```

---

## 🔧 Maintenance Guidelines

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update to latest patch versions
npm update

# Update to latest versions (careful with breaking changes)
npm install package@latest
```

### Breaking Changes Protocol

1. **Document** all breaking changes in CHANGELOG.md
2. **Major version bump** required (1.x.x → 2.0.0)
3. **Migration guide** in docs/MIGRATION.md
4. **Deprecation warnings** in previous version (if possible)

### Security Updates

```bash
# Audit for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Fix including breaking changes
npm audit fix --force
```

---

## 🎯 Best Practices

### 1. Semantic Versioning

- **Patch** (1.0.x): Bug fixes, no API changes
- **Minor** (1.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

### 2. Documentation

- Keep README.md updated with latest features
- Document all public APIs
- Provide migration guides for breaking changes
- Include usage examples

### 3. Testing

- Write tests for all public APIs
- Maintain >70% code coverage
- Test with different React/Next.js versions

### 4. Bundle Size

```bash
# Analyze bundle size
npm install -g bundlephobia
bundlephobia @taxomind/sam-ai-tutor

# Monitor bundle size in CI
npm install --save-dev size-limit
```

### 5. TypeScript

- Export all types from main entry point
- Use JSDoc comments for better IntelliSense
- Provide type guards where needed

---

## 🚀 Advanced Topics

### Monorepo Setup (Optional)

If you want to split engines, components, and utils into separate packages:

```
packages/
├── engines/
│   └── package.json  (@taxomind/sam-engines)
├── components/
│   └── package.json  (@taxomind/sam-components)
└── utils/
    └── package.json  (@taxomind/sam-utils)
```

### CI/CD Integration

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 📞 Support & Resources

- **Issues**: [GitHub Issues](https://github.com/yourusername/sam-ai-tutor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sam-ai-tutor/discussions)
- **npm Package**: [@taxomind/sam-ai-tutor](https://www.npmjs.com/package/@taxomind/sam-ai-tutor)
- **Documentation**: [Full Docs](https://github.com/yourusername/sam-ai-tutor/tree/main/docs)

---

## 🎉 Quick Reference Commands

```bash
# Initial setup
npm login
npm org create taxomind

# Development
npm run build:watch
npm run typecheck
npm test

# Publishing
npm version patch|minor|major
npm run publish:dry
npm run publish:beta
npm run publish:stable

# Maintenance
npm outdated
npm audit
npm update
```

---

**Ready to publish?** Follow the steps above and your SAM AI Tutor package will be available on npm! 🚀

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready
