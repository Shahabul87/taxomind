# Initiative 4.3: Socratic Questioning Engine

**Timeline**: Weeks 47-48 (2 weeks)
**Budget**: $50,000
**Dependencies**: Initiative 4.1 (Planner-Executor), Phase 3 (Pedagogical Evaluators)

---

## 📋 Overview

### Problem Statement

Current SAM **provides direct answers**: when students ask questions, SAM explains the solution. While helpful for quick learning, this approach has significant pedagogical limitations:

- **Passive learning**: Students receive answers without engaging in discovery
- **Shallow understanding**: Explaining without questioning doesn&apos;t build deep comprehension
- **Missed critical thinking**: Students don&apos;t develop problem-solving skills
- **Dependency**: Students rely on SAM for answers instead of learning to think independently
- **No metacognition**: Students don&apos;t reflect on their own thinking process

**Current Limitation Example**:
```
Student: "Why doesn't my sorting algorithm work?"

Current SAM (Phase 3):
"Your algorithm has a bug on line 5. You're comparing i < n instead of
i < n-1, which causes an index out of bounds error. Here's the corrected code..."

Result:
✅ Problem solved quickly
❌ Student didn't discover the bug themselves
❌ No deeper understanding of why the bug occurred
❌ Won't learn to debug similar issues independently
```

### Solution

Implement a **Socratic Questioning Engine** that guides students to discover answers through carefully crafted questions:

1. **Question Generator**: Creates probing, leading, and counter-example questions
2. **Dialogue Planner**: Plans multi-turn Socratic dialogues with learning checkpoints
3. **Hint System**: Provides progressive hints when students are stuck
4. **Understanding Tracker**: Monitors student comprehension through dialogue
5. **Transition Logic**: Knows when to switch from Socratic mode to direct teaching

### Impact

- **75%+ Socratic engagement** (students actively participate in discovery dialogues)
- **70%+ discovery rate** (students discover answers vs. being told)
- **+60% deeper understanding** measured by follow-up question complexity
- **+50% problem-solving transfer** (apply learning to new problems)
- **>4.8/5 student satisfaction** with guided discovery approach

---

## 🎯 Success Criteria

### Technical Metrics
- **Question Generation Speed**: <1s to generate Socratic question
- **Dialogue Coherence**: >90% of multi-turn dialogues remain on-topic
- **Hint Progression Quality**: >85% of hint sequences lead to discovery
- **Transition Accuracy**: >90% correct decisions on when to switch modes

### Quality Metrics
- **Question Quality**: >4.5/5 rating on "questions helped me think"
- **Discovery Success**: 70%+ students discover answers (vs. giving up)
- **Engagement Depth**: Average 4-6 dialogue turns per discovery
- **Pedagogical Soundness**: >90% questions align with Socratic principles

### UX Metrics
- **Student Satisfaction**: >4.8/5 for Socratic mode experience
- **Aha Moments**: 60%+ students report breakthrough understanding
- **Frustration Rate**: <15% students frustrated (vs. 40% with pure Socratic)
- **Completion Rate**: 80%+ dialogues reach successful conclusion

### Business Metrics
- **Engagement Duration**: +55% session length with Socratic dialogues
- **Retention**: +30% for students experiencing Socratic teaching
- **Premium Conversion**: +35% for users who complete Socratic journeys
- **NPS Impact**: +22 points from Socratic mode users

---

