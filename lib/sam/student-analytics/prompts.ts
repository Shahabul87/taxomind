/**
 * Student Analytics Stage Prompts
 *
 * Builder functions for each AI-powered stage of the PRISM pipeline.
 * Stages 3-5 use AI for interpretation; Stages 1-2 are pure computation.
 */

import 'server-only';

import type {
  BloomsCognitiveMap,
  PerformanceSnapshot,
  StagePrompt,
  AnalysisDepth,
  CognitiveCluster,
} from './agentic-types';
import { PRISM_STUDENT_SYSTEM_PROMPT, COGNITIVE_CLUSTER_DESCRIPTIONS } from './prism-system-prompt';

// =============================================================================
// STAGE 3: INTERPRETIVE ANALYSIS
// =============================================================================

export function buildStage3Prompt(
  snapshot: PerformanceSnapshot,
  cognitiveMap: BloomsCognitiveMap,
  depth: AnalysisDepth
): StagePrompt {
  const masteryLines = Object.entries(cognitiveMap.levelMastery)
    .map(([level, data]) => `  ${level}: ${data.score}% (${data.status}, ${data.skillCount} skills)`)
    .join('\n');

  const reasoningLines = Object.entries(cognitiveMap.reasoningDistribution)
    .filter(([, pct]) => pct > 0)
    .map(([path, pct]) => `  ${path}: ${pct}%`)
    .join('\n');

  const examSummary = snapshot.examAttempts.length > 0
    ? `Exam attempts: ${snapshot.examAttempts.length}, avg score: ${Math.round(
        snapshot.examAttempts.reduce((s, e) => s + (e.scorePercentage ?? 0), 0) /
          snapshot.examAttempts.length
      )}%`
    : 'No exam attempts in this period';

  const userPrompt = `Analyze this student's cognitive state and classify them into a cognitive cluster.

## Pre-computed Bloom's Cognitive Map
${masteryLines}

Cognitive Ceiling: ${cognitiveMap.cognitiveCeiling}
Growth Edge: ${cognitiveMap.growthEdge}
Velocity: ${cognitiveMap.velocity} levels/month
Cognitive Health Score: ${cognitiveMap.cognitiveHealthScore}/100

## Reasoning Path Distribution
${reasoningLines || '  No DIAGNOSE data available'}

## Fragile Knowledge
Count: ${cognitiveMap.fragileKnowledgeCount}
Percentage: ${cognitiveMap.fragileKnowledgePercentage}%

## Assessment Summary
${examSummary}
DIAGNOSE records: ${snapshot.diagnoseRecords.length}

## Engagement Summary
Sessions: ${snapshot.engagement.totalSessions}
Total study time: ${snapshot.engagement.totalDurationMinutes} minutes
Current streak: ${snapshot.engagement.currentStreak} days
Enrolled courses: ${snapshot.engagement.enrolledCourses}
Active courses: ${snapshot.engagement.activeCourses}
Overdue reviews: ${snapshot.engagement.spacedRepetitionDueCount}

## Declining Concepts
${cognitiveMap.decliningConcepts.length > 0 ? cognitiveMap.decliningConcepts.join(', ') : 'None'}

## Improving Concepts
${cognitiveMap.improvingConcepts.length > 0 ? cognitiveMap.improvingConcepts.join(', ') : 'None'}

## Cognitive Cluster Options
${Object.entries(COGNITIVE_CLUSTER_DESCRIPTIONS)
  .map(([key, desc]) => `- ${key}: ${desc.label} — ${desc.prescriptionFocus}`)
  .join('\n')}

RESPOND ONLY WITH VALID JSON matching this schema:
{
  "cognitiveCluster": "fast_starter" | "slow_but_deep" | "inconsistent_engager" | "surface_skimmer" | "self_directed_expert",
  "clusterDescription": "string (2-3 sentences explaining WHY this cluster fits)",
  "patternInsights": ["string (3-5 insights about WHY patterns exist)"],
  "strengthSummary": "string (what the student does well, be specific and encouraging)",
  "gapSummary": "string (where improvement is needed, be honest but constructive)",
  "keyFinding": "string (the single most important insight for this student)"
}`;

  const maxTokens = depth === 'deep_analysis' ? 1500 : 800;

  return {
    systemPrompt: PRISM_STUDENT_SYSTEM_PROMPT,
    userPrompt,
    maxTokens,
    temperature: 0.4,
  };
}

// =============================================================================
// STAGE 4: PRESCRIPTIONS & ALERTS
// =============================================================================

