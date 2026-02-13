# Bloom's Exam Builder

## What It Does
Designs exams targeting specific cognitive levels using Bloom's Taxonomy.
Every question is a diagnostic tool that reveals WHERE and at WHICH
COGNITIVE LEVEL a student's understanding breaks down.

## When to Use
- User wants to create an exam, quiz, or test
- User asks to assess student understanding
- User needs diagnostic assessment for a topic
- User mentions Bloom's taxonomy, cognitive levels, or learning assessment

## Capabilities
- 5-stage pipeline: Topic Decomposition, Distribution Planning,
  Question Generation, Assembly & Balancing, Rubric Generation
- 4 exam purpose profiles: diagnostic, mastery, placement, research-readiness
- 6 Bloom's levels with level-specific reasoning and distractor logic
- Quality scoring with retry (threshold 60, max 3 attempts)
- Cognitive Profile Template for post-exam student analysis
- Self-validation: Bloom's accuracy, distractor quality, clarity,
  independence, level purity

## Required Information
1. Topic (what the exam covers)
2. Subtopics (specific areas, or auto-decompose)
3. Student level (novice / intermediate / advanced / research)
4. Exam purpose (diagnostic / mastery / placement / research-readiness)
5. Bloom's distribution (auto or custom percentages)
6. Question count (5-50)
7. Time limit
8. Question formats (MCQ, short answer, long answer, design problem, code)

## Output
- Exam with questions saved to database (Exam + ExamQuestion + EnhancedQuestion)
- ExamBloomsProfile with target and actual distributions
- Cognitive Profile Template for post-exam analysis
- Reasoning traces and diagnostic notes per question
- Remediation map per Bloom's level
- SAM Goal and ExecutionPlan tracking