## 🏗️ Architecture Design

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   Student Query                                 │
│  "Why doesn't my sorting algorithm work?"                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│             Socratic Mode Decision Engine                       │
│                                                                 │
│  Should we use Socratic method?                                 │
│  ✓ Problem-solving question (not pure factual)                  │
│  ✓ Student has prerequisite knowledge                           │
│  ✓ Discovery would be valuable learning                         │
│  ✓ Student hasn't opted out of Socratic mode                    │
│                                                                 │
│  Decision: YES → Engage Socratic Engine                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Socratic Dialogue Planner                       │
│                                                                 │
│  Analysis:                                                      │
│  • Problem: Index out of bounds in sorting algorithm            │
│  • Root cause: Loop condition error                             │
│  • Student knowledge: Understands loops, arrays                 │
│  • Discovery path: Guide to examine loop bounds                 │
│                                                                 │
│  Planned dialogue (3-5 turns):                                  │
│  1. Probing: "What does the error message tell you?"            │
│  2. Leading: "What is the valid index range for this array?"    │
│  3. Hypothesis: "Why might i < n cause a problem?"              │
│  4. Discovery: Student realizes i < n-1 needed                  │
│  5. Confirmation: Verify understanding                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Question Generator                             │
│                                                                 │
│  Generating Turn 1 question:                                    │
│                                                                 │
│  Question type: PROBING                                         │
│  Target: Error message comprehension                            │
│  Cognitive load: LOW (starting gentle)                          │
│                                                                 │
│  Generated question:                                            │
│  "I see your code is throwing an error. What does the error     │
│   message tell you about what went wrong?"                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           [STUDENT RESPONSE]                                    │
│  "It says index out of bounds"                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Understanding Tracker                              │
│                                                                 │
│  Evaluating student response:                                   │
│  • Comprehension: 50% (knows error type, not cause)             │
│  • Stuck: No                                                    │
│  • Ready for next question: Yes                                 │
│  • Hint needed: No                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            Question Generator (Turn 2)                          │
│                                                                 │
│  Question type: LEADING                                         │
│  Target: Array bounds understanding                             │
│                                                                 │
│  Generated question:                                            │
│  "Good! So the index went out of bounds. Your array has 5       │
│   elements. What are the valid index numbers for this array?"   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           [STUDENT RESPONSE]                                    │
│  "0 to 4"                                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            Understanding Tracker                                │
│  Comprehension: 75% (understands array indexing)                │
│  Ready for hypothesis question: Yes                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            Question Generator (Turn 3)                          │
│                                                                 │
│  Question type: HYPOTHESIS                                      │
│  Target: Discovery of loop condition error                      │
│                                                                 │
│  Generated question:                                            │
│  "Exactly right! Indexes 0 to 4. Now look at your loop:        │
│   'for i in range(n)' where n is 5. What values will i take?   │
│   Do you see a potential problem?"                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           [STUDENT RESPONSE]                                    │
│  "Oh! i will be 0, 1, 2, 3, 4... wait, and 5! That's out of    │
│   bounds!"                                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Understanding Tracker                              │
│  Comprehension: 100% (DISCOVERY ACHIEVED!)                      │
│  Aha moment detected: Yes                                       │
│  Ready for confirmation: Yes                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            Question Generator (Turn 4)                          │
│                                                                 │
│  Question type: CONFIRMATION                                    │
│                                                                 │
│  Generated response:                                            │
│  "Excellent discovery! 🎉 You found it! Your loop goes from 0   │
│   to 5, but your array only has indexes 0 to 4. How would you  │
│   fix this?"                                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           [STUDENT RESPONSE]                                    │
│  "Change it to range(n-1) or range(len(array))?"                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                Socratic Dialogue Complete                       │
│  Discovery successful through 4-turn dialogue                   │
│  Student learned debugging process, not just answer             │
│  Transfer learning: Can now debug similar issues               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation

### 1. Socratic Mode Decision Engine

```typescript
interface SocraticDecision {
  use_socratic: boolean;
  reasoning: string;
  fallback_to_direct: boolean;
  estimated_turns: number;
}

export class SocraticModeDecision {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async shouldUseSocratic(
    query: string,
    studentContext: string,
    conversationHistory: string[]
  ): Promise<SocraticDecision> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Determine if Socratic questioning is appropriate for this learning scenario.

STUDENT QUERY: "${query}"

STUDENT CONTEXT:
${studentContext}

RECENT CONVERSATION:
${conversationHistory.slice(-3).join('\n')}

CRITERIA FOR SOCRATIC METHOD:
✓ Problem-solving or debugging question (not pure factual recall)
✓ Student has prerequisite knowledge to discover answer
✓ Discovery would lead to deeper learning than direct answer
✓ Not an urgent/safety-critical question
✓ Student hasn't explicitly asked for direct explanation
✓ Student hasn't shown frustration with previous Socratic attempts

CRITERIA FOR DIRECT TEACHING:
× Factual question ("What is X?")
× Missing prerequisites
× Student frustrated or time-sensitive
× Student explicitly requested direct answer

Decide and provide:
1. Whether to use Socratic method
2. Reasoning
3. Whether to have a fallback to direct teaching if struggling
4. Estimated dialogue turns needed (2-6)

Format as JSON:
{
  "use_socratic": boolean,
  "reasoning": "explanation",
  "fallback_to_direct": boolean,
  "estimated_turns": number
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(this.extractJSON(responseText));
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}
```

