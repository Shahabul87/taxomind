"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from '@/lib/logger';
import { 
  Bot, 
  Sparkles, 
  CheckCircle, 
  Loader2,
  Clock,
  Zap,
  Target,
  BookOpen,
  FileText,
  AlertCircle,
  PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StreamMessage {
  type: 'progress' | 'stage' | 'chapter' | 'section' | 'complete' | 'error';
  data: any;
  progress: number;
  message: string;
}

interface StreamingGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (blueprint: any) => void;
  onError?: () => void;
  formData: any;
}

interface GenerationStage {
  name: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
  details?: string;
  estimatedTime?: number;
}

export const StreamingGenerationModal = ({
  isOpen,
  onClose,
  onComplete,
  onError,
  formData
}: StreamingGenerationModalProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [stages, setStages] = useState<GenerationStage[]>([
    {
      name: 'Initialization',
      description: 'Starting AI analysis',
      icon: <PlayCircle className="h-4 w-4" />,
      completed: false,
      active: false
    },
    {
      name: 'AI Strategy',
      description: 'Analyzing requirements',
      icon: <Bot className="h-4 w-4" />,
      completed: false,
      active: false
    },
    {
      name: 'Course Structure',
      description: 'Building learning path',
      icon: <Target className="h-4 w-4" />,
      completed: false,
      active: false
    },
    {
      name: 'Chapter Generation',
      description: 'Creating detailed content',
      icon: <BookOpen className="h-4 w-4" />,
      completed: false,
      active: false
    },
    {
      name: 'Content Enhancement',
      description: 'Adding assessments',
      icon: <FileText className="h-4 w-4" />,
      completed: false,
      active: false
    },
    {
      name: 'Finalization',
      description: 'Completing blueprint',
      icon: <Sparkles className="h-4 w-4" />,
      completed: false,
      active: false
    }
  ]);
  
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [currentChapter, setCurrentChapter] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<any>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Helper functions - defined before handleStreamMessage to avoid hoisting issues
  const addToLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setGenerationLog(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const updateStageProgress = useCallback((stageName: string, details?: string) => {
    setStages(prev => prev.map(stage => {
      if (stage.name.toLowerCase().includes(stageName.toLowerCase())) {
        return { ...stage, active: true, details, completed: false };
      } else if (stage.active) {
        return { ...stage, active: false, completed: true };
      }
      return stage;
    }));
  }, []);

  const handleStreamMessage = useCallback((message: StreamMessage) => {
    switch (message.type) {
      case 'progress':
        setProgress(message.progress);
        setCurrentMessage(message.message);
        addToLog(`[${message.progress}%] ${message.message}`);
        break;
        
      case 'stage':
        updateStageProgress(message.data.stage, message.data.details);
        if (message.data.estimatedTimeRemaining) {
          setEstimatedTimeRemaining(message.data.estimatedTimeRemaining);
        }
        addToLog(`Stage: ${message.data.stage} - ${message.data.details}`);
        break;
        
      case 'chapter':
        setCurrentChapter(message.data);
        addToLog(`Generating Chapter ${message.data.chapterNumber}: ${message.data.chapterTitle}`);
        break;
        
      case 'section':
        setCurrentSection(message.data);
        addToLog(`Creating Section ${message.data.sectionNumber}: ${message.data.sectionTitle}`);
        break;
        
      case 'complete':
        setBlueprint(message.data);
        setIsGenerating(false);
        setProgress(100);
        setCurrentMessage('Course blueprint completed successfully!');
        
        // Mark all stages as completed
        setStages(prev => prev.map(stage => ({ ...stage, completed: true, active: false })));
        
        addToLog('✅ Course blueprint generation completed successfully!');
        toast.success("Course blueprint generated successfully!");
        
        if (onComplete) {
          onComplete(message.data);
        }
        break;
        
      case 'error':
        setError(message.data.error);
        setIsGenerating(false);
        addToLog(`❌ Error: ${message.data.error}`);
        toast.error("Failed to generate course blueprint");
        break;
    }
  }, [onComplete, addToLog, updateStageProgress]);

  const startGeneration = useCallback(async () => {
    if (!formData) {
      toast.error("Course requirements are missing");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setGenerationLog([]);
    setCurrentMessage('Initializing course generation...');
    
    // Reset stages
    setStages(prev => prev.map(stage => ({ ...stage, completed: false, active: false })));

    try {
      // Create EventSource for streaming
      const response = await fetch('/api/courses/generate-blueprint-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const message: StreamMessage = JSON.parse(line.slice(6));
              handleStreamMessage(message);
            } catch (parseError) {
              logger.error('Failed to parse stream message:', parseError);
            }
          }
        }
      }

    } catch (error) {
      logger.error('Streaming generation error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsGenerating(false);
    }
  }, [formData, handleStreamMessage]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [generationLog]);

  // Auto-start generation when modal opens
  useEffect(() => {
    if (isOpen && !isGenerating && !blueprint && !error) {
      const timer = setTimeout(() => {
        startGeneration();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isGenerating, blueprint, error, startGeneration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    onClose();
  };

  const getStageColor = (stage: GenerationStage) => {
    if (stage.completed) return 'text-green-600 dark:text-green-400';
    if (stage.active) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-400 dark:text-gray-600';
  };

  const getStageBackground = (stage: GenerationStage) => {
    if (stage.completed) return 'bg-green-100 dark:bg-green-900/20';
    if (stage.active) return 'bg-blue-100 dark:bg-blue-900/20';
    return 'bg-gray-50 dark:bg-gray-800/50';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <span className="text-xl font-semibold">AI Course Generation</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                Sam is creating your course blueprint with advanced AI
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Progress Overview */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <Badge variant="secondary">{progress}%</Badge>
              </div>
              {estimatedTimeRemaining > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  {formatTime(estimatedTimeRemaining)} remaining
                </div>
              )}
            </div>
            
            <Progress value={progress} className="h-3" />
            
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {currentMessage}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Activity */}
          {(currentChapter || currentSection) && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {currentChapter && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">
                        Chapter {currentChapter.chapterNumber} of {currentChapter.totalChapters}
                      </span>
                      {currentChapter.chapterTitle && (
                        <Badge variant="outline" className="text-xs">
                          {currentChapter.chapterTitle}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {currentSection && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Section {currentSection.sectionNumber}: {currentSection.sectionTitle}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[400px]">
            {/* Stages Progress */}
            <div className="space-y-3 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Generation Stages
              </h4>
              {stages.map((stage, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-200",
                    getStageBackground(stage)
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex-shrink-0", getStageColor(stage))}>
                      {stage.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : stage.active ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        stage.icon
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium", getStageColor(stage))}>
                          {stage.name}
                        </span>
                        {stage.active && (
                          <Zap className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {stage.details || stage.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generation Log */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Generation Log
              </h4>
              <div
                ref={logContainerRef}
                className="h-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 overflow-y-auto border"
              >
                <div className="space-y-1 font-mono text-xs">
                  {generationLog.map((log, index) => (
                    <div
                      key={index}
                      className={cn(
                        "text-gray-700 dark:text-gray-300",
                        log.includes('✅') && "text-green-600 dark:text-green-400",
                        log.includes('❌') && "text-red-600 dark:text-red-400",
                        log.includes('Stage:') && "text-blue-600 dark:text-blue-400 font-medium"
                      )}
                    >
                      {log}
                    </div>
                  ))}
                  
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI is working...</span>
              </>
            ) : blueprint ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Generation completed!</span>
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>Generation failed</span>
              </>
            ) : (
              <span>Ready to generate</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {error && !isGenerating && (
              <Button
                variant="outline"
                onClick={startGeneration}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Retry
              </Button>
            )}
            
            <Button
              variant={blueprint ? "default" : "outline"}
              onClick={handleClose}
              disabled={isGenerating}
            >
              {blueprint ? "Continue with Blueprint" : "Cancel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};