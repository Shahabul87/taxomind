# Initiative 4.2: Tool Registry & Orchestration

**Timeline**: Weeks 43-46 (4 weeks)
**Budget**: $60,000
**Dependencies**: Initiative 4.1 (Planner-Executor Architecture)

---

## 📋 Overview

### Problem Statement

Current SAM is **text-only**: it can explain concepts but cannot **execute code**, **visualize data**, **solve equations symbolically**, or **run simulations**. This limits learning for:

- **Programming students**: "Can you run this code and show me the output?"
- **Math students**: "Can you graph this function so I can see it?"
- **Science students**: "Can you simulate this physics problem?"
- **Visual learners**: "Can you draw a diagram of how this algorithm works?"

**Current Limitation Example**:
```
Student: "I wrote this Python code to sort a list. Can you run it and
         tell me if it works?"

Current SAM (Phase 3):
"I can read your code and explain what it does. The code appears to
use the bubble sort algorithm. Here's what would happen when you run it..."

[Student still doesn't know if their code actually works]
```

### Solution

Build a **comprehensive tool ecosystem** that SAM can orchestrate to solve complex problems:

1. **Tool Registry**: 20+ educational tools (code executor, math solver, diagram generator, etc.)
2. **Tool Selector**: AI that chooses the right tools for each task
3. **Parallel Executor**: Runs multiple tools concurrently when beneficial
4. **Result Synthesizer**: Combines tool outputs into coherent explanations
5. **Tool Monitoring**: Tracks tool performance and reliability

### Impact

- **95%+ accuracy** on code execution questions (vs. 0% currently - can&apos;t execute)
- **80%+ accuracy** on math visualization requests (vs. explaining without showing)
- **+60% student satisfaction** for hands-on learning
- **+45% engagement** with interactive tool-based learning
- **3x faster** problem-solving for multi-tool tasks (parallel execution)

---

## 🎯 Success Criteria

### Technical Metrics
- **Tool Response Time**: <500ms p95 for tool execution
- **Tool Success Rate**: >95% successful tool executions
- **Parallel Speedup**: 2-3x faster for multi-tool tasks vs. sequential
- **Tool Selection Accuracy**: >90% correct tool chosen for task
- **Orchestration Overhead**: <200ms for coordination logic

### Quality Metrics
- **Result Synthesis Quality**: >4.5/5 on "tool outputs were well-explained"
- **Tool Relevance**: >90% of tool invocations add value to learning
- **Error Handling**: 100% of tool failures handled gracefully
- **Code Safety**: 0 security breaches from code execution sandbox

### UX Metrics
- **Student Satisfaction**: >4.6/5 for tool-assisted learning
- **Engagement**: +45% interaction duration with tool usage
- **Retry Rate**: <10% students need to re-run tools
- **Visualization Impact**: +50% comprehension with visual tools vs. text-only

### Business Metrics
- **Feature Adoption**: 60%+ students use tool-assisted features
- **Premium Conversion**: +30% for users experiencing tools
- **Retention**: +20% for students using interactive tools
- **NPS Impact**: +18 points from tool-using students

---

