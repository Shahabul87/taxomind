// src/context/SAMContext.tsx
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from "react";
import {
  createDefaultContext,
  createOrchestrator,
  createStateMachine,
  createContextEngine,
  createContentEngine,
  createAssessmentEngine,
  createPersonalizationEngine,
  createResponseEngine
} from "@sam-ai/core";
import { jsx } from "react/jsx-runtime";
function samReducer(state, action) {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, state: action.payload };
    case "SET_CONTEXT":
      return { ...state, context: action.payload };
    case "UPDATE_CONTEXT":
      return {
        ...state,
        context: {
          ...state.context,
          ...action.payload,
          user: { ...state.context.user, ...action.payload.user },
          page: { ...state.context.page, ...action.payload.page },
          form: action.payload.form !== void 0 ? action.payload.form : state.context.form,
          conversation: { ...state.context.conversation, ...action.payload.conversation },
          gamification: { ...state.context.gamification, ...action.payload.gamification },
          ui: { ...state.context.ui, ...action.payload.ui },
          metadata: { ...state.context.metadata, ...action.payload.metadata }
        }
      };
    case "SET_OPEN":
      return { ...state, isOpen: action.payload };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.payload };
    case "SET_STREAMING":
      return { ...state, isStreaming: action.payload };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        context: {
          ...state.context,
          conversation: {
            ...state.context.conversation,
            messages: [...state.context.conversation.messages, action.payload]
          }
        }
      };
    case "UPDATE_MESSAGE": {
      const { id, updates } = action.payload;
      const nextMessages = state.messages.map((msg) => {
        if (msg.id !== id) return msg;
        const nextMessage = { ...msg, ...updates };
        if (updates.metadata && msg.metadata) {
          nextMessage.metadata = { ...msg.metadata, ...updates.metadata };
        }
        return nextMessage;
      });
      return {
        ...state,
        messages: nextMessages,
        context: {
          ...state.context,
          conversation: {
            ...state.context.conversation,
            messages: nextMessages
          }
        }
      };
    }
    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload,
        context: {
          ...state.context,
          conversation: {
            ...state.context.conversation,
            messages: action.payload
          }
        }
      };
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        context: {
          ...state.context,
          conversation: {
            ...state.context.conversation,
            messages: []
          }
        }
      };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_RESULT":
      return { ...state, lastResult: action.payload };
    case "SET_SUGGESTIONS":
      return { ...state };
    case "SET_ACTIONS":
      return { ...state };
    default:
      return state;
  }
}
function toRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return void 0;
  }
  return value;
}
function toArray(value) {
  return Array.isArray(value) ? value : [];
}
function defaultParseResponse(payload) {
  const data = toRecord(payload);
  if (!data) return null;
  if (data.success === true && data.data && typeof data.data === "object") {
    const inner = data.data;
    return {
      message: String(inner.message ?? ""),
      suggestions: toArray(inner.suggestions),
      actions: toArray(inner.actions),
      blooms: inner.bloomsAnalysis,
      insights: toRecord(inner.insights),
      metadata: toRecord(inner.metadata)
    };
  }
  if (typeof data.response === "string") {
    const insights = toRecord(data.insights);
    return {
      message: data.response,
      suggestions: toArray(data.suggestions),
      actions: toArray(data.actions),
      insights,
      blooms: insights?.blooms ?? void 0,
      metadata: toRecord(data.metadata)
    };
  }
  if (typeof data.message === "string") {
    return {
      message: data.message,
      suggestions: toArray(data.suggestions),
      actions: toArray(data.actions),
      insights: toRecord(data.insights),
      blooms: data.blooms,
      metadata: toRecord(data.metadata)
    };
  }
  return null;
}
function buildMetadata(input) {
  const meta = input ?? {};
  const enginesExecuted = Array.isArray(meta.enginesExecuted) ? meta.enginesExecuted : Array.isArray(meta.enginesRun) ? meta.enginesRun : [];
  return {
    totalExecutionTime: typeof meta.totalExecutionTime === "number" ? meta.totalExecutionTime : typeof meta.totalTime === "number" ? meta.totalTime : 0,
    enginesExecuted,
    enginesFailed: Array.isArray(meta.enginesFailed) ? meta.enginesFailed : [],
    enginesCached: Array.isArray(meta.enginesCached) ? meta.enginesCached : [],
    parallelTiers: Array.isArray(meta.parallelTiers) ? meta.parallelTiers : []
  };
}
function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
function parseSSEEvent(block) {
  const lines = block.split(/\n/);
  let event = "message";
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim() || event;
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (!dataLines.length) {
    return null;
  }
  return { event, data: dataLines.join("\n") };
}
var SAMContext = createContext(null);
function SAMProvider({
  children,
  config,
  transport = "orchestrator",
  api,
  initialContext,
  autoDetectContext = false,
  debug = false,
  onStateChange,
  onError
}) {
  const initialState2 = useMemo(
    () => ({
      context: createDefaultContext(initialContext),
      state: "idle",
      isOpen: false,
      isProcessing: false,
      isStreaming: false,
      messages: initialContext?.conversation?.messages ?? [],
      error: null,
      lastResult: null
    }),
    [initialContext]
  );
  const [state, dispatch] = useReducer(samReducer, initialState2);
  const { orchestrator, stateMachine } = useMemo(() => {
    const sm = createStateMachine();
    if (transport === "api") {
      return { orchestrator: null, stateMachine: sm };
    }
    if (!config) {
      throw new Error("SAMProvider requires a config when using orchestrator transport");
    }
    const orch = createOrchestrator(config);
    orch.registerEngine(createContextEngine(config));
    orch.registerEngine(createContentEngine(config));
    orch.registerEngine(createAssessmentEngine(config));
    orch.registerEngine(createPersonalizationEngine(config));
    orch.registerEngine(createResponseEngine(config));
    return { orchestrator: orch, stateMachine: sm };
  }, [config, transport]);
  const isInitializedRef = useRef(false);
  const contextRef = useRef(state.context);
  contextRef.current = state.context;
  useEffect(() => {
    const unsubscribe = stateMachine.subscribe((newState) => {
      dispatch({ type: "SET_STATE", payload: newState });
      onStateChange?.(newState);
      if (debug) {
        console.log("[SAM] State changed:", newState);
      }
    });
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      stateMachine.send({ type: "INITIALIZE", payload: { context: contextRef.current } });
    }
    return unsubscribe;
  }, [stateMachine, onStateChange, debug]);
  useEffect(() => {
    if (autoDetectContext && typeof window !== "undefined") {
      const path = window.location.pathname;
      const detectedContext = detectContextFromPath(path);
      dispatch({
        type: "UPDATE_CONTEXT",
        payload: { page: { ...state.context.page, ...detectedContext } }
      });
      if (debug) {
        console.log("[SAM] Auto-detected context:", detectedContext);
      }
    }
  }, [autoDetectContext, debug]);
  const apiOptions = transport === "api" ? api : void 0;
  const buildApiRequest = useCallback(
    (message, context, history) => {
      if (apiOptions?.buildRequest) {
        return apiOptions.buildRequest({ message, context, history });
      }
      return { message, context, history };
    },
    [apiOptions]
  );
  const parseApiResponse = useCallback(
    (payload) => {
      if (apiOptions?.parseResponse) {
        return apiOptions.parseResponse(payload);
      }
      return defaultParseResponse(payload);
    },
    [apiOptions]
  );
  const buildResultFromApi = useCallback(
    (parsed) => ({
      success: true,
      results: {},
      response: {
        message: parsed.message,
        suggestions: parsed.suggestions ?? [],
        actions: parsed.actions ?? [],
        insights: parsed.insights ?? {},
        blooms: parsed.blooms
      },
      metadata: buildMetadata(parsed.metadata)
    }),
    []
  );
  const sendMessageViaFetch = useCallback(
    async (content) => {
      if (!apiOptions?.endpoint) {
        return null;
      }
      try {
        dispatch({ type: "SET_PROCESSING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        const history = state.context.conversation.messages;
        const requestBody = buildApiRequest(content, state.context, history);
        const userMessage = {
          id: `msg-${Date.now()}`,
          role: "user",
          content,
          timestamp: /* @__PURE__ */ new Date()
        };
        dispatch({ type: "ADD_MESSAGE", payload: userMessage });
        stateMachine.send({ type: "SEND_MESSAGE", payload: userMessage });
        const response = await fetch(apiOptions.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...apiOptions.headers ?? {}
          },
          body: JSON.stringify(requestBody)
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string" ? payload.error : "API request failed"
          );
        }
        const parsed = parseApiResponse(payload);
        if (!parsed) {
          throw new Error("Failed to parse SAM response");
        }
        const result = buildResultFromApi(parsed);
        const assistantMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: result.response.message,
          timestamp: /* @__PURE__ */ new Date(),
          metadata: {
            suggestions: result.response.suggestions,
            actions: result.response.actions,
            engineInsights: result.response.insights
          }
        };
        dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
        dispatch({ type: "SET_RESULT", payload: result });
        stateMachine.send({
          type: "RECEIVE_RESPONSE",
          payload: assistantMessage
        });
        if (debug) {
          console.log("[SAM] API response:", result);
        }
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err);
        if (debug) {
          console.error("[SAM] API error:", err);
        }
        return null;
      } finally {
        dispatch({ type: "SET_PROCESSING", payload: false });
      }
    },
    [
      apiOptions,
      buildApiRequest,
      buildResultFromApi,
      parseApiResponse,
      state.context,
      stateMachine,
      debug,
      onError
    ]
  );
  const sendMessageViaStream = useCallback(
    async (content) => {
      if (!apiOptions?.streamEndpoint) {
        return null;
      }
      try {
        dispatch({ type: "SET_PROCESSING", payload: true });
        dispatch({ type: "SET_STREAMING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        const history = state.context.conversation.messages;
        const requestBody = buildApiRequest(content, state.context, history);
        const userMessage = {
          id: `msg-${Date.now()}`,
          role: "user",
          content,
          timestamp: /* @__PURE__ */ new Date()
        };
        dispatch({ type: "ADD_MESSAGE", payload: userMessage });
        stateMachine.send({ type: "SEND_MESSAGE", payload: userMessage });
        const assistantMessageId = `msg-${Date.now() + 1}`;
        const assistantMessage = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: /* @__PURE__ */ new Date()
        };
        dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
        const response = await fetch(apiOptions.streamEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...apiOptions.headers ?? {}
          },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            typeof payload?.error === "string" ? payload.error : "Streaming API request failed"
          );
        }
        if (!response.body) {
          throw new Error("Streaming response is not supported by the browser");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";
        let suggestions2;
        let actions2;
        let insights;
        let metadata;
        let blooms;
        let doneReceived = false;
        const updateAssistantContent = () => {
          dispatch({
            type: "UPDATE_MESSAGE",
            payload: { id: assistantMessageId, updates: { content: assistantContent } }
          });
        };
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const event = parseSSEEvent(part);
            if (!event) continue;
            const payload = safeJsonParse(event.data);
            switch (event.event) {
              case "content": {
                const text = typeof payload === "string" ? payload : toRecord(payload)?.text;
                if (typeof text === "string") {
                  assistantContent += text;
                  updateAssistantContent();
                }
                break;
              }
              case "suggestions": {
                if (Array.isArray(payload)) {
                  suggestions2 = payload;
                }
                break;
              }
              case "actions": {
                if (Array.isArray(payload)) {
                  actions2 = payload;
                }
                break;
              }
              case "insights": {
                if (payload && typeof payload === "object") {
                  insights = payload;
                  const bloomsCandidate = toRecord(payload)?.blooms;
                  if (bloomsCandidate && typeof bloomsCandidate === "object") {
                    blooms = bloomsCandidate;
                  }
                }
                break;
              }
              case "done": {
                if (payload && typeof payload === "object") {
                  const donePayload = payload;
                  metadata = toRecord(donePayload.metadata);
                }
                doneReceived = true;
                break;
              }
              case "error": {
                const errorMessage = toRecord(payload)?.error && typeof toRecord(payload)?.error === "string" ? String(toRecord(payload)?.error) : "Streaming error";
                throw new Error(errorMessage);
              }
              default:
                break;
            }
          }
        }
        if (buffer.trim()) {
          const event = parseSSEEvent(buffer);
          if (event?.event === "content") {
            const payload = safeJsonParse(event.data);
            const text = typeof payload === "string" ? payload : toRecord(payload)?.text;
            if (typeof text === "string") {
              assistantContent += text;
              updateAssistantContent();
            }
          }
        }
        if (!doneReceived && !assistantContent) {
          throw new Error("Streaming response ended unexpectedly");
        }
        const parsed = {
          message: assistantContent,
          suggestions: suggestions2,
          actions: actions2,
          insights,
          blooms,
          metadata
        };
        const result = buildResultFromApi(parsed);
        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            id: assistantMessageId,
            updates: {
              content: assistantContent,
              metadata: {
                suggestions: result.response.suggestions,
                actions: result.response.actions,
                engineInsights: result.response.insights
              }
            }
          }
        });
        dispatch({ type: "SET_RESULT", payload: result });
        stateMachine.send({
          type: "RECEIVE_RESPONSE",
          payload: {
            id: assistantMessageId,
            role: "assistant",
            content: assistantContent,
            timestamp: /* @__PURE__ */ new Date(),
            metadata: {
              suggestions: result.response.suggestions,
              actions: result.response.actions,
              engineInsights: result.response.insights
            }
          }
        });
        if (debug) {
          console.log("[SAM] Streamed API response:", result);
        }
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err);
        if (debug) {
          console.error("[SAM] Streaming API error:", err);
        }
        return null;
      } finally {
        dispatch({ type: "SET_STREAMING", payload: false });
        dispatch({ type: "SET_PROCESSING", payload: false });
      }
    },
    [
      apiOptions,
      buildApiRequest,
      buildResultFromApi,
      state.context,
      stateMachine,
      debug,
      onError
    ]
  );
  const sendMessageViaApi = useCallback(
    async (content) => {
      if (apiOptions?.streamEndpoint) {
        return sendMessageViaStream(content);
      }
      return sendMessageViaFetch(content);
    },
    [apiOptions?.streamEndpoint, sendMessageViaFetch, sendMessageViaStream]
  );
  const open = useCallback(() => {
    dispatch({ type: "SET_OPEN", payload: true });
    stateMachine.send({ type: "OPEN" });
  }, [stateMachine]);
  const close = useCallback(() => {
    dispatch({ type: "SET_OPEN", payload: false });
    stateMachine.send({ type: "CLOSE" });
  }, [stateMachine]);
  const toggle = useCallback(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, open, close]);
  const sendMessage = useCallback(
    async (content) => {
      if (apiOptions?.endpoint) {
        return sendMessageViaApi(content);
      }
      if (!orchestrator) {
        throw new Error("SAMProvider is not configured with an orchestrator");
      }
      try {
        dispatch({ type: "SET_PROCESSING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        const userMessage = {
          id: `msg-${Date.now()}`,
          role: "user",
          content,
          timestamp: /* @__PURE__ */ new Date()
        };
        dispatch({ type: "ADD_MESSAGE", payload: userMessage });
        stateMachine.send({ type: "SEND_MESSAGE", payload: userMessage });
        const result = await orchestrator.orchestrate(state.context, content, {
          parallel: true
        });
        const assistantMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: result.response.message,
          timestamp: /* @__PURE__ */ new Date(),
          metadata: {
            suggestions: result.response.suggestions,
            actions: result.response.actions
          }
        };
        dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
        dispatch({ type: "SET_RESULT", payload: result });
        stateMachine.send({
          type: "RECEIVE_RESPONSE",
          payload: assistantMessage
        });
        if (debug) {
          console.log("[SAM] Orchestration result:", result);
        }
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err);
        if (debug) {
          console.error("[SAM] Error:", err);
        }
        return null;
      } finally {
        dispatch({ type: "SET_PROCESSING", payload: false });
      }
    },
    [
      apiOptions?.endpoint,
      sendMessageViaApi,
      orchestrator,
      stateMachine,
      state.context,
      debug,
      onError
    ]
  );
  const clearMessages = useCallback(() => {
    dispatch({ type: "CLEAR_MESSAGES" });
  }, []);
  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);
  const updateContext = useCallback((updates) => {
    dispatch({ type: "UPDATE_CONTEXT", payload: updates });
  }, []);
  const updatePage = useCallback((page) => {
    dispatch({ type: "UPDATE_CONTEXT", payload: { page: { ...contextRef.current.page, ...page } } });
  }, []);
  const updateForm = useCallback((fields) => {
    if (!contextRef.current.form) return;
    dispatch({
      type: "UPDATE_CONTEXT",
      payload: {
        form: {
          ...contextRef.current.form,
          fields,
          lastUpdated: /* @__PURE__ */ new Date()
        }
      }
    });
  }, []);
  const analyze = useCallback(
    async (query) => {
      if (apiOptions?.endpoint) {
        return sendMessageViaApi(query ?? "Analyze the current context");
      }
      if (!orchestrator) {
        throw new Error("SAMProvider is not configured with an orchestrator");
      }
      try {
        dispatch({ type: "SET_PROCESSING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        const result = await orchestrator.orchestrate(
          state.context,
          query ?? "Analyze the current context",
          { parallel: true }
        );
        dispatch({ type: "SET_RESULT", payload: result });
        if (debug) {
          console.log("[SAM] Analysis result:", result);
        }
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: "SET_ERROR", payload: err });
        onError?.(err);
        return null;
      } finally {
        dispatch({ type: "SET_PROCESSING", payload: false });
      }
    },
    [
      apiOptions?.endpoint,
      sendMessageViaApi,
      orchestrator,
      state.context,
      debug,
      onError
    ]
  );
  const getBloomsAnalysis = useCallback(() => {
    if (!state.lastResult?.results?.blooms?.success) {
      return null;
    }
    return state.lastResult.results.blooms.data?.analysis ?? null;
  }, [state.lastResult]);
  const executeAction = useCallback(
    async (action) => {
      if (debug) {
        console.log("[SAM] Executing action:", action);
      }
      stateMachine.send({
        type: "EXECUTE_ACTION",
        payload: action
      });
    },
    [stateMachine, debug]
  );
  const suggestions = useMemo(() => {
    return state.lastResult?.response.suggestions ?? [];
  }, [state.lastResult]);
  const actions = useMemo(() => {
    return state.lastResult?.response.actions ?? [];
  }, [state.lastResult]);
  const contextValue = useMemo(
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
      stateMachine
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
      stateMachine
    ]
  );
  return /* @__PURE__ */ jsx(SAMContext.Provider, { value: contextValue, children });
}
function useSAMContext() {
  const context = useContext(SAMContext);
  if (!context) {
    throw new Error("useSAMContext must be used within a SAMProvider");
  }
  return context;
}
function detectContextFromPath(path) {
  const patterns = [
    {
      pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)\/section\/([^/]+)/,
      type: "section-detail",
      extract: (match) => ({
        entityId: match[3],
        parentEntityId: match[2],
        grandParentEntityId: match[1]
      })
    },
    {
      pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)/,
      type: "chapter-detail",
      extract: (match) => ({
        entityId: match[2],
        parentEntityId: match[1]
      })
    },
    {
      pattern: /^\/teacher\/courses\/([^/]+)/,
      type: "course-detail",
      extract: (match) => ({
        entityId: match[1]
      })
    },
    {
      pattern: /^\/teacher\/courses/,
      type: "courses-list"
    },
    {
      pattern: /^\/teacher\/create/,
      type: "course-create"
    },
    {
      pattern: /^\/courses\/([^/]+)/,
      type: "course-detail",
      extract: (match) => ({
        entityId: match[1]
      })
    },
    {
      pattern: /^\/dashboard/,
      type: "dashboard"
    },
    {
      pattern: /^\/settings/,
      type: "settings"
    }
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
        ...extracted
      };
    }
  }
  return {
    type: "other",
    path,
    capabilities: [],
    breadcrumb: []
  };
}