---

### 2. Socratic Dialogue Planner

```typescript
enum QuestionType {
  PROBING = 'PROBING', // Understand student's current thinking
  LEADING = 'LEADING', // Guide toward relevant concepts
  HYPOTHESIS = 'HYPOTHESIS', // Encourage hypothesis formation
  COUNTER_EXAMPLE = 'COUNTER_EXAMPLE', // Challenge assumptions
  CONFIRMATION = 'CONFIRMATION', // Verify understanding
}

interface DialogueTurn {
  turn: number;
  question_type: QuestionType;
  target: string; // What this question aims to discover
  cognitive_load: 'LOW' | 'MEDIUM' | 'HIGH';
  expected_response_type: string;
}

interface DialoguePlan {
  goal: string;
  discovery_target: string;
  prerequisite_check: string[];
  turns: DialogueTurn[];
  estimated_total_turns: number;
  fallback_hints: string[];
}

export class SocraticDialoguePlanner {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async planDialogue(
    query: string,
    studentContext: string,
    targetDiscovery: string
  ): Promise<DialoguePlan> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Plan a Socratic dialogue to guide the student to discover the answer.

STUDENT QUERY: "${query}"

STUDENT CONTEXT: ${studentContext}

TARGET DISCOVERY: ${targetDiscovery}

SOCRATIC QUESTIONING PRINCIPLES:
1. Start with PROBING questions to understand current thinking
2. Use LEADING questions to direct attention to relevant concepts
3. Encourage HYPOTHESIS formation (student proposes solutions)
4. Use COUNTER-EXAMPLES when misconceptions arise
5. End with CONFIRMATION to verify understanding

PLAN STRUCTURE:
- 3-6 dialogue turns
- Gradual cognitive load (LOW → MEDIUM → HIGH)
- Each turn has clear target
- Progressive hints if student gets stuck

Format as JSON:
{
  "goal": "overall learning objective",
  "discovery_target": "what student should discover",
  "prerequisite_check": ["concept1", "concept2"],
  "turns": [
    {
      "turn": 1,
      "question_type": "PROBING",
      "target": "what this question aims to discover",
      "cognitive_load": "LOW",
      "expected_response_type": "description of expected response"
    }
  ],
  "estimated_total_turns": 4,
  "fallback_hints": ["hint if student stuck on turn 2", "hint for turn 3"]
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(this.extractJSON(responseText));
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}
```

---

### 3. Question Generator

```typescript
interface SocraticQuestion {
  question: string;
  question_type: QuestionType;
  hint_level: number; // 0 = no hint, 1-3 = increasing hint strength
  expected_insights: string[];
  evaluation_criteria: string;
}

export class QuestionGenerator {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateQuestion(
    dialogueTurn: DialogueTurn,
    conversationSoFar: string,
    studentLastResponse?: string,
    hintLevel: number = 0
  ): Promise<SocraticQuestion> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `Generate a Socratic question for this dialogue turn.

DIALOGUE TURN:
Type: ${dialogueTurn.question_type}
Target: ${dialogueTurn.target}
Cognitive Load: ${dialogueTurn.cognitive_load}

CONVERSATION SO FAR:
${conversationSoFar}

${studentLastResponse ? `STUDENT'S LAST RESPONSE: "${studentLastResponse}"` : ''}

HINT LEVEL: ${hintLevel}/3 (0 = no hint, 3 = strongest hint without giving answer)

QUESTION TYPE GUIDELINES:
- PROBING: Open-ended, non-leading, explores student's thinking
  Example: "What do you think is happening in this code?"

- LEADING: Directs attention to relevant concept without revealing answer
  Example: "What happens when the loop variable reaches the array size?"

- HYPOTHESIS: Encourages student to form and test hypotheses
  Example: "What do you think would happen if we changed this condition?"

- COUNTER_EXAMPLE: Challenges assumptions with contradictory examples
  Example: "If that were true, how would this test case behave?"

- CONFIRMATION: Verifies discovery and reinforces understanding
  Example: "Excellent! Can you explain why that works?"

