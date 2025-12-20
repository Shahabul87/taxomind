# Initiative 4.1: Planner-Executor Architecture

**Timeline**: Weeks 37-42 (6 weeks)
**Budget**: $75,000
**Dependencies**: Phase 2 (Context Enhancement), Phase 3 (Quality Gates)

---

## 📋 Overview

### Problem Statement

Current SAM operates in **reactive single-turn mode**: student asks a question, SAM generates a response. This works well for simple queries but fails for complex problems requiring:

- **Multi-step reasoning**: "Teach me how to build a recommendation system" requires planning across data structures, algorithms, ML, deployment
- **Progressive disclosure**: Breaking complex topics into digestible chunks
- **Error recovery**: Re-planning when initial approach doesn't work
- **Goal tracking**: Monitoring progress toward learning objectives

**Example of Current Limitation**:
```
Student: "I want to learn how to build a web scraper in Python"

Current SAM (Phase 3): [Generates comprehensive tutorial in one response]
- 2000+ words covering requests, BeautifulSoup, error handling, ethics
- Overwhelming for beginners
- No adaptation to student's actual progress
- No verification of understanding between concepts
```

### Solution

Implement a **Planner-Executor Architecture** that:

1. **Planner Agent**: Analyzes query complexity, breaks into sub-goals, creates execution plan
2. **Executor Agent**: Executes plan steps, monitors progress, handles errors
3. **Re-planner**: Adapts plan based on student responses and difficulties
4. **Progress Tracker**: Maintains state across multi-turn interactions

### Impact

- **80%+ success rate** on complex multi-step problems (vs. 45% currently)
- **+40% engagement duration** with guided learning journeys
- **70% completion rate** for multi-step learning paths (vs. 30% single-turn dropout)
- **+50% student satisfaction** with complex topic explanations

---

## 🎯 Success Criteria

### Technical Metrics
- **Planning Speed**: <2s for complex query analysis and plan generation
- **Plan Quality**: >85% of plans execute successfully without re-planning
- **Execution Success**: 80%+ of multi-step plans reach completion
- **Re-planning Speed**: <1s to adapt plan based on student response
- **State Management**: 100% conversation state persistence across sessions

### Quality Metrics
- **Plan Coherence**: >90% of plans are logically sound (validated by pedagogy evaluator)
- **Step Granularity**: Average 3-7 steps per complex query (not too coarse, not too fine)
- **Prerequisite Coverage**: 95%+ of plans verify prerequisites before advanced concepts
- **Error Handling**: <5% of plan failures due to unhandled errors

### UX Metrics
- **Student Understanding**: >4.5/5 rating on "SAM broke down complex topics well"
- **Perceived Intelligence**: >4.7/5 rating on "SAM seemed to understand my learning journey"
- **Completion Rate**: 70%+ students complete multi-step learning paths
- **Time to Proficiency**: -30% time to master complex topics vs. single-turn

### Business Metrics
- **Session Duration**: +40% for complex topics
- **Return Rate**: +25% students return for next learning step
- **Premium Conversion**: +20% for users experiencing planner-executor
- **NPS Impact**: +15 points from users on complex learning journeys

---

