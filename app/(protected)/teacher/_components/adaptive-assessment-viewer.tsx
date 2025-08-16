"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logger } from '@/lib/logger';
import { 
  Brain, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  RefreshCw, 
  Send, 
  Zap, 
  Award, 
  Heart, 
  Eye, 
  BarChart3, 
  BookOpen, 
  Sparkles,
  Timer,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ChevronLeft,
  Gauge,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdaptiveAssessmentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  studentId: string;
  subject: string;
  topic: string;
  difficulty: string;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: number;
  bloomsLevel: string;
  timeEstimate: number;
  hints?: string[];
  adaptiveLevel: string;
  isAdaptive: boolean;
  feedback?: {
    correct: string;
    incorrect: string;
    partial: string;
  };
}

interface StudentResponse {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  confidence: number;
  hintsUsed: number;
  timestamp: Date;
}

interface AdaptiveMetrics {
  currentDifficulty: string;
  accuracyRate: number;
  averageTime: number;
  confidenceLevel: number;
  masteryLevel: number;
  recommendedActions: string[];
  nextDifficulty: string;
  strengthAreas: string[];
  improvementAreas: string[];
}

export function AdaptiveAssessmentViewer({ 
  isOpen, 
  onClose, 
  assessmentId, 
  studentId, 
  subject, 
  topic, 
  difficulty 
}: AdaptiveAssessmentViewerProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [adaptiveMetrics, setAdaptiveMetrics] = useState<AdaptiveMetrics | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResponse, setLastResponse] = useState<StudentResponse | null>(null);

  const generateNextQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sam/ai-tutor/assessment-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adaptive_question',
          subject,
          topic,
          difficulty,
          existingQuestions: studentResponses.map(r => r.questionId),
          studentResponses,
          adaptiveSettings: {
            personalizedLearning: true,
            difficultyAdjustment: true,
            masteryThreshold: 0.8,
            strugglingThreshold: 0.5
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentQuestion(data.result.question);
        setAdaptiveMetrics(data.result.adaptiveMetadata);
        setStartTime(new Date());
        setCurrentAnswer('');
        setSelectedOption('');
        setConfidence(50);
        setShowHints(false);
        setHintsUsed(0);
        setShowFeedback(false);
      } else {
        throw new Error('Failed to generate question');
      }
    } catch (error: any) {
      logger.error('Error generating question:', error);
      toast.error('Failed to generate next question');
    } finally {
      setIsLoading(false);
    }
  }, [subject, topic, difficulty, studentResponses]);

  const initializeAssessment = useCallback(async () => {
    setIsLoading(true);
    try {
      // Start with the first adaptive question
      await generateNextQuestion();
    } catch (error: any) {
      logger.error('Error initializing assessment:', error);
      toast.error('Failed to initialize assessment');
    } finally {
      setIsLoading(false);
    }
  }, [generateNextQuestion]);

  // Initialize assessment
  useEffect(() => {
    if (isOpen && assessmentId) {
      initializeAssessment();
    }
  }, [isOpen, assessmentId, initializeAssessment]);

  const checkAnswer = useCallback(async (answer: string, question: Question): Promise<boolean> => {
    // For short answer and essay questions, use AI to check the answer
    try {
      const response = await fetch('/api/sam/ai-tutor/assessment-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_answer',
          question,
          answer,
          subject,
          topic
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.result.isCorrect;
      }
    } catch (error: any) {
      logger.error('Error checking answer:', error);
    }
    
    return false;
  }, [subject, topic]);

  const shouldContinueAssessment = useCallback((analysis: any): boolean => {
    // Continue if we haven't reached mastery or if we need more data
    const totalQuestions = studentResponses.length + 1;
    
    if (totalQuestions >= 10) return false; // Max questions limit
    if (analysis.masteryLevel >= 0.8 && totalQuestions >= 5) return false; // Mastery achieved
    if (analysis.strugglingLevel >= 0.8 && totalQuestions >= 8) return false; // Too many struggling
    
    return true; // Continue assessment
  }, [studentResponses.length]);

  const submitAnswer = useCallback(async () => {
    if (!currentQuestion || !startTime) return;

    setIsSubmitting(true);
    try {
      const answer = currentQuestion.type === 'multiple_choice' ? selectedOption : currentAnswer;
      if (!answer.trim()) {
        toast.error('Please provide an answer');
        return;
      }

      const timeSpent = (new Date().getTime() - startTime.getTime()) / 1000;
      const isCorrect = currentQuestion.type === 'multiple_choice' 
        ? answer === currentQuestion.correctAnswer
        : await checkAnswer(answer, currentQuestion);

      const newResponse: StudentResponse = {
        questionId: currentQuestion.id,
        answer,
        isCorrect,
        timeSpent,
        confidence,
        hintsUsed,
        timestamp: new Date()
      };

      setStudentResponses(prev => [...prev, newResponse]);
      setLastResponse(newResponse);

      // Show immediate feedback
      setShowFeedback(true);

      // Analyze responses and provide feedback
      const response = await fetch('/api/sam/ai-tutor/assessment-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_responses',
          studentResponses: [...studentResponses, newResponse],
          assessmentData: {
            subject,
            topic,
            difficulty,
            currentQuestion
          }
        })
      });

      if (response.ok) {
        const analysisData = await response.json();
        // Update adaptive metrics based on analysis
        setAdaptiveMetrics(prev => ({
          ...prev,
          ...analysisData.result.performanceMetrics,
          recommendedActions: analysisData.result.recommendations
        }));

        // Check if assessment should continue
        if (shouldContinueAssessment(analysisData.result)) {
          // Generate next question after a short delay
          setTimeout(() => {
            generateNextQuestion();
          }, 3000);
        } else {
          setIsComplete(true);
        }
      }
    } catch (error: any) {
      logger.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQuestion, startTime, selectedOption, currentAnswer, confidence, hintsUsed, studentResponses, subject, topic, difficulty, checkAnswer, generateNextQuestion, shouldContinueAssessment]);

  const useHint = useCallback(() => {
    if (currentQuestion?.hints && hintsUsed < currentQuestion.hints.length) {
      setHintsUsed(prev => prev + 1);
      setShowHints(true);
    }
  }, [currentQuestion, hintsUsed]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      case 'expert': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getBloomsColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'knowledge': return 'bg-blue-100 text-blue-800';
      case 'comprehension': return 'bg-green-100 text-green-800';
      case 'application': return 'bg-yellow-100 text-yellow-800';
      case 'analysis': return 'bg-orange-100 text-orange-800';
      case 'synthesis': return 'bg-purple-100 text-purple-800';
      case 'evaluation': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getDifficultyColor(currentQuestion.adaptiveLevel)}>
              {currentQuestion.adaptiveLevel}
            </Badge>
            <Badge variant="outline" className={getBloomsColor(currentQuestion.bloomsLevel)}>
              {currentQuestion.bloomsLevel}
            </Badge>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Timer className="w-4 h-4" />
              <span>{currentQuestion.timeEstimate} min</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">AI Adaptive</span>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === 'multiple_choice' && (
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'short_answer' && (
              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Enter your answer..."
                rows={3}
              />
            )}

            {currentQuestion.type === 'essay' && (
              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Write your essay response..."
                rows={6}
              />
            )}

            {/* Confidence Slider */}
            <div className="mt-4 space-y-2">
              <Label>How confident are you in your answer?</Label>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Not confident</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">Very confident</span>
              </div>
              <div className="text-center text-sm font-medium">{confidence}%</div>
            </div>
          </CardContent>
        </Card>

        {/* Hints */}
        {currentQuestion.hints && currentQuestion.hints.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <span>Hints Available</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={useHint}
                  disabled={hintsUsed >= currentQuestion.hints.length}
                >
                  Use Hint ({hintsUsed}/{currentQuestion.hints.length})
                </Button>
              </div>
            </CardHeader>
            {showHints && hintsUsed > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {currentQuestion.hints.slice(0, hintsUsed).map((hint, index) => (
                    <div key={index} className="p-2 bg-yellow-100 rounded text-sm">
                      <strong>Hint {index + 1}:</strong> {hint}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Question {studentResponses.length + 1}</span>
            <span>•</span>
            <span>Started {startTime?.toLocaleTimeString()}</span>
          </div>
          <Button 
            onClick={submitAnswer}
            disabled={isSubmitting || (!selectedOption && !currentAnswer.trim())}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Answer
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderFeedback = () => {
    if (!showFeedback || !lastResponse || !currentQuestion) return null;

    return (
      <Card className={cn(
        "border-2",
        lastResponse.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {lastResponse.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{lastResponse.isCorrect ? 'Correct!' : 'Not quite right'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{lastResponse.timeSpent.toFixed(1)}s</span>
              </div>
              <div className="flex items-center space-x-1">
                <Gauge className="w-4 h-4" />
                <span>{lastResponse.confidence}% confident</span>
              </div>
              {lastResponse.hintsUsed > 0 && (
                <div className="flex items-center space-x-1">
                  <Lightbulb className="w-4 h-4" />
                  <span>{lastResponse.hintsUsed} hints used</span>
                </div>
              )}
            </div>
            
            {currentQuestion.explanation && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-semibold mb-2">Explanation:</h4>
                <p className="text-sm">{currentQuestion.explanation}</p>
              </div>
            )}

            {currentQuestion.feedback && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-semibold mb-2">Feedback:</h4>
                <p className="text-sm">
                  {lastResponse.isCorrect 
                    ? currentQuestion.feedback.correct 
                    : currentQuestion.feedback.incorrect
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAdaptiveMetrics = () => {
    if (!adaptiveMetrics) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Your Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{adaptiveMetrics.accuracyRate.toFixed(0)}%</div>
                <p className="text-sm text-gray-600">Accuracy</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{adaptiveMetrics.masteryLevel.toFixed(0)}%</div>
                <p className="text-sm text-gray-600">Mastery</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Current Difficulty:</span>
                <Badge variant="outline" className={getDifficultyColor(adaptiveMetrics.currentDifficulty)}>
                  {adaptiveMetrics.currentDifficulty}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Average Time:</span>
                <span>{adaptiveMetrics.averageTime.toFixed(1)}s per question</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Confidence Level:</span>
                <span>{adaptiveMetrics.confidenceLevel.toFixed(0)}%</span>
              </div>
            </div>

            {adaptiveMetrics.strengthAreas.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Strengths:</span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {adaptiveMetrics.strengthAreas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {adaptiveMetrics.improvementAreas.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center space-x-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>Focus Areas:</span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {adaptiveMetrics.improvementAreas.map((area, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCompletionSummary = () => {
    if (!isComplete) return null;

    const totalQuestions = studentResponses.length;
    const correctAnswers = studentResponses.filter(r => r.isCorrect).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const averageTime = studentResponses.reduce((sum, r) => sum + r.timeSpent, 0) / totalQuestions;
    const averageConfidence = studentResponses.reduce((sum, r) => sum + r.confidence, 0) / totalQuestions;

    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-green-600" />
            <span>Assessment Complete!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                <p className="text-sm text-gray-600">Correct</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{accuracy.toFixed(0)}%</div>
                <p className="text-sm text-gray-600">Accuracy</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{averageTime.toFixed(1)}s</div>
                <p className="text-sm text-gray-600">Avg Time</p>
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {accuracy >= 80 ? 'Excellent Work!' : accuracy >= 60 ? 'Good Progress!' : 'Keep Practicing!'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                You demonstrated {averageConfidence.toFixed(0)}% average confidence in your answers.
              </p>
            </div>

            {adaptiveMetrics?.recommendedActions && (
              <div>
                <h4 className="font-semibold mb-2">Recommended Next Steps:</h4>
                <ul className="space-y-1">
                  {adaptiveMetrics.recommendedActions.map((action, index) => (
                    <li key={index} className="text-sm flex items-center space-x-2">
                      <ChevronRight className="w-4 h-4 text-blue-500" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-center space-x-2 pt-4">
              <Button onClick={onClose} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View Results
              </Button>
              <Button onClick={initializeAssessment}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <span>Adaptive Assessment: {topic}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Generating your personalized question...</span>
            </div>
          )}

          {!isLoading && !isComplete && currentQuestion && (
            <>
              {renderQuestion()}
              {renderFeedback()}
            </>
          )}

          {isComplete && renderCompletionSummary()}

          {adaptiveMetrics && !isComplete && (
            <div className="border-t pt-4">
              {renderAdaptiveMetrics()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}