HINT LEVELS:
- Level 0: Pure question, no hint
- Level 1: Subtle hint directing attention
- Level 2: Clearer hint highlighting key concept
- Level 3: Strong hint (almost revealing answer, use sparingly)

Generate the question and provide:
1. The question text
2. Expected insights student should gain
3. How to evaluate student's response

Format as JSON:
{
  "question": "the Socratic question",
  "question_type": "${dialogueTurn.question_type}",
  "hint_level": ${hintLevel},
  "expected_insights": ["insight1", "insight2"],
  "evaluation_criteria": "how to judge if response shows understanding"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(this.extractJSON(responseText));
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}
```

---

### 4. Understanding Tracker

```typescript
interface UnderstandingAssessment {
  comprehension_score: number; // 0-100
  insights_gained: string[];
  stuck: boolean;
  frustration_detected: boolean;
  ready_for_next_turn: boolean;
  hint_needed: boolean;
  discovery_achieved: boolean;
  aha_moment_detected: boolean;
}

export class UnderstandingTracker {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async assessUnderstanding(
    question: SocraticQuestion,
    studentResponse: string,
    conversationHistory: string
  ): Promise<UnderstandingAssessment> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Assess the student's understanding based on their response to the Socratic question.

QUESTION ASKED: "${question.question}"
EXPECTED INSIGHTS: ${JSON.stringify(question.expected_insights)}
EVALUATION CRITERIA: ${question.evaluation_criteria}

STUDENT RESPONSE: "${studentResponse}"

CONVERSATION HISTORY:
${conversationHistory}

ASSESS:
1. Comprehension score (0-100)
   - 0-30: No understanding, completely stuck
   - 31-60: Partial understanding, needs guidance
   - 61-80: Good understanding, progressing well
   - 81-100: Excellent understanding, discovery achieved

2. Insights gained from this response

3. Is student stuck? (confused, no progress, circular reasoning)

4. Is frustration detected? (expressions like "I don't know", "I give up", repeated failures)

5. Ready for next question? (or need hint/clarification)

6. Hint needed? (struggling but not frustrated)

7. Discovery achieved? (student found the answer themselves)

8. Aha moment detected? (expressions like "Oh!", "I see!", "That makes sense!")

Format as JSON:
{
  "comprehension_score": number,
  "insights_gained": ["insight1"],
  "stuck": boolean,
  "frustration_detected": boolean,
  "ready_for_next_turn": boolean,
  "hint_needed": boolean,
  "discovery_achieved": boolean,
  "aha_moment_detected": boolean
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(this.extractJSON(responseText));
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}
```

---

### 5. Hint System

```typescript
interface HintSequence {
  hints: Array<{
    level: number;
    text: string;
    reveals: string; // What this hint reveals
  }>;
}

export class HintSystem {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateHintSequence(
    question: SocraticQuestion,
    targetDiscovery: string
  ): Promise<HintSequence> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: `Generate a progressive hint sequence for a Socratic dialogue.

QUESTION: "${question.question}"
TARGET DISCOVERY: "${targetDiscovery}"

Create 3 hints with increasing strength:

LEVEL 1 (Subtle):
- Directs attention to relevant area
- Doesn't reveal mechanism
- Example: "Think about what happens when the loop reaches the end"

LEVEL 2 (Moderate):
- Highlights key concept
- Provides partial insight
- Example: "Consider the relationship between array size and valid indexes"

LEVEL 3 (Strong):
- Almost reveals answer
- Use only when student very stuck
- Example: "Arrays of size n have indexes 0 to n-1, not 0 to n"

Format as JSON:
{
  "hints": [
    {
      "level": 1,
      "text": "hint text",
      "reveals": "what this hint reveals without giving full answer"
    }
  ]
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return JSON.parse(this.extractJSON(responseText));
  }

  async provideHint(hint: HintSequence['hints'][0], question: string): Promise<string> {
    return `**Hint (Level ${hint.level})**: ${hint.text}\n\nLet's try again: ${question}`;
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}
```

---

### 6. Socratic Orchestrator

```typescript
interface SocraticState {
  dialogue_plan: DialoguePlan;
  current_turn: number;
  current_hint_level: number;
  comprehension_history: number[];
  aha_moments: number;
  frustration_count: number;
  discovery_achieved: boolean;
}

export class SocraticOrchestrator {
  private decisionEngine: SocraticModeDecision;
  private planner: SocraticDialoguePlanner;
  private questionGen: QuestionGenerator;
  private tracker: UnderstandingTracker;
  private hintSystem: HintSystem;