## 🏗️ Architecture Design

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Student Query                               │
│  "I want to learn how to build a recommendation system"         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Query Complexity Analyzer                      │
│  • Identifies multi-step requirement                            │
│  • Detects prerequisite needs                                   │
│  • Estimates learning time                                      │
│  • Triggers planner if complexity > threshold                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Planner Agent                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Goal Decomposer                                       │  │
│  │    • Breaks query into sub-goals                         │  │
│  │    • Creates learning objective hierarchy                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. Prerequisite Checker                                  │  │
│  │    • Validates student readiness                         │  │
│  │    • Adds prerequisite steps if needed                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. Sequence Optimizer                                    │  │
│  │    • Orders steps for optimal learning                   │  │
│  │    • Applies scaffolding principles                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. Plan Generator                                        │  │
│  │    • Creates executable plan with checkpoints            │  │
│  │    • Estimates time per step                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Learning Plan (JSON)                          │
│  {                                                              │
│    "goal": "Build recommendation system",                       │
│    "prerequisites": ["Python basics", "Data structures"],       │
│    "steps": [                                                   │
│      { "id": 1, "concept": "Collaborative filtering theory" },  │
│      { "id": 2, "concept": "User-item matrix representation"},  │
│      { "id": 3, "concept": "Similarity metrics" },              │
│      { "id": 4, "concept": "Python implementation" }            │
│    ],                                                           │
│    "checkpoints": [2, 4],                                       │
│    "estimated_time": "45 minutes"                               │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Executor Agent                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Current Step: 1                                          │  │
│  │ Action: Teach collaborative filtering theory             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Execution Flow:                                          │  │
│  │  1. Fetch context for current step (RAG + Memory)        │  │
│  │  2. Generate teaching content                            │  │
│  │  3. Present to student                                   │  │
│  │  4. Wait for student response/confirmation               │  │
│  │  5. Evaluate understanding (checkpoint if needed)        │  │
│  │  6. Proceed to next step OR re-plan if struggling        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Progress Monitor                               │
│  • Tracks completed steps: [1, 2]                               │
│  • Current step: 3                                              │
│  • Student performance: 85% comprehension                       │
│  • Time elapsed: 20 minutes / 45 estimated                      │
│  • Status: ON_TRACK                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Re-planner (if needed)                       │
│  Triggers when:                                                 │
│  • Student struggles (comprehension < 60%)                      │
│  • Student requests different approach                          │
│  • Step takes 2x estimated time                                 │
│  • Error in execution                                           │
│                                                                 │
│  Actions:                                                       │
│  • Add remedial steps                                           │
│  • Simplify current step                                        │
│  • Provide alternative explanation                              │
│  • Skip advanced topics if time-constrained                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation

### 1. Query Complexity Analyzer

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface ComplexityAnalysis {
  isComplex: boolean;
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'VERY_COMPLEX';
  requiresPlanning: boolean;
  estimatedSteps: number;
  estimatedTimeMinutes: number;
  reasoning: string;
}

export class QueryComplexityAnalyzer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyze(query: string, studentContext?: string): Promise<ComplexityAnalysis> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Analyze the complexity of this student query and determine if it requires multi-step planning.

QUERY: "${query}"

${studentContext ? `STUDENT CONTEXT: ${studentContext}` : ''}

Classify as:
- SIMPLE: Single concept, direct answer (e.g., "What is a variable?")
- MODERATE: 2-3 related concepts (e.g., "Explain loops and when to use them")
- COMPLEX: Multi-step learning journey (e.g., "How do I build a web scraper?")
- VERY_COMPLEX: Project-level undertaking (e.g., "Teach me machine learning from scratch")

Provide:
1. Complexity level
2. Whether multi-step planning is needed (COMPLEX or VERY_COMPLEX)
3. Estimated number of learning steps
4. Estimated total learning time in minutes
5. Brief reasoning

Format as JSON:
{
  "complexity": "SIMPLE|MODERATE|COMPLEX|VERY_COMPLEX",
  "requiresPlanning": boolean,
  "estimatedSteps": number,
  "estimatedTimeMinutes": number,
  "reasoning": "explanation"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const analysis = JSON.parse(this.extractJSON(responseText));

    return {
      isComplex: analysis.complexity === 'COMPLEX' || analysis.complexity === 'VERY_COMPLEX',
      complexity: analysis.complexity,
      requiresPlanning: analysis.requiresPlanning,
      estimatedSteps: analysis.estimatedSteps,
      estimatedTimeMinutes: analysis.estimatedTimeMinutes,
      reasoning: analysis.reasoning,
    };
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
  }
}
```

---

### 2. Planner Agent

```typescript
interface LearningStep {
  id: number;
  concept: string;
  description: string;
  prerequisite_ids: number[];
  estimated_time_minutes: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  checkpoint: boolean;
}

interface LearningPlan {
  goal: string;
  prerequisites: string[];
  steps: LearningStep[];
  total_estimated_time: number;
  difficulty_progression: 'GRADUAL' | 'STEEP' | 'FLAT';
  plan_id: string;
  created_at: Date;
}

