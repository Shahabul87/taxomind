"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { logger } from '@/lib/logger';
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  Users,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  BarChart3,
  Lightbulb,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RefinementSuggestion {
  type: 'structure' | 'content' | 'pedagogy' | 'engagement' | 'assessment';
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  rationale: string;
  implementation: {
    action: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  };
  confidence: number;
}

interface RefinementResult {
  originalBlueprint: any;
  refinedBlueprint: any;
  suggestions: RefinementSuggestion[];
  improvements: {
    structuralChanges: string[];
    contentEnhancements: string[];
    pedagogicalImprovements: string[];
    engagementBoosts: string[];
    assessmentRefinements: string[];
  };
  qualityMetrics: {
    educationalEffectiveness: number;
    learnerEngagement: number;
    contentQuality: number;
    structuralCoherence: number;
    assessmentAlignment: number;
  };
  comparisonAnalysis: {
    improvementAreas: string[];
    strengthsPreserved: string[];
    overallImprovement: number;
  };
}

interface BlueprintRefinementModalProps {
  open: boolean;
  onClose: () => void;
  blueprint: any;
  onApplyRefinements?: (refinedBlueprint: any) => void;
  onApplySuggestion?: (suggestion: RefinementSuggestion) => void;
}

export const BlueprintRefinementModal = ({
  open,
  onClose,
  blueprint,
  onApplyRefinements,
  onApplySuggestion
}: BlueprintRefinementModalProps) => {
  const [isRefining, setIsRefining] = useState(false);
  const [refinementResult, setRefinementResult] = useState<RefinementResult | null>(null);
  const [userFeedback, setUserFeedback] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['content_quality', 'engagement']);
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set());

  const refinementGoals = [
    { id: 'content_quality', label: 'Content Quality', icon: <Star className="h-4 w-4" /> },
    { id: 'engagement', label: 'Learner Engagement', icon: <Zap className="h-4 w-4" /> },
    { id: 'pedagogy', label: 'Teaching Effectiveness', icon: <Target className="h-4 w-4" /> },
    { id: 'structure', label: 'Course Structure', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'assessment', label: 'Assessment Alignment', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Users className="h-4 w-4" /> }
  ];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleSuggestionExpansion = (index: number) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const runRefinement = async () => {
    if (selectedGoals.length === 0) {
      toast.error("Please select at least one refinement goal");
      return;
    }

    setIsRefining(true);
    try {
      const response = await fetch('/api/ai/blueprint-refinement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blueprint,
          refinementGoals: selectedGoals,
          userFeedback: userFeedback.trim() || undefined,
          preserveStructure
        }),
      });

      if (!response.ok) {
        throw new Error('Refinement failed');
      }

      const result = await response.json();
      setRefinementResult(result);
      toast.success("Blueprint refinement completed!");
    } catch (error: any) {
      logger.error('Refinement error:', error);
      toast.error("Failed to refine blueprint. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const applySuggestion = (suggestion: RefinementSuggestion, index: number) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
      toast.success(`Applied: ${suggestion.title}`);
    }
  };

  const applyAllRefinements = () => {
    if (refinementResult && onApplyRefinements) {
      onApplyRefinements(refinementResult.refinedBlueprint);
      toast.success("All refinements applied to blueprint!");
      onClose();
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'structure': return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'content': return <Star className="h-4 w-4 text-purple-500" />;
      case 'pedagogy': return <Target className="h-4 w-4 text-green-500" />;
      case 'engagement': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'assessment': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <span className="text-xl font-semibold">Blueprint Refinement</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                Enhance your course blueprint with AI-powered suggestions
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!refinementResult ? (
            /* Refinement Setup */
            <div className="space-y-6">
              {/* Refinement Goals */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Refinement Goals</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {refinementGoals.map((goal) => (
                    <Button
                      key={goal.id}
                      variant={selectedGoals.includes(goal.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleGoal(goal.id)}
                      className="justify-start text-xs h-9"
                    >
                      {goal.icon}
                      {goal.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* User Feedback */}
              <div className="space-y-3">
                <Label htmlFor="feedback" className="text-base font-medium">
                  Specific Feedback (Optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Describe any specific areas you'd like to improve or concerns you have about the current blueprint..."
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Refinement Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserve-structure"
                    checked={preserveStructure}
                    onCheckedChange={(checked) => setPreserveStructure(checked as boolean)}
                  />
                  <Label
                    htmlFor="preserve-structure"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Preserve overall course structure (only refine content and details)
                  </Label>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={runRefinement}
                  disabled={isRefining || selectedGoals.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 px-8"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing Blueprint...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Refine Blueprint
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Refinement Results */
            <div className="space-y-4 h-full overflow-hidden">
              {/* Quality Improvement Overview */}
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Overall Quality Improvement: +{refinementResult.comparisonAnalysis.overallImprovement}%
                    </span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {refinementResult.suggestions.length} suggestions
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Quality Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                {Object.entries(refinementResult.qualityMetrics).map(([metric, score]) => (
                  <div key={metric} className="text-center">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {score}%
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 capitalize">
                      {metric.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>

              <Tabs defaultValue="suggestions" className="flex-1 overflow-hidden">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                  <TabsTrigger value="comparison">Comparison</TabsTrigger>
                </TabsList>

                <TabsContent value="suggestions" className="space-y-3 h-[400px] overflow-y-auto">
                  {refinementResult.suggestions.map((suggestion, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0 mt-1">
                                {getSuggestionIcon(suggestion.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {suggestion.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {suggestion.type}
                                  </Badge>
                                  <Badge className={cn("text-xs", getPriorityColor(suggestion.priority))}>
                                    {suggestion.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {suggestion.description}
                                </p>
                                
                                {/* Quick Stats */}
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    {Math.round(suggestion.confidence * 100)}% confidence
                                  </span>
                                  <span className={cn("flex items-center gap-1", getEffortColor(suggestion.implementation.effort))}>
                                    <BarChart3 className="h-3 w-3" />
                                    {suggestion.implementation.effort} effort
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleSuggestionExpansion(index)}
                                className="h-7 w-7 p-0"
                              >
                                {expandedSuggestions.has(index) ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => applySuggestion(suggestion, index)}
                                className="h-7 px-3 text-xs"
                              >
                                Apply
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {expandedSuggestions.has(index) && (
                            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div>
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Rationale:
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {suggestion.rationale}
                                </p>
                              </div>
                              
                              <div>
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Implementation:
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  <strong>Action:</strong> {suggestion.implementation.action}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  <strong>Impact:</strong> {suggestion.implementation.impact}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="improvements" className="space-y-4 h-[400px] overflow-y-auto">
                  {Object.entries(refinementResult.improvements).map(([category, items]) => (
                    items.length > 0 && (
                      <div key={category}>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <ul className="space-y-1">
                          {items.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </TabsContent>

                <TabsContent value="comparison" className="space-y-4 h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-600 dark:text-green-400">
                          Improvement Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {refinementResult.comparisonAnalysis.improvementAreas.map((area, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <TrendingUp className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{area}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-blue-600 dark:text-blue-400">
                          Strengths Preserved
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {refinementResult.comparisonAnalysis.strengthsPreserved.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {refinementResult && (
              <Button
                variant="outline"
                onClick={() => {
                  setRefinementResult(null);
                  setUserFeedback("");
                }}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                New Refinement
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {refinementResult && (
              <Button onClick={applyAllRefinements} className="bg-purple-600 hover:bg-purple-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply All Refinements
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};