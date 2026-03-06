# Course Depth Analyzer

## What It Does
Performs comprehensive multi-framework quality analysis of course content,
identifying issues in cognitive depth, pedagogical alignment, content flow,
and accessibility. Produces actionable fix recommendations with evidence
chains. Operates as a fully agentic pipeline with goal tracking, checkpoint/
resume, memory recall, and healing loops.

## When to Use
- Teacher wants to evaluate course quality before publishing
- Teacher asks about Bloom's taxonomy distribution or cognitive depth
- Teacher wants to find content gaps, quality issues, or alignment problems
- Teacher asks "how good is my course" or "analyze my course"
- After course creation (auto-triggered for quality assurance)
- Teacher wants to compare analysis results across versions

## Capabilities
- 5-framework cognitive analysis (Bloom's, Webb's DOK, SOLO, Fink, Marzano)
- Pedagogical quality assessment (Gagne's 9 Events, Constructive Alignment)
- Content flow and prerequisite validation across chapters
- Assessment-objective alignment checking
- QM and OLC compliance evaluation
- Accessibility and readability scoring (Flesch-Kincaid, WCAG)
- Issue tracking with fix workflow (OPEN > IN_PROGRESS > RESOLVED)
- Cross-analysis learning (recalls patterns from prior analyses)
- Checkpoint/resume on failure with mid-chapter recovery
- Agentic decision-making (deep-dive, heal, reanalyze, skip)
- 4 analysis modes: quick (~30s), standard (~2min), deep (~5min), comprehensive (~10min)

## Required Information
1. Course ID - which course to analyze (or course name for lookup)
2. Analysis mode - quick/standard/deep/comprehensive (default: standard)
3. Framework focus - which frameworks to evaluate against (default: Bloom's + DOK + Gagne + QM)
4. Focus areas - specific concerns to prioritize (optional)

## Output
- Overall quality score (0-100) with sub-scores per dimension
- Per-chapter analysis with Bloom's distribution and framework scores
- Prioritized issue list with evidence, impact, and fix recommendations
- Knowledge flow map and consistency analysis across chapters
- Stored in CourseDepthAnalysisV3 with SAM Goal + ExecutionPlan tracking
