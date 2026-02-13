/**
 * Creator Analytics Stage Prompts
 *
 * Builder functions for each AI-powered stage of the PRISM creator pipeline.
 * Stages 3-6 use AI for interpretation; Stages 1-2 are pure computation.
 */

import 'server-only';

import type {
  CohortCognitiveAnalysis,
  ContentQualityReport,
  CreatorAnalysisDepth,
  CreatorDataSnapshot,
  RootCauseAnalysis,
  StagePrompt,
} from './agentic-types';
import {
  PRISM_CREATOR_SYSTEM_PROMPT,
  ROI_FORMULA,
  PRESCRIPTION_PRIORITY_GUIDE,
} from './prism-system-prompt';

// =============================================================================
// STAGE 3: CONTENT & ASSESSMENT QUALITY
// =============================================================================

export function buildStage3Prompt(
  snapshot: CreatorDataSnapshot,
  cohortAnalysis: CohortCognitiveAnalysis,
  depth: CreatorAnalysisDepth
): StagePrompt {
  const contentLines = snapshot.contentCompletion
    .map(
      (c) =>
        `  ${c.chapterTitle}: ${c.completionRate}% completion`
    )
    .join('\n');

  const examLines = snapshot.examPerformance
    .map(
      (e) =>
        `  Exam ${e.examId}: avg ${e.avgScore}%, pass rate ${e.passRate}%, ${e.totalAttempts} attempts`
    )
    .join('\n');

  const misconceptionLines = snapshot.misconceptionFrequencies
    .slice(0, 10)
    .map(
      (m) =>
        `  ${m.name} (${m.category}): ${m.frequency} occurrences, ${m.affectedStudents} students`
    )
    .join('\n');

  const userPrompt = `Analyze content and assessment quality for this course.

## Course: ${snapshot.courseName}
Enrolled: ${snapshot.enrollment.totalEnrolled} students
Active: ${snapshot.enrollment.activeCount}

## Content Completion by Chapter
${contentLines || '  No chapter data available'}

## Exam Performance
${examLines || '  No exam data available'}

## Cohort Bloom's Distribution
${Object.entries(cohortAnalysis.bloomsDistribution)
  .map(([level, data]) => `  ${level}: ${data.studentCount} students (${data.percentage}%)`)
  .join('\n')}

## DIAGNOSE Data
Average accuracy: ${snapshot.avgDiagnoseAccuracy}%
Average depth: ${snapshot.avgDiagnoseDepth}%
Total evaluations: ${snapshot.totalDiagnoseRecords}

## Top Misconceptions
${misconceptionLines || '  None detected'}

## Cohort Health
Bimodal: ${cohortAnalysis.isBimodal ? 'YES' : 'No'}
${cohortAnalysis.bimodalDescription ?? ''}
Fragile Knowledge: ${cohortAnalysis.fragileKnowledgeAlarm.percentage}% of cohort

RESPOND ONLY WITH VALID JSON matching this schema:
{
  "moduleAnalysis": [
    {
      "moduleId": "string",
      "moduleName": "string",
      "achievementRate": 0-100,
      "engagementLevel": "high" | "medium" | "low",
      "issues": ["string"]
    }
  ],
  "assessmentAnalysis": [
    {
      "examId": "string",
      "discriminationIndex": 0-1,
      "difficultyBalance": "string",
      "bloomsAlignmentScore": 0-100,
      "issues": ["string"]
    }
  ],
  "overallAlignmentScore": 0-100,
  "arrowPhaseCoverage": {
    "Acquire": 0-100,
    "Reinforce": 0-100,
    "Reflect": 0-100,
    "Optimize": 0-100,
    "Widen": 0-100
  }
}`;

  return {
    systemPrompt: PRISM_CREATOR_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: depth === 'deep_dive' ? 2000 : 1200,
    temperature: 0.3,
  };
}

// =============================================================================
// STAGE 4: ROOT CAUSE & RISK ANALYSIS
// =============================================================================

