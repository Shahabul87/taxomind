"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Bot, 
  User,
  Loader2,
  Brain,
  Target,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Sparkles,
  BarChart3,
  Clock,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  metadata?: {
    tokensUsed?: number;
    hasContext?: boolean;
    contextScore?: number;
  };
}

interface ContextAwareTutorProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  sectionTitle: string;
  chapterTitle: string;
  courseTitle: string;
}

interface TutorInsight {
  type: 'performance' | 'learning' | 'suggestion' | 'encouragement';
  title: string;
  description: string;
  icon: any;
  color: string;
}

export const ContextAwareTutor = ({ 
  courseId, 
  chapterId, 
  sectionId, 
  sectionTitle,
  chapterTitle,
  courseTitle
}: ContextAwareTutorProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "insights">("chat");
  const [tutorInsights, setTutorInsights] = useState<TutorInsight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with personalized welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: `Hello! I'm your AI tutor for **${courseTitle}**. I have access to your learning progress, performance data, and all the course materials for ${chapterTitle} - ${sectionTitle}.

I can help you with:
- Understanding concepts from this section
- Reviewing your performance patterns
- Providing personalized study recommendations
- Connecting topics to previous learning
- Preparing for assessments

What would you like to explore today?`,
        role: "assistant",
        timestamp: new Date(),
        metadata: {
          hasContext: true,
          contextScore: 85
        }
      };
      setMessages([welcomeMessage]);
      generateInitialInsights();
    }
  }, [courseTitle, chapterTitle, sectionTitle, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateInitialInsights = async () => {
    // Mock insights - in a real implementation, these would come from the API
    const insights: TutorInsight[] = [
      {
        type: 'performance',
        title: 'Strong Progress',
        description: 'You\'re performing well in understanding-level questions. Consider advancing to more analytical challenges.',
        icon: TrendingUp,
        color: 'text-green-600'
      },
      {
        type: 'learning',
        title: 'Study Pattern',
        description: 'Your performance is most consistent when you study in the evening. Consider scheduling important topics then.',
        icon: Clock,
        color: 'text-blue-600'
      },
      {
        type: 'suggestion',
        title: 'Review Recommendation',
        description: 'Based on your recent exam performance, reviewing the previous chapter on fundamentals could strengthen your foundation.',
        icon: Lightbulb,
        color: 'text-yellow-600'
      },
      {
        type: 'encouragement',
        title: 'Learning Velocity',
        description: 'Your learning pace has increased 23% this week. Great momentum!',
        icon: Zap,
        color: 'text-purple-600'
      }
    ];
    setTutorInsights(insights);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-tutor/context-aware', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          courseId,
          chapterId,
          sectionId,
          subject: courseTitle,
          learningStyle: 'adaptive'
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: data.id || Date.now().toString(),
        content: data.content,
        role: "assistant",
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

      // Show context awareness indicator
      if (data.metadata?.hasContext) {
        toast.success(`Context-aware response (${data.metadata.contextScore}% relevance)`);
      }

    } catch (error) {
      console.error('Error calling context-aware AI tutor:', error);
      toast.error('Failed to get response from AI tutor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const askAboutTopic = (topic: string) => {
    setInput(`Can you help me understand ${topic} from this section?`);
    setActiveTab("chat");
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mb-4 max-w-[85%]",
          isUser ? "ml-auto" : "mr-auto"
        )}
      >
        <div className={cn(
          "rounded-lg p-4",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              isUser 
                ? "bg-blue-500" 
                : "bg-gradient-to-r from-purple-500 to-blue-500"
            )}>
              {isUser ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Brain className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "prose prose-sm max-w-none",
                isUser ? "prose-invert" : "dark:prose-invert"
              )}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              {message.metadata?.hasContext && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Context-Aware
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {message.metadata.contextScore}% relevance
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={cn(
          "text-xs mt-1",
          "text-gray-500 dark:text-gray-400",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Context-Aware AI Tutor
              </CardTitle>
              <CardDescription>
                Personalized tutoring with full awareness of your learning journey
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Course Context
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Performance Data
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat with AI Tutor
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Learning Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card>
            <CardContent className="p-0">
              {/* Chat Area */}
              <div className="h-[500px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  <AnimatePresence>
                    {messages.map(renderMessage)}
                  </AnimatePresence>
                  {isLoading && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 my-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI tutor is analyzing your context and preparing a response...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => askAboutTopic("key concepts")}
                      className="text-xs"
                    >
                      Explain Key Concepts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => askAboutTopic("practical applications")}
                      className="text-xs"
                    >
                      Show Applications
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInput("Based on my performance, what should I focus on next?")}
                      className="text-xs"
                    >
                      Study Recommendations
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInput("Can you quiz me on this section?")}
                      className="text-xs"
                    >
                      Practice Questions
                    </Button>
                  </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything about this section or your learning progress..."
                      className="min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-4">
            {tutorInsights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        insight.type === 'performance' && "bg-green-100 dark:bg-green-900/20",
                        insight.type === 'learning' && "bg-blue-100 dark:bg-blue-900/20",
                        insight.type === 'suggestion' && "bg-yellow-100 dark:bg-yellow-900/20",
                        insight.type === 'encouragement' && "bg-purple-100 dark:bg-purple-900/20"
                      )}>
                        <insight.icon className={cn("w-5 h-5", insight.color)} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.description}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 p-0 h-auto text-purple-600 hover:text-purple-700"
                          onClick={() => {
                            setInput(`Tell me more about: ${insight.title}`);
                            setActiveTab("chat");
                          }}
                        >
                          Discuss with tutor →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Course Context Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-medium">Course Materials</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Videos, articles, notes</p>
                  </div>
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium">Performance Data</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Exam results, trends</p>
                  </div>
                  <div className="text-center">
                    <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="font-medium">Learning Goals</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Objectives, outcomes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};