# Hybrid SAM System - Implementation Guides

## Overview

This directory contains comprehensive implementation documentation for the **Hybrid SAM (Smart Adaptive Mentor)** system designed for course creation with 100% form awareness and intelligent AI assistance.

**Created**: January 2025
**Status**: ✅ All Documentation Complete
**Components**: 4 core components + 3 API routes

## Quick Navigation

### Core Implementation Guides

| Guide | File | Status | Description |
|-------|------|--------|-------------|
| **1. Course Creation Context** | [03-course-creation-context.md](./03-course-creation-context.md) | ✅ Complete | State management foundation |
| **2. SAM-Aware Input** | [04-sam-aware-input.md](./04-sam-aware-input.md) | ✅ Complete | Form-aware inputs with Bloom's detection |
| **3. SAM Contextual Panel** | [05-sam-contextual-panel.md](./05-sam-contextual-panel.md) | ✅ Complete | Sidebar with field analysis & actions |
| **4. Floating SAM** | [06-floating-sam.md](./06-floating-sam.md) | ✅ Complete | Chat widget for general questions |
| **5. Complete Integration** | [07-hybrid-sam-integration.md](./07-hybrid-sam-integration.md) | ✅ Complete | Step-by-step integration guide |
| **6. API Routes** | [08-api-routes-implementation.md](./08-api-routes-implementation.md) | 📋 To Implement | Backend API endpoints |

### Supporting Documentation

| Document | File | Description |
|----------|------|-------------|
| **System Architecture** | [../architecture/01-system-architecture-v2.md](../architecture/01-system-architecture-v2.md) | Target architecture overview |
| **Getting Started** | [01-getting-started.md](./01-getting-started.md) | Developer onboarding |
| **Code Standards** | [02-code-standards.md](./02-code-standards.md) | Enterprise coding standards |
| **Testing Strategies** | [../testing-strategies/01-integration-testing.md](../testing-strategies/01-integration-testing.md) | Integration testing guide |
| **Success Metrics** | [../metrics-kpis/01-success-metrics.md](../metrics-kpis/01-success-metrics.md) | KPIs and metrics |

## System Architecture at a Glance

```
┌────────────────────────────────────────────────────────┐
│                 HYBRID SAM SYSTEM                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Pillar 1   │  │  Pillar 2   │  │  Pillar 3   │   │
│  │             │  │             │  │             │   │
│  │ Form-Aware  │  │ Contextual  │  │  Floating   │   │
│  │   Inputs    │  │    Panel    │  │  SAM Chat   │   │
│  │             │  │             │  │             │   │
│  │ Real-time   │  │ Field       │  │  General    │   │
│  │ Bloom's     │  │ analysis &  │  │  Q&A        │   │
│  │ detection   │  │ actions     │  │  Context-   │   │
│  │             │  │             │  │  aware      │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│         │                │                │          │
│         └────────────────┴────────────────┘          │
│                         │                            │
│              ┌──────────▼──────────┐                 │
│              │ CourseCreation      │                 │
│              │ Context             │                 │
│              │ (State Management)  │                 │
│              └─────────────────────┘                 │
└────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Read Core Concepts (30 minutes)
Start with these three documents in order:

1. **Course Creation Context** (10 min)
   - Understanding state management
   - Context provider pattern
   - Utility functions

2. **SAM-Aware Input** (10 min)
   - Form-aware inputs
   - Bloom's detection
   - Real-time indicators

3. **Complete Integration Guide** (10 min)
   - Step-by-step setup
   - Full working example
   - User experience flow

### 2. Implement (2-3 hours)
Follow the integration guide to implement:

1. Wrap page in `CourseCreationProvider`
2. Replace standard inputs with `SAMAwareInput`
3. Add `SAMContextualPanel` to layout
4. Add `FloatingSAM` widget
5. Implement 3 API routes

### 3. Test & Deploy (1-2 hours)
- Test form awareness (focus/blur)
- Test Bloom's detection
- Test quick actions
- Test chat functionality
- Deploy API routes

## Component Overview

### 1. CourseCreationContext
**File**: `/sam-ai-tutor/lib/context/course-creation-context.tsx`

**Purpose**: Centralized state management for form awareness

**Key Features**:
- Tracks current field being edited
- Manages course data state
- Auto-triggers Bloom's analysis (2s debounce)
- Provides utility functions

**Usage**:
```typescript
<CourseCreationProvider initialCourseData={{}}>
  <YourComponent />