// src/hooks/useSAM.ts
function useSAM() {
  const context = useSAMContext();
  const {
    // State
    context: samContext,
    state,
    isOpen,
    isProcessing,
    isStreaming,
    messages,
    error,
    lastResult,
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
    executeAction
  } = context;
  return {
    // State
    context: samContext,
    state,
    isOpen,
    isProcessing,
    isStreaming,
    messages,
    error,
    lastResult,
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
    executeAction
  };
}

// src/hooks/useSAMChat.ts
function useSAMChat() {
  const {
    messages,
    isProcessing,
    isStreaming,
    sendMessage,
    clearMessages,
    lastResult
  } = useSAMContext();
  const suggestions = lastResult?.response.suggestions ?? [];
  return {
    messages,
    isProcessing,
    isStreaming,
    sendMessage,
    clearMessages,
    suggestions
  };
}

// src/hooks/useSAMActions.ts
import { useState, useCallback as useCallback2 } from "react";
function useSAMActions() {
  const { lastResult, executeAction: contextExecuteAction } = useSAMContext();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastActionResult, setLastActionResult] = useState(null);
  const actions = lastResult?.response.actions ?? [];
  const executeAction = useCallback2(
    async (action) => {
      setIsExecuting(true);
      try {
        await contextExecuteAction(action);
        setLastActionResult({ success: true, action });
      } catch (error) {
        setLastActionResult({ success: false, error, action });
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    [contextExecuteAction]
  );
  return {
    actions,
    executeAction,
    isExecuting,
    lastActionResult
  };
}

// src/hooks/useSAMPageContext.ts
import { useCallback as useCallback3, useEffect as useEffect2 } from "react";
function useSAMPageContext() {
  const { context, updateContext, updatePage } = useSAMContext();
  const updateUser = useCallback3(
    (user) => {
      updateContext({ user: { ...context.user, ...user } });
    },
    [context.user, updateContext]
  );
  const detectPageContext = useCallback3(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    const detected = detectContextFromPath2(path);
    updatePage(detected);
  }, [updatePage]);
  return {
    context,
    updateContext,
    updatePage,
    updateUser,
    detectPageContext
  };
}
function detectContextFromPath2(path) {
  const patterns = [
    // ============================================================================
    // TEACHER ROUTES (most specific first)
    // ============================================================================
    {
      pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)\/section\/([^/]+)/,
      type: "section-detail",
      extract: (match) => ({
        entityId: match[3],
        parentEntityId: match[2],
        grandParentEntityId: match[1]
      })
    },
    {
      pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)/,
      type: "chapter-detail",
      extract: (match) => ({
        entityId: match[2],
        parentEntityId: match[1]
      })
    },
    {
      pattern: /^\/teacher\/courses\/([^/]+)/,
      type: "course-detail",
      extract: (match) => ({
        entityId: match[1]
      })
    },
    {
      pattern: /^\/teacher\/courses/,
      type: "courses-list"
    },
    {
      pattern: /^\/teacher\/create/,
      type: "course-create"
    },
    {
      pattern: /^\/teacher\/analytics/,
      type: "analytics"
    },
    {
      pattern: /^\/teacher/,
      type: "teacher-dashboard"
    },
    // ============================================================================
    // LEARNING ROUTES (student-facing, most specific first)
    // ============================================================================
    // Exam results with attempt
    {
      pattern: /^\/courses\/([^/]+)\/learn\/([^/]+)\/sections\/([^/]+)\/exams\/([^/]+)\/results\/([^/]+)/,
      type: "exam-results",
      extract: (match) => ({
        entityId: match[5],
        // attemptId
        parentEntityId: match[4],
        // examId
        grandParentEntityId: match[3],
        // sectionId
        metadata: {
          courseId: match[1],
          chapterId: match[2],
          sectionId: match[3],
          examId: match[4],
          attemptId: match[5]
        }
      })
    },
    // Exam page
    {
      pattern: /^\/courses\/([^/]+)\/learn\/([^/]+)\/sections\/([^/]+)\/exams\/([^/]+)/,
      type: "exam",
      extract: (match) => ({
        entityId: match[4],
        // examId
        parentEntityId: match[3],
        // sectionId
        grandParentEntityId: match[2],
        // chapterId
        metadata: {
          courseId: match[1],
          chapterId: match[2],
          sectionId: match[3],
          examId: match[4]
        }
      })
    },
    // Section within learn flow
    {
      pattern: /^\/courses\/([^/]+)\/learn\/([^/]+)\/sections\/([^/]+)/,
      type: "section-learning",
      extract: (match) => ({
        entityId: match[3],
        // sectionId
        parentEntityId: match[2],
        // chapterId
        grandParentEntityId: match[1],
        // courseId
        metadata: {
          courseId: match[1],
          chapterId: match[2],
          sectionId: match[3]
        }
      })
    },
    // Chapter learning page
    {
      pattern: /^\/courses\/([^/]+)\/learn\/([^/]+)/,
      type: "chapter-learning",
      extract: (match) => ({
        entityId: match[2],
        // chapterId
        parentEntityId: match[1],
        // courseId
        metadata: {
          courseId: match[1],
          chapterId: match[2]
        }
      })
    },
    // Course learning landing
    {
      pattern: /^\/courses\/([^/]+)\/learn/,
      type: "course-learning",
      extract: (match) => ({
        entityId: match[1],
        // courseId
        metadata: {
          courseId: match[1]
        }
      })
    },
    // Course detail/preview
    {
      pattern: /^\/courses\/([^/]+)/,
      type: "course-detail",
      extract: (match) => ({
        entityId: match[1]
      })
    },
    // Course listing
    {
      pattern: /^\/courses$/,
      type: "courses-list"
    },
    // ============================================================================
    // DASHBOARD & GENERAL ROUTES
    // ============================================================================
    {
      pattern: /^\/dashboard\/user\/analytics/,
      type: "user-analytics"
    },
    {
      pattern: /^\/dashboard\/user/,
      type: "user-dashboard"
    },
    {
      pattern: /^\/dashboard\/admin/,
      type: "admin-dashboard"
    },
    {
      pattern: /^\/dashboard/,
      type: "dashboard"
    },
    {
      pattern: /^\/settings/,
      type: "settings"
    }
  ];
  for (const { pattern, type, extract } of patterns) {
    const match = path.match(pattern);
    if (match) {
      const extracted = extract?.(match) ?? {};
      return {
        type,
        path,
        ...extracted
      };
    }
  }
  return {
    type: "other",
    path
  };
}
function useSAMAutoContext(enabled = true) {
  const { detectPageContext } = useSAMPageContext();
  useEffect2(() => {
    if (!enabled || typeof window === "undefined") return;
    detectPageContext();
    const handleRouteChange = () => {
      detectPageContext();
    };
    window.addEventListener("popstate", handleRouteChange);
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        handleRouteChange();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      observer.disconnect();
    };
  }, [enabled, detectPageContext]);
}

// src/hooks/useSAMAnalysis.ts
import { useState as useState2, useCallback as useCallback4 } from "react";
function useSAMAnalysis() {
  const { analyze: contextAnalyze, lastResult, getBloomsAnalysis } = useSAMContext();
  const [isAnalyzing, setIsAnalyzing] = useState2(false);
  const [lastAnalysis, setLastAnalysis] = useState2(null);
  const analyze = useCallback4(
    async (query) => {
      setIsAnalyzing(true);
      try {
        const result = await contextAnalyze(query);
        setLastAnalysis(result);
        return result;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [contextAnalyze]
  );
  const bloomsAnalysis = getBloomsAnalysis();
  return {
    analyze,
    isAnalyzing,
    lastAnalysis: lastAnalysis ?? lastResult,
    bloomsAnalysis
  };
}

// src/hooks/useSAMForm.ts
import { useState as useState3, useCallback as useCallback5, useEffect as useEffect3, useRef as useRef2 } from "react";
function useSAMForm() {
  const { context, updateForm, orchestrator } = useSAMContext();
  const [fields, setFields] = useState3(
    context.form?.fields ?? {}
  );
  useEffect3(() => {
    if (context.form?.fields) {
      setFields(context.form.fields);
    }
  }, [context.form?.fields]);
  const updateFields = useCallback5(
    (newFields) => {
      setFields(newFields);
      updateForm(newFields);
    },
    [updateForm]
  );
  const syncFormToSAM = useCallback5(
    (formElement) => {
      const formFields = extractFormFields(formElement);
      updateFields(formFields);
    },
    [updateFields]
  );
  const autoFillField = useCallback5(
    (fieldName, value) => {
      const updatedFields = {
        ...fields,
        [fieldName]: {
          ...fields[fieldName],
          value
        }
      };
      updateFields(updatedFields);
      if (typeof document !== "undefined") {
        const element = document.querySelector(`[name="${fieldName}"]`);
        if (element) {
          element.value = String(value);
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    },
    [fields, updateFields]
  );
  const getFieldSuggestions = useCallback5(
    async (fieldName) => {
      if (!orchestrator) return [];
      const field = fields[fieldName];
      if (!field) return [];
      try {
        const result = await orchestrator.orchestrate(
          context,
          `Suggest values for the ${field.label ?? fieldName} field`,
          { parallel: false }
        );
        const suggestions = result.response.suggestions.filter((s) => s.type === "quick-reply").map((s) => s.text);
        return suggestions;
      } catch {
        return [];
      }
    },
    [orchestrator, fields, context]
  );
  return {
    fields,
    updateFields,
    syncFormToSAM,
    autoFillField,
    getFieldSuggestions
  };
}
function extractFormFields(formElement) {
  const fields = {};
  const elements = formElement.elements;
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element.name) continue;
    if (element.type === "submit" || element.type === "button") continue;
    const field = {
      name: element.name,
      type: detectFieldType(element),
      value: getFieldValue(element),
      label: getFieldLabel(element),
      placeholder: element.placeholder,
      required: element.required,
      disabled: element.disabled,
      readOnly: element.readOnly
    };
    fields[element.name] = field;
  }
  return fields;
}
function detectFieldType(element) {
  if (element instanceof HTMLTextAreaElement) {
    return "textarea";
  }
  if (element instanceof HTMLSelectElement) {
    return "select";
  }
  if (element instanceof HTMLInputElement) {
    return element.type || "text";
  }
  return "text";
}
function getFieldValue(element) {
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    return element.checked;
  }
  if (element instanceof HTMLInputElement && element.type === "number") {
    return element.valueAsNumber;
  }
  return element.value;
}
function getFieldLabel(element) {
  const name = element.name;
  if (name && typeof document !== "undefined") {
    const label = document.querySelector(`label[for="${name}"]`);
    if (label) {
      return label.textContent?.trim();
    }
  }
  const parentLabel = element.closest("label");
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true);
    const inputs = clone.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => input.remove());
    return clone.textContent?.trim();
  }
  return void 0;
}
function useSAMFormSync(options) {
  const { syncFormToSAM } = useSAMForm();
  const debounceRef = useRef2(void 0);
  useEffect3(() => {
    const form = typeof options.form === "string" ? document.querySelector(options.form) : options.form;
    if (!form) return;
    syncFormToSAM(form);
    if (!options.autoSync) return;
    const handleChange = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        syncFormToSAM(form);
      }, options.debounceMs ?? 300);
    };
    form.addEventListener("input", handleChange);
    form.addEventListener("change", handleChange);
    return () => {
      form.removeEventListener("input", handleChange);
      form.removeEventListener("change", handleChange);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [options.form, options.autoSync, options.debounceMs, syncFormToSAM]);
}

