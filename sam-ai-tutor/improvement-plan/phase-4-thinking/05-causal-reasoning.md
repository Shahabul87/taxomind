# Initiative 4.5: Causal Reasoning System

**Timeline**: Weeks 51-52 (2 weeks)
**Budget**: $70,000
**Dependencies**: Phase 2 (Knowledge Graph Foundation), Initiative 4.4 (Multi-Agent Collaboration)

---

## 📋 Overview

### Problem Statement

Current SAM can explain **correlations** but not **causation**. It describes **what** happens but not deeply **why** it happens. This creates surface-level understanding:

- **Describes symptoms, not root causes**: "The code crashes" vs. "The code crashes *because* null pointer"
- **Correlations without mechanisms**: "Good test coverage correlates with fewer bugs" vs. "Tests *cause* fewer bugs *because* they catch errors early"
- **No counterfactual reasoning**: Cannot answer "What if we changed X? Would Y still happen?"
- **No causal chains**: Cannot trace A → B → C → D causality
- **No "why" depth**: Stops at surface explanation instead of drilling to root causes

**Current Limitation Example**:
```
Student: "Why does adding this line of code make my program faster?"

Current SAM (Phase 3):
"Your program runs faster after adding that line. The line implements
caching, which stores results. Cached results can be retrieved quickly."

Result:
✅ Describes correlation (line added → faster)
✅ Identifies mechanism (caching)
❌ Doesn't explain WHY caching causes speed improvement
❌ Doesn't explain MECHANISM of cache retrieval
❌ Cannot answer: "Would it still be faster if cache size was 1?"
```

### Solution

Implement **Causal Reasoning System** based on Judea Pearl's causal hierarchy:

1. **Causal Graph Extractor**: Identifies causal relationships in content
2. **Mechanism Explainer**: Explains *how* causes produce effects
3. **Counterfactual Reasoner**: Answers "what if" questions
4. **Causal Chain Tracer**: Traces multi-step causality (A → B → C)
5. **Root Cause Analyzer**: Drills to fundamental causes

### Impact

- **85%+ causal explanation accuracy** (validated by domain experts)
- **+70% deeper understanding** measured by student ability to explain "why"
- **90%+ counterfactual reasoning success** (correct "what if" answers)
- **+60% problem-solving transfer** (apply causal understanding to new problems)
- **>4.9/5 student satisfaction** with "why" explanations

---

## 🎯 Success Criteria

### Technical Metrics
- **Causal Graph Extraction Accuracy**: >85% correct causal relationships
- **Mechanism Explanation Quality**: >90% explanations include correct mechanisms
- **Counterfactual Accuracy**: >90% correct "what if" predictions
- **Causal Chain Completeness**: >80% chains include all intermediate steps
- **Root Cause Identification**: >85% identify correct root causes

### Quality Metrics
- **Explanation Depth**: >4.8/5 rating on "SAM explained why, not just what"
- **Mechanism Clarity**: >90% students understand *how* causes work
- **Pearl Ladder Alignment**: >85% explanations reach Level 3 (counterfactuals)
- **No False Causation**: <5% incorrect causal claims

### UX Metrics
- **Student Satisfaction**: >4.9/5 for causal explanations
- **Aha Moments**: 70%+ students report causal insights
- **Transfer Success**: 60%+ apply causal reasoning to new problems
- **Question Depth**: +65% follow-up "why" questions after causal explanation

### Business Metrics
- **Premium Conversion**: +45% for users experiencing causal reasoning
- **Retention**: +40% for students using causal features
- **NPS Impact**: +28 points from causal reasoning users
- **Session Value**: +70% value per session

---

## 🏗️ Architecture Design

### Judea Pearl's Causal Hierarchy

