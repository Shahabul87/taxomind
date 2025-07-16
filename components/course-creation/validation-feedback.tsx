"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Lightbulb, 
  Loader2,
  TrendingUp,
  Target,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: {
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    field?: string;
  }[];
  suggestions: {
    type: 'improvement' | 'alternative' | 'enhancement';
    message: string;
    example?: string;
  }[];
  optimizedValue?: string;
}

interface ValidationFeedbackProps {
  validation: {
    result: ValidationResult | null;
    isValidating: boolean;
    lastValidated: number;
  } | null;
  field: string;
  className?: string;
  onApplyOptimization?: (optimizedValue: string) => void;
}

export const ValidationFeedback = ({ 
  validation, 
  field, 
  className,
  onApplyOptimization 
}: ValidationFeedbackProps) => {
  if (!validation) return null;
  
  const { result, isValidating } = validation;

  if (isValidating) {
    return (
      <div className={cn("mt-2", className)}>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>AI is analyzing your input...</span>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'alternative':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'enhancement':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const hasContent = result.issues.length > 0 || result.suggestions.length > 0 || result.optimizedValue;

  if (!hasContent && result.score >= 80) {
    return (
      <div className={cn("mt-2", className)}>
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>Looks great! AI score: {result.score}/100</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mt-3 space-y-3", className)}>
      {/* Score Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Quality Score
          </span>
          <Badge 
            variant="secondary" 
            className={cn("text-xs font-semibold", getScoreBgColor(result.score))}
          >
            <span className={getScoreColor(result.score)}>
              {result.score}/100
            </span>
          </Badge>
        </div>
        {result.score < 100 && (
          <Progress value={result.score} className="w-20 h-2" />
        )}
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <div className="space-y-2">
          {result.issues.map((issue, index) => (
            <Alert 
              key={index} 
              className={cn(
                "py-2 px-3",
                issue.type === 'error' && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10",
                issue.type === 'warning' && "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10",
                issue.type === 'suggestion' && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getIssueIcon(issue.type)}
                </div>
                <AlertDescription className="text-sm">
                  {issue.message}
                </AlertDescription>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Optimization Suggestion */}
      {result.optimizedValue && onApplyOptimization && (
        <Alert className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/10">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <AlertDescription className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                AI suggests this optimized version:
              </AlertDescription>
              <div className="p-3 bg-white dark:bg-gray-800/50 rounded-md border border-purple-200 dark:border-purple-700/50 mb-3">
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  &quot;{result.optimizedValue}&quot;
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApplyOptimization(result.optimizedValue!)}
                className="text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-600 dark:hover:bg-purple-900/20"
              >
                Apply Suggestion
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="space-y-2">
          {result.suggestions.slice(0, 2).map((suggestion, index) => (
            <Alert 
              key={index} 
              className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30 py-2 px-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getSuggestionIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                    {suggestion.message}
                  </AlertDescription>
                  {suggestion.example && (
                    <div className="mt-2 p-2 bg-white dark:bg-gray-800/50 rounded text-xs font-mono text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      Example: &quot;{suggestion.example}&quot;
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))}
          
          {result.suggestions.length > 2 && (
            <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
              +{result.suggestions.length - 2} more suggestions available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface OverallValidationSummaryProps {
  overallScore: number;
  hasErrors: boolean;
  totalIssues: number;
  totalSuggestions: number;
  isValidating: boolean;
  className?: string;
}

export const OverallValidationSummary = ({
  overallScore,
  hasErrors,
  totalIssues,
  totalSuggestions,
  isValidating,
  className
}: OverallValidationSummaryProps) => {
  const getStatusColor = () => {
    if (hasErrors) return "text-red-600 dark:text-red-400";
    if (overallScore >= 80) return "text-green-600 dark:text-green-400";
    if (overallScore >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getStatusMessage = () => {
    if (hasErrors) return "Needs attention";
    if (overallScore >= 90) return "Excellent quality";
    if (overallScore >= 80) return "Very good";
    if (overallScore >= 70) return "Good progress";
    if (overallScore >= 60) return "Needs improvement";
    return "Requires work";
  };

  const getStatusIcon = () => {
    if (isValidating) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (hasErrors) return <AlertTriangle className="h-4 w-4" />;
    if (overallScore >= 80) return <CheckCircle className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  return (
    <div className={cn("p-4 rounded-lg border bg-gray-50 dark:bg-gray-800/30 dark:border-gray-700", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            Course Quality
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          <span className={getStatusColor()}>{overallScore}/100</span>
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Progress value={overallScore} className="flex-1 h-2" />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className={cn("font-medium", getStatusColor())}>
            {getStatusMessage()}
          </span>
          
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            {totalIssues > 0 && (
              <span>{totalIssues} issue{totalIssues !== 1 ? 's' : ''}</span>
            )}
            {totalSuggestions > 0 && (
              <span>{totalSuggestions} suggestion{totalSuggestions !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};