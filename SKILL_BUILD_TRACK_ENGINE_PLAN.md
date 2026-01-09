# SkillBuildTrack Engine Implementation Plan

## Overview

A comprehensive skill development and tracking engine for the Taxomind SAM AI system that provides:
- 7-level proficiency framework (Dreyfus + SFIA hybrid)
- Multi-dimensional scoring (mastery, retention, application, confidence, calibration)
- Velocity metrics and learning speed tracking
- Decay prediction using forgetting curves
- Personalized roadmap generation with milestones
- Industry benchmarking
- Evidence and portfolio tracking
- Employability analysis

## Current State Analysis

### Existing Components (to integrate, not duplicate):
| Component | Location | Purpose |
|-----------|----------|---------|
| SkillTracker | `packages/agentic/src/learning-path/` | Concept mastery 0-100, SM-2 spaced rep |
| SkillAssessor | `packages/agentic/src/learning-analytics/` | 5-level mastery, skill maps |
| CompetencyEngine | `packages/educational/src/engines/` | Career paths, job mapping |

### Gap Analysis:
- No unified skill-building guidance system
- No industry-standard framework integration (SFIA/O*NET)
- No velocity/acceleration tracking
- No forgetting curve decay prediction
- No personalized skill roadmaps
- No industry benchmarking
- No skill portfolio with employability scoring

---

## Files to Create/Modify

### New Files:
1. `packages/educational/src/types/skill-build-track.types.ts` (~800 lines)
2. `packages/educational/src/engines/skill-build-track-engine.ts` (~1,500 lines)
3. `prisma/domains/22-skill-build-track.prisma` (~200 lines)

### Files to Modify:
4. `packages/educational/src/engines/index.ts` - Add exports
5. `packages/educational/src/types/index.ts` - Add type exports
6. `packages/educational/src/index.ts` - Add to main exports
7. `prisma/domains/02-auth.prisma` - Add User relations

---

## Implementation Phases

### Phase 1: Type Definitions
**File:** `packages/educational/src/types/skill-build-track.types.ts`

Key types to implement:
- SkillBuildTrackEngineConfig
- SkillProficiencyLevel (7 levels: NOVICE → STRATEGIST)
- SkillDefinition (with framework mappings, learning curve)
- SkillProfile (multi-dimensional scoring)
- SkillDimensions (mastery, retention, application, confidence, calibration)
- SkillVelocity (learning speed, sessions to next level, trend)
- SkillDecayInfo (decay factor, half-life, forgetting curve)
- SkillRoadmap & RoadmapMilestone
- SkillBenchmark & RoleBenchmark
- SkillPortfolio & EmployabilityAnalysis
- SkillInsights & SkillRecommendation
- All Input/Result types for API methods
- SkillBuildTrackStore interface (portable)

### Phase 2: Core Engine Implementation
**File:** `packages/educational/src/engines/skill-build-track-engine.ts`

```typescript
class SkillBuildTrackEngine {
  // PROFICIENCY MANAGEMENT
  scoreToLevel(score): SkillProficiencyLevel
  levelToScore(level): number
  compareLevels(a, b): number

  // SKILL PROFILE
  getSkillProfile(input): Promise<SkillProfile>
  getUserSkillProfiles(userId): Promise<SkillProfile[]>

  // PRACTICE & UPDATES
  recordPractice(input): Promise<RecordPracticeResult>

  // VELOCITY TRACKING
  updateVelocity(profile, input): SkillVelocity
  determineTrend(history): SkillTrend
  calculateAcceleration(history): number

  // DECAY PREDICTION
  getDecayPredictions(input): Promise<GetDecayPredictionResult>
  generateForgettingCurve(score, decayRate, days): DecayCurvePoint[]
  calculateDaysUntilDrop(profile, decayRate): number

  // ROADMAP GENERATION
  generateRoadmap(input): Promise<SkillRoadmap>
  buildMilestones(targetSkills, profiles): RoadmapMilestone[]

  // BENCHMARKING
  getSkillBenchmark(input): Promise<SkillBenchmark>
  getRoleBenchmark(input): Promise<RoleBenchmark>
  calculatePercentile(score, benchmarkData): number

  // PORTFOLIO
  getPortfolio(input): Promise<SkillPortfolio>
  buildEmployabilityAnalysis(profiles, roleIds): EmployabilityAnalysis

  // EVIDENCE
  addEvidence(input): Promise<SkillEvidence>

  // INSIGHTS
  getInsights(input): Promise<SkillInsights>
  generateRecommendations(profile): SkillRecommendation[]
}
```

### Phase 3: Prisma Schema
**File:** `prisma/domains/22-skill-build-track.prisma`

Models to create:
- SkillDefinition - Skill catalog with framework mappings
- SkillBuildProfile - User-skill pair with dimensions
- SkillEvidence - Evidence records linked to profiles
- SkillRoadmap - User roadmaps with target outcomes
- SkillRoadmapMilestone - Milestones within roadmaps
- SkillRoadmapSkill - Skills within milestones
- SkillBenchmarkData - Aggregated benchmark statistics
- SkillPracticeLog - Practice session history

### Phase 4: Export Updates & Integration

Update package exports in:
- `packages/educational/src/engines/index.ts`
- `packages/educational/src/types/index.ts`
- `packages/educational/src/index.ts`
- `prisma/domains/02-auth.prisma` (User relations)

---

## Key Algorithms

### Proficiency Levels (Dreyfus + SFIA Hybrid)
| Level | Threshold | Description |
|-------|-----------|-------------|
| NOVICE | 0 | Basic awareness, follows instructions |
| BEGINNER | 15 | Limited experience, requires guidance |
| COMPETENT | 35 | Works independently |
| PROFICIENT | 55 | Handles complex tasks |
| ADVANCED | 70 | Deep expertise, mentors others |
| EXPERT | 85 | Recognized authority |
| STRATEGIST | 95 | Industry leader |

### Composite Score Calculation
```
compositeScore =
  mastery * 0.35 +
  retention * 0.25 +
  application * 0.25 +
  confidence * 0.08 +
  calibration * 0.07
```

### Decay Rates by Level
```
NOVICE: 5%/day, BEGINNER: 4%/day, COMPETENT: 3%/day
PROFICIENT: 2%/day, ADVANCED: 1.5%/day, EXPERT: 1%/day, STRATEGIST: 0.5%/day
```

### Forgetting Curve
```
retention(t) = e^(-decayRate * t)
predictedScore = currentScore * retention(daysElapsed)
```

---

## Verification Plan

### 1. TypeScript Compilation
```bash
cd packages/educational && npx tsc --noEmit
```

### 2. Unit Tests
```bash
cd packages/educational && npm test -- skill-build-track
```

### 3. Prisma Schema Validation
```bash
npx prisma validate
npx prisma generate
```

### 4. Lint Check
```bash
npm run lint
```

---

## Dependencies

- `@sam-ai/core` - SAMConfig, BloomsLevel types
- `zod` - Input validation schemas
- Existing patterns from `competency-engine.ts` and `metacognition-engine.ts`

---

## Notes

- Engine follows existing educational package patterns exactly
- Portable design (in-memory stores by default, Prisma optional)
- Integrates with existing SkillTracker/SkillAssessor (doesn't duplicate)
- All new Prisma fields use safe patterns (optional or with defaults)

---

*Created: January 2025*
*Status: IMPLEMENTATION IN PROGRESS*