export function buildStage4Prompt(
  snapshot: CreatorDataSnapshot,
  cohortAnalysis: CohortCognitiveAnalysis,
  contentQuality: ContentQualityReport,
  depth: CreatorAnalysisDepth
): StagePrompt {
  const userPrompt = `Identify root causes of student outcomes and predict risks.

## Course: ${snapshot.courseName}
Enrolled: ${snapshot.enrollment.totalEnrolled}
Dropped: ${snapshot.enrollment.droppedCount}

## Cohort Health Score: ${cohortAnalysis.cohortHealthScore}/100
Bimodal: ${cohortAnalysis.isBimodal ? 'YES' : 'No'}
Velocity: ${cohortAnalysis.cohortVelocity} levels/month

## Engagement Distribution
${Object.entries(cohortAnalysis.engagementDistribution)
  .map(([tier, data]) => `  ${tier}: ${data.count} (${data.percentage}%)`)
  .join('\n')}

## Dropout Risk
High risk: ${cohortAnalysis.dropoutRisk.highRiskCount}
Medium risk: ${cohortAnalysis.dropoutRisk.mediumRiskCount}

## Content Quality
Overall alignment: ${contentQuality.overallAlignmentScore}%
Modules with issues: ${contentQuality.moduleAnalysis.filter((m) => m.issues.length > 0).length}
Assessments with issues: ${contentQuality.assessmentAnalysis.filter((a) => a.issues.length > 0).length}

## ARROW Phase Coverage
${Object.entries(contentQuality.arrowPhaseCoverage)
  .map(([phase, pct]) => `  ${phase}: ${pct}%`)
  .join('\n')}

## Fragile Knowledge Alarm
${cohortAnalysis.fragileKnowledgeAlarm.isAlarming ? 'ALARMING' : 'Normal'}: ${cohortAnalysis.fragileKnowledgeAlarm.percentage}% of cohort

## Top Misconceptions
${snapshot.misconceptionFrequencies
  .slice(0, 5)
  .map((m) => `  ${m.name}: ${m.frequency} occurrences`)
  .join('\n') || '  None detected'}

KEY PRINCIPLE: If 60%+ students fail at the same point, it's CONTENT not STUDENT.

RESPOND ONLY WITH VALID JSON matching this schema:
{
  "rootCauses": [
    {
      "category": "CONTENT" | "PEDAGOGY" | "ASSESSMENT" | "STUDENT" | "SYSTEM",
      "symptom": "string",
      "causalChain": ["string (why → why → why → root)"],
      "rootCause": "string",
      "confidence": 0-1,
      "affectedStudents": number
    }
  ],
  "dropoutPredictions": [
    {
      "riskLevel": "high" | "medium" | "low",
      "studentCount": number,
      "predictedTimeframe": "string",
      "interventionWindow": "string"
    }
  ],
  "cohortTrajectory": {
    "withIntervention": "string (predicted outcome if prescriptions are followed)",
    "withoutIntervention": "string (predicted outcome if no action taken)"
  }
}`;

  return {
    systemPrompt: PRISM_CREATOR_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: depth === 'deep_dive' ? 2500 : 1500,
    temperature: 0.3,
  };
}

// =============================================================================
// STAGE 5: PRESCRIPTION ENGINE
// =============================================================================

export function buildStage5Prompt(
  snapshot: CreatorDataSnapshot,
  cohortAnalysis: CohortCognitiveAnalysis,
  rootCauseAnalysis: RootCauseAnalysis,
  depth: CreatorAnalysisDepth
): StagePrompt {
  const userPrompt = `Generate prescriptions for course improvement.

## Course: ${snapshot.courseName}
Enrolled: ${snapshot.enrollment.totalEnrolled}
Cohort Health: ${cohortAnalysis.cohortHealthScore}/100

## Root Causes Identified
${rootCauseAnalysis.rootCauses
  .map(
    (rc) =>
      `  [${rc.category}] ${rc.symptom} → Root: ${rc.rootCause} (confidence: ${Math.round(rc.confidence * 100)}%, affects ${rc.affectedStudents} students)`
  )
  .join('\n')}

## Cohort Trajectory
With intervention: ${rootCauseAnalysis.cohortTrajectory.withIntervention}
Without intervention: ${rootCauseAnalysis.cohortTrajectory.withoutIntervention}

## Bimodal Distribution
${cohortAnalysis.isBimodal ? `YES: ${cohortAnalysis.bimodalDescription}` : 'No bimodal pattern detected'}

## Exam Performance
${snapshot.examPerformance
  .map((e) => `  Exam ${e.examId}: avg ${e.avgScore}%, pass ${e.passRate}%`)
  .join('\n') || '  No exam data'}

## ROI Formula
${ROI_FORMULA}

## Priority Guide
${PRESCRIPTION_PRIORITY_GUIDE}

RESPOND ONLY WITH VALID JSON matching this schema:
{
  "prescriptions": [
    {
      "priority": 1-5,
      "title": "string",
      "description": "string (what to do)",
      "why": "string (why it works, linked to root cause)",
      "effortLevel": "low" | "medium" | "high",
      "expectedImpact": "low" | "medium" | "high",
      "reach": 0-100,
      "roi": number,
      "arrowPhase": "Acquire" | "Reinforce" | "Reflect" | "Optimize" | "Widen",
      "verificationMethod": "string (how to verify the prescription worked)",
      "suggestedActions": ["string"]
    }
  ],
  "assessmentRedesign": [
    {
      "examId": "string",
      "issue": "string",
      "suggestion": "string"
    }
  ],
  "cohortSplittingStrategy": "string (only if bimodal, null otherwise)"
}

RULES:
- Maximum 5 prescriptions, priority-ordered
- Include ROI for each
- Prescribe at ROOT CAUSE level, not symptom level
- Assessment redesign only for exams with identified issues`;

  return {
    systemPrompt: PRISM_CREATOR_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: depth === 'deep_dive' ? 2500 : 1500,
    temperature: 0.3,
  };
}

