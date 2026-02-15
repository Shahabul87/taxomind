# AI Course Creator

## What It Does
Creates complete, pedagogically-structured courses using the ARROW framework
with Bloom's taxonomy alignment, Chapter DNA Templates, and domain-specific
expertise across 15 subject categories. Operates as a fully agentic pipeline
with intelligent quality feedback, memory recall, self-critique, and adaptive
strategy optimization.

## When to Use
- User asks to create/build/generate a course
- User is in course-architect mode
- User says "make me a course about X"
- User wants to create educational content or curriculum
- User needs a course outline or learning path for a subject

## Capabilities
- 3-15 chapters with learning objectives and Bloom's progression
- Depth-first pipeline (complete each chapter fully before next)
- Chapter DNA Templates (beginner/intermediate/advanced)
- 15 domain-specific category enhancers
- Quality gates with intelligent feedback-driven retry (not blind retry)
- Self-critique analyzes reasoning quality without extra AI calls
- Memory recall from prior courses for cross-referencing and consistency
- Adaptive strategy adjusts temperature, tokens, retries based on performance
- Checkpoint/resume on failure with mid-chapter recovery
- Cross-chapter concept consistency tracking (ConceptTracker)
- SSE streaming with real-time thinking extraction

## Required Information
1. Course name
2. Subject area
3. Target audience (beginners, professionals, students, career changers)
4. Difficulty level (beginner / intermediate / advanced / expert)
5. Bloom's taxonomy focus (which cognitive levels to target)
6. Number of chapters (3-15)
7. Preferred content types (video, reading, assignment, quiz, project, discussion)

## Output
Course record with chapters, sections, and details in database.
SAM Goal + ExecutionPlan for progress tracking.
Quality scores with feedback-driven improvement on every generated item.