export class PlannerAgent {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async createPlan(
    query: string,
    studentContext: string,
    complexityAnalysis: ComplexityAnalysis
  ): Promise<LearningPlan> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are an expert educational planner. Create a detailed learning plan for this query.

STUDENT QUERY: "${query}"

STUDENT CONTEXT:
${studentContext}

COMPLEXITY ANALYSIS:
- Level: ${complexityAnalysis.complexity}
- Estimated steps: ${complexityAnalysis.estimatedSteps}
- Estimated time: ${complexityAnalysis.estimatedTimeMinutes} minutes

INSTRUCTIONS:
1. Break the learning goal into ${complexityAnalysis.estimatedSteps} clear, sequential steps
2. Each step should be a single, focused concept
3. Apply scaffolding: start with fundamentals, build gradually
4. Verify prerequisites (Python basics, data structures, etc.)
5. Add checkpoints every 2-3 steps for comprehension verification
6. Estimate time for each step (5-15 minutes)
7. Mark difficulty (EASY/MEDIUM/HARD)
8. Ensure gradual difficulty progression

Format as JSON:
{
  "goal": "main learning objective",
  "prerequisites": ["concept1", "concept2"],
  "steps": [
    {
      "id": 1,
      "concept": "Concept name",
      "description": "What student will learn",
      "prerequisite_ids": [],
      "estimated_time_minutes": 10,
      "difficulty": "EASY",
      "checkpoint": false
    }
  ],
  "total_estimated_time": total_minutes,
  "difficulty_progression": "GRADUAL|STEEP|FLAT"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const planData = JSON.parse(this.extractJSON(responseText));

    const plan: LearningPlan = {
      ...planData,
      plan_id: crypto.randomUUID(),
      created_at: new Date(),
    };

    // Validate plan quality
    await this.validatePlan(plan);

    // Store plan in database
    await this.storePlan(plan);

    return plan;
  }

  private async validatePlan(plan: LearningPlan): Promise<void> {
    // Ensure gradual difficulty progression
    const difficulties = plan.steps.map((s) => s.difficulty);
    const hasGradualProgression = this.checkGradualProgression(difficulties);

    if (!hasGradualProgression) {
      throw new Error('Plan does not follow gradual difficulty progression');
    }

    // Ensure checkpoints every 2-3 steps
    const checkpointSteps = plan.steps.filter((s) => s.checkpoint).map((s) => s.id);
    if (checkpointSteps.length < Math.floor(plan.steps.length / 3)) {
      throw new Error('Insufficient checkpoints in plan');
    }

    // Ensure time estimates are reasonable (5-15 min per step)
    const invalidTimes = plan.steps.filter(
      (s) => s.estimated_time_minutes < 5 || s.estimated_time_minutes > 15
    );
    if (invalidTimes.length > 0) {
      throw new Error('Time estimates out of reasonable range');
    }
  }

  private checkGradualProgression(difficulties: string[]): boolean {
    const difficultyMap = { EASY: 1, MEDIUM: 2, HARD: 3 };
    const scores = difficulties.map((d) => difficultyMap[d as keyof typeof difficultyMap]);

    // Check that difficulty doesn't jump more than 1 level
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] - scores[i - 1] > 1) {
        return false; // Difficulty jump too steep
      }
    }

    return true;
  }

  private async storePlan(plan: LearningPlan): Promise<void> {
    await db.learningPlan.create({
      data: {
        id: plan.plan_id,
        goal: plan.goal,
        prerequisites: plan.prerequisites,
        steps: plan.steps as any,
        totalEstimatedTime: plan.total_estimated_time,
        difficultyProgression: plan.difficulty_progression,
        createdAt: plan.created_at,
      },
    });
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
  }
}
```

---

### 3. Executor Agent

```typescript
interface ExecutionState {
  plan_id: string;
  current_step_id: number;
  completed_steps: number[];
  student_comprehension: number; // 0-100
  time_elapsed_minutes: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  last_interaction: Date;
}

interface StepResult {
  step_id: number;
  teaching_content: string;
  comprehension_check?: {
    question: string;
    expected_understanding: string;
  };
  proceed_to_next: boolean;
  needs_replanning: boolean;
}

