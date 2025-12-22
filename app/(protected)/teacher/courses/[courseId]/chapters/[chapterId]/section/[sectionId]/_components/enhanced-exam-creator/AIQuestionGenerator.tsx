"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BloomsLevel, QuestionType, QuestionDifficulty } from "@prisma/client";
import {
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Sparkles,
  Wand2,
  Loader2,
  Settings2,
  Sliders,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Target,
  Globe,
  MessageSquare,
  HelpCircle,
  List,
  Flame,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AIGenerationConfig,
  BloomsDistribution,
  GeneratedQuestion,
  BLOOMS_GUIDANCE,
  QUESTION_TYPE_INFO,
  DEFAULT_BLOOMS_DISTRIBUTION,
} from "./types";

interface AIQuestionGeneratorProps {
  sectionContent: string;
  learningObjectives: string[];
  onQuestionsGenerated: (questions: GeneratedQuestion[]) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
}

const BLOOMS_ICONS: Record<BloomsLevel, React.ReactNode> = {
  REMEMBER: <Brain className="h-4 w-4" />,
  UNDERSTAND: <Lightbulb className="h-4 w-4" />,
  APPLY: <Wrench className="h-4 w-4" />,
  ANALYZE: <Search className="h-4 w-4" />,
  EVALUATE: <Scale className="h-4 w-4" />,
  CREATE: <Sparkles className="h-4 w-4" />,
};

const GENERATION_MODES = [
  {
    id: "AI_QUICK",
    name: "Quick Generate",
    description: "Fast generation with balanced distribution",
    icon: <Zap className="h-5 w-5" />,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "AI_GUIDED",
    name: "Guided Generate",
    description: "Customize Bloom&apos;s distribution and question types",
    icon: <Target className="h-5 w-5" />,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "AI_ADAPTIVE",
    name: "Adaptive Generate",
    description: "AI selects optimal distribution based on content",
    icon: <Brain className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "AI_GAP_FILLING",
    name: "Gap Filling",
    description: "Generate questions to fill gaps in existing coverage",
    icon: <BarChart3 className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500",
  },
];

const defaultConfig: AIGenerationConfig = {
  questionCount: 10,
  bloomsDistribution: DEFAULT_BLOOMS_DISTRIBUTION,
  questionTypes: ["MULTIPLE_CHOICE", "SHORT_ANSWER"],
  difficulty: "MEDIUM",
  includeHints: true,
  includeExplanations: true,
  includeMisconceptions: true,
  creativity: 5,
  realWorldContext: true,
};

