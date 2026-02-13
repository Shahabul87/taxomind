/**
 * NAVIGATOR AI Prompt Builders
 *
 * Builds prompts for stages 2-5 of the NAVIGATOR pipeline.
 * Each stage builds on the previous stage's output to prevent hallucination.
 */

import type {
  NavigatorCollectedParams,
  NavigatorDataSnapshot,
  NeedAnalysisResult,
  SkillAuditResult,
  ValidationResult,
  GapAnalysis,
  PathArchitecture,
} from './agentic-types';
import { GOAL_TYPE_LABELS, DEADLINE_LABELS, DEADLINE_WEEKS } from './agentic-types';
import { serializeDataSnapshot } from './helpers';

// =============================================================================
// STAGE 2: Need Analysis + Skill Audit
// =============================================================================

export function buildStage2Prompt(
  params: NavigatorCollectedParams,
  snapshot: NavigatorDataSnapshot,
): string {
  const deadlineWeeks = DEADLINE_WEEKS[params.deadline];

  return `STUDENT INPUT:
- Skill: ${params.skillName}
- Goal Outcome: "${params.goalOutcome}"
- Goal Type: ${params.goalType} (${GOAL_TYPE_LABELS[params.goalType]})
- Self-Reported Current Level: ${params.currentLevel}
- Target Level: ${params.targetLevel}
- Hours/Week: ${params.hoursPerWeek}
- Deadline: ${DEADLINE_LABELS[params.deadline] ?? params.deadline}${deadlineWeeks ? ` (${deadlineWeeks} weeks)` : ''}

EXISTING USER DATA:
${serializeDataSnapshot(snapshot)}

TASK: Perform Need Analysis + Skill Audit.

Return JSON with this EXACT structure:
{
  "needAnalysis": {
    "goalDNA": {
      "depthNeeded": "shallow|moderate|deep|expert",
      "speedNeeded": "relaxed|moderate|aggressive|urgent",
      "breadthNeeded": "narrow|moderate|broad"
    },
    "refinedGoal": {
      "original": "${params.goalOutcome}",
      "refined": "A sharper, measurable version of the goal",
      "measurableOutcomes": ["Specific outcome 1", "Specific outcome 2", "Specific outcome 3"]
    },
    "goalClassification": "${params.goalType}",
    "constraints": {
      "totalHoursAvailable": ${deadlineWeeks ? params.hoursPerWeek * deadlineWeeks : params.hoursPerWeek * 52},
      "weeklyHours": ${params.hoursPerWeek},
      "deadlineWeeks": ${deadlineWeeks ?? 'null'},
      "hardDeadline": ${deadlineWeeks !== null && deadlineWeeks <= 13}
    },
    "learningContext": {
      "hasExistingKnowledge": ${!!snapshot.existingSkillProfile},
      "hasPlatformHistory": ${snapshot.enrollmentHistory.length > 0},
      "previousAttempts": ${snapshot.existingSkillProfile?.totalSessions ?? 0},
      "preferredStyle": "${params.learningStyle}"
    }
  },
  "skillAudit": {
    "overallAssessment": "1-2 sentence summary of the student's current state",
    "bloomsAssessments": [
      {
        "dimension": "Name of a specific skill dimension (e.g., 'Python Syntax', 'Data Structures')",
        "currentLevel": "NOVICE|BEGINNER|COMPETENT|PROFICIENT|ADVANCED|EXPERT|STRATEGIST",
        "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
        "confidence": "verified|estimated|self_reported",
        "evidence": "What data supports this assessment"
      }
    ],
    "fragileKnowledge": [
      {
        "skillDimension": "Dimension name",
        "claimedLevel": "What user claims",
        "estimatedActualLevel": "What data suggests",
        "evidence": "Why we suspect fragility",
        "risk": "low|medium|high"
      }
    ],
    "strengths": ["Strength 1", "Strength 2"],
    "gapsIdentified": ["Gap 1", "Gap 2"]
  }
}

RULES:
- Generate 4-8 bloomsAssessments covering key dimensions of ${params.skillName}
- If user data exists, use it to verify self-reported level. If no data, mark as "self_reported"
- Flag fragile knowledge where claimed level seems inconsistent with evidence
- Be realistic about gaps - don't inflate or deflate
- Strengths should reference specific evidence when available`;
}

// =============================================================================
// STAGE 3: Validate + Skill Graph
// =============================================================================