export class ExecutorAgent {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async executeStep(
    plan: LearningPlan,
    stepId: number,
    state: ExecutionState,
    studentContext: string
  ): Promise<StepResult> {
    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in plan`);
    }

    // Fetch relevant context for this step
    const context = await this.fetchStepContext(step, studentContext);

    // Generate teaching content for this step
    const teachingContent = await this.generateTeachingContent(step, context, state);

    // Determine if checkpoint is needed
    const comprehensionCheck = step.checkpoint
      ? await this.generateComprehensionCheck(step)
      : undefined;

    return {
      step_id: stepId,
      teaching_content: teachingContent,
      comprehension_check: comprehensionCheck,
      proceed_to_next: !step.checkpoint, // Pause at checkpoints
      needs_replanning: false,
    };
  }

  private async fetchStepContext(step: LearningStep, studentContext: string): Promise<string> {
    // Use RAG to fetch relevant course materials
    // Use student memory to personalize
    // Use knowledge graph to find related concepts
    return `Context for ${step.concept}...`;
  }

  private async generateTeachingContent(
    step: LearningStep,
    context: string,
    state: ExecutionState
  ): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `You are teaching step ${step.id} of a multi-step learning plan.

CURRENT STEP:
Concept: ${step.concept}
Description: ${step.description}
Difficulty: ${step.difficulty}
Estimated time: ${step.estimated_time_minutes} minutes

CONTEXT:
${context}

STUDENT PROGRESS:
- Completed steps: ${state.completed_steps.length}
- Current comprehension: ${state.student_comprehension}%
- Time elapsed: ${state.time_elapsed_minutes} minutes

INSTRUCTIONS:
1. Teach ONLY this specific concept (${step.concept})
2. Keep it focused and concise (aim for ${step.estimated_time_minutes} minutes of learning)
3. Use examples appropriate for ${step.difficulty} difficulty
4. Build on previously completed steps
5. End with "Ready to continue?" to let student confirm understanding

Generate the teaching content:`,
        },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  private async generateComprehensionCheck(step: LearningStep): Promise<{
    question: string;
    expected_understanding: string;
  }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: `Generate a comprehension check question for this learning step:

Concept: ${step.concept}
Description: ${step.description}

The question should:
1. Verify understanding of the core concept
2. Be open-ended (not multiple choice)
3. Require applying the concept, not just recalling it
4. Be answerable in 2-3 sentences

Format as JSON:
{
  "question": "the comprehension question",
  "expected_understanding": "what a correct answer should demonstrate"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(this.extractJSON(responseText));
  }

  async evaluateComprehension(
    studentResponse: string,
    comprehensionCheck: { question: string; expected_understanding: string }
  ): Promise<{ score: number; feedback: string; proceed: boolean }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Evaluate this student's comprehension.

QUESTION: ${comprehensionCheck.question}

EXPECTED UNDERSTANDING: ${comprehensionCheck.expected_understanding}

STUDENT RESPONSE: "${studentResponse}"

Provide:
1. Score (0-100) indicating comprehension level
2. Brief feedback
3. Whether to proceed to next step (score >= 60)

Format as JSON:
{
  "score": number,
  "feedback": "brief feedback",
  "proceed": boolean
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(this.extractJSON(responseText));
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
  }
}
```

---

### 4. Re-planner

```typescript
interface ReplanTrigger {
  reason: 'STRUGGLING' | 'TIME_EXCEEDED' | 'STUDENT_REQUEST' | 'ERROR';
  details: string;
}

export class Replanner {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async shouldReplan(state: ExecutionState, plan: LearningPlan): Promise<ReplanTrigger | null> {
    const currentStep = plan.steps.find((s) => s.id === state.current_step_id);
    if (!currentStep) return null;

    // Check 1: Student struggling (comprehension < 60%)
    if (state.student_comprehension < 60) {
      return {
        reason: 'STRUGGLING',
        details: `Student comprehension at ${state.student_comprehension}%`,
      };
    }

    // Check 2: Time exceeded (2x estimated time for current step)
    const expectedTime = currentStep.estimated_time_minutes;
    const actualTime = state.time_elapsed_minutes;
    if (actualTime > expectedTime * 2) {
      return {
        reason: 'TIME_EXCEEDED',
        details: `Step taking ${actualTime}min vs ${expectedTime}min estimated`,
      };
    }

