"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  SAMContext: () => SAMContext,
  SAMProvider: () => SAMProvider,
  SAM_FORM_DATA_EVENT: () => SAM_FORM_DATA_EVENT,
  TutoringOrchestrationProvider: () => TutoringOrchestrationProvider,
  VERSION: () => VERSION,
  contextDetector: () => contextDetector,
  createContextDetector: () => createContextDetector,
  emitSAMFormData: () => emitSAMFormData,
  getCapabilities: () => getCapabilities,
  hasCapability: () => hasCapability,
  useAgentic: () => useAgentic,
  useBehaviorPatterns: () => useBehaviorPatterns,
  useContextGathering: () => useContextGathering,
  useContextMemorySync: () => useContextMemorySync,
  useCurrentStep: () => useCurrentStep,
  useExamEngine: () => useExamEngine,
  useInnovationFeatures: () => useInnovationFeatures,
  useInterventions: () => useInterventions,
  useMultimodal: () => useMultimodal,
  useNotifications: () => useNotifications,
  usePresence: () => usePresence,
  usePushNotifications: () => usePushNotifications,
  useQuestionBank: () => useQuestionBank,
  useRealtime: () => useRealtime,
  useRecommendations: () => useRecommendations,
  useSAM: () => useSAM,
  useSAMActions: () => useSAMActions,
  useSAMAdaptiveContent: () => useSAMAdaptiveContent,
  useSAMAnalysis: () => useSAMAnalysis,
  useSAMAutoContext: () => useSAMAutoContext,
  useSAMChat: () => useSAMChat,
  useSAMContext: () => useSAMContext,
  useSAMForm: () => useSAMForm,
  useSAMFormAutoDetect: () => useSAMFormAutoDetect,
  useSAMFormAutoFill: () => useSAMFormAutoFill,
  useSAMFormDataEvents: () => useSAMFormDataEvents,
  useSAMFormDataSync: () => useSAMFormDataSync,
  useSAMFormSync: () => useSAMFormSync,
  useSAMMemory: () => useSAMMemory,
  useSAMPageContext: () => useSAMPageContext,
  useSAMPageLinks: () => useSAMPageLinks,
  useSAMPracticeProblems: () => useSAMPracticeProblems,
  useSAMSocraticDialogue: () => useSAMSocraticDialogue,
  useStepCelebration: () => useStepCelebration,
  useStepProgress: () => useStepProgress,
  useTutoringOrchestration: () => useTutoringOrchestration,
  useTutoringOrchestrationContext: () => useTutoringOrchestrationContext
});
module.exports = __toCommonJS(index_exports);

