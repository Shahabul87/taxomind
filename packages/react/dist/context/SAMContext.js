/**
 * @sam-ai/react - SAM Context
 * React context for SAM AI Tutor state management
 *
 * UPDATED: Removed core Blooms engine registration.
 * Unified Blooms analysis is now handled server-side via API routes
 * that use @sam-ai/educational's createUnifiedBloomsEngine.
 */
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer, useCallback, useEffect, useMemo, useRef, } from 'react';
import { createDefaultContext, createOrchestrator, createStateMachine, createContextEngine, createContentEngine, createAssessmentEngine, createPersonalizationEngine, createResponseEngine, } from '@sam-ai/core';
function samReducer(state, action) {
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
        case 'UPDATE_MESSAGE': {
            const { id, updates } = action.payload;
            const nextMessages = state.messages.map((msg) => {
                if (msg.id !== id)
                    return msg;
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
                        messages: nextMessages,
                    },
                },
            };
        }
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
function toRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    return value;
}
function toArray(value) {
    return Array.isArray(value) ? value : [];
}
function defaultParseResponse(payload) {
    const data = toRecord(payload);
    if (!data)
        return null;
    if (data.success === true && data.data && typeof data.data === 'object') {
        const inner = data.data;
        return {
            message: String(inner.message ?? ''),
            suggestions: toArray(inner.suggestions),
            actions: toArray(inner.actions),
            blooms: inner.bloomsAnalysis,
            insights: toRecord(inner.insights),
            metadata: toRecord(inner.metadata),
        };
    }
    if (typeof data.response === 'string') {
        const insights = toRecord(data.insights);
        return {
            message: data.response,
            suggestions: toArray(data.suggestions),
            actions: toArray(data.actions),
            insights,
            blooms: insights?.blooms ?? undefined,
            metadata: toRecord(data.metadata),
        };
    }
    if (typeof data.message === 'string') {
        return {
            message: data.message,
            suggestions: toArray(data.suggestions),
            actions: toArray(data.actions),
            insights: toRecord(data.insights),
            blooms: data.blooms,
            metadata: toRecord(data.metadata),
        };
    }
    return null;
}
function buildMetadata(input) {
    const meta = (input ?? {});
    const enginesExecuted = Array.isArray(meta.enginesExecuted)
        ? meta.enginesExecuted
        : Array.isArray(meta.enginesRun)
            ? meta.enginesRun
            : [];
    return {
        totalExecutionTime: typeof meta.totalExecutionTime === 'number'
            ? meta.totalExecutionTime
            : typeof meta.totalTime === 'number'
                ? meta.totalTime
                : 0,
        enginesExecuted,
        enginesFailed: Array.isArray(meta.enginesFailed) ? meta.enginesFailed : [],
        enginesCached: Array.isArray(meta.enginesCached) ? meta.enginesCached : [],
        parallelTiers: Array.isArray(meta.parallelTiers) ? meta.parallelTiers : [],
    };
}
function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
function parseSSEEvent(block) {
    const lines = block.split(/\n/);
    let event = 'message';
    const dataLines = [];
    for (const line of lines) {
        if (line.startsWith('event:')) {
            event = line.slice(6).trim() || event;
            continue;
        }
        if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
        }
    }
    if (!dataLines.length) {
        return null;
    }
    return { event, data: dataLines.join('\n') };
}
const SAMContext = createContext(null);
export function SAMProvider({ children, config, transport = 'orchestrator', api, initialContext, autoDetectContext = false, debug = false, onStateChange, onError, }) {
    // Create initial state
    const initialState = useMemo(() => ({
        context: createDefaultContext(initialContext),
        state: 'idle',
        isOpen: false,
        isProcessing: false,
        isStreaming: false,
        messages: initialContext?.conversation?.messages ?? [],
        error: null,
        lastResult: null,
    }), [initialContext]);
    const [state, dispatch] = useReducer(samReducer, initialState);
    // Create orchestrator and state machine
    const { orchestrator, stateMachine } = useMemo(() => {
        const sm = createStateMachine();
        if (transport === 'api') {
            return { orchestrator: null, stateMachine: sm };
        }
        if (!config) {
            throw new Error('SAMProvider requires a config when using orchestrator transport');
        }
        const orch = createOrchestrator(config);
        // Register engines (not core blooms - unified blooms is used server-side via API routes)
        orch.registerEngine(createContextEngine(config));
        orch.registerEngine(createContentEngine(config));
        orch.registerEngine(createAssessmentEngine(config));
        orch.registerEngine(createPersonalizationEngine(config));
        orch.registerEngine(createResponseEngine(config));
        return { orchestrator: orch, stateMachine: sm };
    }, [config, transport]);
    // Track if state machine has been initialized to prevent infinite loops
    const isInitializedRef = useRef(false);
    // Store latest context in ref to avoid stale closures
    const contextRef = useRef(state.context);
    contextRef.current = state.context;
    // Subscribe to state machine changes
    useEffect(() => {
        const unsubscribe = stateMachine.subscribe((newState) => {
            dispatch({ type: 'SET_STATE', payload: newState });
            onStateChange?.(newState);
            if (debug) {
                console.log('[SAM] State changed:', newState);
            }
        });
        // Initialize state machine only once
        if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            stateMachine.send({ type: 'INITIALIZE', payload: { context: contextRef.current } });
        }
        return unsubscribe;
    }, [stateMachine, onStateChange, debug]);
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
    const apiOptions = transport === 'api' ? api : undefined;
    const buildApiRequest = useCallback((message, context, history) => {
        if (apiOptions?.buildRequest) {
            return apiOptions.buildRequest({ message, context, history });
        }
        return { message, context, history };
    }, [apiOptions]);
    const parseApiResponse = useCallback((payload) => {
        if (apiOptions?.parseResponse) {
            return apiOptions.parseResponse(payload);
        }
        return defaultParseResponse(payload);
    }, [apiOptions]);
    const buildResultFromApi = useCallback((parsed) => ({
        success: true,
        results: {},
        response: {
            message: parsed.message,
            suggestions: parsed.suggestions ?? [],
            actions: parsed.actions ?? [],
            insights: parsed.insights ?? {},
            blooms: parsed.blooms,
        },
        metadata: buildMetadata(parsed.metadata),
    }), []);
    const sendMessageViaFetch = useCallback(async (content) => {
        if (!apiOptions?.endpoint) {
            return null;
        }
        try {
            dispatch({ type: 'SET_PROCESSING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });
            const history = state.context.conversation.messages;
            const requestBody = buildApiRequest(content, state.context, history);
            const userMessage = {
                id: `msg-${Date.now()}`,
                role: 'user',
                content,
                timestamp: new Date(),
            };
            dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
            stateMachine.send({ type: 'SEND_MESSAGE', payload: userMessage });
            const response = await fetch(apiOptions.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiOptions.headers ?? {}),
                },
                body: JSON.stringify(requestBody),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof payload?.error === 'string'
                    ? payload.error
                    : 'API request failed');
            }
            const parsed = parseApiResponse(payload);
            if (!parsed) {
                throw new Error('Failed to parse SAM response');
            }
            const result = buildResultFromApi(parsed);
            const assistantMessage = {
                id: `msg-${Date.now() + 1}`,
                role: 'assistant',
                content: result.response.message,
                timestamp: new Date(),
                metadata: {
                    suggestions: result.response.suggestions,
                    actions: result.response.actions,
                    engineInsights: result.response.insights,
                },
            };
            dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
            dispatch({ type: 'SET_RESULT', payload: result });
            stateMachine.send({
                type: 'RECEIVE_RESPONSE',
                payload: assistantMessage,
            });
            if (debug) {
                console.log('[SAM] API response:', result);
            }
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            dispatch({ type: 'SET_ERROR', payload: err });
            onError?.(err);
            if (debug) {
                console.error('[SAM] API error:', err);
            }
            return null;
        }
        finally {
            dispatch({ type: 'SET_PROCESSING', payload: false });
        }
    }, [
        apiOptions,
        buildApiRequest,
        buildResultFromApi,
        parseApiResponse,
        state.context,
        stateMachine,
        debug,
        onError,
    ]);
    const sendMessageViaStream = useCallback(async (content) => {
        if (!apiOptions?.streamEndpoint) {
            return null;
        }
        try {
            dispatch({ type: 'SET_PROCESSING', payload: true });
            dispatch({ type: 'SET_STREAMING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });
            const history = state.context.conversation.messages;
            const requestBody = buildApiRequest(content, state.context, history);
            const userMessage = {
                id: `msg-${Date.now()}`,
                role: 'user',
                content,
                timestamp: new Date(),
            };
            dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
            stateMachine.send({ type: 'SEND_MESSAGE', payload: userMessage });
            const assistantMessageId = `msg-${Date.now() + 1}`;
            const assistantMessage = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
            };
            dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
            const response = await fetch(apiOptions.streamEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                    ...(apiOptions.headers ?? {}),
                },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(typeof payload?.error === 'string'
                    ? payload.error
                    : 'Streaming API request failed');
            }
            if (!response.body) {
                throw new Error('Streaming response is not supported by the browser');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let assistantContent = '';
            let suggestions;
            let actions;
            let insights;
            let metadata;
            let blooms;
            let doneReceived = false;
            const updateAssistantContent = () => {
                dispatch({
                    type: 'UPDATE_MESSAGE',
                    payload: { id: assistantMessageId, updates: { content: assistantContent } },
                });
            };
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop() ?? '';
                for (const part of parts) {
                    const event = parseSSEEvent(part);
                    if (!event)
                        continue;
                    const payload = safeJsonParse(event.data);
                    switch (event.event) {
                        case 'content': {
                            const text = typeof payload === 'string'
                                ? payload
                                : toRecord(payload)?.text;
                            if (typeof text === 'string') {
                                assistantContent += text;
                                updateAssistantContent();
                            }
                            break;
                        }
                        case 'suggestions': {
                            if (Array.isArray(payload)) {
                                suggestions = payload;
                            }
                            break;
                        }
                        case 'actions': {
                            if (Array.isArray(payload)) {
                                actions = payload;
                            }
                            break;
                        }
                        case 'insights': {
                            if (payload && typeof payload === 'object') {
                                insights = payload;
                                const bloomsCandidate = toRecord(payload)?.blooms;
                                if (bloomsCandidate && typeof bloomsCandidate === 'object') {
                                    blooms = bloomsCandidate;
                                }
                            }
                            break;
                        }
                        case 'done': {
                            if (payload && typeof payload === 'object') {
                                const donePayload = payload;
                                metadata = toRecord(donePayload.metadata);
                            }
                            doneReceived = true;
                            break;
                        }
                        case 'error': {
                            const errorMessage = toRecord(payload)?.error && typeof toRecord(payload)?.error === 'string'
                                ? String(toRecord(payload)?.error)
                                : 'Streaming error';
                            throw new Error(errorMessage);
                        }
                        default:
                            break;
                    }
                }
            }
            if (buffer.trim()) {
                const event = parseSSEEvent(buffer);
                if (event?.event === 'content') {
                    const payload = safeJsonParse(event.data);
                    const text = typeof payload === 'string'
                        ? payload
                        : toRecord(payload)?.text;
                    if (typeof text === 'string') {
                        assistantContent += text;
                        updateAssistantContent();
                    }
                }
            }
            if (!doneReceived && !assistantContent) {
                throw new Error('Streaming response ended unexpectedly');
            }
            const parsed = {
                message: assistantContent,
                suggestions,
                actions,
                insights,
                blooms,
                metadata,
            };
            const result = buildResultFromApi(parsed);
            dispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                    id: assistantMessageId,
                    updates: {
                        content: assistantContent,
                        metadata: {
                            suggestions: result.response.suggestions,
                            actions: result.response.actions,
                            engineInsights: result.response.insights,
                        },
                    },
                },
            });
            dispatch({ type: 'SET_RESULT', payload: result });
            stateMachine.send({
                type: 'RECEIVE_RESPONSE',
                payload: {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: assistantContent,
                    timestamp: new Date(),
                    metadata: {
                        suggestions: result.response.suggestions,
                        actions: result.response.actions,
                        engineInsights: result.response.insights,
                    },
                },
            });
            if (debug) {
                console.log('[SAM] Streamed API response:', result);
            }
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            dispatch({ type: 'SET_ERROR', payload: err });
            onError?.(err);
            if (debug) {
                console.error('[SAM] Streaming API error:', err);
            }
            return null;
        }
        finally {
            dispatch({ type: 'SET_STREAMING', payload: false });
            dispatch({ type: 'SET_PROCESSING', payload: false });
        }
    }, [
        apiOptions,
        buildApiRequest,
        buildResultFromApi,
        state.context,
        stateMachine,
        debug,
        onError,
    ]);
    const sendMessageViaApi = useCallback(async (content) => {
        if (apiOptions?.streamEndpoint) {
            return sendMessageViaStream(content);
        }
        return sendMessageViaFetch(content);
    }, [apiOptions?.streamEndpoint, sendMessageViaFetch, sendMessageViaStream]);
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
        }
        else {
            open();
        }
    }, [state.isOpen, open, close]);
    const sendMessage = useCallback(async (content) => {
        if (apiOptions?.endpoint) {
            return sendMessageViaApi(content);
        }
        if (!orchestrator) {
            throw new Error('SAMProvider is not configured with an orchestrator');
        }
        try {
            dispatch({ type: 'SET_PROCESSING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });
            // Add user message
            const userMessage = {
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
            const assistantMessage = {
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
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            dispatch({ type: 'SET_ERROR', payload: err });
            onError?.(err);
            if (debug) {
                console.error('[SAM] Error:', err);
            }
            return null;
        }
        finally {
            dispatch({ type: 'SET_PROCESSING', payload: false });
        }
    }, [
        apiOptions?.endpoint,
        sendMessageViaApi,
        orchestrator,
        stateMachine,
        state.context,
        debug,
        onError,
    ]);
    const clearMessages = useCallback(() => {
        dispatch({ type: 'CLEAR_MESSAGES' });
    }, []);
    const clearError = useCallback(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
    }, []);
    const updateContext = useCallback((updates) => {
        dispatch({ type: 'UPDATE_CONTEXT', payload: updates });
    }, []);
    // Use contextRef to keep callbacks stable and avoid infinite loops
    // The ref is updated on every render, so callbacks always access current state
    const updatePage = useCallback((page) => {
        dispatch({ type: 'UPDATE_CONTEXT', payload: { page: { ...contextRef.current.page, ...page } } });
    }, []);
    const updateForm = useCallback((fields) => {
        if (!contextRef.current.form)
            return;
        dispatch({
            type: 'UPDATE_CONTEXT',
            payload: {
                form: {
                    ...contextRef.current.form,
                    fields,
                    lastUpdated: new Date(),
                },
            },
        });
    }, []);
    const analyze = useCallback(async (query) => {
        if (apiOptions?.endpoint) {
            return sendMessageViaApi(query ?? 'Analyze the current context');
        }
        if (!orchestrator) {
            throw new Error('SAMProvider is not configured with an orchestrator');
        }
        try {
            dispatch({ type: 'SET_PROCESSING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });
            const result = await orchestrator.orchestrate(state.context, query ?? 'Analyze the current context', { parallel: true });
            dispatch({ type: 'SET_RESULT', payload: result });
            if (debug) {
                console.log('[SAM] Analysis result:', result);
            }
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            dispatch({ type: 'SET_ERROR', payload: err });
            onError?.(err);
            return null;
        }
        finally {
            dispatch({ type: 'SET_PROCESSING', payload: false });
        }
    }, [
        apiOptions?.endpoint,
        sendMessageViaApi,
        orchestrator,
        state.context,
        debug,
        onError,
    ]);
    const getBloomsAnalysis = useCallback(() => {
        if (!state.lastResult?.results?.blooms?.success) {
            return null;
        }
        return state.lastResult.results.blooms.data?.analysis ?? null;
    }, [state.lastResult]);
    const executeAction = useCallback(async (action) => {
        if (debug) {
            console.log('[SAM] Executing action:', action);
        }
        stateMachine.send({
            type: 'EXECUTE_ACTION',
            payload: action,
        });
        // Action execution would be handled by the consuming application
        // This is a hook point for custom action handlers
    }, [stateMachine, debug]);
    // ============================================================================
    // DERIVED STATE
    // ============================================================================
    const suggestions = useMemo(() => {
        return state.lastResult?.response.suggestions ?? [];
    }, [state.lastResult]);
    const actions = useMemo(() => {
        return state.lastResult?.response.actions ?? [];
    }, [state.lastResult]);
    // ============================================================================
    // CONTEXT VALUE
    // ============================================================================
    const contextValue = useMemo(() => ({
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
    }), [
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
    ]);
    return _jsx(SAMContext.Provider, { value: contextValue, children: children });
}
// ============================================================================
// HOOK
// ============================================================================
export function useSAMContext() {
    const context = useContext(SAMContext);
    if (!context) {
        throw new Error('useSAMContext must be used within a SAMProvider');
    }
    return context;
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function detectContextFromPath(path) {
    // Default route patterns
    const patterns = [
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
