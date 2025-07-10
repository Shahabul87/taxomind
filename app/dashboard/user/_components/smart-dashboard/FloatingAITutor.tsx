"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, X, Sparkles, Send, 
  Lightbulb, BookOpen, Target, Clock,
  Brain, Zap, HelpCircle, Minimize2,
  Maximize2, Volume2, VolumeX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "next-auth";

interface FloatingAITutorProps {
  user: User;
}

interface Message {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  action: string;
}

interface AIPersonality {
  name: string;
  avatar: string;
  description: string;
  specialties: string[];
}

export function FloatingAITutor({ user }: FloatingAITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [aiPersonality] = useState<AIPersonality>({
    name: "Aria",
    avatar: "/avatars/ai-tutor.jpg",
    description: "Your AI Learning Assistant",
    specialties: ["Programming", "Web Development", "Learning Strategy", "Career Guidance"]
  });

  const [quickActions] = useState<QuickAction[]>([
    {
      id: "1",
      label: "Explain Concept",
      icon: Lightbulb,
      color: "text-yellow-600",
      action: "explain"
    },
    {
      id: "2",
      label: "Practice Quiz",
      icon: Target,
      color: "text-blue-600",
      action: "quiz"
    },
    {
      id: "3",
      label: "Study Plan",
      icon: Clock,
      color: "text-green-600",
      action: "plan"
    },
    {
      id: "4",
      label: "Debug Code",
      icon: Brain,
      color: "text-purple-600",
      action: "debug"
    }
  ]);

  const [contextualSuggestions] = useState([
    "How can I improve my React skills?",
    "What should I learn next?",
    "Help me understand hooks better",
    "Create a study schedule for me",
    "Review my progress"
  ]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      type: "ai",
      content: `Hi ${user.name?.split(' ')[0]}! I'm Aria, your AI learning assistant. I'm here to help you with your learning journey. What would you like to work on today?`,
      timestamp: new Date(),
      suggestions: contextualSuggestions.slice(0, 3)
    };
    setMessages([welcomeMessage]);
  }, [user.name]);

  // Auto-open based on user activity (simulate)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && Math.random() > 0.7) {
        setIsOpen(true);
        const proactiveMessage: Message = {
          id: `proactive-${Date.now()}`,
          type: "ai",
          content: "I noticed you've been working on React. Would you like me to quiz you on what you've learned so far?",
          timestamp: new Date(),
          suggestions: ["Yes, quiz me!", "Not right now", "Show me my progress instead"]
        };
        setMessages(prev => [...prev, proactiveMessage]);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: generateAIResponse(inputMessage),
        timestamp: new Date(),
        suggestions: generateSuggestions(inputMessage)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes("react")) {
      return "Great question about React! React is a powerful JavaScript library for building user interfaces. The key concepts to master are components, state, props, and hooks. Would you like me to explain any of these in detail or create a practice exercise?";
    }
    
    if (lowerInput.includes("help") || lowerInput.includes("stuck")) {
      return "I'm here to help! Can you tell me more about what you're working on? Are you dealing with a specific coding problem, concept you don't understand, or need guidance on your learning path?";
    }
    
    if (lowerInput.includes("quiz") || lowerInput.includes("test")) {
      return "Perfect! Let's test your knowledge. Based on your recent learning, I'll create a quick quiz for you. What topic would you like to focus on - JavaScript fundamentals, React concepts, or general programming principles?";
    }
    
    if (lowerInput.includes("schedule") || lowerInput.includes("plan")) {
      return "I can help you create a personalized study schedule! Based on your goals and current progress, I recommend studying for 30-45 minutes daily. Should we focus on completing your current React course first, or would you like to mix in some practice projects?";
    }
    
    return "That's an interesting question! I'm here to help you learn and grow. Can you provide more details about what you're trying to accomplish? I can assist with explanations, practice exercises, study planning, or debugging.";
  };

  const generateSuggestions = (input: string): string[] => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes("react")) {
      return ["Explain React hooks", "Create a React quiz", "Show React best practices"];
    }
    
    if (lowerInput.includes("quiz")) {
      return ["Start JavaScript quiz", "Test my React knowledge", "Practice coding problems"];
    }
    
    if (lowerInput.includes("schedule")) {
      return ["Create daily study plan", "Set learning goals", "Track my progress"];
    }
    
    return ["Ask another question", "Get practice exercises", "Review my progress"];
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    handleSendMessage();
  };

  const handleQuickAction = (action: string) => {
    let message = "";
    switch (action) {
      case "explain":
        message = "Can you explain a concept I'm struggling with?";
        break;
      case "quiz":
        message = "I'd like to take a practice quiz";
        break;
      case "plan":
        message = "Help me create a study plan";
        break;
      case "debug":
        message = "I need help debugging my code";
        break;
      default:
        message = "How can you help me today?";
    }
    setInputMessage(message);
    handleSendMessage();
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className="relative">
                <MessageCircle className="w-7 h-7 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className={`w-96 shadow-2xl border-0 bg-slate-800/95 backdrop-blur-sm ${
              isMinimized ? 'h-20' : 'h-[600px]'
            } transition-all duration-300`}>
              <CardHeader className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-white/20">
                      <AvatarImage src={aiPersonality.avatar} />
                      <AvatarFallback className="bg-white/20 text-white">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{aiPersonality.name}</h3>
                      <p className="text-xs text-white/80">{aiPersonality.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="w-8 h-8 p-0 text-white/80 hover:text-white hover:bg-white/10"
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="w-8 h-8 p-0 text-white/80 hover:text-white hover:bg-white/10"
                    >
                      {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 p-0 text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
                  {/* Quick Actions */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action) => {
                        const ActionIcon = action.icon;
                        return (
                          <Button
                            key={action.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickAction(action.action)}
                            className="h-8 px-2 text-xs hover:bg-slate-800/60"
                          >
                            <ActionIcon className={`w-3 h-3 mr-1 ${action.color}`} />
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] ${
                          message.type === "user" 
                            ? "bg-purple-600 text-white" 
                            : "bg-slate-800/60 text-white"
                        } rounded-lg p-3`}>
                          <p className="text-sm">{message.content}</p>
                          
                          {/* Suggestions */}
                          {message.suggestions && showSuggestions && (
                            <div className="mt-3 space-y-2">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="w-full text-left justify-start h-auto py-1 px-2 text-xs bg-white/10 hover:bg-white/20"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-slate-800/60 rounded-lg p-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Ask me anything..."
                        className="flex-1 h-9 text-sm"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim()}
                        size="sm"
                        className="h-9 px-3 bg-purple-600 hover:bg-purple-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>Powered by AI</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="h-6 px-2 text-xs"
                      >
                        {showSuggestions ? "Hide" : "Show"} suggestions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}