## 🏗️ Architecture Design

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   Student Query                                 │
│  "Can you run this Python code and visualize the output?"       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Planner Agent                                  │
│  (from Initiative 4.1)                                          │
│                                                                 │
│  Plan Step 1: Execute Python code                              │
│  Plan Step 2: Visualize output data                            │
│  Plan Step 3: Explain results                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Selector                                │
│                                                                 │
│  Analyzes plan steps and selects appropriate tools:            │
│  • Step 1 → Code Executor Tool (Python sandbox)                │
│  • Step 2 → Visualization Tool (Matplotlib/Chart generator)    │
│  • Step 3 → No tool needed (SAM explains)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Tool Registry                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Code Execution Tools                                     │  │
│  │  • Python Executor (E2B sandbox)                         │  │
│  │  • JavaScript Executor (Node.js sandbox)                 │  │
│  │  • SQL Executor (SQLite sandbox)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Math & Computation Tools                                 │  │
│  │  • Symbolic Math Solver (SymPy)                          │  │
│  │  • Equation Grapher (Desmos API)                         │  │
│  │  • Matrix Calculator (NumPy)                             │  │
│  │  • Stats Analyzer (SciPy)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Visualization Tools                                      │  │
│  │  • Chart Generator (Chart.js/D3.js)                      │  │
│  │  • Diagram Creator (Mermaid.js)                          │  │
│  │  • Algorithm Visualizer (custom)                         │  │
│  │  • 3D Grapher (Three.js)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Simulation Tools                                         │  │
│  │  • Physics Simulator (PhET-inspired)                     │  │
│  │  • Circuit Simulator (CircuitJS)                         │  │
│  │  • Network Simulator (custom)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Data Tools                                               │  │
│  │  • Data Analyzer (Pandas operations)                     │  │
│  │  • CSV/JSON Parser                                       │  │
│  │  • API Tester (HTTP requests)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Educational Tools                                        │  │
│  │  • Concept Grapher (knowledge graph visualization)       │  │
│  │  • Quiz Generator                                        │  │
│  │  • Code Debugger (step-through)                          │  │
│  │  • Proof Checker (logic validation)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                Parallel Execution Engine                        │
│                                                                 │
│  Executes tools in parallel when dependencies allow:           │
│  • Step 1 (Code Executor) → Execute                            │
│  • Step 2 (Visualizer) waits for Step 1 output                 │
│  • If independent: Run Step 1 || Step 2 concurrently           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Tool Execution Results                         │
│                                                                 │
│  Tool 1 (Python Executor):                                      │
│  {                                                              │
│    "stdout": "[1, 2, 3, 4, 5]",                                 │
│    "stderr": "",                                                │
│    "exit_code": 0,                                              │
│    "execution_time_ms": 245                                     │
│  }                                                              │
│                                                                 │
│  Tool 2 (Chart Generator):                                      │
│  {                                                              │
│    "chart_url": "https://cdn.../chart_abc123.png",             │
│    "chart_type": "bar",                                         │
│    "success": true                                              │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Result Synthesizer                             │
│                                                                 │
│  Combines tool outputs with AI-generated explanation:          │
│  "I&apos;ve executed your Python code. Here&apos;s what happened:      │
│                                                                 │
│  **Output**: [1, 2, 3, 4, 5]                                    │
│                                                                 │
│  Your code successfully sorted the list. Here&apos;s a             │
│  visualization of the sorting process:                          │
│                                                                 │
│  [Chart showing before/after]                                   │
│                                                                 │
│  The algorithm used is bubble sort, which has O(n²)             │
│  time complexity..."                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation

### 1. Tool Registry

```typescript
interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'CODE' | 'MATH' | 'VISUALIZATION' | 'SIMULATION' | 'DATA' | 'EDUCATIONAL';
  input_schema: object; // Zod schema
  output_schema: object; // Zod schema
  execute: (input: unknown) => Promise<ToolResult>;
  timeout_ms: number;
  cost_estimate: number; // API cost in USD
  requires_sandbox: boolean;
}

interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  execution_time_ms: number;
  cost_usd: number;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerTools();
  }

  private registerTools(): void {
    // Code Execution Tools
    this.register({
      id: 'python-executor',
      name: 'Python Code Executor',
      description: 'Executes Python code in a secure sandbox',
      category: 'CODE',
      input_schema: z.object({
        code: z.string(),
        timeout_ms: z.number().optional().default(5000),
      }),
      output_schema: z.object({
        stdout: z.string(),
        stderr: z.string(),
        exit_code: z.number(),
      }),
      execute: this.executePython.bind(this),
      timeout_ms: 5000,
      cost_estimate: 0.01,
      requires_sandbox: true,
    });

    this.register({
      id: 'javascript-executor',
      name: 'JavaScript Code Executor',
      description: 'Executes JavaScript/Node.js code in a sandbox',
      category: 'CODE',
      input_schema: z.object({
        code: z.string(),
        timeout_ms: z.number().optional().default(3000),
      }),
      output_schema: z.object({
        result: z.unknown(),
        console_output: z.string(),
      }),
      execute: this.executeJavaScript.bind(this),
      timeout_ms: 3000,
      cost_estimate: 0.005,
      requires_sandbox: true,
    });

    // Math Tools
    this.register({
      id: 'symbolic-math',
      name: 'Symbolic Math Solver',
      description: 'Solves equations symbolically using SymPy',
      category: 'MATH',
      input_schema: z.object({
        expression: z.string(),
        operation: z.enum(['solve', 'simplify', 'differentiate', 'integrate']),
        variable: z.string().optional(),
      }),
      output_schema: z.object({
        result: z.string(),
        latex: z.string(),
      }),
      execute: this.solveSymbolic.bind(this),
      timeout_ms: 2000,
      cost_estimate: 0.002,
      requires_sandbox: false,
    });

    this.register({
      id: 'equation-grapher',
      name: 'Equation Grapher',
      description: 'Graphs mathematical functions',
      category: 'VISUALIZATION',
      input_schema: z.object({
        equation: z.string(),
        x_range: z.tuple([z.number(), z.number()]),
        y_range: z.tuple([z.number(), z.number()]).optional(),
      }),
      output_schema: z.object({
        image_url: z.string(),
        points: z.array(z.tuple([z.number(), z.number()])),
      }),
      execute: this.graphEquation.bind(this),
      timeout_ms: 3000,
      cost_estimate: 0.01,
      requires_sandbox: false,
    });

    // Visualization Tools
    this.register({
      id: 'chart-generator',
      name: 'Chart Generator',
      description: 'Creates charts (bar, line, pie, scatter)',
      category: 'VISUALIZATION',
      input_schema: z.object({
        type: z.enum(['bar', 'line', 'pie', 'scatter']),
        data: z.array(z.object({ label: z.string(), value: z.number() })),
        title: z.string().optional(),
      }),
      output_schema: z.object({
        image_url: z.string(),
        chart_type: z.string(),
      }),
      execute: this.generateChart.bind(this),
      timeout_ms: 2000,
      cost_estimate: 0.005,
      requires_sandbox: false,
    });

    this.register({
      id: 'diagram-creator',
      name: 'Diagram Creator',
      description: 'Creates diagrams from Mermaid.js syntax',
      category: 'VISUALIZATION',
      input_schema: z.object({
        mermaid_code: z.string(),
      }),
      output_schema: z.object({
        image_url: z.string(),
      }),
      execute: this.createDiagram.bind(this),
      timeout_ms: 2000,
      cost_estimate: 0.003,
      requires_sandbox: false,
    });

    // 15+ more tools registered...
  }

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  getTool(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  listTools(category?: string): Tool[] {
    const allTools = Array.from(this.tools.values());
    return category ? allTools.filter((t) => t.category === category) : allTools;
  }

  private async executePython(input: { code: string; timeout_ms?: number }): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Use E2B sandbox for secure Python execution
      const sandbox = await this.getE2BSandbox('python');
      const execution = await sandbox.run({
        code: input.code,
        timeout: input.timeout_ms || 5000,
      });

      return {
        success: execution.error === null,
        output: {
          stdout: execution.stdout,
          stderr: execution.stderr,
          exit_code: execution.exitCode,
        },
        execution_time_ms: Date.now() - startTime,
        cost_usd: 0.01,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime,
        cost_usd: 0,
      };
    }
  }

  private async executeJavaScript(input: { code: string; timeout_ms?: number }): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const sandbox = await this.getE2BSandbox('nodejs');
      const execution = await sandbox.run({
        code: input.code,
        timeout: input.timeout_ms || 3000,
      });

      return {
        success: execution.error === null,
        output: {
          result: execution.result,
          console_output: execution.stdout,
        },
        execution_time_ms: Date.now() - startTime,
        cost_usd: 0.005,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime,
        cost_usd: 0,
      };
    }
  }

  private async solveSymbolic(input: {
    expression: string;
    operation: string;
    variable?: string;
  }): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Call SymPy backend service
      const response = await fetch('http://localhost:8001/sympy/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const result = await response.json();

      return {
        success: true,
        output: {
          result: result.result,
          latex: result.latex,
        },
        execution_time_ms: Date.now() - startTime,
        cost_usd: 0.002,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Symbolic math error',
        execution_time_ms: Date.now() - startTime,
        cost_usd: 0,
      };
    }
  }

  private async graphEquation(input: {
    equation: string;
    x_range: [number, number];
    y_range?: [number, number];
  }): Promise<ToolResult> {
    // Implementation using Desmos API or matplotlib backend
    // Returns image URL and data points
    return { success: true, output: {}, execution_time_ms: 0, cost_usd: 0.01 };
  }

  private async generateChart(input: {
    type: string;
    data: Array<{ label: string; value: number }>;
    title?: string;
  }): Promise<ToolResult> {
    // Implementation using Chart.js or D3.js backend
    return { success: true, output: {}, execution_time_ms: 0, cost_usd: 0.005 };
  }

  private async createDiagram(input: { mermaid_code: string }): Promise<ToolResult> {
    // Implementation using Mermaid.js rendering service
    return { success: true, output: {}, execution_time_ms: 0, cost_usd: 0.003 };
  }

  private async getE2BSandbox(language: 'python' | 'nodejs'): Promise<any> {
    // E2B sandbox integration
    return {} as any;
  }
}
```

---

### 2. Tool Selector

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface ToolSelection {
  tool_id: string;
  confidence: number; // 0-1
  reasoning: string;
  input_mapping: Record<string, unknown>;
}

export class ToolSelector {
  private anthropic: Anthropic;
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.registry = registry;
  }

  async selectTools(
    query: string,
    planStep: string,
    availableContext: string
  ): Promise<ToolSelection[]> {
    const availableTools = this.registry.listTools();

    const toolDescriptions = availableTools
      .map(
        (t) => `
**${t.id}** (${t.category})
Description: ${t.description}
Input: ${JSON.stringify(t.input_schema)}
Cost: $${t.cost_estimate}
Timeout: ${t.timeout_ms}ms
`
      )
      .join('\n');

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `You are a tool selection expert. Choose the appropriate tools to accomplish this learning task.

STUDENT QUERY: "${query}"

CURRENT PLAN STEP: "${planStep}"

AVAILABLE CONTEXT:
${availableContext}

AVAILABLE TOOLS:
${toolDescriptions}

SELECT TOOLS:
1. Choose 0-3 tools that are needed for this step
2. For each tool, provide confidence (0-1) and reasoning
3. Map the student's query/context to tool input parameters

Format as JSON array:
[
  {
    "tool_id": "python-executor",
    "confidence": 0.95,
    "reasoning": "Student provided Python code and wants to run it",
    "input_mapping": {
      "code": "extracted from student query"
    }
  }
]

If no tools are needed, return empty array [].`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const selections = JSON.parse(this.extractJSON(responseText)) as ToolSelection[];

    // Filter out low-confidence selections
    return selections.filter((s) => s.confidence >= 0.7);
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? jsonMatch[0] : '[]';
  }
}
```

---

### 3. Parallel Execution Engine

```typescript
interface ExecutionPlan {
  steps: Array<{
    tool_id: string;
    input: unknown;
    depends_on: number[]; // Indices of steps that must complete first
  }>;
}

