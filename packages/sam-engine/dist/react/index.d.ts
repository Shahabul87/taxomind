/**
 * SAM Engine React Components
 * Optional React integration for the SAM Engine
 */
import React, { ReactNode } from 'react';
import { SAMEngine } from '../sam-engine';
import type { SAMContext, SAMResponse, SAMEngineConfig, Message, User } from '../types';
interface SAMContextValue {
    engine: SAMEngine | null;
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    messages: Message[];
    sendMessage: (message: string, context?: Partial<SAMContext>) => Promise<SAMResponse | null>;
    clearConversation: () => Promise<void>;
    updateContext: (context: Partial<SAMContext>) => void;
}
declare const SAMReactContext: React.Context<SAMContextValue | null>;
/**
 * SAM Provider Component
 */
export interface SAMProviderProps {
    children: ReactNode;
    config?: SAMEngineConfig;
    user?: User;
    initialContext?: Partial<SAMContext>;
    onError?: (error: Error) => void;
    onMessage?: (message: Message) => void;
}
export declare function SAMProvider({ children, config, user, initialContext, onError, onMessage }: SAMProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to use SAM Engine
 */
export declare function useSAM(): SAMContextValue;
/**
 * SAM Chat Component
 */
export interface SAMChatProps {
    className?: string;
    placeholder?: string;
    showSuggestions?: boolean;
    autoFocus?: boolean;
    maxHeight?: string;
    onSendMessage?: (message: string, response: SAMResponse) => void;
}
export declare function SAMChat({ className, placeholder, showSuggestions, autoFocus, maxHeight, onSendMessage }: SAMChatProps): import("react/jsx-runtime").JSX.Element;
/**
 * SAM Floating Assistant
 */
export interface SAMFloatingAssistantProps {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    defaultOpen?: boolean;
    buttonText?: string;
    title?: string;
}
export declare function SAMFloatingAssistant({ position, defaultOpen, buttonText, title }: SAMFloatingAssistantProps): import("react/jsx-runtime").JSX.Element;
export { useSAM as useSAMEngine };
export { SAMReactContext };
//# sourceMappingURL=index.d.ts.map