// src/context/SAMContext.tsx
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo
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
  const initialState = useMemo(
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
  const [state, dispatch] = useReducer(samReducer, initialState);
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
  useEffect(() => {
    const unsubscribe = stateMachine.subscribe((newState) => {
      dispatch({ type: "SET_STATE", payload: newState });
      onStateChange?.(newState);
      if (debug) {
        console.log("[SAM] State changed:", newState);
      }
    });
    stateMachine.send({ type: "INITIALIZE", payload: { context: state.context } });
    return unsubscribe;
  }, [stateMachine, onStateChange, debug, state.context]);
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
    dispatch({ type: "UPDATE_CONTEXT", payload: { page: { ...state.context.page, ...page } } });
  }, [state.context.page]);
  const updateForm = useCallback((fields) => {
    if (!state.context.form) return;
    dispatch({
      type: "UPDATE_CONTEXT",
      payload: {
        form: {
          ...state.context.form,
          fields,
          lastUpdated: /* @__PURE__ */ new Date()
        }
      }
    });
  }, [state.context.form]);
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
import { useState as useState3, useCallback as useCallback5, useEffect as useEffect3, useRef } from "react";
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
  const debounceRef = useRef(void 0);
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
  VERSION,
  contextDetector,
  createContextDetector,
  getCapabilities,
  hasCapability,
  useSAM,
  useSAMActions,
  useSAMAnalysis,
  useSAMAutoContext,
  useSAMChat,
  useSAMContext,
  useSAMForm,
  useSAMFormSync,
  useSAMPageContext
};