// src/context/SAMContext.tsx
var import_react = require("react");
var import_core = require("@sam-ai/core");
var import_jsx_runtime = require("react/jsx-runtime");
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
        isProcessing: false,
        isStreaming: false,
        error: null,
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
var SAMContext = (0, import_react.createContext)(null);
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
  const initialState2 = (0, import_react.useMemo)(
    () => ({
      context: (0, import_core.createDefaultContext)(initialContext),
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
  const [state, dispatch] = (0, import_react.useReducer)(samReducer, initialState2);
  const { orchestrator, stateMachine } = (0, import_react.useMemo)(() => {
    const sm = (0, import_core.createStateMachine)();
    if (transport === "api") {
      return { orchestrator: null, stateMachine: sm };
    }
    if (!config) {
      throw new Error("SAMProvider requires a config when using orchestrator transport");
    }
    const orch = (0, import_core.createOrchestrator)(config);
    orch.registerEngine((0, import_core.createContextEngine)(config));
    orch.registerEngine((0, import_core.createContentEngine)(config));
    orch.registerEngine((0, import_core.createAssessmentEngine)(config));
    orch.registerEngine((0, import_core.createPersonalizationEngine)(config));
    orch.registerEngine((0, import_core.createResponseEngine)(config));
    return { orchestrator: orch, stateMachine: sm };
  }, [config, transport]);
  const isInitializedRef = (0, import_react.useRef)(false);
  const contextRef = (0, import_react.useRef)(state.context);
  contextRef.current = state.context;
  (0, import_react.useEffect)(() => {
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
  const pageContextRef = (0, import_react.useRef)(state.context.page);
  pageContextRef.current = state.context.page;
  (0, import_react.useEffect)(() => {
    if (autoDetectContext && typeof window !== "undefined") {
      const path = window.location.pathname;
      const detectedContext = detectContextFromPath(path);
      dispatch({
        type: "UPDATE_CONTEXT",
        payload: { page: { ...pageContextRef.current, ...detectedContext } }
      });
      if (debug) {
        console.log("[SAM] Auto-detected context:", detectedContext);
      }
    }
  }, [autoDetectContext, debug]);
  const apiOptions = transport === "api" ? api : void 0;
  const buildApiRequest = (0, import_react.useCallback)(
    (message, context, history2) => {
      if (apiOptions?.buildRequest) {
        return apiOptions.buildRequest({ message, context, history: history2 });
      }
      return { message, context, history: history2 };
    },
    [apiOptions]
  );
  const parseApiResponse = (0, import_react.useCallback)(
    (payload) => {
      if (apiOptions?.parseResponse) {
        return apiOptions.parseResponse(payload);
      }
      return defaultParseResponse(payload);
    },
    [apiOptions]
  );
  const buildResultFromApi = (0, import_react.useCallback)(
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
  const sendMessageViaFetch = (0, import_react.useCallback)(
    async (content) => {
      if (!apiOptions?.endpoint) {
        return null;
      }
      try {
        dispatch({ type: "SET_PROCESSING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        const history2 = state.context.conversation.messages;
        const requestBody = buildApiRequest(content, state.context, history2);
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
  const sendMessageViaStream = (0, import_react.useCallback)(
    async (content) => {
      if (!apiOptions?.streamEndpoint) {
        return null;
      }
      try {
        dispatch({ type: "SET_PROCESSING", payload: true });
        dispatch({ type: "SET_STREAMING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        const history2 = state.context.conversation.messages;
        const requestBody = buildApiRequest(content, state.context, history2);
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
        const completedStages = [];
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
              case "content-replace": {
                const replacementText = toRecord(payload)?.text;
                if (typeof replacementText === "string") {
                  assistantContent = replacementText;
                  updateAssistantContent();
                }
                break;
              }
              case "tool-execution": {
                const toolData = toRecord(payload);
                if (toolData?.toolId) {
                  const existingAgentic = insights ? toRecord(insights)?.agentic : void 0;
                  insights = {
                    ...insights ?? {},
                    agentic: {
                      ...existingAgentic ?? {},
                      toolExecution: {
                        toolId: toolData.toolId,
                        toolName: toolData.toolName,
                        status: toolData.status,
                        result: toolData.result
                      }
                    }
                  };
                }
                break;
              }
              case "stage-complete": {
                const stageData = toRecord(payload);
                const stageName = stageData?.stage;
                if (typeof stageName === "string") {
                  completedStages.push(stageName);
                }
                if (stageData?.data && typeof stageData.data === "object") {
                  insights = { ...insights ?? {}, ...stageData.data };
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
          metadata: {
            ...metadata ?? {},
            ...completedStages.length > 0 ? { completedStages } : {}
          }
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
  const sendMessageViaApi = (0, import_react.useCallback)(
    async (content) => {
      if (apiOptions?.streamEndpoint) {
        return sendMessageViaStream(content);
      }
      return sendMessageViaFetch(content);
    },
    [apiOptions?.streamEndpoint, sendMessageViaFetch, sendMessageViaStream]
  );
  const open = (0, import_react.useCallback)(() => {
    dispatch({ type: "SET_OPEN", payload: true });
    stateMachine.send({ type: "OPEN" });
  }, [stateMachine]);
  const close = (0, import_react.useCallback)(() => {
    dispatch({ type: "SET_OPEN", payload: false });
    stateMachine.send({ type: "CLOSE" });
  }, [stateMachine]);
  const toggle = (0, import_react.useCallback)(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, open, close]);
  const sendMessage = (0, import_react.useCallback)(
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
  const clearMessages = (0, import_react.useCallback)(() => {
    dispatch({ type: "CLEAR_MESSAGES" });
  }, []);
  const clearError = (0, import_react.useCallback)(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);
  const updateContext = (0, import_react.useCallback)((updates) => {
    dispatch({ type: "UPDATE_CONTEXT", payload: updates });
  }, []);
  const updatePage = (0, import_react.useCallback)((page) => {
    dispatch({ type: "UPDATE_CONTEXT", payload: { page: { ...contextRef.current.page, ...page } } });
  }, []);
  const updateForm = (0, import_react.useCallback)((fields) => {
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
  const analyze = (0, import_react.useCallback)(
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
  const getBloomsAnalysis = (0, import_react.useCallback)(() => {
    if (!state.lastResult?.results?.blooms?.success) {
      return null;
    }
    return state.lastResult.results.blooms.data?.analysis ?? null;
  }, [state.lastResult]);
  const executeAction = (0, import_react.useCallback)(
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
  const suggestions = (0, import_react.useMemo)(() => {
    return state.lastResult?.response.suggestions ?? [];
  }, [state.lastResult]);
  const actions = (0, import_react.useMemo)(() => {
    return state.lastResult?.response.actions ?? [];
  }, [state.lastResult]);
  const contextValue = (0, import_react.useMemo)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SAMContext.Provider, { value: contextValue, children });
}
function useSAMContext() {
  const context = (0, import_react.useContext)(SAMContext);
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
var import_react2 = require("react");
function useSAMActions() {
  const { lastResult, executeAction: contextExecuteAction } = useSAMContext();
  const [isExecuting, setIsExecuting] = (0, import_react2.useState)(false);
  const [lastActionResult, setLastActionResult] = (0, import_react2.useState)(null);
  const actions = lastResult?.response.actions ?? [];
  const executeAction = (0, import_react2.useCallback)(
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
var import_react3 = require("react");
function useSAMPageContext() {
  const { context, updateContext, updatePage } = useSAMContext();
  const updateUser = (0, import_react3.useCallback)(
    (user) => {
      updateContext({ user: { ...context.user, ...user } });
    },
    [context.user, updateContext]
  );
  const detectPageContext2 = (0, import_react3.useCallback)(() => {
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
    detectPageContext: detectPageContext2
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
        capabilities: getCapabilitiesForType(type),
        breadcrumb: buildBreadcrumbsFromPath(path),
        ...extracted
      };
    }
  }
  return {
    type: "other",
    path,
    capabilities: getCapabilitiesForType("other"),
    breadcrumb: buildBreadcrumbsFromPath(path)
  };
}
function getCapabilitiesForType(pageType) {
  const capabilities = {
    "courses-list": ["view-courses", "create-course", "search-courses"],
    "course-detail": ["edit-course", "add-chapters", "generate-content", "publish-course"],
    "chapter-detail": ["edit-chapter", "add-sections", "generate-content", "publish-chapter"],
    "section-detail": ["edit-section", "add-content", "add-video", "add-quiz", "generate-content"],
    "course-create": ["create-course", "use-template", "ai-suggestions"],
    "dashboard": ["view-overview", "quick-actions"],
    "user-dashboard": ["view-overview", "quick-actions"],
    "admin-dashboard": ["view-overview", "manage-users", "system-settings"],
    "user-analytics": ["view-metrics", "export-data"],
    "analytics": ["view-metrics", "export-data"],
    "teacher-dashboard": ["view-overview", "manage-courses"],
    "course-learning": ["view-content", "ask-questions", "take-quiz"],
    "chapter-learning": ["view-content", "ask-questions", "take-quiz"],
    "section-learning": ["view-content", "ask-questions", "take-quiz"],
    "exam": ["take-exam", "view-instructions"],
    "exam-results": ["view-results", "review-answers"],
    "settings": ["update-profile", "change-preferences"],
    "other": ["general-help", "navigation"]
  };
  return capabilities[pageType] || capabilities.other;
}
function buildBreadcrumbsFromPath(path) {
  const segments = path.split("/").filter(Boolean);
  const breadcrumbs = [];
  for (const segment of segments) {
    if (/^[a-f0-9-]{8,}$/i.test(segment)) continue;
    const formatted = segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    breadcrumbs.push(formatted);
  }
  return breadcrumbs;
}
function useSAMAutoContext(enabled = true) {
  const { detectPageContext: detectPageContext2 } = useSAMPageContext();
  (0, import_react3.useEffect)(() => {
    if (!enabled || typeof window === "undefined") return;
    detectPageContext2();
    const handleRouteChange = () => {
      detectPageContext2();
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
  }, [enabled, detectPageContext2]);
}

// src/hooks/useSAMAnalysis.ts
var import_react4 = require("react");
function useSAMAnalysis() {
  const { analyze: contextAnalyze, lastResult, getBloomsAnalysis } = useSAMContext();
  const [isAnalyzing, setIsAnalyzing] = (0, import_react4.useState)(false);
  const [lastAnalysis, setLastAnalysis] = (0, import_react4.useState)(null);
  const analyze = (0, import_react4.useCallback)(
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
var import_react5 = require("react");
function useSAMForm() {
  const { context, updateForm, orchestrator } = useSAMContext();
  const [fields, setFields] = (0, import_react5.useState)(
    context.form?.fields ?? {}
  );
  (0, import_react5.useEffect)(() => {
    if (context.form?.fields) {
      setFields(context.form.fields);
    }
  }, [context.form?.fields]);
  const updateFields = (0, import_react5.useCallback)(
    (newFields) => {
      setFields(newFields);
      updateForm(newFields);
    },
    [updateForm]
  );
  const syncFormToSAM = (0, import_react5.useCallback)(
    (formElement) => {
      const formFields = extractFormFields(formElement);
      updateFields(formFields);
    },
    [updateFields]
  );
  const autoFillField = (0, import_react5.useCallback)(
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
  const getFieldSuggestions = (0, import_react5.useCallback)(
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
  const debounceRef = (0, import_react5.useRef)(void 0);
  (0, import_react5.useEffect)(() => {
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
var import_react6 = require("react");
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
  const [links, setLinks] = (0, import_react6.useState)([]);
  const optionsRef = (0, import_react6.useRef)(options);
  optionsRef.current = options;
  const contextRef = (0, import_react6.useRef)(context);
  contextRef.current = context;
  const updatePageRef = (0, import_react6.useRef)(updatePage);
  updatePageRef.current = updatePage;
  const refresh = (0, import_react6.useCallback)(() => {
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
  (0, import_react6.useEffect)(() => {
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
var import_react7 = require("react");
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
  const latestOptionsRef = (0, import_react7.useRef)(options);
  latestOptionsRef.current = options;
  const contextRef = (0, import_react7.useRef)(context);
  contextRef.current = context;
  const updateContextRef = (0, import_react7.useRef)(updateContext);
  updateContextRef.current = updateContext;
  const formDataRef = (0, import_react7.useRef)(formData);
  formDataRef.current = formData;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const serializedData = (0, import_react7.useMemo)(() => JSON.stringify(formData), [formData]);
  const serializedOptions = (0, import_react7.useMemo)(() => JSON.stringify({
    enabled: options.enabled,
    formName: options.formName,
    formType: options.formType,
    isDirty: options.isDirty,
    isValid: options.isValid,
    maxDepth: options.maxDepth
  }), [options.enabled, options.formName, options.formType, options.isDirty, options.isValid, options.maxDepth]);
  const sync = (0, import_react7.useCallback)(() => {
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
  (0, import_react7.useEffect)(() => {
    if (options.debounceMs && options.debounceMs > 0) {
      const timeoutId = setTimeout(sync, options.debounceMs);
      return () => clearTimeout(timeoutId);
    }
    sync();
  }, [serializedData, serializedOptions, options.debounceMs, sync]);
  return { sync };
}

// src/hooks/useSAMFormDataEvents.ts
var import_react8 = require("react");

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
  const [payload, setPayload] = (0, import_react8.useState)(null);
  (0, import_react8.useEffect)(() => {
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
  const syncOptions = (0, import_react8.useMemo)(() => {
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
var import_react9 = require("react");
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
  const [formContext, setFormContext] = (0, import_react9.useState)(null);
  const optionsRef = (0, import_react9.useRef)(options);
  optionsRef.current = options;
  const contextFormRef = (0, import_react9.useRef)(context.form);
  contextFormRef.current = context.form;
  const updateContextRef = (0, import_react9.useRef)(updateContext);
  updateContextRef.current = updateContext;
  const lastSyncedFormIdRef = (0, import_react9.useRef)(null);
  const detectAndSync = (0, import_react9.useCallback)(() => {
    const opts = optionsRef.current;
    if (opts.enabled === false) return;
    if (typeof document === "undefined") return;
    const selector = opts.selector ?? "form";
    const forms = Array.from(document.querySelectorAll(selector));
    if (!forms.length) return;
    const primaryForm = detectPrimaryForm(forms, opts.preferFocused !== false);
    if (!primaryForm) return;
    const fields = extractFormFields2(primaryForm, opts);
    const nextContext = buildFormContext2(primaryForm, fields, opts);
    const fieldsKey = Object.entries(fields).map(([k, v]) => `${k}:${String(v.value ?? "")}`).join("|");
    const syncKey = `${nextContext.formId}::${fieldsKey}`;
    if (lastSyncedFormIdRef.current === syncKey) return;
    lastSyncedFormIdRef.current = syncKey;
    setFormContext(nextContext);
    const currentForm = contextFormRef.current;
    const shouldUpdate = opts.overrideExisting || !currentForm || currentForm.formId === nextContext.formId;
    if (shouldUpdate) {
      updateContextRef.current({ form: nextContext });
    }
  }, []);
  (0, import_react9.useEffect)(() => {
    if (optionsRef.current.enabled === false) return;
    if (typeof document === "undefined") return;
    let timeoutId = null;
    const debounceMs = optionsRef.current.debounceMs ?? 300;
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
  }, [detectAndSync]);
  const enabledRef = (0, import_react9.useRef)(options.enabled);
  (0, import_react9.useEffect)(() => {
    if (enabledRef.current !== options.enabled) {
      enabledRef.current = options.enabled;
      if (options.enabled) {
        detectAndSync();
      }
    }
  }, [options.enabled, detectAndSync]);
  return { formContext, refresh: detectAndSync };
}

// src/hooks/useSAMFormAutoFill.ts
var import_react10 = require("react");
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
  const resolveField = (0, import_react10.useCallback)(
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
  const fillField = (0, import_react10.useCallback)(
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
var import_react11 = require("react");
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
  const [problems, setProblems] = (0, import_react11.useState)([]);
  const [currentIndex, setCurrentIndex] = (0, import_react11.useState)(0);
  const [isGenerating, setIsGenerating] = (0, import_react11.useState)(false);
  const [isEvaluating, setIsEvaluating] = (0, import_react11.useState)(false);
  const [lastEvaluation, setLastEvaluation] = (0, import_react11.useState)(null);
  const [sessionStats, setSessionStats] = (0, import_react11.useState)(null);
  const [difficultyRecommendation, setDifficultyRecommendation] = (0, import_react11.useState)(null);
  const [error, setError] = (0, import_react11.useState)(null);
  const [hintsUsed, setHintsUsed] = (0, import_react11.useState)([]);
  const sessionIdRef = (0, import_react11.useRef)(`session_${Date.now()}`);
  const currentProblem = problems[currentIndex] || null;
  const generateProblems = (0, import_react11.useCallback)(
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
  const submitAnswer = (0, import_react11.useCallback)(
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
  const getNextHint = (0, import_react11.useCallback)(() => {
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
  const nextProblem = (0, import_react11.useCallback)(() => {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setHintsUsed([]);
      setLastEvaluation(null);
    }
  }, [currentIndex, problems.length]);
  const previousProblem = (0, import_react11.useCallback)(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setHintsUsed([]);
      setLastEvaluation(null);
    }
  }, [currentIndex]);
  const goToProblem = (0, import_react11.useCallback)(
    (index) => {
      if (index >= 0 && index < problems.length) {
        setCurrentIndex(index);
        setHintsUsed([]);
        setLastEvaluation(null);
      }
    },
    [problems.length]
  );
  const skipProblem = (0, import_react11.useCallback)(() => {
    nextProblem();
  }, [nextProblem]);
  const resetSession = (0, import_react11.useCallback)(() => {
    setProblems([]);
    setCurrentIndex(0);
    setHintsUsed([]);
    setLastEvaluation(null);
    setSessionStats(null);
    setError(null);
    sessionIdRef.current = `session_${Date.now()}`;
  }, []);
  const getRecommendedDifficulty = (0, import_react11.useCallback)(async () => {
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
  const getReviewProblems = (0, import_react11.useCallback)(async () => {
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
var import_react12 = require("react");
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
  const [learnerProfile, setLearnerProfile] = (0, import_react12.useState)(null);
  const [isLoadingProfile, setIsLoadingProfile] = (0, import_react12.useState)(false);
  const [isAdapting, setIsAdapting] = (0, import_react12.useState)(false);
  const [adaptedContent, setAdaptedContent] = (0, import_react12.useState)(null);
  const [styleDetection, setStyleDetection] = (0, import_react12.useState)(null);
  const [error, setError] = (0, import_react12.useState)(null);
  const cacheKey = userId ? `${CACHE_KEY_PREFIX}${userId}` : null;
  const hasTriedAutoDetect = (0, import_react12.useRef)(false);
  (0, import_react12.useEffect)(() => {
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
  const getProfile = (0, import_react12.useCallback)(async () => {
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
  const detectStyle = (0, import_react12.useCallback)(async () => {
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
  (0, import_react12.useEffect)(() => {
    if (!userId || !autoDetectStyle || hasTriedAutoDetect.current || learnerProfile) return;
    hasTriedAutoDetect.current = true;
    detectStyle();
  }, [userId, autoDetectStyle, learnerProfile, detectStyle]);
  const adaptContent = (0, import_react12.useCallback)(
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
  const recordInteraction = (0, import_react12.useCallback)(
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
  const getRecommendations = (0, import_react12.useCallback)(
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
  const getStyleTips = (0, import_react12.useCallback)(() => {
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
  const updateProfile = (0, import_react12.useCallback)(
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
  const clearProfile = (0, import_react12.useCallback)(() => {
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
var import_react13 = require("react");
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
  const [dialogue, setDialogue] = (0, import_react13.useState)(null);
  const [currentQuestion, setCurrentQuestion] = (0, import_react13.useState)(null);
  const [dialogueState, setDialogueState] = (0, import_react13.useState)(null);
  const [isWaiting, setIsWaiting] = (0, import_react13.useState)(false);
  const [lastResponse, setLastResponse] = (0, import_react13.useState)(null);
  const [discoveredInsights, setDiscoveredInsights] = (0, import_react13.useState)([]);
  const [progress, setProgress] = (0, import_react13.useState)(0);
  const [feedback, setFeedback] = (0, import_react13.useState)(null);
  const [encouragement, setEncouragement] = (0, import_react13.useState)(null);
  const [availableHints, setAvailableHints] = (0, import_react13.useState)([]);
  const [error, setError] = (0, import_react13.useState)(null);
  const currentHintIndexRef = (0, import_react13.useRef)(0);
  const previousInsightsRef = (0, import_react13.useRef)([]);
  const isActive = dialogue !== null && dialogueState !== "conclusion";
  const isComplete = dialogueState === "conclusion";
  const startDialogue = (0, import_react13.useCallback)(
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
  const submitResponse = (0, import_react13.useCallback)(
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
  const requestHint = (0, import_react13.useCallback)(async () => {
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
  const skipQuestion = (0, import_react13.useCallback)(async () => {
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
  const endDialogue = (0, import_react13.useCallback)(async () => {
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
  const getHistory = (0, import_react13.useCallback)(
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
  const resetDialogue = (0, import_react13.useCallback)(() => {
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
var import_react14 = require("react");
function useAgentic(options = {}) {
  const {
    autoFetchGoals = false,
    autoFetchRecommendations = false,
    autoFetchCheckIns = false,
    availableTime = 60,
    recommendationRefreshInterval
  } = options;
  const [goals, setGoals] = (0, import_react14.useState)([]);
  const [plans, setPlans] = (0, import_react14.useState)([]);
  const [recommendations, setRecommendations] = (0, import_react14.useState)(null);
  const [progressReport, setProgressReport] = (0, import_react14.useState)(null);
  const [skills, setSkills] = (0, import_react14.useState)([]);
  const [checkIns, setCheckIns] = (0, import_react14.useState)([]);
  const [error, setError] = (0, import_react14.useState)(null);
  const [isLoadingGoals, setIsLoadingGoals] = (0, import_react14.useState)(autoFetchGoals);
  const [isLoadingPlans, setIsLoadingPlans] = (0, import_react14.useState)(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = (0, import_react14.useState)(autoFetchRecommendations);
  const [isLoadingProgress, setIsLoadingProgress] = (0, import_react14.useState)(false);
  const [isLoadingSkills, setIsLoadingSkills] = (0, import_react14.useState)(false);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = (0, import_react14.useState)(autoFetchCheckIns);
  const mountedRef = (0, import_react14.useRef)(true);
  const apiCall = (0, import_react14.useCallback)(async (url, options2, timeoutMs = 15e3) => {
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
  const fetchGoals = (0, import_react14.useCallback)(async (status) => {
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
  const createGoal = (0, import_react14.useCallback)(async (data) => {
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
  const updateGoal = (0, import_react14.useCallback)(async (goalId, data) => {
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
  const decomposeGoal = (0, import_react14.useCallback)(async (goalId) => {
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
  const deleteGoal = (0, import_react14.useCallback)(async (goalId) => {
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
  const fetchPlans = (0, import_react14.useCallback)(async (goalId) => {
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
  const createPlan = (0, import_react14.useCallback)(async (goalId, dailyMinutes = 30) => {
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
  const startPlan = (0, import_react14.useCallback)(async (planId) => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/start`, {
      method: "POST"
    });
    return result.success;
  }, [apiCall]);
  const pausePlan = (0, import_react14.useCallback)(async (planId) => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/pause`, {
      method: "POST"
    });
    return result.success;
  }, [apiCall]);
  const resumePlan = (0, import_react14.useCallback)(async (planId) => {
    const result = await apiCall(`/api/sam/agentic/plans/${planId}/resume`, {
      method: "POST"
    });
    return result.success;
  }, [apiCall]);
  const fetchRecommendations = (0, import_react14.useCallback)(async (time) => {
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
  const dismissRecommendation = (0, import_react14.useCallback)((recommendationId) => {
    setRecommendations((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        recommendations: prev.recommendations.filter((r) => r.id !== recommendationId)
      };
    });
  }, []);
  const fetchProgressReport = (0, import_react14.useCallback)(async (period = "weekly") => {
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
  const fetchSkillMap = (0, import_react14.useCallback)(async () => {
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
  const fetchCheckIns = (0, import_react14.useCallback)(async (status) => {
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
  const respondToCheckIn = (0, import_react14.useCallback)(async (checkInId, response) => {
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
  const dismissCheckIn = (0, import_react14.useCallback)(async (checkInId) => {
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
  const clearError = (0, import_react14.useCallback)(() => {
    setError(null);
  }, []);
  (0, import_react14.useEffect)(() => {
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
  (0, import_react14.useEffect)(() => {
    if (!recommendationRefreshInterval) return;
    const interval = setInterval(() => {
      fetchRecommendations();
    }, recommendationRefreshInterval);
    return () => clearInterval(interval);
  }, [recommendationRefreshInterval, fetchRecommendations]);
  (0, import_react14.useEffect)(() => {
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
var import_react15 = require("react");
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
  const { url, autoConnect, authToken, userId, sessionId, reconnect, heartbeatInterval } = options;
  const onConnectRef = (0, import_react15.useRef)(options.onConnect);
  onConnectRef.current = options.onConnect;
  const onDisconnectRef = (0, import_react15.useRef)(options.onDisconnect);
  onDisconnectRef.current = options.onDisconnect;
  const onErrorRef = (0, import_react15.useRef)(options.onError);
  onErrorRef.current = options.onError;
  const onMessageRef = (0, import_react15.useRef)(options.onMessage);
  onMessageRef.current = options.onMessage;
  const reconnectEnabled = reconnect?.enabled;
  const reconnectMaxAttempts = reconnect?.maxAttempts;
  const reconnectDelay = reconnect?.delay;
  const opts = (0, import_react15.useMemo)(() => ({
    ...DEFAULT_OPTIONS,
    url: url ?? DEFAULT_OPTIONS.url,
    autoConnect: autoConnect ?? DEFAULT_OPTIONS.autoConnect,
    authToken,
    userId,
    sessionId,
    reconnect: {
      ...DEFAULT_OPTIONS.reconnect,
      enabled: reconnectEnabled ?? DEFAULT_OPTIONS.reconnect.enabled,
      maxAttempts: reconnectMaxAttempts ?? DEFAULT_OPTIONS.reconnect.maxAttempts,
      delay: reconnectDelay ?? DEFAULT_OPTIONS.reconnect.delay
    },
    heartbeatInterval: heartbeatInterval ?? DEFAULT_OPTIONS.heartbeatInterval,
    onConnect: onConnectRef.current,
    onDisconnect: onDisconnectRef.current,
    onError: onErrorRef.current,
    onMessage: onMessageRef.current
  }), [url, autoConnect, authToken, userId, sessionId, reconnectEnabled, reconnectMaxAttempts, reconnectDelay, heartbeatInterval]);
  const [connectionState, setConnectionState] = (0, import_react15.useState)("disconnected");
  const [stats, setStats] = (0, import_react15.useState)(null);
  const [error, setError] = (0, import_react15.useState)(null);
  const wsRef = (0, import_react15.useRef)(null);
  const reconnectAttemptsRef = (0, import_react15.useRef)(0);
  const reconnectTimeoutRef = (0, import_react15.useRef)(null);
  const heartbeatIntervalRef = (0, import_react15.useRef)(null);
  const subscribersRef = (0, import_react15.useRef)(/* @__PURE__ */ new Map());
  const statsRef = (0, import_react15.useRef)({
    connectionId: "",
    connectedAt: /* @__PURE__ */ new Date(),
    lastHeartbeatAt: /* @__PURE__ */ new Date(),
    messagesSent: 0,
    messagesReceived: 0,
    reconnectCount: 0,
    latencyMs: 0
  });
  const sendHeartbeatRef = (0, import_react15.useRef)(() => {
  });
  const connectRef = (0, import_react15.useRef)(() => {
  });
  const disconnectRef = (0, import_react15.useRef)(() => {
  });
  const connectionStateRef = (0, import_react15.useRef)(connectionState);
  connectionStateRef.current = connectionState;
  const generateEventId = (0, import_react15.useCallback)(() => {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);
  const notifySubscribers = (0, import_react15.useCallback)((event) => {
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
  const sendMessage = (0, import_react15.useCallback)((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      statsRef.current.messagesSent++;
      setStats({ ...statsRef.current });
    }
  }, []);
  const connect = (0, import_react15.useCallback)(() => {
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
          sendHeartbeatRef.current();
        }, opts.heartbeatInterval);
      };
      ws.onclose = (event) => {
        setConnectionState("disconnected");
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        onDisconnectRef.current?.(event.reason || "Connection closed");
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
        onErrorRef.current?.(err);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          statsRef.current.messagesReceived++;
          statsRef.current.lastHeartbeatAt = /* @__PURE__ */ new Date();
          setStats({ ...statsRef.current });
          if (data.type === "connected") {
            statsRef.current.connectionId = data.payload.connectionId;
            onConnectRef.current?.(data);
          }
          onMessageRef.current?.(data);
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
  connectRef.current = connect;
  const disconnect = (0, import_react15.useCallback)(() => {
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
  disconnectRef.current = disconnect;
  const send = (0, import_react15.useCallback)((type, payload) => {
    sendMessage({
      type,
      payload,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      eventId: generateEventId(),
      userId: opts.userId,
      sessionId: opts.sessionId
    });
  }, [sendMessage, generateEventId, opts.userId, opts.sessionId]);
  const subscribe = (0, import_react15.useCallback)((eventType, callback) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, /* @__PURE__ */ new Set());
    }
    subscribersRef.current.get(eventType).add(callback);
    return () => {
      subscribersRef.current.get(eventType)?.delete(callback);
    };
  }, []);
  const sendActivity = (0, import_react15.useCallback)((activity) => {
    send("activity", activity);
  }, [send]);
  const sendHeartbeat = (0, import_react15.useCallback)(() => {
    send("heartbeat", {
      status: "alive",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      connectionId: statsRef.current.connectionId
    });
  }, [send]);
  sendHeartbeatRef.current = sendHeartbeat;
  const acknowledge = (0, import_react15.useCallback)((eventId, action) => {
    send("acknowledge", {
      eventId,
      received: true,
      action
    });
  }, [send]);
  const dismiss = (0, import_react15.useCallback)((eventId, reason) => {
    send("dismiss", {
      eventId,
      reason: reason || "user_action"
    });
  }, [send]);
  (0, import_react15.useEffect)(() => {
    if (opts.autoConnect) {
      connectRef.current();
    }
    return () => {
      disconnectRef.current();
    };
  }, [opts.autoConnect]);
  (0, import_react15.useEffect)(() => {
    if (connectionStateRef.current === "connected" && (opts.authToken || opts.userId)) {
      disconnectRef.current();
      connectRef.current();
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
var import_react16 = require("react");
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
  const onIdleRef = (0, import_react16.useRef)(options.onIdle);
  onIdleRef.current = options.onIdle;
  const onAwayRef = (0, import_react16.useRef)(options.onAway);
  onAwayRef.current = options.onAway;
  const onActiveRef = (0, import_react16.useRef)(options.onActive);
  onActiveRef.current = options.onActive;
  const sendActivityRef = (0, import_react16.useRef)(options.sendActivity);
  sendActivityRef.current = options.sendActivity;
  const onStatusChangeRef = (0, import_react16.useRef)(options.onStatusChange);
  onStatusChangeRef.current = options.onStatusChange;
  const opts = (0, import_react16.useMemo)(
    () => ({
      userId: options.userId,
      sessionId: options.sessionId ?? DEFAULT_OPTIONS2.sessionId,
      initialStatus: options.initialStatus ?? DEFAULT_OPTIONS2.initialStatus,
      trackVisibility: options.trackVisibility ?? DEFAULT_OPTIONS2.trackVisibility,
      trackActivity: options.trackActivity ?? DEFAULT_OPTIONS2.trackActivity,
      idleTimeout: options.idleTimeout ?? DEFAULT_OPTIONS2.idleTimeout,
      awayTimeout: options.awayTimeout ?? DEFAULT_OPTIONS2.awayTimeout,
      activityDebounce: options.activityDebounce ?? DEFAULT_OPTIONS2.activityDebounce
    }),
    [
      options.userId,
      options.sessionId,
      options.idleTimeout,
      options.awayTimeout,
      options.trackActivity,
      options.trackVisibility,
      options.initialStatus,
      options.activityDebounce
    ]
  );
  const [status, setStatusState] = (0, import_react16.useState)(opts.initialStatus);
  const [lastActivityAt, setLastActivityAt] = (0, import_react16.useState)(/* @__PURE__ */ new Date());
  const [metadata, setMetadata] = (0, import_react16.useState)(() => ({
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS()
  }));
  const idleTimeoutRef = (0, import_react16.useRef)(null);
  const awayTimeoutRef = (0, import_react16.useRef)(null);
  const activityDebounceRef = (0, import_react16.useRef)(null);
  const previousStatusRef = (0, import_react16.useRef)(opts.initialStatus);
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
  const clearTimers = (0, import_react16.useCallback)(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
      awayTimeoutRef.current = null;
    }
  }, []);
  const resetTimers = (0, import_react16.useCallback)(() => {
    clearTimers();
    idleTimeoutRef.current = setTimeout(() => {
      if (previousStatusRef.current === "online" || previousStatusRef.current === "studying") {
        setStatusState("idle");
        onIdleRef.current?.();
      }
    }, opts.idleTimeout);
    awayTimeoutRef.current = setTimeout(() => {
      if (previousStatusRef.current !== "offline" && previousStatusRef.current !== "do_not_disturb") {
        setStatusState("away");
        onAwayRef.current?.();
      }
    }, opts.awayTimeout);
  }, [clearTimers, opts.idleTimeout, opts.awayTimeout]);
  const setStatus = (0, import_react16.useCallback)(
    (newStatus) => {
      const prevStatus = previousStatusRef.current;
      if (newStatus !== prevStatus) {
        previousStatusRef.current = newStatus;
        setStatusState(newStatus);
        onStatusChangeRef.current?.(newStatus, prevStatus);
        sendActivityRef.current?.({
          type: "interaction",
          data: { statusChange: { from: prevStatus, to: newStatus } }
        });
      }
    },
    []
  );
  const statusRef = (0, import_react16.useRef)(status);
  statusRef.current = status;
  const recordActivity = (0, import_react16.useCallback)(
    (type = "interaction") => {
      if (activityDebounceRef.current) {
        return;
      }
      activityDebounceRef.current = setTimeout(() => {
        activityDebounceRef.current = null;
      }, opts.activityDebounce);
      setLastActivityAt(/* @__PURE__ */ new Date());
      if (statusRef.current === "idle" || statusRef.current === "away") {
        setStatus("online");
        onActiveRef.current?.();
      }
      resetTimers();
      sendActivityRef.current?.({
        type,
        data: { timestamp: (/* @__PURE__ */ new Date()).toISOString() },
        pageContext: typeof window !== "undefined" ? { url: window.location.href } : void 0
      });
    },
    [opts.activityDebounce, setStatus, resetTimers]
  );
  const updateMetadata = (0, import_react16.useCallback)((updates) => {
    setMetadata((prev) => prev ? { ...prev, ...updates } : null);
  }, []);
  (0, import_react16.useEffect)(() => {
    if (!opts.trackVisibility || typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recordActivity("focus");
      } else {
        sendActivityRef.current?.({
          type: "blur",
          data: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [opts.trackVisibility, recordActivity]);
  (0, import_react16.useEffect)(() => {
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
var import_react17 = require("react");
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
  const onInterventionRef = (0, import_react17.useRef)(options.onIntervention);
  onInterventionRef.current = options.onIntervention;
  const acknowledgeRef = (0, import_react17.useRef)(options.acknowledge);
  acknowledgeRef.current = options.acknowledge;
  const onDismissRef = (0, import_react17.useRef)(options.onDismiss);
  onDismissRef.current = options.onDismiss;
  const dismissEventRef = (0, import_react17.useRef)(options.dismissEvent);
  dismissEventRef.current = options.dismissEvent;
  const onActionRef = (0, import_react17.useRef)(options.onAction);
  onActionRef.current = options.onAction;
  const opts = (0, import_react17.useMemo)(
    () => ({
      ...DEFAULT_OPTIONS3,
      defaultSurface: options.defaultSurface ?? DEFAULT_OPTIONS3.defaultSurface,
      autoDismissMs: options.autoDismissMs ?? DEFAULT_OPTIONS3.autoDismissMs,
      maxVisible: options.maxVisible ?? DEFAULT_OPTIONS3.maxVisible,
      enableSound: options.enableSound ?? DEFAULT_OPTIONS3.enableSound
    }),
    [
      options.defaultSurface,
      options.autoDismissMs,
      options.maxVisible,
      options.enableSound
    ]
  );
  const [interventions, setInterventions] = (0, import_react17.useState)(/* @__PURE__ */ new Map());
  const [visibleIds, setVisibleIds] = (0, import_react17.useState)(/* @__PURE__ */ new Set());
  const [latestNudge, setLatestNudge] = (0, import_react17.useState)(null);
  const [latestCelebration, setLatestCelebration] = (0, import_react17.useState)(null);
  const [latestRecommendation, setLatestRecommendation] = (0, import_react17.useState)(null);
  const [latestGoalProgress, setLatestGoalProgress] = (0, import_react17.useState)(null);
  const [latestStepCompletion, setLatestStepCompletion] = (0, import_react17.useState)(null);
  const dismissTimersRef = (0, import_react17.useRef)(/* @__PURE__ */ new Map());
  const dismissRef = (0, import_react17.useRef)(() => {
  });
  const generateId = (0, import_react17.useCallback)(() => {
    return `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);
  const getDisplayConfig = (0, import_react17.useCallback)(
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
  const add = (0, import_react17.useCallback)(
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
              dismissRef.current(id, "timeout");
            }, displayConfig.duration);
            dismissTimersRef.current.set(id, timer);
          }
          return next;
        }
        return prev;
      });
      onInterventionRef.current?.(intervention);
      acknowledgeRef.current?.(id, "viewed");
    },
    [generateId, getDisplayConfig, opts]
  );
  const dismiss = (0, import_react17.useCallback)(
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
      onDismissRef.current?.(interventionId, reason);
      dismissEventRef.current?.(interventionId, reason);
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
    [opts.maxVisible]
  );
  dismissRef.current = dismiss;
  const dismissAll = (0, import_react17.useCallback)(() => {
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
  const markViewed = (0, import_react17.useCallback)(
    (interventionId) => {
      setInterventions((prev) => {
        const next = new Map(prev);
        const int = next.get(interventionId);
        if (int && !int.interactedAt) {
          next.set(interventionId, { ...int, interactedAt: /* @__PURE__ */ new Date() });
        }
        return next;
      });
      acknowledgeRef.current?.(interventionId, "viewed");
    },
    []
  );
  const triggerAction = (0, import_react17.useCallback)(
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
      onActionRef.current?.(interventionId, action);
      acknowledgeRef.current?.(interventionId, "clicked");
    },
    []
  );
  const hasVisible = (0, import_react17.useCallback)(
    (type) => {
      return Array.from(interventions.values()).some((i) => i.visible && i.event.type === type);
    },
    [interventions]
  );
  const get = (0, import_react17.useCallback)(
    (interventionId) => {
      return interventions.get(interventionId);
    },
    [interventions]
  );
  (0, import_react17.useEffect)(() => {
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
var import_react18 = require("react");
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
  const onPermissionChangeRef = (0, import_react18.useRef)(options.onPermissionChange);
  onPermissionChangeRef.current = options.onPermissionChange;
  const onSubscriptionChangeRef = (0, import_react18.useRef)(options.onSubscriptionChange);
  onSubscriptionChangeRef.current = options.onSubscriptionChange;
  const onSubscribeRef = (0, import_react18.useRef)(options.onSubscribe);
  onSubscribeRef.current = options.onSubscribe;
  const onUnsubscribeRef = (0, import_react18.useRef)(options.onUnsubscribe);
  onUnsubscribeRef.current = options.onUnsubscribe;
  const onNotificationClickRef = (0, import_react18.useRef)(options.onNotificationClick);
  onNotificationClickRef.current = options.onNotificationClick;
  const onNotificationCloseRef = (0, import_react18.useRef)(options.onNotificationClose);
  onNotificationCloseRef.current = options.onNotificationClose;
  const onErrorRef = (0, import_react18.useRef)(options.onError);
  onErrorRef.current = options.onError;
  const {
    serviceWorkerPath,
    vapidPublicKey,
    applicationServerKey,
    autoRequestOnMount,
    autoRequest
  } = options;
  const opts = (0, import_react18.useMemo)(
    () => ({
      ...DEFAULT_OPTIONS4,
      serviceWorkerPath,
      vapidPublicKey,
      applicationServerKey,
      autoRequestOnMount,
      autoRequest
    }),
    [
      serviceWorkerPath,
      vapidPublicKey,
      applicationServerKey,
      autoRequestOnMount,
      autoRequest
    ]
  );
  const [permission, setPermission] = (0, import_react18.useState)("default");
  const [subscription, setSubscription] = (0, import_react18.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react18.useState)(false);
  const swRegistrationRef = (0, import_react18.useRef)(null);
  const isSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  const requestPermission = (0, import_react18.useCallback)(async () => {
    if (!isSupported) {
      return "unsupported";
    }
    try {
      const result = await Notification.requestPermission();
      const state = result;
      setPermission(state);
      onPermissionChangeRef.current?.(state);
      return state;
    } catch (error) {
      onErrorRef.current?.(error instanceof Error ? error : new Error("Permission request failed"));
      return "denied";
    }
  }, [isSupported]);
  const requestPermissionRef = (0, import_react18.useRef)(requestPermission);
  requestPermissionRef.current = requestPermission;
  (0, import_react18.useEffect)(() => {
    if (!isSupported) {
      setPermission("unsupported");
      return;
    }
    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    const init = async () => {
      try {
        const registration = await navigator.serviceWorker.register(opts.serviceWorkerPath || "/sw.js");
        swRegistrationRef.current = registration;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          const subJSON = subscriptionToJSON(existingSub);
          setSubscription(subJSON);
          onSubscriptionChangeRef.current?.(subJSON);
        }
        if (opts.autoRequest && currentPermission === "default") {
          requestPermissionRef.current();
        }
      } catch (error) {
        console.error("[usePushNotifications] Service worker registration failed:", error);
        onErrorRef.current?.(error instanceof Error ? error : new Error("Service worker registration failed"));
      }
    };
    init();
  }, [isSupported, opts.serviceWorkerPath, opts.autoRequest]);
  const subscribe = (0, import_react18.useCallback)(async () => {
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
      onSubscriptionChangeRef.current?.(subJSON);
      return subJSON;
    } catch (error) {
      console.error("[usePushNotifications] Subscribe failed:", error);
      onErrorRef.current?.(error instanceof Error ? error : new Error("Subscribe failed"));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission, opts.vapidPublicKey]);
  const unsubscribe = (0, import_react18.useCallback)(async () => {
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
      onSubscriptionChangeRef.current?.(null);
      return true;
    } catch (error) {
      console.error("[usePushNotifications] Unsubscribe failed:", error);
      onErrorRef.current?.(error instanceof Error ? error : new Error("Unsubscribe failed"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);
  const showNotification = (0, import_react18.useCallback)(
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
          onNotificationClickRef.current?.(notification);
        };
        notification.onclose = () => {
          onNotificationCloseRef.current?.(notification);
        };
        return notification;
      } catch (error) {
        console.error("[usePushNotifications] Show notification failed:", error);
        onErrorRef.current?.(error instanceof Error ? error : new Error("Show notification failed"));
        return null;
      }
    },
    [isSupported, permission]
  );
  const isNotificationVisible = (0, import_react18.useCallback)(
    async (tag) => {
      if (!swRegistrationRef.current) {
        return false;
      }
      const notifications = await swRegistrationRef.current.getNotifications({ tag });
      return notifications.length > 0;
    },
    []
  );
  const closeNotification = (0, import_react18.useCallback)(async (tag) => {
    if (!swRegistrationRef.current) {
      return;
    }
    const notifications = await swRegistrationRef.current.getNotifications({ tag });
    notifications.forEach((notification) => notification.close());
  }, []);
  const registerWithServer = (0, import_react18.useCallback)(
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
        onErrorRef.current?.(error instanceof Error ? error : new Error("Server registration failed"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [subscription]
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
var import_react19 = require("react");
function useSAMMemory(options = {}) {
  const { debug = false } = options;
  const [searchResults, setSearchResults] = (0, import_react19.useState)([]);
  const [conversationHistory, setConversationHistory] = (0, import_react19.useState)([]);
  const [error, setError] = (0, import_react19.useState)(null);
  const [isSearching, setIsSearching] = (0, import_react19.useState)(false);
  const [isStoringMemory, setIsStoringMemory] = (0, import_react19.useState)(false);
  const [isLoadingConversation, setIsLoadingConversation] = (0, import_react19.useState)(false);
  const mountedRef = (0, import_react19.useRef)(true);
  const apiCall = (0, import_react19.useCallback)(
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
  const log = (0, import_react19.useCallback)(
    (message, data) => {
      if (debug) {
        console.log(`[useSAMMemory] ${message}`, data ?? "");
      }
    },
    [debug]
  );
  const searchMemories = (0, import_react19.useCallback)(
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
  const storeMemory = (0, import_react19.useCallback)(
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
  const storeConversation = (0, import_react19.useCallback)(
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
  const getConversationContext = (0, import_react19.useCallback)(
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
  const clearError = (0, import_react19.useCallback)(() => {
    setError(null);
  }, []);
  const clearSearchResults = (0, import_react19.useCallback)(() => {
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
var import_react20 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var initialState = {
  hasActivePlan: false,
  currentStep: null,
  stepProgress: null,
  transition: null,
  pendingConfirmations: [],
  metadata: null
};
function useTutoringOrchestration() {
  const [state, setState] = (0, import_react20.useState)(initialState);
  const updateFromResponse = (0, import_react20.useCallback)(
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
  const clearState = (0, import_react20.useCallback)(() => {
    setState(initialState);
  }, []);
  const hasStepTransition = (0, import_react20.useMemo)(
    () => state.transition !== null,
    [state.transition]
  );
  const isPlanComplete = (0, import_react20.useMemo)(
    () => state.transition?.planComplete ?? false,
    [state.transition]
  );
  const hasPendingConfirmations = (0, import_react20.useMemo)(
    () => state.pendingConfirmations.length > 0,
    [state.pendingConfirmations]
  );
  const currentStepProgress = (0, import_react20.useMemo)(
    () => state.stepProgress?.progressPercent ?? 0,
    [state.stepProgress]
  );
  const shouldShowCelebration = (0, import_react20.useMemo)(
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
  return (0, import_react20.useMemo)(
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
  return (0, import_react20.useMemo)(
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
  return (0, import_react20.useMemo)(
    () => ({
      show: state.transition?.celebration !== null && state.transition !== null,
      celebration: state.transition?.celebration ?? null,
      dismiss: clearState
    }),
    [state.transition, clearState]
  );
}
var TutoringOrchestrationContext = (0, import_react20.createContext)(null);
function TutoringOrchestrationProvider({ children }) {
  const orchestration = useTutoringOrchestration();
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TutoringOrchestrationContext.Provider, { value: orchestration, children });
}
function useTutoringOrchestrationContext() {
  const context = (0, import_react20.useContext)(TutoringOrchestrationContext);
  if (!context) {
    throw new Error(
      "useTutoringOrchestrationContext must be used within TutoringOrchestrationProvider"
    );
  }
  return context;
}

// src/hooks/useNotifications.ts
var import_react21 = require("react");
function useNotifications(options = {}) {
  const {
    type,
    unreadOnly = false,
    limit = 20,
    refreshInterval,
    disabled = false
  } = options;
  const [notifications, setNotifications] = (0, import_react21.useState)([]);
  const [total, setTotal] = (0, import_react21.useState)(0);
  const [unreadCount, setUnreadCount] = (0, import_react21.useState)(0);
  const [isLoading, setIsLoading] = (0, import_react21.useState)(false);
  const [error, setError] = (0, import_react21.useState)(null);
  const [hasMore, setHasMore] = (0, import_react21.useState)(false);
  const offsetRef = (0, import_react21.useRef)(0);
  const fetchNotifications = (0, import_react21.useCallback)(
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
  const markAsRead = (0, import_react21.useCallback)(async (notificationIds) => {
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
  const dismiss = (0, import_react21.useCallback)(
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
  const unreadCountRef = (0, import_react21.useRef)(unreadCount);
  unreadCountRef.current = unreadCount;
  const clearRead = (0, import_react21.useCallback)(async () => {
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
  const isLoadingRef = (0, import_react21.useRef)(isLoading);
  isLoadingRef.current = isLoading;
  const hasMoreRef = (0, import_react21.useRef)(hasMore);
  hasMoreRef.current = hasMore;
  const loadMore = (0, import_react21.useCallback)(async () => {
    if (!hasMoreRef.current || isLoadingRef.current) return;
    await fetchNotifications(false);
  }, [fetchNotifications]);
  const refresh = (0, import_react21.useCallback)(async () => {
    await fetchNotifications(true);
  }, [fetchNotifications]);
  (0, import_react21.useEffect)(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);
  (0, import_react21.useEffect)(() => {
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
var import_react22 = require("react");
function useBehaviorPatterns(options = {}) {
  const { autoFetch = true, refreshInterval } = options;
  const [patterns, setPatterns] = (0, import_react22.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react22.useState)(false);
  const [isDetecting, setIsDetecting] = (0, import_react22.useState)(false);
  const [error, setError] = (0, import_react22.useState)(null);
  const fetchPatterns = (0, import_react22.useCallback)(async () => {
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
  const detectPatterns = (0, import_react22.useCallback)(async () => {
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
  const refresh = (0, import_react22.useCallback)(async () => {
    await fetchPatterns();
  }, [fetchPatterns]);
  (0, import_react22.useEffect)(() => {
    if (autoFetch) {
      fetchPatterns();
    }
  }, [autoFetch, fetchPatterns]);
  (0, import_react22.useEffect)(() => {
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
var import_react23 = require("react");
function useRecommendations(options = {}) {
  const {
    availableTime = 60,
    limit = 5,
    types,
    autoFetch = true,
    refreshInterval
  } = options;
  const [recommendations, setRecommendations] = (0, import_react23.useState)([]);
  const [totalEstimatedTime, setTotalEstimatedTime] = (0, import_react23.useState)(0);
  const [generatedAt, setGeneratedAt] = (0, import_react23.useState)(null);
  const [context, setContext] = (0, import_react23.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react23.useState)(false);
  const [error, setError] = (0, import_react23.useState)(null);
  const typesRef = (0, import_react23.useRef)(types);
  typesRef.current = types;
  const fetchRecommendations = (0, import_react23.useCallback)(
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
  const refresh = (0, import_react23.useCallback)(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);
  (0, import_react23.useEffect)(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
  }, [autoFetch, fetchRecommendations]);
  (0, import_react23.useEffect)(() => {
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
var import_react24 = require("react");
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
  const [isGenerating, setIsGenerating] = (0, import_react24.useState)(false);
  const [isLoading, setIsLoading] = (0, import_react24.useState)(false);
  const [generatedExam, setGeneratedExam] = (0, import_react24.useState)(null);
  const [examWithProfile, setExamWithProfile] = (0, import_react24.useState)(null);
  const [error, setError] = (0, import_react24.useState)(null);
  const optionsRef = (0, import_react24.useRef)(options);
  optionsRef.current = options;
  const generateExam = (0, import_react24.useCallback)(
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
  const getExam = (0, import_react24.useCallback)(
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
  const getDefaultBloomsDistribution = (0, import_react24.useCallback)(() => {
    return { ...DEFAULT_BLOOMS_DISTRIBUTION };
  }, []);
  const getDefaultDifficultyDistribution = (0, import_react24.useCallback)(() => {
    return { ...DEFAULT_DIFFICULTY_DISTRIBUTION };
  }, []);
  const reset = (0, import_react24.useCallback)(() => {
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
var import_react25 = require("react");
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
  const [questions, setQuestions] = (0, import_react25.useState)([]);
  const [stats, setStats] = (0, import_react25.useState)(null);
  const [pagination, setPagination] = (0, import_react25.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react25.useState)(false);
  const [isAdding, setIsAdding] = (0, import_react25.useState)(false);
  const [isUpdating, setIsUpdating] = (0, import_react25.useState)(false);
  const [isDeleting, setIsDeleting] = (0, import_react25.useState)(false);
  const [error, setError] = (0, import_react25.useState)(null);
  const currentQueryRef = (0, import_react25.useRef)({});
  const optionsRef = (0, import_react25.useRef)(options);
  optionsRef.current = options;
  const getQuestions = (0, import_react25.useCallback)(
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
  const addQuestions = (0, import_react25.useCallback)(
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
  const updateQuestion = (0, import_react25.useCallback)(
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
  const deleteQuestion = (0, import_react25.useCallback)(
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
  const loadMore = (0, import_react25.useCallback)(async () => {
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
  const refresh = (0, import_react25.useCallback)(async () => {
    await getQuestions(currentQueryRef.current);
  }, [getQuestions]);
  const reset = (0, import_react25.useCallback)(() => {
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
var import_react26 = require("react");
function useInnovationFeatures(options = {}) {
  const {
    apiEndpoint = "/api/sam/innovation-features",
    autoLoadStatus = false,
    onError
  } = options;
  const [featuresStatus, setFeaturesStatus] = (0, import_react26.useState)(null);
  const [isLoadingStatus, setIsLoadingStatus] = (0, import_react26.useState)(false);
  const [cognitiveFitness, setCognitiveFitness] = (0, import_react26.useState)(null);
  const [isAssessingFitness, setIsAssessingFitness] = (0, import_react26.useState)(false);
  const [learningDNA, setLearningDNA] = (0, import_react26.useState)(null);
  const [dnaVisualization, setDnaVisualization] = (0, import_react26.useState)(null);
  const [isGeneratingDNA, setIsGeneratingDNA] = (0, import_react26.useState)(false);
  const [studyBuddy, setStudyBuddy] = (0, import_react26.useState)(null);
  const [isCreatingBuddy, setIsCreatingBuddy] = (0, import_react26.useState)(false);
  const [isInteracting, setIsInteracting] = (0, import_react26.useState)(false);
  const [quantumPaths, setQuantumPaths] = (0, import_react26.useState)([]);
  const [isCreatingPath, setIsCreatingPath] = (0, import_react26.useState)(false);
  const [error, setError] = (0, import_react26.useState)(null);
  const hasLoadedRef = (0, import_react26.useRef)(false);
  const apiCall = (0, import_react26.useCallback)(
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
  const loadFeaturesStatus = (0, import_react26.useCallback)(async () => {
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
  const assessCognitiveFitness = (0, import_react26.useCallback)(async () => {
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
  const startFitnessExercise = (0, import_react26.useCallback)(
    async (exerciseId) => {
      return apiCall("start-fitness-exercise", { exerciseId });
    },
    [apiCall]
  );
  const completeFitnessExercise = (0, import_react26.useCallback)(
    async (sessionId, performance, duration) => {
      await apiCall("complete-fitness-exercise", { sessionId, performance, duration });
    },
    [apiCall]
  );
  const getFitnessRecommendations = (0, import_react26.useCallback)(async () => {
    const result = await apiCall("get-fitness-recommendations", {});
    return result?.recommendations || [];
  }, [apiCall]);
  const generateLearningDNA = (0, import_react26.useCallback)(async () => {
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
  const analyzeDNATraits = (0, import_react26.useCallback)(async () => {
    return apiCall("analyze-dna-traits", {});
  }, [apiCall]);
  const trackDNAEvolution = (0, import_react26.useCallback)(async () => {
    return apiCall("track-dna-evolution", {});
  }, [apiCall]);
  const createStudyBuddy = (0, import_react26.useCallback)(
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
  const interactWithBuddy = (0, import_react26.useCallback)(
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
  const updateBuddyPersonality = (0, import_react26.useCallback)(
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
  const getBuddyEffectiveness = (0, import_react26.useCallback)(async () => {
    if (!studyBuddy) {
      setError("No study buddy found.");
      return null;
    }
    return apiCall("get-buddy-effectiveness", {
      buddyId: studyBuddy.buddyId
    });
  }, [apiCall, studyBuddy]);
  const createQuantumPath = (0, import_react26.useCallback)(
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
  const observeQuantumPath = (0, import_react26.useCallback)(
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
  const getPathProbabilities = (0, import_react26.useCallback)(
    async (pathId) => {
      return apiCall("get-path-probabilities", { pathId });
    },
    [apiCall]
  );
  const collapseQuantumPath = (0, import_react26.useCallback)(
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
  const clearError = (0, import_react26.useCallback)(() => {
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
var import_react27 = require("react");
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
  const [isProcessing, setIsProcessing] = (0, import_react27.useState)(false);
  const [processedInput, setProcessedInput] = (0, import_react27.useState)(null);
  const [processingStatus, setProcessingStatus] = (0, import_react27.useState)(null);
  const [storageQuota, setStorageQuota] = (0, import_react27.useState)(null);
  const [error, setError] = (0, import_react27.useState)(null);
  const optionsRef = (0, import_react27.useRef)(options);
  optionsRef.current = options;
  const apiCall = (0, import_react27.useCallback)(
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
  const processInput = (0, import_react27.useCallback)(
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
  const processBatch = (0, import_react27.useCallback)(
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
  const validateInput = (0, import_react27.useCallback)(
    async (file) => {
      const result = await apiCall("validate-input", { file });
      return result || { isValid: false, errors: ["Validation failed"], warnings: [] };
    },
    [apiCall]
  );
  const extractText = (0, import_react27.useCallback)(
    async (file) => {
      setIsProcessing(true);
      setError(null);
      const result = await apiCall("extract-text", { file });
      setIsProcessing(false);
      return result;
    },
    [apiCall]
  );
  const assessQuality = (0, import_react27.useCallback)(
    async (file) => {
      return apiCall("assess-quality", { file });
    },
    [apiCall]
  );
  const getProcessingStatus = (0, import_react27.useCallback)(
    async (inputId) => {
      const result = await apiCall("get-status", { inputId });
      if (result) {
        setProcessingStatus(result);
      }
      return result;
    },
    [apiCall]
  );
  const cancelProcessing = (0, import_react27.useCallback)(
    async (inputId) => {
      const result = await apiCall("cancel-processing", { inputId });
      return result?.success || false;
    },
    [apiCall]
  );
  const getStorageQuota = (0, import_react27.useCallback)(async () => {
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
  const fileToBase64 = (0, import_react27.useCallback)(async (file) => {
    return convertFileToBase64(file);
  }, []);
  const reset = (0, import_react27.useCallback)(() => {
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

// src/hooks/useContextGathering.ts
var import_react28 = require("react");
var import_core2 = require("@sam-ai/core");
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char | 0;
  }
  return Math.abs(hash).toString(36);
}
function getVisibleText(el, maxLength) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node2) {
      const parent = node2.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript") {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest('[data-sam-theme], [role="navigation"], nav.sidebar, aside')) {
        return NodeFilter.FILTER_REJECT;
      }
      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let text = "";
  let node = walker.nextNode();
  while (node && text.length < maxLength) {
    const content = (node.textContent ?? "").trim();
    if (content) {
      text += (text ? " " : "") + content;
    }
    node = walker.nextNode();
  }
  return text.slice(0, maxLength);
}
function getMainContentElement() {
  return document.querySelector("main") ?? document.querySelector('[role="main"]') ?? document.querySelector("#main-content") ?? document.body;
}
function detectPageContext() {
  const path = window.location.pathname;
  const title = document.title;
  const mainEl = document.querySelector("main") ?? document.body;
  const dataType = mainEl.dataset.pageType ?? mainEl.dataset.samPageType ?? "";
  const dataEntityId = mainEl.dataset.entityId ?? mainEl.dataset.samEntityId ?? "";
  const dataParentId = mainEl.dataset.parentEntityId ?? "";
  const dataGrandParentId = mainEl.dataset.grandParentEntityId ?? "";
  const pageType = dataType || detectPageTypeFromPath(path);
  const breadcrumbEls = document.querySelectorAll('[aria-label="breadcrumb"] a, nav.breadcrumb a, [data-breadcrumb] a');
  const breadcrumb = breadcrumbEls.length > 0 ? Array.from(breadcrumbEls).map((a) => a.textContent?.trim() ?? "") : buildBreadcrumbFromPath(path);
  const capEl = mainEl.dataset.capabilities ?? mainEl.dataset.samCapabilities;
  const capabilities = capEl ? capEl.split(",").map((c) => c.trim()) : [];
  const meta = {};
  document.querySelectorAll("meta[name], meta[property]").forEach((el) => {
    const name = el.getAttribute("name") ?? el.getAttribute("property") ?? "";
    const content = el.getAttribute("content") ?? "";
    if (name && content) meta[name] = content;
  });
  const state = detectPageState();
  return {
    type: pageType,
    path,
    title,
    entityId: dataEntityId || void 0,
    parentEntityId: dataParentId || void 0,
    grandParentEntityId: dataGrandParentId || void 0,
    capabilities,
    breadcrumb,
    state,
    meta
  };
}
function detectPageTypeFromPath(path) {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "teacher") {
    if (segments.length >= 4 && segments[2] === "sections") return "teacher-section-edit";
    if (segments.length >= 4 && segments[2] === "chapters") return "teacher-chapter-edit";
    if (segments.length >= 2 && segments[1] === "courses") {
      return segments.length > 2 ? "teacher-course-edit" : "teacher-courses";
    }
    if (segments[1] === "analytics") return "teacher-analytics";
    return "teacher-dashboard";
  }
  if (segments[0] === "courses") {
    if (segments.length === 1) return "courses-list";
    if (segments.length >= 4 && segments[2] === "sections") return "section-detail";
    if (segments.length >= 4 && segments[2] === "chapters") return "chapter-detail";
    return "course-detail";
  }
  if (segments[0] === "exams") {
    return segments.length > 1 ? "exam-detail" : "exams-list";
  }
  if (segments[0] === "study-plan") return "study-plan";
  if (segments[0] === "dashboard") return "dashboard";
  if (segments[0] === "settings") return "settings";
  if (segments[0] === "profile") return "profile";
  return "unknown";
}
function buildBreadcrumbFromPath(path) {
  return path.split("/").filter(Boolean).filter((seg) => !/^[0-9a-f-]{20,}$/i.test(seg) && !/^c[a-z0-9]{20,}$/i.test(seg)).map(
    (seg) => seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
function detectPageState() {
  const mainEl = document.querySelector("main") ?? document.body;
  const isEditing = !!document.querySelector('[contenteditable="true"]') || mainEl.dataset.editing === "true" || !!document.querySelector("form [data-editing]");
  const statusEl = mainEl.dataset.status ?? "";
  const isDraft = statusEl === "draft" || !!document.querySelector('[data-status="draft"]');
  const isPublished = statusEl === "published" || !!document.querySelector('[data-status="published"]');
  const hasUnsavedChanges = mainEl.dataset.unsaved === "true" || !!document.querySelector('form.dirty, [data-dirty="true"]');
  const permStr = mainEl.dataset.permissions ?? "";
  const permissions = permStr ? permStr.split(",").map((p) => p.trim()) : [];
  const stepEl = document.querySelector("[data-step]");
  const step = stepEl ? parseInt(stepEl.getAttribute("data-step") ?? "", 10) : void 0;
  const totalStepsEl = document.querySelector("[data-total-steps]");
  const totalSteps = totalStepsEl ? parseInt(totalStepsEl.getAttribute("data-total-steps") ?? "", 10) : void 0;
  return {
    isEditing,
    isDraft,
    isPublished,
    hasUnsavedChanges,
    permissions,
    step: Number.isFinite(step) ? step : void 0,
    totalSteps: Number.isFinite(totalSteps) ? totalSteps : void 0
  };
}
function scanForms(maxForms) {
  const formEls = document.querySelectorAll("form");
  const snapshots = [];
  for (let i = 0; i < Math.min(formEls.length, maxForms); i++) {
    const form = formEls[i];
    const snapshot = scanSingleForm(form, i);
    if (snapshot) snapshots.push(snapshot);
  }
  return snapshots;
}
function scanSingleForm(form, index) {
  const formId = form.id || form.dataset.formId || form.name || `form-${index}`;
  const formName = form.dataset.formName || form.getAttribute("aria-label") || form.name || formId;
  const fields = [];
  const fieldGroups = [];
  const validationRules = {};
  form.querySelectorAll("fieldset").forEach((fieldset, gi) => {
    const legend = fieldset.querySelector("legend");
    const groupName = fieldset.dataset.group || legend?.textContent?.trim() || `group-${gi}`;
    const fieldNames = [];
    fieldset.querySelectorAll("input, select, textarea").forEach((el) => {
      const name = el.name;
      if (name) fieldNames.push(name);
    });
    fieldGroups.push({
      name: groupName,
      label: legend?.textContent?.trim(),
      fields: fieldNames,
      order: gi
    });
  });
  const elements = form.querySelectorAll("input, select, textarea");
  elements.forEach((el, order) => {
    const field = scanFormField(el, order);
    if (field) {
      fields.push(field);
      const rules = extractValidationRules(el);
      if (rules.length > 0) {
        validationRules[field.name] = rules;
      }
    }
  });
  if (fields.length === 0) return null;
  const purpose = inferFormPurpose(form, fields);
  const requiredFields = fields.filter((f) => f.required);
  const filledRequired = requiredFields.filter(
    (f) => f.value != null && f.value !== ""
  );
  const errorFields = fields.filter((f) => f.validationState === "invalid");
  const dirtyFields = fields.filter(
    (f) => f.value != null && f.value !== "" && f.validationState !== "untouched"
  );
  return {
    formId,
    formName,
    purpose,
    action: form.action || void 0,
    method: form.method || void 0,
    fields,
    fieldGroups,
    state: {
      isDirty: dirtyFields.length > 0,
      isValid: errorFields.length === 0,
      isSubmitting: form.dataset.submitting === "true",
      completionPercent: requiredFields.length > 0 ? Math.round(filledRequired.length / requiredFields.length * 100) : 100,
      errorCount: errorFields.length
    },
    validation: {
      rules: validationRules,
      dependencies: []
    }
  };
}
function scanFormField(el, order) {
  const name = el.name || el.id;
  if (!name) return null;
  if (el instanceof HTMLInputElement) {
    if (el.type === "hidden" || el.type === "submit" || el.type === "button") {
      return null;
    }
  }
  const type = el instanceof HTMLSelectElement ? "select" : el instanceof HTMLTextAreaElement ? "textarea" : el.type || "text";
  const value = getFieldValue3(el);
  const label = resolveFieldLabel(el);
  let options;
  if (el instanceof HTMLSelectElement) {
    options = Array.from(el.options).map((opt) => ({
      value: opt.value,
      label: opt.textContent?.trim() ?? opt.value,
      selected: opt.selected
    }));
  }
  const dataAttributes = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-")) {
      dataAttributes[attr.name] = attr.value;
    }
  }
  const validationState = detectValidationState(el);
  const errors = extractFieldErrors(el);
  const describedBy = el.getAttribute("aria-describedby");
  let helpText;
  if (describedBy) {
    const helpEl = document.getElementById(describedBy);
    if (helpEl && !helpEl.classList.contains("error")) {
      helpText = helpEl.textContent?.trim();
    }
  }
  if (!helpText) {
    helpText = el.title || void 0;
  }
  return {
    name,
    type,
    value,
    label,
    placeholder: "placeholder" in el ? el.placeholder || void 0 : void 0,
    helpText,
    required: el.required,
    disabled: el.disabled,
    readOnly: el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.readOnly : false,
    hidden: el.type === "hidden" || el.hidden,
    validationState,
    errors,
    options,
    min: el instanceof HTMLInputElement ? el.min || void 0 : void 0,
    max: el instanceof HTMLInputElement ? el.max || void 0 : void 0,
    minLength: el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.minLength > 0 ? el.minLength : void 0 : void 0,
    maxLength: el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.maxLength > 0 && el.maxLength < 524288 ? el.maxLength : void 0 : void 0,
    pattern: el instanceof HTMLInputElement ? el.pattern || void 0 : void 0,
    step: el instanceof HTMLInputElement && el.step ? parseFloat(el.step) : void 0,
    group: el.closest("fieldset")?.dataset.group ?? el.closest("fieldset")?.querySelector("legend")?.textContent?.trim(),
    order,
    dataAttributes
  };
}
function getFieldValue3(el) {
  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox") return el.checked;
    if (el.type === "number" || el.type === "range") {
      return el.value ? parseFloat(el.value) : null;
    }
    if (el.type === "file") return el.files ? Array.from(el.files).map((f) => f.name) : null;
    return el.value || null;
  }
  if (el instanceof HTMLSelectElement) {
    if (el.multiple) {
      return Array.from(el.selectedOptions).map((o) => o.value);
    }
    return el.value || null;
  }
  return el.value || null;
}
function resolveFieldLabel(el) {
  const id = el.id;
  if (id) {
    const labelEl = document.querySelector(`label[for="${id}"]`);
    if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
  }
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const refEl = document.getElementById(labelledBy);
    if (refEl?.textContent?.trim()) return refEl.textContent.trim();
  }
  const parentLabel = el.closest("label");
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true);
    clone.querySelectorAll("input, select, textarea").forEach((c) => c.remove());
    const text = clone.textContent?.trim();
    if (text) return text;
  }
  const prev = el.previousElementSibling;
  if (prev?.tagName === "LABEL") {
    const text = prev.textContent?.trim();
    if (text) return text;
  }
  const name = el.name || el.id || "";
  return name.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
function detectValidationState(el) {
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    if (!el.value && !el.required) return "untouched";
    if (el.validity && !el.validity.valid) return "invalid";
  }
  if (el.getAttribute("aria-invalid") === "true") return "invalid";
  if (el.classList.contains("error") || el.classList.contains("is-invalid")) return "invalid";
  if (el.dataset.valid === "false" || el.dataset.error) return "invalid";
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    if (el.value) return "valid";
  }
  return "untouched";
}
function extractFieldErrors(el) {
  const errors = [];
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    if (el.validationMessage) errors.push(el.validationMessage);
  }
  const describedBy = el.getAttribute("aria-describedby");
  if (describedBy) {
    const errorEl = document.getElementById(describedBy);
    if (errorEl && (errorEl.classList.contains("error") || errorEl.getAttribute("role") === "alert")) {
      const text = errorEl.textContent?.trim();
      if (text) errors.push(text);
    }
  }
  const nextEl = el.nextElementSibling;
  if (nextEl && (nextEl.classList.contains("error-message") || nextEl.getAttribute("role") === "alert")) {
    const text = nextEl.textContent?.trim();
    if (text) errors.push(text);
  }
  return errors;
}
function extractValidationRules(el) {
  const rules = [];
  if (el.required) rules.push({ type: "required" });
  if (el.minLength > 0) rules.push({ type: "minLength", value: el.minLength });
  if (el.maxLength > 0 && el.maxLength < 524288) rules.push({ type: "maxLength", value: el.maxLength });
  if (el.min) rules.push({ type: "min", value: el.min });
  if (el.max) rules.push({ type: "max", value: el.max });
  if (el.pattern) rules.push({ type: "pattern", value: el.pattern });
  return rules;
}
function inferFormPurpose(form, fields) {
  const action = (form.action ?? "").toLowerCase();
  const method = (form.method ?? "get").toLowerCase();
  const dataRole = form.dataset.purpose ?? form.dataset.role ?? "";
  if (dataRole) {
    const normalized = dataRole.toLowerCase();
    if (["create", "edit", "search", "filter", "settings"].includes(normalized)) {
      return normalized;
    }
  }
  if (method === "get" || action.includes("search") || fields.some((f) => f.name === "q" || f.name === "query" || f.name === "search")) {
    return "search";
  }
  if (fields.some((f) => f.name.includes("filter") || f.type === "select") && fields.length <= 5) {
    return "filter";
  }
  if (action.includes("settings") || action.includes("preferences") || action.includes("config")) {
    return "settings";
  }
  const path = window.location.pathname;
  if (path.includes("/new") || path.includes("/create")) return "create";
  if (path.includes("/edit") || path.includes("/update")) return "edit";
  if (path.includes("/settings") || path.includes("/preferences")) return "settings";
  const textFields = fields.filter((f) => ["text", "textarea", "email", "url"].includes(f.type));
  if (textFields.length >= 3) return method === "post" ? "create" : "edit";
  return "unknown";
}
function extractContent() {
  const mainEl = getMainContentElement();
  const headings = [];
  mainEl.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
    if (el.closest("[data-sam-theme]")) return;
    const text = el.textContent?.trim();
    if (text) {
      headings.push({
        level: parseInt(el.tagName[1], 10),
        text,
        id: el.id || void 0
      });
    }
  });
  const tables = [];
  mainEl.querySelectorAll("table").forEach((table) => {
    if (table.closest("[data-sam-theme]")) return;
    const caption = table.querySelector("caption")?.textContent?.trim();
    const headers = Array.from(table.querySelectorAll("thead th, tr:first-child th")).map(
      (th) => th.textContent?.trim() ?? ""
    );
    const rows = table.querySelectorAll("tbody tr").length || table.querySelectorAll("tr").length;
    tables.push({ caption, headers, rowCount: rows });
  });
  const codeBlocks = [];
  mainEl.querySelectorAll('pre code, code[class*="language-"]').forEach((el) => {
    if (el.closest("[data-sam-theme]")) return;
    const langClass = Array.from(el.classList).find((c) => c.startsWith("language-"));
    const language = langClass ? langClass.replace("language-", "") : void 0;
    const preview = (el.textContent ?? "").slice(0, 200).trim();
    if (preview) codeBlocks.push({ language, preview });
  });
  const images = [];
  mainEl.querySelectorAll("img[alt]").forEach((el) => {
    if (el.closest("[data-sam-theme]")) return;
    const img = el;
    if (img.alt && img.src) {
      images.push({ alt: img.alt, src: img.src });
    }
  });
  const textSummary = getVisibleText(mainEl, 5e3);
  const wordCount = textSummary.split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.ceil(wordCount / 200);
  return {
    headings,
    tables,
    codeBlocks,
    images,
    textSummary,
    wordCount,
    readingTimeMinutes
  };
}
function extractNavigation(maxLinks) {
  const links = [];
  const currentPath = window.location.pathname;
  const allLinks = document.querySelectorAll("a[href]");
  const seen = /* @__PURE__ */ new Set();
  for (const el of Array.from(allLinks).slice(0, maxLinks * 2)) {
    const anchor = el;
    const href = anchor.getAttribute("href") ?? "";
    if (!href || href === "#" || href.startsWith("javascript:")) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    const text = anchor.textContent?.trim() ?? "";
    if (!text) continue;
    const category = categorizeLink(anchor, href);
    const isActive = href === currentPath || anchor.classList.contains("active") || anchor.getAttribute("aria-current") === "page";
    links.push({
      href,
      text,
      category,
      ariaLabel: anchor.getAttribute("aria-label") ?? void 0,
      isActive
    });
    if (links.length >= maxLinks) break;
  }
  const tabEls = document.querySelectorAll('[role="tab"], [data-tab]');
  const tabs = tabEls.length > 0 ? Array.from(tabEls).map((el) => ({
    label: el.textContent?.trim() ?? "",
    isActive: el.getAttribute("aria-selected") === "true" || el.classList.contains("active"),
    href: el.href || void 0
  })) : void 0;
  const paginationEl = document.querySelector('[aria-label="pagination"], nav.pagination, [data-pagination]');
  let pagination;
  if (paginationEl) {
    const currentEl = paginationEl.querySelector('[aria-current="page"], .active, [data-current]');
    const current = currentEl ? parseInt(currentEl.textContent?.trim() ?? "1", 10) : 1;
    const allPages = Array.from(paginationEl.querySelectorAll("a, button")).map((el) => parseInt(el.textContent?.trim() ?? "", 10)).filter((n) => !isNaN(n));
    const total = allPages.length > 0 ? Math.max(...allPages) : 1;
    pagination = {
      current: Number.isFinite(current) ? current : 1,
      total: Number.isFinite(total) ? total : 1,
      hasNext: !!paginationEl.querySelector('[aria-label*="next"], [rel="next"], .next'),
      hasPrev: !!paginationEl.querySelector('[aria-label*="prev"], [rel="prev"], .prev')
    };
  }
  const sidebarEl = document.querySelector('aside nav, [role="navigation"][aria-label*="sidebar"], [data-sidebar]');
  const sidebar = sidebarEl ? Array.from(sidebarEl.querySelectorAll("a")).map((el) => {
    const anchor = el;
    const depth = countParentListDepth(anchor);
    return {
      label: anchor.textContent?.trim() ?? "",
      href: anchor.href,
      isActive: anchor.getAttribute("aria-current") === "page" || anchor.classList.contains("active"),
      depth
    };
  }) : void 0;
  return { links, pagination, tabs, sidebar };
}
function categorizeLink(anchor, href) {
  if (anchor.closest('[aria-label="breadcrumb"], nav.breadcrumb')) return "breadcrumb";
  if (anchor.closest('[aria-label="pagination"], nav.pagination')) return "pagination";
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return "external";
  } catch {
  }
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|csv)$/i.test(href)) return "resource";
  if (anchor.closest('[role="button"]') || anchor.classList.contains("btn") || anchor.classList.contains("button")) {
    return "action";
  }
  return "navigation";
}
function countParentListDepth(el) {
  let depth = 0;
  let current = el;
  while (current) {
    if (current.tagName === "UL" || current.tagName === "OL") depth++;
    current = current.parentElement;
  }
  return Math.max(0, depth - 1);
}
function captureInteraction(pageLoadTime) {
  const docEl = document.documentElement;
  const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
  const scrollPosition = scrollHeight > 0 ? Math.round(docEl.scrollTop / scrollHeight * 100) : 0;
  const focusedEl = document.activeElement;
  const focusedElement = focusedEl && focusedEl !== document.body ? describeElement(focusedEl) : void 0;
  const selection = window.getSelection();
  const selectedText = selection && selection.toString().trim() ? selection.toString().trim().slice(0, 500) : void 0;
  return {
    scrollPosition,
    viewportHeight: window.innerHeight,
    focusedElement,
    selectedText,
    timeOnPage: Math.round((Date.now() - pageLoadTime) / 1e3)
  };
}
function describeElement(el) {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const name = el.name ? `[name="${el.name}"]` : "";
  return `${tag}${id}${name}`;
}
function useContextGathering(options = {}) {
  const {
    enabled = true,
    debounceMs = 500,
    includeContent = true,
    includeInteraction = true,
    maxForms = 5,
    maxLinks = 100,
    customProviders: initialProviders = []
  } = options;
  const [snapshot, setSnapshot] = (0, import_react28.useState)(null);
  const [isGathering, setIsGathering] = (0, import_react28.useState)(false);
  const [lastUpdated, setLastUpdated] = (0, import_react28.useState)(null);
  const optionsRef = (0, import_react28.useRef)(options);
  optionsRef.current = options;
  const providersRef = (0, import_react28.useRef)(initialProviders);
  const pageLoadTimeRef = (0, import_react28.useRef)(Date.now());
  const lastHashRef = (0, import_react28.useRef)("");
  const timerRef = (0, import_react28.useRef)(null);
  const gather = (0, import_react28.useCallback)(async () => {
    if (!enabled) return;
    if (typeof document === "undefined") return;
    setIsGathering(true);
    try {
      const page = detectPageContext();
      const forms = scanForms(maxForms);
      const content = includeContent ? extractContent() : {
        headings: [],
        tables: [],
        codeBlocks: [],
        images: [],
        textSummary: "",
        wordCount: 0,
        readingTimeMinutes: 0
      };
      const navigation = extractNavigation(maxLinks);
      const interaction = includeInteraction ? captureInteraction(pageLoadTimeRef.current) : { scrollPosition: 0, viewportHeight: 0, timeOnPage: 0 };
      let custom = {};
      for (const provider of providersRef.current) {
        try {
          const result = await provider.gather();
          custom = { ...custom, [provider.name]: result };
        } catch {
        }
      }
      const hashInput = `${page.path}:${page.type}:${page.title}:${forms.length}:${content.wordCount}:${JSON.stringify(forms.map((f) => f.fields.map((fi) => `${fi.name}=${String(fi.value ?? "")}`)))}`;
      const contentHash = simpleHash(hashInput);
      if (contentHash === lastHashRef.current) {
        setIsGathering(false);
        return;
      }
      lastHashRef.current = contentHash;
      const newSnapshot = {
        version: import_core2.CONTEXT_SNAPSHOT_VERSION,
        timestamp: Date.now(),
        contentHash,
        page,
        forms,
        content,
        navigation,
        interaction,
        custom
      };
      setSnapshot(newSnapshot);
      setLastUpdated(/* @__PURE__ */ new Date());
      optionsRef.current.onSnapshotReady?.(newSnapshot);
    } finally {
      setIsGathering(false);
    }
  }, [enabled, maxForms, maxLinks, includeContent, includeInteraction]);
  const debouncedGather = (0, import_react28.useCallback)(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      gather();
    }, debounceMs);
  }, [gather, debounceMs]);
  const refresh = (0, import_react28.useCallback)(() => {
    lastHashRef.current = "";
    gather();
  }, [gather]);
  const registerProvider = (0, import_react28.useCallback)((provider) => {
    providersRef.current = [...providersRef.current.filter((p) => p.name !== provider.name), provider];
  }, []);
  (0, import_react28.useEffect)(() => {
    if (!enabled || typeof document === "undefined") return;
    pageLoadTimeRef.current = Date.now();
    gather();
    const observer = new MutationObserver(() => {
      debouncedGather();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const onNav = () => {
      pageLoadTimeRef.current = Date.now();
      lastHashRef.current = "";
      debouncedGather();
    };
    window.addEventListener("popstate", onNav);
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args) => {
      origPush(...args);
      onNav();
    };
    history.replaceState = (...args) => {
      origReplace(...args);
      onNav();
    };
    const onInput = () => debouncedGather();
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", onNav);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      history.pushState = origPush;
      history.replaceState = origReplace;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, gather, debouncedGather]);
  return {
    snapshot,
    isGathering,
    lastUpdated,
    refresh,
    registerProvider
  };
}

// src/hooks/useContextMemorySync.ts
var import_react29 = require("react");
function useContextMemorySync(options = {}) {
  const {
    syncDebounceMs = 2e3,
    apiEndpoint = "/api/sam/context",
    enabled = true,
    ...gatheringOptions
  } = options;
  const { snapshot, isGathering, refresh } = useContextGathering({ enabled, ...gatheringOptions });
  const lastSyncedHashRef = (0, import_react29.useRef)("");
  const syncTimerRef = (0, import_react29.useRef)(null);
  const syncCountRef = (0, import_react29.useRef)(0);
  const lastSyncedStateRef = (0, import_react29.useRef)(null);
  const syncSnapshot = (0, import_react29.useCallback)(
    async (snap) => {
      if (snap.contentHash === lastSyncedHashRef.current) return;
      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snapshot: snap })
        });
        if (response.ok) {
          lastSyncedHashRef.current = snap.contentHash;
          lastSyncedStateRef.current = /* @__PURE__ */ new Date();
          syncCountRef.current += 1;
        }
      } catch {
      }
    },
    [apiEndpoint]
  );
  (0, import_react29.useEffect)(() => {
    if (!snapshot || !enabled) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncSnapshot(snapshot);
    }, syncDebounceMs);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [snapshot, enabled, syncDebounceMs, syncSnapshot]);
  return {
    snapshot,
    isGathering,
    lastSynced: lastSyncedStateRef.current,
    syncCount: syncCountRef.current,
    refresh
  };
}

// src/hooks/useEnhancedBloomsAnalysis.ts
var import_react30 = require("react");

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
  useContextGathering,
  useContextMemorySync,
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
});
