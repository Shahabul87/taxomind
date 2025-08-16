"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Wand2, 
  BookOpen, 
  Target,
  Users,
  Clock,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { useAICourseCreator } from "@/hooks/use-ai-course-creator";
import { 
  CourseDifficulty, 
  ContentType, 
  LearningStyle,
  type CourseGenerationResponse 
} from "@/lib/ai-course-types";

// Enhanced form schema for AI-powered course creation
const enhancedFormSchema = z.object({
  // Basic course info (required for simple course creation)
  title: z.string().min(1, "Title is required"),
  
  // AI enhancement fields (optional)
  useAI: z.boolean().default(false),
  topic: z.string().optional(),
  description: z.string().optional(),
  targetAudience: z.string().optional(),
  duration: z.string().optional(),
  difficulty: z.nativeEnum(CourseDifficulty).optional(),
  learningGoals: z.array(z.string()).default([]),
  preferredContentTypes: z.array(z.nativeEnum(ContentType)).default([]),
  learningStyle: z.nativeEnum(LearningStyle).optional(),
});

type FormValues = z.infer<typeof enhancedFormSchema>;

export const AIEnhancedCourseInput = () => {
  const router = useRouter();
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiGeneratedData, setAIGeneratedData] = useState<CourseGenerationResponse | null>(null);
  const [learningGoalsInput, setLearningGoalsInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(enhancedFormSchema),
    defaultValues: {
      title: "",
      useAI: false,
      topic: "",
      description: "",
      targetAudience: "",
      duration: "",
      difficulty: CourseDifficulty.BEGINNER,
      learningGoals: [],
      preferredContentTypes: [],
      learningStyle: undefined,
    },
  });

  const { 
    generateCoursePlan,
    generateQuickSuggestions,
    isGenerating,
    progress,
    suggestions,
    aiState,
    clearAIData
  } = useAICourseCreator({
    onCourseGenerated: (course) => {
      setAIGeneratedData(course);
      // Auto-fill form with AI generated data
      form.setValue("title", course.title);
      form.setValue("description", course.description);
    },
    onError: (error) => {
      toast.error(`AI Generation Failed: ${error}`);
    }
  });

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      // Create course with basic title first
      const courseData = {
        title: values.title,
        description: values.description || undefined,
        // Add AI-generated metadata if available
        ...(aiGeneratedData && {
          courseGoals: aiGeneratedData.courseGoals,
          whatYouWillLearn: aiGeneratedData.whatYouWillLearn,
          // Store AI plan in a field for later use
          aiGenerated: true,
          aiPrompt: JSON.stringify({
            topic: values.topic,
            targetAudience: values.targetAudience,
            difficulty: values.difficulty,
            learningGoals: values.learningGoals
          })
        })
      };

      const response = await axios.post("/api/courses", courseData);
      
      // If we have AI-generated course plan, store it for the course setup page
      if (aiGeneratedData) {
        sessionStorage.setItem(`course-ai-plan-${response.data.id}`, JSON.stringify(aiGeneratedData));
      }

      router.push(`/teacher/courses/${response.data.id}`);
      toast.success("Course created successfully!");
    } catch {
      toast.error("Something went wrong");
    }
  };

  // Handle AI course generation
  const handleGenerateCoursePlan = async () => {
    const values = form.getValues();
    
    if (!values.topic || !values.targetAudience || !values.difficulty) {
      toast.error("Please fill in topic, target audience, and difficulty level");
      return;
    }

    if (values.learningGoals.length === 0) {
      toast.error("Please add at least one learning goal");
      return;
    }

    try {
      const courseRequest = {
        topic: values.topic!,
        description: values.description,
        targetAudience: values.targetAudience!,
        duration: values.duration || "4-6 weeks",
        difficulty: values.difficulty!,
        learningGoals: values.learningGoals,
        preferredContentTypes: values.preferredContentTypes,
        learningStyle: values.learningStyle,
      };

      await generateCoursePlan(courseRequest);
    } catch (error: any) {
      // Error handling is done in the hook
    }
  };

  // Handle adding learning goals
  const addLearningGoal = () => {
    if (!learningGoalsInput.trim()) return;
    
    const currentGoals = form.getValues("learningGoals");
    form.setValue("learningGoals", [...currentGoals, learningGoalsInput.trim()]);
    setLearningGoalsInput("");
  };

  // Handle removing learning goals
  const removeLearningGoal = (index: number) => {
    const currentGoals = form.getValues("learningGoals");
    form.setValue("learningGoals", currentGoals.filter((_, i) => i !== index));
  };

  // Generate quick suggestions when topic and audience change
  const handleGenerateQuickSuggestions = () => {
    const topic = form.getValues("topic");
    const audience = form.getValues("targetAudience");
    if (topic && audience) {
      generateQuickSuggestions(topic, audience);
    }
  };

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* AI Toggle Section */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                AI-Powered Course Creation
              </CardTitle>
              <CardDescription>
                Let AI help you create a comprehensive course plan with structured chapters and curated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant={showAIForm ? "default" : "outline"}
                  onClick={() => {
                    setShowAIForm(!showAIForm);
                    form.setValue("useAI", !showAIForm);
                    if (!showAIForm) {
                      clearAIData();
                    }
                  }}
                  className={cn(
                    "transition-all duration-200",
                    showAIForm && "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {showAIForm ? "Disable AI Assistant" : "Enable AI Assistant"}
                </Button>
                {showAIForm && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    AI Enhanced
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Course Title (Always Visible) */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-200 font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Course Title
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder="e.g. 'Advanced Web Development with Next.js'"
                    {...field}
                    className={cn(
                      "text-base font-medium transition-all duration-200",
                      "bg-white dark:bg-gray-900/50",
                      "border-gray-200 dark:border-gray-700/50",
                      "focus:ring-purple-500/20"
                    )}
                  />
                </FormControl>
                <FormDescription className="text-gray-600 dark:text-gray-400">
                  {showAIForm 
                    ? "This will be generated or refined based on your AI inputs below"
                    : "Choose a clear and engaging title that describes your course content"
                  }
                </FormDescription>
                <FormMessage className="text-rose-600 dark:text-rose-400" />
              </FormItem>
            )}
          />

          {/* AI Enhancement Form */}
          {showAIForm && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Course Planning Details
                </CardTitle>
                <CardDescription>
                  Provide details about your course and let AI generate a comprehensive structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Topic and Target Audience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Course Topic
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. React Development, Data Science, Machine Learning"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (e.target.value && watchedValues.targetAudience) {
                                handleGenerateQuickSuggestions();
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          What subject or technology will this course teach?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Target Audience
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Web developers, Students, Professionals"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (e.target.value && watchedValues.topic) {
                                handleGenerateQuickSuggestions();
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Who is this course designed for?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Duration and Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Course Duration
                        </FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                              <SelectItem value="3-4 weeks">3-4 weeks</SelectItem>
                              <SelectItem value="4-6 weeks">4-6 weeks</SelectItem>
                              <SelectItem value="6-8 weeks">6-8 weeks</SelectItem>
                              <SelectItem value="2-3 months">2-3 months</SelectItem>
                              <SelectItem value="3-6 months">3-6 months</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          How long should this course take to complete?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Difficulty Level
                        </FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={CourseDifficulty.BEGINNER}>
                                Beginner - No prior experience needed
                              </SelectItem>
                              <SelectItem value={CourseDifficulty.INTERMEDIATE}>
                                Intermediate - Some basic knowledge required
                              </SelectItem>
                              <SelectItem value={CourseDifficulty.ADVANCED}>
                                Advanced - Strong foundation required
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          What level of expertise do students need?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Course Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide additional context about your course..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Any additional context to help AI generate better content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Learning Goals */}
                <div className="space-y-4">
                  <FormLabel className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Learning Goals
                  </FormLabel>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a learning goal..."
                      value={learningGoalsInput}
                      onChange={(e) => setLearningGoalsInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLearningGoal();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addLearningGoal}
                      disabled={!learningGoalsInput.trim()}
                    >
                      Add
                    </Button>
                  </div>

                  {watchedValues.learningGoals.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {watchedValues.learningGoals.map((goal, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeLearningGoal(index)}
                        >
                          {goal} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <FormDescription>
                    What specific skills or knowledge will students gain? (Add at least one)
                  </FormDescription>
                </div>

                {/* AI Generation Progress */}
                {isGenerating && (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {progress.status}
                          </span>
                        </div>
                        <Progress 
                          value={(progress.current / progress.total) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Step {progress.current} of {progress.total}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Error Display */}
                {aiState.error && (
                  <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">AI Generation Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {aiState.error}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* AI Generated Course Preview */}
                {aiGeneratedData && (
                  <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        AI Generated Course Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-green-800 dark:text-green-200">
                            {aiGeneratedData.title}
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {aiGeneratedData.description}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-green-800 dark:text-green-200">Duration:</span>
                            <span className="ml-2 text-green-700 dark:text-green-300">
                              {aiGeneratedData.estimatedDuration} hours
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-green-800 dark:text-green-200">Chapters:</span>
                            <span className="ml-2 text-green-700 dark:text-green-300">
                              {aiGeneratedData.chapters.length}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="font-medium text-green-800 dark:text-green-200">Learning Outcomes:</span>
                          <ul className="mt-1 space-y-1">
                            {aiGeneratedData.whatYouWillLearn.slice(0, 3).map((outcome, index) => (
                              <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {outcome}
                              </li>
                            ))}
                            {aiGeneratedData.whatYouWillLearn.length > 3 && (
                              <li className="text-sm text-green-600 dark:text-green-400">
                                +{aiGeneratedData.whatYouWillLearn.length - 3} more outcomes
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generate Course Plan Button */}
                <Button
                  type="button"
                  onClick={handleGenerateCoursePlan}
                  disabled={isGenerating || !watchedValues.topic || !watchedValues.targetAudience || watchedValues.learningGoals.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Course Plan...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate AI Course Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Submit Actions */}
          <div className="flex items-center gap-x-2">
            <Link href="/teacher/courses">
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "flex items-center gap-2",
                  "text-gray-600 dark:text-gray-400",
                  "hover:text-gray-900 dark:hover:text-white",
                  "transition-colors"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to courses
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                "ml-auto transition-all duration-200",
                "bg-purple-600 hover:bg-purple-700",
                "dark:bg-purple-500 dark:hover:bg-purple-600",
                "text-white"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  {aiGeneratedData ? "Create AI-Enhanced Course" : "Create Course"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};