# NAVIGATOR Skill Builder

## What It Does
Strategic 6-stage skill roadmap generation using the NAVIGATOR framework.
Goes beyond simple roadmap creation — performs deep need analysis, skill auditing
with Bloom's taxonomy, gap detection, dependency-aware skill graph construction,
and time-mapped learning path architecture with contingency plans and exit ramps.

## When to Use
- User wants to build a skill roadmap or learning path
- User mentions career switch, job preparation, or skill development planning
- User wants to learn a new skill from scratch or advance expertise
- User asks for a strategic learning plan with milestones
- User mentions gap analysis or skill assessment
- User wants a personalized roadmap based on their current knowledge
- User asks "how do I learn X" or "build me a roadmap for Y"
- User wants to go from beginner to expert in a topic

## Capabilities
- 6-stage NAVIGATOR pipeline: Data Collection, Need Analysis, Skill Audit, Validation, Gap Analysis, Path Architecture, Resource Optimization, Checkpoints
- Goal type classification (career switch, job interview, research, build product, hobby, job requirement, teaching)
- Bloom's taxonomy skill auditing per dimension
- Fragile knowledge detection (claimed vs actual proficiency)
- Dependency-aware skill graph with BLOCKER/ACCELERATOR/CORE/OPTIONAL nodes
- Feasibility checking against available hours and deadline
- Gap overlay with action prescription (SKIP/VERIFY/STRENGTHEN/LEARN/HEAVY_LEARN)
- Time-mapped path with 60-20-20 learn/build/review split
- Weekly rhythm scheduling with monthly review weeks
- Contingency plans for falling behind
- Exit ramps at each milestone (usable skill if student stops)
- Platform course matching against existing catalog
- Checkpoint design with 4 verification types (knowledge, build, explain, transfer)
- Motivation architecture (first-week wins, bi-weekly wows)
- SAM Goal and ExecutionPlan tracking
- Memory persistence for future tutor context

## Required Information
1. Skill name (what to learn)
2. Goal outcome (what they want to be able to do)
3. Goal type (career switch, hobby, etc.)
4. Current proficiency level
5. Hours per week available
6. Deadline preference
7. Confirmation to begin

## Output
- SkillBuildRoadmap with enriched targetOutcome (need profile, skill graph summary)
- SkillBuildRoadmapMilestones with resources (exit ramps, checkpoints, contingency plans)
- Skill graph (nodes, critical path, blockers, accelerators)
- Gap analysis (gap table, critical gaps, total gap hours)
- Path architecture (phases, weekly rhythm, time split)
- SAM Goal + ExecutionPlan for tracking
- Memory persistence to KnowledgeGraph and SessionContext
