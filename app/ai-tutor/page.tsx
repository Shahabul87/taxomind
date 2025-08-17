"use client";

import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, BookOpen, Code, Calculator, History, Settings, Mic, Paperclip, ChevronDown, Zap, Target, TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: string;
  text: string;
  category: string;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMode, setSelectedMode] = useState('general');
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions: Suggestion[] = [
    { id: '1', text: 'Explain React hooks with examples', category: 'Programming' },
    { id: '2', text: 'Help me solve a calculus problem', category: 'Mathematics' },
    { id: '3', text: 'Create a study plan for web development', category: 'Learning' },
    { id: '4', text: 'Debug my Python code', category: 'Programming' }
  ];

  const learningModes = [
    { id: 'general', name: 'General', icon: Brain, description: 'General learning assistance' },
    { id: 'code', name: 'Code Helper', icon: Code, description: 'Programming and debugging' },
    { id: 'math', name: 'Math Tutor', icon: Calculator, description: 'Mathematics and calculations' },
    { id: 'study', name: 'Study Buddy', icon: BookOpen, description: 'Study planning and techniques' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize welcome message on client side only
  useEffect(() => {
    setMounted(true);
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Hello! I&apos;m SAM, your AI-powered learning assistant. I can help you with programming, mathematics, science, and much more. What would you like to learn today?',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you&apos;re asking about "${inputMessage}". Let me help you with that. [This is a simulated response. In a real implementation, this would connect to an AI service.]`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Tutor Info */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Brain className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">SAM AI Tutor</h2>
                  <p className="text-purple-100 text-sm">Always here to help</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Instant responses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-300" />
                  <span>Personalized learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-300" />
                  <span>Track progress</span>
                </div>
              </div>
            </div>

            {/* Learning Modes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Learning Mode</h3>
              <div className="space-y-2">
                {learningModes.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedMode === mode.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <mode.icon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">{mode.name}</p>
                      <p className="text-xs opacity-75">{mode.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Topics
              </h3>
              <div className="space-y-2 text-sm">
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
                  React useState Hook
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
                  Python Data Types
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
                  CSS Flexbox Layout
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-12rem)] flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">SAM AI Assistant</h3>
                      <p className="text-sm text-green-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-purple-600' 
                          : 'bg-gradient-to-br from-purple-500 to-blue-500'
                      }`}>
                        {message.role === 'user' ? (
                          <span className="text-white font-bold text-sm">U</span>
                        ) : (
                          <Brain className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className={`px-4 py-3 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {typeof window !== 'undefined' && (
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {mounted && messages.length === 1 && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(suggestion => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                      rows={1}
                    />
                    <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-400">
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Powered by advanced AI • Responses are generated and may contain errors
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}