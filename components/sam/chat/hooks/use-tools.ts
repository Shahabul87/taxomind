import { useCallback, useEffect, useState } from 'react';
import type { ToolSummary, ToolExecutionResult, ToolConfirmation, ToolStatus, PageContext, EntityContextState } from '../types';
import type { ToolApprovalRequest, RiskLevel, ToolCategory } from '@/components/sam/ToolApprovalDialog';
import type { SAMContext } from '@sam-ai/core';

// =============================================================================
// Tool Approval Persistence
// =============================================================================

const TOOL_APPROVAL_PREFS_KEY = 'sam-tool-approval-preferences';

interface ToolApprovalPreference {
  toolId: string;
  autoApprove: boolean;
  approvedAt: number;
}

function getToolApprovalPreferences(): Record<string, ToolApprovalPreference> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(TOOL_APPROVAL_PREFS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setToolApprovalPreference(toolId: string, autoApprove: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const prefs = getToolApprovalPreferences();
    prefs[toolId] = { toolId, autoApprove, approvedAt: Date.now() };
    localStorage.setItem(TOOL_APPROVAL_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    console.warn('[SAM] Failed to save tool approval preference');
  }
}

function isToolPreApproved(toolId: string): boolean {
  const prefs = getToolApprovalPreferences();
  return prefs[toolId]?.autoApprove ?? false;
}

// =============================================================================
// Hook
// =============================================================================

interface UseChatToolsOptions {
  userId?: string;
  isOpen: boolean;
  sessionId?: string;
  pageContext: PageContext;
  entityContext: EntityContextState;
  buildContextUpdate: () => { effectiveEntityContext: EntityContextState };
}

interface UseChatToolsReturn {
  tools: ToolSummary[];
  isLoadingTools: boolean;
  toolsError: string | null;
  selectedTool: ToolSummary | null;
  toolInput: string;
  toolResult: ToolExecutionResult | null;
  toolStatus: ToolStatus;
  toolError: string | null;
  toolConfirmations: ToolConfirmation[];
  activeApprovalRequest: ToolApprovalRequest | null;
  isApprovalDialogOpen: boolean;
  isApprovalProcessing: boolean;
  setSelectedTool: (tool: ToolSummary | null) => void;
  setToolInput: (input: string) => void;
  selectTool: (tool: ToolSummary) => void;
  invokeTool: (tool: ToolSummary) => Promise<void>;
  handleApprove: (requestId: string, rememberChoice: boolean) => Promise<void>;
  handleDeny: (requestId: string) => Promise<void>;
  setIsApprovalDialogOpen: (open: boolean) => void;
  fetchTools: () => Promise<void>;
}

export function useChatTools(options: UseChatToolsOptions): UseChatToolsReturn {
  const { userId, isOpen, sessionId, pageContext, buildContextUpdate } = options;

  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolSummary | null>(null);
  const [toolInput, setToolInput] = useState('{\n  \n}');
  const [toolResult, setToolResult] = useState<ToolExecutionResult | null>(null);
  const [toolStatus, setToolStatus] = useState<ToolStatus>('idle');
  const [toolError, setToolError] = useState<string | null>(null);
  const [toolConfirmations, setToolConfirmations] = useState<ToolConfirmation[]>([]);
  const [activeApprovalRequest, setActiveApprovalRequest] = useState<ToolApprovalRequest | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isApprovalProcessing, setIsApprovalProcessing] = useState(false);

  const fetchTools = useCallback(async () => {
    if (!userId) return;
    setIsLoadingTools(true);
    setToolsError(null);

    try {
      const response = await fetch('/api/sam/agentic/tools');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to load tools');
      }

      if (data.success && data.data?.tools) {
        setTools(data.data.tools as ToolSummary[]);
      } else {
        setTools([]);
      }
    } catch (fetchError) {
      console.error('[SAM] Failed to fetch tools:', fetchError);
      setToolsError((fetchError as Error).message);
    } finally {
      setIsLoadingTools(false);
    }
  }, [userId]);

  const fetchToolConfirmations = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/sam/agentic/tools/confirmations');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to load confirmations');
      }

      if (data.success && data.data?.confirmations) {
        setToolConfirmations(data.data.confirmations as ToolConfirmation[]);
      } else {
        setToolConfirmations([]);
      }
    } catch (fetchError) {
      console.error('[SAM] Failed to fetch confirmations:', fetchError);
    }
  }, [userId]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    fetchTools();
    fetchToolConfirmations();
  }, [isOpen, userId, fetchTools, fetchToolConfirmations]);

  const deriveToolStatus = (status: string, awaitingConfirmation?: boolean): ToolStatus => {
    if (awaitingConfirmation || status === 'awaiting_confirmation') return 'awaiting_confirmation';
    if (status === 'success') return 'completed';
    if (['failed', 'denied', 'cancelled', 'timeout'].includes(status)) return 'failed';
    if (['pending', 'executing'].includes(status)) return 'running';
    return 'completed';
  };

  const selectTool = useCallback((tool: ToolSummary) => {
    setSelectedTool(tool);
    setToolInput('{\n  \n}');
    setToolError(null);
    setToolStatus('idle');
    setToolResult(null);
  }, []);

  const invokeTool = useCallback(
    async (tool: ToolSummary) => {
      if (!userId) return;

      if (!tool.enabled) {
        setToolError('Tool is disabled.');
        setToolStatus('failed');
        return;
      }

      if (!sessionId) {
        setToolError('SAM session not initialized yet.');
        setToolStatus('failed');
        return;
      }

      const trimmedInput = toolInput.trim();
      let inputPayload: unknown = {};

      if (trimmedInput) {
        try {
          inputPayload = JSON.parse(trimmedInput);
        } catch {
          setToolError('Tool input must be valid JSON.');
          setToolStatus('failed');
          return;
        }
      }

      setToolStatus('running');
      setToolError(null);
      setToolResult(null);

      try {
        const { effectiveEntityContext } = buildContextUpdate();
        const response = await fetch('/api/sam/agentic/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: tool.id,
            input: inputPayload,
            sessionId,
            metadata: {
              pageContext: {
                type: pageContext.pageType,
                path: pageContext.path,
                entityId: pageContext.entityId,
                parentEntityId: pageContext.parentEntityId,
                grandParentEntityId: pageContext.grandParentEntityId,
              },
              entityContext: effectiveEntityContext,
            },
          }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.error ?? 'Failed to invoke tool.');
        }

        const payload = await response.json();
        if (!payload.success) {
          throw new Error(payload.error ?? 'Failed to invoke tool.');
        }

        const execution = payload.data ?? {};
        const status = typeof execution.status === 'string' ? execution.status : 'success';
        const awaitingConfirmation = Boolean(execution.awaitingConfirmation);

        setToolResult({
          toolId: tool.id,
          invocationId: execution.invocation?.id ?? execution.invocationId,
          status,
          awaitingConfirmation,
          confirmationId: execution.confirmationId,
          result: execution.result,
          updatedAt: new Date().toISOString(),
        });
        setToolStatus(deriveToolStatus(status, awaitingConfirmation));

        if (awaitingConfirmation) {
          await fetchToolConfirmations();
        }
      } catch (invokeError) {
        setToolError((invokeError as Error).message);
        setToolStatus('failed');
      }
    },
    [userId, sessionId, toolInput, buildContextUpdate, pageContext, fetchToolConfirmations]
  );

  const handleToolConfirmation = useCallback(
    async (confirmationId: string, confirmed: boolean) => {
      if (!userId) return;

      try {
        const response = await fetch('/api/sam/agentic/tools/confirmations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmationId, confirmed }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.error ?? 'Failed to respond to confirmation.');
        }

        const payload = await response.json();
        if (!payload.success) {
          throw new Error(payload.error ?? 'Failed to respond to confirmation.');
        }

        const execution = payload.data ?? {};
        const status = typeof execution.status === 'string'
          ? execution.status
          : confirmed
            ? 'success'
            : 'denied';

        setToolResult({
          toolId: execution.invocation?.toolId ?? selectedTool?.id ?? 'tool',
          invocationId: execution.invocation?.id ?? execution.invocationId,
          status,
          awaitingConfirmation: false,
          result: execution.result,
          updatedAt: new Date().toISOString(),
        });
        setToolStatus(deriveToolStatus(status, false));

        await fetchToolConfirmations();
      } catch (confirmError) {
        console.error('[SAM] Confirmation error:', confirmError);
      }
    },
    [userId, selectedTool?.id, fetchToolConfirmations]
  );

  const convertToApprovalRequest = useCallback(
    (confirmation: ToolConfirmation): ToolApprovalRequest => {
      const riskLevelMap: Record<string, RiskLevel> = {
        low: 'low',
        medium: 'medium',
        high: 'high',
        critical: 'high',
      };

      const categoryMap: Record<string, ToolCategory> = {
        generate: 'content',
        create: 'content',
        assess: 'assessment',
        evaluate: 'assessment',
        quiz: 'assessment',
        memory: 'memory',
        recall: 'memory',
        context: 'memory',
        send: 'communication',
        notify: 'communication',
        email: 'communication',
        analyze: 'analysis',
        review: 'analysis',
        course: 'course',
        chapter: 'course',
        section: 'course',
        external: 'external',
        fetch: 'external',
        api: 'external',
        admin: 'admin',
        modify: 'admin',
        delete: 'admin',
      };

      const toolNameLower = confirmation.toolName.toLowerCase();
      let category: ToolCategory = 'content';
      for (const [key, value] of Object.entries(categoryMap)) {
        if (toolNameLower.includes(key)) {
          category = value;
          break;
        }
      }

      const reads: string[] = [];
      const writes: string[] = [];
      const external: string[] = [];

      if (confirmation.details) {
        for (const detail of confirmation.details) {
          if (detail.type === 'warning' || detail.label.toLowerCase().includes('access')) {
            if (detail.label.toLowerCase().includes('read')) reads.push(detail.value);
            else if (detail.label.toLowerCase().includes('write') || detail.label.toLowerCase().includes('modify')) writes.push(detail.value);
            else if (detail.label.toLowerCase().includes('external')) external.push(detail.value);
          }
        }
      }

      const parameters: Record<string, unknown> = {};
      if (confirmation.details) {
        for (const detail of confirmation.details) {
          if (detail.type === 'json' || detail.type === 'code') {
            try {
              parameters[detail.label] = JSON.parse(detail.value);
            } catch {
              parameters[detail.label] = detail.value;
            }
          } else if (detail.type === 'text') {
            parameters[detail.label] = detail.value;
          }
        }
      }

      return {
        id: confirmation.id,
        toolId: confirmation.toolId,
        toolName: confirmation.toolName,
        description: confirmation.title,
        category,
        riskLevel: riskLevelMap[confirmation.severity] || 'medium',
        reason: confirmation.message,
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
        estimatedDuration: confirmation.timeout,
        permissions: {
          reads: reads.length > 0 ? reads : undefined,
          writes: writes.length > 0 ? writes : undefined,
          external: external.length > 0 ? external : undefined,
        },
        context: {
          conversationId: sessionId,
        },
      };
    },
    [sessionId]
  );

  // Auto-open dialog when new confirmations arrive
  useEffect(() => {
    if (toolConfirmations.length > 0 && !isApprovalDialogOpen && !activeApprovalRequest) {
      const firstPending = toolConfirmations.find((c) => c.status === 'pending');
      if (firstPending) {
        if (isToolPreApproved(firstPending.toolId)) {
          handleToolConfirmation(firstPending.id, true);
        } else {
          const request = convertToApprovalRequest(firstPending);
          setActiveApprovalRequest(request);
          setIsApprovalDialogOpen(true);
        }
      }
    }
  }, [toolConfirmations, isApprovalDialogOpen, activeApprovalRequest, convertToApprovalRequest, handleToolConfirmation]);

  const handleApprove = useCallback(
    async (requestId: string, rememberChoice: boolean) => {
      setIsApprovalProcessing(true);
      try {
        await handleToolConfirmation(requestId, true);
        if (rememberChoice && activeApprovalRequest?.toolId) {
          setToolApprovalPreference(activeApprovalRequest.toolId, true);
        }
      } finally {
        setIsApprovalProcessing(false);
        setIsApprovalDialogOpen(false);
        setActiveApprovalRequest(null);
      }
    },
    [handleToolConfirmation, activeApprovalRequest?.toolId]
  );

  const handleDeny = useCallback(
    async (requestId: string) => {
      setIsApprovalProcessing(true);
      try {
        await handleToolConfirmation(requestId, false);
      } finally {
        setIsApprovalProcessing(false);
        setIsApprovalDialogOpen(false);
        setActiveApprovalRequest(null);
      }
    },
    [handleToolConfirmation]
  );

  return {
    tools,
    isLoadingTools,
    toolsError,
    selectedTool,
    toolInput,
    toolResult,
    toolStatus,
    toolError,
    toolConfirmations,
    activeApprovalRequest,
    isApprovalDialogOpen,
    isApprovalProcessing,
    setSelectedTool,
    setToolInput,
    selectTool,
    invokeTool,
    handleApprove,
    handleDeny,
    setIsApprovalDialogOpen,
    fetchTools,
  };
}