// src/hooks/useSAMPageLinks.ts
import { useCallback as useCallback6, useEffect as useEffect4, useRef as useRef3, useState as useState4 } from "react";
var DEFAULT_SELECTOR = "a[href]";
function normalizeText(value) {
  const text = value?.trim();
  return text ? text.replace(/\s+/g, " ") : void 0;
}
function isHidden(element) {
  if (element.getAttribute("aria-hidden") === "true") return true;
  if (element.hidden) return true;
  const rects = element.getClientRects();
  return rects.length === 0;
}
function buildLink(element, options) {
  if (!options.includeHidden && isHidden(element)) return null;
  const href = element.getAttribute("href") || "";
  if (!href) return null;
  const link = {
    href
  };
  if (options.includeText !== false) {
    link.text = normalizeText(element.textContent);
  }
  if (options.includeAriaLabel !== false) {
    link.ariaLabel = normalizeText(element.getAttribute("aria-label"));
  }
  if (options.includeTitle !== false) {
    link.title = normalizeText(element.getAttribute("title"));
  }
  if (options.includeRel) {
    link.rel = normalizeText(element.getAttribute("rel"));
  }
  if (options.includeTarget) {
    link.target = normalizeText(element.getAttribute("target"));
  }
  return link;
}
function dedupeLinks(links) {
  const seen = /* @__PURE__ */ new Set();
  const output = [];
  for (const link of links) {
    const key = `${link.href}|${link.text ?? ""}|${link.ariaLabel ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(link);
  }
  return output;
}
function useSAMPageLinks(options = {}) {
  const { context, updatePage } = useSAMContext();
  const [links, setLinks] = useState4([]);
  const optionsRef = useRef3(options);
  optionsRef.current = options;
  const contextRef = useRef3(context);
  contextRef.current = context;
  const updatePageRef = useRef3(updatePage);
  updatePageRef.current = updatePage;
  const refresh = useCallback6(() => {
    if (typeof document === "undefined") return;
    const opts = optionsRef.current;
    const selector = opts.selector ?? DEFAULT_SELECTOR;
    const maxLinks = opts.maxLinks ?? 80;
    const elements = Array.from(document.querySelectorAll(selector));
    const collected = [];
    for (const element of elements) {
      if (collected.length >= maxLinks) break;
      const link = buildLink(element, opts);
      if (link) collected.push(link);
    }
    const finalLinks = opts.dedupe === false ? collected : dedupeLinks(collected);
    setLinks(finalLinks);
    const currentMetadata = contextRef.current.page.metadata ?? {};
    const nextMetadata = {
      ...currentMetadata,
      links: finalLinks,
      linkCount: finalLinks.length
    };
    updatePageRef.current({ metadata: nextMetadata });
    opts.onLinks?.(finalLinks);
  }, []);
  useEffect4(() => {
    if (options.enabled === false) return;
    let timeoutId = null;
    const throttleMs = options.throttleMs ?? 500;
    const schedule = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        refresh();
      }, throttleMs);
    };
    refresh();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", schedule);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [options.enabled, options.throttleMs, refresh]);
  return { links, refresh };
}

// src/hooks/useSAMFormDataSync.ts
import { useCallback as useCallback7, useEffect as useEffect5, useMemo as useMemo2, useRef as useRef4 } from "react";
var DEFAULT_MAX_DEPTH = 6;
function formatLabel(name) {
  return name.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").replace(/\s+/g, " ").trim().replace(/^\w/, (c) => c.toUpperCase());
}
function toFieldType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  return typeof value;
}
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && value?.constructor === Object;
}
function extractFields(value, fields, fieldMeta, path, depth, maxDepth) {
  if (depth > maxDepth) {
    fields[path] = {
      name: path,
      value: "[Max depth reached]",
      type: "error",
      label: formatLabel(path)
    };
    return;
  }
  if (value === void 0) {
    fields[path] = {
      name: path,
      value: void 0,
      type: "undefined",
      label: formatLabel(path)
    };
    return;
  }
  if (value === null) {
    fields[path] = {
      name: path,
      value: null,
      type: "null",
      label: formatLabel(path)
    };
    return;
  }
  if (Array.isArray(value)) {
    fields[path] = {
      name: path,
      value,
      type: "array",
      label: formatLabel(path)
    };
    value.forEach((item, index) => {
      extractFields(item, fields, fieldMeta, `${path}[${index}]`, depth + 1, maxDepth);
    });
    return;
  }
  if (value instanceof Date) {
    fields[path] = {
      name: path,
      value: value.toISOString(),
      type: "date",
      label: formatLabel(path)
    };
    return;
  }
  if (isPlainObject(value)) {
    fields[path] = {
      name: path,
      value: JSON.stringify(value),
      type: "object",
      label: formatLabel(path)
    };
    Object.entries(value).forEach(([key, nested]) => {
      const nextPath = path ? `${path}.${key}` : key;
      extractFields(nested, fields, fieldMeta, nextPath, depth + 1, maxDepth);
    });
    return;
  }
  const meta = fieldMeta[path] ?? {};
  fields[path] = {
    name: path,
    value,
    type: meta.type ?? toFieldType(value),
    label: meta.label ?? formatLabel(path),
    placeholder: meta.placeholder,
    required: meta.required,
    disabled: meta.disabled,
    readOnly: meta.readOnly
  };
}
function buildFormContext(formId, formName, fields, options) {
  return {
    formId,
    formName,
    fields,
    isDirty: options.isDirty ?? true,
    isSubmitting: false,
    isValid: options.isValid ?? true,
    errors: {},
    touchedFields: /* @__PURE__ */ new Set(),
    lastUpdated: /* @__PURE__ */ new Date(),
    metadata: {
      formType: options.formType ?? "data-sync",
      pageUrl: typeof window !== "undefined" ? window.location.pathname : void 0,
      ...options.metadata
    }
  };
}
function useSAMFormDataSync(formId, formData, options = {}) {
  const { context, updateContext } = useSAMContext();
  const latestOptionsRef = useRef4(options);
  latestOptionsRef.current = options;
  const contextRef = useRef4(context);
  contextRef.current = context;
  const updateContextRef = useRef4(updateContext);
  updateContextRef.current = updateContext;
  const formDataRef = useRef4(formData);
  formDataRef.current = formData;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const serializedData = useMemo2(() => JSON.stringify(formData), [formData]);
  const serializedOptions = useMemo2(() => JSON.stringify({
    enabled: options.enabled,
    formName: options.formName,
    formType: options.formType,
    isDirty: options.isDirty,
    isValid: options.isValid,
    maxDepth: options.maxDepth
  }), [options.enabled, options.formName, options.formType, options.isDirty, options.isValid, options.maxDepth]);
  const sync = useCallback7(() => {
    const opts = latestOptionsRef.current;
    if (!opts.enabled && opts.enabled !== void 0) return;
    if (!formId) return;
    const currentFormData = formDataRef.current;
    const meta = opts.fieldMeta ?? {};
    const fields = {};
    if (isPlainObject(currentFormData)) {
      Object.entries(currentFormData).forEach(([key, value]) => {
        extractFields(value, fields, meta, key, 0, maxDepth);
      });
    } else {
      extractFields(currentFormData, fields, meta, "value", 0, maxDepth);
    }
    const formName = opts.formName ?? formId;
    const nextContext = buildFormContext(formId, formName, fields, opts);
    const currentForm = contextRef.current.form;
    updateContextRef.current({
      form: currentForm?.formId === formId ? { ...currentForm, ...nextContext, fields } : nextContext
    });
  }, [formId, maxDepth]);
  useEffect5(() => {
    if (options.debounceMs && options.debounceMs > 0) {
      const timeoutId = setTimeout(sync, options.debounceMs);
      return () => clearTimeout(timeoutId);
    }
    sync();
  }, [serializedData, serializedOptions, options.debounceMs, sync]);
  return { sync };
}

// src/hooks/useSAMFormDataEvents.ts
import { useEffect as useEffect6, useMemo as useMemo3, useState as useState5 } from "react";

// src/utils/formDataEvents.ts
var SAM_FORM_DATA_EVENT = "sam:form-data";
function emitSAMFormData(detail, target) {
  if (!detail?.formId) return;
  const eventTarget = target ?? (typeof window !== "undefined" ? window : void 0);
  if (!eventTarget || typeof eventTarget.dispatchEvent !== "function") return;
  const payload = {
    ...detail,
    emittedAt: detail.emittedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
  const event = new CustomEvent(SAM_FORM_DATA_EVENT, {
    detail: payload
  });
  eventTarget.dispatchEvent(event);
}

// src/hooks/useSAMFormDataEvents.ts
var EMPTY_DATA = {};
function useSAMFormDataEvents(options = {}) {
  const [payload, setPayload] = useState5(null);
  useEffect6(() => {
    if (options.enabled === false) return;
    if (typeof window === "undefined") return;
    const target = options.target ?? window;
    const handler = (event) => {
      const customEvent = event;
      const detail = customEvent.detail;
      if (!detail?.formId) return;
      setPayload(detail);
    };
    target.addEventListener(SAM_FORM_DATA_EVENT, handler);
    return () => {
      target.removeEventListener(SAM_FORM_DATA_EVENT, handler);
    };
  }, [options.enabled, options.target]);
  const syncOptions = useMemo3(() => {
    const baseOptions = options.defaultOptions ?? {};
    const payloadOptions = payload?.options ?? {};
    return {
      ...baseOptions,
      ...payloadOptions,
      enabled: options.enabled ?? payloadOptions.enabled
    };
  }, [options.defaultOptions, options.enabled, payload]);
  useSAMFormDataSync(
    payload?.formId ?? "",
    payload?.formData ?? EMPTY_DATA,
    syncOptions
  );
  return { lastPayload: payload };
}

// src/hooks/useSAMFormAutoDetect.ts
import { useCallback as useCallback8, useEffect as useEffect7, useRef as useRef5, useState as useState6 } from "react";
function formatLabel2(name) {
  return name.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").replace(/\s+/g, " ").trim().replace(/^\w/, (c) => c.toUpperCase());
}
function detectFieldType2(element) {
  if (element instanceof HTMLTextAreaElement) return "textarea";
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLInputElement) return element.type || "text";
  return "text";
}
function getFieldLabel2(element) {
  const name = element.name;
  if (name && typeof document !== "undefined") {
    const label = document.querySelector(`label[for="${CSS.escape(name)}"]`);
    if (label) return label.textContent?.trim();
  }
  const parentLabel = element.closest("label");
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true);
    clone.querySelectorAll("input, textarea, select").forEach((input) => input.remove());
    return clone.textContent?.trim();
  }
  return name ? formatLabel2(name) : void 0;
}
function getFieldValue2(element) {
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    return element.checked;
  }
  if (element instanceof HTMLInputElement && element.type === "number") {
    return element.valueAsNumber;
  }
  if (element instanceof HTMLSelectElement && element.multiple) {
    return Array.from(element.selectedOptions).map((option) => option.value);
  }
  return element.value;
}
function extractFormFields2(form, options) {
  const fields = {};
  const elements = form.querySelectorAll("input, textarea, select");
  const maxFields = options.maxFields ?? 80;
  let count = 0;
  elements.forEach((element) => {
    if (count >= maxFields) return;
    const field = element;
    if (!field.name) return;
    if (!options.includeHidden && field.type === "hidden") return;
    fields[field.name] = {
      name: field.name,
      type: detectFieldType2(field),
      value: getFieldValue2(field),
      label: getFieldLabel2(field),
      placeholder: field instanceof HTMLSelectElement ? void 0 : field.placeholder,
      required: field.required,
      disabled: field.disabled,
      readOnly: field instanceof HTMLSelectElement ? false : field.readOnly
    };
    count += 1;
  });
  return fields;
}
function detectPrimaryForm(forms, preferFocused) {
  if (!forms.length) return null;
  if (preferFocused && typeof document !== "undefined") {
    const activeElement = document.activeElement;
    if (activeElement) {
      const activeForm = activeElement.closest("form");
      if (activeForm instanceof HTMLFormElement) return activeForm;
    }
  }
  return forms.slice().sort((a, b) => b.elements.length - a.elements.length)[0];
}
function buildFormContext2(form, fields, options) {
  const formId = form.getAttribute("data-sam-form-id") || form.id || form.getAttribute("name") || "sam-auto-form";
  const formName = form.getAttribute("data-sam-form-name") || form.getAttribute("aria-label") || formId;
  const hasValue = Object.values(fields).some((field) => {
    if (field.value === null || field.value === void 0) return false;
    if (typeof field.value === "string") return field.value.trim().length > 0;
    if (Array.isArray(field.value)) return field.value.length > 0;
    return true;
  });
  return {
    formId,
    formName,
    fields,
    isDirty: hasValue,
    isSubmitting: false,
    isValid: true,
    errors: {},
    touchedFields: /* @__PURE__ */ new Set(),
    lastUpdated: /* @__PURE__ */ new Date(),
    metadata: {
      formType: options.formType ?? "auto-detect",
      pageUrl: typeof window !== "undefined" ? window.location.pathname : void 0,
      ...options.metadata
    }
  };
}
function useSAMFormAutoDetect(options = {}) {
  const { context, updateContext } = useSAMContext();
  const [formContext, setFormContext] = useState6(null);
  const optionsRef = useRef5(options);
  optionsRef.current = options;
  const detectAndSync = useCallback8(() => {
    if (options.enabled === false) return;
    if (typeof document === "undefined") return;
    const selector = options.selector ?? "form";
    const forms = Array.from(document.querySelectorAll(selector));
    if (!forms.length) return;
    const primaryForm = detectPrimaryForm(forms, options.preferFocused !== false);
    if (!primaryForm) return;
    const fields = extractFormFields2(primaryForm, options);
    const nextContext = buildFormContext2(primaryForm, fields, options);
    setFormContext(nextContext);
    const shouldUpdate = options.overrideExisting || !context.form || context.form.formId === nextContext.formId;
    if (shouldUpdate) {
      updateContext({ form: nextContext });
    }
  }, [context.form, options, updateContext]);
  useEffect7(() => {
    if (options.enabled === false) return;
    if (typeof document === "undefined") return;
    let timeoutId = null;
    const debounceMs = options.debounceMs ?? 300;
    const schedule = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        detectAndSync();
      }, debounceMs);
    };
    detectAndSync();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    const onFocus = () => schedule();
    window.addEventListener("focusin", onFocus, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("focusin", onFocus, true);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [detectAndSync, options.debounceMs, options.enabled]);
  return { formContext, refresh: detectAndSync };
}

// src/hooks/useSAMFormAutoFill.ts
import { useCallback as useCallback9 } from "react";
function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function getFieldCandidates(fields) {
  return Object.entries(fields);
}
function resolveFromContext(target, fields) {
  const normalizedTarget = normalize(target);
  const candidates = getFieldCandidates(fields);
  for (const [name, field] of candidates) {
    if (normalize(name) === normalizedTarget) return name;
    if (field.label && normalize(field.label) === normalizedTarget) return name;
    if (field.placeholder && normalize(field.placeholder) === normalizedTarget) return name;
  }
  for (const [name, field] of candidates) {
    if (normalize(name).includes(normalizedTarget)) return name;
    if (field.label && normalize(field.label).includes(normalizedTarget)) return name;
    if (field.placeholder && normalize(field.placeholder).includes(normalizedTarget)) return name;
  }
  return null;
}
function findElementByField(fieldName) {
  if (typeof document === "undefined") return null;
  return document.querySelector(`[name="${CSS.escape(fieldName)}"]`) || document.getElementById(fieldName);
}
function applyElementValue(element, value, triggerEvents) {
  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox") {
      element.checked = Boolean(value);
    } else if (element.type === "radio") {
      if (String(value) === element.value) {
        element.checked = true;
      }
    } else {
      element.value = String(value ?? "");
    }
  } else if (element instanceof HTMLTextAreaElement) {
    element.value = String(value ?? "");
  } else if (element instanceof HTMLSelectElement) {
    if (element.multiple && Array.isArray(value)) {
      const values = value.map(String);
      Array.from(element.options).forEach((option) => {
        option.selected = values.includes(option.value);
      });
    } else {
      element.value = String(value ?? "");
    }
  }
  if (triggerEvents) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
function useSAMFormAutoFill(options = {}) {
  const { context, updateContext } = useSAMContext();
  const resolveField = useCallback9(
    (target) => {
      if (!target) return null;
      const fields = context.form?.fields ?? {};
      const resolved = resolveFromContext(target, fields);
      if (resolved) return resolved;
      const element = findElementByField(target);
      if (element) return target;
      return null;
    },
    [context.form?.fields]
  );
  const fillField = useCallback9(
    (target, value) => {
      const resolved = resolveField(target);
      if (!resolved) return false;
      const element = findElementByField(resolved);
      if (element) {
        applyElementValue(element, value, options.triggerEvents !== false);
      }
      if (context.form?.fields?.[resolved]) {
        const updatedFields = {
          ...context.form.fields,
          [resolved]: {
            ...context.form.fields[resolved],
            value,
            dirty: true
          }
        };
        updateContext({
          form: {
            ...context.form,
            fields: updatedFields,
            lastUpdated: /* @__PURE__ */ new Date()
          }
        });
      }
      options.onFill?.(resolved, value);
      return true;
    },
    [context.form, options, resolveField, updateContext]
  );
  return { fillField, resolveField };
}

// src/hooks/useSAMPracticeProblems.ts
import { useState as useState7, useCallback as useCallback10, useRef as useRef6 } from "react";
function useSAMPracticeProblems(options = {}) {
  const {
    apiEndpoint = "/api/sam/practice-problems",
    userId,
    courseId,
    sectionId,
    adaptiveDifficulty = true,
    onProblemComplete,
    onStatsUpdate
  } = options;
  const [problems, setProblems] = useState7([]);
  const [currentIndex, setCurrentIndex] = useState7(0);
  const [isGenerating, setIsGenerating] = useState7(false);
  const [isEvaluating, setIsEvaluating] = useState7(false);
  const [lastEvaluation, setLastEvaluation] = useState7(null);
  const [sessionStats, setSessionStats] = useState7(null);
  const [difficultyRecommendation, setDifficultyRecommendation] = useState7(null);
  const [error, setError] = useState7(null);
  const [hintsUsed, setHintsUsed] = useState7([]);
  const sessionIdRef = useRef6(`session_${Date.now()}`);
  const currentProblem = problems[currentIndex] || null;
  const generateProblems = useCallback10(
    async (input) => {
      setIsGenerating(true);
      setError(null);
      try {
        const response = await fetch(`${apiEndpoint}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            userId,
            courseId,
            sectionId
          })
        });
        if (!response.ok) {
          throw new Error(`Failed to generate problems: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const output = data.data;
          setProblems(output.problems);
          setCurrentIndex(0);
          setHintsUsed([]);
          setLastEvaluation(null);
          return output;
        }
        throw new Error(data.error?.message || "Failed to generate problems");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiEndpoint, userId, courseId, sectionId]
  );
  const submitAnswer = useCallback10(
    async (answer) => {
      if (!currentProblem) {
        setError("No problem selected");
        return null;
      }
      setIsEvaluating(true);
      setError(null);
      try {
        const response = await fetch(`${apiEndpoint}/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemId: currentProblem.id,
            problem: currentProblem,
            userAnswer: answer,
            hintsUsed,
            userId,
            sessionId: sessionIdRef.current
          })
        });
        if (!response.ok) {
          throw new Error(`Evaluation failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const evaluation = data.data;
          setLastEvaluation(evaluation);
          if (data.stats) {
            setSessionStats(data.stats);
            onStatsUpdate?.(data.stats);
          }
          onProblemComplete?.(currentProblem, evaluation);
          return evaluation;
        }
        throw new Error(data.error?.message || "Evaluation failed");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsEvaluating(false);
      }
    },
    [apiEndpoint, currentProblem, hintsUsed, userId, onProblemComplete, onStatsUpdate]
  );
  const getNextHint = useCallback10(() => {
    if (!currentProblem) return null;
    const unusedHints = currentProblem.hints.filter((h) => !hintsUsed.includes(h.id));
    const sortedHints = unusedHints.sort((a, b) => a.order - b.order);
    if (sortedHints.length > 0) {
      const nextHint = sortedHints[0];
      setHintsUsed((prev) => [...prev, nextHint.id]);
      return nextHint;
    }
    return null;
  }, [currentProblem, hintsUsed]);
  const nextProblem = useCallback10(() => {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setHintsUsed([]);
      setLastEvaluation(null);
    }
  }, [currentIndex, problems.length]);
  const previousProblem = useCallback10(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setHintsUsed([]);
      setLastEvaluation(null);
    }
  }, [currentIndex]);
  const goToProblem = useCallback10(
    (index) => {
      if (index >= 0 && index < problems.length) {
        setCurrentIndex(index);
        setHintsUsed([]);
        setLastEvaluation(null);
      }
    },
    [problems.length]
  );
  const skipProblem = useCallback10(() => {
    nextProblem();
  }, [nextProblem]);
  const resetSession = useCallback10(() => {
    setProblems([]);
    setCurrentIndex(0);
    setHintsUsed([]);
    setLastEvaluation(null);
    setSessionStats(null);
    setError(null);
    sessionIdRef.current = `session_${Date.now()}`;
  }, []);
  const getRecommendedDifficulty = useCallback10(async () => {
    if (!userId || !adaptiveDifficulty) return null;
    try {
      const response = await fetch(`${apiEndpoint}/difficulty-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId })
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.success && data.data) {
        setDifficultyRecommendation(data.data);
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [apiEndpoint, userId, courseId, adaptiveDifficulty]);
  const getReviewProblems = useCallback10(async () => {
    if (!userId) return [];
    try {
      const response = await fetch(`${apiEndpoint}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, limit: 10 })
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  }, [apiEndpoint, userId]);
  return {
    problems,
    currentProblem,
    currentIndex,
    isGenerating,
    isEvaluating,
    lastEvaluation,
    sessionStats,
    difficultyRecommendation,
    error,
    hintsUsed,
    generateProblems,
    submitAnswer,
    getNextHint,
    nextProblem,
    previousProblem,
    goToProblem,
    skipProblem,
    resetSession,
    getRecommendedDifficulty,
    getReviewProblems
  };
}

// src/hooks/useSAMAdaptiveContent.ts
import { useState as useState8, useCallback as useCallback11, useEffect as useEffect8, useRef as useRef7 } from "react";
var CACHE_KEY_PREFIX = "sam-adaptive-profile-";
var DEFAULT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1e3;
function useSAMAdaptiveContent(options = {}) {
  const {
    apiEndpoint = "/api/sam/adaptive-content",
    userId,
    courseId,
    autoDetectStyle = true,
    profileCacheDuration = DEFAULT_CACHE_DURATION,
    onStyleDetected,
    onContentAdapted
  } = options;
  const [learnerProfile, setLearnerProfile] = useState8(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState8(false);
  const [isAdapting, setIsAdapting] = useState8(false);
  const [adaptedContent, setAdaptedContent] = useState8(null);
  const [styleDetection, setStyleDetection] = useState8(null);
  const [error, setError] = useState8(null);
  const cacheKey = userId ? `${CACHE_KEY_PREFIX}${userId}` : null;
  const hasTriedAutoDetect = useRef7(false);
  useEffect8(() => {
    if (!cacheKey) return;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { profile, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < profileCacheDuration) {
          setLearnerProfile(profile);
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.error("Error loading cached profile:", err);
    }
  }, [cacheKey, profileCacheDuration]);
  const getProfile = useCallback11(async () => {
    if (!userId) {
      setError("User ID is required");
      return null;
    }
    setIsLoadingProfile(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoint}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId })
      });
      if (!response.ok) {
        throw new Error(`Failed to get profile: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        const profile = data.data;
        setLearnerProfile(profile);
        if (cacheKey) {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ profile, timestamp: Date.now() })
          );
        }
        return profile;
      }
      throw new Error(data.error?.message || "Failed to get profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [apiEndpoint, userId, courseId, cacheKey]);
  const detectStyle = useCallback11(async () => {
    if (!userId) {
      setError("User ID is required");
      return null;
    }
    setIsLoadingProfile(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoint}/detect-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId })
      });
      if (!response.ok) {
        throw new Error(`Style detection failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        const result = data.data;
        setStyleDetection(result);
        onStyleDetected?.(result);
        if (data.profile) {
          setLearnerProfile(data.profile);
          if (cacheKey) {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ profile: data.profile, timestamp: Date.now() })
            );
          }
        }
        return result;
      }
      throw new Error(data.error?.message || "Style detection failed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [apiEndpoint, userId, courseId, cacheKey, onStyleDetected]);
  useEffect8(() => {
    if (!userId || !autoDetectStyle || hasTriedAutoDetect.current || learnerProfile) return;
    hasTriedAutoDetect.current = true;
    detectStyle();
  }, [userId, autoDetectStyle, learnerProfile, detectStyle]);
  const adaptContent = useCallback11(
    async (content, adaptOptions) => {
      setIsAdapting(true);
      setError(null);
      try {
        let profile = learnerProfile;
        if (!profile) {
          profile = await getProfile();
        }
        const response = await fetch(`${apiEndpoint}/adapt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            profile,
            options: adaptOptions,
            userId,
            courseId
          })
        });
        if (!response.ok) {
          throw new Error(`Content adaptation failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const adapted = data.data;
          setAdaptedContent(adapted);
          onContentAdapted?.(adapted);
          return adapted;
        }
        throw new Error(data.error?.message || "Content adaptation failed");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsAdapting(false);
      }
    },
    [apiEndpoint, userId, courseId, learnerProfile, getProfile, onContentAdapted]
  );
  const recordInteraction = useCallback11(
    async (interaction) => {
      if (!userId) return;
      try {
        await fetch(`${apiEndpoint}/interaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...interaction,
            userId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          })
        });
      } catch (err) {
        console.error("Failed to record interaction:", err);
      }
    },
    [apiEndpoint, userId]
  );
  const getRecommendations = useCallback11(
    async (topic, count = 5) => {
      if (!learnerProfile) return [];
      try {
        const response = await fetch(`${apiEndpoint}/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            topic,
            count,
            style: learnerProfile.primaryStyle
          })
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.data : [];
      } catch {
        return [];
      }
    },
    [apiEndpoint, userId, learnerProfile]
  );
  const getStyleTips = useCallback11(() => {
    const style = learnerProfile?.primaryStyle || "multimodal";
    const tips = {
      visual: [
        "Focus on diagrams, charts, and visual representations",
        "Use color coding in your notes",
        "Create mind maps to connect concepts",
        "Watch video demonstrations before reading text",
        "Draw flowcharts for processes"
      ],
      auditory: [
        "Listen to explanations and discussions",
        "Read content aloud to yourself",
        "Join study groups for verbal exchange",
        "Use text-to-speech for reading materials",
        "Record yourself explaining concepts"
      ],
      reading: [
        "Read detailed documentation and articles",
        "Take comprehensive written notes",
        "Create written summaries in your own words",
        "Use highlighted text and annotations",
        "Write practice questions for yourself"
      ],
      kinesthetic: [
        "Practice with hands-on exercises immediately",
        "Build projects to apply concepts",
        "Take breaks and move while studying",
        "Use interactive simulations",
        "Teach concepts to others through demonstration"
      ],
      multimodal: [
        "Combine multiple learning methods",
        "Switch between videos, text, and practice",
        "Find what works best for each topic",
        "Use variety to maintain engagement",
        "Adapt your approach based on content type"
      ]
    };
    return tips[style];
  }, [learnerProfile]);
  const updateProfile = useCallback11(
    async (updates) => {
      if (!userId || !learnerProfile) return;
      try {
        const response = await fetch(`${apiEndpoint}/profile/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, updates })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setLearnerProfile(data.data);
            if (cacheKey) {
              localStorage.setItem(
                cacheKey,
                JSON.stringify({ profile: data.data, timestamp: Date.now() })
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to update profile:", err);
      }
    },
    [apiEndpoint, userId, learnerProfile, cacheKey]
  );
  const clearProfile = useCallback11(() => {
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
    }
    setLearnerProfile(null);
    setStyleDetection(null);
    hasTriedAutoDetect.current = false;
  }, [cacheKey]);
  return {
    learnerProfile,
    isLoadingProfile,
    isAdapting,
    adaptedContent,
    styleDetection,
    error,
    isStyleDetected: styleDetection !== null || (learnerProfile?.confidence ?? 0) > 0.5,
    getProfile,
    detectStyle,
    adaptContent,
    recordInteraction,
    getRecommendations,
    getStyleTips,
    updateProfile,
    clearProfile
  };
}

