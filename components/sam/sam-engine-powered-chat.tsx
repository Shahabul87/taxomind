'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import { 
  Send, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  BookOpen,
  BarChart3,
  FileText,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SAMEnginePoweredChatProps {
  courseId?: string;
  initialMessage?: string;
}

export function SAMEnginePoweredChat({ 
  courseId, 
  initialMessage 
}: SAMEnginePoweredChatProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [showEngineInsights, setShowEngineInsights] = useState(true);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !session?.user) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/sam/chat-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          courseId,
          includeEngineInsights: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      // Add SAM's response
      const samMessage = {
        id: Date.now().toString() + '-sam',
        role: 'assistant',
        content: data.data.message,
        suggestions: data.data.suggestions || [],
        actions: data.data.actions || [],
        insights: data.data.insights || [],
        engineData: data.data.engineData || null,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, samMessage]);
      
      // Update active engines
      if (data.data.engineData) {
        const engines = [];
        if (data.data.engineData.marketAnalysis) engines.push('market');
        if (data.data.engineData.bloomsAnalysis) engines.push('blooms');
        if (data.data.engineData.courseGuide) engines.push('guide');
        if (data.data.engineData.learningProfile) engines.push('profile');
        setActiveEngines(engines);
      }

    } catch (error) {
      logger.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from SAM',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, courseId, toast]);

  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
    }
  }, [initialMessage, sendMessage]);

  const handleAction = (action: any) => {
    if (action.route && action.route !== null) {
      router.push(action.route);
    } else if (action.action) {
      action.action().then((result: any) => {
        toast({
          title: 'Action Completed',
          description: action.label,
        });
      });
    } else {
      // Route not implemented yet - show message
      toast({
        title: 'Feature Coming Soon',
        description: `${action.label} - This feature will be implemented soon.`,
      });
    }
  };

  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div
            className={`rounded-lg px-4 py-2 ${
              isUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>

          {/* Engine Insights */}
          {!isUser && message.engineData && showEngineInsights && (
            <div className="mt-2 space-y-2">
              {/* Active Engines */}
              <div className="flex gap-1">
                {message.engineData.marketAnalysis && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Market
                  </Badge>
                )}
                {message.engineData.bloomsAnalysis && (
                  <Badge variant="outline" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" />
                    Bloom&apos;s
                  </Badge>
                )}
                {message.engineData.courseGuide && (
                  <Badge variant="outline" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Guide
                  </Badge>
                )}
              </div>

              {/* Insights */}
              {message.insights && message.insights.length > 0 && (
                <Card className="mt-2">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    {message.insights.map((insight: any, index: number) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        {renderInsight(insight)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Suggestions */}
          {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.suggestions.map((suggestion: any, index: number) => (
                <Card key={index} className="p-2">
                  <p className="text-xs font-medium">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.description}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          {!isUser && message.actions && message.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.actions.map((action: any, index: number) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(action)}
                  className="text-xs"
                >
                  {action.label}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  const renderInsight = (insight: any) => {
    if (insight.type === 'progress' && insight.data) {
      return (
        <div className="space-y-1">
          <p>Bloom&apos;s Progress:</p>
          <div className="grid grid-cols-3 gap-1 text-xs">
            {Object.entries(insight.data).slice(0, 3).map(([level, score]) => (
              <div key={level}>
                <span className="font-medium">{level}:</span> {score}%
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (insight.type === 'metrics' && insight.data) {
      return (
        <div className="space-y-1">
          <p>Course Metrics:</p>
          <div className="text-xs">
            Depth: {insight.data.depth?.overallDepth || 0}% | 
            Engagement: {insight.data.engagement?.overallEngagement || 0}%
          </div>
        </div>
      );
    }

    return null;
  };

  const suggestedQuestions = [
    {
      text: "How am I doing in this course?",
      icon: BarChart3,
    },
    {
      text: "What should I focus on next?",
      icon: Brain,
    },
    {
      text: "How can I improve my course?",
      icon: TrendingUp,
    },
    {
      text: "Generate a practice exam",
      icon: FileText,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">SAM AI Assistant</h3>
          <Badge variant="secondary" className="text-xs">
            Engine Powered
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEngineInsights(!showEngineInsights)}
        >
          {showEngineInsights ? 'Hide' : 'Show'} Insights
        </Button>
      </div>

      {/* Active Engines Indicator */}
      {activeEngines.length > 0 && (
        <div className="px-4 py-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active Engines:</span>
            <div className="flex gap-1">
              {activeEngines.includes('market') && (
                <Badge variant="outline" className="text-xs">Market</Badge>
              )}
              {activeEngines.includes('blooms') && (
                <Badge variant="outline" className="text-xs">Bloom&apos;s</Badge>
              )}
              {activeEngines.includes('guide') && (
                <Badge variant="outline" className="text-xs">Guide</Badge>
              )}
              {activeEngines.includes('profile') && (
                <Badge variant="outline" className="text-xs">Profile</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Ask me anything! I have access to comprehensive insights about your learning and courses.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {suggestedQuestions.map((question, index) => {
                const Icon = question.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(question.text)}
                    className="text-xs justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {question.text}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SAM anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}