```
Level 3: Counterfactuals (What if?)
   │     "What if I had used a different algorithm?"
   │     Requires: Imagining alternative worlds
   │
   ▼
Level 2: Intervention (What if I do?)
   │     "What would happen if I change this variable?"
   │     Requires: Understanding of mechanisms
   │
   ▼
Level 1: Association (What is?)
   │     "Is there a correlation between X and Y?"
   │     Requires: Observation
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Student Query                                 │
│  "Why does caching make my program faster?"                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Causal Query Classifier                            │
│                                                                 │
│  Query type: WHY_EXPLANATION                                    │
│  Causal depth needed: MECHANISM + ROOT_CAUSE                    │
│  Requires: Level 2 (Intervention) reasoning                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            Causal Graph Extractor                               │
│                                                                 │
│  Extracted causal relationships:                                │
│                                                                 │
│  Cache storage                                                  │
│       │                                                         │
│       ▼                                                         │
│  Repeated data requests                                         │
│       │                                                         │
│       ▼                                                         │
│  Retrieve from cache (not re-compute)                           │
│       │                                                         │
│       ▼                                                         │
│  Avoid redundant computation                                    │
│       │                                                         │
│       ▼                                                         │
│  Faster execution time                                          │
│                                                                 │
│  Causal graph:                                                  │
│  [Caching] → [Avoid re-computation] → [Speed improvement]       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Mechanism Explainer                                │
│                                                                 │
│  Explaining MECHANISM of each causal link:                      │
│                                                                 │
│  Link 1: Caching → Avoid re-computation                         │
│  MECHANISM:                                                     │
│  • Cache stores computed results in fast memory (RAM/dict)      │
│  • When same input requested, check cache first                 │
│  • If found: Return cached result (O(1) lookup)                 │
│  • If not found: Compute and store in cache                     │
│                                                                 │
│  Link 2: Avoid re-computation → Speed improvement               │
│  MECHANISM:                                                     │
│  • Re-computation takes T seconds                               │
│  • Cache lookup takes ~0.001 seconds                            │
│  • Saving: T - 0.001 seconds per cached request                 │
│  • With N cached requests: Save N × T seconds                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Root Cause Analyzer                                │
│                                                                 │
│  Drilling to ROOT CAUSE:                                        │
│                                                                 │
│  Surface: "Caching makes it faster"                             │
│       │                                                         │
│       ▼                                                         │
│  Intermediate: "Caching avoids re-computation"                  │
│       │                                                         │
│       ▼                                                         │
│  Deeper: "Re-computation is expensive"                          │
│       │                                                         │
│       ▼                                                         │
│  ROOT CAUSE: "Your algorithm has O(n²) complexity, so          │
│               re-computing is inherently slow. Caching trades   │
│               space (memory) for time (speed)."                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           Counterfactual Reasoner                               │
│           (Level 3: "What if?")                                 │
│                                                                 │
│  Answering potential counterfactuals:                           │
│                                                                 │
│  Q: "What if cache size was limited to 1 item?"                 │
│  A: Speed improvement would drop significantly. With cache      │
│     size 1, you'd only benefit when the SAME request repeats    │
│     consecutively. Most real-world patterns would see minimal   │
│     benefit.                                                    │
│                                                                 │
│  Q: "What if I used a slower data structure for the cache?"     │
│  A: Cache lookup time would increase. If lookup takes 0.5s      │
│     instead of 0.001s, and original computation takes 1s,       │
│     you'd only save 0.5s per cached request (vs. 0.999s).       │
│     Still faster, but 50% less improvement.                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Causal Explanation Generator                       │
│                                                                 │
│  "Caching makes your program faster because:                    │
│                                                                 │
│   **Mechanism**: When you cache results, repeated requests      │
│   don't require re-computation. Instead of running your O(n²)   │
│   algorithm again (which takes T seconds), you do a simple      │
│   dictionary lookup (0.001 seconds).                            │
│                                                                 │
│   **Root Cause**: The fundamental reason is that computation    │
│   is expensive (O(n²)) while memory lookup is cheap (O(1)).     │
│   Caching trades space (storing results) for time (avoiding     │
│   re-computation).                                              │
│                                                                 │
│   **Counterfactual**: If your algorithm was already O(1), or    │
│   if your cache size was tiny (1 item), you'd see minimal       │
│   improvement. The benefit comes from:                          │
│   1. Expensive computation (your O(n²) algorithm)               │
│   2. Repeated requests (same inputs multiple times)             │
│   3. Large enough cache (stores many results)                   │
│                                                                 │
│   That's WHY caching works in your case!"                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation

### 1. Causal Graph Extractor

```typescript
interface CausalNode {
  id: string;
  concept: string;
  description: string;
}