export function buildStage3Prompt(
  params: NavigatorCollectedParams,
  needAnalysis: NeedAnalysisResult,
  skillAudit: SkillAuditResult,
): string {
  const deadlineWeeks = DEADLINE_WEEKS[params.deadline];
  const totalHoursAvailable = needAnalysis.constraints.totalHoursAvailable;

  return `CONTEXT FROM STAGE 2:
Goal: ${needAnalysis.refinedGoal.refined}
Goal DNA: depth=${needAnalysis.goalDNA.depthNeeded}, speed=${needAnalysis.goalDNA.speedNeeded}, breadth=${needAnalysis.goalDNA.breadthNeeded}
Current assessment: ${skillAudit.overallAssessment}
Gaps identified: ${skillAudit.gapsIdentified.join(', ')}
Strengths: ${skillAudit.strengths.join(', ')}
Fragile knowledge: ${skillAudit.fragileKnowledge.map((f) => f.skillDimension).join(', ') || 'None detected'}
Hours available: ${totalHoursAvailable}h total, ${params.hoursPerWeek}h/week
Deadline: ${deadlineWeeks ? `${deadlineWeeks} weeks` : 'Flexible'}

SKILL: ${params.skillName}
FROM: ${params.currentLevel} TO: ${params.targetLevel}

TASK: Perform feasibility check and build a skill graph.

Return JSON with this EXACT structure:
{
  "validation": {
    "feasibility": {
      "feasible": true,
      "totalHoursNeeded": <number>,
      "totalHoursAvailable": ${totalHoursAvailable},
      "utilizationPercent": <number>,
      "verdict": "1-2 sentence feasibility verdict",
      "reframingOptions": ["Option if not feasible"]
    },
    "skillGraph": {
      "nodes": [
        {
          "id": "skill_1",
          "name": "Specific sub-skill name",
          "layer": "foundation|core|applied|advanced|meta",
          "type": "BLOCKER|ACCELERATOR|CORE|OPTIONAL|PARALLEL",
          "currentLevel": "Current Bloom's/proficiency",
          "targetLevel": "Target Bloom's/proficiency",
          "estimatedHours": <number>,
          "dependencies": ["skill_ids this depends on"],
          "enablesSkills": ["skill_ids this enables"]
        }
      ],
      "criticalPath": ["skill_1", "skill_2", "...ordered IDs of critical path"],
      "parallelGroups": [["skill_3", "skill_4"], ["skill_5", "skill_6"]],
      "totalNodes": <number>,
      "blockerCount": <number>,
      "acceleratorCount": <number>
    },
    "milestones": [
      {
        "id": "ms_1",
        "title": "Milestone title",
        "description": "What the student achieves",
        "exitRamp": "What usable skill they have if they stop here",
        "skillsCovered": ["skill_1", "skill_2"],
        "estimatedHours": <number>,
        "verificationCriteria": ["How to verify completion"]
      }
    ]
  }
}

RULES:
- Create 8-15 skill nodes covering ${params.skillName} comprehensively
- BLOCKER nodes: prerequisite skills that block everything (e.g., basic syntax)
- ACCELERATOR nodes: skills that make learning others faster (e.g., debugging, reading docs)
- Layer hierarchy: foundation -> core -> applied -> advanced -> meta
- Dependencies must reference valid node IDs
- Create 3-5 progressive milestones with meaningful exit ramps
- If not feasible, still provide the full graph but explain reframing options
- Total hours across nodes should approximately match totalHoursNeeded`;
}

// =============================================================================
// STAGE 4: Gap Analysis + Path Architecture
// =============================================================================

export function buildStage4Prompt(
  params: NavigatorCollectedParams,
  skillAudit: SkillAuditResult,
  validation: ValidationResult,
): string {
  const deadlineWeeks = DEADLINE_WEEKS[params.deadline];
  const nodes = validation.skillGraph.nodes;
  const milestones = validation.milestones;

  return `CONTEXT FROM STAGES 2-3:
Skill: ${params.skillName} (${params.currentLevel} -> ${params.targetLevel})
Hours/Week: ${params.hoursPerWeek}
Deadline: ${deadlineWeeks ? `${deadlineWeeks} weeks` : 'Flexible'}
Goal Type: ${params.goalType} (${GOAL_TYPE_LABELS[params.goalType]})

SKILL GRAPH (${nodes.length} nodes):
${nodes.map((n) => `  ${n.id}: ${n.name} [${n.layer}/${n.type}] ${n.currentLevel}->${n.targetLevel} ~${n.estimatedHours}h deps:[${n.dependencies.join(',')}]`).join('\n')}

Critical Path: ${validation.skillGraph.criticalPath.join(' -> ')}

MILESTONES (${milestones.length}):
${milestones.map((m) => `  ${m.id}: ${m.title} (~${m.estimatedHours}h) Skills: [${m.skillsCovered.join(',')}]`).join('\n')}

BLOOMS ASSESSMENTS:
${skillAudit.bloomsAssessments.map((a) => `  ${a.dimension}: ${a.currentLevel} @ ${a.bloomsLevel} (${a.confidence})`).join('\n')}

TASK: Perform gap analysis and architect the learning path.

Return JSON with this EXACT structure:
{
  "gapAnalysis": {
    "gapTable": [
      {
        "skillDimension": "Dimension from skill graph",
        "currentLevel": "Current level",
        "targetLevel": "Target level",
        "gap": "Brief gap description",
        "action": "SKIP|VERIFY|STRENGTHEN|LEARN|HEAVY_LEARN",
        "estimatedHours": <number>,
        "priority": "critical|high|medium|low"
      }
    ],
    "totalGapHours": <number>,
    "criticalGaps": ["Names of critical gaps"]
  },
  "pathArchitecture": {
    "phases": [
      {
        "phaseNumber": 1,
        "title": "Phase title",
        "description": "2-3 sentences: what and why",
        "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
        "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
        "estimatedHours": <number>,
        "durationWeeks": <number>,
        "skills": ["skill node names covered"],
        "weeklyRhythm": [
          {
            "weekNumber": 1,
            "theme": "Week theme",
            "activities": {
              "learn": ["Learning activities"],
              "build": ["Build activities"],
              "review": ["Review activities"]
            },
            "hoursPlanned": <number>
          }
        ],
        "exitRamp": "What usable skill the student has if they stop after this phase"
      }
    ],
    "contingencyPlans": [
      {
        "scenario": "1 week behind",
        "trigger": "What triggers this plan",
        "action": "What to do",
        "adjustments": ["Specific adjustments"]
      }
    ],
    "totalWeeks": <number>,
    "totalHours": <number>,
    "timeSplit": {
      "learn": 60,
      "build": 20,
      "review": 20
    }
  }
}

RULES:
- Apply 7 architecture principles: Blockers First, Accelerators Early, Spiral, Theory-Practice Interleave, Strategic Depth, Buffer+Review, Exit Ramps
- Each phase should have 2-4 weeks of weekly rhythm
- Every 4th week should be review/consolidation
- Time split approximately 60% learn, 20% build, 20% review
- Bloom's levels must progress (never decrease across phases)
- Difficulty must progress (never decrease)
- Create 2-3 contingency plans for falling behind
- Each phase exit ramp must describe a USABLE skill, not just knowledge
- Create 3-6 phases depending on the gap size`;
}

