# Course Depth Analyzer Redesign Plan

## Executive Summary

Redesign the Course Depth Analyzer to provide comprehensive, AI-powered analysis that gives course creators **specific, actionable guidance** on what to fix, where, and how.

---

## Part 1: Current System Analysis

### What Currently Exists

| Feature | Status | Notes |
|---------|--------|-------|
| Bloom's Taxonomy Analysis | ✅ Exists | Distribution percentages across 6 levels |
| Webb's DOK Analysis | ✅ Exists | 4 levels of cognitive depth |
| Cognitive Depth Score | ✅ Exists | 0-100 score |
| QM/OLC Compliance | ✅ Exists | Standards checklist |
| Save Analysis Results | ✅ Exists | `CourseBloomsAnalysis` table |
| Recommendations | ⚠️ Partial | Generic suggestions, not specific |
| Re-analyze Capability | ✅ Exists | Content hash detects changes |

### Current Flow
```
1. User selects course → 2. System runs analysis → 3. Shows metrics/charts → 4. Generic recommendations
```

### What's Missing (Your Requirements)

| Requirement | Status | Description |
|-------------|--------|-------------|
| **Chapter Consistency** | ❌ Missing | Does chapter structure align with course goals? |
| **Section Consistency** | ❌ Missing | Are sections within chapters consistent in depth/style? |
| **Knowledge Flow Analysis** | ❌ Missing | Does learning build progressively toward skills? |
| **Duplicate Content Detection** | ❌ Missing | Find repeated content across sections |
| **Specific Location Guidance** | ❌ Missing | "Fix THIS in Chapter 3, Section 2" |
| **How-To-Fix Instructions** | ❌ Missing | Step-by-step correction guidance |
| **What to Remove/Keep** | ❌ Missing | Actionable cleanup suggestions |
| **Step-by-Step AI Process** | ❌ Missing | Progressive analysis with checkpoints |
| **Correction Verification** | ⚠️ Partial | Can re-analyze but no diff comparison |

---

## Part 2: Redesigned Analysis System

### New Analysis Pipeline (8 Steps)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI-POWERED COURSE DEPTH ANALYSIS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: Course Structure Analysis                                          │
│  ├─ Extract all content (titles, descriptions, objectives, content)         │
│  ├─ Build hierarchical course map                                           │
│  └─ Identify empty/incomplete areas                                         │
│                           ↓                                                  │
│  STEP 2: Bloom's Taxonomy Classification                                    │
│  ├─ Classify each section by cognitive level                                │
│  ├─ Generate chapter-level Bloom's distribution                             │
│  └─ Calculate course-wide distribution                                      │
│                           ↓                                                  │
│  STEP 3: Learning Flow Analysis                                             │
│  ├─ Analyze progression from Remember → Create                              │
│  ├─ Detect cognitive "jumps" (skipping levels)                              │
│  └─ Map prerequisite dependencies                                           │
│                           ↓                                                  │
│  STEP 4: Consistency Analysis                                               │
│  ├─ Chapter-to-Course consistency (goals alignment)                         │
│  ├─ Section-to-Chapter consistency (depth uniformity)                       │
│  └─ Cross-chapter skill building flow                                       │
│                           ↓                                                  │
│  STEP 5: Content Quality Analysis                                           │
│  ├─ Duplicate content detection (similarity scoring)                        │
│  ├─ Content depth assessment (thin vs rich sections)                        │
│  └─ Gap identification (missing prerequisite content)                       │
│                           ↓                                                  │
│  STEP 6: Learning Outcomes Analysis                                         │
│  ├─ What will user actually learn?                                          │
│  ├─ Skills they'll develop                                                  │
│  └─ Knowledge gaps after completion                                         │
│                           ↓                                                  │
│  STEP 7: Generate Actionable Issues                                         │
│  ├─ Create specific issues with exact locations                             │
│  ├─ Prioritize by impact (Critical/High/Medium/Low)                         │
│  └─ Group by type (Structure/Content/Flow/Duplicate)                        │
│                           ↓                                                  │
│  STEP 8: Generate Fix Instructions                                          │
│  ├─ For each issue: What to do, Why, How                                    │
│  ├─ Suggested content additions/removals                                    │
│  └─ AI-generated improvement suggestions                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: New Data Models