interface ExecutionResult {
  step_index: number;
  tool_id: string;
  result: ToolResult;
  execution_order: number; // Order in which it completed
}

export class ParallelExecutor {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  async execute(plan: ExecutionPlan): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    const completed: Set<number> = new Set();
    let executionOrder = 0;

    // Build dependency graph
    const graph = this.buildDependencyGraph(plan);

    // Execute in parallel when possible
    while (completed.size < plan.steps.length) {
      // Find steps ready to execute (all dependencies met)
      const readySteps = plan.steps
        .map((step, index) => ({ step, index }))
        .filter(
          ({ step, index }) =>
            !completed.has(index) && step.depends_on.every((dep) => completed.has(dep))
        );

      if (readySteps.length === 0) {
        break; // Deadlock or circular dependency
      }

      // Execute all ready steps in parallel
      const executions = readySteps.map(async ({ step, index }) => {
        const tool = this.registry.getTool(step.tool_id);
        if (!tool) {
          throw new Error(`Tool ${step.tool_id} not found`);
        }

        const result = await tool.execute(step.input);
        return { step_index: index, tool_id: step.tool_id, result };
      });

      const batchResults = await Promise.all(executions);

      // Record results
      for (const result of batchResults) {
        results.push({
          ...result,
          execution_order: executionOrder++,
        });
        completed.add(result.step_index);
      }
    }

