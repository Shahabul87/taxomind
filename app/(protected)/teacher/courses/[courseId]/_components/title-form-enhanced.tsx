"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { logger } from '@/lib/logger';
import {
  Pencil, Sparkles, Loader2, Brain, Languages,
  Target, BookOpen, Zap, RefreshCw, Globe,
  ChevronDown, ChevronUp, Info
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSAMFormSync } from "@/hooks/use-sam-form-sync";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface TitleFormEnhancedProps {
  initialData: {
    title: string;
    description?: string;
    category?: { id: string; name: string };
    learningObjectives?: string[];
  };
  courseId: string;
}

interface GenerationOptions {
  mode: "quick" | "advanced" | "multi-language";
  tone: "professional" | "casual" | "academic" | "creative";
  targetAudience: string;
  language: string;
  variations: number;
  includeKeywords: string[];
  style: "descriptive" | "concise" | "engaging" | "technical";
  context?: {
    category?: string;
    objectives?: string[];
    competitors?: string[];
  };
}

interface GeneratedTitle {
  title: string;
  subtitle?: string;
  language: string;
  score: {
    clarity: number;
    engagement: number;
    seo: number;
    overall: number;
  };
  reasoning: string;
  keywords: string[];
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }).max(100, {
    message: "Title must be less than 100 characters",
  }),
});

