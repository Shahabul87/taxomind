# AI Skill Roadmap Generation System

> **Last Updated**: February 2026
> **Status**: Active
> **Location**: `/lib/sam/roadmap-generation/prompt-templates.ts`

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [How AI is Guided](#how-ai-is-guided)
4. [Pedagogical Framework](#pedagogical-framework)
5. [Course Sequencing Logic](#course-sequencing-logic)
6. [Naming Conventions](#naming-conventions)
7. [Time Estimation](#time-estimation)
8. [Validation System](#validation-system)
9. [Data Flow](#data-flow)
10. [Example Output](#example-output)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Skill Roadmap Generation System uses AI (Anthropic/OpenAI) to create personalized learning paths for users. The system ensures **consistency** and **pedagogical soundness** by providing the AI with comprehensive guidelines based on:

- **Bloom's Taxonomy** - Cognitive progression framework
- **Proficiency Levels** - 7-level skill mastery scale
- **Learning Styles** - Structured, Project-based, or Mixed
- **Difficulty Progression** - BEGINNER → INTERMEDIATE → ADVANCED

### Key Files

| File | Purpose |
|------|---------|
| `lib/sam/roadmap-generation/prompt-templates.ts` | AI guidelines, prompt builder, validation |
| `app/api/sam/skill-roadmap/generate/route.ts` | SSE endpoint for roadmap generation |
| `app/api/sam/skill-roadmap/route.ts` | CRUD operations for roadmaps |
| `hooks/use-skill-roadmap-journey.ts` | Frontend hooks |
| `components/skill-roadmap/` | UI components |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INPUT                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Skill Name  │  │Current Level│  │Target Level │  │Hours/Week   │         │
│  │ "React"     │  │ BEGINNER    │  │ PROFICIENT  │  │ 10          │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROMPT BUILDER (prompt-templates.ts)                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ buildComprehensiveRoadmapPrompt(input)                               │   │
│  │                                                                      │   │
│  │  1. Load PROFICIENCY_DEFINITIONS for current/target levels          │   │
│  │  2. Calculate Bloom's levels needed for journey                     │   │
│  │  3. Calculate total hours & weeks                                   │   │
│  │  4. Apply LEARNING_STYLE_ADAPTATIONS                                │   │
│  │  5. Generate structured prompt with:                                │   │
│  │     - Learner profile                                               │   │
│  │     - Pedagogical framework                                         │   │
│  │     - Course naming conventions                                     │   │
│  │     - Validation rules                                              │   │
│  │     - Expected JSON schema                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI MODEL                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ System Prompt:                                                       │   │
│  │ "You are an expert instructional designer following Bloom's          │   │
│  │  Taxonomy and evidence-based learning principles..."                 │   │
│  │                                                                      │   │
│  │ Parameters:                                                          │   │
│  │ - maxTokens: 6000                                                    │   │
│  │ - temperature: 0.5 (lower = more consistent)                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VALIDATION (validateAIResponse)                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Zod Schema Validation                                             │   │
│  │    - Required fields present                                         │   │
│  │    - Correct types and lengths                                       │   │
│  │                                                                      │   │
│  │ 2. Semantic Validation                                               │   │
│  │    - Bloom's levels progress in order                                │   │
│  │    - Difficulty never decreases                                      │   │
│  │    - Total hours are reasonable                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Prisma)                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ SkillBuildRoadmap                                                    │   │
│  │   └── SkillBuildRoadmapMilestone[] (phases)                          │   │
│  │         ├── skills[]                                                 │   │
│  │         └── resources (JSON)                                         │   │
│  │               ├── courses[]                                          │   │
│  │               ├── projects[]                                         │   │
│  │               ├── learningObjectives[]                               │   │
│  │               └── bloomsLevel, difficulty, etc.                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## How AI is Guided

### The Problem We Solved

Without proper guidelines, AI would generate inconsistent roadmaps:
- Random difficulty jumps (BEGINNER → ADVANCED in one phase)
- No cognitive progression (mixing CREATE activities with REMEMBER)
- Inconsistent naming ("React Tutorial" vs "Learn React" vs "React Course")
- Unrealistic time estimates
- No prerequisites or dependencies

### The Solution: Comprehensive Prompt Engineering

We provide AI with **explicit rules** for every aspect of roadmap generation:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI PROMPT STRUCTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  LEARNER PROFILE                                                 │
│  ═══════════════════════════════════════════════════════════    │
│  • Skill, current level, target level                           │
│  • What they can do now vs. what they should be able to do      │
│  • Time commitment, learning style                               │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  PEDAGOGICAL FRAMEWORK (MANDATORY)                               │
│  ═══════════════════════════════════════════════════════════    │
│  1. Bloom's Taxonomy - which levels to use and how              │
│  2. Difficulty Progression - rules for increasing difficulty    │
│  3. Prerequisite Chain - how to structure dependencies          │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  COURSE NAMING CONVENTIONS                                       │
│  ═══════════════════════════════════════════════════════════    │
│  • Template: "[Skill]: [Focus] - [Outcome]"                     │
│  • Examples for each phase position                              │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  LEARNING STYLE ADAPTATION                                       │
│  ═══════════════════════════════════════════════════════════    │
│  • Theory/Practice ratio                                         │
│  • Project emphasis level                                        │
│  • Phase structure recommendations                               │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  OUTPUT REQUIREMENTS (JSON Schema)                               │
│  ═══════════════════════════════════════════════════════════    │
│  • Exact structure expected                                      │
│  • Field descriptions and constraints                            │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  VALIDATION RULES (Self-Check)                                   │
│  ═══════════════════════════════════════════════════════════    │
│  • ✓ Bloom's levels progress correctly                          │
│  • ✓ Difficulty never decreases                                 │
│  • ✓ Hours add up correctly                                     │
│  • ✓ Course titles follow naming convention                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pedagogical Framework

### Bloom's Taxonomy Integration

Bloom's Taxonomy defines 6 cognitive levels. AI must progress through them in order:

```
Level 6: CREATE      ─────────────────────────────────────────────────────────►
         "design, create, develop, formulate"                    EXPERT/STRATEGIST
         Projects: Design novel system, Create reusable library

Level 5: EVALUATE    ───────────────────────────────────────────►
         "evaluate, judge, critique, justify"              ADVANCED/EXPERT
         Projects: Write architecture decision record

Level 4: ANALYZE     ─────────────────────────────────►
         "analyze, differentiate, examine"           PROFICIENT/ADVANCED
         Projects: Analyze and optimize code, Performance audit

Level 3: APPLY       ───────────────────────────►
         "implement, execute, solve"           COMPETENT/PROFICIENT
         Projects: Build working application

Level 2: UNDERSTAND  ─────────────────────►
         "explain, describe, summarize"    BEGINNER/COMPETENT
         Projects: Write explanatory blog post

Level 1: REMEMBER    ───────────────►
         "define, list, identify"      NOVICE/BEGINNER
         Projects: Create glossary, Build cheat sheet

         ◄────────────────────────────────────────────────────────────────────►
         NOVICE    BEGINNER    COMPETENT    PROFICIENT    ADVANCED    EXPERT
```

### Proficiency Level Definitions

| Level | Name | Description | Bloom's Range | Typical Hours |
|-------|------|-------------|---------------|---------------|
| 1 | NOVICE | No prior knowledge | REMEMBER | 0 |
| 2 | BEGINNER | Basic awareness, needs guidance | REMEMBER, UNDERSTAND | 20 |
| 3 | COMPETENT | Works independently on standard tasks | UNDERSTAND, APPLY | 80 |
| 4 | PROFICIENT | Handles complex tasks, deep understanding | APPLY, ANALYZE | 200 |
| 5 | ADVANCED | Deep expertise, optimization | ANALYZE, EVALUATE | 500 |
| 6 | EXPERT | Recognized authority, creates new approaches | EVALUATE, CREATE | 1000 |
| 7 | STRATEGIST | Industry leader, shapes the field | CREATE | 2000 |

### Difficulty Progression Rules

```typescript
// AI must follow these rules:

1. Phase 1 difficulty = appropriate for CURRENT level
2. Each phase can only increase difficulty by ONE level
3. Final phase difficulty = appropriate for TARGET level
4. Within a phase: courses can be same level or +1

// Example: BEGINNER → PROFICIENT journey
Phase 1: BEGINNER difficulty     (Bloom's: UNDERSTAND)
Phase 2: BEGINNER difficulty     (Bloom's: UNDERSTAND)
Phase 3: INTERMEDIATE difficulty (Bloom's: APPLY)
Phase 4: INTERMEDIATE difficulty (Bloom's: APPLY)
Phase 5: INTERMEDIATE difficulty (Bloom's: ANALYZE)

// FORBIDDEN:
Phase 1: BEGINNER
Phase 2: ADVANCED  ← Skipped INTERMEDIATE! Not allowed.
```

---

## Course Sequencing Logic

### How AI Knows What Comes First

AI follows this decision tree for each phase:

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE SEQUENCING LOGIC                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  For Phase N, AI determines:                                     │
│                                                                  │
│  1. BLOOM'S LEVEL                                               │
│     ├─ If N=1: Use lowest Bloom's in journey range              │
│     ├─ If N=last: Use highest Bloom's in journey range          │
│     └─ Otherwise: Progress from previous phase (+0 or +1)       │
│                                                                  │
│  2. DIFFICULTY                                                   │
│     ├─ If N=1: Match to current proficiency level               │
│     ├─ Can only increase by 1 from previous phase               │
│     └─ Must reach target difficulty by final phase              │
│                                                                  │
│  3. PREREQUISITES                                                │
│     ├─ Phase N requires completion of Phase N-1                 │
│     └─ List specific concepts needed from earlier phases        │
│                                                                  │
│  4. CONTENT FOCUS                                                │
│     ├─ Early phases: Foundational, terminology, basics          │
│     ├─ Middle phases: Application, building, practice           │
│     └─ Late phases: Optimization, architecture, advanced        │
│                                                                  │
│  5. COURSES WITHIN PHASE                                         │
│     ├─ Course 1: Introduces phase concepts                      │
│     ├─ Course 2: Deepens understanding                          │
│     └─ Course 3 (if present): Applies to real scenarios         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Example: React BEGINNER → PROFICIENT

```
Phase 1: "React Fundamentals: Core Concepts and Terminology"
├─ Bloom's: UNDERSTAND
├─ Difficulty: BEGINNER
├─ Focus: What is React, JSX basics, component concept
├─ Prerequisites: Basic JavaScript knowledge
└─ Courses:
   ├─ Course 1: "React Fundamentals: Understanding Components and JSX"
   ├─ Course 2: "React Essentials: Props, State, and Data Flow"
   └─ Course 3: "React Basics: Your First Interactive Components"

Phase 2: "Building with React: State Management in Action"
├─ Bloom's: APPLY
├─ Difficulty: BEGINNER → INTERMEDIATE
├─ Focus: useState, useEffect, handling events
├─ Prerequisites: Components, Props, JSX from Phase 1
└─ Courses:
   ├─ Course 1: "React Hooks: useState and useEffect Mastered"
   ├─ Course 2: "React Events: Building Interactive User Interfaces"

Phase 3: "React Patterns: Component Architecture Deep Dive"
├─ Bloom's: APPLY
├─ Difficulty: INTERMEDIATE
├─ Focus: Component composition, custom hooks, context
├─ Prerequisites: Hooks, state management from Phase 2
└─ ...

Phase 4: "Advanced React: Performance Optimization Techniques"
├─ Bloom's: ANALYZE
├─ Difficulty: INTERMEDIATE
├─ Focus: Memoization, code splitting, profiling
├─ Prerequisites: Component patterns from Phase 3
└─ ...

Phase 5: "React Architecture: Designing Scalable Applications"
├─ Bloom's: ANALYZE
├─ Difficulty: INTERMEDIATE → ADVANCED
├─ Focus: State management solutions, testing strategies
├─ Prerequisites: Performance patterns from Phase 4
└─ ...
```

---

## Naming Conventions

### Course Title Format

```
"[Skill/Topic]: [Specific Focus] - [Learning Outcome]"

Examples:
✅ "React Fundamentals: Core Concepts and Terminology"
✅ "Understanding React Hooks: useState and useEffect Explained"
✅ "Building with React: Todo App in Action"
✅ "Advanced React: Performance Optimization Techniques"

❌ "Learn React"                    (too vague)
❌ "React Tutorial"                 (not specific)
❌ "Module 1"                       (not descriptive)
❌ "Introduction"                   (missing skill name)
```

### Templates by Phase Position

| Phase Position | Template | Example |
|----------------|----------|---------|
| Phase 1 (Foundation) | `{skill} Fundamentals: Core Concepts and Terminology` | "React Fundamentals: Core Concepts and Terminology" |
| Phase 2 (Understanding) | `Understanding {skill}: {topic} Explained` | "Understanding React: Component Lifecycle Explained" |
| Mid Phases (Application) | `Building with {skill}: {project} in Action` | "Building with React: E-commerce Cart in Action" |
| Late Phases (Advanced) | `Advanced {skill}: {topic} Optimization Techniques` | "Advanced React: Rendering Optimization Techniques" |
| Final Phase (Mastery) | `{skill} Architecture: Designing Scalable {topic}` | "React Architecture: Designing Scalable State Management" |

### Course Description Requirements

Each course description must include:
1. **What the learner will learn** (2-3 specific outcomes)
2. **Key topics covered** (3-5 bullet points)
3. **Practical application** mentioned

**Length**: 60-100 words

**Example**:
> "Master React's core hooks - useState and useEffect - to build dynamic, interactive components. You'll learn how to manage component state, handle side effects, and synchronize with external systems. Key topics include state initialization patterns, effect dependencies, cleanup functions, and common pitfalls to avoid. By the end, you'll confidently build components that respond to user input and fetch data from APIs."

---

## Time Estimation

### Formulas Used

```typescript
// Hours by difficulty level
BEGINNER courses:     4-8 hours (typical: 6h)
INTERMEDIATE courses: 8-16 hours (typical: 12h)
ADVANCED courses:     12-24 hours (typical: 18h)

// Projects
BEGINNER projects:     2-6 hours (typical: 4h)
INTERMEDIATE projects: 6-12 hours (typical: 8h)
ADVANCED projects:     10-20 hours (typical: 15h)

// Total hours between proficiency levels
NOVICE → BEGINNER:      ~20 hours
BEGINNER → COMPETENT:   ~60 hours
COMPETENT → PROFICIENT: ~120 hours
PROFICIENT → ADVANCED:  ~300 hours
ADVANCED → EXPERT:      ~500 hours
EXPERT → STRATEGIST:    ~1000 hours
```

### Calculating Weeks Needed

```
totalWeeks = totalHours / hoursPerWeek

Example: BEGINNER → PROFICIENT at 10 hours/week
totalHours = 20 + 60 + 120 = 200 hours
totalWeeks = 200 / 10 = 20 weeks
```

---

## Validation System

### Two-Layer Validation

#### Layer 1: Zod Schema Validation

```typescript
AIRoadmapResponseSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(20).max(200),
  totalEstimatedHours: z.number().min(10).max(2000),
  phases: z.array(
    z.object({
      phaseNumber: z.number().min(1).max(10),
      title: z.string().min(10).max(100),
      bloomsLevel: z.enum(['REMEMBER', 'UNDERSTAND', ...]),
      difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
      courses: z.array(...).min(2).max(4),
      projects: z.array(...).min(1).max(3),
      learningObjectives: z.array(z.string()).min(2).max(6),
      // ... more fields
    })
  ).min(3).max(8),
});
```

#### Layer 2: Semantic Validation

```typescript
// After schema passes, check logical consistency:

1. Bloom's Progression Check
   for each phase (starting from 2):
     currentLevel - previousLevel should be 0, 1, or 2
     if > 2: ERROR "Phase N skips Bloom's levels"
     if < 0: ERROR "Phase N goes backwards in Bloom's levels"

2. Difficulty Progression Check
   for each phase (starting from 2):
     if currentDifficulty < previousDifficulty:
       ERROR "Phase N decreases difficulty"

3. Hours Consistency Check
   sumOfPhaseHours vs totalEstimatedHours
   if difference > 20%:
     ERROR "Total hours mismatch"
```

### Validation Error Examples

```
❌ "Phase 3 skips Bloom's levels (UNDERSTAND → EVALUATE)"
   Fix: Insert APPLY and ANALYZE phases between

❌ "Phase 4 decreases difficulty (ADVANCED → BEGINNER)"
   Fix: Maintain or increase difficulty

❌ "Total hours mismatch: stated 100h but phases sum to 180h"
   Fix: Adjust phase hours or total
```

---

## Data Flow

### Complete Request-Response Flow

```
1. USER SUBMITS FORM
   ├─ skillName: "React"
   ├─ currentLevel: "BEGINNER"
   ├─ targetLevel: "PROFICIENT"
   ├─ hoursPerWeek: 10
   └─ learningStyle: "MIXED"
              │
              ▼
2. API ROUTE VALIDATES INPUT (Zod)
              │
              ▼
3. PROMPT BUILDER GENERATES ~200 LINE PROMPT
   ├─ Calculates Bloom's range needed
   ├─ Calculates total hours
   ├─ Applies learning style adaptations
   └─ Includes all guidelines
              │
              ▼
4. AI GENERATES RESPONSE (SSE streaming)
   ├─ Progress: "Analyzing skill landscape..." (5%)
   ├─ Progress: "Designing learning phases..." (25%)
   └─ Progress: "Validating structure..." (50%)
              │
              ▼
5. VALIDATION RUNS
   ├─ Zod schema check
   └─ Semantic validation
              │
              ▼
6. COURSE MATCHING
   ├─ For each AI-suggested course title
   ├─ Search platform courses by keywords
   └─ Link matches to milestones
              │
              ▼
7. DATABASE PERSISTENCE
   ├─ Create SkillBuildRoadmap
   └─ Create SkillBuildRoadmapMilestone[]
              │
              ▼
8. RESPONSE TO CLIENT
   ├─ roadmapId
   ├─ milestones[]
   └─ Redirect to dashboard
```

### Database Schema (Simplified)

```prisma
model SkillBuildRoadmap {
  id                   String
  userId               String
  title                String
  status               SkillBuildRoadmapStatus  // ACTIVE, COMPLETED, etc.
  targetOutcome        Json  // {skillName, currentLevel, targetLevel, ...}
  totalEstimatedHours  Float
  completionPercentage Float
  milestones           SkillBuildRoadmapMilestone[]
}

model SkillBuildRoadmapMilestone {
  id              String
  roadmapId       String
  order           Int
  title           String
  status          SkillBuildMilestoneStatus  // LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED
  estimatedHours  Float
  skills          Json    // [{skillName, targetLevel, estimatedHours}]
  resources       Json    // {courses[], projects[], bloomsLevel, learningObjectives[], ...}
  matchedCourseIds String[]
}
```

---

## Example Output

### Input

```json
{
  "skillName": "TypeScript",
  "currentLevel": "NOVICE",
  "targetLevel": "COMPETENT",
  "hoursPerWeek": 8,
  "learningStyle": "MIXED",
  "includeAssessments": true,
  "prioritizeQuickWins": true
}
```

### Generated Roadmap Structure

```json
{
  "title": "TypeScript Mastery: From Novice to Competent Developer",
  "description": "A structured learning path to master TypeScript fundamentals and build type-safe applications.",
  "totalEstimatedHours": 100,
  "phases": [
    {
      "phaseNumber": 1,
      "title": "TypeScript Fundamentals: Core Concepts and Terminology",
      "description": "Begin your TypeScript journey by understanding what TypeScript is, why it matters, and how it enhances JavaScript development.",
      "bloomsLevel": "REMEMBER",
      "difficulty": "BEGINNER",
      "estimatedHours": 16,
      "durationWeeks": 2,
      "prerequisites": "Basic JavaScript knowledge (variables, functions, objects)",
      "learningObjectives": [
        "Define what TypeScript is and explain its benefits over JavaScript",
        "Identify basic TypeScript types and their use cases",
        "Recognize TypeScript syntax and compile-time error messages"
      ],
      "skills": [
        {
          "skillName": "TypeScript Basics",
          "targetLevel": "BEGINNER",
          "estimatedHours": 8,
          "prerequisiteSkills": ["JavaScript Fundamentals"]
        },
        {
          "skillName": "Type Annotations",
          "targetLevel": "BEGINNER",
          "estimatedHours": 8,
          "prerequisiteSkills": []
        }
      ],
      "courses": [
        {
          "courseNumber": 1,
          "title": "TypeScript Fundamentals: Understanding Types and Compilation",
          "description": "Learn what TypeScript is and why it's become essential for modern web development. Understand the type system basics, how TypeScript compiles to JavaScript, and configure your first TypeScript project. Key topics: primitive types, type inference, tsconfig.json, and the TypeScript compiler.",
          "difficulty": "BEGINNER",
          "estimatedHours": 6,
          "learningOutcomes": [
            "Explain the benefits of static typing",
            "Configure a TypeScript project from scratch",
            "Use primitive types correctly"
          ],
          "keyTopics": ["Static vs Dynamic Typing", "Type Inference", "tsconfig.json", "Compilation"],
          "prerequisiteConcepts": [],
          "reason": "Establishes foundation for all TypeScript learning"
        },
        {
          "courseNumber": 2,
          "title": "TypeScript Essentials: Working with Complex Types",
          "description": "Expand your type vocabulary with arrays, objects, unions, and intersections. Learn to type function parameters and return values effectively. Master type aliases and understand when to use interfaces vs types.",
          "difficulty": "BEGINNER",
          "estimatedHours": 6,
          "learningOutcomes": [
            "Define custom type aliases",
            "Use union and intersection types",
            "Type functions with parameters and return types"
          ],
          "keyTopics": ["Arrays", "Objects", "Union Types", "Type Aliases", "Function Types"],
          "prerequisiteConcepts": ["Primitive types", "Type inference"],
          "reason": "Builds on basics to handle real-world data structures"
        }
      ],
      "projects": [
        {
          "title": "TypeScript Glossary and Cheat Sheet",
          "description": "Create a personal reference document with TypeScript terminology, common patterns, and quick examples for each type.",
          "difficulty": "BEGINNER",
          "estimatedHours": 4,
          "deliverables": ["Markdown glossary file", "Code examples for each type"],
          "skillsApplied": ["TypeScript Basics", "Type Annotations"]
        }
      ],
      "assessmentCriteria": "Can correctly identify and explain 15+ TypeScript types and their use cases"
    },
    {
      "phaseNumber": 2,
      "title": "Understanding TypeScript: Interfaces and Generics Explained",
      "description": "Deepen your understanding of TypeScript's powerful features for creating reusable, type-safe code.",
      "bloomsLevel": "UNDERSTAND",
      "difficulty": "BEGINNER",
      "estimatedHours": 20,
      "durationWeeks": 2.5,
      "prerequisites": "Completion of Phase 1, understanding of basic types",
      "learningObjectives": [
        "Explain the difference between interfaces and type aliases",
        "Describe how generics enable code reuse",
        "Interpret complex generic type signatures"
      ],
      "courses": [/* ... */],
      "projects": [/* ... */],
      "assessmentCriteria": "Can explain interfaces vs types and write basic generic functions"
    },
    {
      "phaseNumber": 3,
      "title": "Building with TypeScript: Real-World Applications in Action",
      "description": "Apply your TypeScript knowledge to build practical applications.",
      "bloomsLevel": "APPLY",
      "difficulty": "INTERMEDIATE",
      "estimatedHours": 32,
      "durationWeeks": 4,
      "prerequisites": "Interfaces, generics, and advanced types from Phase 2",
      "learningObjectives": [
        "Implement type-safe API calls with proper error handling",
        "Build reusable components with generic props",
        "Solve common typing challenges in React/Node applications"
      ],
      "courses": [/* ... */],
      "projects": [/* ... */],
      "assessmentCriteria": "Can build a complete type-safe application with proper error handling"
    },
    {
      "phaseNumber": 4,
      "title": "TypeScript Patterns: Best Practices and Code Quality",
      "description": "Master professional TypeScript patterns used in production codebases.",
      "bloomsLevel": "APPLY",
      "difficulty": "INTERMEDIATE",
      "estimatedHours": 32,
      "durationWeeks": 4,
      "prerequisites": "Building applications from Phase 3",
      "learningObjectives": [
        "Implement design patterns with TypeScript",
        "Use utility types effectively",
        "Apply strict TypeScript configurations"
      ],
      "courses": [/* ... */],
      "projects": [/* ... */],
      "assessmentCriteria": "Can refactor JavaScript code to strict TypeScript with proper patterns"
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "AI returned invalid JSON" | AI included markdown formatting | Prompt explicitly says "no markdown"; parsing strips it |
| Empty phases array | AI confused by complex prompt | Reduce temperature; simplify prompt |
| Validation fails but has phases | Minor schema mismatches | Uses relaxed validation with warnings |
| Difficulty jumps | AI ignored rules | Validation catches and logs; can retry |
| Hours don't add up | AI estimation error | Semantic validation catches mismatch |

### Debugging

```typescript
// Enable detailed logging in generate/route.ts
logger.info('[SkillRoadmap] AI roadmap generated successfully', {
  skill: validated.skillName,
  phases: roadmapData.phases.length,
  totalHours: roadmapData.totalEstimatedHours,
  bloomsProgression: roadmapData.phases.map(p => p.bloomsLevel).join(' → '),
  difficultyProgression: roadmapData.phases.map(p => p.difficulty).join(' → '),
});
```

### Adjusting AI Behavior

| Want | Change |
|------|--------|
| More creative titles | Increase temperature (0.5 → 0.7) |
| More consistent output | Decrease temperature (0.5 → 0.3) |
| More detailed descriptions | Increase maxTokens (6000 → 8000) |
| Different phase count | Modify `numPhases` calculation in prompt builder |

---

## Related Documentation

- [Bloom's Taxonomy Reference](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy)
- [Skills Tab Implementation](./SKILLS_TAB_IMPLEMENTATION.md) *(if exists)*
- [SAM Agentic Architecture](../../codebase-memory/architecture/SAM_AGENTIC_ARCHITECTURE.md)

---

## Changelog

| Date | Change |
|------|--------|
| Feb 2026 | Initial comprehensive prompt system created |
| Feb 2026 | Added Bloom's Taxonomy integration |
| Feb 2026 | Added semantic validation layer |
| Feb 2026 | Enhanced course naming conventions |