### Enhanced Database Schema

```prisma
// Enhanced analysis storage with detailed issues
model CourseDepthAnalysis {
  id                    String   @id @default(cuid())
  courseId              String
  version               Int      @default(1)  // Track analysis versions

  // Overall Scores
  overallScore          Float
  depthScore            Float
  consistencyScore      Float
  flowScore             Float
  qualityScore          Float

  // Bloom's Analysis (existing)
  bloomsDistribution    Json     // { REMEMBER: 15, UNDERSTAND: 25, ... }

  // NEW: Detailed Chapter Analysis
  chapterAnalysis       Json     // Array of chapter-level analysis

  // NEW: Issue Tracking
  issues                Json     // Array of specific issues with locations
  issueCount            Json     // { critical: 2, high: 5, medium: 8, low: 3 }

  // NEW: Learning Outcomes
  learningOutcomes      Json     // What students will learn
  skillsGained          Json     // Skills developed
  knowledgeGaps         Json     // Gaps after completion

  // NEW: Content Analysis
  duplicateContent      Json     // Array of duplicate pairs
  thinSections          Json     // Sections needing more content
  contentFlow           Json     // Flow analysis results

  // NEW: Fix Instructions
  fixInstructions       Json     // Detailed how-to-fix for each issue

  // Metadata
  contentHash           String   // Detect course changes
  status                AnalysisStatus @default(COMPLETED)
  analyzedAt            DateTime @default(now())

  // Relations
  course                Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  corrections           CourseCorrection[]  // Track user corrections

  @@index([courseId])
  @@index([courseId, version])
}

// Track corrections made by user
model CourseCorrection {
  id              String   @id @default(cuid())
  analysisId      String
  issueId         String   // Reference to specific issue
  status          CorrectionStatus @default(PENDING)
  correctedAt     DateTime?
  notes           String?

  analysis        CourseDepthAnalysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)

  @@index([analysisId])
}

enum AnalysisStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
  NEEDS_REANALYSIS
}

enum CorrectionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}
```

### Issue Data Structure

```typescript
interface AnalysisIssue {
  id: string;
  type: 'structure' | 'content' | 'flow' | 'duplicate' | 'consistency' | 'depth';
  severity: 'critical' | 'high' | 'medium' | 'low';

  // Exact Location
  location: {
    courseId: string;
    chapterId?: string;
    chapterTitle?: string;
    sectionId?: string;
    sectionTitle?: string;
    contentType?: 'title' | 'description' | 'objective' | 'content' | 'assessment';
  };

  // Problem Description
  title: string;           // "Section lacks higher-order thinking activities"
  description: string;     // Detailed explanation
  evidence: string[];      // Specific examples from content

  // Impact
  impact: {
    area: string;          // "Learning Outcomes"
    description: string;   // "Students won't develop analysis skills"
  };

  // Fix Instructions
  fix: {
    action: 'add' | 'modify' | 'remove' | 'reorder' | 'split' | 'merge';
    what: string;          // What needs to change
    why: string;           // Why this fix helps
    how: string;           // Step-by-step instructions
    suggestedContent?: string;  // AI-generated content suggestion
    examples?: string[];   // Example implementations
  };

  // Tracking
  status: 'open' | 'in_progress' | 'resolved' | 'skipped';
  relatedIssues?: string[];  // IDs of related issues
}
```

---

## Part 4: New UI Design

