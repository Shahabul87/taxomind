/**
 * Agentic Depth Analysis - AI Prompt Templates
 *
 * Expert persona + analysis methodology prompts for each stage.
 */

import type { AnalysisFramework } from '../types';

// =============================================================================
// COGNITIVE DEPTH PROMPT (Stage 2)
// =============================================================================

export function buildCognitiveDepthPrompt(
  chapterTitle: string,
  sectionSummaries: string,
  frameworks: AnalysisFramework[]
): string {
  const frameworkInstructions = frameworks.map(f => {
    switch (f) {
      case 'blooms': return 'Bloom\'s Revised Taxonomy (Anderson & Krathwohl 2001): Classify each section\'s dominant cognitive level (REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE).';
      case 'dok': return 'Webb\'s Depth of Knowledge: Rate each section (1=Recall, 2=Skill/Concept, 3=Strategic Thinking, 4=Extended Thinking).';
      case 'solo': return 'SOLO Taxonomy: Rate each section (prestructural, unistructural, multistructural, relational, extended_abstract).';
      case 'fink': return 'Fink\'s Significant Learning: Identify which dimensions are addressed (foundational, application, integration, human, caring, learning_how_to_learn).';
      case 'marzano': return 'Marzano\'s New Taxonomy: Classify (retrieval, comprehension, analysis, utilization).';
      default: return '';
    }
  }).filter(Boolean).join('\n');

  return `You are Dr. Sarah Chen, an expert instructional designer with CPLP certification and 15 years of experience in educational quality assessment.

Analyze the following chapter for COGNITIVE DEPTH across multiple frameworks.

## Chapter: "${chapterTitle}"

## Sections:
${sectionSummaries}

## Frameworks to Evaluate:
${frameworkInstructions}

## Instructions:
1. For EACH section, determine the dominant cognitive level in each requested framework
2. Compute the overall Bloom's distribution as percentages (must sum to 100)
3. Identify sections that are significantly below the expected cognitive level for the course

Respond with ONLY valid JSON in this exact format:
{
  "bloomsDistribution": { "REMEMBER": 15, "UNDERSTAND": 25, "APPLY": 25, "ANALYZE": 20, "EVALUATE": 10, "CREATE": 5 },
  "dokScore": 65,
  "soloScore": 60,
  "finkScore": 55,
  "marzanoScore": 60,
  "sections": [
    {
      "sectionTitle": "...",
      "position": 1,
      "bloomsLevel": "UNDERSTAND",
      "dokLevel": 2,
      "estimatedMinutes": 10,
      "frameworkScores": { "blooms": 60, "dok": 65 }
    }
  ],
  "insights": "Brief analysis of cognitive depth strengths and weaknesses"
}`;
}

// =============================================================================
// PEDAGOGICAL QUALITY PROMPT (Stage 3)
// =============================================================================

export function buildPedagogicalPrompt(
  chapterTitle: string,
  sectionSummaries: string
): string {
  return `You are Dr. Sarah Chen, an expert in instructional design methodology.

Analyze the following chapter for PEDAGOGICAL QUALITY using Gagne's Nine Events of Instruction and Constructive Alignment principles.

## Chapter: "${chapterTitle}"

## Sections:
${sectionSummaries}

## Gagne's Nine Events to Check:
1. Gain Attention - Is there a hook or motivating opening?
2. Inform Objectives - Are learning goals clearly stated?
3. Stimulate Prior Knowledge - Does it connect to what learners already know?
4. Present Content - Is the core material well-organized?
5. Provide Guidance - Are there examples, analogies, or scaffolding?
6. Elicit Performance - Are there practice opportunities?
7. Provide Feedback - Is there a mechanism for learners to check understanding?
8. Assess Performance - Is there a formal assessment?
9. Enhance Retention - Are there summary, transfer, or application activities?

## Constructive Alignment Check:
- Do stated objectives match the content taught?
- Do assessments measure what the objectives promise?
- Is there a logical progression from objectives through content to assessment?

Respond with ONLY valid JSON:
{
  "gagneEvents": [
    { "event": "Gain Attention", "present": true, "quality": "strong", "evidence": "Opens with real-world scenario" },
    { "event": "Inform Objectives", "present": true, "quality": "weak", "evidence": "Listed but vague" },
    { "event": "Stimulate Prior Knowledge", "present": false, "quality": "missing" }
  ],
  "constructiveAlignmentScore": 72,
  "alignmentIssues": ["Objectives mention 'analyze' but content only covers recall-level material"],
  "pedagogicalStrengths": ["Good use of examples"],
  "pedagogicalWeaknesses": ["No practice activities"]
}`;
}

// =============================================================================
// FLOW ANALYSIS PROMPT (Stage 4)
// =============================================================================

export function buildFlowAnalysisPrompt(
  chapterTitle: string,
  currentContent: string,
  priorChaptersSummary: string
): string {
  return `You are Dr. Sarah Chen, analyzing CONTENT FLOW and PREREQUISITES.

## Current Chapter: "${chapterTitle}"
${currentContent}

## Prior Chapters:
${priorChaptersSummary || 'This is the first chapter.'}

## Analyze:
1. PREREQUISITES: List concepts this chapter assumes the learner knows. For each, indicate:
   - SATISFIED: Concept was taught in a prior chapter
   - MISSING: Concept is assumed but never taught
   - ASSUMED: Concept is basic enough to assume
2. FLOW: Does the content build logically from section to section?
3. TRANSITIONS: Are there clear connections between topics?
4. TIME: Estimate time per section (ideal: 10-20 minutes each)

Respond with ONLY valid JSON:
{
  "flowScore": 75,
  "prerequisites": [
    { "concept": "Variables", "status": "SATISFIED" },
    { "concept": "Functions", "status": "MISSING" }
  ],
  "transitionQuality": "moderate",
  "timeEstimates": [
    { "section": "Intro", "estimatedMinutes": 8, "optimal": true }
  ],
  "flowIssues": ["Jump from basic to advanced without scaffolding in section 3"]
}`;
}