  constructor() {
    this.decisionEngine = new SocraticModeDecision();
    this.planner = new SocraticDialoguePlanner();
    this.questionGen = new QuestionGenerator();
    this.tracker = new UnderstandingTracker();
    this.hintSystem = new HintSystem();
  }

  async handleQuery(
    query: string,
    studentContext: string,
    conversationHistory: string[]
  ): Promise<{ response: string; use_socratic: boolean }> {
    // Step 1: Decide if Socratic method is appropriate
    const decision = await this.decisionEngine.shouldUseSocratic(
      query,
      studentContext,
      conversationHistory
    );

    if (!decision.use_socratic) {
      // Use direct teaching instead
      return {
        response: 'Direct answer mode...',
        use_socratic: false,
      };
    }

    // Step 2: Plan Socratic dialogue
    const plan = await this.planner.planDialogue(query, studentContext, 'discovery target');

    // Step 3: Initialize dialogue state
    const state: SocraticState = {
      dialogue_plan: plan,
      current_turn: 0,
      current_hint_level: 0,
      comprehension_history: [],
      aha_moments: 0,
      frustration_count: 0,
      discovery_achieved: false,
    };

    // Step 4: Start dialogue
    const firstQuestion = await this.questionGen.generateQuestion(
      plan.turns[0],
      conversationHistory.join('\n'),
      undefined,
      0
    );

    await this.storeSocraticState(state);

    return {
      response: this.formatSocraticResponse(firstQuestion.question, plan),
      use_socratic: true,
    };
  }

  async continueDialogue(
    studentResponse: string,
    stateId: string
  ): Promise<{ response: string; completed: boolean }> {
    // Load state
    const state = await this.loadSocraticState(stateId);

    if (!state) {
      return { response: 'Error: Dialogue state not found', completed: true };
    }

    const currentTurn = state.dialogue_plan.turns[state.current_turn];
    const lastQuestion = await this.getLastQuestion(stateId);

    // Assess understanding from student response
    const assessment = await this.tracker.assessUnderstanding(
      lastQuestion,
      studentResponse,
      'conversation history'
    );

    // Update state
    state.comprehension_history.push(assessment.comprehension_score);
    if (assessment.aha_moment_detected) {
      state.aha_moments++;
    }
    if (assessment.frustration_detected) {
      state.frustration_count++;
    }

    // Check for completion
    if (assessment.discovery_achieved) {
      state.discovery_achieved = true;
      const confirmationResponse = await this.generateConfirmation(studentResponse);
      await this.storeSocraticState(state);
      return { response: confirmationResponse, completed: true };
    }

    // Check for frustration threshold
    if (state.frustration_count >= 2) {
      const directAnswer = await this.transitionToDirect();
      return { response: directAnswer, completed: true };
    }

    // Provide hint if needed
    if (assessment.hint_needed && state.current_hint_level < 3) {
      state.current_hint_level++;
      const hints = await this.hintSystem.generateHintSequence(lastQuestion, state.dialogue_plan.discovery_target);
      const hint = hints.hints[state.current_hint_level - 1];
      const hintResponse = await this.hintSystem.provideHint(hint, lastQuestion.question);
      await this.storeSocraticState(state);
      return { response: hintResponse, completed: false };
    }

    // Continue to next turn
    if (assessment.ready_for_next_turn && state.current_turn < state.dialogue_plan.turns.length - 1) {
      state.current_turn++;
      state.current_hint_level = 0; // Reset hints for new turn

      const nextTurn = state.dialogue_plan.turns[state.current_turn];
      const nextQuestion = await this.questionGen.generateQuestion(
        nextTurn,
        'conversation',
        studentResponse,
        0
      );

      await this.storeSocraticState(state);
      return { response: nextQuestion.question, completed: false };
    }

    // Fallback: student stuck, transition to direct
    const directAnswer = await this.transitionToDirect();
    return { response: directAnswer, completed: true };
  }

  private formatSocraticResponse(question: string, plan: DialoguePlan): string {
    return `Let's explore this together! 🔍\n\n${question}\n\n(I'll guide you to discover the answer)`;
  }

