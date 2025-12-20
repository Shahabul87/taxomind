'use client';

import { useState, useRef, useEffect } from 'react';
import { useCourseCreation } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { X, Minimize2, Maximize2, Sparkles, Zap, GripVertical, BookOpen, Target, TrendingUp, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Position {
  x: number;
  y: number;
}

type InteractionMode = 'quick' | 'chat' | 'analyze';

export function FloatingSAM() {
  const {
    floatingSamOpen,
    setFloatingSamOpen,
    courseData,
    currentField,
    bloomsAnalysis,
  } = useCourseCreation();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<InteractionMode>('quick');

  // Drag and drop state
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 420, // 400px width + 20px margin
        y: window.innerHeight - 620, // 600px height + 20px margin
      });
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (mode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, mode]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 0);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleQuickAction = async (prompt: string) => {
    setMode('chat');
    setIsProcessing(true);

    try {
      const context = { courseData, currentField, bloomsAnalysis };
      const response = await fetch('/api/sam/contextual-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, fieldContext: currentField }),
      });

      const data = await response.json();

      setMessages([
        { role: 'user', content: prompt, timestamp: new Date() },
        { role: 'assistant', content: data.response, timestamp: new Date() },
      ]);
    } catch (error) {
      console.error('Quick action failed:', error);
      setMessages([
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const context = { courseData, currentField, bloomsAnalysis, conversationHistory: messages };
      const response = await fetch('/api/sam/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue.trim(), context }),
      });

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get SAM response:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!floatingSamOpen) {
    return (
      <button
        onClick={() => setFloatingSamOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center z-50 group"
        aria-label="Open SAM Assistant"
      >
        <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all 0.3s ease',
      }}
      className={`bg-white rounded-2xl shadow-2xl border border-gray-200/50 backdrop-blur-xl flex flex-col z-50 ${
        isMinimized ? 'w-80 h-20' : 'w-[400px] h-[600px]'
      } ${isDragging ? 'cursor-grabbing shadow-blue-500/30' : ''}`}
    >
      {/* Header with drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-t-2xl ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 opacity-60" />
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">SAM</h3>
            <p className="text-xs opacity-80">Smart Adaptive Mentor</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setFloatingSamOpen(false)}
            className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Mode Selector */}
          <div className="flex border-b bg-gray-50/50">
            <ModeTab
              icon={Zap}
              label="Quick"
              isActive={mode === 'quick'}
              onClick={() => setMode('quick')}
            />
            <ModeTab
              icon={MessageSquare}
              label="Chat"
              isActive={mode === 'chat'}
              onClick={() => setMode('chat')}
            />
            <ModeTab
              icon={TrendingUp}
              label="Analyze"
              isActive={mode === 'analyze'}
              onClick={() => setMode('analyze')}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {mode === 'quick' && (
              <QuickActionsView
                currentField={currentField}
                bloomsAnalysis={bloomsAnalysis}
                onQuickAction={handleQuickAction}
                isProcessing={isProcessing}
              />
            )}

            {mode === 'chat' && (
              <ChatView
                messages={messages}
                isProcessing={isProcessing}
                messagesEndRef={messagesEndRef}
              />
            )}

            {mode === 'analyze' && (
              <AnalyzeView
                courseData={courseData}
                bloomsAnalysis={bloomsAnalysis}
                currentField={currentField}
              />
            )}
          </div>

          {/* Input Area (only for chat mode) */}
          {mode === 'chat' && (
            <div className="p-3 border-t bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask anything..."
                  className="flex-1 px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Mode Tab Component
function ModeTab({
  icon: Icon,
  label,
  isActive,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
        isActive
          ? 'bg-white text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// Quick Actions View
function QuickActionsView({
  currentField,
  bloomsAnalysis,
  onQuickAction,
  isProcessing
}: {
  currentField: any;
  bloomsAnalysis: any;
  onQuickAction: (prompt: string) => void;
  isProcessing: boolean;
}) {
  const actions = [
    { icon: Target, label: 'Improve This', prompt: 'How can I improve this field?', color: 'blue' },
    { icon: TrendingUp, label: 'Elevate Level', prompt: 'Elevate to higher Bloom&apos;s level', color: 'purple' },
    { icon: BookOpen, label: 'Add Examples', prompt: 'Suggest practical examples', color: 'pink' },
    { icon: Sparkles, label: 'Generate Ideas', prompt: 'Generate creative ideas', color: 'indigo' },
  ];

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Context Card */}
      {currentField && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-700">Active Field</span>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {currentField.fieldName.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </p>
          {currentField.bloomsLevel && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-white rounded-full border">
              {currentField.bloomsLevel}
            </span>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h4 className="text-xs font-semibold text-gray-600 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onQuickAction(action.prompt)}
              disabled={isProcessing}
              className={`p-3 rounded-xl border-2 border-${action.color}-200 bg-gradient-to-br from-white to-${action.color}-50 hover:border-${action.color}-400 hover:shadow-md transition-all disabled:opacity-50 text-left group`}
            >
              <action.icon className={`w-5 h-5 text-${action.color}-600 mb-2 group-hover:scale-110 transition-transform`} />
              <p className="text-xs font-semibold text-gray-800">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Course Insights */}
      {bloomsAnalysis && (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border">
          <h4 className="text-xs font-semibold text-gray-600 mb-3">Course Health</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Cognitive Depth</span>
              <span className="text-sm font-bold text-blue-600">
                {bloomsAnalysis.courseLevel?.cognitiveDepth?.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${bloomsAnalysis.courseLevel?.cognitiveDepth || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Chat View
function ChatView({
  messages,
  isProcessing,
  messagesEndRef
}: {
  messages: Message[];
  isProcessing: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-3 bg-gray-50/30">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Sparkles className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Start a conversation with SAM</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white border shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))
      )}
      {isProcessing && (
        <div className="flex justify-start">
          <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-gray-500">Thinking...</span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

// Analyze View
function AnalyzeView({
  courseData,
  bloomsAnalysis,
  currentField
}: {
  courseData: any;
  bloomsAnalysis: any;
  currentField: any;
}) {
  const distribution = bloomsAnalysis?.courseLevel?.distribution || {};

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <h4 className="text-sm font-bold text-gray-800">Bloom&apos;s Distribution</h4>

      <div className="space-y-2">
        {Object.entries(distribution).map(([level, percentage]) => (
          <div key={level} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{level}</span>
              <span className="text-gray-500">{(percentage as number).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {bloomsAnalysis?.courseLevel?.balance && (
        <div className={`p-3 rounded-xl border-2 ${
          bloomsAnalysis.courseLevel.balance === 'well-balanced'
            ? 'bg-green-50 border-green-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <p className="text-xs font-semibold">
            {bloomsAnalysis.courseLevel.balance === 'well-balanced'
              ? '✓ Well-balanced course'
              : '⚠ Consider balancing cognitive levels'}
          </p>
        </div>
      )}
    </div>
  );
}

// Export hook for programmatic control
export function useFloatingSAM() {
  const { floatingSamOpen, setFloatingSamOpen } = useCourseCreation();

  return {
    isOpen: floatingSamOpen,
    open: () => setFloatingSamOpen(true),
    close: () => setFloatingSamOpen(false),
    toggle: () => setFloatingSamOpen(!floatingSamOpen),
  };
}
