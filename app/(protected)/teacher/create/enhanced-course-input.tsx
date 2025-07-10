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
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Users,
  Clock,
  BarChart3,
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

// Base form schema (original)
const baseFormSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

// Extended schema for AI features
const aiFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  topic: z.string().optional(),
  description: z.string().optional(),
  targetAudience: z.string().optional(),
  duration: z.string().optional(),
  difficulty: z.nativeEnum(CourseDifficulty).optional(),
  learningGoals: z.array(z.string()).default([]),
});

type BaseFormValues = z.infer<typeof baseFormSchema>;
type AIFormValues = z.infer<typeof aiFormSchema>;

export const EnhancedCourseInputSection = () => {
  const router = useRouter();
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [aiGeneratedData, setAIGeneratedData] = useState<CourseGenerationResponse | null>(null);
  const [learningGoalsInput, setLearningGoalsInput] = useState("");

  // Use AI form schema when AI options are enabled, base schema otherwise
  const form = useForm<AIFormValues>({
    resolver: zodResolver(showAIOptions ? aiFormSchema : baseFormSchema),
    defaultValues: {
      title: "",
      topic: "",
      description: "",
      targetAudience: "",
      duration: "",
      difficulty: CourseDifficulty.BEGINNER,
      learningGoals: [],
    },
  });

  const { 
    generateCoursePlan,
    isGenerating,
    progress,
    aiState,
  } = useAICourseCreator({
    onCourseGenerated: (course) => {
      setAIGeneratedData(course);
      // Auto-fill form with AI generated data
      form.setValue("title", course.title);
      form.setValue("description", course.description);
      toast.success("AI course plan generated! Review and create your course.");
    },
    onError: (error) => {
      toast.error(`AI Generation Failed: ${error}`);
    }
  });

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();

  // Handle form submission
  const onSubmit = async (values: AIFormValues) => {
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
        toast.success("AI-Enhanced course created! Setting up chapters...");
      } else {
        toast.success("Course created successfully!");
      }

      router.push(`/teacher/courses/${response.data.id}`);
    } catch {
      toast.error("Something went wrong");
    }
  };

  // Handle AI course generation
  const handleGenerateAIPlan = async () => {
    const values = form.getValues();
    
    if (!values.topic || !values.targetAudience || !values.difficulty) {
      toast.error("Please fill in topic, target audience, and difficulty level for AI generation");
      return;
    }

    if (values.learningGoals.length === 0) {
      toast.error("Please add at least one learning goal for AI generation");
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
      };

      await generateCoursePlan(courseRequest);
    } catch (error) {
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

  // Generate title suggestions from topic
  const generateTitleSuggestions = () => {
    const topic = watchedValues.topic;
    const audience = watchedValues.targetAudience;
    
    if (topic) {
      const suggestions = [
        `Complete ${topic} Course`,
        `Master ${topic}: From Beginner to Expert`,
        `${topic} for ${audience || 'Everyone'}`,
        `Professional ${topic} Development`
      ];
      
      return suggestions;
    }
    return [];
  };

  const titleSuggestions = generateTitleSuggestions();

  return ( 
    <div className="p-6">
      {/* AI Enhancement Toggle */}
      <div className="mb-6">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    AI Course Assistant
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {showAIOptions 
                      ? "Get AI help to generate course structure and content" 
                      : "Enable AI assistance for smarter course creation"
                    }
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAIOptions(!showAIOptions);
                  if (!showAIOptions) {
                    setAIGeneratedData(null);
                  }
                }}
                className={cn(
                  "transition-all duration-200",
                  showAIOptions && "border-blue-300 bg-blue-50 dark:bg-blue-950/20"
                )}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {showAIOptions ? "Disable AI" : "Enable AI"}
                {showAIOptions ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Course Title (Always Visible) */}
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
                      "text-gray-900 dark:text-gray-200",
                      "placeholder:text-gray-500/80 dark:placeholder:text-gray-500/80",
                      "focus:ring-purple-500/20"
                    )}
                  />
                </FormControl>
                
                {/* Title Suggestions */}
                {showAIOptions && titleSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">AI Suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {titleSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("title", suggestion)}
                          className="h-7 text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <FormDescription className="text-gray-600 dark:text-gray-400">
                  {showAIOptions 
                    ? "Enter manually or use AI suggestions. This will be refined based on your AI inputs below."
                    : "Choose a clear and engaging title that describes your course content."
                  }
                </FormDescription>
                <FormMessage className="text-rose-600 dark:text-rose-400" />
              </FormItem>
            )}
          />

          {/* AI Enhancement Section */}
          {showAIOptions && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  AI Course Planning
                </CardTitle>
                <CardDescription>
                  Provide details to generate a comprehensive course structure with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Topic and Target Audience Row */}
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
                            placeholder="e.g. React Development, Data Science"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          What subject will this course teach?
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
                            placeholder="e.g. Web developers, Students"
                            {...field}
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

                {/* Duration and Difficulty Row */}
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
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          How long should this course take?
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
                                Beginner
                              </SelectItem>
                              <SelectItem value={CourseDifficulty.INTERMEDIATE}>
                                Intermediate
                              </SelectItem>
                              <SelectItem value={CourseDifficulty.ADVANCED}>
                                Advanced
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          What level of expertise is required?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Optional Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Context (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any specific requirements or additional context for your course..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Help AI understand your specific needs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Learning Goals */}
                <div className="space-y-4">
                  <FormLabel>Learning Goals</FormLabel>
                  
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

                  {watchedValues.learningGoals && watchedValues.learningGoals.length > 0 && (
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
                    What will students learn? Add at least one goal for AI generation.
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
                        AI Generated Course Plan Ready!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-green-800 dark:text-green-200">
                            {aiGeneratedData.title}
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {aiGeneratedData.description.substring(0, 200)}...
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <span className="font-medium text-green-800 dark:text-green-200 block">
                              {aiGeneratedData.estimatedDuration}h
                            </span>
                            <span className="text-green-600 dark:text-green-400">Duration</span>
                          </div>
                          <div className="text-center">
                            <span className="font-medium text-green-800 dark:text-green-200 block">
                              {aiGeneratedData.chapters.length}
                            </span>
                            <span className="text-green-600 dark:text-green-400">Chapters</span>
                          </div>
                          <div className="text-center">
                            <span className="font-medium text-green-800 dark:text-green-200 block">
                              {aiGeneratedData.courseStructure.totalSections}
                            </span>
                            <span className="text-green-600 dark:text-green-400">Sections</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generate AI Plan Button */}
                <Button
                  type="button"
                  onClick={handleGenerateAIPlan}
                  disabled={isGenerating || !watchedValues.topic || !watchedValues.targetAudience || !watchedValues.learningGoals?.length}
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