    // Sort by execution order for sequential presentation
    return results.sort((a, b) => a.execution_order - b.execution_order);
  }

  private buildDependencyGraph(plan: ExecutionPlan): Map<number, number[]> {
    const graph = new Map<number, number[]>();

    plan.steps.forEach((step, index) => {
      graph.set(index, step.depends_on);
    });

    return graph;
  }

  async executeSequential(plan: ExecutionPlan): Promise<ExecutionResult[]> {
    // Fallback: execute steps one by one
    const results: ExecutionResult[] = [];

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const tool = this.registry.getTool(step.tool_id);

      if (!tool) {
        throw new Error(`Tool ${step.tool_id} not found`);
      }

      const result = await tool.execute(step.input);
      results.push({
        step_index: i,
        tool_id: step.tool_id,
        result,
        execution_order: i,
      });
    }

    return results;
  }
}
```

---

### 4. Result Synthesizer

```typescript
export class ResultSynthesizer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async synthesize(
    query: string,
    toolResults: ExecutionResult[],
    context: string
  ): Promise<string> {
    const resultsFormatted = toolResults
      .map(
        (r) => `
**Tool**: ${r.tool_id}
**Success**: ${r.result.success}
**Output**: ${JSON.stringify(r.result.output, null, 2)}
${r.result.error ? `**Error**: ${r.result.error}` : ''}
**Execution Time**: ${r.result.execution_time_ms}ms
`
      )
      .join('\n---\n');

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `You are synthesizing tool execution results into a coherent educational response.

STUDENT QUERY: "${query}"

CONTEXT: ${context}

TOOL EXECUTION RESULTS:
${resultsFormatted}

INSTRUCTIONS:
1. Present tool outputs in a clear, educational manner
2. If code was executed, show the output clearly formatted
3. If visualizations were created, reference them and explain what they show
4. If errors occurred, explain them helpfully
5. Connect tool outputs to the learning objective
6. Keep the tone encouraging and educational

Generate a comprehensive response that integrates all tool outputs:`,
        },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  async synthesizeWithVisualization(
    explanation: string,
    visualizationUrls: string[]
  ): Promise<string> {
    let response = explanation;

    if (visualizationUrls.length > 0) {
      response += '\n\n**Visualizations**:\n';
      visualizationUrls.forEach((url, i) => {
        response += `\n${i + 1}. ![Visualization ${i + 1}](${url})`;
      });
    }

    return response;
  }
}
```

---

### 5. Tool Orchestrator (Main Controller)

```typescript
export class ToolOrchestrator {
  private registry: ToolRegistry;
  private selector: ToolSelector;
  private executor: ParallelExecutor;
  private synthesizer: ResultSynthesizer;

