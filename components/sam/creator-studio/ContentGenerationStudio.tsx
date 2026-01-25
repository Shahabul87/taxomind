"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Code,
  Languages,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Wand2,
  Copy,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContentGenerationStudioProps {
  className?: string;
  compact?: boolean;
}

interface LearningObjective {
  id: string;
  objective: string;
  bloomsLevel: string;
  skills: string[];
}

interface GeneratedContent {
  id: string;
  type: string;
  title: string;
  content: unknown;
  quality: number;
  createdAt: Date;
}

const BLOOMS_LEVELS = [
  { value: "remember", label: "Remember", color: "bg-red-100 text-red-700" },
  { value: "understand", label: "Understand", color: "bg-orange-100 text-orange-700" },
  { value: "apply", label: "Apply", color: "bg-yellow-100 text-yellow-700" },
  { value: "analyze", label: "Analyze", color: "bg-green-100 text-green-700" },
  { value: "evaluate", label: "Evaluate", color: "bg-blue-100 text-blue-700" },
  { value: "create", label: "Create", color: "bg-purple-100 text-purple-700" },
];

const CONTENT_STYLES = [
  { value: "formal", label: "Formal Academic" },
  { value: "conversational", label: "Conversational" },
  { value: "technical", label: "Technical" },
  { value: "beginner-friendly", label: "Beginner Friendly" },
];

