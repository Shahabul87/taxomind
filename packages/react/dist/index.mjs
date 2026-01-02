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

// src/hooks/useSAMPageLinks.ts
import { useCallback as useCallback6, useEffect as useEffect4, useRef as useRef2, useState as useState4 } from "react";
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
  const optionsRef = useRef2(options);
  optionsRef.current = options;
  const contextRef = useRef2(context);
  contextRef.current = context;
  const updatePageRef = useRef2(updatePage);
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
import { useCallback as useCallback7, useEffect as useEffect5, useMemo as useMemo2, useRef as useRef3 } from "react";
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
  const latestOptionsRef = useRef3(options);
  latestOptionsRef.current = options;
  const contextRef = useRef3(context);
  contextRef.current = context;
  const updateContextRef = useRef3(updateContext);
  updateContextRef.current = updateContext;
  const formDataRef = useRef3(formData);
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
import { useCallback as useCallback8, useEffect as useEffect7, useRef as useRef4, useState as useState6 } from "react";
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
  const optionsRef = useRef4(options);
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
import { useState as useState7, useCallback as useCallback10, useRef as useRef5 } from "react";
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
  const sessionIdRef = useRef5(`session_${Date.now()}`);
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
import { useState as useState8, useCallback as useCallback11, useEffect as useEffect8, useRef as useRef6 } from "react";
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
  const hasTriedAutoDetect = useRef6(false);
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
import { useState as useState9, useCallback as useCallback12, useRef as useRef7 } from "react";
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
  const currentHintIndexRef = useRef7(0);
  const previousInsightsRef = useRef7([]);
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
import { useState as useState10, useCallback as useCallback13, useEffect as useEffect9, useRef as useRef8 } from "react";
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
  const [isLoadingGoals, setIsLoadingGoals] = useState10(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState10(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState10(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState10(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState10(false);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState10(false);
  const mountedRef = useRef8(true);
  const apiCall = useCallback13(async (url, options2) => {
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
      return { success: true, data: result.data };
    } catch (err) {
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
  VERSION,
  contextDetector,
  createContextDetector,
  emitSAMFormData,
  getCapabilities,
  hasCapability,
  useAgentic,
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
  useSAMPageContext,
  useSAMPageLinks,
  useSAMPracticeProblems,
  useSAMSocraticDialogue
};