</CourseCreationProvider>
```

**Documentation**: [03-course-creation-context.md](./03-course-creation-context.md)

### 2. SAMAwareInput
**File**: `/sam-ai-tutor/components/course-creation/sam-aware-input.tsx`

**Purpose**: Form inputs with real-time Bloom's detection

**Key Features**:
- 100% form awareness
- Real-time Bloom's level detection
- Visual indicator badge
- Auto-updates context on focus/change

**Usage**:
```typescript
<SAMAwareInput
  fieldName="course-title"
  fieldType="title"
  value={title}
  onChange={setTitle}
  placeholder="Enter course title..."
/>
```

**Documentation**: [04-sam-aware-input.md](./04-sam-aware-input.md)

### 3. SAMContextualPanel
**File**: `/sam-ai-tutor/components/course-creation/sam-contextual-panel.tsx`

**Purpose**: Sidebar showing field analysis and quick actions

**Key Features**:
- Real-time field analysis
- Bloom's distribution chart
- Quick action buttons
- Course-level overview

**Usage**:
```typescript
<div className="flex gap-6">
  <div className="flex-1">{/* Form */}</div>
  <SAMContextualPanel />
</div>
```

**Documentation**: [05-sam-contextual-panel.md](./05-sam-contextual-panel.md)

### 4. FloatingSAM
**File**: `/sam-ai-tutor/components/course-creation/floating-sam.tsx`

**Purpose**: Always-available chat for general questions

**Key Features**:
- Context-aware conversations
- Conversation history
- Quick suggestions
- Minimize/maximize

**Usage**:
```typescript
<CourseCreationProvider>
  {/* Your content */}
  <FloatingSAM />