const DEPTH_LEVELS = [
  { value: "introductory", label: "Introductory" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const ASSESSMENT_TYPES = [
  { value: "quiz", label: "Quiz" },
  { value: "exam", label: "Exam" },
  { value: "practice", label: "Practice Questions" },
  { value: "self-assessment", label: "Self Assessment" },
];

const EXERCISE_TYPES = [
  { value: "coding", label: "Coding Exercise" },
  { value: "problem-solving", label: "Problem Solving" },
  { value: "case-study", label: "Case Study" },
  { value: "simulation", label: "Simulation" },
];

export function ContentGenerationStudio({ className, compact = false }: ContentGenerationStudioProps) {
  const [activeTab, setActiveTab] = useState("course");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Course generation state
  const [objectives, setObjectives] = useState<LearningObjective[]>([
    { id: "1", objective: "", bloomsLevel: "understand", skills: [] },
  ]);
  const [courseConfig, setCourseConfig] = useState({
    style: "formal",
    depth: "intermediate",
    includeExamples: true,
    includeVisuals: false,
    includeActivities: true,
    targetAudience: "",
  });

  // Assessment generation state
  const [assessmentTopics, setAssessmentTopics] = useState<string[]>([""]);
  const [assessmentType, setAssessmentType] = useState("quiz");
  const [questionCount, setQuestionCount] = useState(10);

  // Exercise generation state
  const [exerciseConcepts, setExerciseConcepts] = useState<string[]>([""]);
  const [exerciseType, setExerciseType] = useState("coding");

  // Translation state
  const [translateContent, setTranslateContent] = useState({ title: "", body: "" });
  const [targetLanguage, setTargetLanguage] = useState("Spanish");

  const addObjective = useCallback(() => {
    setObjectives((prev) => [
      ...prev,
      { id: Date.now().toString(), objective: "", bloomsLevel: "understand", skills: [] },
    ]);
  }, []);

  const removeObjective = useCallback((id: string) => {
    setObjectives((prev) => prev.filter((obj) => obj.id !== id));
  }, []);

  const updateObjective = useCallback((id: string, field: keyof LearningObjective, value: string | string[]) => {
    setObjectives((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, [field]: value } : obj))
    );
  }, []);

  const handleGenerateCourse = useCallback(async () => {
    if (objectives.every((obj) => !obj.objective.trim())) {
      toast.error("Please add at least one learning objective");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await fetch("/api/sam/content-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-course",
          data: {
            objectives: objectives.filter((obj) => obj.objective.trim()),
            config: courseConfig,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGenerationProgress(100);
        setGeneratedContent((prev) => [
          {
            id: Date.now().toString(),
            type: "course",
            title: "Generated Course Content",
            content: result.data,
            quality: 0.85,
            createdAt: new Date(),
          },
          ...prev,
        ]);
        toast.success("Course content generated successfully!");
      } else {
        throw new Error(result.error || "Generation failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [objectives, courseConfig]);

  const handleGenerateAssessments = useCallback(async () => {
    const validTopics = assessmentTopics.filter((t) => t.trim());
    if (validTopics.length === 0) {
      toast.error("Please add at least one topic");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await fetch("/api/sam/content-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-assessments",
          data: {
            topics: validTopics.map((name) => ({ name })),
            assessmentType,
            config: { questionCount },
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGenerationProgress(100);
        setGeneratedContent((prev) => [
          {
            id: Date.now().toString(),
            type: "assessment",
            title: `Generated ${assessmentType}`,
            content: result.data,
            quality: 0.88,
            createdAt: new Date(),
          },
          ...prev,
        ]);
        toast.success("Assessment generated successfully!");
      } else {
        throw new Error(result.error || "Generation failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate assessment");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [assessmentTopics, assessmentType, questionCount]);

  const handleGenerateExercises = useCallback(async () => {
    const validConcepts = exerciseConcepts.filter((c) => c.trim());
    if (validConcepts.length === 0) {
      toast.error("Please add at least one concept");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await fetch("/api/sam/content-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-exercises",
          data: {
            concepts: validConcepts.map((name) => ({ name })),
            exerciseType,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGenerationProgress(100);
        setGeneratedContent((prev) => [
          {
            id: Date.now().toString(),
            type: "exercise",
            title: `Generated ${exerciseType}`,
            content: result.data,
            quality: 0.82,
            createdAt: new Date(),
          },
          ...prev,
        ]);
        toast.success("Exercises generated successfully!");
      } else {
        throw new Error(result.error || "Generation failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate exercises");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [exerciseConcepts, exerciseType]);

  const handleTranslateContent = useCallback(async () => {
    if (!translateContent.title.trim() || !translateContent.body.trim()) {
      toast.error("Please provide content title and body");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 15, 90));
    }, 400);

    try {
      const response = await fetch("/api/sam/content-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translate-content",
          data: {
            content: translateContent,
            targetLanguage: { code: targetLanguage.toLowerCase().slice(0, 2), name: targetLanguage },
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGenerationProgress(100);
        setGeneratedContent((prev) => [
          {
            id: Date.now().toString(),
            type: "translation",
            title: `Translated to ${targetLanguage}`,
            content: result.data,
            quality: 0.9,
            createdAt: new Date(),
          },
          ...prev,
        ]);
        toast.success("Content translated successfully!");
      } else {
        throw new Error(result.error || "Translation failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to translate content");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [translateContent, targetLanguage]);

  const copyToClipboard = useCallback((content: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    toast.success("Copied to clipboard!");
  }, []);

  const downloadContent = useCallback((content: GeneratedContent) => {
    const blob = new Blob([JSON.stringify(content.content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.type}-${content.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (compact) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Content Generator</CardTitle>
              <CardDescription>AI-powered content creation</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveTab("course")}>
              <BookOpen className="h-4 w-4 mr-2" />
              Course
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("assessment")}>
              <FileQuestion className="h-4 w-4 mr-2" />
              Assessment
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("exercise")}>
              <Code className="h-4 w-4 mr-2" />
              Exercises
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("translate")}>
              <Languages className="h-4 w-4 mr-2" />
              Translate
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
              <Wand2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Content Generation Studio</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Create courses, assessments, exercises, and translations with AI
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs shrink-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium Feature
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Generation Progress */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 sm:p-4 rounded-lg bg-violet-50 border border-violet-200"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-violet-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-violet-700">
                  Generating content with SAM AI...
                </span>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-violet-600 mt-1 text-right">{generationProgress}%</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full h-auto">
            <TabsTrigger value="course" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Course</span>
            </TabsTrigger>
            <TabsTrigger value="assessment" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <FileQuestion className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Assessment</span>
            </TabsTrigger>
            <TabsTrigger value="exercise" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Exercises</span>
            </TabsTrigger>
            <TabsTrigger value="translate" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Translate</span>
            </TabsTrigger>
          </TabsList>

          {/* Course Generation Tab */}
          <TabsContent value="course" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h4 className="text-sm sm:text-base font-medium">Learning Objectives</h4>
                <Button variant="outline" size="sm" onClick={addObjective} className="w-full sm:w-auto text-xs sm:text-sm">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  Add Objective
                </Button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {objectives.map((obj, index) => (
                  <div key={obj.id} className="p-2.5 sm:p-3 rounded-lg border bg-slate-50/50 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-medium text-slate-500 mt-2 shrink-0">
                        {index + 1}.
                      </span>
                      <div className="flex-1 space-y-2 min-w-0">
                        <Input
                          placeholder="Enter learning objective..."
                          value={obj.objective}
                          onChange={(e) => updateObjective(obj.id, "objective", e.target.value)}
                          className="text-xs sm:text-sm"
                        />
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Select
                            value={obj.bloomsLevel}
                            onValueChange={(value) => updateObjective(obj.id, "bloomsLevel", value)}
                          >
                            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                              <SelectValue placeholder="Bloom&apos;s Level" />
                            </SelectTrigger>
                            <SelectContent>
                              {BLOOMS_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  <Badge className={cn("mr-2", level.color)}>{level.label}</Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Skills (comma-separated)"
                            value={obj.skills.join(", ")}
                            onChange={(e) =>
                              updateObjective(
                                obj.id,
                                "skills",
                                e.target.value.split(",").map((s) => s.trim())
                              )
                            }
                            className="flex-1 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                      {objectives.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeObjective(obj.id)}
                          className="text-red-500 hover:text-red-700 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Advanced Options */}
              <div className="space-y-2 sm:space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full justify-between text-xs sm:text-sm"
                >
                  <span>Advanced Options</span>
                  {showAdvanced ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </Button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border bg-slate-50/50"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label>Content Style</Label>
                          <Select
                            value={courseConfig.style}
                            onValueChange={(value) =>
                              setCourseConfig((prev) => ({ ...prev, style: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONTENT_STYLES.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  {style.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Depth Level</Label>
                          <Select
                            value={courseConfig.depth}
                            onValueChange={(value) =>
                              setCourseConfig((prev) => ({ ...prev, depth: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPTH_LEVELS.map((depth) => (
                                <SelectItem key={depth.value} value={depth.value}>
                                  {depth.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Input
                          placeholder="e.g., Software developers, Students, Beginners"
                          value={courseConfig.targetAudience}
                          onChange={(e) =>
                            setCourseConfig((prev) => ({ ...prev, targetAudience: e.target.value }))
                          }
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={courseConfig.includeExamples}
                            onCheckedChange={(checked) =>
                              setCourseConfig((prev) => ({ ...prev, includeExamples: checked }))
                            }
                          />
                          <Label className="text-xs sm:text-sm">Include Examples</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={courseConfig.includeActivities}
                            onCheckedChange={(checked) =>
                              setCourseConfig((prev) => ({ ...prev, includeActivities: checked }))
                            }
                          />
                          <Label className="text-xs sm:text-sm">Include Activities</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={courseConfig.includeVisuals}
                            onCheckedChange={(checked) =>
                              setCourseConfig((prev) => ({ ...prev, includeVisuals: checked }))
                            }
                          />
                          <Label className="text-xs sm:text-sm">Include Visuals</Label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                onClick={handleGenerateCourse}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-xs sm:text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                )}
                Generate Course Content
              </Button>
            </div>
          </TabsContent>

          {/* Assessment Generation Tab */}
          <TabsContent value="assessment" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h4 className="text-sm sm:text-base font-medium">Assessment Topics</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssessmentTopics((prev) => [...prev, ""])}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  Add Topic
                </Button>
              </div>

              <div className="space-y-2">
                {assessmentTopics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Topic ${index + 1}...`}
                      value={topic}
                      onChange={(e) =>
                        setAssessmentTopics((prev) =>
                          prev.map((t, i) => (i === index ? e.target.value : t))
                        )
                      }
                      className="text-xs sm:text-sm"
                    />
                    {assessmentTopics.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAssessmentTopics((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-red-500 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Assessment Type</Label>
                  <Select value={assessmentType} onValueChange={setAssessmentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSESSMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateAssessments}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-xs sm:text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <FileQuestion className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                )}
                Generate Assessment
              </Button>
            </div>
          </TabsContent>

          {/* Exercise Generation Tab */}
          <TabsContent value="exercise" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h4 className="text-sm sm:text-base font-medium">Concepts to Practice</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExerciseConcepts((prev) => [...prev, ""])}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  Add Concept
                </Button>
              </div>

              <div className="space-y-2">
                {exerciseConcepts.map((concept, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Concept ${index + 1}...`}
                      value={concept}
                      onChange={(e) =>
                        setExerciseConcepts((prev) =>
                          prev.map((c, i) => (i === index ? e.target.value : c))
                        )
                      }
                    />
                    {exerciseConcepts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExerciseConcepts((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Exercise Type</Label>
                <Select value={exerciseType} onValueChange={setExerciseType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateExercises}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-xs sm:text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                )}
                Generate Exercises
              </Button>
            </div>
          </TabsContent>

          {/* Translation Tab */}
          <TabsContent value="translate" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Content Title</Label>
                <Input
                  placeholder="Enter content title..."
                  value={translateContent.title}
                  onChange={(e) =>
                    setTranslateContent((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Content Body</Label>
                <Textarea
                  placeholder="Enter content to translate..."
                  value={translateContent.body}
                  onChange={(e) =>
                    setTranslateContent((prev) => ({ ...prev, body: e.target.value }))
                  }
                  rows={6}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Target Language</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleTranslateContent}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-xs sm:text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                )}
                Translate Content
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generated Content History */}
        {generatedContent.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-sm sm:text-base font-medium flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
              Generated Content ({generatedContent.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {generatedContent.map((content) => (
                <div
                  key={content.id}
                  className="p-2.5 sm:p-3 rounded-lg border bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="capitalize text-xs shrink-0">
                      {content.type}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">{content.title}</p>
                      <p className="text-xs text-slate-500">
                        Quality: {Math.round(content.quality * 100)}% •{" "}
                        {content.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(content.content)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => downloadContent(content)} className="h-8 w-8 p-0">
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