// src/hooks/useSAMSocraticDialogue.ts
import { useState as useState9, useCallback as useCallback12, useRef as useRef8 } from "react";
function useSAMSocraticDialogue(options = {}) {
  const {
    apiEndpoint = "/api/sam/socratic",
    userId,
    courseId,
    sectionId,
    preferredStyle = "balanced",
    onDialogueStart,
    onQuestion,
    onInsightDiscovered,
    onDialogueComplete
  } = options;
  const [dialogue, setDialogue] = useState9(null);
  const [currentQuestion, setCurrentQuestion] = useState9(null);
  const [dialogueState, setDialogueState] = useState9(null);
  const [isWaiting, setIsWaiting] = useState9(false);
  const [lastResponse, setLastResponse] = useState9(null);
  const [discoveredInsights, setDiscoveredInsights] = useState9([]);
  const [progress, setProgress] = useState9(0);
  const [feedback, setFeedback] = useState9(null);
  const [encouragement, setEncouragement] = useState9(null);
  const [availableHints, setAvailableHints] = useState9([]);
  const [error, setError] = useState9(null);
  const currentHintIndexRef = useRef8(0);
  const previousInsightsRef = useRef8([]);
  const isActive = dialogue !== null && dialogueState !== "conclusion";
  const isComplete = dialogueState === "conclusion";
  const startDialogue = useCallback12(
    async (topic, startOptions) => {
      if (!userId) {
        setError("User ID is required");
        return null;
      }
      setIsWaiting(true);
      setError(null);
      try {
        const response = await fetch(`${apiEndpoint}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            topic,
            courseId,
            sectionId,
            preferredStyle,
            ...startOptions
          })
        });
        if (!response.ok) {
          throw new Error(`Failed to start dialogue: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const socraticResponse = data.data;
          const newDialogue = data.dialogue;
          setDialogue(newDialogue);
          setDialogueState(socraticResponse.state);
          setCurrentQuestion(socraticResponse.question || null);
          setLastResponse(socraticResponse);
          setDiscoveredInsights(socraticResponse.discoveredInsights);
          setProgress(socraticResponse.progress);
          setFeedback(socraticResponse.feedback || null);
          setEncouragement(socraticResponse.encouragement || null);
          setAvailableHints(socraticResponse.availableHints || []);
          currentHintIndexRef.current = 0;
          previousInsightsRef.current = [];
          onDialogueStart?.(newDialogue);
          if (socraticResponse.question) {
            onQuestion?.(socraticResponse.question);
          }
          return socraticResponse;
        }
        throw new Error(data.error?.message || "Failed to start dialogue");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsWaiting(false);
      }
    },
    [apiEndpoint, userId, courseId, sectionId, preferredStyle, onDialogueStart, onQuestion]
  );
  const submitResponse = useCallback12(
    async (userResponse) => {
      if (!dialogue) {
        setError("No active dialogue");
        return null;
      }
      setIsWaiting(true);
      setError(null);
      try {
        const response = await fetch(`${apiEndpoint}/continue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dialogueId: dialogue.id,
            response: userResponse,
            userId
          })
        });
        if (!response.ok) {
          throw new Error(`Failed to submit response: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const socraticResponse = data.data;
          setDialogueState(socraticResponse.state);
          setCurrentQuestion(socraticResponse.question || null);
          setLastResponse(socraticResponse);
          setProgress(socraticResponse.progress);
          setFeedback(socraticResponse.feedback || null);
          setEncouragement(socraticResponse.encouragement || null);
          setAvailableHints(socraticResponse.availableHints || []);
          currentHintIndexRef.current = 0;
          const newInsights = socraticResponse.discoveredInsights.filter(
            (i) => !previousInsightsRef.current.includes(i)
          );
          if (newInsights.length > 0) {
            newInsights.forEach((insight) => onInsightDiscovered?.(insight));
            previousInsightsRef.current = socraticResponse.discoveredInsights;
          }
          setDiscoveredInsights(socraticResponse.discoveredInsights);
          if (data.dialogue) {
            setDialogue(data.dialogue);
          }
          if (socraticResponse.isComplete) {
            if (data.performance) {
              onDialogueComplete?.(data.performance);
            }
          }
          if (socraticResponse.question) {
            onQuestion?.(socraticResponse.question);
          }
          return socraticResponse;
        }
        throw new Error(data.error?.message || "Failed to submit response");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsWaiting(false);
      }
    },
    [apiEndpoint, dialogue, userId, onQuestion, onInsightDiscovered, onDialogueComplete]
  );
  const requestHint = useCallback12(async () => {
    if (!dialogue) {
      setError("No active dialogue");
      return null;
    }
    if (availableHints.length > currentHintIndexRef.current) {
      const hint = availableHints[currentHintIndexRef.current];
      currentHintIndexRef.current++;
      return hint;
    }
    try {
      const response = await fetch(`${apiEndpoint}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dialogueId: dialogue.id,
          hintIndex: currentHintIndexRef.current
        })
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (data.success && data.hint) {
        currentHintIndexRef.current++;
        return data.hint;
      }
      return null;
    } catch {
      return null;
    }
  }, [apiEndpoint, dialogue, availableHints]);
  const skipQuestion = useCallback12(async () => {
    if (!dialogue) {
      setError("No active dialogue");
      return null;
    }
    setIsWaiting(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoint}/continue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dialogueId: dialogue.id,
          skipQuestion: true,
          userId
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to skip question: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        const socraticResponse = data.data;
        setDialogueState(socraticResponse.state);
        setCurrentQuestion(socraticResponse.question || null);
        setLastResponse(socraticResponse);
        setProgress(socraticResponse.progress);
        setFeedback(socraticResponse.feedback || null);
        setEncouragement(socraticResponse.encouragement || null);
        setAvailableHints(socraticResponse.availableHints || []);
        currentHintIndexRef.current = 0;
        if (socraticResponse.question) {
          onQuestion?.(socraticResponse.question);
        }
        return socraticResponse;
      }
      throw new Error(data.error?.message || "Failed to skip question");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsWaiting(false);
    }
  }, [apiEndpoint, dialogue, userId, onQuestion]);
  const endDialogue = useCallback12(async () => {
    if (!dialogue) {
      setError("No active dialogue");
      return null;
    }
    setIsWaiting(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoint}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialogueId: dialogue.id })
      });
      if (!response.ok) {
        throw new Error(`Failed to end dialogue: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        setDialogueState("conclusion");
        setCurrentQuestion(null);
        onDialogueComplete?.(data.data.performance);
        return data.data;
      }
      throw new Error(data.error?.message || "Failed to end dialogue");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsWaiting(false);
    }
  }, [apiEndpoint, dialogue, onDialogueComplete]);
  const getHistory = useCallback12(
    async (limit = 10) => {
      if (!userId) return [];
      try {
        const response = await fetch(`${apiEndpoint}/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, limit })
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.success ? data.data : [];
      } catch {
        return [];
      }
    },
    [apiEndpoint, userId]
  );
  const resetDialogue = useCallback12(() => {
    setDialogue(null);
    setCurrentQuestion(null);
    setDialogueState(null);
    setLastResponse(null);
    setDiscoveredInsights([]);
    setProgress(0);
    setFeedback(null);
    setEncouragement(null);
    setAvailableHints([]);
    setError(null);
    currentHintIndexRef.current = 0;
    previousInsightsRef.current = [];
  }, []);
  return {
    dialogue,
    currentQuestion,
    dialogueState,
    isActive,
    isWaiting,
    isComplete,
    lastResponse,
    discoveredInsights,
    progress,
    feedback,
    encouragement,
    availableHints,
    error,
    startDialogue,
    submitResponse,
    requestHint,
    skipQuestion,
    endDialogue,
    getHistory,
    resetDialogue
  };
}

// src/hooks/useAgentic.ts
import { useState as useState10, useCallback as useCallback13, useEffect as useEffect9, useRef as useRef9 } from "react";
function useAgentic(options = {}) {
  const {
    autoFetchGoals = false,
    autoFetchRecommendations = false,
    autoFetchCheckIns = false,
    availableTime = 60,
    recommendationRefreshInterval
  } = options;
  const [goals, setGoals] = useState10([]);
  const [plans, setPlans] = useState10([]);
  const [recommendations, setRecommendations] = useState10(null);
  const [progressReport, setProgressReport] = useState10(null);
  const [skills, setSkills] = useState10([]);
  const [checkIns, setCheckIns] = useState10([]);
  const [error, setError] = useState10(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState10(autoFetchGoals);
  const [isLoadingPlans, setIsLoadingPlans] = useState10(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState10(autoFetchRecommendations);
  const [isLoadingProgress, setIsLoadingProgress] = useState10(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState10(false);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState10(autoFetchCheckIns);
  const mountedRef = useRef9(true);
  const apiCall = useCallback13(async (url, options2, timeoutMs = 15e3) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options2?.headers
        },
        ...options2,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.error || "Request failed" };
      }
      return { success: true, data: result.data };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, error: "Request timed out. Please try again." };
      }
      const message = err instanceof Error ? err.message : "Network error";
      return { success: false, error: message };
    }
  }, []);
  const fetchGoals = useCallback13(async (status) => {
    setIsLoadingGoals(true);
    setError(null);
    const url = status ? `/api/sam/agentic/goals?status=${status}` : "/api/sam/agentic/goals";
    const result = await apiCall(url);
    if (mountedRef.current) {
      if (result.success && result.data) {
        setGoals(result.data.goals);
      } else {
        setError(result.error || "Failed to fetch goals");
      }
      setIsLoadingGoals(false);
    }
  }, [apiCall]);
  const createGoal = useCallback13(async (data) => {
    setError(null);
    const result = await apiCall("/api/sam/agentic/goals", {
      method: "POST",
      body: JSON.stringify(data)
    });
    if (result.success && result.data) {
      setGoals((prev) => [result.data, ...prev]);
      return result.data;
    } else {
      setError(result.error || "Failed to create goal");
      return null;
    }
  }, [apiCall]);
  const updateGoal = useCallback13(async (goalId, data) => {
    setError(null);
    const result = await apiCall(`/api/sam/agentic/goals/${goalId}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
    if (result.success && result.data) {
      setGoals(
        (prev) => prev.map((g) => g.id === goalId ? result.data : g)
      );
      return result.data;
    } else {
      setError(result.error || "Failed to update goal");
      return null;
    }
  }, [apiCall]);
  const decomposeGoal = useCallback13(async (goalId) => {
    setError(null);
    const result = await apiCall(`/api/sam/agentic/goals/${goalId}/decompose`, {
      method: "POST"
    });
    if (result.success && result.data) {
      setGoals(
        (prev) => prev.map((g) => g.id === goalId ? result.data : g)
      );
      return result.data;
    } else {
      setError(result.error || "Failed to decompose goal");
      return null;
    }
  }, [apiCall]);
  const deleteGoal = useCallback13(async (goalId) => {
    setError(null);
    const result = await apiCall(`/api/sam/agentic/goals/${goalId}`, {
      method: "DELETE"
    });
    if (result.success) {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      return true;
    } else {
      setError(result.error || "Failed to delete goal");
      return false;
    }
  }, [apiCall]);
  const fetchPlans = useCallback13(async (goalId) => {
    setIsLoadingPlans(true);
    setError(null);
    const url = goalId ? `/api/sam/agentic/plans?goalId=${goalId}` : "/api/sam/agentic/plans";
    const result = await apiCall(url);
    if (mountedRef.current) {
      if (result.success && result.data) {
        setPlans(result.data.plans);
      } else {
        setError(result.error || "Failed to fetch plans");
      }
      setIsLoadingPlans(false);
    }
  }, [apiCall]);
  const createPlan = useCallback13(async (goalId, dailyMinutes = 30) => {
    setError(null);
    const result = await apiCall("/api/sam/agentic/plans", {
      method: "POST",
      body: JSON.stringify({ goalId, dailyMinutes })
    });
    if (result.success && result.data) {
      setPlans((prev) => [result.data, ...prev]);
      return result.data;
    } else {
      setError(result.error || "Failed to create plan");
      return null;
    }
  }, [apiCall]);
  const startPlan = useCallback13(async (planId) => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/start`, {
      method: "POST"
    });
    return result.success;
  }, [apiCall]);
  const pausePlan = useCallback13(async (planId) => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/pause`, {
      method: "POST"
    });
    return result.success;
  }, [apiCall]);
  const resumePlan = useCallback13(async (planId) => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/resume`, {
      method: "POST"
    });
    return result.success;
  }, [apiCall]);
  const fetchRecommendations = useCallback13(async (time) => {
    setIsLoadingRecommendations(true);
    setError(null);
    const timeParam = time ?? availableTime;
    const result = await apiCall(
      `/api/sam/agentic/recommendations?time=${timeParam}`
    );
    if (mountedRef.current) {
      if (result.success && result.data) {
        setRecommendations(result.data);
      } else {
        setError(result.error || "Failed to fetch recommendations");
      }
      setIsLoadingRecommendations(false);
    }
  }, [apiCall, availableTime]);
  const dismissRecommendation = useCallback13((recommendationId) => {
    setRecommendations((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        recommendations: prev.recommendations.filter((r) => r.id !== recommendationId)
      };
    });
  }, []);
  const fetchProgressReport = useCallback13(async (period = "weekly") => {
    setIsLoadingProgress(true);
    setError(null);
    const result = await apiCall(
      `/api/sam/agentic/analytics/progress?period=${period}`
    );
    if (mountedRef.current) {
      if (result.success && result.data) {
        setProgressReport(result.data);
      } else {
        setError(result.error || "Failed to fetch progress report");
      }
      setIsLoadingProgress(false);
    }
  }, [apiCall]);
  const fetchSkillMap = useCallback13(async () => {
    setIsLoadingSkills(true);
    setError(null);
    const result = await apiCall(
      "/api/sam/agentic/skills"
    );
    if (mountedRef.current) {
      if (result.success && result.data) {
        setSkills(result.data.skills);
      } else {
        setError(result.error || "Failed to fetch skill map");
      }
      setIsLoadingSkills(false);
    }
  }, [apiCall]);
  const fetchCheckIns = useCallback13(async (status) => {
    setIsLoadingCheckIns(true);
    setError(null);
    const url = status ? `/api/sam/agentic/checkins?status=${status}` : "/api/sam/agentic/checkins";
    const result = await apiCall(url);
    if (mountedRef.current) {
      if (result.success && result.data) {
        setCheckIns(result.data.checkIns);
      } else {
        setError(result.error || "Failed to fetch check-ins");
      }
      setIsLoadingCheckIns(false);
    }
  }, [apiCall]);
  const respondToCheckIn = useCallback13(async (checkInId, response) => {
    setError(null);
    const result = await apiCall(`/api/sam/agentic/checkins/${checkInId}`, {
      method: "POST",
      body: JSON.stringify(response)
    });
    if (result.success) {
      setCheckIns(
        (prev) => prev.map(
          (c) => c.id === checkInId ? { ...c, status: "responded" } : c
        )
      );
      return true;
    } else {
      setError(result.error || "Failed to respond to check-in");
      return false;
    }
  }, [apiCall]);
  const dismissCheckIn = useCallback13(async (checkInId) => {
    setError(null);
    const result = await apiCall(`/api/sam/agentic/checkins/${checkInId}`, {
      method: "DELETE"
    });
    if (result.success) {
      setCheckIns((prev) => prev.filter((c) => c.id !== checkInId));
      return true;
    } else {
      setError(result.error || "Failed to dismiss check-in");
      return false;
    }
  }, [apiCall]);
  const clearError = useCallback13(() => {
    setError(null);
  }, []);
  useEffect9(() => {
    if (autoFetchGoals) {
      fetchGoals();
    }
    if (autoFetchRecommendations) {
      fetchRecommendations();
    }
    if (autoFetchCheckIns) {
      fetchCheckIns("pending");
    }
  }, [
    autoFetchGoals,
    autoFetchRecommendations,
    autoFetchCheckIns,
    fetchGoals,
    fetchRecommendations,
    fetchCheckIns
  ]);
  useEffect9(() => {
    if (!recommendationRefreshInterval) return;
    const interval = setInterval(() => {
      fetchRecommendations();
    }, recommendationRefreshInterval);
    return () => clearInterval(interval);
  }, [recommendationRefreshInterval, fetchRecommendations]);
  useEffect9(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return {
    // Goals
    goals,
    isLoadingGoals,
    fetchGoals,
    createGoal,
    updateGoal,
    decomposeGoal,
    deleteGoal,
    // Plans
    plans,
    isLoadingPlans,
    fetchPlans,
    createPlan,
    startPlan,
    pausePlan,
    resumePlan,
    // Recommendations
    recommendations,
    isLoadingRecommendations,
    fetchRecommendations,
    dismissRecommendation,
    // Progress
    progressReport,
    isLoadingProgress,
    fetchProgressReport,
    // Skills
    skills,
    isLoadingSkills,
    fetchSkillMap,
    // Check-ins
    checkIns,
    isLoadingCheckIns,
    fetchCheckIns,
    respondToCheckIn,
    dismissCheckIn,
    // Utility
    error,
    clearError
  };
}

// src/hooks/useRealtime.ts
import { useState as useState11, useEffect as useEffect10, useCallback as useCallback14, useRef as useRef10 } from "react";
var DEFAULT_OPTIONS = {
  url: "/api/sam/ws",
  autoConnect: true,
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 1e3
  },
  heartbeatInterval: 3e4
};
function useRealtime(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [connectionState, setConnectionState] = useState11("disconnected");
  const [stats, setStats] = useState11(null);
  const [error, setError] = useState11(null);
  const wsRef = useRef10(null);
  const reconnectAttemptsRef = useRef10(0);
  const reconnectTimeoutRef = useRef10(null);
  const heartbeatIntervalRef = useRef10(null);
  const subscribersRef = useRef10(/* @__PURE__ */ new Map());
  const statsRef = useRef10({
    connectionId: "",
    connectedAt: /* @__PURE__ */ new Date(),
    lastHeartbeatAt: /* @__PURE__ */ new Date(),
    messagesSent: 0,
    messagesReceived: 0,
    reconnectCount: 0,
    latencyMs: 0
  });
  const generateEventId = useCallback14(() => {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);
  const notifySubscribers = useCallback14((event) => {
    const subscribers = subscribersRef.current.get(event.type);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(event);
        } catch (e) {
          console.error("[useRealtime] Subscriber error:", e);
        }
      });
    }
  }, []);
  const sendMessage = useCallback14((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      statsRef.current.messagesSent++;
      setStats({ ...statsRef.current });
    }
  }, []);
  const connect = useCallback14(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    setConnectionState("connecting");
    setError(null);
    try {
      const wsUrl = new URL(opts.url, window.location.origin);
      wsUrl.protocol = wsUrl.protocol.replace("http", "ws");
      if (opts.authToken) {
        wsUrl.searchParams.set("token", opts.authToken);
      }
      if (opts.userId) {
        wsUrl.searchParams.set("userId", opts.userId);
      }
      if (opts.sessionId) {
        wsUrl.searchParams.set("sessionId", opts.sessionId);
      }
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;
      ws.onopen = () => {
        setConnectionState("connected");
        reconnectAttemptsRef.current = 0;
        statsRef.current = {
          ...statsRef.current,
          connectionId: generateEventId(),
          connectedAt: /* @__PURE__ */ new Date()
        };
        setStats({ ...statsRef.current });
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          sendHeartbeat();
        }, opts.heartbeatInterval);
      };
      ws.onclose = (event) => {
        setConnectionState("disconnected");
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        opts.onDisconnect?.(event.reason || "Connection closed");
        if (opts.reconnect?.enabled && reconnectAttemptsRef.current < (opts.reconnect?.maxAttempts || 5)) {
          setConnectionState("reconnecting");
          reconnectAttemptsRef.current++;
          statsRef.current.reconnectCount++;
          const delay = (opts.reconnect?.delay || 1e3) * Math.pow(2, reconnectAttemptsRef.current - 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.min(delay, 3e4));
        }
      };
      ws.onerror = () => {
        const err = new Error("WebSocket error");
        setError(err);
        opts.onError?.(err);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          statsRef.current.messagesReceived++;
          statsRef.current.lastHeartbeatAt = /* @__PURE__ */ new Date();
          setStats({ ...statsRef.current });
          if (data.type === "connected") {
            statsRef.current.connectionId = data.payload.connectionId;
            opts.onConnect?.(data);
          }
          opts.onMessage?.(data);
          notifySubscribers(data);
        } catch (e) {
          console.error("[useRealtime] Failed to parse message:", e);
        }
      };
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to connect"));
      setConnectionState("failed");
    }
  }, [opts, generateEventId, notifySubscribers]);
  const disconnect = useCallback14(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1e3, "User disconnect");
      wsRef.current = null;
    }
    setConnectionState("disconnected");
  }, []);
  const send = useCallback14((type, payload) => {
    sendMessage({
      type,
      payload,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      eventId: generateEventId(),
      userId: opts.userId,
      sessionId: opts.sessionId
    });
  }, [sendMessage, generateEventId, opts.userId, opts.sessionId]);
  const subscribe = useCallback14((eventType, callback) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, /* @__PURE__ */ new Set());
    }
    subscribersRef.current.get(eventType).add(callback);
    return () => {
      subscribersRef.current.get(eventType)?.delete(callback);
    };
  }, []);
  const sendActivity = useCallback14((activity) => {
    send("activity", activity);
  }, [send]);
  const sendHeartbeat = useCallback14(() => {
    send("heartbeat", {
      status: "alive",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      connectionId: statsRef.current.connectionId
    });
  }, [send]);
  const acknowledge = useCallback14((eventId, action) => {
    send("acknowledge", {
      eventId,
      received: true,
      action
    });
  }, [send]);
  const dismiss = useCallback14((eventId, reason) => {
    send("dismiss", {
      eventId,
      reason: reason || "user_action"
    });
  }, [send]);
  useEffect10(() => {
    if (opts.autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [opts.autoConnect]);
  useEffect10(() => {
    if (connectionState === "connected" && (opts.authToken || opts.userId)) {
      disconnect();
      connect();
    }
  }, [opts.authToken, opts.userId]);
  return {
    connectionState,
    isConnected: connectionState === "connected",
    stats,
    error,
    connect,
    disconnect,
    send,
    subscribe,
    sendActivity,
    sendHeartbeat,
    acknowledge,
    dismiss
  };
}

// src/hooks/usePresence.ts
import { useState as useState12, useEffect as useEffect11, useCallback as useCallback15, useRef as useRef11, useMemo as useMemo4 } from "react";
var DEFAULT_OPTIONS2 = {
  sessionId: void 0,
  initialStatus: "online",
  trackVisibility: true,
  trackActivity: true,
  idleTimeout: 6e4,
  // 1 minute
  awayTimeout: 3e5,
  // 5 minutes
  activityDebounce: 1e3
  // 1 second
};
function usePresence(options) {
  const opts = useMemo4(
    () => ({ ...DEFAULT_OPTIONS2, ...options }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only recompute when specific options change
    [
      options.userId,
      options.sessionId,
      options.idleTimeout,
      options.awayTimeout,
      options.trackActivity,
      options.trackVisibility,
      options.initialStatus
    ]
  );
  const [status, setStatusState] = useState12(opts.initialStatus);
  const [lastActivityAt, setLastActivityAt] = useState12(/* @__PURE__ */ new Date());
  const [metadata, setMetadata] = useState12(() => ({
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS()
  }));
  const idleTimeoutRef = useRef11(null);
  const awayTimeoutRef = useRef11(null);
  const activityDebounceRef = useRef11(null);
  const previousStatusRef = useRef11(opts.initialStatus);
  function detectDeviceType() {
    if (typeof window === "undefined") return "desktop";
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
    return "desktop";
  }
  function detectBrowser() {
    if (typeof window === "undefined") return "unknown";
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "unknown";
  }
  function detectOS() {
    if (typeof window === "undefined") return "unknown";
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS") || ua.includes("iPhone")) return "iOS";
    return "unknown";
  }
  const clearTimers = useCallback15(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
      awayTimeoutRef.current = null;
    }
  }, []);
  const resetTimers = useCallback15(() => {
    clearTimers();
    idleTimeoutRef.current = setTimeout(() => {
      if (previousStatusRef.current === "online" || previousStatusRef.current === "studying") {
        setStatusState("idle");
        opts.onIdle?.();
      }
    }, opts.idleTimeout);
    awayTimeoutRef.current = setTimeout(() => {
      if (previousStatusRef.current !== "offline" && previousStatusRef.current !== "do_not_disturb") {
        setStatusState("away");
        opts.onAway?.();
      }
    }, opts.awayTimeout);
  }, [clearTimers, opts]);
  const setStatus = useCallback15(
    (newStatus) => {
      const prevStatus = previousStatusRef.current;
      if (newStatus !== prevStatus) {
        previousStatusRef.current = newStatus;
        setStatusState(newStatus);
        opts.onStatusChange?.(newStatus, prevStatus);
        opts.sendActivity?.({
          type: "interaction",
          data: { statusChange: { from: prevStatus, to: newStatus } }
        });
      }
    },
    [opts]
  );
  const recordActivity = useCallback15(
    (type = "interaction") => {
      if (activityDebounceRef.current) {
        return;
      }
      activityDebounceRef.current = setTimeout(() => {
        activityDebounceRef.current = null;
      }, opts.activityDebounce);
      setLastActivityAt(/* @__PURE__ */ new Date());
      if (status === "idle" || status === "away") {
        setStatus("online");
        opts.onActive?.();
      }
      resetTimers();
      opts.sendActivity?.({
        type,
        data: { timestamp: (/* @__PURE__ */ new Date()).toISOString() },
        pageContext: typeof window !== "undefined" ? { url: window.location.href } : void 0
      });
    },
    [opts, status, setStatus, resetTimers]
  );
  const updateMetadata = useCallback15((updates) => {
    setMetadata((prev) => prev ? { ...prev, ...updates } : null);
  }, []);
  useEffect11(() => {
    if (!opts.trackVisibility || typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recordActivity("focus");
      } else {
        opts.sendActivity?.({
          type: "blur",
          data: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [opts.trackVisibility, recordActivity, opts.sendActivity]);
  useEffect11(() => {
    if (!opts.trackActivity || typeof window === "undefined") return;
    const handleActivity = () => {
      recordActivity("interaction");
    };
    const handleScroll = () => {
      recordActivity("scroll");
    };
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("mousedown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    resetTimers();
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleScroll);
      clearTimers();
      if (activityDebounceRef.current) {
        clearTimeout(activityDebounceRef.current);
      }
    };
  }, [opts.trackActivity, recordActivity, resetTimers, clearTimers]);
  const presence = opts.userId && metadata ? {
    userId: opts.userId,
    connectionId: "",
    // Set by WebSocket connection
    status,
    lastActivityAt: lastActivityAt || /* @__PURE__ */ new Date(),
    connectedAt: /* @__PURE__ */ new Date(),
    // Set by WebSocket connection
    metadata,
    subscriptions: []
  } : null;
  return {
    status,
    isActive: status === "online" || status === "studying",
    isIdle: status === "idle",
    isAway: status === "away",
    isOnline: status !== "offline",
    lastActivityAt,
    metadata,
    setStatus,
    recordActivity,
    updateMetadata,
    presence
  };
}

// src/hooks/useInterventions.ts
import { useState as useState13, useEffect as useEffect12, useCallback as useCallback16, useRef as useRef12, useMemo as useMemo5 } from "react";
var DEFAULT_OPTIONS3 = {
  maxVisible: 3,
  autoDismissMs: 1e4,
  enableSound: false,
  defaultSurface: "toast"
};
var DEFAULT_DISPLAY_CONFIG = {
  surface: "toast",
  position: "top-right",
  duration: 1e4,
  dismissible: true,
  blocking: false,
  priority: 1,
  animation: "slide",
  sound: false,
  vibrate: false
};
function useInterventions(options = {}) {
  const opts = useMemo5(
    () => ({ ...DEFAULT_OPTIONS3, ...options }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only recompute when specific options change
    [
      options.defaultSurface,
      options.autoDismissMs,
      options.maxVisible,
      options.enableSound,
      options.onIntervention,
      options.acknowledge
    ]
  );
  const [interventions, setInterventions] = useState13(/* @__PURE__ */ new Map());
  const [visibleIds, setVisibleIds] = useState13(/* @__PURE__ */ new Set());
  const [latestNudge, setLatestNudge] = useState13(null);
  const [latestCelebration, setLatestCelebration] = useState13(null);
  const [latestRecommendation, setLatestRecommendation] = useState13(null);
  const [latestGoalProgress, setLatestGoalProgress] = useState13(null);
  const [latestStepCompletion, setLatestStepCompletion] = useState13(null);
  const dismissTimersRef = useRef12(/* @__PURE__ */ new Map());
  const generateId = useCallback16(() => {
    return `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);
  const getDisplayConfig = useCallback16(
    (event) => {
      const config = { ...DEFAULT_DISPLAY_CONFIG, surface: opts.defaultSurface };
      switch (event.type) {
        case "celebration":
          return {
            ...config,
            surface: "modal",
            position: "center",
            blocking: true,
            priority: 10,
            animation: "bounce",
            sound: opts.enableSound,
            duration: 5e3
          };
        case "intervention":
          return {
            ...config,
            surface: "modal",
            position: "center",
            blocking: true,
            priority: 8,
            dismissible: event.dismissible ?? true
          };
        case "checkin":
          return {
            ...config,
            surface: "sidebar",
            position: "right",
            blocking: false,
            priority: 6
          };
        case "nudge":
          return {
            ...config,
            surface: "toast",
            position: event.payload.position || "top-right",
            priority: 4,
            duration: event.payload.dismissAfterMs || opts.autoDismissMs
          };
        case "recommendation":
          return {
            ...config,
            surface: "toast",
            position: "bottom-right",
            priority: 3
          };
        case "step_completed":
        case "goal_progress":
          return {
            ...config,
            surface: "toast",
            position: "top-right",
            priority: 5,
            duration: 5e3
          };
        default:
          return config;
      }
    },
    [opts.defaultSurface, opts.enableSound, opts.autoDismissMs]
  );
  const add = useCallback16(
    (event, customConfig) => {
      const id = event.eventId || generateId();
      const displayConfig = {
        ...getDisplayConfig(event),
        ...customConfig
      };
      const intervention = {
        id,
        event,
        displayConfig,
        visible: false,
        createdAt: /* @__PURE__ */ new Date()
      };
      switch (event.type) {
        case "nudge":
          setLatestNudge(event.payload);
          break;
        case "celebration":
          setLatestCelebration(event.payload);
          break;
        case "recommendation":
          setLatestRecommendation(event.payload);
          break;
        case "goal_progress":
          setLatestGoalProgress(event.payload);
          break;
        case "step_completed":
          setLatestStepCompletion(event.payload);
          break;
      }
      setInterventions((prev) => {
        const next = new Map(prev);
        next.set(id, intervention);
        return next;
      });
      setVisibleIds((prev) => {
        if (prev.size < opts.maxVisible) {
          const next = new Set(prev);
          next.add(id);
          setInterventions((interventions2) => {
            const updated = new Map(interventions2);
            const int = updated.get(id);
            if (int) {
              updated.set(id, { ...int, visible: true, displayedAt: /* @__PURE__ */ new Date() });
            }
            return updated;
          });
          if (displayConfig.duration && displayConfig.duration > 0) {
            const timer = setTimeout(() => {
              dismiss(id, "timeout");
            }, displayConfig.duration);
            dismissTimersRef.current.set(id, timer);
          }
          return next;
        }
        return prev;
      });
      opts.onIntervention?.(intervention);
      opts.acknowledge?.(id, "viewed");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dismiss is defined after this callback
    [generateId, getDisplayConfig, opts]
  );
  const dismiss = useCallback16(
    (interventionId, reason = "user_action") => {
      const timer = dismissTimersRef.current.get(interventionId);
      if (timer) {
        clearTimeout(timer);
        dismissTimersRef.current.delete(interventionId);
      }
      setVisibleIds((prev) => {
        const next = new Set(prev);
        next.delete(interventionId);
        return next;
      });
      setInterventions((prev) => {
        const next = new Map(prev);
        const int = next.get(interventionId);
        if (int) {
          next.set(interventionId, {
            ...int,
            visible: false,
            dismissedAt: /* @__PURE__ */ new Date(),
            interactionType: "dismiss"
          });
        }
        return next;
      });
      opts.onDismiss?.(interventionId, reason);
      opts.dismissEvent?.(interventionId, reason);
      setInterventions((interventions2) => {
        const pending2 = Array.from(interventions2.values()).filter((i) => !i.visible && !i.dismissedAt).sort((a, b) => b.displayConfig.priority - a.displayConfig.priority);
        if (pending2.length > 0) {
          const nextInt = pending2[0];
          setVisibleIds((vis) => {
            if (vis.size < opts.maxVisible) {
              const next = new Set(vis);
              next.add(nextInt.id);
              return next;
            }
            return vis;
          });
        }
        return interventions2;
      });
    },
    [opts]
  );
  const dismissAll = useCallback16(() => {
    dismissTimersRef.current.forEach((timer) => clearTimeout(timer));
    dismissTimersRef.current.clear();
    setVisibleIds(/* @__PURE__ */ new Set());
    setInterventions((prev) => {
      const next = new Map(prev);
      next.forEach((int, id) => {
        next.set(id, { ...int, visible: false, dismissedAt: /* @__PURE__ */ new Date() });
      });
      return next;
    });
  }, []);
  const markViewed = useCallback16(
    (interventionId) => {
      setInterventions((prev) => {
        const next = new Map(prev);
        const int = next.get(interventionId);
        if (int && !int.interactedAt) {
          next.set(interventionId, { ...int, interactedAt: /* @__PURE__ */ new Date() });
        }
        return next;
      });
      opts.acknowledge?.(interventionId, "viewed");
    },
    [opts]
  );
  const triggerAction = useCallback16(
    (interventionId, action) => {
      setInterventions((prev) => {
        const next = new Map(prev);
        const int = next.get(interventionId);
        if (int) {
          next.set(interventionId, {
            ...int,
            interactedAt: /* @__PURE__ */ new Date(),
            interactionType: "action"
          });
        }
        return next;
      });
      opts.onAction?.(interventionId, action);
      opts.acknowledge?.(interventionId, "clicked");
    },
    [opts]
  );
  const hasVisible = useCallback16(
    (type) => {
      return Array.from(interventions.values()).some((i) => i.visible && i.event.type === type);
    },
    [interventions]
  );
  const get = useCallback16(
    (interventionId) => {
      return interventions.get(interventionId);
    },
    [interventions]
  );
  useEffect12(() => {
    const timers = dismissTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);
  const allInterventions = Array.from(interventions.values());
  const queue = {
    items: allInterventions,
    maxVisible: opts.maxVisible,
    currentlyVisible: Array.from(visibleIds),
    priorityOrder: allInterventions.filter((i) => !i.dismissedAt).sort((a, b) => b.displayConfig.priority - a.displayConfig.priority).map((i) => i.id)
  };
  const visible = allInterventions.filter((i) => visibleIds.has(i.id));
  const pending = allInterventions.filter((i) => !i.visible && !i.dismissedAt);
  return {
    queue,
    visible,
    pending,
    add,
    dismiss,
    dismissAll,
    markViewed,
    triggerAction,
    hasVisible,
    get,
    latestNudge,
    latestCelebration,
    latestRecommendation,
    latestGoalProgress,
    latestStepCompletion
  };
}

// src/hooks/usePushNotifications.ts
import { useState as useState14, useEffect as useEffect13, useCallback as useCallback17, useRef as useRef13, useMemo as useMemo6 } from "react";
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
function subscriptionToJSON(sub) {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint || "",
    keys: {
      p256dh: json.keys?.p256dh || "",
      auth: json.keys?.auth || ""
    }
  };
}
var DEFAULT_OPTIONS4 = {
  serviceWorkerPath: "/sw.js",
  autoRequest: false,
  autoRequestOnMount: false,
  applicationServerKey: void 0
};
function usePushNotifications(options = {}) {
  const opts = useMemo6(
    () => ({ ...DEFAULT_OPTIONS4, ...options }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only recompute when specific options change
    [
      options.serviceWorkerPath,
      options.vapidPublicKey,
      options.applicationServerKey,
      options.autoRequestOnMount,
      options.onPermissionChange,
      options.onSubscribe,
      options.onUnsubscribe
    ]
  );
  const [permission, setPermission] = useState14("default");
  const [subscription, setSubscription] = useState14(null);
  const [isLoading, setIsLoading] = useState14(false);
  const swRegistrationRef = useRef13(null);
  const isSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  useEffect13(() => {
    if (!isSupported) {
      setPermission("unsupported");
      return;
    }
    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    const init = async () => {
      try {
        const registration = await navigator.serviceWorker.register(opts.serviceWorkerPath);
        swRegistrationRef.current = registration;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          const subJSON = subscriptionToJSON(existingSub);
          setSubscription(subJSON);
          opts.onSubscriptionChange?.(subJSON);
        }
        if (opts.autoRequest && currentPermission === "default") {
          requestPermission();
        }
      } catch (error) {
        console.error("[usePushNotifications] Service worker registration failed:", error);
        opts.onError?.(error instanceof Error ? error : new Error("Service worker registration failed"));
      }
    };
    init();
  }, [isSupported]);
  const requestPermission = useCallback17(async () => {
    if (!isSupported) {
      return "unsupported";
    }
    try {
      const result = await Notification.requestPermission();
      const state = result;
      setPermission(state);
      opts.onPermissionChange?.(state);
      return state;
    } catch (error) {
      opts.onError?.(error instanceof Error ? error : new Error("Permission request failed"));
      return "denied";
    }
  }, [isSupported, opts]);
  const subscribe = useCallback17(async () => {
    if (!isSupported || !swRegistrationRef.current) {
      return null;
    }
    if (permission !== "granted") {
      const newPermission = await requestPermission();
      if (newPermission !== "granted") {
        return null;
      }
    }
    setIsLoading(true);
    try {
      const subscribeOptions = {
        userVisibleOnly: true
      };
      if (opts.vapidPublicKey) {
        subscribeOptions.applicationServerKey = urlBase64ToUint8Array(opts.vapidPublicKey);
      }
      const pushSubscription = await swRegistrationRef.current.pushManager.subscribe(subscribeOptions);
      const subJSON = subscriptionToJSON(pushSubscription);
      setSubscription(subJSON);
      opts.onSubscriptionChange?.(subJSON);
      return subJSON;
    } catch (error) {
      console.error("[usePushNotifications] Subscribe failed:", error);
      opts.onError?.(error instanceof Error ? error : new Error("Subscribe failed"));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission, opts]);
  const unsubscribe = useCallback17(async () => {
    if (!isSupported || !swRegistrationRef.current) {
      return false;
    }
    setIsLoading(true);
    try {
      const existingSub = await swRegistrationRef.current.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }
      setSubscription(null);
      opts.onSubscriptionChange?.(null);
      return true;
    } catch (error) {
      console.error("[usePushNotifications] Unsubscribe failed:", error);
      opts.onError?.(error instanceof Error ? error : new Error("Unsubscribe failed"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, opts]);
  const showNotification = useCallback17(
    async (notificationOptions) => {
      if (!isSupported || permission !== "granted") {
        return null;
      }
      try {
        if (swRegistrationRef.current) {
          const swOptions = {
            body: notificationOptions.body,
            icon: notificationOptions.icon,
            badge: notificationOptions.badge,
            tag: notificationOptions.tag,
            requireInteraction: notificationOptions.requireInteraction,
            silent: notificationOptions.silent,
            data: notificationOptions.data
          };
          if (notificationOptions.actions) {
            swOptions.actions = notificationOptions.actions;
          }
          await swRegistrationRef.current.showNotification(notificationOptions.title, swOptions);
          return null;
        }
        const notification = new Notification(notificationOptions.title, {
          body: notificationOptions.body,
          icon: notificationOptions.icon,
          badge: notificationOptions.badge,
          tag: notificationOptions.tag,
          requireInteraction: notificationOptions.requireInteraction,
          silent: notificationOptions.silent,
          data: notificationOptions.data
        });
        notification.onclick = () => {
          opts.onNotificationClick?.(notification);
        };
        notification.onclose = () => {
          opts.onNotificationClose?.(notification);
        };
        return notification;
      } catch (error) {
        console.error("[usePushNotifications] Show notification failed:", error);
        opts.onError?.(error instanceof Error ? error : new Error("Show notification failed"));
        return null;
      }
    },
    [isSupported, permission, opts]
  );
  const isNotificationVisible = useCallback17(
    async (tag) => {
      if (!swRegistrationRef.current) {
        return false;
      }
      const notifications = await swRegistrationRef.current.getNotifications({ tag });
      return notifications.length > 0;
    },
    []
  );
  const closeNotification = useCallback17(async (tag) => {
    if (!swRegistrationRef.current) {
      return;
    }
    const notifications = await swRegistrationRef.current.getNotifications({ tag });
    notifications.forEach((notification) => notification.close());
  }, []);
  const registerWithServer = useCallback17(
    async (serverEndpoint, userId) => {
      if (!subscription) {
        return false;
      }
      setIsLoading(true);
      try {
        const response = await fetch(serverEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId,
            subscription
          })
        });
        if (!response.ok) {
          throw new Error(`Server registration failed: ${response.status}`);
        }
        return true;
      } catch (error) {
        console.error("[usePushNotifications] Server registration failed:", error);
        opts.onError?.(error instanceof Error ? error : new Error("Server registration failed"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [subscription, opts]
  );
  return {
    permission,
    isSupported,
    isEnabled: isSupported && permission === "granted" && subscription !== null,
    subscription,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    isNotificationVisible,
    closeNotification,
    registerWithServer
  };
}

// src/hooks/useSAMMemory.ts
import { useState as useState15, useCallback as useCallback18, useRef as useRef14 } from "react";
function useSAMMemory(options = {}) {
  const { debug = false } = options;
  const [searchResults, setSearchResults] = useState15([]);
  const [conversationHistory, setConversationHistory] = useState15([]);
  const [error, setError] = useState15(null);
  const [isSearching, setIsSearching] = useState15(false);
  const [isStoringMemory, setIsStoringMemory] = useState15(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState15(false);
  const mountedRef = useRef14(true);
  const apiCall = useCallback18(
    async (url, options2) => {
      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...options2?.headers
          },
          ...options2
        });
        const result = await response.json();
        if (!response.ok) {
          return { success: false, error: result.error || "Request failed" };
        }
        return { success: true, data: result.data ?? result };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        return { success: false, error: message };
      }
    },
    []
  );
  const log = useCallback18(
    (message, data) => {
      if (debug) {
        console.log(`[useSAMMemory] ${message}`, data ?? "");
      }
    },
    [debug]
  );
  const searchMemories = useCallback18(
    async (query, type, searchOptions) => {
      setIsSearching(true);
      setError(null);
      log("Searching memories", { query, type, searchOptions });
      const result = await apiCall(
        "/api/sam/agentic/memory/search",
        {
          method: "POST",
          body: JSON.stringify({
            query,
            type,
            ...searchOptions
          })
        }
      );
      if (mountedRef.current) {
        if (result.success && result.data) {
          const results = result.data.results || [];
          setSearchResults(results);
          log("Search complete", { count: results.length });
          setIsSearching(false);
          return results;
        } else {
          setError(result.error || "Search failed");
          setIsSearching(false);
          return [];
        }
      }
      return [];
    },
    [apiCall, log]
  );
  const storeMemory = useCallback18(
    async (data) => {
      setIsStoringMemory(true);
      setError(null);
      log("Storing memory", data);
      const result = await apiCall(
        "/api/sam/agentic/memory/store",
        {
          method: "POST",
          body: JSON.stringify({
            type: "memory",
            ...data
          })
        }
      );
      if (mountedRef.current) {
        setIsStoringMemory(false);
        if (result.success && result.data) {
          log("Memory stored", { id: result.data.id });
          return result.data.id;
        } else {
          setError(result.error || "Failed to store memory");
          return null;
        }
      }
      return null;
    },
    [apiCall, log]
  );
  const storeConversation = useCallback18(
    async (data) => {
      setError(null);
      log("Storing conversation turn", data);
      const result = await apiCall(
        "/api/sam/agentic/memory/conversation",
        {
          method: "POST",
          body: JSON.stringify(data)
        }
      );
      if (result.success && result.data) {
        log("Conversation turn stored", { id: result.data.id });
        return result.data.id;
      } else {
        setError(result.error || "Failed to store conversation");
        return null;
      }
    },
    [apiCall, log]
  );
  const getConversationContext = useCallback18(
    async (sessionId, maxTurns = 20) => {
      setIsLoadingConversation(true);
      setError(null);
      log("Getting conversation context", { sessionId, maxTurns });
      const result = await apiCall(
        `/api/sam/agentic/memory/conversation?sessionId=${sessionId}&maxTurns=${maxTurns}`
      );
      if (mountedRef.current) {
        setIsLoadingConversation(false);
        if (result.success && result.data) {
          const turns = result.data.turns || [];
          setConversationHistory(turns);
          log("Conversation context loaded", { count: turns.length });
          return turns;
        } else {
          setError(result.error || "Failed to load conversation context");
          return [];
        }
      }
      return [];
    },
    [apiCall, log]
  );
  const clearError = useCallback18(() => {
    setError(null);
  }, []);
  const clearSearchResults = useCallback18(() => {
    setSearchResults([]);
  }, []);
  return {
    // Search
    searchMemories,
    searchResults,
    isSearching,
    // Long-term memory
    storeMemory,
    isStoringMemory,
    // Conversation
    storeConversation,
    getConversationContext,
    conversationHistory,
    isLoadingConversation,
    // Utility
    error,
    clearError,
    clearSearchResults
  };
}

// src/hooks/useTutoringOrchestration.tsx
import { useState as useState16, useCallback as useCallback19, useMemo as useMemo7, createContext as createContext2, useContext as useContext2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var initialState = {
  hasActivePlan: false,
  currentStep: null,
  stepProgress: null,
  transition: null,
  pendingConfirmations: [],
  metadata: null
};
function useTutoringOrchestration() {
  const [state, setState] = useState16(initialState);
  const updateFromResponse = useCallback19(
    (orchestration) => {
      if (!orchestration) {
        return;
      }
      setState({
        hasActivePlan: orchestration.hasActivePlan ?? false,
        currentStep: orchestration.currentStep ?? null,
        stepProgress: orchestration.stepProgress ?? null,
        transition: orchestration.transition ?? null,
        pendingConfirmations: orchestration.pendingConfirmations ?? [],
        metadata: orchestration.metadata ?? null
      });
    },
    []
  );
  const clearState = useCallback19(() => {
    setState(initialState);
  }, []);
  const hasStepTransition = useMemo7(
    () => state.transition !== null,
    [state.transition]
  );
  const isPlanComplete = useMemo7(
    () => state.transition?.planComplete ?? false,
    [state.transition]
  );
  const hasPendingConfirmations = useMemo7(
    () => state.pendingConfirmations.length > 0,
    [state.pendingConfirmations]
  );
  const currentStepProgress = useMemo7(
    () => state.stepProgress?.progressPercent ?? 0,
    [state.stepProgress]
  );
  const shouldShowCelebration = useMemo7(
    () => state.transition?.celebration !== null && state.transition !== null,
    [state.transition]
  );
  return {
    state,
    updateFromResponse,
    clearState,
    hasStepTransition,
    isPlanComplete,
    hasPendingConfirmations,
    currentStepProgress,
    shouldShowCelebration
  };
}
function useCurrentStep() {
  const { state } = useTutoringOrchestration();
  return useMemo7(
    () => ({
      step: state.currentStep,
      objectives: state.currentStep?.objectives ?? [],
      stepType: state.currentStep?.type ?? null
    }),
    [state.currentStep]
  );
}
function useStepProgress() {
  const { state } = useTutoringOrchestration();
  return useMemo7(
    () => ({
      progressPercent: state.stepProgress?.progressPercent ?? 0,
      isComplete: state.stepProgress?.stepComplete ?? false,
      confidence: state.stepProgress?.confidence ?? 0,
      pendingCriteria: state.stepProgress?.pendingCriteria ?? []
    }),
    [state.stepProgress]
  );
}
function useStepCelebration() {
  const { state, clearState } = useTutoringOrchestration();
  return useMemo7(
    () => ({
      show: state.transition?.celebration !== null && state.transition !== null,
      celebration: state.transition?.celebration ?? null,
      dismiss: clearState
    }),
    [state.transition, clearState]
  );
}
var TutoringOrchestrationContext = createContext2(null);
function TutoringOrchestrationProvider({ children }) {
  const orchestration = useTutoringOrchestration();
  return /* @__PURE__ */ jsx2(TutoringOrchestrationContext.Provider, { value: orchestration, children });
}
function useTutoringOrchestrationContext() {
  const context = useContext2(TutoringOrchestrationContext);
  if (!context) {
    throw new Error(
      "useTutoringOrchestrationContext must be used within TutoringOrchestrationProvider"
    );
  }
  return context;
}

// src/hooks/useNotifications.ts
import { useState as useState17, useEffect as useEffect14, useCallback as useCallback20, useRef as useRef15 } from "react";
function useNotifications(options = {}) {
  const {
    type,
    unreadOnly = false,
    limit = 20,
    refreshInterval,
    disabled = false
  } = options;
  const [notifications, setNotifications] = useState17([]);
  const [total, setTotal] = useState17(0);
  const [unreadCount, setUnreadCount] = useState17(0);
  const [isLoading, setIsLoading] = useState17(false);
  const [error, setError] = useState17(null);
  const [hasMore, setHasMore] = useState17(false);
  const offsetRef = useRef15(0);
  const fetchNotifications = useCallback20(
    async (reset = true) => {
      if (disabled) return;
      setIsLoading(true);
      setError(null);
      const currentOffset = reset ? 0 : offsetRef.current;
      try {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        if (unreadOnly) params.set("unreadOnly", "true");
        params.set("limit", String(limit));
        params.set("offset", String(currentOffset));
        const response = await fetch(
          `/api/sam/agentic/notifications?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const result = await response.json();
        if (result.success) {
          const { data } = result;
          if (reset) {
            setNotifications(data.notifications);
            offsetRef.current = limit;
          } else {
            setNotifications((prev) => [...prev, ...data.notifications]);
            offsetRef.current = currentOffset + limit;
          }
          setTotal(data.pagination.total);
          setUnreadCount(data.unreadCount);
          setHasMore(data.pagination.hasMore);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    },
    [type, unreadOnly, limit, disabled]
  );
  const markAsRead = useCallback20(async (notificationIds) => {
    try {
      const response = await fetch("/api/sam/agentic/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds })
      });
      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }
      setNotifications(
        (prev) => prev.map(
          (n) => notificationIds.includes(n.id) ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      throw err;
    }
  }, []);
  const dismiss = useCallback20(
    async (notificationId, feedback) => {
      try {
        const response = await fetch("/api/sam/agentic/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId, feedback })
        });
        if (!response.ok) {
          throw new Error("Failed to dismiss notification");
        }
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setTotal((prev) => prev - 1);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        throw err;
      }
    },
    []
  );
  const unreadCountRef = useRef15(unreadCount);
  unreadCountRef.current = unreadCount;
  const clearRead = useCallback20(async () => {
    try {
      const response = await fetch("/api/sam/agentic/notifications", {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to clear notifications");
      }
      setNotifications((prev) => prev.filter((n) => !n.read));
      setTotal(unreadCountRef.current);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      throw err;
    }
  }, []);
  const isLoadingRef = useRef15(isLoading);
  isLoadingRef.current = isLoading;
  const hasMoreRef = useRef15(hasMore);
  hasMoreRef.current = hasMore;
  const loadMore = useCallback20(async () => {
    if (!hasMoreRef.current || isLoadingRef.current) return;
    await fetchNotifications(false);
  }, [fetchNotifications]);
  const refresh = useCallback20(async () => {
    await fetchNotifications(true);
  }, [fetchNotifications]);
  useEffect14(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);
  useEffect14(() => {
    if (!refreshInterval || disabled) return;
    const intervalId = setInterval(() => {
      fetchNotifications(true);
    }, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, disabled, fetchNotifications]);
  return {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    dismiss,
    clearRead,
    loadMore,
    hasMore
  };
}

// src/hooks/useBehaviorPatterns.ts
import { useState as useState18, useEffect as useEffect15, useCallback as useCallback21 } from "react";
function useBehaviorPatterns(options = {}) {
  const { autoFetch = true, refreshInterval } = options;
  const [patterns, setPatterns] = useState18([]);
  const [isLoading, setIsLoading] = useState18(false);
  const [isDetecting, setIsDetecting] = useState18(false);
  const [error, setError] = useState18(null);
  const fetchPatterns = useCallback21(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sam/agentic/behavior/patterns");
      if (!response.ok) {
        throw new Error("Failed to fetch behavior patterns");
      }
      const result = await response.json();
      if (result.success) {
        setPatterns(result.data.patterns);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);
  const detectPatterns = useCallback21(async () => {
    setIsDetecting(true);
    setError(null);
    try {
      const response = await fetch("/api/sam/agentic/behavior/patterns", {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error("Failed to detect behavior patterns");
      }
      const result = await response.json();
      if (result.success) {
        const detectedPatterns = result.data.patterns;
        setPatterns(detectedPatterns);
        return detectedPatterns;
      }
      return [];
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Unknown error");
      setError(error2);
      throw error2;
    } finally {
      setIsDetecting(false);
    }
  }, []);
  const refresh = useCallback21(async () => {
    await fetchPatterns();
  }, [fetchPatterns]);
  useEffect15(() => {
    if (autoFetch) {
      fetchPatterns();
    }
  }, [autoFetch, fetchPatterns]);
  useEffect15(() => {
    if (!refreshInterval) return;
    const intervalId = setInterval(() => {
      fetchPatterns();
    }, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchPatterns]);
  return {
    patterns,
    isLoading,
    isDetecting,
    error,
    refresh,
    detectPatterns
  };
}

// src/hooks/useRecommendations.ts
import { useState as useState19, useEffect as useEffect16, useCallback as useCallback22, useRef as useRef16 } from "react";
function useRecommendations(options = {}) {
  const {
    availableTime = 60,
    limit = 5,
    types,
    autoFetch = true,
    refreshInterval
  } = options;
  const [recommendations, setRecommendations] = useState19([]);
  const [totalEstimatedTime, setTotalEstimatedTime] = useState19(0);
  const [generatedAt, setGeneratedAt] = useState19(null);
  const [context, setContext] = useState19(null);
  const [isLoading, setIsLoading] = useState19(false);
  const [error, setError] = useState19(null);
  const typesRef = useRef16(types);
  typesRef.current = types;
  const fetchRecommendations = useCallback22(
    async (fetchOptions) => {
      setIsLoading(true);
      setError(null);
      const time = fetchOptions?.time ?? availableTime;
      const fetchLimit = fetchOptions?.limit ?? limit;
      const fetchTypes = fetchOptions?.types ?? typesRef.current;
      try {
        const params = new URLSearchParams();
        params.set("time", String(time));
        params.set("limit", String(fetchLimit));
        if (fetchTypes?.length) {
          params.set("types", fetchTypes.join(","));
        }
        const response = await fetch(
          `/api/sam/agentic/recommendations?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }
        const result = await response.json();
        if (result.success) {
          const { data } = result;
          setRecommendations(data.recommendations);
          setTotalEstimatedTime(data.totalEstimatedTime);
          setGeneratedAt(data.generatedAt);
          setContext(data.context);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    },
    [availableTime, limit]
  );
  const refresh = useCallback22(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);
  useEffect16(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
  }, [autoFetch, fetchRecommendations]);
  useEffect16(() => {
    if (!refreshInterval) return;
    const intervalId = setInterval(() => {
      fetchRecommendations();
    }, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchRecommendations]);
  return {
    recommendations,
    totalEstimatedTime,
    generatedAt,
    context,
    isLoading,
    error,
    refresh,
    fetchRecommendations
  };
}

// src/hooks/useExamEngine.ts
import { useState as useState20, useCallback as useCallback23, useRef as useRef17 } from "react";
var DEFAULT_BLOOMS_DISTRIBUTION = {
  REMEMBER: 15,
  UNDERSTAND: 20,
  APPLY: 25,
  ANALYZE: 20,
  EVALUATE: 15,
  CREATE: 5
};
var DEFAULT_DIFFICULTY_DISTRIBUTION = {
  EASY: 30,
  MEDIUM: 50,
  HARD: 20
};
function useExamEngine(options = {}) {
  const {
    apiEndpoint = "/api/sam/exam-engine",
    courseId,
    sectionIds,
    includeStudentProfile = true,
    onExamGenerated,
    onError
  } = options;
  const [isGenerating, setIsGenerating] = useState20(false);
  const [isLoading, setIsLoading] = useState20(false);
  const [generatedExam, setGeneratedExam] = useState20(null);
  const [examWithProfile, setExamWithProfile] = useState20(null);
  const [error, setError] = useState20(null);
  const optionsRef = useRef17(options);
  optionsRef.current = options;
  const generateExam = useCallback23(
    async (config) => {
      setIsGenerating(true);
      setError(null);
      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            sectionIds,
            config: {
              totalQuestions: config.totalQuestions,
              timeLimit: config.timeLimit,
              bloomsDistribution: {
                ...DEFAULT_BLOOMS_DISTRIBUTION,
                ...config.bloomsDistribution
              },
              difficultyDistribution: {
                ...DEFAULT_DIFFICULTY_DISTRIBUTION,
                ...config.difficultyDistribution
              },
              questionTypes: config.questionTypes || ["MULTIPLE_CHOICE", "SHORT_ANSWER"],
              adaptiveMode: config.adaptiveMode ?? false
            },
            includeStudentProfile
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to generate exam: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const exam = data.data;
          setGeneratedExam(exam);
          onExamGenerated?.(exam);
          return exam;
        }
        throw new Error(data.error || "Failed to generate exam");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiEndpoint, courseId, sectionIds, includeStudentProfile, onExamGenerated, onError]
  );
  const getExam = useCallback23(
    async (examId) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ examId });
        const response = await fetch(`${apiEndpoint}?${params}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to get exam: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const exam = data.data;
          setExamWithProfile(exam);
          return exam;
        }
        throw new Error(data.error || "Failed to get exam");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, onError]
  );
  const getDefaultBloomsDistribution = useCallback23(() => {
    return { ...DEFAULT_BLOOMS_DISTRIBUTION };
  }, []);
  const getDefaultDifficultyDistribution = useCallback23(() => {
    return { ...DEFAULT_DIFFICULTY_DISTRIBUTION };
  }, []);
  const reset = useCallback23(() => {
    setGeneratedExam(null);
    setExamWithProfile(null);
    setError(null);
  }, []);
  return {
    isGenerating,
    isLoading,
    generatedExam,
    examWithProfile,
    error,
    generateExam,
    getExam,
    getDefaultBloomsDistribution,
    getDefaultDifficultyDistribution,
    reset
  };
}

// src/hooks/useQuestionBank.ts
import { useState as useState21, useCallback as useCallback24, useRef as useRef18 } from "react";
function useQuestionBank(options = {}) {
  const {
    apiEndpoint = "/api/sam/exam-engine/question-bank",
    courseId,
    subject,
    topic,
    pageSize = 50,
    onQuestionsLoaded,
    onQuestionsAdded,
    onError
  } = options;
  const [questions, setQuestions] = useState21([]);
  const [stats, setStats] = useState21(null);
  const [pagination, setPagination] = useState21(null);
  const [isLoading, setIsLoading] = useState21(false);
  const [isAdding, setIsAdding] = useState21(false);
  const [isUpdating, setIsUpdating] = useState21(false);
  const [isDeleting, setIsDeleting] = useState21(false);
  const [error, setError] = useState21(null);
  const currentQueryRef = useRef18({});
  const optionsRef = useRef18(options);
  optionsRef.current = options;
  const getQuestions = useCallback24(
    async (query = {}) => {
      setIsLoading(true);
      setError(null);
      currentQueryRef.current = query;
      try {
        const params = new URLSearchParams();
        if (query.courseId || courseId) params.append("courseId", query.courseId || courseId || "");
        if (query.subject || subject) params.append("subject", query.subject || subject || "");
        if (query.topic || topic) params.append("topic", query.topic || topic || "");
        if (query.bloomsLevel) params.append("bloomsLevel", query.bloomsLevel);
        if (query.difficulty) params.append("difficulty", query.difficulty);
        if (query.questionType) params.append("questionType", query.questionType);
        params.append("limit", String(query.limit || pageSize));
        params.append("offset", String(query.offset || 0));
        const response = await fetch(`${apiEndpoint}?${params}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to get questions: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const loadedQuestions = data.data.questions;
          setQuestions(loadedQuestions);
          setStats(data.data.stats || null);
          setPagination(data.data.pagination || null);
          onQuestionsLoaded?.(loadedQuestions);
          return loadedQuestions;
        }
        throw new Error(data.error || "Failed to get questions");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, courseId, subject, topic, pageSize, onQuestionsLoaded, onError]
  );
  const addQuestions = useCallback24(
    async (newQuestions, subjectOverride, topicOverride) => {
      setIsAdding(true);
      setError(null);
      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            subject: subjectOverride || subject,
            topic: topicOverride || topic,
            questions: newQuestions
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to add questions: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          const count = data.data.count || 0;
          onQuestionsAdded?.(count);
          return count;
        }
        throw new Error(data.error || "Failed to add questions");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
        return 0;
      } finally {
        setIsAdding(false);
      }
    },
    [apiEndpoint, courseId, subject, topic, onQuestionsAdded, onError]
  );
  const updateQuestion = useCallback24(
    async (questionId, updates) => {
      setIsUpdating(true);
      setError(null);
      try {
        const response = await fetch(apiEndpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            updates
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update question: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
          setQuestions(
            (prev) => prev.map(
              (q) => q.id === questionId ? { ...q, ...data.data } : q
            )
          );
          return true;
        }
        throw new Error(data.error || "Failed to update question");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [apiEndpoint, onError]
  );
  const deleteQuestion = useCallback24(
    async (questionId) => {
      setIsDeleting(true);
      setError(null);
      try {
        const params = new URLSearchParams({ id: questionId });
        const response = await fetch(`${apiEndpoint}?${params}`, {
          method: "DELETE"
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete question: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
          setQuestions((prev) => prev.filter((q) => q.id !== questionId));
          return true;
        }
        throw new Error(data.error || "Failed to delete question");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [apiEndpoint, onError]
  );
  const loadMore = useCallback24(async () => {
    if (!pagination?.hasMore || isLoading) return;
    const newOffset = pagination.offset + pagination.limit;
    const query = { ...currentQueryRef.current, offset: newOffset };
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.courseId || courseId) params.append("courseId", query.courseId || courseId || "");
      if (query.subject || subject) params.append("subject", query.subject || subject || "");
      if (query.topic || topic) params.append("topic", query.topic || topic || "");
      if (query.bloomsLevel) params.append("bloomsLevel", query.bloomsLevel);
      if (query.difficulty) params.append("difficulty", query.difficulty);
      if (query.questionType) params.append("questionType", query.questionType);
      params.append("limit", String(query.limit || pageSize));
      params.append("offset", String(newOffset));
      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to load more questions: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        const loadedQuestions = data.data.questions;
        setQuestions((prev) => [...prev, ...loadedQuestions]);
        setPagination(data.data.pagination || null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, courseId, subject, topic, pageSize, pagination, isLoading, onError]);
  const refresh = useCallback24(async () => {
    await getQuestions(currentQueryRef.current);
  }, [getQuestions]);
  const reset = useCallback24(() => {
    setQuestions([]);
    setStats(null);
    setPagination(null);
    setError(null);
    currentQueryRef.current = {};
  }, []);
  return {
    questions,
    stats,
    pagination,
    isLoading,
    isAdding,
    isUpdating,
    isDeleting,
    error,
    getQuestions,
    addQuestions,
    updateQuestion,
    deleteQuestion,
    loadMore,
    refresh,
    reset
  };
}

// src/hooks/useInnovationFeatures.ts
import { useState as useState22, useCallback as useCallback25, useRef as useRef19 } from "react";
function useInnovationFeatures(options = {}) {
  const {
    apiEndpoint = "/api/sam/innovation-features",
    autoLoadStatus = false,
    onError
  } = options;
  const [featuresStatus, setFeaturesStatus] = useState22(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState22(false);
  const [cognitiveFitness, setCognitiveFitness] = useState22(null);
  const [isAssessingFitness, setIsAssessingFitness] = useState22(false);
  const [learningDNA, setLearningDNA] = useState22(null);
  const [dnaVisualization, setDnaVisualization] = useState22(null);
  const [isGeneratingDNA, setIsGeneratingDNA] = useState22(false);
  const [studyBuddy, setStudyBuddy] = useState22(null);
  const [isCreatingBuddy, setIsCreatingBuddy] = useState22(false);
  const [isInteracting, setIsInteracting] = useState22(false);
  const [quantumPaths, setQuantumPaths] = useState22([]);
  const [isCreatingPath, setIsCreatingPath] = useState22(false);
  const [error, setError] = useState22(null);
  const hasLoadedRef = useRef19(false);
  const apiCall = useCallback25(
    async (action, data = {}) => {
      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, data })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
        throw new Error(result.error || "Request failed");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
        return null;
      }
    },
    [apiEndpoint, onError]
  );
  const loadFeaturesStatus = useCallback25(async () => {
    setIsLoadingStatus(true);
    setError(null);
    try {
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`Failed to load status: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        const status = {
          hasCognitiveFitness: data.data.hasCognitiveFitness,
          hasLearningDNA: data.data.hasLearningDNA,
          hasStudyBuddy: data.data.hasStudyBuddy,
          activeQuantumPaths: data.data.activeQuantumPaths,
          lastUpdated: {
            fitness: data.data.lastUpdated?.fitness ? new Date(data.data.lastUpdated.fitness) : void 0,
            dna: data.data.lastUpdated?.dna ? new Date(data.data.lastUpdated.dna) : void 0,
            buddy: data.data.lastUpdated?.buddy ? new Date(data.data.lastUpdated.buddy) : void 0
          }
        };
        setFeaturesStatus(status);
        return status;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      onError?.(message);
      return null;
    } finally {
      setIsLoadingStatus(false);
    }
  }, [apiEndpoint, onError]);
  if (autoLoadStatus && !hasLoadedRef.current) {
    hasLoadedRef.current = true;
    loadFeaturesStatus();
  }
  const assessCognitiveFitness = useCallback25(async () => {
    setIsAssessingFitness(true);
    setError(null);
    const result = await apiCall("assess-cognitive-fitness", {});
    if (result) {
      setCognitiveFitness(result.fitness);
      setIsAssessingFitness(false);
      return result.fitness;
    }
    setIsAssessingFitness(false);
    return null;
  }, [apiCall]);
  const startFitnessExercise = useCallback25(
    async (exerciseId) => {
      return apiCall("start-fitness-exercise", { exerciseId });
    },
    [apiCall]
  );
  const completeFitnessExercise = useCallback25(
    async (sessionId, performance, duration) => {
      await apiCall("complete-fitness-exercise", { sessionId, performance, duration });
    },
    [apiCall]
  );
  const getFitnessRecommendations = useCallback25(async () => {
    const result = await apiCall("get-fitness-recommendations", {});
    return result?.recommendations || [];
  }, [apiCall]);
  const generateLearningDNA = useCallback25(async () => {
    setIsGeneratingDNA(true);
    setError(null);
    const result = await apiCall("generate-learning-dna", {});
    if (result) {
      setLearningDNA(result.dna);
      setDnaVisualization(result.visualization);
      setIsGeneratingDNA(false);
      return result.dna;
    }
    setIsGeneratingDNA(false);
    return null;
  }, [apiCall]);
  const analyzeDNATraits = useCallback25(async () => {
    return apiCall("analyze-dna-traits", {});
  }, [apiCall]);
  const trackDNAEvolution = useCallback25(async () => {
    return apiCall("track-dna-evolution", {});
  }, [apiCall]);
  const createStudyBuddy = useCallback25(
    async (preferences) => {
      setIsCreatingBuddy(true);
      setError(null);
      const result = await apiCall("create-study-buddy", { preferences });
      if (result) {
        setStudyBuddy(result.buddy);
        setIsCreatingBuddy(false);
        return result.buddy;
      }
      setIsCreatingBuddy(false);
      return null;
    },
    [apiCall]
  );
  const interactWithBuddy = useCallback25(
    async (type, context) => {
      if (!studyBuddy) {
        setError("No study buddy found. Create one first.");
        return null;
      }
      setIsInteracting(true);
      setError(null);
      const result = await apiCall("interact-with-buddy", {
        buddyId: studyBuddy.buddyId,
        interactionType: type,
        context
      });
      setIsInteracting(false);
      return result?.interaction || null;
    },
    [apiCall, studyBuddy]
  );
  const updateBuddyPersonality = useCallback25(
    async (personalityUpdates, reason) => {
      if (!studyBuddy) {
        setError("No study buddy found.");
        return false;
      }
      const result = await apiCall(
        "update-buddy-personality",
        {
          buddyId: studyBuddy.buddyId,
          personalityUpdates,
          reason
        }
      );
      if (result?.success && result.updatedPersonality) {
        setStudyBuddy(
          (prev) => prev ? { ...prev, personality: result.updatedPersonality } : null
        );
        return true;
      }
      return false;
    },
    [apiCall, studyBuddy]
  );
  const getBuddyEffectiveness = useCallback25(async () => {
    if (!studyBuddy) {
      setError("No study buddy found.");
      return null;
    }
    return apiCall("get-buddy-effectiveness", {
      buddyId: studyBuddy.buddyId
    });
  }, [apiCall, studyBuddy]);
  const createQuantumPath = useCallback25(
    async (learningGoal, preferences) => {
      setIsCreatingPath(true);
      setError(null);
      const result = await apiCall("create-quantum-path", {
        learningGoal,
        preferences
      });
      if (result) {
        setQuantumPaths((prev) => [...prev, result.quantumPath]);
        setIsCreatingPath(false);
        return result.quantumPath;
      }
      setIsCreatingPath(false);
      return null;
    },
    [apiCall]
  );
  const observeQuantumPath = useCallback25(
    async (pathId, type, data) => {
      const result = await apiCall(
        "observe-quantum-path",
        {
          pathId,
          observationType: type,
          observationData: data
        }
      );
      return result?.observation || null;
    },
    [apiCall]
  );
  const getPathProbabilities = useCallback25(
    async (pathId) => {
      return apiCall("get-path-probabilities", { pathId });
    },
    [apiCall]
  );
  const collapseQuantumPath = useCallback25(
    async (pathId, reason) => {
      const result = await apiCall("collapse-quantum-path", {
        pathId,
        reason
      });
      if (result) {
        setQuantumPaths(
          (prev) => prev.map(
            (p) => p.pathId === pathId ? { ...p, collapsed: true, isActive: false } : p
          )
        );
      }
      return result;
    },
    [apiCall]
  );
  const clearError = useCallback25(() => {
    setError(null);
  }, []);
  return {
    // Status
    featuresStatus,
    isLoadingStatus,
    // Cognitive Fitness
    cognitiveFitness,
    isAssessingFitness,
    assessCognitiveFitness,
    startFitnessExercise,
    completeFitnessExercise,
    getFitnessRecommendations,
    // Learning DNA
    learningDNA,
    dnaVisualization,
    isGeneratingDNA,
    generateLearningDNA,
    analyzeDNATraits,
    trackDNAEvolution,
    // Study Buddy
    studyBuddy,
    isCreatingBuddy,
    isInteracting,
    createStudyBuddy,
    interactWithBuddy,
    updateBuddyPersonality,
    getBuddyEffectiveness,
    // Quantum Paths
    quantumPaths,
    isCreatingPath,
    createQuantumPath,
    observeQuantumPath,
    getPathProbabilities,
    collapseQuantumPath,
    // General
    error,
    loadFeaturesStatus,
    clearError
  };
}

// src/hooks/useMultimodal.ts
import { useState as useState23, useCallback as useCallback26, useRef as useRef20 } from "react";
async function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({
        data: base64,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
function useMultimodal(options = {}) {
  const {
    apiEndpoint = "/api/sam/multimodal",
    courseId,
    assignmentId,
    defaultOptions = {},
    onProcessingComplete,
    onError
  } = options;
  const [isProcessing, setIsProcessing] = useState23(false);
  const [processedInput, setProcessedInput] = useState23(null);
  const [processingStatus, setProcessingStatus] = useState23(null);
  const [storageQuota, setStorageQuota] = useState23(null);
  const [error, setError] = useState23(null);
  const optionsRef = useRef20(options);
  optionsRef.current = options;
  const apiCall = useCallback26(
    async (action, data) => {
      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, data })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Request failed: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
        throw new Error(result.error?.message || "Request failed");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
        return null;
      }
    },
    [apiEndpoint, onError]
  );
  const processInput = useCallback26(
    async (file, processingOptions, expectedType) => {
      setIsProcessing(true);
      setError(null);
      const result = await apiCall("process-input", {
        file,
        options: { ...defaultOptions, ...processingOptions },
        courseId,
        assignmentId,
        expectedType
      });
      if (result) {
        setProcessedInput(result);
        onProcessingComplete?.(result);
      }
      setIsProcessing(false);
      return result;
    },
    [apiCall, defaultOptions, courseId, assignmentId, onProcessingComplete]
  );
  const processBatch = useCallback26(
    async (files, processingOptions) => {
      setIsProcessing(true);
      setError(null);
      const result = await apiCall("batch-process", {
        files,
        options: { ...defaultOptions, ...processingOptions },
        courseId,
        assignmentId
      });
      setIsProcessing(false);
      return result;
    },
    [apiCall, defaultOptions, courseId, assignmentId]
  );
  const validateInput = useCallback26(
    async (file) => {
      const result = await apiCall("validate-input", { file });
      return result || { isValid: false, errors: ["Validation failed"], warnings: [] };
    },
    [apiCall]
  );
  const extractText = useCallback26(
    async (file) => {
      setIsProcessing(true);
      setError(null);
      const result = await apiCall("extract-text", { file });
      setIsProcessing(false);
      return result;
    },
    [apiCall]
  );
  const assessQuality = useCallback26(
    async (file) => {
      return apiCall("assess-quality", { file });
    },
    [apiCall]
  );
  const getProcessingStatus = useCallback26(
    async (inputId) => {
      const result = await apiCall("get-status", { inputId });
      if (result) {
        setProcessingStatus(result);
      }
      return result;
    },
    [apiCall]
  );
  const cancelProcessing = useCallback26(
    async (inputId) => {
      const result = await apiCall("cancel-processing", { inputId });
      return result?.success || false;
    },
    [apiCall]
  );
  const getStorageQuota = useCallback26(async () => {
    try {
      const response = await fetch(`${apiEndpoint}?endpoint=quota`);
      if (!response.ok) {
        throw new Error(`Failed to get quota: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        const quota = data.data;
        setStorageQuota(quota);
        return quota;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      onError?.(message);
      return null;
    }
  }, [apiEndpoint, onError]);
  const fileToBase64 = useCallback26(async (file) => {
    return convertFileToBase64(file);
  }, []);
  const reset = useCallback26(() => {
    setProcessedInput(null);
    setProcessingStatus(null);
    setError(null);
  }, []);
  return {
    isProcessing,
    processedInput,
    processingStatus,
    storageQuota,
    error,
    processInput,
    processBatch,
    validateInput,
    extractText,
    assessQuality,
    getProcessingStatus,
    cancelProcessing,
    getStorageQuota,
    fileToBase64,
    reset
  };
}

// src/hooks/useEnhancedBloomsAnalysis.ts
import { useState as useState24, useCallback as useCallback27, useRef as useRef21 } from "react";

// src/utils/contextDetector.ts
var DEFAULT_ROUTE_PATTERNS = [
  // Teacher routes
  {
    pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)\/section\/([^/]+)/,
    type: "section-detail",
    extract: (match) => ({
      entityId: match[3],
      parentEntityId: match[2]
    })
  },
  {
    pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)/,
    type: "chapter-detail",
    extract: (match) => ({
      entityId: match[2],
      parentEntityId: match[1]
    })
  },
  {
    pattern: /^\/teacher\/courses\/([^/]+)/,
    type: "course-detail",
    extract: (match) => ({
      entityId: match[1]
    })
  },
  {
    pattern: /^\/teacher\/courses/,
    type: "courses-list"
  },
  {
    pattern: /^\/teacher\/create/,
    type: "course-create"
  },
  {
    pattern: /^\/teacher\/analytics/,
    type: "analytics"
  },
  // Student routes
  {
    pattern: /^\/courses\/([^/]+)\/chapters\/([^/]+)/,
    type: "chapter-detail",
    extract: (match) => ({
      entityId: match[2],
      parentEntityId: match[1]
    })
  },
  {
    pattern: /^\/courses\/([^/]+)/,
    type: "course-detail",
    extract: (match) => ({
      entityId: match[1]
    })
  },
  {
    pattern: /^\/courses/,
    type: "courses-list"
  },
  // Common routes
  {
    pattern: /^\/dashboard/,
    type: "dashboard"
  },
  {
    pattern: /^\/settings/,
    type: "settings"
  }
];
var DEFAULT_CAPABILITIES = {
  dashboard: ["analyze-progress", "suggest-next-steps", "show-insights"],
  "courses-list": ["search-courses", "suggest-courses", "compare-courses"],
  "course-detail": ["analyze-course", "suggest-improvements", "generate-outline", "ask-questions"],
  "course-create": ["suggest-title", "generate-description", "create-outline", "fill-form"],
  "chapter-detail": ["analyze-chapter", "suggest-content", "generate-questions", "explain-concepts"],
  "section-detail": ["analyze-section", "suggest-content", "generate-quiz", "explain-topic"],
  settings: ["explain-settings", "suggest-preferences"],
  analytics: ["explain-metrics", "identify-trends", "suggest-actions"],
  learning: ["explain-concept", "provide-examples", "quiz-me"],
  exam: ["prepare-exam", "review-answers", "explain-mistakes"],
  other: ["answer-questions", "provide-help"]
};
function createContextDetector(options) {
  const routePatterns = options?.routePatterns ?? {};
  const capabilityMappings = options?.capabilityMappings ?? DEFAULT_CAPABILITIES;
  function detectFromPath(path) {
    for (const [pattern, type] of Object.entries(routePatterns)) {
      const regex = new RegExp(pattern);
      if (regex.test(path)) {
        return {
          type,
          path,
          capabilities: capabilityMappings[type] ?? [],
          breadcrumb: generateBreadcrumb(path)
        };
      }
    }
    for (const { pattern, type, extract } of DEFAULT_ROUTE_PATTERNS) {
      const match = path.match(pattern);
      if (match) {
        const extracted = extract?.(match) ?? {};
        return {
          type,
          path,
          ...extracted,
          capabilities: capabilityMappings[type] ?? [],
          breadcrumb: generateBreadcrumb(path)
        };
      }
    }
    return {
      type: "other",
      path,
      capabilities: capabilityMappings["other"] ?? [],
      breadcrumb: generateBreadcrumb(path)
    };
  }
  function detectFromDOM() {
    if (typeof document === "undefined") return {};
    const detection = {};
    const entityElement = document.querySelector("[data-entity-id]");
    if (entityElement) {
      detection.entityId = entityElement.getAttribute("data-entity-id") ?? void 0;
    }
    const pageTypeElement = document.querySelector("[data-page-type]");
    if (pageTypeElement) {
      detection.type = pageTypeElement.getAttribute("data-page-type");
    }
    const metaEntityId = document.querySelector('meta[name="sam:entity-id"]');
    if (metaEntityId) {
      detection.entityId = metaEntityId.getAttribute("content") ?? void 0;
    }
    const metaPageType = document.querySelector('meta[name="sam:page-type"]');
    if (metaPageType) {
      detection.type = metaPageType.getAttribute("content");
    }
    return detection;
  }
  function detect() {
    if (typeof window === "undefined") {
      return {
        type: "other",
        path: "/",
        capabilities: [],
        breadcrumb: []
      };
    }
    const pathDetection = detectFromPath(window.location.pathname);
    if (options?.detectFromDOM) {
      const domDetection = detectFromDOM();
      return {
        ...pathDetection,
        ...domDetection
      };
    }
    return pathDetection;
  }
  return {
    detectFromPath,
    detectFromDOM,
    detect
  };
}
function generateBreadcrumb(path) {
  const segments = path.split("/").filter(Boolean);
  const breadcrumb = [];
  for (const segment of segments) {
    if (/^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment)) {
      continue;
    }
    const formatted = segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    breadcrumb.push(formatted);
  }
  return breadcrumb;
}
function getCapabilities(pageType) {
  return DEFAULT_CAPABILITIES[pageType] ?? DEFAULT_CAPABILITIES["other"] ?? [];
}
function hasCapability(context, capability) {
  return context.page.capabilities.includes(capability);
}
var contextDetector = createContextDetector();

// src/index.ts
var VERSION = "0.1.0";
export {
  SAMContext,
  SAMProvider,
  SAM_FORM_DATA_EVENT,
  TutoringOrchestrationProvider,
  VERSION,
  contextDetector,
  createContextDetector,
  emitSAMFormData,
  getCapabilities,
  hasCapability,
  useAgentic,
  useBehaviorPatterns,
  useCurrentStep,
  useExamEngine,
  useInnovationFeatures,
  useInterventions,
  useMultimodal,
  useNotifications,
  usePresence,
  usePushNotifications,
  useQuestionBank,
  useRealtime,
  useRecommendations,
  useSAM,
  useSAMActions,
  useSAMAdaptiveContent,
  useSAMAnalysis,
  useSAMAutoContext,
  useSAMChat,
  useSAMContext,
  useSAMForm,
  useSAMFormAutoDetect,
  useSAMFormAutoFill,
  useSAMFormDataEvents,
  useSAMFormDataSync,
  useSAMFormSync,
  useSAMMemory,
  useSAMPageContext,
  useSAMPageLinks,
  useSAMPracticeProblems,
  useSAMSocraticDialogue,
  useStepCelebration,
  useStepProgress,
  useTutoringOrchestration,
  useTutoringOrchestrationContext
};