### Redesigned Analysis Results Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Course Depth Analysis: "React Complete Guide 2026"                       │
│ Analyzed: 2 minutes ago │ Version: 3 │ Status: ✅ Complete                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  OVERALL HEALTH SCORE: 72/100  [============░░░░░░░░]               │   │
│  │                                                                      │   │
│  │  Depth: 78    Consistency: 65    Flow: 80    Quality: 68            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────┐                                                        │
│  │ 🔴 2 Critical   │ Issues need your attention before publishing          │
│  │ 🟠 5 High       │                                                        │
│  │ 🟡 8 Medium     │ [View All Issues] [Fix Critical First]               │
│  │ 🟢 3 Low        │                                                        │
│  └─────────────────┘                                                        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ TABS: [Overview] [Issues] [Chapters] [Flow] [Duplicates] [Outcomes]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ISSUES TAB (Expandable Cards)                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  🔴 CRITICAL: Chapter 3 skips fundamental concepts                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Location: Chapter 3 "State Management" → Section 1 "Redux Basics"     │ │
│  │                                                                        │ │
│  │ Problem:                                                               │ │
│  │ This section jumps directly to Redux without covering React's         │ │
│  │ built-in state (useState, useReducer). Students need this foundation. │ │
│  │                                                                        │ │
│  │ Evidence:                                                              │ │
│  │ • No mention of useState in prerequisites                              │ │
│  │ • Section assumes prior Redux knowledge                                │ │
│  │ • Learning objectives skip "Understand" level                          │ │
│  │                                                                        │ │
│  │ ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │ │ HOW TO FIX:                                                      │  │ │
│  │ │                                                                  │  │ │
│  │ │ 1. Add new Section 0: "React State Fundamentals" BEFORE Redux   │  │ │
│  │ │    - Cover: useState basics, state updates, derived state       │  │ │
│  │ │    - Duration: ~30 minutes                                      │  │ │
│  │ │                                                                  │  │ │
│  │ │ 2. Add Section 0.5: "When to Use Redux"                         │  │ │
│  │ │    - Compare: useState vs useReducer vs Redux                   │  │ │
│  │ │    - Help students understand when each is appropriate          │  │ │
│  │ │                                                                  │  │ │
│  │ │ 3. Update Section 1 prerequisites to reference new sections     │  │ │
│  │ │                                                                  │  │ │
│  │ │ [📝 Generate Content Suggestions] [🔗 Go to Chapter 3]          │  │ │
│  │ └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  │ Status: [○ Open] [◐ In Progress] [● Resolved] [⊘ Skip]               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  🟠 HIGH: Duplicate content in Chapter 2 and Chapter 5                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Similarity: 87%                                                        │ │
│  │                                                                        │ │
│  │ Source A: Chapter 2, Section 3 "Component Props"                       │ │
│  │ Source B: Chapter 5, Section 1 "Advanced Props Patterns"               │ │
│  │                                                                        │ │
│  │ Duplicate Content:                                                     │ │
│  │ ┌─────────────────────────────────┬─────────────────────────────────┐ │ │
│  │ │ Chapter 2, Section 3            │ Chapter 5, Section 1            │ │ │
│  │ ├─────────────────────────────────┼─────────────────────────────────┤ │ │
│  │ │ "Props are read-only and        │ "Remember that props are        │ │ │
│  │ │  should never be modified       │  immutable - never modify       │ │ │
│  │ │  directly by the component..."  │  them within your component..." │ │ │
│  │ └─────────────────────────────────┴─────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │ RECOMMENDATION:                                                        │ │
│  │ • KEEP: Chapter 2 (foundational introduction)                         │ │
│  │ • MODIFY: Chapter 5 (reference Ch.2, add only NEW advanced concepts)  │ │
│  │                                                                        │ │
│  │ [🔗 Go to Chapter 2] [🔗 Go to Chapter 5] [Compare Side-by-Side]      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flow Analysis Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ KNOWLEDGE FLOW ANALYSIS                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Expected Learning Progression (Bloom's Levels)                             │
│                                                                              │
│  Chapter 1     Chapter 2     Chapter 3     Chapter 4     Chapter 5          │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐       │
│  │ CREATE  │   │ CREATE  │   │ CREATE  │   │ CREATE  │   │ CREATE  │       │
│  │ EVALUATE│   │ EVALUATE│   │ EVALUATE│ ⚠│ EVALUATE│   │ EVALUATE│       │
│  │ ANALYZE │   │ ANALYZE │   │░░░░░░░░░│   │ ANALYZE │   │ ANALYZE │       │
│  │ APPLY   │   │ APPLY   │   │ APPLY   │   │ APPLY   │   │ APPLY   │       │
│  │ UNDERST │   │ UNDERST │   │ UNDERST │   │ UNDERST │   │ UNDERST │       │
│  │█REMEMBER│   │ REMEMBER│   │ REMEMBER│   │ REMEMBER│   │ REMEMBER│       │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘       │
│                                                                              │
│  ⚠ Issue: Chapter 3 jumps from APPLY to EVALUATE, skipping ANALYZE          │
│    This creates a cognitive gap - students may struggle                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ FIX: Add analysis activities to Chapter 3                           │   │
│  │ • Add case study analysis in Section 2                              │   │
│  │ • Include "compare and contrast" exercise                           │   │
│  │ • Add debugging exercise (requires analysis skills)                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: API Design

### New Endpoints

```typescript
// Main analysis endpoint (enhanced)
POST /api/course-depth-analysis/v2
Request: { courseId: string, options?: AnalysisOptions }
Response: {
  analysisId: string;
  status: 'queued' | 'in_progress' | 'completed';
  progress?: { step: number; total: 8; currentStep: string; };
}

// SSE endpoint for real-time progress
GET /api/course-depth-analysis/v2/stream?analysisId=xxx
Events:
  - progress: { step, total, message, percentComplete }
  - step_complete: { step, result }
  - complete: { analysisId, summary }
  - error: { message, step }

// Get analysis results
GET /api/course-depth-analysis/v2/[analysisId]
Response: {
  analysis: CourseDepthAnalysis;
  issues: AnalysisIssue[];
  chapters: ChapterAnalysis[];
  outcomes: LearningOutcomes;
}

// Get specific issues
GET /api/course-depth-analysis/v2/[analysisId]/issues
Query: ?severity=critical&type=flow&status=open
Response: { issues: AnalysisIssue[]; pagination: {...} }

// Update issue status (user marks as fixed)
PATCH /api/course-depth-analysis/v2/issues/[issueId]
Request: { status: 'in_progress' | 'resolved' | 'skipped'; notes?: string }

// Re-analyze course (after corrections)
POST /api/course-depth-analysis/v2/reanalyze
Request: { courseId: string; previousAnalysisId?: string }
Response: {
  analysisId: string;
  comparison?: {  // If previousAnalysisId provided
    issuesResolved: number;
    newIssues: number;
    scoreImprovement: number;
  }
}

// Generate AI fix suggestion for specific issue
POST /api/course-depth-analysis/v2/suggest-fix
Request: { issueId: string; context?: string }
Response: {
  suggestedContent: string;
  implementation: string[];
  alternatives?: string[];
}
```

---

## Part 6: Implementation Plan

### Phase 1: Enhanced Analysis Engine (Week 1-2)

**Files to Create:**
```
lib/sam/depth-analysis/
├── enhanced-analyzer.ts       # Main orchestrator
├── analyzers/
│   ├── structure-analyzer.ts  # Step 1: Course structure
│   ├── blooms-classifier.ts   # Step 2: Bloom's classification
│   ├── flow-analyzer.ts       # Step 3: Learning flow
│   ├── consistency-checker.ts # Step 4: Consistency
│   ├── content-analyzer.ts    # Step 5: Content quality
│   ├── outcomes-analyzer.ts   # Step 6: Learning outcomes
│   ├── issue-generator.ts     # Step 7: Generate issues
│   └── fix-generator.ts       # Step 8: Generate fixes
├── types.ts                   # TypeScript interfaces
└── prompts/
    ├── blooms-classification.ts
    ├── duplicate-detection.ts
    ├── fix-generation.ts
    └── outcomes-analysis.ts
```

**Key Implementation:**
```typescript
// enhanced-analyzer.ts
export class EnhancedCourseAnalyzer {
  async analyze(courseId: string, onProgress: ProgressCallback): Promise<AnalysisResult> {
    // Step 1: Extract and structure course data
    onProgress({ step: 1, message: 'Analyzing course structure...' });
    const structure = await this.analyzeStructure(courseId);

    // Step 2: Classify Bloom's levels
    onProgress({ step: 2, message: 'Classifying cognitive levels...' });
    const blooms = await this.classifyBlooms(structure);

    // Step 3: Analyze learning flow
    onProgress({ step: 3, message: 'Analyzing learning progression...' });
    const flow = await this.analyzeFlow(structure, blooms);

    // Step 4: Check consistency
    onProgress({ step: 4, message: 'Checking content consistency...' });
    const consistency = await this.checkConsistency(structure, blooms);

    // Step 5: Analyze content quality
    onProgress({ step: 5, message: 'Analyzing content quality...' });
    const quality = await this.analyzeQuality(structure);

    // Step 6: Determine learning outcomes
    onProgress({ step: 6, message: 'Determining learning outcomes...' });
    const outcomes = await this.analyzeOutcomes(structure, blooms, flow);

    // Step 7: Generate specific issues
    onProgress({ step: 7, message: 'Identifying issues...' });
    const issues = await this.generateIssues(structure, blooms, flow, consistency, quality);

    // Step 8: Generate fix instructions
    onProgress({ step: 8, message: 'Generating fix instructions...' });
    const fixes = await this.generateFixes(issues, structure);

    return { structure, blooms, flow, consistency, quality, outcomes, issues, fixes };
  }
}
```

### Phase 2: Database & API (Week 2-3)

1. Create new Prisma models
2. Implement API routes with SSE streaming
3. Add issue tracking endpoints
4. Add re-analysis comparison logic

### Phase 3: Frontend Redesign (Week 3-4)

1. New analysis results layout with issue cards
2. Flow visualization component
3. Duplicate comparison view
4. Issue tracking/status management
5. Re-analysis comparison modal

### Phase 4: Testing & Polish (Week 4-5)

1. Test with various course types
2. Refine AI prompts for accuracy
3. Performance optimization
4. User feedback integration

---

## Part 7: AI Prompts for Analysis

### Bloom's Classification Prompt
```
Analyze this educational content and classify it according to Bloom's Taxonomy:

Content: {section_content}
Title: {section_title}
Learning Objectives: {objectives}

For each piece of content, identify:
1. Primary Bloom's Level (REMEMBER/UNDERSTAND/APPLY/ANALYZE/EVALUATE/CREATE)
2. Evidence (specific phrases that indicate this level)
3. Confidence score (0-100)

Consider:
- Action verbs used (list, explain, apply, compare, evaluate, design)
- Type of activity required
- Depth of processing needed

Return structured JSON with classifications.
```

### Duplicate Detection Prompt
```
Compare these two sections for content overlap:

Section A:
Title: {title_a}
Content: {content_a}

Section B:
Title: {title_b}
Content: {content_b}

Analyze:
1. Overall similarity percentage (0-100)
2. Specific overlapping concepts
3. Which section covers each concept more thoroughly
4. Recommendation: KEEP_A, KEEP_B, MERGE, or KEEP_BOTH_DIFFERENT_CONTEXT

Return structured analysis with evidence.
```

### Fix Generation Prompt
```
Generate specific fix instructions for this course issue:

Issue: {issue_description}
Location: {chapter_title} → {section_title}
Current Content: {current_content}
Problem: {problem_description}
Impact: {impact_description}

Generate:
1. Step-by-step fix instructions (numbered)
2. Suggested content to add (if applicable)
3. Content to remove or modify (if applicable)
4. Expected outcome after fix
5. Alternative approaches (if any)

Be specific and actionable. Reference exact locations.
```

---

## Summary: What This Redesign Achieves

| Your Requirement | How It's Addressed |
|------------------|-------------------|
| Analyze with Bloom's Engine | ✅ 8-step analysis pipeline with AI classification |
| Course depth analysis | ✅ Multi-dimensional scoring (depth, flow, consistency, quality) |
| What user will learn | ✅ Learning Outcomes tab with skills gained |
| Course-chapter consistency | ✅ Consistency checker compares chapter goals to course goals |
| Section-section consistency | ✅ Cross-section depth uniformity analysis |
| Knowledge flow for skills | ✅ Flow analyzer detects cognitive jumps and gaps |
| Save results | ✅ Enhanced schema with version tracking |
| What to correct & where | ✅ Issues have exact location (chapter → section → content type) |
| How to correct | ✅ Fix instructions with step-by-step guidance |
| Duplicate detection | ✅ AI-powered similarity analysis with side-by-side view |
| What to remove/keep | ✅ Specific recommendations for each duplicate pair |
| Step-by-step AI process | ✅ 8-step progressive analysis with SSE progress |
| Re-analyze after correction | ✅ Comparison mode shows resolved issues & improvements |

---

## Next Steps

1. **Review this plan** - Confirm requirements alignment
2. **Prioritize features** - Which parts are most critical?
3. **Start implementation** - Begin with Phase 1 analysis engine
4. **Iterate** - Refine based on testing results

Would you like me to proceed with implementation?