export function AIQuestionGenerator({
  sectionContent,
  learningObjectives,
  onQuestionsGenerated,
  isGenerating,
  setIsGenerating,
}: AIQuestionGeneratorProps) {
  const [mode, setMode] = useState<string>("AI_GUIDED");
  const [config, setConfig] = useState<AIGenerationConfig>(defaultConfig);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const totalDistribution = Object.values(config.bloomsDistribution).reduce(
    (sum, val) => sum + val,
    0
  );

  const updateDistribution = useCallback((level: BloomsLevel, value: number) => {
    setConfig((prev) => ({
      ...prev,
      bloomsDistribution: {
        ...prev.bloomsDistribution,
        [level]: value,
      },
    }));
  }, []);

  const normalizeDistribution = useCallback(() => {
    if (totalDistribution === 0) return;
    const factor = 100 / totalDistribution;
    const normalized: BloomsDistribution = {} as BloomsDistribution;
    (Object.keys(config.bloomsDistribution) as BloomsLevel[]).forEach((level) => {
      normalized[level] = Math.round(config.bloomsDistribution[level] * factor);
    });
    // Adjust for rounding errors
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      normalized.APPLY += 100 - sum;
    }
    setConfig((prev) => ({ ...prev, bloomsDistribution: normalized }));
  }, [config.bloomsDistribution, totalDistribution]);

  const toggleQuestionType = useCallback((type: QuestionType) => {
    setConfig((prev) => {
      const types = prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type];
      return { ...prev, questionTypes: types.length > 0 ? types : [type] };
    });
  }, []);

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch("/api/exams/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          config,
          sectionContent,
          learningObjectives,
        }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate questions");
      }

      const data = await response.json();
      onQuestionsGenerated(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
  };

  return (
    <div className="space-y-6">
      {/* Generation Mode Selection */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-violet-500" />
            Generation Mode
          </CardTitle>
          <CardDescription>
            Choose how you want the AI to generate questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {GENERATION_MODES.map((genMode) => {
              const isSelected = mode === genMode.id;
              return (
                <motion.button
                  key={genMode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(genMode.id)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    isSelected
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white",
                      `bg-gradient-to-r ${genMode.color}`
                    )}
                  >
                    {genMode.icon}
                  </div>
                  <h4 className="font-semibold text-sm">{genMode.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {genMode.description}
                  </p>
                  {isSelected && (
                    <motion.div
                      layoutId="mode-indicator"
                      className="absolute top-2 right-2"
                    >
                      <CheckCircle className="h-5 w-5 text-violet-500" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Question Count & Difficulty */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-blue-500" />
            Basic Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Question Count */}
            <div className="space-y-3">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <List className="h-4 w-4 text-slate-500" />
                  Number of Questions
                </span>
                <Badge variant="secondary" className="font-mono">
                  {config.questionCount}
                </Badge>
              </Label>
              <Slider
                value={[config.questionCount]}
                onValueChange={([value]) =>
                  setConfig((prev) => ({ ...prev, questionCount: value }))
                }
                min={1}
                max={50}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>1</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            {/* Creativity */}
            <div className="space-y-3">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Creativity Level
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-mono",
                    config.creativity <= 3
                      ? "bg-blue-100 text-blue-700"
                      : config.creativity <= 6
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {config.creativity <= 3
                    ? "Conservative"
                    : config.creativity <= 6
                    ? "Balanced"
                    : "Creative"}
                </Badge>
              </Label>
              <Slider
                value={[config.creativity]}
                onValueChange={([value]) =>
                  setConfig((prev) => ({ ...prev, creativity: value }))
                }
                min={1}
                max={10}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Factual</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="mt-6 space-y-3">
            <Label>Overall Difficulty</Label>
            <div className="flex gap-2">
              {(["EASY", "MEDIUM", "HARD"] as QuestionDifficulty[]).map((diff) => {
                const isSelected = config.difficulty === diff;
                const colors = {
                  EASY: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
                  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
                  HARD: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400",
                };
                return (
                  <button
                    key={diff}
                    onClick={() => setConfig((prev) => ({ ...prev, difficulty: diff }))}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all",
                      isSelected
                        ? colors[diff]
                        : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    {diff.charAt(0) + diff.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloom&apos;s Distribution (only for Guided mode) */}
      {mode === "AI_GUIDED" && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-violet-500" />
                  Bloom&apos;s Distribution
                </CardTitle>
                <CardDescription>
                  Set the percentage of questions for each cognitive level
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={totalDistribution === 100 ? "default" : "destructive"}
                  className={cn(
                    "font-mono",
                    totalDistribution === 100 && "bg-green-500"
                  )}
                >
                  {totalDistribution}%
                </Badge>
                {totalDistribution !== 100 && (
                  <Button variant="outline" size="sm" onClick={normalizeDistribution}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Normalize
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {(Object.keys(config.bloomsDistribution) as BloomsLevel[]).map((level) => {
                const guidance = BLOOMS_GUIDANCE[level];
                const value = config.bloomsDistribution[level];
                const questionsAtLevel = Math.round((value / 100) * config.questionCount);
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-md", guidance.bgColor, guidance.color)}>
                          {BLOOMS_ICONS[level]}
                        </div>
                        <span className="font-medium text-sm">{guidance.name}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>{guidance.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">
                          ~{questionsAtLevel} questions
                        </span>
                        <Badge variant="outline" className="font-mono w-14 justify-center">
                          {value}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[value]}
                        onValueChange={([val]) => updateDistribution(level, val)}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual distribution preview */}
            <div className="mt-6 h-8 rounded-full overflow-hidden flex">
              {(Object.keys(config.bloomsDistribution) as BloomsLevel[]).map((level) => {
                const guidance = BLOOMS_GUIDANCE[level];
                const value = config.bloomsDistribution[level];
                if (value === 0) return null;
                return (
                  <TooltipProvider key={level}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          className={cn(
                            "h-full flex items-center justify-center text-xs font-medium",
                            guidance.bgColor.replace("bg-", "bg-").replace("/30", ""),
                            guidance.color
                          )}
                          style={{ minWidth: value > 5 ? "auto" : 0 }}
                        >
                          {value >= 10 && guidance.name.slice(0, 3)}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {guidance.name}: {value}%
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Types */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Question Types
          </CardTitle>
          <CardDescription>
            Select which types of questions to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {(Object.keys(QUESTION_TYPE_INFO) as QuestionType[]).map((type) => {
              const info = QUESTION_TYPE_INFO[type];
              const isSelected = config.questionTypes.includes(type);
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleQuestionType(type)}
                  className={cn(
                    "relative p-3 rounded-lg border-2 transition-all",
                    "flex flex-col items-center gap-1.5",
                    isSelected
                      ? "bg-green-50 border-green-500 dark:bg-green-950/30 dark:border-green-400"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-md",
                      isSelected
                        ? "bg-green-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center leading-tight",
                      isSelected
                        ? "text-green-600 dark:text-green-400"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {info.label}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Options */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Additional Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <Label className="cursor-pointer">Include Hints</Label>
                  <p className="text-xs text-slate-500">Add helpful hints to questions</p>
                </div>
              </div>
              <Switch
                checked={config.includeHints}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, includeHints: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="cursor-pointer">Include Explanations</Label>
                  <p className="text-xs text-slate-500">Add detailed answer explanations</p>
                </div>
              </div>
              <Switch
                checked={config.includeExplanations}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, includeExplanations: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <Label className="cursor-pointer">Include Misconceptions</Label>
                  <p className="text-xs text-slate-500">Address common student errors</p>
                </div>
              </div>
              <Switch
                checked={config.includeMisconceptions}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, includeMisconceptions: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="cursor-pointer">Real-World Context</Label>
                  <p className="text-xs text-slate-500">Include practical examples</p>
                </div>
              </div>
              <Switch
                checked={config.realWorldContext}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, realWorldContext: checked }))
                }
              />
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Generation Failed</p>
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      <div className="space-y-3">
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Generating questions...
              </span>
              <span className="font-mono text-violet-600">{generationProgress}%</span>
            </div>
            <Progress value={generationProgress} className="h-2" />
          </div>
        )}

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (mode === "AI_GUIDED" && totalDistribution !== 100)}
            size="lg"
            className={cn(
              "w-full h-14 text-lg font-semibold shadow-lg transition-all",
              "bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600",
              "hover:from-violet-700 hover:via-purple-700 hover:to-violet-700",
              "text-white shadow-violet-500/25",
              isGenerating && "opacity-80"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating {config.questionCount} Questions...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 mr-2" />
                Generate {config.questionCount} Questions
              </>
            )}
          </Button>
        </motion.div>

        {mode === "AI_GUIDED" && totalDistribution !== 100 && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400">
            Distribution must equal 100% (currently {totalDistribution}%)
          </p>
        )}
      </div>
    </div>
  );
}
