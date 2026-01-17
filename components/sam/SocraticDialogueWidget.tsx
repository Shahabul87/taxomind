"use client";

/**
 * SocraticDialogueWidget
 *
 * Dashboard widget for Socratic teaching dialogues with SAM AI.
 * Uses the useSAMSocraticDialogue hook from @sam-ai/react package.
 *
 * The Socratic method teaches through guided questioning, helping
 * students discover insights rather than being told answers directly.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useSAMSocraticDialogue } from "@sam-ai/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Loader2,
  Lightbulb,
  Send,
  SkipForward,
  X,
  Sparkles,
  Brain,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  RotateCcw,
} from "lucide-react";

interface SocraticDialogueWidgetProps {
  courseId?: string;
  sectionId?: string;
  defaultTopic?: string;
  compact?: boolean;
  className?: string;
}

type DialogueStyle = "gentle" | "challenging" | "balanced";

interface DialogueMessage {
  id: string;
  type: "question" | "response" | "feedback" | "insight";
  content: string;
  timestamp: Date;
}

export function SocraticDialogueWidget({
  courseId,
  sectionId,
  defaultTopic = "",
  compact = false,
  className = "",
}: SocraticDialogueWidgetProps) {
  const user = useCurrentUser();
  const [topic, setTopic] = useState(defaultTopic);
  const [style, setStyle] = useState<DialogueStyle>("balanced");
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    dialogue,
    currentQuestion,
    isActive,
    isWaiting,
    isComplete,
    discoveredInsights,
    progress,
    feedback,
    encouragement,
    availableHints,
    error,
    startDialogue,
    submitResponse,
    requestHint,
    skipQuestion,
    endDialogue,
    resetDialogue,
  } = useSAMSocraticDialogue({
    userId: user?.id,
    courseId,
    sectionId,
    preferredStyle: style,
    onDialogueStart: (newDialogue) => {
      console.log("Dialogue started:", newDialogue.topic);
    },
    onQuestion: (question) => {
      setMessages((prev) => [
        ...prev,
        {
          id: question.id,
          type: "question",
          content: question.question,
          timestamp: new Date(),
        },
      ]);
    },
    onInsightDiscovered: (insight) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `insight-${Date.now()}`,
          type: "insight",
          content: insight,
          timestamp: new Date(),
        },
      ]);
    },
    onDialogueComplete: (performance) => {
      console.log("Dialogue complete:", performance);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStartDialogue = useCallback(async () => {
    if (!topic.trim()) return;

    setMessages([]);
    const response = await startDialogue(topic.trim(), {
      targetBloomsLevel: "ANALYZE",
    });

    if (response?.question) {
      setMessages([
        {
          id: response.question.id,
          type: "question",
          content: response.question.question,
          timestamp: new Date(),
        },
      ]);
    }
  }, [topic, startDialogue]);

  const handleSubmitResponse = useCallback(async () => {
    if (!userInput.trim()) return;

    // Add user response to messages
    setMessages((prev) => [
      ...prev,
      {
        id: `response-${Date.now()}`,
        type: "response",
        content: userInput.trim(),
        timestamp: new Date(),
      },
    ]);

    const input = userInput.trim();
    setUserInput("");

    const response = await submitResponse(input);

    // Add feedback if provided
    if (response?.feedback) {
      setMessages((prev) => [
        ...prev,
        {
          id: `feedback-${Date.now()}`,
          type: "feedback",
          content: response.feedback || "",
          timestamp: new Date(),
        },
      ]);
    }
  }, [userInput, submitResponse]);

  const handleGetHint = useCallback(async () => {
    const hint = await requestHint();
    if (hint) {
      setMessages((prev) => [
        ...prev,
        {
          id: `hint-${Date.now()}`,
          type: "feedback",
          content: `💡 Hint: ${hint}`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [requestHint]);

  const handleSkipQuestion = useCallback(async () => {
    await skipQuestion();
  }, [skipQuestion]);

  const handleEndDialogue = useCallback(async () => {
    const result = await endDialogue();
    if (result?.synthesis) {
      setMessages((prev) => [
        ...prev,
        {
          id: `synthesis-${Date.now()}`,
          type: "feedback",
          content: `📝 Summary: ${result.synthesis}`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [endDialogue]);

  const handleReset = useCallback(() => {
    resetDialogue();
    setMessages([]);
    setUserInput("");
  }, [resetDialogue]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmitResponse();
      }
    },
    [handleSubmitResponse]
  );

  if (compact) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            Socratic Dialogue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isActive ? (
            <div className="space-y-2">
              <p className="text-sm font-medium line-clamp-2">
                {currentQuestion?.question || "Thinking..."}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress: {Math.round(progress)}%</span>
                <span>{discoveredInsights.length} insights</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Learn through guided questioning with SAM AI
              </p>
              <Button size="sm" onClick={() => setTopic("Let&apos;s explore a topic")} className="w-full">
                <Brain className="mr-2 h-3 w-3" />
                Start Dialogue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-500" />
          Socratic Dialogue
          {isActive && (
            <Badge variant="outline" className="ml-auto">
              <Sparkles className="mr-1 h-3 w-3" />
              {discoveredInsights.length} insights
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Topic Selection (when not active) */}
        {!isActive && !isComplete && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                What would you like to explore?
              </label>
              <Input
                placeholder="Enter a topic (e.g., Why do we need async/await in JavaScript?)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Dialogue Style</label>
                <Select value={style} onValueChange={(v) => setStyle(v as DialogueStyle)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gentle">
                      <span className="flex items-center gap-2">
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                        Gentle
                      </span>
                    </SelectItem>
                    <SelectItem value="balanced">
                      <span className="flex items-center gap-2">
                        <Brain className="h-3 w-3 text-blue-500" />
                        Balanced
                      </span>
                    </SelectItem>
                    <SelectItem value="challenging">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        Challenging
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleStartDialogue}
                  disabled={isWaiting || !topic.trim()}
                  className="w-full"
                >
                  {isWaiting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Begin Dialogue
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 The Socratic method helps you discover knowledge through guided questions
              rather than direct answers.
            </p>
          </div>
        )}

        {/* Active Dialogue */}
        {(isActive || isComplete) && (
          <>
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <Progress value={progress} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Encouragement */}
            {encouragement && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
                {encouragement}
              </div>
            )}

            {/* Chat Area */}
            <ScrollArea className="flex-1 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900" ref={scrollRef}>
              <div className="space-y-3 min-h-[200px]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "response" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.type === "question"
                          ? "bg-white shadow-sm dark:bg-slate-800"
                          : message.type === "response"
                            ? "bg-emerald-500 text-white"
                            : message.type === "insight"
                              ? "border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                              : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      {message.type === "question" && (
                        <div className="mb-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <Brain className="h-3 w-3" />
                          SAM AI
                        </div>
                      )}
                      {message.type === "insight" && (
                        <div className="mb-1 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                          <Lightbulb className="h-3 w-3" />
                          Insight Discovered
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isWaiting && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            {!isComplete && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Share your thoughts..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isWaiting}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={isWaiting || !userInput.trim()}
                    size="icon"
                  >
                    {isWaiting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetHint}
                    disabled={isWaiting || availableHints.length === 0}
                    className="flex-1"
                  >
                    <Lightbulb className="mr-2 h-3 w-3" />
                    Hint ({availableHints.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkipQuestion}
                    disabled={isWaiting}
                    className="flex-1"
                  >
                    <SkipForward className="mr-2 h-3 w-3" />
                    Skip
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndDialogue}
                    disabled={isWaiting}
                  >
                    <X className="mr-2 h-3 w-3" />
                    End
                  </Button>
                </div>
              </div>
            )}

            {/* Completion State */}
            {isComplete && (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    Dialogue Complete!
                  </span>
                </div>
                {discoveredInsights.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Key Insights:</p>
                    <ul className="space-y-1">
                      {discoveredInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="mt-0.5 h-3 w-3 text-yellow-500" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button onClick={handleReset} className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start New Dialogue
                </Button>
              </div>
            )}

            {/* Current Feedback */}
            {feedback && !isComplete && (
              <div className="rounded-lg border bg-slate-100 p-2 text-sm dark:bg-slate-800">
                {feedback}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SocraticDialogueWidget;
