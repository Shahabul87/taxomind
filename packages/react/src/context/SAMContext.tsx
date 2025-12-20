/**
 * @sam-ai/react - SAM Context
 * React context for SAM AI Tutor state management
 */

'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import {
  createDefaultContext,
  createOrchestrator,
  createStateMachine,
  createContextEngine,
  createBloomsEngine,
  createContentEngine,
  createAssessmentEngine,
  createPersonalizationEngine,
  createResponseEngine,
  type SAMContext as SAMContextType,
  type SAMMessage,
  type SAMAction,
  type SAMSuggestion,
  type SAMFormField,
  type SAMState,
  type OrchestrationResult,
  type BloomsAnalysis,
  type SAMAgentOrchestrator,
  type SAMStateMachine,
} from '@sam-ai/core';
import type { SAMProviderConfig, SAMProviderState, UseSAMReturn } from '../types';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

type SAMAction_Internal =
  | { type: 'SET_STATE'; payload: SAMState }
  | { type: 'SET_CONTEXT'; payload: SAMContextType }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<SAMContextType> }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: SAMMessage }
  | { type: 'SET_MESSAGES'; payload: SAMMessage[] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_RESULT'; payload: OrchestrationResult | null }
  | { type: 'SET_SUGGESTIONS'; payload: SAMSuggestion[] }
  | { type: 'SET_ACTIONS'; payload: SAMAction[] };

function samReducer(state: SAMProviderState, action: SAMAction_Internal): SAMProviderState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, state: action.payload };
    case 'SET_CONTEXT':
      return { ...state, context: action.payload };
    case 'UPDATE_CONTEXT':
      return {
        ...state,
        context: {
          ...state.context,
          ...action.payload,
          user: { ...state.context.user, ...action.payload.user },
          page: { ...state.context.page, ...action.payload.page },
          form: action.payload.form !== undefined
            ? action.payload.form
            : state.context.form,
          conversation: { ...state.context.conversation, ...action.payload.conversation },
          gamification: { ...state.context.gamification, ...action.payload.gamification },
          ui: { ...state.context.ui, ...action.payload.ui },
          metadata: { ...state.context.metadata, ...action.payload.metadata },
        },
      };
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        context: {
          ...state.context,
          conversation: {
            ...state.context.conversation,
            messages: [...state.context.conversation.messages, action.payload],
          },
        },
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        context: {
          ...state.context,
          conversation: {
            ...state.context.conversation,
            messages: action.payload,
          },
        },
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        context: {
          ...state.context,
          conversation: {
            ...state.context.conversation,
            messages: [],
          },
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RESULT':
      return { ...state, lastResult: action.payload };
    case 'SET_SUGGESTIONS':
      return { ...state };
    case 'SET_ACTIONS':
      return { ...state };
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface SAMContextValue extends UseSAMReturn {
  orchestrator: SAMAgentOrchestrator | null;
  stateMachine: SAMStateMachine | null;
}

const SAMContext = createContext<SAMContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface SAMProviderProps extends SAMProviderConfig {
  children: ReactNode;
}

export function SAMProvider({
  children,
  config,
  initialContext,
  autoDetectContext = false,
  debug = false,
  onStateChange,
  onError,
}: SAMProviderProps) {
  // Create initial state
  const initialState: SAMProviderState = useMemo(
    () => ({
      context: createDefaultContext(initialContext),
      state: 'idle' as SAMState,
      isOpen: false,
      isProcessing: false,
      isStreaming: false,
      messages: initialContext?.conversation?.messages ?? [],
      error: null,
      lastResult: null,
    }),
    [initialContext]
  );

  const [state, dispatch] = useReducer(samReducer, initialState);

  // Create orchestrator and state machine
  const { orchestrator, stateMachine } = useMemo(() => {
    const sm = createStateMachine();
    const orch = createOrchestrator(config);

    // Register all engines
    orch.registerEngine(createContextEngine(config));
    orch.registerEngine(createBloomsEngine(config));
    orch.registerEngine(createContentEngine(config));
    orch.registerEngine(createAssessmentEngine(config));
    orch.registerEngine(createPersonalizationEngine(config));
    orch.registerEngine(createResponseEngine(config));

    return { orchestrator: orch, stateMachine: sm };
  }, [config]);

  // Subscribe to state machine changes
  useEffect(() => {
    const unsubscribe = stateMachine.subscribe((newState) => {
      dispatch({ type: 'SET_STATE', payload: newState });
      onStateChange?.(newState);

      if (debug) {
        console.log('[SAM] State changed:', newState);
      }
    });

    // Initialize state machine
    stateMachine.send({ type: 'INITIALIZE', payload: { context: state.context } });

    return unsubscribe;
  }, [stateMachine, onStateChange, debug, state.context]);

  // Auto-detect context from URL
  // Note: We intentionally exclude state.context.page from deps to avoid infinite loops
  // since this effect updates the page context. It should only run on mount.
  useEffect(() => {
    if (autoDetectContext && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const detectedContext = detectContextFromPath(path);

      dispatch({
        type: 'UPDATE_CONTEXT',
        payload: { page: { ...state.context.page, ...detectedContext } },
      });

      if (debug) {
        console.log('[SAM] Auto-detected context:', detectedContext);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetectContext, debug]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const open = useCallback(() => {
    dispatch({ type: 'SET_OPEN', payload: true });
    stateMachine.send({ type: 'OPEN' });
  }, [stateMachine]);

  const close = useCallback(() => {
    dispatch({ type: 'SET_OPEN', payload: false });
    stateMachine.send({ type: 'CLOSE' });
  }, [stateMachine]);

  const toggle = useCallback(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, open, close]);

  const sendMessage = useCallback(
    async (content: string): Promise<OrchestrationResult | null> => {
      try {
        dispatch({ type: 'SET_PROCESSING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        // Add user message
        const userMessage: SAMMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

        // Send to state machine
        stateMachine.send({ type: 'SEND_MESSAGE', payload: userMessage });

        // Run orchestration
        const result = await orchestrator.orchestrate(state.context, content, {
          parallel: true,
        });

        // Add assistant response
        const assistantMessage: SAMMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: result.response.message,
          timestamp: new Date(),
          metadata: {
            suggestions: result.response.suggestions,
            actions: result.response.actions,
          },
        };
        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
        dispatch({ type: 'SET_RESULT', payload: result });

        // Notify state machine
        stateMachine.send({
          type: 'RECEIVE_RESPONSE',
          payload: assistantMessage,
        });

        if (debug) {
          console.log('[SAM] Orchestration result:', result);
        }

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: 'SET_ERROR', payload: err });
        onError?.(err);

        if (debug) {
          console.error('[SAM] Error:', err);
        }

        return null;
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    },
    [orchestrator, stateMachine, state.context, debug, onError]
  );

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const updateContext = useCallback((updates: Partial<SAMContextType>) => {
    dispatch({ type: 'UPDATE_CONTEXT', payload: updates });
  }, []);

  const updatePage = useCallback((page: Partial<SAMContextType['page']>) => {
    dispatch({ type: 'UPDATE_CONTEXT', payload: { page: { ...state.context.page, ...page } } });
  }, [state.context.page]);

  const updateForm = useCallback((fields: Record<string, SAMFormField>) => {
    if (!state.context.form) return;
    dispatch({
      type: 'UPDATE_CONTEXT',
      payload: {
        form: {
          ...state.context.form,
          fields,
          lastUpdated: new Date(),
        },
      },
    });
  }, [state.context.form]);

  const analyze = useCallback(
    async (query?: string): Promise<OrchestrationResult | null> => {
      try {
        dispatch({ type: 'SET_PROCESSING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        const result = await orchestrator.orchestrate(
          state.context,
          query ?? 'Analyze the current context',
          { parallel: true }
        );

        dispatch({ type: 'SET_RESULT', payload: result });

        if (debug) {
          console.log('[SAM] Analysis result:', result);
        }

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: 'SET_ERROR', payload: err });
        onError?.(err);
        return null;
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    },
    [orchestrator, state.context, debug, onError]
  );

  const getBloomsAnalysis = useCallback((): BloomsAnalysis | null => {
    if (!state.lastResult?.results?.blooms?.success) {
      return null;
    }
    return (state.lastResult.results.blooms.data as { analysis: BloomsAnalysis })?.analysis ?? null;
  }, [state.lastResult]);

  const executeAction = useCallback(
    async (action: SAMAction): Promise<void> => {
      if (debug) {
        console.log('[SAM] Executing action:', action);
      }

      stateMachine.send({
        type: 'EXECUTE_ACTION',
        payload: action,
      });

      // Action execution would be handled by the consuming application
      // This is a hook point for custom action handlers
    },
    [stateMachine, debug]
  );

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const suggestions = useMemo((): SAMSuggestion[] => {
    return state.lastResult?.response.suggestions ?? [];
  }, [state.lastResult]);

  const actions = useMemo((): SAMAction[] => {
    return state.lastResult?.response.actions ?? [];
  }, [state.lastResult]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: SAMContextValue = useMemo(
    () => ({
      // State
      ...state,
      suggestions,
      actions,

      // Actions
      open,
      close,
      toggle,
      sendMessage,
      clearMessages,
      clearError,
      updateContext,
      updatePage,
      updateForm,
      analyze,
      getBloomsAnalysis,
      executeAction,

      // Internal
      orchestrator,
      stateMachine,
    }),
    [
      state,
      suggestions,
      actions,
      open,
      close,
      toggle,
      sendMessage,
      clearMessages,
      clearError,
      updateContext,
      updatePage,
      updateForm,
      analyze,
      getBloomsAnalysis,
      executeAction,
      orchestrator,
      stateMachine,
    ]
  );

  return <SAMContext.Provider value={contextValue}>{children}</SAMContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSAMContext(): SAMContextValue {
  const context = useContext(SAMContext);

  if (!context) {
    throw new Error('useSAMContext must be used within a SAMProvider');
  }

  return context;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectContextFromPath(path: string): Partial<SAMContextType['page']> {
  // Default route patterns
  const patterns: Array<{ pattern: RegExp; type: SAMContextType['page']['type']; extract?: (match: RegExpMatchArray) => Partial<SAMContextType['page']> }> = [
    {
      pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)\/section\/([^/]+)/,
      type: 'section-detail',
      extract: (match) => ({
        entityId: match[3],
        parentEntityId: match[2],
        grandParentEntityId: match[1],
      }),
    },
    {
      pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)/,
      type: 'chapter-detail',
      extract: (match) => ({
        entityId: match[2],
        parentEntityId: match[1],
      }),
    },
    {
      pattern: /^\/teacher\/courses\/([^/]+)/,
      type: 'course-detail',
      extract: (match) => ({
        entityId: match[1],
      }),
    },
    {
      pattern: /^\/teacher\/courses/,
      type: 'courses-list',
    },
    {
      pattern: /^\/teacher\/create/,
      type: 'course-create',
    },
    {
      pattern: /^\/courses\/([^/]+)/,
      type: 'course-detail',
      extract: (match) => ({
        entityId: match[1],
      }),
    },
    {
      pattern: /^\/dashboard/,
      type: 'dashboard',
    },
    {
      pattern: /^\/settings/,
      type: 'settings',
    },
  ];

  for (const { pattern, type, extract } of patterns) {
    const match = path.match(pattern);
    if (match) {
      const extracted = extract?.(match) ?? {};
      return {
        type,
        path,
        capabilities: [],
        breadcrumb: [],
        ...extracted,
      };
    }
  }

  return {
    type: 'other',
    path,
    capabilities: [],
    breadcrumb: [],
  };
}

export { SAMContext };