  constructor() {
    this.registry = new ToolRegistry();
    this.selector = new ToolSelector(this.registry);
    this.executor = new ParallelExecutor(this.registry);
    this.synthesizer = new ResultSynthesizer();
  }

  async orchestrate(
    query: string,
    planStep: string,
    context: string
  ): Promise<{ response: string; tools_used: string[] }> {
    const startTime = Date.now();

    try {
      // Step 1: Select appropriate tools
      const toolSelections = await this.selector.selectTools(query, planStep, context);

      if (toolSelections.length === 0) {
        // No tools needed, return early
        return { response: 'No tools required for this step', tools_used: [] };
      }

      console.log(
        `Selected ${toolSelections.length} tools: ${toolSelections.map((t) => t.tool_id).join(', ')}`
      );

      // Step 2: Build execution plan
      const executionPlan: ExecutionPlan = {
        steps: toolSelections.map((selection, index) => ({
          tool_id: selection.tool_id,
          input: selection.input_mapping,
          depends_on: this.inferDependencies(toolSelections, index),
        })),
      };

      // Step 3: Execute tools (parallel when possible)
      const results = await this.executor.execute(executionPlan);

      // Step 4: Track metrics
      await this.trackMetrics(results);

      // Step 5: Synthesize results
      const response = await this.synthesizer.synthesize(query, results, context);

      // Step 6: Add visualizations if present
      const visualizationUrls = this.extractVisualizationUrls(results);
      const finalResponse = await this.synthesizer.synthesizeWithVisualization(
        response,
        visualizationUrls
      );

      const totalTime = Date.now() - startTime;
      console.log(`Tool orchestration completed in ${totalTime}ms`);

      return {
        response: finalResponse,
        tools_used: toolSelections.map((t) => t.tool_id),
      };
    } catch (error) {
      console.error('Tool orchestration error:', error);
      return {
        response: 'I encountered an error while using the tools. Let me explain the concept instead...',
        tools_used: [],
      };
    }
  }

