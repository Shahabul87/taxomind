"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, Brain, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleValidationResult {
  score: number;
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  suggestions: string[];
  isValid: boolean;
}

interface SimpleQuestionValidationProps {
  question: {
    question: string;
    bloomsLevel?: string;
    questionType?: string;
    difficulty?: string;
    points?: number;
  };
  isVisible?: boolean;
  onValidationChange?: (result: any) => void;
}

export function SimpleQuestionValidation({
  question,
  isVisible = true,
  onValidationChange
}: SimpleQuestionValidationProps) {
  const [validationResult, setValidationResult] = useState<SimpleValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateQuestion = (q: typeof question): SimpleValidationResult => {
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Question length validation
    if (q.question.length < 10) {
      issues.push("Question is too short");
      score -= 20;
    } else if (q.question.length > 300) {
      issues.push("Question might be too long");
      score -= 10;
    } else {
      score += 20;
    }

    // Grammar and clarity checks
    if (!q.question.endsWith('?') && q.questionType !== 'short-answer') {
      issues.push("Question should end with a question mark");
      score -= 10;
    } else {
      score += 10;
    }

    // Check for clear language
    const wordCount = q.question.split(' ').length;
    if (wordCount > 50) {
      suggestions.push("Consider simplifying the question for better clarity");
      score -= 5;
    } else {
      score += 15;
    }

    // Bloom's taxonomy alignment
    if (q.bloomsLevel) {
      score += 15;
      const bloomsKeywords = {
        remember: ['define', 'list', 'name', 'identify', 'recall'],
        understand: ['explain', 'describe', 'summarize', 'interpret'],
        apply: ['use', 'demonstrate', 'apply', 'solve', 'implement'],
        analyze: ['analyze', 'compare', 'contrast', 'examine', 'distinguish'],
        evaluate: ['evaluate', 'assess', 'judge', 'critique', 'defend'],
        create: ['create', 'design', 'develop', 'compose', 'construct']
      };
      
      const keywords = bloomsKeywords[q.bloomsLevel as keyof typeof bloomsKeywords] || [];
      const hasKeyword = keywords.some(keyword => 
        q.question.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        score += 10;
      } else {
        suggestions.push(`Consider using action words appropriate for ${q.bloomsLevel} level`);
      }
    } else {
      suggestions.push("Assign a Bloom's taxonomy level for better assessment alignment");
    }

    // Difficulty alignment
    if (q.difficulty) {
      score += 10;
    }

    // Points validation
    if (q.points && q.points > 0) {
      score += 10;
    } else {
      suggestions.push("Assign appropriate points to the question");
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score + 30)); // Base score of 30

    // Determine quality level
    let qualityLevel: SimpleValidationResult['qualityLevel'];
    if (score >= 85) qualityLevel = 'excellent';
    else if (score >= 70) qualityLevel = 'good';
    else if (score >= 50) qualityLevel = 'fair';
    else qualityLevel = 'poor';

    return {
      score,
      qualityLevel,
      issues,
      suggestions,
      isValid: score >= 60 && issues.length === 0
    };
  };

  useEffect(() => {
    if (question.question && question.question.trim().length > 3) {
      setIsLoading(true);
      
      const timeoutId = setTimeout(() => {
        const result = validateQuestion(question);
        setValidationResult(result);
        setIsLoading(false);
        onValidationChange?.(result);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setValidationResult(null);
      setIsLoading(false);
    }
  }, [question, onValidationChange]);

  if (!isVisible || isLoading) {
    return isLoading ? (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </div>
        </CardHeader>
      </Card>
    ) : null;
  }

  if (!validationResult) return null;

  const getQualityColor = (quality: string) => {
    const colors = {
      excellent: "text-emerald-600 dark:text-emerald-400",
      good: "text-blue-600 dark:text-blue-400",
      fair: "text-yellow-600 dark:text-yellow-400",
      poor: "text-red-600 dark:text-red-400"
    };
    return colors[quality as keyof typeof colors] || "text-gray-600";
  };

  const getQualityBg = (quality: string) => {
    const backgrounds = {
      excellent: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
      good: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
      fair: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
      poor: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
    };
    return backgrounds[quality as keyof typeof backgrounds] || "bg-gray-50";
  };

  return (
    <Card className={cn("border-l-4", getQualityBg(validationResult.qualityLevel))}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Quality Check</span>
            <Badge variant="outline" className={cn("text-xs", getQualityColor(validationResult.qualityLevel))}>
              {validationResult.qualityLevel}
            </Badge>
          </div>
          <div className="text-right">
            <div className={cn("text-lg font-bold", getQualityColor(validationResult.qualityLevel))}>
              {validationResult.score}%
            </div>
          </div>
        </div>
        
        <Progress value={validationResult.score} className="h-2" />
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Issues */}
          {validationResult.issues.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Issues
              </div>
              {validationResult.issues.map((issue, index) => (
                <div key={index} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                  <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {issue}
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {validationResult.suggestions.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                <Eye className="h-3 w-3" />
                Suggestions
              </div>
              {validationResult.suggestions.map((suggestion, index) => (
                <div key={index} className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Status:</span>
            <div className="flex items-center gap-1">
              {validationResult.isValid ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-medium">Needs work</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}