// =============================================================================
// STAGE 6: REPORT GENERATION
// =============================================================================

export function buildStage6Prompt(
  snapshot: CreatorDataSnapshot,
  cohortAnalysis: CohortCognitiveAnalysis,
  contentQuality: ContentQualityReport,
  rootCauseAnalysis: RootCauseAnalysis,
  prescriptions: {
    prescriptions: Array<{
      priority: number;
      title: string;
      description: string;
      roi: number;
    }>;
  },
  depth: CreatorAnalysisDepth
): StagePrompt {
  const userPrompt = `Generate a creator-friendly PRISM analytics report.

## Course: ${snapshot.courseName}
Enrolled: ${snapshot.enrollment.totalEnrolled}
Active: ${snapshot.enrollment.activeCount}
Completed: ${snapshot.enrollment.completedCount}
Dropped: ${snapshot.enrollment.droppedCount}

## Cohort Health: ${cohortAnalysis.cohortHealthScore}/100
Velocity: ${cohortAnalysis.cohortVelocity} levels/month
Bimodal: ${cohortAnalysis.isBimodal ? 'YES' : 'No'}
At-Risk Students: ${cohortAnalysis.dropoutRisk.totalAtRisk}
Fragile Knowledge: ${cohortAnalysis.fragileKnowledgeAlarm.percentage}%

## Content Quality
Overall Alignment: ${contentQuality.overallAlignmentScore}%
ARROW Coverage: ${Object.entries(contentQuality.arrowPhaseCoverage)
    .map(([p, v]) => `${p}:${v}%`)
    .join(', ')}

## Root Causes (${rootCauseAnalysis.rootCauses.length})
${rootCauseAnalysis.rootCauses.map((rc) => `- [${rc.category}] ${rc.rootCause}`).join('\n')}

## Prescriptions (${prescriptions.prescriptions.length})
${prescriptions.prescriptions.map((p) => `${p.priority}. ${p.title} (ROI: ${p.roi})`).join('\n')}

## Trajectory
With intervention: ${rootCauseAnalysis.cohortTrajectory.withIntervention}
Without: ${rootCauseAnalysis.cohortTrajectory.withoutIntervention}

RESPOND ONLY WITH VALID JSON matching this schema:
{
  "title": "string (e.g., 'Course Health Report: [Course Name]')",
  "summary": "string (2-3 sentence overview, lead with what's working)",
  "sections": [
    {
      "heading": "string",
      "content": "string (markdown formatted, professional tone)"
    }
  ],
  "keyMetrics": [
    {
      "label": "string",
      "value": "string",
      "trend": "up" | "down" | "stable"
    }
  ],
  "nextSteps": ["string (specific actions, 3-5 items)"]
}

RULES:
- Lead with what's WORKING before what's broken
- Professional, data-driven tone
- Quantify everything
- For ${depth === 'deep_dive' ? 'deep dive' : 'standard'} depth
- Key metrics should include: Cohort Health, Active Rate, Completion Rate, At-Risk Count
- Sections: Overview, Cohort Cognitive Health, Content Quality, Root Causes, Prescriptions`;

  return {
    systemPrompt: PRISM_CREATOR_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: depth === 'deep_dive' ? 2500 : 1500,
    temperature: 0.4,
  };
}
