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
  Plus,
  Trash2,
  HelpCircle,
  Check,
  X,
  ChevronRight,
  Info,
  Zap,
  Target,
  BookOpen,
  List,
  CheckCircle,
  Edit3,
  FileText,
  MinusSquare,
  Link,
  ListOrdered,
  AlertCircle,
  Clock,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  EnhancedQuestionFormData,
  QuestionOption,
  BLOOMS_GUIDANCE,
  QUESTION_TYPE_INFO,
  COGNITIVE_SKILL_OPTIONS,
} from "./types";

interface ManualQuestionCreatorProps {
  onAddQuestion: (question: EnhancedQuestionFormData) => void;
  learningObjectives?: Array<{ id: string; objective: string; bloomsLevel: BloomsLevel }>;
}

const BLOOMS_ICONS: Record<BloomsLevel, React.ReactNode> = {
  REMEMBER: <Brain className="h-5 w-5" />,
  UNDERSTAND: <Lightbulb className="h-5 w-5" />,
  APPLY: <Wrench className="h-5 w-5" />,
  ANALYZE: <Search className="h-5 w-5" />,
  EVALUATE: <Scale className="h-5 w-5" />,
  CREATE: <Sparkles className="h-5 w-5" />,
};

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  MULTIPLE_CHOICE: <List className="h-4 w-4" />,
  TRUE_FALSE: <CheckCircle className="h-4 w-4" />,
  SHORT_ANSWER: <Edit3 className="h-4 w-4" />,
  ESSAY: <FileText className="h-4 w-4" />,
  FILL_IN_BLANK: <MinusSquare className="h-4 w-4" />,
  MATCHING: <Link className="h-4 w-4" />,
  ORDERING: <ListOrdered className="h-4 w-4" />,
};