  private async generateConfirmation(studentDiscovery: string): Promise<string> {
    return `Excellent discovery! 🎉 You figured it out! ${studentDiscovery}\n\nThis is exactly the kind of critical thinking that will help you solve similar problems in the future.`;
  }

  private async transitionToDirect(): Promise<string> {
    return 'I see you&apos;re finding this challenging. Let me explain directly...';
  }

  private async storeSocraticState(state: SocraticState): Promise<void> {
    // Store in database
  }

  private async loadSocraticState(stateId: string): Promise<SocraticState | null> {
    // Load from database
    return null;
  }

  private async getLastQuestion(stateId: string): Promise<SocraticQuestion> {
    // Retrieve last question from database
    return {} as SocraticQuestion;
  }
}
```

---

## 📊 Database Schema

```prisma
model SocraticDialogue {
  id                String   @id @default(uuid())
  userId            String
  conversationId    String
  query             String
  dialoguePlan      Json
  currentTurn       Int      @default(0)
  currentHintLevel  Int      @default(0)
  comprehensionHistory Json  // Array of scores
  ahaMoments        Int      @default(0)
  frustrationCount  Int      @default(0)
  discoveryAchieved Boolean  @default(false)
  status            String   @default("IN_PROGRESS") // IN_PROGRESS, COMPLETED, ABANDONED
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([conversationId])
  @@index([status])
}

model SocraticQuestion {
  id               String   @id @default(uuid())
  dialogueId       String
  turn             Int
  questionType     String
  questionText     String
  hintLevel        Int
  expectedInsights Json
  studentResponse  String?
  comprehensionScore Int?
  ahaDetected      Boolean  @default(false)
  createdAt        DateTime @default(now())

  @@index([dialogueId, turn])
}
```

---

## 📈 Metrics & Monitoring

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

export const socraticEngagement = new Gauge({
  name: 'socratic_engagement_rate',
  help: 'Percentage of students engaging with Socratic dialogues',
  registers: [register],
});

export const discoveryRate = new Gauge({
  name: 'socratic_discovery_rate',
  help: 'Percentage of students discovering answers vs being told',
  registers: [register],
});

export const dialogueTurns = new Histogram({
  name: 'socratic_dialogue_turns',
  help: 'Number of turns in Socratic dialogues',
  buckets: [2, 3, 4, 5, 6, 8, 10],
  registers: [register],
});

export const ahaMoments = new Counter({
  name: 'socratic_aha_moments_total',
  help: 'Total aha moments detected in Socratic dialogues',
  registers: [register],
});

export const frustrationRate = new Gauge({
  name: 'socratic_frustration_rate',
  help: 'Percentage of dialogues with frustration detected',
  registers: [register],
});
```

---

## 💰 Budget Breakdown

### Engineering Costs: $36,000
- **Senior ML Engineer** (2 weeks × $12,000/week): $24,000
  - Socratic question generation
  - Understanding tracker AI
- **Educational Psychologist** (consultant, 1 week): $8,000
  - Socratic method principles
  - Question type taxonomy
- **Backend Engineer** (1 week × $10,000/week): $10,000 (partial)
  - State management
  - Dialogue orchestration

### Infrastructure Costs: $10,000
- **Claude API** (question generation): $8,000
- **Database** (dialogue state storage): $2,000

### Research & Development: $4,000
- **Socratic method research**: $2,000
- **Question bank development**: $2,000

**Total Initiative Budget**: **$50,000**

---

## 🎯 Acceptance Criteria

Initiative 4.3 is complete when:

1. ✅ **Socratic Decision**: >90% accuracy on when to use Socratic vs direct
2. ✅ **Question Quality**: >4.5/5 student rating on "questions helped me think"
3. ✅ **Discovery Rate**: 70%+ students discover answers themselves
4. ✅ **Engagement**: 75%+ students participate in Socratic dialogues
5. ✅ **Aha Moments**: 60%+ students report breakthrough understanding
6. ✅ **Frustration Rate**: <15% students frustrated
7. ✅ **Dialogue Coherence**: >90% dialogues remain on-topic
8. ✅ **Student Satisfaction**: >4.8/5 for Socratic experience
9. ✅ **Production Deployment**: All components deployed
10. ✅ **Documentation**: Complete system docs and pedagogy guide

---

*This Socratic questioning engine transforms SAM from answer-provider into discovery guide, fostering deeper learning through guided questioning.*