</CourseCreationProvider>
```

**Documentation**: [06-floating-sam.md](./06-floating-sam.md)

## API Routes Overview

### 1. POST /api/sam/analyze-course-draft
**Purpose**: Analyze entire course for Bloom's distribution

**Request**:
```json
{
  "courseData": {
    "title": "Introduction to Web Development",
    "description": "Learn to build web apps...",
    "learningObjectives": ["Understand HTML", "Build websites"]
  }
}
```

**Response**:
```json
{
  "courseLevel": {
    "distribution": { "UNDERSTAND": 50, "APPLY": 30, "CREATE": 20 },
    "cognitiveDepth": 55,
    "balance": "well-balanced"
  }
}
```

### 2. POST /api/sam/contextual-help
**Purpose**: Field-specific AI suggestions

**Request**:
```json
{
  "prompt": "Suggest 3 engaging titles",
  "fieldContext": {
    "fieldName": "course-title",
    "fieldValue": "Web Development",
    "fieldType": "title"
  }
}
```

**Response**:
```json
{
  "response": "Here are 3 course titles at APPLY level:\n1. Build Modern Web Apps\n2. Master Full-Stack Development\n3. Create Professional Websites"
}
```

### 3. POST /api/sam/chat
**Purpose**: General Q&A conversations

**Request**:
```json
{
  "message": "How can I improve my course description?",
  "context": {
    "courseData": { "title": "..." },
    "bloomsAnalysis": { "balance": "bottom-heavy" }
  }
}
```

**Response**:
```json
{
  "response": "Your course is bottom-heavy (67% UNDERSTAND). Here are 3 ways to improve..."
}
```

**Full Documentation**: [08-api-routes-implementation.md](./08-api-routes-implementation.md)

## Implementation Roadmap

### Phase 1: Frontend Components (1-2 hours)
- [ ] Copy 4 component files to your project
- [ ] Install dependencies (`lucide-react`, etc.)
- [ ] Configure Tailwind CSS
- [ ] Add Prisma BloomsLevel enum

### Phase 2: Integration (1 hour)
- [ ] Wrap page in `CourseCreationProvider`
- [ ] Replace inputs with `SAMAwareInput`
- [ ] Add `SAMContextualPanel`
- [ ] Add `FloatingSAM`

### Phase 3: API Routes (2-3 hours)
- [ ] Create `/api/sam/analyze-course-draft`
- [ ] Create `/api/sam/contextual-help`
- [ ] Create `/api/sam/chat`
- [ ] Set `OPENAI_API_KEY` environment variable
- [ ] Test all endpoints

### Phase 4: Testing (1-2 hours)
- [ ] Test form awareness
- [ ] Test Bloom's detection
- [ ] Test quick actions
- [ ] Test chat functionality
- [ ] Fix any issues

### Phase 5: Optimization (1-2 hours)
- [ ] Add caching (optional)
- [ ] Add rate limiting
- [ ] Monitor API usage
- [ ] Optimize performance

**Total Time**: 6-10 hours for complete implementation

## File Structure

```
sam-ai-tutor/
├── lib/
│   └── context/
│       └── course-creation-context.tsx    (State management)
├── components/
│   └── course-creation/
│       ├── sam-aware-input.tsx            (Form inputs)
│       ├── sam-contextual-panel.tsx       (Sidebar panel)
│       └── floating-sam.tsx               (Chat widget)
├── improvement-plan/
│   └── implementation-guides/
│       ├── 03-course-creation-context.md  (Context docs)
│       ├── 04-sam-aware-input.md          (Input docs)
│       ├── 05-sam-contextual-panel.md     (Panel docs)
│       ├── 06-floating-sam.md             (Chat docs)
│       ├── 07-hybrid-sam-integration.md   (Integration guide)
│       ├── 08-api-routes-implementation.md (API docs)
│       └── README.md                      (This file)
└── app/
    └── api/
        └── sam/
            ├── analyze-course-draft/route.ts  (Bloom's analysis)
            ├── contextual-help/route.ts       (Quick actions)
            └── chat/route.ts                  (Q&A chat)
```

## Dependencies

### Required
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next": "^14.0.0",
    "@prisma/client": "^5.0.0",
    "lucide-react": "latest",
    "openai": "^4.0.0"
  }
}
```

### Optional (for enhancements)
```json
{
  "dependencies": {
    "@upstash/redis": "^1.0.0",      // Caching
    "@upstash/ratelimit": "^1.0.0",  // Rate limiting
    "sonner": "^1.0.0"               // Toast notifications
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Context Provider Error
**Error**: `useCourseCreation must be used within CourseCreationProvider`

**Solution**:
```typescript
<CourseCreationProvider>
  <YourComponent />
</CourseCreationProvider>
```

#### 2. Bloom's Indicator Not Showing
**Check**:
- Text length > 10 characters
- Contains action verbs (create, analyze, etc.)
- `showBloomsIndicator={true}` (default)

#### 3. API Routes Not Working
**Check**:
- Routes exist: `app/api/sam/*/route.ts`
- `OPENAI_API_KEY` environment variable set
- Server restarted after adding env variable
- Network tab for detailed error messages

#### 4. TypeScript Errors
**Check**:
- Prisma client generated: `npx prisma generate`
- BloomsLevel enum exists in schema
- All imports correct

## Best Practices

### ✅ DO:
- Wrap entire course creation flow in `CourseCreationProvider`
- Use `SAMAwareInput` for all course content fields
- Handle loading states (`isAnalyzing`, `isTyping`)
- Validate API responses
- Implement error handling

### ❌ DON'T:
- Don't use context outside provider
- Don't skip error handling
- Don't ignore loading states
- Don't hardcode field-specific logic
- Don't skip Tailwind configuration

## Performance Tips

1. **Lazy Load FloatingSAM**: Use dynamic import to reduce initial bundle
2. **Memoize Components**: Use `React.memo()` for expensive components
3. **Debounce API Calls**: Already implemented (2s for analysis)
4. **Cache API Responses**: Use Redis for repeated requests
5. **Optimize Re-renders**: Only subscribe to needed context values

## Future Enhancements

### Short-term (1-2 months)
- [ ] Voice input for FloatingSAM
- [ ] Rich text formatting in chat
- [ ] Export conversation history
- [ ] Custom quick actions per field type

### Medium-term (3-6 months)
- [ ] Multi-language support
- [ ] Collaborative editing awareness
- [ ] Auto-save drafts to database
- [ ] Version history for courses

### Long-term (6-12 months)
- [ ] Custom Bloom's detection model
- [ ] Advanced analytics dashboard
- [ ] Integration with LMS platforms
- [ ] Mobile app support

## Getting Help

### Documentation
- Start with [Complete Integration Guide](./07-hybrid-sam-integration.md)
- Check individual component docs for details
- Review [API Routes Implementation](./08-api-routes-implementation.md)

### Support
- **Questions**: Create GitHub issue
- **Bugs**: Report with reproducible example
- **Feature Requests**: Submit with use case

### Contributing
- Follow code standards in [02-code-standards.md](./02-code-standards.md)
- Write tests for new features
- Update documentation
- Submit PR with clear description

## License

This implementation is part of the SAM AI Tutor system and follows the project's license.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: ✅ Documentation Complete
**Maintainer**: SAM AI Tutor Team

**Ready to implement?** Start with the [Complete Integration Guide](./07-hybrid-sam-integration.md)!