const DIFFICULTY_OPTIONS: Array<{ value: QuestionDifficulty; label: string; color: string }> = [
  { value: "EASY", label: "Easy", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "HARD", label: "Hard", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

const defaultFormData: EnhancedQuestionFormData = {
  question: "",
  questionType: "MULTIPLE_CHOICE",
  bloomsLevel: "UNDERSTAND",
  difficulty: "MEDIUM",
  points: 2,
  estimatedTime: 60,
  options: [
    { id: "opt-1", text: "", isCorrect: true },
    { id: "opt-2", text: "", isCorrect: false },
    { id: "opt-3", text: "", isCorrect: false },
    { id: "opt-4", text: "", isCorrect: false },
  ],
  correctAnswer: "",
  hint: "",
  explanation: "",
  cognitiveSkills: [],
  relatedConcepts: [],
};

export function ManualQuestionCreator({
  onAddQuestion,
  learningObjectives = [],
}: ManualQuestionCreatorProps) {
  const [formData, setFormData] = useState<EnhancedQuestionFormData>(defaultFormData);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedObjective, setSelectedObjective] = useState<string | undefined>();

  const currentGuidance = BLOOMS_GUIDANCE[formData.bloomsLevel];

  const updateFormData = useCallback(
    <K extends keyof EnhancedQuestionFormData>(
      field: K,
      value: EnhancedQuestionFormData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear validation error when field is updated
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  const handleBloomsLevelChange = (level: BloomsLevel) => {
    const guidance = BLOOMS_GUIDANCE[level];
    updateFormData("bloomsLevel", level);
    updateFormData("points", guidance.typicalPoints);
    updateFormData("estimatedTime", Math.round(
      (guidance.estimatedTimeRange.min + guidance.estimatedTimeRange.max) / 2
    ));
    // Suggest appropriate question type
    if (!guidance.appropriateQuestionTypes.includes(formData.questionType)) {
      updateFormData("questionType", guidance.appropriateQuestionTypes[0]);
    }
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    updateFormData("questionType", type);
    // Reset options for MCQ
    if (type === "MULTIPLE_CHOICE") {
      updateFormData("options", [
        { id: "opt-1", text: "", isCorrect: true },
        { id: "opt-2", text: "", isCorrect: false },
        { id: "opt-3", text: "", isCorrect: false },
        { id: "opt-4", text: "", isCorrect: false },
      ]);
    } else if (type === "TRUE_FALSE") {
      updateFormData("options", [
        { id: "opt-true", text: "True", isCorrect: true },
        { id: "opt-false", text: "False", isCorrect: false },
      ]);
    }
  };

  const updateOption = (index: number, field: keyof QuestionOption, value: string | boolean) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // If setting this option as correct, unset others
    if (field === "isCorrect" && value === true) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    updateFormData("options", newOptions);
  };

  const addOption = () => {
    const newOptions = [
      ...(formData.options || []),
      { id: `opt-${Date.now()}`, text: "", isCorrect: false },
    ];
    updateFormData("options", newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = (formData.options || []).filter((_, i) => i !== index);
    // Ensure at least one option is correct
    if (!newOptions.some((opt) => opt.isCorrect) && newOptions.length > 0) {
      newOptions[0].isCorrect = true;
    }
    updateFormData("options", newOptions);
  };

  const toggleCognitiveSkill = (skill: string) => {
    const skills = formData.cognitiveSkills || [];
    if (skills.includes(skill)) {
      updateFormData(
        "cognitiveSkills",
        skills.filter((s) => s !== skill)
      );
    } else {
      updateFormData("cognitiveSkills", [...skills, skill]);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.question.trim()) {
      errors.question = "Question is required";
    }

    if (formData.questionType === "MULTIPLE_CHOICE" || formData.questionType === "TRUE_FALSE") {
      const options = formData.options || [];
      if (options.length < 2) {
        errors.options = "At least 2 options are required";
      }
      if (!options.some((opt) => opt.isCorrect)) {
        errors.options = "Please mark at least one correct answer";
      }
      if (options.some((opt) => !opt.text.trim())) {
        errors.options = "All options must have text";
      }
    } else if (!formData.correctAnswer.trim()) {
      errors.correctAnswer = "Correct answer is required";
    }

    if (!formData.explanation.trim()) {
      errors.explanation = "Explanation is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Set correct answer from options for MCQ/TF
    let finalData = { ...formData };
    if (formData.questionType === "MULTIPLE_CHOICE" || formData.questionType === "TRUE_FALSE") {
      const correctOption = formData.options?.find((opt) => opt.isCorrect);
      finalData.correctAnswer = correctOption?.text || "";
    }

    if (selectedObjective) {
      finalData.learningObjectiveId = selectedObjective;
    }

    onAddQuestion(finalData);

    // Reset form
    setFormData(defaultFormData);
    setSelectedObjective(undefined);
    setShowAdvanced(false);
  };

  return (
    <div className="space-y-6">
      {/* Bloom&apos;s Level Selector */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-500" />
            Select Cognitive Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {(Object.keys(BLOOMS_GUIDANCE) as BloomsLevel[]).map((level) => {
              const guidance = BLOOMS_GUIDANCE[level];
              const isSelected = formData.bloomsLevel === level;
              return (
                <TooltipProvider key={level}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBloomsLevelChange(level)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 transition-all duration-200",
                          "flex flex-col items-center gap-2",
                          isSelected
                            ? `${guidance.bgColor} ${guidance.borderColor} shadow-md`
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg", guidance.bgColor, guidance.color)}>
                          {BLOOMS_ICONS[level]}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected ? guidance.color : "text-slate-600 dark:text-slate-300"
                        )}>
                          {guidance.name}
                        </span>
                        {isSelected && (
                          <motion.div
                            layoutId="blooms-indicator"
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-violet-500"
                          />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium">{guidance.name}</p>
                      <p className="text-sm text-slate-500">{guidance.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Bloom&apos;s Guidance Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={formData.bloomsLevel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "mt-4 p-4 rounded-xl",
                currentGuidance.bgColor,
                "border",
                currentGuidance.borderColor
              )}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className={cn("font-medium mb-2 flex items-center gap-2", currentGuidance.color)}>
                    <Zap className="h-4 w-4" />
                    Question Starters
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {currentGuidance.questionStarters.map((starter, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                        onClick={() => {
                          if (!formData.question) {
                            updateFormData("question", starter);
                          }
                        }}
                      >
                        {starter}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className={cn("font-medium mb-2 flex items-center gap-2", currentGuidance.color)}>
                    <BookOpen className="h-4 w-4" />
                    Verbs to Use
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {currentGuidance.verbsToUse.map((verb, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {verb}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Suggested points: <strong>{currentGuidance.typicalPoints}</strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Est. time: <strong>{currentGuidance.estimatedTimeRange.min}-{currentGuidance.estimatedTimeRange.max}s</strong>
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Question Type Selector */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <List className="h-5 w-5 text-blue-500" />
            Question Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {(Object.keys(QUESTION_TYPE_INFO) as QuestionType[]).map((type) => {
              const info = QUESTION_TYPE_INFO[type];
              const isSelected = formData.questionType === type;
              const isRecommended = currentGuidance.appropriateQuestionTypes.includes(type);
              return (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuestionTypeChange(type)}
                        className={cn(
                          "relative p-3 rounded-lg border-2 transition-all",
                          "flex flex-col items-center gap-1.5",
                          isSelected
                            ? "bg-blue-50 border-blue-500 dark:bg-blue-950/30 dark:border-blue-400"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                          isRecommended && !isSelected && "ring-2 ring-green-200 dark:ring-green-800"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md",
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        )}>
                          {QUESTION_TYPE_ICONS[type]}
                        </div>
                        <span className={cn(
                          "text-xs font-medium text-center leading-tight",
                          isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                        )}>
                          {info.label}
                        </span>
                        {isRecommended && (
                          <Badge className="absolute -top-1 -right-1 text-[10px] px-1 py-0 bg-green-500">
                            ✓
                          </Badge>
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{info.label}</p>
                      <p className="text-sm text-slate-500">{info.description}</p>
                      {isRecommended && (
                        <p className="text-xs text-green-500 mt-1">
                          ✓ Recommended for {currentGuidance.name}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Question Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-purple-500" />
            Question Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question" className="flex items-center gap-2">
              Question
              {validationErrors.question && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.question}
                </span>
              )}
            </Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => updateFormData("question", e.target.value)}
              placeholder={`Start with: ${currentGuidance.questionStarters[0]} ...`}
              className={cn(
                "min-h-[100px] resize-none",
                validationErrors.question && "border-red-500"
              )}
            />
          </div>

          {/* Options for MCQ / True-False */}
          {(formData.questionType === "MULTIPLE_CHOICE" || formData.questionType === "TRUE_FALSE") && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Answer Options
                {validationErrors.options && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.options}
                  </span>
                )}
              </Label>
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => updateOption(index, "isCorrect", true)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                        option.isCorrect
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-green-400"
                      )}
                    >
                      {option.isCorrect ? <Check className="h-4 w-4" /> : null}
                    </button>
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(index, "text", e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                      disabled={formData.questionType === "TRUE_FALSE"}
                    />
                    {formData.questionType === "MULTIPLE_CHOICE" && formData.options!.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
              {formData.questionType === "MULTIPLE_CHOICE" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
          )}

          {/* Correct Answer for non-MCQ types */}
          {formData.questionType !== "MULTIPLE_CHOICE" && formData.questionType !== "TRUE_FALSE" && (
            <div className="space-y-2">
              <Label htmlFor="correctAnswer" className="flex items-center gap-2">
                {formData.questionType === "ESSAY" ? "Key Points / Rubric" : "Correct Answer"}
                {validationErrors.correctAnswer && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.correctAnswer}
                  </span>
                )}
              </Label>
              <Textarea
                id="correctAnswer"
                value={formData.correctAnswer}
                onChange={(e) => updateFormData("correctAnswer", e.target.value)}
                placeholder={
                  formData.questionType === "ESSAY"
                    ? "List key points students should include..."
                    : "Enter the correct answer..."
                }
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Difficulty & Points Row */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => updateFormData("difficulty", diff.value)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      formData.difficulty === diff.value
                        ? diff.color
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                    )}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Points */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Points: {formData.points}
              </Label>
              <Slider
                value={[formData.points]}
                onValueChange={([value]) => updateFormData("points", value)}
                min={1}
                max={10}
                step={1}
                className="py-2"
              />
            </div>

            {/* Estimated Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Est. Time: {formData.estimatedTime}s
              </Label>
              <Slider
                value={[formData.estimatedTime]}
                onValueChange={([value]) => updateFormData("estimatedTime", value)}
                min={15}
                max={600}
                step={15}
                className="py-2"
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation" className="flex items-center gap-2">
              Explanation
              {validationErrors.explanation && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.explanation}
                </span>
              )}
            </Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => updateFormData("explanation", e.target.value)}
              placeholder="Explain why this answer is correct and address common misconceptions..."
              className="min-h-[80px]"
            />
          </div>

          {/* Hint */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hint" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-500" />
                Hint (Optional)
              </Label>
            </div>
            <Input
              id="hint"
              value={formData.hint || ""}
              onChange={(e) => updateFormData("hint", e.target.value)}
              placeholder="Provide a helpful hint without giving away the answer..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Advanced Options
            </CardTitle>
            <ChevronRight
              className={cn(
                "h-5 w-5 transition-transform",
                showAdvanced && "rotate-90"
              )}
            />
          </button>
        </CardHeader>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-4 pt-0">
                {/* Learning Objective */}
                {learningObjectives.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Learning Objective</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      {learningObjectives.map((obj) => (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => setSelectedObjective(
                            selectedObjective === obj.id ? undefined : obj.id
                          )}
                          className={cn(
                            "p-2 rounded-lg text-left text-sm transition-all",
                            selectedObjective === obj.id
                              ? "bg-violet-100 dark:bg-violet-900/30 border-violet-500"
                              : "bg-white dark:bg-slate-800 hover:bg-slate-100"
                          )}
                        >
                          <Badge className="mb-1" variant="outline">
                            {obj.bloomsLevel}
                          </Badge>
                          <p className="line-clamp-2">{obj.objective}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cognitive Skills */}
                <div className="space-y-2">
                  <Label>Cognitive Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {COGNITIVE_SKILL_OPTIONS.map((skill) => {
                      const isSelected = formData.cognitiveSkills?.includes(skill.value);
                      return (
                        <Badge
                          key={skill.value}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all",
                            isSelected && "bg-violet-500 hover:bg-violet-600"
                          )}
                          onClick={() => toggleCognitiveSkill(skill.value)}
                        >
                          {skill.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Related Concepts */}
                <div className="space-y-2">
                  <Label htmlFor="relatedConcepts">Related Concepts (comma-separated)</Label>
                  <Input
                    id="relatedConcepts"
                    value={(formData.relatedConcepts || []).join(", ")}
                    onChange={(e) =>
                      updateFormData(
                        "relatedConcepts",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="e.g., photosynthesis, cellular respiration, ATP"
                  />
                </div>

                {/* Acceptable Variations (for short answer) */}
                {formData.questionType === "SHORT_ANSWER" && (
                  <div className="space-y-2">
                    <Label htmlFor="variations">Acceptable Variations (one per line)</Label>
                    <Textarea
                      id="variations"
                      value={(formData.acceptableVariations || []).join("\n")}
                      onChange={(e) =>
                        updateFormData(
                          "acceptableVariations",
                          e.target.value.split("\n").filter(Boolean)
                        )
                      }
                      placeholder="Enter alternative correct answers, one per line..."
                      className="min-h-[60px]"
                    />
                  </div>
                )}

                {/* Common Misconceptions */}
                <div className="space-y-2">
                  <Label htmlFor="misconceptions">Common Misconceptions (one per line)</Label>
                  <Textarea
                    id="misconceptions"
                    value={(formData.commonMisconceptions || []).join("\n")}
                    onChange={(e) =>
                      updateFormData(
                        "commonMisconceptions",
                        e.target.value.split("\n").filter(Boolean)
                      )
                    }
                    placeholder="List common student misconceptions to address..."
                    className="min-h-[60px]"
                  />
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Submit Button */}
      <motion.div
        className="flex justify-end"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Button
          onClick={handleSubmit}
          size="lg"
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Question
        </Button>
      </motion.div>
    </div>
  );
}
