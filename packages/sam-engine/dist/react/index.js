import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SAM Engine React Components
 * Optional React integration for the SAM Engine
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SAMEngine } from '../sam-engine';
// Create context
const SAMReactContext = createContext(null);
export function SAMProvider({ children, config, user = { id: 'anonymous', isTeacher: false }, initialContext = {}, onError, onMessage }) {
    const [engine, setEngine] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [context, setContext] = useState({
        user,
        ...initialContext
    });
    const engineRef = useRef(null);
    // Initialize engine
    useEffect(() => {
        const initEngine = async () => {
            try {
                const samEngine = new SAMEngine(config);
                await samEngine.initialize();
                // Set up event listeners
                samEngine.on('message.received', (event) => {
                    if (onMessage && event.data) {
                        onMessage({
                            role: 'assistant',
                            content: event.data.message,
                            timestamp: new Date()
                        });
                    }
                });
                samEngine.on('error.occurred', (event) => {
                    if (onError && event.error) {
                        onError(event.error instanceof Error ? event.error : new Error(String(event.error)));
                    }
                });
                engineRef.current = samEngine;
                setEngine(samEngine);
                setIsInitialized(true);
            }
            catch (err) {
                setError(err.message);
                if (onError) {
                    onError(err);
                }
            }
        };
        initEngine();
        // Cleanup
        return () => {
            if (engineRef.current) {
                engineRef.current.destroy();
            }
        };
    }, [config, onError, onMessage]);
    // Send message
    const sendMessage = useCallback(async (message, additionalContext) => {
        if (!engine || !isInitialized) {
            setError('SAM Engine is not initialized');
            return null;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fullContext = {
                ...context,
                ...additionalContext
            };
            const response = await engine.process(fullContext, message);
            // Update messages
            setMessages(prev => [
                ...prev,
                {
                    role: 'user',
                    content: message,
                    timestamp: new Date()
                },
                {
                    role: 'assistant',
                    content: response.message,
                    timestamp: new Date(),
                    metadata: {
                        suggestions: response.suggestions,
                        contextInsights: response.contextInsights
                    }
                }
            ]);
            return response;
        }
        catch (err) {
            setError(err.message);
            if (onError) {
                onError(err);
            }
            return null;
        }
        finally {
            setIsLoading(false);
        }
    }, [engine, isInitialized, context, onError]);
    // Clear conversation
    const clearConversation = useCallback(async () => {
        if (!engine)
            return;
        try {
            await engine.clearConversation(context.user.id, context.courseId);
            setMessages([]);
        }
        catch (err) {
            setError(err.message);
        }
    }, [engine, context]);
    // Update context
    const updateContext = useCallback((newContext) => {
        setContext(prev => ({
            ...prev,
            ...newContext
        }));
    }, []);
    const value = {
        engine,
        isInitialized,
        isLoading,
        error,
        messages,
        sendMessage,
        clearConversation,
        updateContext
    };
    return (_jsx(SAMReactContext.Provider, { value: value, children: children }));
}
/**
 * Hook to use SAM Engine
 */
export function useSAM() {
    const context = useContext(SAMReactContext);
    if (!context) {
        throw new Error('useSAM must be used within a SAMProvider');
    }
    return context;
}
export function SAMChat({ className = '', placeholder = 'Ask SAM anything...', showSuggestions = true, autoFocus = false, maxHeight = '400px', onSendMessage }) {
    const { messages, sendMessage, isLoading, error, clearConversation } = useSAM();
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const messagesEndRef = useRef(null);
    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // Extract suggestions from last message
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.metadata?.suggestions) {
            setSuggestions(lastMessage.metadata.suggestions);
        }
    }, [messages]);
    const handleSend = async () => {
        if (!input.trim() || isLoading)
            return;
        const message = input.trim();
        setInput('');
        setSuggestions([]);
        const response = await sendMessage(message);
        if (response && onSendMessage) {
            onSendMessage(message, response);
        }
    };
    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    return (_jsxs("div", { className: `sam-chat ${className}`, children: [_jsxs("div", { className: "sam-chat-messages", style: { maxHeight, overflowY: 'auto' }, children: [messages.map((message, index) => (_jsxs("div", { className: `sam-message sam-message-${message.role}`, children: [_jsx("div", { className: "sam-message-content", children: message.content }), message.role === 'assistant' && message.metadata?.contextInsights && (_jsxs("div", { className: "sam-message-insights", children: [message.metadata.contextInsights.observation && (_jsxs("div", { className: "sam-insight", children: [_jsx("strong", { children: "Observation:" }), " ", message.metadata.contextInsights.observation] })), message.metadata.contextInsights.recommendation && (_jsxs("div", { className: "sam-insight", children: [_jsx("strong", { children: "Recommendation:" }), " ", message.metadata.contextInsights.recommendation] }))] }))] }, index))), isLoading && (_jsx("div", { className: "sam-message sam-message-loading", children: _jsx("div", { className: "sam-loading-indicator", children: "SAM is thinking..." }) })), error && (_jsx("div", { className: "sam-message sam-message-error", children: _jsxs("div", { className: "sam-error-content", children: ["Error: ", error] }) })), _jsx("div", { ref: messagesEndRef })] }), showSuggestions && suggestions.length > 0 && (_jsx("div", { className: "sam-suggestions", children: suggestions.map((suggestion, index) => (_jsx("button", { className: "sam-suggestion", onClick: () => handleSuggestionClick(suggestion), disabled: isLoading, children: suggestion }, index))) })), _jsxs("div", { className: "sam-chat-input", children: [_jsx("textarea", { value: input, onChange: (e) => setInput(e.target.value), onKeyPress: handleKeyPress, placeholder: placeholder, autoFocus: autoFocus, disabled: isLoading, className: "sam-input", rows: 2 }), _jsxs("div", { className: "sam-chat-actions", children: [_jsx("button", { onClick: handleSend, disabled: !input.trim() || isLoading, className: "sam-send-button", children: "Send" }), _jsx("button", { onClick: clearConversation, disabled: isLoading || messages.length === 0, className: "sam-clear-button", children: "Clear" })] })] })] }));
}
export function SAMFloatingAssistant({ position = 'bottom-right', defaultOpen = false, buttonText = 'Ask SAM', title = 'SAM Assistant' }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const positionClasses = {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4'
    };
    return (_jsx("div", { className: `fixed ${positionClasses[position]} z-50`, children: isOpen ? (_jsxs("div", { className: "sam-floating-panel", children: [_jsxs("div", { className: "sam-floating-header", children: [_jsx("h3", { children: title }), _jsx("button", { onClick: () => setIsOpen(false), className: "sam-close-button", children: "\u00D7" })] }), _jsx(SAMChat, { maxHeight: "300px", autoFocus: true })] })) : (_jsx("button", { onClick: () => setIsOpen(true), className: "sam-floating-button", children: buttonText })) }));
}
// Export hooks
export { useSAM as useSAMEngine };
// Export context for advanced use cases
export { SAMReactContext };
//# sourceMappingURL=index.js.map