    return null;
  }

  async replan(
    originalPlan: LearningPlan,
    state: ExecutionState,
    trigger: ReplanTrigger
  ): Promise<LearningPlan> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Adapt this learning plan based on student difficulties.

ORIGINAL PLAN:
Goal: ${originalPlan.goal}
Steps: ${JSON.stringify(originalPlan.steps, null, 2)}

CURRENT STATE:
- Current step: ${state.current_step_id}
- Completed: ${state.completed_steps.join(', ')}
- Comprehension: ${state.student_comprehension}%
- Time elapsed: ${state.time_elapsed_minutes} minutes

REPLAN TRIGGER:
Reason: ${trigger.reason}
Details: ${trigger.details}

INSTRUCTIONS:
${this.getReplanInstructions(trigger)}

Generate an updated plan starting from the current step. Keep the same goal but adapt the path.

Format as JSON (same structure as original plan):`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const updatedPlanData = JSON.parse(this.extractJSON(responseText));

    const updatedPlan: LearningPlan = {
      ...updatedPlanData,
      plan_id: crypto.randomUUID(),
      created_at: new Date(),
    };

    await this.storePlanUpdate(originalPlan.plan_id, updatedPlan, trigger);

    return updatedPlan;
  }

  private getReplanInstructions(trigger: ReplanTrigger): string {
    switch (trigger.reason) {
      case 'STRUGGLING':
        return `The student is struggling. Add remedial steps:
1. Simplify current concept into smaller chunks
2. Add concrete examples
3. Reduce difficulty of upcoming steps
4. Add practice exercises`;

      case 'TIME_EXCEEDED':
        return `The student is taking longer than expected:
1. Simplify remaining steps
2. Skip advanced/optional topics
3. Provide summaries instead of deep dives
4. Adjust time estimates realistically`;

      case 'STUDENT_REQUEST':
        return `Student requested a different approach:
1. Respect student's preferred learning style
2. Adjust examples to student's interests
3. Modify pacing as requested`;

      case 'ERROR':
        return `An error occurred in plan execution:
1. Identify problematic step
2. Create alternative path avoiding the error
3. Ensure remaining plan is executable`;

      default:
        return 'Improve the plan based on student feedback';
    }
  }

  private async storePlanUpdate(
    originalPlanId: string,
    updatedPlan: LearningPlan,
    trigger: ReplanTrigger
  ): Promise<void> {
    await db.planUpdate.create({
      data: {
        originalPlanId,
        updatedPlanId: updatedPlan.plan_id,
        trigger: trigger.reason,
        triggerDetails: trigger.details,
        createdAt: new Date(),
      },
    });
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
  }
}
```

---

### 5. Orchestrator (Main Controller)

```typescript
export class PlannerExecutorOrchestrator {
  private complexityAnalyzer: QueryComplexityAnalyzer;
  private planner: PlannerAgent;
  private executor: ExecutorAgent;
  private replanner: Replanner;

  constructor() {
    this.complexityAnalyzer = new QueryComplexityAnalyzer();
    this.planner = new PlannerAgent();
    this.executor = new ExecutorAgent();
    this.replanner = new Replanner();
  }

  async handleQuery(query: string, userId: string, conversationId: string): Promise<string> {
    // Step 1: Analyze complexity
    const studentContext = await this.getStudentContext(userId);
    const complexity = await this.complexityAnalyzer.analyze(query, studentContext);

    // Step 2: Decide if planning is needed
    if (!complexity.requiresPlanning) {
      // Simple query - use standard response flow
      return this.handleSimpleQuery(query, userId);
    }

    // Step 3: Check if there's an existing plan for this conversation
    let plan = await this.getActivePlan(conversationId);

    if (!plan) {
      // Create new plan
      plan = await this.planner.createPlan(query, studentContext, complexity);
      console.log(`Created new plan: ${plan.plan_id} with ${plan.steps.length} steps`);
    }

    // Step 4: Get or initialize execution state
    let state = await this.getExecutionState(conversationId, plan.plan_id);

    if (!state) {
      state = await this.initializeExecutionState(plan, conversationId);
    }

    // Step 5: Execute current step
    const stepResult = await this.executor.executeStep(
      plan,
      state.current_step_id,
      state,
      studentContext
    );

    // Step 6: Update state
    await this.updateExecutionState(state, stepResult);

    // Step 7: Check if re-planning is needed
    const replanTrigger = await this.replanner.shouldReplan(state, plan);
    if (replanTrigger) {
      console.log(`Re-planning triggered: ${replanTrigger.reason}`);
      plan = await this.replanner.replan(plan, state, replanTrigger);
      state = await this.initializeExecutionState(plan, conversationId);
    }

    // Step 8: Format response
    return this.formatResponse(stepResult, state, plan);
  }

  private async handleSimpleQuery(query: string, userId: string): Promise<string> {
    // Delegate to standard SAM response flow (Phase 3)
    return 'Simple query response...';
  }

  private async getStudentContext(userId: string): Promise<string> {
    // Fetch from student memory system
    const memory = await db.studentMemory.findUnique({ where: { userId } });
    return memory ? JSON.stringify(memory) : '';
  }

  private async getActivePlan(conversationId: string): Promise<LearningPlan | null> {
    const planRecord = await db.conversationPlan.findFirst({
      where: {
        conversationId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    return planRecord?.plan as LearningPlan | null;
  }

  private async initializeExecutionState(
    plan: LearningPlan,
    conversationId: string
  ): Promise<ExecutionState> {
    const state: ExecutionState = {
      plan_id: plan.plan_id,
      current_step_id: plan.steps[0].id,
      completed_steps: [],
      student_comprehension: 80, // Initial assumption
      time_elapsed_minutes: 0,
      status: 'IN_PROGRESS',
      last_interaction: new Date(),
    };

    await db.executionState.create({
      data: {
        conversationId,
        ...state,
      },
    });

    return state;
  }

  private async getExecutionState(
    conversationId: string,
    planId: string
  ): Promise<ExecutionState | null> {
    const record = await db.executionState.findFirst({
      where: {
        conversationId,
        plan_id: planId,
      },
    });

    return record as ExecutionState | null;
  }

  private async updateExecutionState(
    state: ExecutionState,
    stepResult: StepResult
  ): Promise<void> {
    // Update state based on step result
    if (stepResult.proceed_to_next && !stepResult.comprehension_check) {
      state.completed_steps.push(stepResult.step_id);
      state.current_step_id = stepResult.step_id + 1;
    }

    state.last_interaction = new Date();

    await db.executionState.update({
      where: { plan_id: state.plan_id },
      data: state,
    });
  }

  private formatResponse(stepResult: StepResult, state: ExecutionState, plan: LearningPlan): string {
    const progressBar = this.generateProgressBar(state, plan);

    let response = `${progressBar}\n\n${stepResult.teaching_content}\n\n`;

    if (stepResult.comprehension_check) {
      response += `**Checkpoint Question**: ${stepResult.comprehension_check.question}\n\n`;
      response += `(Please answer to continue to the next step)`;
    } else {
      response += `Ready to continue to the next step?`;
    }

    return response;
  }

  private generateProgressBar(state: ExecutionState, plan: LearningPlan): string {
    const totalSteps = plan.steps.length;
    const completedSteps = state.completed_steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    const filled = '█'.repeat(Math.floor(percentage / 10));
    const empty = '░'.repeat(10 - Math.floor(percentage / 10));

    return `**Learning Progress**: [${filled}${empty}] ${percentage}% (Step ${state.current_step_id} of ${totalSteps})`;
  }
}
```

---

## 📊 Database Schema

```prisma
// Learning Plan
model LearningPlan {
  id                    String   @id @default(uuid())
  goal                  String
  prerequisites         Json
  steps                 Json     // Array of LearningStep objects
  totalEstimatedTime    Int
  difficultyProgression String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  conversationPlans ConversationPlan[]
  executionStates   ExecutionState[]
  planUpdates       PlanUpdate[]       @relation("OriginalPlan")
}

// Links conversation to active plan
model ConversationPlan {
  id             String   @id @default(uuid())
  conversationId String
  planId         String
  status         String   @default("ACTIVE") // ACTIVE, COMPLETED, ABANDONED
  createdAt      DateTime @default(now())

  plan LearningPlan @relation(fields: [planId], references: [id])

  @@index([conversationId, status])
}

// Execution state tracking
model ExecutionState {
  id                    String   @id @default(uuid())
  conversationId        String   @unique
  planId                String
  currentStepId         Int
  completedSteps        Json     // Array of step IDs
  studentComprehension  Int      // 0-100
  timeElapsedMinutes    Int
  status                String   // IN_PROGRESS, COMPLETED, FAILED, PAUSED
  lastInteraction       DateTime
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  plan LearningPlan @relation(fields: [planId], references: [id])

  @@index([conversationId])
  @@index([planId])
}

// Plan update history (for re-planning)
model PlanUpdate {
  id              String   @id @default(uuid())
  originalPlanId  String
  updatedPlanId   String
  trigger         String   // STRUGGLING, TIME_EXCEEDED, STUDENT_REQUEST, ERROR
  triggerDetails  String
  createdAt       DateTime @default(now())

  originalPlan LearningPlan @relation("OriginalPlan", fields: [originalPlanId], references: [id])

  @@index([originalPlanId])
}
```

---

## 📈 Metrics & Monitoring

### Prometheus Metrics

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Planning metrics
export const planningDuration = new Histogram({
  name: 'planner_planning_duration_seconds',
  help: 'Time taken to generate learning plan',
  labelNames: ['complexity'],
  buckets: [0.5, 1, 2, 5, 10],
  registers: [register],
});

export const planQuality = new Gauge({
  name: 'planner_plan_quality_score',
  help: 'Quality score of generated plans (0-100)',
  labelNames: ['complexity'],
  registers: [register],
});

export const plansCreated = new Counter({
  name: 'planner_plans_created_total',
  help: 'Total number of learning plans created',
  labelNames: ['complexity'],
  registers: [register],
});

// Execution metrics
export const stepExecutionDuration = new Histogram({
  name: 'executor_step_execution_seconds',
  help: 'Time to execute a learning step',
  labelNames: ['step_id', 'difficulty'],
  buckets: [5, 10, 15, 30, 60],
  registers: [register],
});

export const stepCompletionRate = new Gauge({
  name: 'executor_step_completion_rate',
  help: 'Percentage of students completing each step',
  labelNames: ['step_id'],
  registers: [register],
});

export const comprehensionScore = new Histogram({
  name: 'executor_comprehension_score',
  help: 'Student comprehension scores at checkpoints',
  labelNames: ['step_id'],
  buckets: [0, 20, 40, 60, 80, 100],
  registers: [register],
});

// Re-planning metrics
export const replansTriggered = new Counter({
  name: 'replanner_replans_triggered_total',
  help: 'Total number of re-plans triggered',
  labelNames: ['trigger_reason'],
  registers: [register],
});

export const replanSuccessRate = new Gauge({
  name: 'replanner_success_rate',
  help: 'Success rate of re-planned learning paths',
  registers: [register],
});

// Overall metrics
export const planSuccessRate = new Gauge({
  name: 'planner_executor_success_rate',
  help: 'Percentage of plans that reach completion',
  registers: [register],
});

export const avgTimeToCompletion = new Histogram({
  name: 'planner_executor_time_to_completion_minutes',
  help: 'Time for students to complete multi-step plans',
  buckets: [10, 20, 30, 45, 60, 90, 120],
  registers: [register],
});
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { QueryComplexityAnalyzer } from './complexity-analyzer';
import { PlannerAgent } from './planner';
import { ExecutorAgent } from './executor';

describe('QueryComplexityAnalyzer', () => {
  let analyzer: QueryComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new QueryComplexityAnalyzer();
  });

