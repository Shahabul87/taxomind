"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { BLOOMS_LEVELS } from '../types/sam-creator.types';
import { Sparkles, Lightbulb, Plus, Loader2, ChevronUp, ChevronDown, AlertTriangle, CheckCircle, Info, Target } from 'lucide-react';
import { toast } from 'sonner';

interface SamLearningDesignAssistanceProps {
  formData: {
    courseTitle: string;
    courseShortOverview: string;
    courseCategory: string;
    courseSubcategory?: string;
    targetAudience?: string;
    difficulty: string;
    courseIntent?: string;
    courseGoals: string[];
    bloomsFocus: string[];
  };
  onUpdateFormData: (updates: (prev: any) => any) => void;
  className?: string;
}

export function SamLearningDesignAssistance({ formData, onUpdateFormData, className }: SamLearningDesignAssistanceProps) {
  const [objectiveSuggestions, setObjectiveSuggestions] = useState<any[]>([]);
  const [bloomsRecommendations, setBloomsRecommendations] = useState<any>(null);
  const [isGeneratingObjectives, setIsGeneratingObjectives] = useState(false);
  const [isGeneratingBlooms, setIsGeneratingBlooms] = useState(false);
  const [showObjectiveSuggestions, setShowObjectiveSuggestions] = useState(false);
  const [showBloomsRecommendations, setShowBloomsRecommendations] = useState(false);
  const [objectiveCount, setObjectiveCount] = useState(5);

  // Generate learning objectives suggestions
  const generateLearningObjectives = useCallback(async () => {
    if (!formData.courseTitle || !formData.courseShortOverview || isGeneratingObjectives) return;
    
    setIsGeneratingObjectives(true);
    try {
      const response = await fetch('/api/sam/learning-objectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.courseTitle,
          overview: formData.courseShortOverview,
          category: formData.courseCategory,
          subcategory: formData.courseSubcategory,
          targetAudience: formData.targetAudience,
          difficulty: formData.difficulty,
          intent: formData.courseIntent,
          count: objectiveCount
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      setObjectiveSuggestions(result.objectives || []);
      setShowObjectiveSuggestions(true);
    } catch (error) {
      console.error('Error generating learning objectives:', error);
      toast.error('Failed to generate learning objectives');
    } finally {
      setIsGeneratingObjectives(false);
    }
  }, [formData, objectiveCount, isGeneratingObjectives]);

  // Generate Bloom's taxonomy recommendations
  const generateBloomsRecommendations = useCallback(async () => {
    if (!formData.courseTitle || !formData.courseShortOverview || isGeneratingBlooms) return;
    
    setIsGeneratingBlooms(true);
    try {
      const response = await fetch('/api/sam/blooms-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.courseTitle,
          overview: formData.courseShortOverview,
          category: formData.courseCategory,
          subcategory: formData.courseSubcategory,
          targetAudience: formData.targetAudience,
          difficulty: formData.difficulty,
          intent: formData.courseIntent,
          currentSelections: formData.bloomsFocus
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      setBloomsRecommendations(result);
      setShowBloomsRecommendations(true);
    } catch (error) {
      console.error('Error generating Bloom\'s recommendations:', error);
      toast.error('Failed to generate Bloom\'s recommendations');
    } finally {
      setIsGeneratingBlooms(false);
    }
  }, [formData, isGeneratingBlooms]);

  const insertObjective = (objective: string) => {
    const newGoal = objective.trim();
    if (newGoal && !formData.courseGoals.includes(newGoal)) {
      onUpdateFormData(prev => ({
        ...prev,
        courseGoals: [...prev.courseGoals, newGoal]
      }));
      toast.success('Learning objective added!');
    }
  };

  const applyBloomsRecommendation = (level: string) => {
    onUpdateFormData(prev => ({
      ...prev,
      bloomsFocus: prev.bloomsFocus.includes(level)
        ? prev.bloomsFocus.filter(l => l !== level)
        : [...prev.bloomsFocus, level]
    }));
    toast.success(`${level} level added to focus!`);
  };

  const applyAllBloomsRecommendations = (recommendations: string[]) => {
    onUpdateFormData(prev => ({
      ...prev,
      bloomsFocus: recommendations
    }));
    toast.success('Bloom\'s recommendations applied!');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          SAM&apos;s Learning Design Assistance
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Get AI-powered suggestions for learning objectives and cognitive focus
        </p>
      </div>

      <div className="space-y-4">
        {/* AI Learning Objectives Suggestions */}
        <Card className="p-4 backdrop-blur-md bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI Learning Objectives
            </h3>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowObjectiveSuggestions(!showObjectiveSuggestions)}
            >
              {showObjectiveSuggestions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
          
          <div className="text-xs mb-3 p-2 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-white/20 text-blue-600 dark:text-blue-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
              <span className="font-medium">SAM can generate SMART learning objectives based on your course details</span>
            </div>
          </div>

          {/* Objective Count Slider */}
          <div className="mb-3 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <Label className="text-sm font-medium">Number of Objectives: {objectiveCount}</Label>
              </div>
            </div>
            <Slider
              value={[objectiveCount]}
              onValueChange={(value) => setObjectiveCount(value[0])}
              max={10}
              min={3}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Choose how many learning objectives SAM should generate (3-10 objectives)
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={generateLearningObjectives}
              disabled={!formData.courseTitle || !formData.courseShortOverview || isGeneratingObjectives}
              className="flex-1 bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm"
            >
              {isGeneratingObjectives ? (
                <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-3 w-3 mr-2" />Generate Objectives</>
              )}
            </Button>
          </div>
          
          {showObjectiveSuggestions && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {objectiveSuggestions.map((objective, index) => (
                <div key={index} className="p-3 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-lg border border-white/20 shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 pr-2">
                      {objective.text}
                    </p>
                    <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300/30">
                      {objective.bloomsLevel}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {objective.reasoning}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-slate-500">Confidence:</div>
                      <Progress value={objective.confidence * 100} className="w-16 h-1" />
                      <span className="text-xs text-slate-500">{Math.round(objective.confidence * 100)}%</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => insertObjective(objective.text)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI Bloom's Taxonomy Recommendations */}
        <Card className="p-4 backdrop-blur-md bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-600" />
              SAM&apos;s Bloom&apos;s Recommendations
            </h3>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowBloomsRecommendations(!showBloomsRecommendations)}
            >
              {showBloomsRecommendations ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
          
          <div className="text-xs mb-3 p-2 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-white/20 text-green-600 dark:text-green-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
              <span className="font-medium">Get cognitive level recommendations based on your course design</span>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={generateBloomsRecommendations}
              disabled={!formData.courseTitle || !formData.courseShortOverview || isGeneratingBlooms}
              className="flex-1 bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm"
            >
              {isGeneratingBlooms ? (
                <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Lightbulb className="h-3 w-3 mr-2" />Get Recommendations</>
              )}
            </Button>
          </div>
          
          {showBloomsRecommendations && bloomsRecommendations && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {/* Reasoning */}
              <div className="p-3 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">SAM&apos;s Analysis</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {bloomsRecommendations.recommendations?.reasoning}
                </p>
              </div>

              {/* Primary Recommendations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Recommended Levels</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => applyAllBloomsRecommendations(bloomsRecommendations.recommendations?.recommendations)}
                    className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm"
                    disabled={!Array.isArray(bloomsRecommendations.recommendations?.recommendations)}
                  >
                    Apply All
                  </Button>
                </div>
                {Array.isArray(bloomsRecommendations.recommendations?.recommendations) && bloomsRecommendations.recommendations.recommendations.map((level: string, index: number) => {
                  const levelInfo = BLOOMS_LEVELS.find(l => l.value === level);
                  return (
                    <div key={index} className="p-2 backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 rounded border border-white/20 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{levelInfo?.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{levelInfo?.description}</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => applyBloomsRecommendation(level)}
                        className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm"
                        disabled={formData.bloomsFocus.includes(level)}
                      >
                        {formData.bloomsFocus.includes(level) ? <CheckCircle className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Warnings */}
              {bloomsRecommendations.recommendations?.warnings && bloomsRecommendations.recommendations.warnings.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Considerations</span>
                  {bloomsRecommendations.recommendations.warnings.map((warning: any, index: number) => (
                    <div key={index} className={cn(
                      "p-2 rounded border",
                      warning.severity === 'high' ? "bg-red-50/50 border-red-200 dark:bg-red-900/20 dark:border-red-700" :
                      warning.severity === 'medium' ? "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700" :
                      "bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
                    )}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-0.5 text-current" />
                        <span className="text-xs">{warning.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}