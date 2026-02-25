/**
 * Tests for lib/sam/tool-planner.ts
 *
 * Verifies planToolInvocation, auto-invoke logic, tool scoring,
 * and mode-tool affinity.
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { planToolInvocation, type PlannedToolInvocation, type ToolPlanContext } from '@/lib/sam/tool-planner';
import type { ToolDefinition } from '@sam-ai/agentic';

const mockAI = {
  chat: jest.fn().mockResolvedValue({
    content: JSON.stringify({ action: 'none' }),
  }),
};

const sampleTool: ToolDefinition = {
  id: 'sam-skill-roadmap-generator',
  name: 'Skill Roadmap Generator',
  description: 'Generates a personalized learning roadmap for a skill',
  category: 'learning',
  version: '1.0.0',
  enabled: true,
  requiredPermissions: [],
  confirmationType: 'none',
  parameters: {},
  execute: jest.fn(),
} as unknown as ToolDefinition;

const examTool: ToolDefinition = {
  id: 'sam-exam-builder',
  name: 'Exam Builder',
  description: 'Creates exams with Bloom taxonomy alignment',
  category: 'assessment',
  version: '1.0.0',
  enabled: true,
  requiredPermissions: [],
  confirmationType: 'none',
  parameters: {},
  execute: jest.fn(),
} as unknown as ToolDefinition;

describe('planToolInvocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({ action: 'none' }),
    });
  });

  it('should return null for empty message', async () => {
    const result = await planToolInvocation({
      ai: mockAI as any,
      message: '',
      tools: [sampleTool],
    });
    expect(result).toBeNull();
  });

  it('should return null for empty tools list', async () => {
    const result = await planToolInvocation({
      ai: mockAI as any,
      message: 'I want to learn React',
      tools: [],
    });
    expect(result).toBeNull();
  });

  it('should return null when AI decides no tool is needed', async () => {
    const result = await planToolInvocation({
      ai: mockAI as any,
      message: 'Hello there',
      tools: [sampleTool],
    });
    expect(result).toBeNull();
  });

  it('should auto-invoke skill roadmap tool in skill-roadmap-builder mode', async () => {
    const result = await planToolInvocation({
      ai: mockAI as any,
      message: 'I want to learn React',
      tools: [sampleTool],
      context: {
        modeContext: {
          modeId: 'skill-roadmap-builder',
          modeLabel: 'Skill Roadmap Builder',
        },
      },
    });
    expect(result).not.toBeNull();
    expect(result?.tool.id).toBe('sam-skill-roadmap-generator');
    expect(result?.confidence).toBe(0.95);
    expect(result?.reasoning).toContain('Auto-invoked');
  });

  it('should auto-invoke exam builder in exam-builder mode', async () => {
    const result = await planToolInvocation({
      ai: mockAI as any,
      message: 'Create an exam about JavaScript',
      tools: [examTool],
      context: {
        modeContext: {
          modeId: 'exam-builder',
          modeLabel: 'Exam Builder',
        },
      },
    });
    expect(result).not.toBeNull();
    expect(result?.tool.id).toBe('sam-exam-builder');
  });

  it('should return tool invocation when AI selects a tool', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        action: 'call_tool',
        toolId: 'sam-skill-roadmap-generator',
        input: { skillName: 'Python' },
        reasoning: 'User wants to learn Python',
        confidence: 0.85,
      }),
    });

    const result = await planToolInvocation({
      ai: mockAI as any,
      message: 'Build me a Python learning roadmap',
      tools: [sampleTool],
    });

    expect(result).not.toBeNull();
    expect(result?.tool.id).toBe('sam-skill-roadmap-generator');
    expect(result?.input).toEqual({ skillName: 'Python' });
  });

  it('should return null when confidence is below threshold', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        action: 'call_tool',
        toolId: 'sam-skill-roadmap-generator',
        confidence: 0.3,
      }),
    });

    const result = await planToolInvocation({
      ai: mockAI as any,
      message: 'maybe learn something',
      tools: [sampleTool],
      minConfidence: 0.55,
    });
    expect(result).toBeNull();
  });

  it('should return null when tool ID is not in allowed list', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        action: 'call_tool',
        toolId: 'unknown-tool',
        confidence: 0.9,
      }),
    });

    const result = await planToolInvocation({
      ai: mockAI as any,
      message: 'do something',
      tools: [sampleTool],
    });
    expect(result).toBeNull();
  });

  it('should handle malformed AI response gracefully', async () => {
    mockAI.chat.mockResolvedValue({
      content: 'This is not valid JSON at all',
    });

    const result = await planToolInvocation({
      ai: mockAI as any,
      message: 'some request',
      tools: [sampleTool],
    });
    expect(result).toBeNull();
  });
});
