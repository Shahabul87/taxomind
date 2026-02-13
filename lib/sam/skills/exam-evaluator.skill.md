# DIAGNOSE Exam Evaluator

## What It Does
Deep diagnostic evaluation using the 7-layer DIAGNOSE framework.
Does not just grade answers right or wrong — reverse-engineers the
student's THINKING PROCESS, diagnoses cognitive gaps at specific
Bloom's levels, and generates actionable improvement pathways.

## When to Use
- User wants their exam evaluated or graded
- User asks about their exam performance or results
- User wants to understand what they got wrong and why
- User asks for feedback on their answers
- User mentions cognitive diagnosis, learning gaps, or improvement plan
- User wants to evaluate or review an exam attempt
- User asks "how did I do on my exam"

## Capabilities
- 7-layer DIAGNOSE framework: Detect, Identify, Assess, Gap-Map, Name, Outline, Score, Echo-Back
- Reasoning path classification (expert/fragile/partial/wrong_model/guessing)
- Triple accuracy assessment (factual + logical + structural)
- Gap-mapping to exact cognitive breakdown points
- Misconception taxonomy (19 named misconceptions across 4 categories)
- Multidimensional scoring (5 dimensions, Bloom's-specific rubrics)
- Echo-back teaching for top 3 most impactful questions
- Full Cognitive Profile Report generation
- Improvement Roadmap with ARROW phase prescriptions

## Required Information
1. Exam attempt ID (which exam attempt to evaluate)
2. Evaluation mode (quick_grade / standard / deep_diagnostic)
3. Options (gap mapping, echo-back, misconception identification)

## Output
- Per-answer DIAGNOSE diagnosis saved to AIEvaluationRecord
- Cognitive Profile (Bloom's map, ceiling, growth edge, reasoning distribution)
- Improvement Roadmap (priority interventions, verification questions)
- Echo-back teaching for top 3 impactful questions
- CognitiveSkillProgress updates per Bloom's level
- SAM Goal and ExecutionPlan tracking