// =============================================================================
// STAGE 5: Resource Optimization + Checkpoints
// =============================================================================

export function buildStage5Prompt(
  params: NavigatorCollectedParams,
  gapAnalysis: GapAnalysis,
  pathArchitecture: PathArchitecture,
  validation: ValidationResult,
): string {
  const phases = pathArchitecture.phases;

  return `CONTEXT FROM STAGES 2-4:
Skill: ${params.skillName} (${params.currentLevel} -> ${params.targetLevel})
Goal Type: ${params.goalType} (${GOAL_TYPE_LABELS[params.goalType]})
Total Gap Hours: ${gapAnalysis.totalGapHours}
Critical Gaps: ${gapAnalysis.criticalGaps.join(', ')}

PHASES (${phases.length}):
${phases.map((p) => `  Phase ${p.phaseNumber}: "${p.title}" [${p.bloomsLevel}/${p.difficulty}] ~${p.estimatedHours}h/${p.durationWeeks}w Skills: [${p.skills.join(', ')}]`).join('\n')}

MILESTONES:
${validation.milestones.map((m) => `  ${m.id}: ${m.title} - Exit: ${m.exitRamp}`).join('\n')}

TASK: Optimize resources and design checkpoints.

Return JSON with this EXACT structure:
{
  "resourceMap": {
    "resources": [
      {
        "phaseNumber": 1,
        "courseTitle": "Course: Specific Topic - Learning Outcome",
        "courseDescription": "60-100 words describing what the student will learn, key topics, and practical application",
        "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
        "estimatedHours": <number>,
        "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
        "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
        "reason": "Why this course at this point in the journey"
      }
    ],
    "totalSuggestedCourses": <number>
  },
  "checkpointDesign": {
    "checkpoints": [
      {
        "milestoneId": "ms_1",
        "milestoneTitle": "Milestone title",
        "checkpoint": {
          "knowledgeCheck": "Question or task to verify knowledge retention",
          "buildCheck": "Small project or exercise to verify practical skills",
          "explainCheck": "Prompt to explain a concept in own words",
          "transferCheck": "Task requiring applying knowledge to a new context"
        },
        "exitRampDescription": "Detailed description of what usable skill the student has if they stop here"
      }
    ],
    "motivationArchitecture": {
      "firstWeekWin": "Specific achievable win in week 1 that demonstrates value",
      "biWeeklyWows": ["Wow moment at week 2", "Wow moment at week 4"],
      "postHardTopicWins": ["Easy win after a difficult section"]
    }
  }
}

RULES:
- Generate 2-3 courses per phase (${phases.length} phases)
- Course titles MUST follow format: "[Topic]: [Specific Focus] - [Learning Outcome]"
- Course descriptions must be 60-100 words with specific outcomes
- Difficulty should match the phase difficulty
- Each milestone gets exactly 1 checkpoint with all 4 verification types
- First week win must be achievable within 5-10 hours
- Bi-weekly wows should celebrate concrete achievements
- Post-hard-topic wins provide psychological relief`;
}

// =============================================================================
// JSON EXTRACTION HELPER
// =============================================================================

export function extractJsonFromAIResponse(text: string): string {
  // Remove markdown code blocks
  let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Find JSON boundaries
  const jsonStart = clean.indexOf('{');
  const jsonEnd = clean.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    clean = clean.slice(jsonStart, jsonEnd + 1);
  }

  return clean;
}