export const TitleFormEnhanced = ({
  initialData,
  courseId
}: TitleFormEnhancedProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    mode: "quick",
    tone: "professional",
    targetAudience: "general learners",
    language: "English",
    variations: 3,
    includeKeywords: [],
    style: "engaging",
    context: {
      category: initialData.category?.name,
      objectives: initialData.learningObjectives,
    }
  });

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  // Enable SAM AI Assistant context awareness for course title editing
  useSAMFormSync(`course-title-form-${courseId}`, form.watch, {
    formName: 'Edit Course Title',
    metadata: {
      formType: 'course-title',
      purpose: 'Update course title with AI assistance',
      entityType: 'course',
      courseId,
      category: initialData.category?.name,
      hasObjectives: !!initialData.learningObjectives?.length
    }
  });

  // Generate titles using SAM Content Generation Assistant
  const generateTitles = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedTitles([]);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await axios.post("/api/sam/content-generation", {
        action: "generate-course-titles",
        data: {
          courseId,
          description: initialData.description || "",
          currentTitle: initialData.title,
          options: generationOptions,
          config: {
            model: "advanced",
            temperature: generationOptions.tone === "creative" ? 0.8 : 0.5,
            includeAnalysis: true,
          }
        }
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.data.success && response.data.data.titles) {
        setGeneratedTitles(response.data.data.titles);
        toast.success(`Generated ${response.data.data.titles.length} title variations!`);
      } else {
        // Fallback to demo data
        setGeneratedTitles(getDemoTitles());
      }
    } catch (error: any) {
      logger.error("Title generation error:", error);
      toast.error("Failed to generate titles. Using demo suggestions.");
      setGeneratedTitles(getDemoTitles());
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 500);
    }
  }, [courseId, initialData, generationOptions]);

  const selectTitle = (index: number) => {
    const selected = generatedTitles[index];
    if (selected) {
      form.setValue("title", selected.title);
      form.trigger("title");
      setSelectedTitleIndex(index);
      toast.success("Title selected! You can edit it before saving.");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Course title updated successfully!");
      setIsEditing(false);
      setGeneratedTitles([]);
      setSelectedTitleIndex(null);
      router.refresh();
    } catch {
      toast.error("Failed to update course title");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className={cn(
      "p-4 mt-6 rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/50",
      "hover:bg-gray-50 dark:hover:bg-gray-800/70",
      "backdrop-blur-sm",
      "transition-all duration-200"
    )}>
      <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Course Title
            </p>
            {!initialData.title && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                "text-rose-700 dark:text-rose-400",
                "bg-rose-100 dark:bg-rose-500/10"
              )}>
                Required
              </span>
            )}
            <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300">
              <Brain className="w-3 h-3 mr-1" />
              SAM Enhanced
            </Badge>
          </div>
          {!isEditing && (
            <p className={cn(
              "text-sm sm:text-base font-medium",
              "text-gray-700 dark:text-gray-300",
              !initialData.title && "text-gray-500 dark:text-gray-400 italic"
            )}>
              {initialData.title || "No title set"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setIsEditing(true);
              generateTitles();
            }}
            variant="outline"
            size="sm"
            disabled={isGenerating}
            className={cn(
              "text-purple-700 dark:text-purple-300",
              "border-purple-200 dark:border-purple-700",
              "hover:text-purple-800 dark:hover:text-purple-200",
              "hover:bg-purple-50 dark:hover:bg-purple-500/10",
              "transition-all duration-200"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </>
            )}
          </Button>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
            className={cn(
              "text-purple-700 dark:text-purple-300",
              "border-purple-200 dark:border-purple-700",
              "hover:text-purple-800 dark:hover:text-purple-200",
              "hover:bg-purple-50 dark:hover:bg-purple-500/10",
              "transition-all duration-200"
            )}
          >
            {isEditing ? (
              "Cancel"
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {/* Generation Options */}
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    SAM AI Title Generator
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Options */}
                <Tabs value={generationOptions.mode} onValueChange={(v) => setGenerationOptions({...generationOptions, mode: v as any})}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="quick">
                      <Zap className="w-4 h-4 mr-2" />
                      Quick
                    </TabsTrigger>
                    <TabsTrigger value="advanced">
                      <Brain className="w-4 h-4 mr-2" />
                      Advanced
                    </TabsTrigger>
                    <TabsTrigger value="multi-language">
                      <Globe className="w-4 h-4 mr-2" />
                      Multi-Language
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Advanced Options */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Tone</Label>
                          <Select 
                            value={generationOptions.tone} 
                            onValueChange={(v) => setGenerationOptions({...generationOptions, tone: v as any})}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="creative">Creative</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Style</Label>
                          <Select 
                            value={generationOptions.style} 
                            onValueChange={(v) => setGenerationOptions({...generationOptions, style: v as any})}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="descriptive">Descriptive</SelectItem>
                              <SelectItem value="concise">Concise</SelectItem>
                              <SelectItem value="engaging">Engaging</SelectItem>
                              <SelectItem value="technical">Technical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Target Audience</Label>
                        <Input 
                          value={generationOptions.targetAudience}
                          onChange={(e) => setGenerationOptions({...generationOptions, targetAudience: e.target.value})}
                          placeholder="e.g., beginners, professionals, students"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Number of Variations</Label>
                        <RadioGroup 
                          value={generationOptions.variations.toString()} 
                          onValueChange={(v) => setGenerationOptions({...generationOptions, variations: parseInt(v)})}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3" id="r1" />
                            <Label htmlFor="r1" className="text-xs">3</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="5" id="r2" />
                            <Label htmlFor="r2" className="text-xs">5</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="10" id="r3" />
                            <Label htmlFor="r3" className="text-xs">10</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  onClick={generateTitles}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating {generationOptions.variations} Titles...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate {generationOptions.variations} Title Variations
                    </>
                  )}
                </Button>

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} className="h-2" />
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                      SAM AI is crafting perfect titles...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Titles */}
            {generatedTitles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Generated Titles
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateTitles}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedTitles.map((generated, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        selectedTitleIndex === index
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                      )}
                      onClick={() => selectTitle(index)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {generated.title}
                            </h4>
                            {generated.subtitle && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {generated.subtitle}
                              </p>
                            )}
                          </div>
                          {generated.language !== "English" && (
                            <Badge variant="outline" className="text-xs">
                              <Languages className="w-3 h-3 mr-1" />
                              {generated.language}
                            </Badge>
                          )}
                        </div>

                        {/* Scores */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span className={getScoreColor(generated.score.clarity)}>
                              Clarity: {generated.score.clarity}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span className={getScoreColor(generated.score.engagement)}>
                              Engagement: {generated.score.engagement}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span className={getScoreColor(generated.score.seo)}>
                              SEO: {generated.score.seo}%
                            </span>
                          </div>
                        </div>

                        {/* Keywords */}
                        <div className="flex flex-wrap gap-1">
                          {generated.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>

                        {/* AI Reasoning */}
                        <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-400">
                          <Info className="w-3 h-3 mt-0.5" />
                          <p>{generated.reasoning}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Manual Input Form */}
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Course Title</Label>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              placeholder="e.g. 'Advanced Web Development with React'"
                              className={cn(
                                "bg-white dark:bg-gray-900/50",
                                "border-gray-200 dark:border-gray-700/50",
                                selectedTitleIndex !== null && "ring-2 ring-purple-500"
                              )}
                            />
                          </FormControl>
                          <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        disabled={!isValid || isSubmitting}
                        type="submit"
                        className={cn(
                          "bg-purple-600 hover:bg-purple-700",
                          "text-white",
                          "transition-all duration-200"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Title"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setGeneratedTitles([]);
                          setSelectedTitleIndex(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Demo data fallback
function getDemoTitles(): GeneratedTitle[] {
  return [
    {
      title: "Master React: From Fundamentals to Advanced Patterns",
      subtitle: "Build Modern Web Applications with Confidence",
      language: "English",
      score: { clarity: 92, engagement: 88, seo: 85, overall: 88 },
      reasoning: "Clear progression path, includes target technology and outcome",
      keywords: ["React", "Web Development", "Advanced", "Modern"],
    },
    {
      title: "The Complete React Developer Course 2024",
      subtitle: "Learn Hooks, Context, Redux & Real-World Projects",
      language: "English",
      score: { clarity: 85, engagement: 90, seo: 92, overall: 89 },
      reasoning: "Time-relevant, comprehensive scope, specific technologies mentioned",
      keywords: ["React", "2024", "Complete", "Developer"],
    },
    {
      title: "React Mastery: Professional Web Development",
      subtitle: "Industry-Ready Skills for Modern Developers",
      language: "English",
      score: { clarity: 88, engagement: 82, seo: 80, overall: 83 },
      reasoning: "Professional focus, clear outcome, industry-oriented",
      keywords: ["React", "Professional", "Mastery", "Web Development"],
    },
  ];
}