export function buildStage4Prompt(
  cognitiveMap: BloomsCognitiveMap,
  interpretiveAnalysis: {
    cognitiveCluster: CognitiveCluster;
    gapSummary: string;
    patternInsights: string[];
  },
  snapshot: PerformanceSnapshot,
  depth: AnalysisDepth
): StagePrompt {
  const clusterInfo = COGNITIVE_CLUSTER_DESCRIPTIONS[interpretiveAnalysis.cognitiveCluster];

  const userPrompt = `Generate prescriptions and alerts for this student based on their cognitive analysis.

## Student Profile
Cognitive Cluster: ${interpretiveAnalysis.cognitiveCluster} (${clusterInfo?.label ?? 'Unknown'})
Cluster Prescription Focus: ${clusterInfo?.prescriptionFocus ?? 'General improvement'}
Cluster Risks: ${clusterInfo?.risks?.join(', ') ?? 'None identified'}

## Gap Summary
${interpretiveAnalysis.gapSummary}

## Key Insights
${interpretiveAnalysis.patternInsights.join('\n')}

## Bloom's Cognitive Map
Cognitive Ceiling: ${cognitiveMap.cognitiveCeiling}
Growth Edge: ${cognitiveMap.growthEdge}
Velocity: ${cognitiveMap.velocity} levels/month
Health Score: ${cognitiveMap.cognitiveHealthScore}/100

## Alert Triggers
- Fragile Knowledge: ${cognitiveMap.fragileKnowledgePercentage}% (alert if > 20%)
- Declining Concepts: ${cognitiveMap.decliningConcepts.length} (alert if > 0)
- Overdue Reviews: ${snapshot.engagement.spacedRepetitionDueCount} (alert if > 5)
- Current Streak: ${snapshot.engagement.currentStreak} days
- Last Study Date: ${snapshot.engagement.lastStudyDate?.toISOString() ?? 'Never'}

## ARROW Phases Reference
- Acquire: First exposure (lectures, readings)
- Reinforce: Practice and repetition (exercises, flashcards)
- Reflect: Self-assessment and metacognition
- Optimize: Efficiency improvement (timed practice)
- Widen: Transfer to new contexts (projects)

RESPOND ONLY WITH VALID JSON matching this schema:
{
  "alerts": [
    {
      "severity": "critical" | "warning" | "info",
      "title": "string",
      "description": "string",
      "actionRequired": true | false
    }
  ],
  "prescriptions": [
    {
      "priority": 1,
      "title": "string",
      "description": "string (what to do)",
      "why": "string (why it works for this cluster)",
      "effortLevel": "low" | "medium" | "high",
      "expectedImpact": "low" | "medium" | "high",
      "arrowPhase": "Acquire" | "Reinforce" | "Reflect" | "Optimize" | "Widen",
      "suggestedActions": ["string (specific actionable steps)"]
    }
  ]
}

RULES:
- Maximum 3-5 alerts (avoid alert fatigue)
- Maximum 3-5 prescriptions, priority-ordered
- Each prescription must be achievable within 1-2 weeks
- Reference ARROW phases where applicable
- Effort and impact must be realistic for a student`;

  const maxTokens = depth === 'deep_analysis' ? 2000 : 1200;

  return {
    systemPrompt: PRISM_STUDENT_SYSTEM_PROMPT,
    userPrompt,
    maxTokens,
    temperature: 0.3,
  };
}

// =============================================================================
// STAGE 5: REPORT GENERATION
// =============================================================================

export function buildStage5Prompt(
  cognitiveMap: BloomsCognitiveMap,
  interpretiveAnalysis: {
    cognitiveCluster: CognitiveCluster;
    clusterDescription: string;
    strengthSummary: string;
    gapSummary: string;
    keyFinding: string;
  },
  prescriptions: {
    alerts: Array<{ severity: string; title: string; description: string }>;
    prescriptions: Array<{
      priority: number;
      title: string;
      description: string;
      suggestedActions: string[];
    }>;
  },
  snapshot: PerformanceSnapshot,
  depth: AnalysisDepth
): StagePrompt {
  const userPrompt = `Generate a student-friendly PRISM analytics report.

## Student Summary
Cognitive Cluster: ${interpretiveAnalysis.cognitiveCluster}
${interpretiveAnalysis.clusterDescription}

## Cognitive Map
Ceiling: ${cognitiveMap.cognitiveCeiling}
Growth Edge: ${cognitiveMap.growthEdge}
Velocity: ${cognitiveMap.velocity} levels/month
Health Score: ${cognitiveMap.cognitiveHealthScore}/100
Fragile Knowledge: ${cognitiveMap.fragileKnowledgePercentage}%

## What's Going Well
${interpretiveAnalysis.strengthSummary}

## Where to Improve
${interpretiveAnalysis.gapSummary}

## Key Finding
${interpretiveAnalysis.keyFinding}

## Alerts (${prescriptions.alerts.length})
${prescriptions.alerts.map((a) => `- [${a.severity}] ${a.title}: ${a.description}`).join('\n')}

## Prescriptions (${prescriptions.prescriptions.length})
${prescriptions.prescriptions.map((p) => `${p.priority}. ${p.title}: ${p.description}`).join('\n')}

## Engagement Stats
Sessions: ${snapshot.engagement.totalSessions}
Study time: ${snapshot.engagement.totalDurationMinutes} min
Streak: ${snapshot.engagement.currentStreak} days
Courses: ${snapshot.engagement.activeCourses} active / ${snapshot.engagement.enrolledCourses} enrolled

## DIAGNOSE Data
Exam attempts: ${snapshot.examAttempts.length}
DIAGNOSE evaluations: ${snapshot.diagnoseRecords.length}

RESPOND ONLY WITH VALID JSON matching this schema:
{
  "title": "string (e.g., 'Your Learning Progress Report')",
  "summary": "string (2-3 sentence overview, lead with wins)",
  "sections": [
    {
      "heading": "string",
      "content": "string (markdown formatted, student-friendly)"
    }
  ],
  "verificationQuestions": [
    {
      "concept": "string (the concept being tested)",
      "question": "string (a question to verify understanding)"
    }
  ],
  "nextSteps": ["string (specific next actions, 3-5 items)"]
}

RULES:
- Lead with WINS before gaps (motivational framing)
- Use encouraging but honest tone
- Sections should include: Cognitive Profile, Strengths, Growth Opportunities, Recommendations
- For ${depth === 'deep_analysis' ? 'deep analysis' : 'standard'} depth: ${depth === 'deep_analysis' ? 'include detailed breakdowns per Bloom&apos;s level' : 'keep sections concise'}
- Verification questions should test areas where fragile knowledge was detected
- Next steps should be specific and actionable`;

  const maxTokens = depth === 'deep_analysis' ? 2500 : 1500;

  return {
    systemPrompt: PRISM_STUDENT_SYSTEM_PROMPT,
    userPrompt,
    maxTokens,
    temperature: 0.5,
  };
}
