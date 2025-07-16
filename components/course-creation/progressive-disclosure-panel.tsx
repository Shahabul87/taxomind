"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Zap, 
  Target, 
  Brain, 
  Clock,
  TrendingUp,
  X,
  Check,
  Lightbulb,
  User,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StepSuggestion {
  type: 'auto_fill' | 'skip_optional' | 'show_advanced' | 'simplify' | 'guidance';
  message: string;
  action?: () => void;
  confidence: number;
}

interface ProgressiveDisclosureState {
  currentStep: number;
  userExperience: 'beginner' | 'intermediate' | 'expert';
  showAdvancedOptions: boolean;
  simplifiedMode: boolean;
  autoSuggestions: boolean;
  quickMode: boolean;
  adaptiveHelp: boolean;
}

interface ProgressiveDisclosurePanelProps {
  disclosureState: ProgressiveDisclosureState;
  stepSuggestions: StepSuggestion[];
  timeSpent: Record<number, number>;
  onToggleAdvancedOptions: () => void;
  onToggleQuickMode: () => void;
  onApplySuggestion: (index: number) => void;
  onDismissSuggestion: (index: number) => void;
  className?: string;
}

export const ProgressiveDisclosurePanel = ({
  disclosureState,
  stepSuggestions,
  timeSpent,
  onToggleAdvancedOptions,
  onToggleQuickMode,
  onApplySuggestion,
  onDismissSuggestion,
  className
}: ProgressiveDisclosurePanelProps) => {
  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case 'beginner': return 'text-blue-600 dark:text-blue-400';
      case 'intermediate': return 'text-yellow-600 dark:text-yellow-400';
      case 'expert': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getExperienceBadgeColor = (experience: string) => {
    switch (experience) {
      case 'beginner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'expert': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'auto_fill': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'show_advanced': return <Settings className="h-4 w-4 text-purple-500" />;
      case 'simplify': return <Target className="h-4 w-4 text-blue-500" />;
      case 'guidance': return <Lightbulb className="h-4 w-4 text-orange-500" />;
      default: return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const averageTimePerStep = Object.values(timeSpent).length > 0 
    ? Object.values(timeSpent).reduce((a, b) => a + b, 0) / Object.values(timeSpent).length 
    : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* User Experience Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            Smart Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Experience Level:</span>
              <Badge className={cn("text-xs", getExperienceBadgeColor(disclosureState.userExperience))}>
                {disclosureState.userExperience}
              </Badge>
            </div>
            {averageTimePerStep > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <Clock className="h-3 w-3" />
                {formatTime(averageTimePerStep)} avg
              </div>
            )}
          </div>

          {/* Interface Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="advanced-options" className="text-sm font-medium">
                Advanced Options
              </Label>
              <Switch
                id="advanced-options"
                checked={disclosureState.showAdvancedOptions}
                onCheckedChange={onToggleAdvancedOptions}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="quick-mode" className="text-sm font-medium">
                Quick Mode
              </Label>
              <Switch
                id="quick-mode"
                checked={disclosureState.quickMode}
                onCheckedChange={onToggleQuickMode}
              />
            </div>
          </div>

          {/* Experience-based tips */}
          {disclosureState.userExperience === 'beginner' && (
            <Alert className="py-2 px-3 bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                First time? The interface will adapt as you create more courses. Enable &quot;Quick Mode&quot; later for faster creation.
              </AlertDescription>
            </Alert>
          )}

          {disclosureState.userExperience === 'expert' && !disclosureState.quickMode && (
            <Alert className="py-2 px-3 bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                You&apos;re experienced! Try &quot;Quick Mode&quot; for streamlined course creation with smart defaults.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      {stepSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Smart Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stepSuggestions.map((suggestion, index) => (
              <Alert key={index} className="py-3 px-3 bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <AlertDescription className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {suggestion.message}
                    </AlertDescription>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}% confident
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {suggestion.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {suggestion.action && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onApplySuggestion(index)}
                            className="h-6 px-2 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Apply
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDismissSuggestion(index)}
                          className="h-6 px-2 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      {Object.keys(timeSpent).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Creation Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {Object.keys(timeSpent).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Steps Completed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatTime(averageTimePerStep)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Avg per Step</div>
              </div>
            </div>

            {/* Step breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Time per Step:</div>
              {Object.entries(timeSpent).map(([step, time]) => (
                <div key={step} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Step {step}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(time)}
                  </span>
                </div>
              ))}
            </div>

            {/* Efficiency tips */}
            {averageTimePerStep > 120000 && disclosureState.userExperience !== 'beginner' && (
              <Alert className="py-2 px-3 bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-xs text-orange-700 dark:text-orange-300">
                  Try enabling auto-suggestions and quick mode to speed up course creation.
                </AlertDescription>
              </Alert>
            )}

            {averageTimePerStep < 60000 && disclosureState.userExperience === 'expert' && (
              <Alert className="py-2 px-3 bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                  Great efficiency! You&apos;re creating courses quickly and confidently.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};