  private inferDependencies(selections: ToolSelection[], currentIndex: number): number[] {
    // Simple heuristic: code execution must happen before visualization
    const dependencies: number[] = [];

    const currentTool = this.registry.getTool(selections[currentIndex].tool_id);

    if (currentTool?.category === 'VISUALIZATION') {
      // Visualization tools depend on prior code execution tools
      for (let i = 0; i < currentIndex; i++) {
        const priorTool = this.registry.getTool(selections[i].tool_id);
        if (priorTool?.category === 'CODE') {
          dependencies.push(i);
        }
      }
    }

    return dependencies;
  }

  private extractVisualizationUrls(results: ExecutionResult[]): string[] {
    const urls: string[] = [];

    for (const result of results) {
      if (result.result.success && result.result.output) {
        const output = result.result.output as any;

        if (output.image_url) {
          urls.push(output.image_url);
        }

        if (output.chart_url) {
          urls.push(output.chart_url);
        }
      }
    }

    return urls;
  }

  private async trackMetrics(results: ExecutionResult[]): Promise<void> {
    for (const result of results) {
      toolExecutionDuration.observe(
        { tool_id: result.tool_id },
        result.result.execution_time_ms / 1000
      );

      toolSuccessRate.set(
        { tool_id: result.tool_id },
        result.result.success ? 1 : 0
      );

      if (result.result.cost_usd > 0) {
        toolCostTotal.inc({ tool_id: result.tool_id }, result.result.cost_usd);
      }
    }
  }
}
```

---

## 📊 Database Schema

```prisma
// Tool execution history
model ToolExecution {
  id                String   @id @default(uuid())
  userId            String
  conversationId    String
  toolId            String
  input             Json
  output            Json?
  success           Boolean
  error             String?
  executionTimeMs   Int
  costUsd           Float
  createdAt         DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([conversationId])
  @@index([toolId])
  @@index([createdAt])
}

