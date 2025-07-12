"use client"

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Clock, 
  BookOpen,
  Send,
  Mic,
  Camera,
  FileText,
  Zap,
  Users,
  Award,
  Calendar,
  BarChart3,
  Lightbulb,
  Puzzle,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Settings,
  Download,
  Share,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  attachments?: string[];
}

interface LearningSession {
  id: string;
  subject: string;
  duration: string;
  progress: number;
  concepts: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export default function AiTutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your personal AI tutor. I can help you with personalized learning, answer questions, create study plans, and track your progress. What would you like to learn today?",
      timestamp: new Date(),
      suggestions: [
        "Create a study plan for machine learning",
        "Explain quantum computing concepts",
        "Help me prepare for my exam",
        "Review my progress this week"
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'chat' | 'voice' | 'visual'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSessions: LearningSession[] = [
    {
      id: '1',
      subject: 'Machine Learning Fundamentals',
      duration: '45 min',
      progress: 75,
      concepts: ['Neural Networks', 'Deep Learning', 'Backpropagation'],
      difficulty: 'Intermediate'
    },
    {
      id: '2',
      subject: 'Quantum Computing Basics',
      duration: '30 min',
      progress: 45,
      concepts: ['Qubits', 'Superposition', 'Entanglement'],
      difficulty: 'Advanced'
    },
    {
      id: '3',
      subject: 'Data Structures & Algorithms',
      duration: '60 min',
      progress: 90,
      concepts: ['Binary Trees', 'Graph Theory', 'Dynamic Programming'],
      difficulty: 'Intermediate'
    }
  ];

  const learningStats = [
    { label: 'Study Streak', value: '15 days', icon: Calendar, color: 'text-purple-400' },
    { label: 'Concepts Mastered', value: '127', icon: Award, color: 'text-blue-400' },
    { label: 'Hours This Week', value: '8.5h', icon: Clock, color: 'text-emerald-400' },
    { label: 'AI Accuracy', value: '96%', icon: Target, color: 'text-yellow-400' }
  ];

  const quickActions = [
    { icon: BookOpen, label: 'Start Study Session', action: 'study' },
    { icon: Puzzle, label: 'Practice Problems', action: 'practice' },
    { icon: BarChart3, label: 'View Analytics', action: 'analytics' },
    { icon: Lightbulb, label: 'Get Insights', action: 'insights' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
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
        type: 'ai',
        content: "I understand you're interested in this topic. Let me provide you with a comprehensive explanation and create a personalized learning path for you.",
        timestamp: new Date(),
        suggestions: [
          "Show me related concepts",
          "Create practice exercises",
          "Explain with examples",
          "Add to my study plan"
        ]
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 sm:pt-20">
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-emerald-900/20 py-12 sm:py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="inline-flex items-center space-x-2 bg-purple-500/10 rounded-full px-6 py-2 border border-purple-500/20 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">Enterprise AI Tutor</span>
          </motion.div>

          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white">Your Personal</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              AI Learning Assistant
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Experience next-generation learning with AI that understands your style, adapts to your pace, 
            and accelerates your mastery of any subject.
          </motion.p>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {learningStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-gray-400 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* AI Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl h-[500px] sm:h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">TaxoMind AI Tutor</h3>
                    <p className="text-sm text-gray-400">Online • Ready to help</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {(['chat', 'voice', 'visual'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedMode === mode 
                          ? 'bg-purple-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {mode === 'chat' && <MessageSquare className="w-4 h-4" />}
                      {mode === 'voice' && <Mic className="w-4 h-4" />}
                      {mode === 'visual' && <Camera className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                          : 'bg-slate-700/50 text-gray-200'
                      } rounded-2xl px-4 py-3`}>
                        <p className="text-sm">{message.content}</p>
                        {message.suggestions && (
                          <div className="mt-3 space-y-2">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="block w-full text-left text-xs bg-slate-600/50 hover:bg-slate-600 rounded-lg px-3 py-2 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-700/50 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-slate-700/50">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask me anything about your learning journey..."
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-xl px-6 py-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="flex flex-col items-center p-4 bg-slate-700/30 hover:bg-slate-600/30 rounded-xl transition-colors group"
                  >
                    <action.icon className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-gray-300 text-center">{action.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Active Learning Sessions */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">{session.subject}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                        session.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {session.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>{session.duration}</span>
                      <span>{session.progress}% complete</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2 mb-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${session.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {session.concepts.slice(0, 2).map((concept, index) => (
                        <span key={index} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                          {concept}
                        </span>
                      ))}
                      {session.concepts.length > 2 && (
                        <span className="text-xs text-gray-500">+{session.concepts.length - 2} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Insights */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">You learn best during morning sessions. Consider scheduling complex topics between 9-11 AM.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Your comprehension rate increased 25% this week. Great progress!</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Focus on data structures practice. This will unlock advanced algorithms.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
