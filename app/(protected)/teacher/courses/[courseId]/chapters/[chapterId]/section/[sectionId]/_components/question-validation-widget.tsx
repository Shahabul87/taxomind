"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Brain,
  Eye,
  Target,
  MessageCircle,
  Shield,
  Users,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionValidator, DetailedValidationResult, ValidationIssue, ImprovementSuggestion } from "@/lib/question-validation";

interface QuestionValidationWidgetProps {
  question: {
    question: string;
    bloomsLevel?: string;
    questionType?: string;
    difficulty?: string;
    cognitiveLoad?: number;
    points?: number;
  };
  isVisible?: boolean;
  onValidationChange?: (result: DetailedValidationResult) => void;
}

const VALIDATION_COLORS = {
  excellent: "text-emerald-600 dark:text-emerald-400",
  good: "text-blue-600 dark:text-blue-400", 
  fair: "text-yellow-600 dark:text-yellow-400",
  poor: "text-red-600 dark:text-red-400"
};

const QUALITY_BACKGROUNDS = {
  excellent: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
  good: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
  fair: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
  poor: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
};

const ISSUE_ICONS = {
  critical: XCircle,
  warning: AlertTriangle,
  suggestion: Info
};

const CATEGORY_ICONS = {
  blooms: Brain,
  clarity: Eye,
  difficulty: Target,
  grammar: MessageCircle,
  bias: Shield,
  accessibility: Users
};

export const QuestionValidationWidget = ({
  question,
  isVisible = true,
  onValidationChange
}: QuestionValidationWidgetProps) => {
  const [validationResult, setValidationResult] = useState<DetailedValidationResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const validator = useCallback(() => QuestionValidator.getInstance(), [])();

  useEffect(() => {
    if (question.question && question.question.trim().length > 5) {
      setIsLoading(true);
      
      // Debounce validation to avoid excessive calls
      const timeoutId = setTimeout(() => {
        const result = validator.validateQuestion(question);
        setValidationResult(result);
        setIsLoading(false);
        onValidationChange?.(result);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setValidationResult(null);
      setIsLoading(false);
    }
  }, [question, onValidationChange, validator]);

  if (!isVisible || !validationResult) {
    return null;
  }

  const getQualityColor = (quality: string) => {
    return VALIDATION_COLORS[quality as keyof typeof VALIDATION_COLORS] || "text-gray-600";
  };

  const getQualityBackground = (quality: string) => {
    return QUALITY_BACKGROUNDS[quality as keyof typeof QUALITY_BACKGROUNDS] || "bg-gray-50 border-gray-200";
  };

  const getIssueIcon = (type: string) => {
    const IconComponent = ISSUE_ICONS[type as keyof typeof ISSUE_ICONS] || Info;
    return IconComponent;
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Info;
    return IconComponent;
  };

  const getIssueColor = (type: string) => {
    const colors = {
      critical: "text-red-600 dark:text-red-400",
      warning: "text-yellow-600 dark:text-yellow-400",
      suggestion: "text-blue-600 dark:text-blue-400"
    };
    return colors[type as keyof typeof colors] || "text-gray-600";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={cn(
          "border-l-4", 
          getQualityBackground(validationResult.qualityLevel),
          "bg-gradient-to-br from-white via-gray-50 to-white",
          "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
          "shadow-sm hover:shadow-md transition-shadow duration-200"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-sm font-semibold">Question Quality</CardTitle>
                <Badge variant="outline" className={cn("text-xs", getQualityColor(validationResult.qualityLevel))}>
                  {validationResult.qualityLevel.charAt(0).toUpperCase() + validationResult.qualityLevel.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className={cn("text-lg font-bold", getQualityColor(validationResult.qualityLevel))}>
                    {validationResult.overallScore}%
                  </div>
                  <div className="text-xs text-gray-500">Quality Score</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Quality Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={validationResult.overallScore} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </div>
          </CardHeader>

          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* Validation Criteria Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Quality Breakdown
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Bloom&apos;s Alignment</span>
                        <span className="font-medium">{Math.round(validationResult.criteria.bloomsAlignment * 100)}%</span>
                      </div>
                      <Progress value={validationResult.criteria.bloomsAlignment * 100} className="h-1" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Clarity</span>
                        <span className="font-medium">{Math.round(validationResult.criteria.clarityScore * 100)}%</span>
                      </div>
                      <Progress value={validationResult.criteria.clarityScore * 100} className="h-1" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Difficulty Alignment</span>
                        <span className="font-medium">{Math.round(validationResult.criteria.difficultyAlignment * 100)}%</span>
                      </div>
                      <Progress value={validationResult.criteria.difficultyAlignment * 100} className="h-1" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Accessibility</span>
                        <span className="font-medium">{Math.round(validationResult.criteria.accessibility * 100)}%</span>
                      </div>
                      <Progress value={validationResult.criteria.accessibility * 100} className="h-1" />
                    </div>
                  </div>
                </div>

                {/* Issues Section */}
                {validationResult.specificIssues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Issues Found
                    </h4>
                    
                    <div className="space-y-2">
                      {validationResult.specificIssues.map((issue, index) => {
                        const IssueIcon = getIssueIcon(issue.type);
                        const CategoryIcon = getCategoryIcon(issue.category);
                        
                        return (
                          <Alert key={index} className="py-2">
                            <div className="flex items-start gap-2">
                              <IssueIcon className={cn("h-4 w-4 mt-0.5", getIssueColor(issue.type))} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                                    {issue.category}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {issue.type}
                                  </Badge>
                                </div>
                                <AlertDescription className="text-xs mt-1">
                                  {issue.message}
                                </AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Improvement Suggestions */}
                {validationResult.improvementSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Improvement Suggestions
                    </h4>
                    
                    <div className="space-y-2">
                      {validationResult.improvementSuggestions.map((suggestion, index) => (
                        <Alert key={index} className="py-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                          <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                {suggestion.category}
                              </span>
                              <Badge variant="outline" className={cn(
                                "text-xs",
                                suggestion.priority === 'high' ? 'border-red-300 text-red-700' :
                                suggestion.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                'border-blue-300 text-blue-700'
                              )}>
                                {suggestion.priority} priority
                              </Badge>
                            </div>
                            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                              {suggestion.suggestion}
                            </AlertDescription>
                            {suggestion.example && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                                Example: {suggestion.example}
                              </div>
                            )}
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Validation Status:
                    </span>
                    <div className="flex items-center gap-1">
                      {validationResult.isValid ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-green-600 dark:text-green-400 font-medium">Ready to use</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 dark:text-red-400 font-medium">Needs improvement</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};