  it('should classify simple queries correctly', async () => {
    const result = await analyzer.analyze('What is a variable?');
    expect(result.complexity).toBe('SIMPLE');
    expect(result.requiresPlanning).toBe(false);
  });

  it('should classify complex queries correctly', async () => {
    const result = await analyzer.analyze('How do I build a web scraper in Python?');
    expect(result.complexity).toBe('COMPLEX');
    expect(result.requiresPlanning).toBe(true);
    expect(result.estimatedSteps).toBeGreaterThan(3);
  });

  it('should classify very complex queries', async () => {
    const result = await analyzer.analyze('Teach me machine learning from scratch');
    expect(result.complexity).toBe('VERY_COMPLEX');
    expect(result.estimatedSteps).toBeGreaterThan(7);
  });
});

describe('PlannerAgent', () => {
  let planner: PlannerAgent;

  beforeEach(() => {
    planner = new PlannerAgent();
  });

  it('should create valid learning plan', async () => {
    const complexity = {
      isComplex: true,
      complexity: 'COMPLEX' as const,
      requiresPlanning: true,
      estimatedSteps: 5,
      estimatedTimeMinutes: 45,
      reasoning: 'Multi-step learning required',
    };

    const plan = await planner.createPlan(
      'How do I build a recommendation system?',
      'Student knows Python basics',
      complexity
    );

    expect(plan.steps.length).toBeGreaterThan(3);
    expect(plan.goal).toContain('recommendation');
    expect(plan.total_estimated_time).toBeGreaterThan(0);
  });

  it('should ensure gradual difficulty progression', async () => {
    const plan = await planner.createPlan(
      'Explain neural networks',
      'Student knows Python',
      {
        isComplex: true,
        complexity: 'COMPLEX',
        requiresPlanning: true,
        estimatedSteps: 4,
        estimatedTimeMinutes: 40,
        reasoning: 'Complex topic',
      }
    );

    const difficulties = plan.steps.map((s) => s.difficulty);

    // First step should be EASY or MEDIUM
    expect(['EASY', 'MEDIUM']).toContain(difficulties[0]);

    // No jumps from EASY to HARD
    for (let i = 1; i < difficulties.length; i++) {
      if (difficulties[i - 1] === 'EASY') {
        expect(difficulties[i]).not.toBe('HARD');
      }
    }
  });
});
```

---

## 💰 Budget Breakdown

### Engineering Costs: $52,000
- **Senior ML Engineer** (4 weeks × $12,000/week): $48,000
  - Complexity analyzer implementation
  - Planner agent development
  - Executor agent development
  - Re-planner logic
- **QA Engineer** (2 weeks × $2,000/week): $4,000
  - Multi-step plan testing
  - Edge case validation

### Infrastructure Costs: $18,000
- **Claude API** (high-volume planning): $12,000
- **Database** (plan storage, state management): $4,000
- **Monitoring** (Prometheus, Grafana): $2,000

### Third-Party Services: $5,000
- **LangGraph** (agent orchestration): $3,000
- **Testing Tools** (plan validation): $2,000

**Total Initiative Budget**: **$75,000**

---

## 🎯 Acceptance Criteria

Initiative 4.1 is complete when:

1. ✅ **Complexity Analyzer**: Correctly classifies 90%+ queries as SIMPLE/MODERATE/COMPLEX/VERY_COMPLEX
2. ✅ **Planner Agent**: Generates valid learning plans with <2s latency
3. ✅ **Executor Agent**: Executes steps with proper state management
4. ✅ **Re-planner**: Triggers correctly when students struggle
5. ✅ **Plan Quality**: >85% of plans execute successfully without re-planning
6. ✅ **Completion Rate**: 70%+ students complete multi-step learning paths
7. ✅ **Student Satisfaction**: >4.5/5 on "SAM broke down complex topics well"
8. ✅ **Performance**: <200ms overhead for orchestration
9. ✅ **Production Deployment**: All components deployed and monitored
10. ✅ **Documentation**: Complete system docs and runbooks

---

## 🚀 Next Steps

After completing Initiative 4.1:
- **Initiative 4.2**: Tool Registry & Orchestration (combine planner with executable tools)
- **Initiative 4.3**: Socratic Questioning Engine (guide discovery instead of teaching)
- **Initiative 4.4**: Multi-Agent Collaboration (coordinate specialized agents)

---

*This planner-executor architecture transforms SAM from reactive single-turn responses into autonomous multi-step learning journey orchestration.*
