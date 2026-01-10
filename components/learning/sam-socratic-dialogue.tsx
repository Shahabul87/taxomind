"use client";

/**
 * SAM Socratic Dialogue Component
 *
 * Interactive AI tutor using Socratic questioning method.
 * Features:
 * - Strategic questioning based on Socratic method
 * - Response analysis for understanding
 * - Progressive dialogue with insight tracking
 * - Hints and encouragement system
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Send,
  Lightbulb,
  Brain,
  Sparkles,
  CheckCircle2,
  Target,
  Trophy,
  HelpCircle,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import { useSAMSocraticDialogue } from "@sam-ai/react";
import type { BloomsLevel } from "@sam-ai/core";

interface SAMSocraticDialogueProps {
  topic: string;
  userId: string;
  learningObjective?: string;
  targetBloomsLevel?: BloomsLevel;
  onComplete?: (performance: { insightRate: number; avgQuality: number }) => void;
}

interface Message {
  id: string;
  role: "tutor" | "student";
  content: string;
  timestamp: Date;
  type?: "question" | "response" | "feedback" | "hint" | "synthesis";
  insights?: string[];
}

export function SAMSocraticDialogue({
  topic,
  userId,
  learningObjective,
  targetBloomsLevel = "ANALYZE",
  onComplete,
}: SAMSocraticDialogueProps) {
  const {
    dialogue,
    currentQuestion,
    isActive,
    isWaiting,
    isComplete,
    lastResponse,
    progress,
    discoveredInsights,
    feedback,
    startDialogue,
    submitResponse,
    requestHint,
    endDialogue,
    resetDialogue,
  } = useSAMSocraticDialogue({ userId });

  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update messages when dialogue state changes
  useEffect(() => {
    if (currentQuestion && !messages.find(m => m.content === currentQuestion.question)) {
      setMessages(prev => [...prev, {
        id: currentQuestion.id,
        role: "tutor",
        content: currentQuestion.question,
        timestamp: new Date(),
        type: "question",
      }]);
    }
  }, [currentQuestion, messages]);

  // Update messages when feedback is received
  useEffect(() => {
    if (feedback && lastResponse) {
      const feedbackId = `feedback_${Date.now()}`;
      if (!messages.find(m => m.id === feedbackId)) {
        setMessages(prev => [...prev, {
          id: feedbackId,
          role: "tutor",
          content: feedback,
          timestamp: new Date(),
          type: "feedback",
          insights: lastResponse.discoveredInsights,
        }]);
      }
    }
  }, [feedback, lastResponse, messages]);

  // Start dialogue
  const handleStart = useCallback(async () => {
    setMessages([]);
    await startDialogue(topic, {
      learningObjective,
      targetBloomsLevel,
    });
  }, [startDialogue, topic, learningObjective, targetBloomsLevel]);

  // Submit response
  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isWaiting) return;

    // Add student message
    setMessages(prev => [...prev, {
      id: `student_${Date.now()}`,
      role: "student",
      content: inputValue,
      timestamp: new Date(),
      type: "response",
    }]);

    const response = inputValue;
    setInputValue("");

    await submitResponse(response);
  }, [inputValue, isWaiting, submitResponse]);

  // Request hint
  const handleHint = useCallback(async () => {
    const hint = await requestHint();
    if (hint) {
      setMessages(prev => [...prev, {
        id: `hint_${Date.now()}`,
        role: "tutor",
        content: hint,
        timestamp: new Date(),
        type: "hint",
      }]);
    }
  }, [requestHint]);

  // End dialogue
  const handleEnd = useCallback(async () => {
    const result = await endDialogue();
    if (result) {
      setMessages(prev => [...prev, {
        id: `synthesis_${Date.now()}`,
        role: "tutor",
        content: result.synthesis,
        timestamp: new Date(),
        type: "synthesis",
      }]);
      onComplete?.({
        insightRate: result.performance.insightDiscoveryRate,
        avgQuality: result.performance.averageQuality,
      });
    }
  }, [endDialogue, onComplete]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Initial state - not started
  if (!dialogue && messages.length === 0) {
    return (
      <Card className="w-full min-h-[350px] border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Socratic Dialogue</CardTitle>
          <CardDescription className="text-base">
            Explore <span className="font-medium text-indigo-600 dark:text-indigo-400">{topic}</span> through
            guided discovery with SAM AI
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            SAM will guide you through thought-provoking questions to help you discover key insights
            about the topic on your own.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="bg-white dark:bg-slate-800">
              <Target className="w-3 h-3 mr-1" />
              {targetBloomsLevel.toLowerCase()} level
            </Badge>
            <Badge variant="outline" className="bg-white dark:bg-slate-800">
              <Brain className="w-3 h-3 mr-1" />
              Discovery learning
            </Badge>
          </div>

          <Button
            onClick={handleStart}
            disabled={isWaiting}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            size="lg"
          >
            {isWaiting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Start Dialogue
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Dialogue complete
  if (isComplete) {
    return (
      <Card className="w-full min-h-[350px]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">Dialogue Complete!</CardTitle>
          <CardDescription>
            Excellent exploration of {topic}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Insights discovered */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Insights Discovered
            </h4>
            <ul className="space-y-2">
              {discoveredInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          {/* Progress summary */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
              <p className="text-3xl font-bold text-green-600">{Math.round(progress)}%</p>
              <p className="text-sm text-muted-foreground">Progress</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <p className="text-3xl font-bold text-purple-600">{discoveredInsights.length}</p>
              <p className="text-sm text-muted-foreground">Insights</p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => { resetDialogue(); setMessages([]); }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button
              onClick={handleStart}
              className="bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              New Topic
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active dialogue
  return (
    <Card className="w-full flex flex-col h-[600px]">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-indigo-200">
              <AvatarImage src="/sam-avatar.png" alt="SAM" />
              <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <Brain className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">SAM Socratic Tutor</CardTitle>
              <CardDescription className="text-sm">
                Exploring: {topic}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={cn(
            dialogue?.state === "exploration" && "bg-blue-50 text-blue-600",
            dialogue?.state === "challenge" && "bg-orange-50 text-orange-600",
            dialogue?.state === "synthesis" && "bg-purple-50 text-purple-600",
          )}>
            {dialogue?.state || "Starting"}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress toward insights</span>
            <span>{discoveredInsights.length} insights discovered</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <Separator />

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "student" && "flex-row-reverse"
              )}
            >
              {message.role === "tutor" && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs">
                    <Brain className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.role === "tutor" && "bg-slate-100 dark:bg-slate-800",
                message.role === "student" && "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
                message.type === "hint" && "bg-amber-50 dark:bg-amber-950/30 border border-amber-200",
                message.type === "synthesis" && "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border",
              )}>
                {message.type === "hint" && (
                  <div className="flex items-center gap-1 text-amber-600 text-xs mb-1">
                    <Lightbulb className="w-3 h-3" />
                    <span>Hint</span>
                  </div>
                )}
                {message.type === "synthesis" && (
                  <div className="flex items-center gap-1 text-purple-600 text-xs mb-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Summary</span>
                  </div>
                )}
                <p className={cn(
                  "text-sm",
                  message.type === "hint" && "text-amber-800 dark:text-amber-200"
                )}>
                  {message.content}
                </p>

                {/* Show discovered insights */}
                {message.insights && message.insights.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <div className="flex items-center gap-1 text-green-600 text-xs mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Insight discovered!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isWaiting && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs">
                  <Brain className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Input area */}
      <CardFooter className="p-4 flex-shrink-0">
        <div className="w-full space-y-3">
          {/* Hint button */}
          {currentQuestion && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHint}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Need a hint?
            </Button>
          )}

          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isWaiting || isComplete}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isWaiting}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* End dialogue button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEnd}
              className="text-muted-foreground"
            >
              End Dialogue
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