interface CausalEdge {
  from: string; // node ID
  to: string; // node ID
  relationship: 'CAUSES' | 'ENABLES' | 'PREVENTS' | 'INFLUENCES';
  mechanism: string; // How the cause produces the effect
  confidence: number; // 0-1
}

interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
}

export class CausalGraphExtractor {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async extractCausalGraph(
    query: string,
    context: string
  ): Promise<CausalGraph> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Extract the causal relationships from this educational content.

QUERY: "${query}"

CONTEXT: ${context}

IDENTIFY:
1. Causal nodes (concepts involved in causation)
2. Causal edges (relationships between nodes)
3. Mechanisms (HOW each cause produces its effect)

CAUSAL RELATIONSHIPS:
- CAUSES: A directly causes B (A → B)
- ENABLES: A enables B (A makes B possible)
- PREVENTS: A prevents B (A stops B from happening)
- INFLUENCES: A influences B (A affects B probability)

For each relationship, explain the MECHANISM.

Format as JSON:
{
  "nodes": [
    {
      "id": "node1",
      "concept": "Caching",
      "description": "Storing computed results in memory"
    }
  ],
  "edges": [
    {
      "from": "node1",
      "to": "node2",
      "relationship": "CAUSES",
      "mechanism": "explanation of how cause produces effect",
      "confidence": 0.95
    }
  ]
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

### 2. Mechanism Explainer

```typescript
interface MechanismExplanation {
  causal_link: string; // "A → B"
  mechanism: string; // How A causes B
  intermediate_steps: string[];
  time_scale: string; // How long it takes
  necessary_conditions: string[]; // What else must be true
  sufficient: boolean; // Is this cause alone sufficient?
}

export class MechanismExplainer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async explainMechanism(edge: CausalEdge, graph: CausalGraph): Promise<MechanismExplanation> {
    const fromNode = graph.nodes.find((n) => n.id === edge.from);
    const toNode = graph.nodes.find((n) => n.id === edge.to);

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: `Explain the MECHANISM of this causal relationship in depth.

CAUSE: ${fromNode?.concept}
EFFECT: ${toNode?.concept}
RELATIONSHIP: ${edge.relationship}
INITIAL MECHANISM: ${edge.mechanism}

EXPLAIN:
1. **HOW** does the cause produce the effect? (step-by-step mechanism)
2. **INTERMEDIATE STEPS**: What happens between cause and effect?
3. **TIME SCALE**: How long does the causal process take?
4. **NECESSARY CONDITIONS**: What else must be true for causation to occur?
5. **SUFFICIENCY**: Is this cause alone sufficient, or are other factors needed?

Format as JSON:
{
  "causal_link": "${fromNode?.concept} → ${toNode?.concept}",
  "mechanism": "detailed mechanism explanation",
  "intermediate_steps": ["step1", "step2", "step3"],
  "time_scale": "immediate / seconds / minutes / hours",
  "necessary_conditions": ["condition1", "condition2"],
  "sufficient": boolean
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

### 3. Counterfactual Reasoner

```typescript
interface CounterfactualQuery {
  original_situation: string;
  intervention: string; // What we change
  question: string; // What we want to know
}

interface CounterfactualPrediction {
  prediction: string;
  reasoning: string;
  confidence: number; // 0-1
  alternative_outcomes: string[];
  causal_path_affected: string[]; // Which causal links are affected
}

export class CounterfactualReasoner {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async reasonCounterfactual(
    query: CounterfactualQuery,
    causalGraph: CausalGraph
  ): Promise<CounterfactualPrediction> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: `Perform counterfactual reasoning using the causal graph.

ORIGINAL SITUATION: ${query.original_situation}

INTERVENTION: ${query.intervention}

QUESTION: ${query.question}

CAUSAL GRAPH:
${JSON.stringify(causalGraph, null, 2)}

COUNTERFACTUAL REASONING STEPS:
1. Identify which causal nodes/edges are affected by the intervention
2. Trace downstream effects through the causal graph
3. Predict the outcome in this alternative world
4. Assess confidence based on mechanism understanding
5. Consider alternative outcomes

Format as JSON:
{
  "prediction": "what would happen in the counterfactual world",
  "reasoning": "step-by-step causal reasoning",
  "confidence": 0.85,
  "alternative_outcomes": ["other possible outcomes"],
  "causal_path_affected": ["node1 → node2", "node2 → node3"]
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

### 4. Root Cause Analyzer

```typescript
interface RootCauseAnalysis {
  surface_cause: string;
  intermediate_causes: string[];
  root_cause: string;
  causal_depth: number; // How many levels deep
  explanation: string;
}

export class RootCauseAnalyzer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async analyzeRootCause(
    effect: string,
    causalGraph: CausalGraph
  ): Promise<RootCauseAnalysis> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: `Perform root cause analysis by drilling through causal layers.

OBSERVED EFFECT: ${effect}

CAUSAL GRAPH:
${JSON.stringify(causalGraph, null, 2)}

ROOT CAUSE ANALYSIS:
1. Start with surface-level causes (immediate predecessors in graph)
2. Ask "why?" for each cause to go deeper
3. Continue until reaching fundamental/root causes
4. Root causes are those that:
   - Cannot be traced to deeper causes in this context
   - Are fundamental properties or constraints
   - Are the "ultimate" explanation

Example:
Effect: "Code runs slowly"
Surface: "Code has nested loops"
Intermediate: "Algorithm is O(n²)"
Root: "Problem requires comparing all pairs, fundamentally O(n²)"

Format as JSON:
{
  "surface_cause": "immediate cause",
  "intermediate_causes": ["cause1", "cause2"],
  "root_cause": "fundamental cause",
  "causal_depth": number_of_layers,
  "explanation": "why this is the root cause"
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

### 5. Causal Chain Tracer

```typescript
interface CausalChain {
  chain: string[]; // Sequence of concepts
  mechanisms: string[]; // Mechanism for each link
  total_confidence: number; // Product of individual confidences
  weak_links: string[]; // Links with low confidence
}

export class CausalChainTracer {
  async traceCausalChain(
    start: string,
    end: string,
    graph: CausalGraph
  ): Promise<CausalChain[]> {
    // Find all paths from start to end using graph traversal
    const paths = this.findAllPaths(start, end, graph);

    return paths.map((path) => this.buildCausalChain(path, graph));
  }

  private findAllPaths(
    start: string,
    end: string,
    graph: CausalGraph,
    visited: Set<string> = new Set(),
    currentPath: string[] = []
  ): string[][] {
    if (start === end) {
      return [[...currentPath, end]];
    }

    if (visited.has(start)) {
      return []; // Avoid cycles
    }

    visited.add(start);
    currentPath.push(start);

    const outgoingEdges = graph.edges.filter((e) => e.from === start);
    const paths: string[][] = [];

    for (const edge of outgoingEdges) {
      const subPaths = this.findAllPaths(
        edge.to,
        end,
        graph,
        new Set(visited),
        [...currentPath]
      );
      paths.push(...subPaths);
    }

    return paths;
  }

  private buildCausalChain(path: string[], graph: CausalGraph): CausalChain {
    const mechanisms: string[] = [];
    let totalConfidence = 1.0;
    const weakLinks: string[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const edge = graph.edges.find((e) => e.from === path[i] && e.to === path[i + 1]);

      if (edge) {
        mechanisms.push(edge.mechanism);
        totalConfidence *= edge.confidence;

        if (edge.confidence < 0.7) {
          weakLinks.push(`${path[i]} → ${path[i + 1]}`);
        }
      }
    }

    return {
      chain: path,
      mechanisms,
      total_confidence: totalConfidence,
      weak_links: weakLinks,
    };
  }
}
```

---

### 6. Causal Reasoning Orchestrator

```typescript
export class CausalReasoningOrchestrator {
  private graphExtractor: CausalGraphExtractor;
  private mechanismExplainer: MechanismExplainer;
  private counterfactualReasoner: CounterfactualReasoner;
  private rootCauseAnalyzer: RootCauseAnalyzer;
  private chainTracer: CausalChainTracer;

  constructor() {
    this.graphExtractor = new CausalGraphExtractor();
    this.mechanismExplainer = new MechanismExplainer();
    this.counterfactualReasoner = new CounterfactualReasoner();
    this.rootCauseAnalyzer = new RootCauseAnalyzer();
    this.chainTracer = new CausalChainTracer();
  }

  async explainCausality(query: string, context: string): Promise<string> {
    const startTime = Date.now();

    try {
      // Step 1: Extract causal graph
      const graph = await this.graphExtractor.extractCausalGraph(query, context);
      console.log(`Extracted ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

      // Step 2: Explain mechanisms for each causal link
      const mechanismPromises = graph.edges.map((edge) =>
        this.mechanismExplainer.explainMechanism(edge, graph)
      );
      const mechanisms = await Promise.all(mechanismPromises);

      // Step 3: Perform root cause analysis
      const effectNode = graph.nodes[graph.nodes.length - 1]; // Last node is typically the effect
      const rootCause = await this.rootCauseAnalyzer.analyzeRootCause(
        effectNode.concept,
        graph
      );

      // Step 4: Generate causal explanation
      const explanation = this.synthesizeCausalExplanation(
        query,
        graph,
        mechanisms,
        rootCause
      );

      const totalTime = Date.now() - startTime;
      console.log(`Causal reasoning completed in ${totalTime}ms`);

      return explanation;
    } catch (error) {
      console.error('Causal reasoning error:', error);
      return 'I encountered an error analyzing the causal relationships. Let me provide a standard explanation instead...';
    }
  }

  private synthesizeCausalExplanation(
    query: string,
    graph: CausalGraph,
    mechanisms: MechanismExplanation[],
    rootCause: RootCauseAnalysis
  ): string {
    let explanation = `**Causal Explanation**:\n\n`;

    // Mechanism explanation
    explanation += `**How it works** (Mechanisms):\n`;
    mechanisms.forEach((mech, i) => {
      explanation += `\n${i + 1}. ${mech.causal_link}:\n`;
      explanation += `   ${mech.mechanism}\n`;
      if (mech.intermediate_steps.length > 0) {
        explanation += `   Steps: ${mech.intermediate_steps.join(' → ')}\n`;
      }
    });

    // Root cause
    explanation += `\n**Root Cause** (Why fundamentally):\n`;
    explanation += `${rootCause.explanation}\n`;
    explanation += `\nCausal depth: ${rootCause.causal_depth} layers\n`;
    explanation += `Path: ${rootCause.surface_cause}`;
    if (rootCause.intermediate_causes.length > 0) {
      explanation += ` → ${rootCause.intermediate_causes.join(' → ')}`;
    }
    explanation += ` → ${rootCause.root_cause}\n`;

    return explanation;
  }

  async handleCounterfactual(query: string, context: string): Promise<string> {
    // Extract original causal graph
    const graph = await this.graphExtractor.extractCausalGraph(query, context);

    // Parse counterfactual query
    const counterfactualQuery: CounterfactualQuery = {
      original_situation: context,
      intervention: 'extracted from query',
      question: query,
    };

    // Reason about counterfactual
    const prediction = await this.counterfactualReasoner.reasonCounterfactual(
      counterfactualQuery,
      graph
    );

    return `**Counterfactual Analysis**:\n\n${prediction.prediction}\n\n**Reasoning**:\n${prediction.reasoning}\n\n**Confidence**: ${Math.round(prediction.confidence * 100)}%`;
  }
}
```

---

## 📊 Database Schema

```prisma
model CausalGraph {
  id          String   @id @default(uuid())
  userId      String
  query       String
  nodes       Json     // Array of CausalNode
  edges       Json     // Array of CausalEdge
  rootCause   String?
  confidence  Float
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
}

model CounterfactualQuery {
  id                String   @id @default(uuid())
  userId            String
  originalSituation String
  intervention      String
  prediction        String
  confidence        Float
  createdAt         DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

---

## 📈 Metrics & Monitoring

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

export const causalGraphExtractions = new Counter({
  name: 'causal_graph_extractions_total',
  help: 'Total causal graph extractions',
  registers: [register],
});

export const causalGraphAccuracy = new Gauge({
  name: 'causal_graph_accuracy',
  help: 'Accuracy of causal relationship extraction (0-1)',
  registers: [register],
});

export const counterfactualPredictions = new Counter({
  name: 'counterfactual_predictions_total',
  help: 'Total counterfactual predictions',
  registers: [register],
});

export const counterfactualAccuracy = new Gauge({
  name: 'counterfactual_accuracy',
  help: 'Accuracy of counterfactual predictions (0-1)',
  registers: [register],
});

export const rootCauseDepth = new Histogram({
  name: 'root_cause_depth',
  help: 'Depth of root cause analysis (number of causal layers)',
  buckets: [1, 2, 3, 4, 5, 6],
  registers: [register],
});
```

---

## 🧪 Testing Strategy

```typescript
describe('CausalReasoningOrchestrator', () => {
  let orchestrator: CausalReasoningOrchestrator;

  beforeEach(() => {
    orchestrator = new CausalReasoningOrchestrator();
  });

  it('should extract correct causal graph', async () => {
    const query = 'Why does caching improve performance?';
    const context = 'Program with repeated computations';

    const result = await orchestrator.explainCausality(query, context);

    expect(result).toContain('mechanism');
    expect(result).toContain('root cause');
  });

  it('should handle counterfactual queries', async () => {
    const query = 'What if cache size was only 1 item?';
    const result = await orchestrator.handleCounterfactual(query, 'caching context');

    expect(result).toContain('Counterfactual');
    expect(result).toContain('confidence');
  });

  it('should identify root causes', async () => {
    // Test that root cause analysis goes beyond surface causes
    const result = await orchestrator.explainCausality(
      'Why is my code slow?',
      'nested loops'
    );

    expect(result).toContain('O(n');
    expect(result).toContain('causal depth');
  });
});
```

---

## 💰 Budget Breakdown

### Engineering Costs: $48,000
- **Senior ML Engineer** (2 weeks × $12,000/week): $24,000
  - Causal graph extraction
  - Mechanism explanation
  - Counterfactual reasoning
- **AI Research Lead** (1 week full-time): $12,000
  - Pearl's causal framework implementation
  - Causal inference algorithms
- **Backend Engineer** (1 week × $10,000/week): $10,000
  - Causal chain tracing
  - Root cause analysis
- **Educational Specialist** (consultant, 0.5 weeks): $4,000
  - Pedagogical validation

### Infrastructure Costs: $15,000
- **Claude API** (causal reasoning): $12,000
- **Knowledge Graph Storage**: $3,000

### Research & Development: $7,000
- **Causal inference research**: $4,000
- **Pearl's framework study**: $3,000

**Total Initiative Budget**: **$70,000**

---

## 🎯 Acceptance Criteria

Initiative 4.5 is complete when:

1. ✅ **Causal Graph Accuracy**: >85% correct relationships
2. ✅ **Mechanism Quality**: >90% include correct mechanisms
3. ✅ **Counterfactual Accuracy**: >90% correct predictions
4. ✅ **Root Cause Identification**: >85% identify correct root causes
5. ✅ **Explanation Depth**: >4.8/5 on "explained why, not just what"
6. ✅ **Pearl Ladder**: >85% explanations reach Level 3
7. ✅ **No False Causation**: <5% incorrect causal claims
8. ✅ **Student Satisfaction**: >4.9/5 for causal explanations
9. ✅ **Production Deployment**: All components deployed
10. ✅ **Documentation**: Complete causal reasoning guide

---

*This causal reasoning system transforms SAM from correlation-describer to causation-explainer, enabling deep "why" understanding through mechanisms, root causes, and counterfactual reasoning.*