// Tool performance metrics
model ToolMetrics {
  id                String   @id @default(uuid())
  toolId            String   @unique
  totalExecutions   Int      @default(0)
  successfulRuns    Int      @default(0)
  failedRuns        Int      @default(0)
  avgExecutionMs    Float    @default(0)
  totalCostUsd      Float    @default(0)
  lastUsed          DateTime
  updatedAt         DateTime @updatedAt

  @@index([toolId])
}
```

---

## 📈 Metrics & Monitoring

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Tool execution metrics
export const toolExecutionDuration = new Histogram({
  name: 'tool_execution_duration_seconds',
  help: 'Time taken to execute tools',
  labelNames: ['tool_id'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const toolSuccessRate = new Gauge({
  name: 'tool_success_rate',
  help: 'Success rate of tool executions (0-1)',
  labelNames: ['tool_id'],
  registers: [register],
});

export const toolCostTotal = new Counter({
  name: 'tool_cost_usd_total',
  help: 'Total cost of tool executions in USD',
  labelNames: ['tool_id'],
  registers: [register],
});

// Orchestration metrics
export const orchestrationOverhead = new Histogram({
  name: 'tool_orchestration_overhead_seconds',
  help: 'Overhead time for tool coordination',
  buckets: [0.05, 0.1, 0.2, 0.5, 1],
  registers: [register],
});

export const parallelSpeedup = new Gauge({
  name: 'tool_parallel_speedup_factor',
  help: 'Speedup achieved by parallel execution vs sequential',
  registers: [register],
});

export const toolSelectionAccuracy = new Gauge({
  name: 'tool_selection_accuracy',
  help: 'Accuracy of tool selection by AI (0-1)',
  registers: [register],
});
```

---

## 🧪 Testing Strategy

```typescript
describe('ToolOrchestrator', () => {
  let orchestrator: ToolOrchestrator;

  beforeEach(() => {
    orchestrator = new ToolOrchestrator();
  });

  it('should execute Python code successfully', async () => {
    const result = await orchestrator.orchestrate(
      'Run this Python code: print("Hello, World!")',
      'Execute student code',
      'Student learning Python basics'
    );

    expect(result.tools_used).toContain('python-executor');
    expect(result.response).toContain('Hello, World!');
  });

  it('should execute multiple tools in parallel', async () => {
    const startTime = Date.now();

    const result = await orchestrator.orchestrate(
      'Run this code and visualize the output: data = [1, 2, 3, 4, 5]',
      'Execute and visualize',
      ''
    );

    const endTime = Date.now();

    // Should be faster than sequential execution
    expect(endTime - startTime).toBeLessThan(3000);
    expect(result.tools_used.length).toBeGreaterThan(1);
  });

  it('should handle tool errors gracefully', async () => {
    const result = await orchestrator.orchestrate(
      'Run this invalid Python: print(undefined_variable)',
      'Execute code',
      ''
    );

    expect(result.response).toContain('error');
    expect(result.response).not.toContain('undefined');
  });
});
```

---

## 💰 Budget Breakdown

### Engineering Costs: $38,000
- **Senior Backend Engineer** (3 weeks × $10,000/week): $30,000
  - Tool registry implementation
  - Parallel execution engine
  - E2B sandbox integration
- **ML Engineer** (1 week × $12,000/week): $12,000 (partial allocation)
  - Tool selector AI
  - Result synthesizer
- **QA Engineer** (1 week × $2,000/week): $2,000
  - Tool testing and validation

### Infrastructure Costs: $15,000
- **E2B Sandboxes** (code execution): $8,000
- **API Services** (Desmos, Wolfram, etc.): $4,000
- **CDN** (visualization storage): $2,000
- **Monitoring**: $1,000

### Third-Party Services: $7,000
- **E2B Cloud** (secure code execution): $5,000
- **Math/Visualization APIs**: $2,000

**Total Initiative Budget**: **$60,000**

---

## 🎯 Acceptance Criteria

Initiative 4.2 is complete when:

1. ✅ **Tool Registry**: 20+ tools registered and functioning
2. ✅ **Tool Selector**: >90% accuracy selecting appropriate tools
3. ✅ **Parallel Execution**: 2-3x speedup for multi-tool tasks
4. ✅ **Code Execution**: 95%+ success rate for Python/JavaScript
5. ✅ **Visualizations**: Graphs and charts generated correctly
6. ✅ **Result Synthesis**: >4.5/5 quality rating
7. ✅ **Error Handling**: 100% of tool failures handled gracefully
8. ✅ **Performance**: <500ms p95 tool execution, <200ms orchestration overhead
9. ✅ **Security**: 0 sandbox escapes or security issues
10. ✅ **Production Deployment**: All tools deployed and monitored

---

*This tool orchestration system transforms SAM from text-only explanations into interactive, hands-on learning with code execution, visualizations, and simulations.*
