"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, Brain, MessageSquare, Target, Users, Lightbulb, BookOpen, Settings, Info, CheckCircle2, AlertTriangle, Upload, FileText, X, ShieldCheck, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BloomsLevel } from "@prisma/client";
import { logger } from '@/lib/logger';

// Import our enhanced framework
import { ENHANCED_BLOOMS_FRAMEWORK } from "@/lib/ai-question-generator";

// Import SAM Quality Indicator
import { SAMQualityIndicator } from "./exam-creator/SAMQualityIndicator";

// Transform SAM question format to QuestionItem format
interface SAMQuestion {
  id: string;
  questionType?: string;
  type?: string;
  bloomsLevel?: string;
  difficulty?: string;
  question?: string;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  cognitiveLoad?: number;
  timeEstimate?: number;
  bloomsAlignment?: number;
  safetyScore?: number;
  qualityScore?: number;
  hints?: string[];
}

function transformSAMQuestionToQuestionItem(samQuestion: SAMQuestion) {
  // Map questionType from SAM format (MULTIPLE_CHOICE) to UI format (multiple-choice)
  const typeMapping: Record<string, string> = {
    'MULTIPLE_CHOICE': 'multiple-choice',
    'TRUE_FALSE': 'true-false',
    'SHORT_ANSWER': 'short-answer',
    'ESSAY': 'short-answer',
    'FILL_IN_BLANK': 'short-answer',
    'MATCHING': 'multiple-choice',
    'ORDERING': 'multiple-choice',
  };

  const rawType = samQuestion.questionType || samQuestion.type || 'MULTIPLE_CHOICE';
  const mappedType = typeMapping[rawType.toUpperCase()] || typeMapping[rawType.toUpperCase().replace(/-/g, '_')] || 'multiple-choice';

  // Map bloomsLevel to lowercase
  const rawBloomsLevel = samQuestion.bloomsLevel || 'understand';
  const mappedBloomsLevel = rawBloomsLevel.toLowerCase();

  // Map difficulty - ensure lowercase
  const rawDifficulty = samQuestion.difficulty || 'medium';
  const mappedDifficulty = rawDifficulty.toLowerCase();

  return {
    id: samQuestion.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: mappedType as 'multiple-choice' | 'true-false' | 'short-answer',
    difficulty: mappedDifficulty as 'easy' | 'medium' | 'hard',
    bloomsLevel: mappedBloomsLevel,
    question: samQuestion.question || samQuestion.questionText || '',
    options: samQuestion.options || [],
    correctAnswer: samQuestion.correctAnswer || '',
    explanation: samQuestion.explanation || '',
    points: samQuestion.points || 1,
    // SAM-specific fields
    cognitiveLoad: samQuestion.cognitiveLoad,
    timeEstimate: samQuestion.timeEstimate,
    bloomsAlignment: samQuestion.bloomsAlignment,
    safetyScore: samQuestion.safetyScore,
    qualityScore: samQuestion.qualityScore,
  };
}

interface EnhancedAIExamAssistantProps {
  sectionTitle: string;
  chapterTitle?: string;
  courseTitle?: string;
  learningObjectives?: string[];
  onGenerate: (questions: any[]) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

const DEFAULT_DISTRIBUTIONS = {
  formative: {
    beginner: { REMEMBER: 40, UNDERSTAND: 40, APPLY: 20, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
    intermediate: { REMEMBER: 20, UNDERSTAND: 30, APPLY: 30, ANALYZE: 20, EVALUATE: 0, CREATE: 0 },
    advanced: { REMEMBER: 10, UNDERSTAND: 20, APPLY: 30, ANALYZE: 30, EVALUATE: 10, CREATE: 0 }
  },
  summative: {
    beginner: { REMEMBER: 30, UNDERSTAND: 30, APPLY: 30, ANALYZE: 10, EVALUATE: 0, CREATE: 0 },
    intermediate: { REMEMBER: 15, UNDERSTAND: 25, APPLY: 30, ANALYZE: 20, EVALUATE: 10, CREATE: 0 },
    advanced: { REMEMBER: 10, UNDERSTAND: 20, APPLY: 25, ANALYZE: 25, EVALUATE: 15, CREATE: 5 }
  },
  diagnostic: {
    beginner: { REMEMBER: 50, UNDERSTAND: 30, APPLY: 20, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
    intermediate: { REMEMBER: 30, UNDERSTAND: 30, APPLY: 20, ANALYZE: 20, EVALUATE: 0, CREATE: 0 },
    advanced: { REMEMBER: 20, UNDERSTAND: 20, APPLY: 20, ANALYZE: 20, EVALUATE: 10, CREATE: 10 }
  }
};

export const EnhancedAIExamAssistant = ({
  sectionTitle,
  chapterTitle,
  courseTitle,
  learningObjectives = [],
  onGenerate,
  trigger,
  disabled = false
}: EnhancedAIExamAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Basic settings
  const [questionCount, setQuestionCount] = useState("10");
  const [targetAudience, setTargetAudience] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [assessmentPurpose, setAssessmentPurpose] = useState<"formative" | "summative" | "diagnostic">("summative");
  const [cognitiveLoadLimit, setCognitiveLoadLimit] = useState("5");
  
  // Advanced settings
  const [customLearningObjectives, setCustomLearningObjectives] = useState<string[]>(learningObjectives);
  const [prerequisiteKnowledge, setPrerequisiteKnowledge] = useState<string[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [enableQualityValidation, setEnableQualityValidation] = useState(true);
  const [enableSafetyValidation, setEnableSafetyValidation] = useState(true);
  const [enablePedagogicalValidation, setEnablePedagogicalValidation] = useState(true);
  const [autoOptimizeDistribution, setAutoOptimizeDistribution] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>("");

  // SAM validation results
  const [samValidation, setSamValidation] = useState<Record<string, unknown> | null>(null);
  
  // Bloom's taxonomy distribution
  const [bloomsDistribution, setBloomsDistribution] = useState<BloomsDistribution>(
    DEFAULT_DISTRIBUTIONS.summative.intermediate
  );
  const [useCustomDistribution, setUseCustomDistribution] = useState(false);
  
  // New learning objective input
  const [newObjective, setNewObjective] = useState("");
  const [newPrerequisite, setNewPrerequisite] = useState("");

  // Update distribution when audience or purpose changes
  useEffect(() => {
    if (!useCustomDistribution) {
      const newDistribution = DEFAULT_DISTRIBUTIONS[assessmentPurpose][targetAudience];
      const totalQuestions = parseInt(questionCount);
      
      // Convert percentages to actual question counts
      const distributionCounts: BloomsDistribution = {} as BloomsDistribution;
      Object.entries(newDistribution).forEach(([level, percentage]) => {
        distributionCounts[level as keyof BloomsDistribution] = Math.round(totalQuestions * percentage / 100);
      });
      
      setBloomsDistribution(distributionCounts);
    }
  }, [assessmentPurpose, targetAudience, questionCount, useCustomDistribution]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Read file content
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(prev => prev + "\n\n" + `File: ${file.name}\n${content}`);
      };
      reader.readAsText(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    // Re-read remaining files
    setFileContent("");
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(prev => prev + "\n\n" + `File: ${file.name}\n${content}`);
      };
      reader.readAsText(file);
    });
  };

  const handleGenerate = async () => {
    if (!sectionTitle) {
      toast.error("Section title is required for AI generation");
      return;
    }

    setIsGenerating(true);
    try {
      const requestBody = {
        sectionTitle,
        chapterTitle,
        courseTitle,
        learningObjectives: customLearningObjectives,
        bloomsDistribution: useCustomDistribution ? bloomsDistribution : undefined,
        questionCount: parseInt(questionCount),
        targetAudience,
        cognitiveLoadLimit: parseInt(cognitiveLoadLimit),
        prerequisiteKnowledge,
        assessmentPurpose,
        userPrompt: userPrompt.trim() || undefined,
        enableQualityValidation,
        enableSafetyValidation,
        enablePedagogicalValidation,
        autoOptimizeDistribution: !useCustomDistribution,
        fileContent: fileContent || undefined,
        useSAMIntegration: true
      };

      const response = await fetch('/api/ai/advanced-exam-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to generate exam questions');
      }

      const data = await response.json();

      // Accept questions even if validation didn't fully pass
      // Questions are generated successfully - validation is informational
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        // Transform SAM questions to QuestionItem format
        const transformedQuestions = data.questions.map(transformSAMQuestionToQuestionItem);
        onGenerate(transformedQuestions);

        // Capture SAM validation results
        if (data.validation) {
          setSamValidation(data.validation);
        }

        // Show success with SAM quality info
        const samScore = data.metadata?.overallScore;
        const samGrade = data.metadata?.overallGrade;

        // If validation didn't fully pass but we have questions, show a warning with the success
        if (!data.success && data.validation) {
          toast.success(
            `Generated ${data.questions.length} exam questions with validation notes`,
            {
              description: samScore
                ? `SAM Quality: ${samGrade} (${samScore}/100) - Review validation tab for improvement suggestions`
                : `Questions generated. Check validation tab for quality recommendations.`
            }
          );
        } else {
          toast.success(
            `Generated ${data.questions.length} sophisticated exam questions!`,
            {
              description: samScore
                ? `SAM Quality: ${samGrade} (${samScore}/100) - ${data.metadata?.model || 'AI'}`
                : data.warning
                  ? data.warning
                  : `Using ${data.metadata?.model || 'AI'} with Bloom&apos;s taxonomy analysis`
            }
          );
        }
        setOpen(false);
      } else {
        throw new Error('No questions were generated. Please try again.');
      }
    } catch (error: any) {
      logger.error('Enhanced AI exam generation error:', error);
      toast.error(`Failed to generate exam questions. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const addLearningObjective = () => {
    if (newObjective.trim()) {
      setCustomLearningObjectives([...customLearningObjectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const removeLearningObjective = (index: number) => {
    setCustomLearningObjectives(customLearningObjectives.filter((_, i) => i !== index));
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setPrerequisiteKnowledge([...prerequisiteKnowledge, newPrerequisite.trim()]);
      setNewPrerequisite("");
    }
  };

  const removePrerequisite = (index: number) => {
    setPrerequisiteKnowledge(prerequisiteKnowledge.filter((_, i) => i !== index));
  };

  const updateBloomsDistribution = (level: keyof BloomsDistribution, value: number) => {
    setBloomsDistribution(prev => ({
      ...prev,
      [level]: Math.max(0, value)
    }));
  };

  const getTotalQuestions = () => {
    return Object.values(bloomsDistribution).reduce((sum, count) => sum + count, 0);
  };

  const getBloomsLevelColor = (level: BloomsLevel) => {
    const colors = {
      REMEMBER: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      UNDERSTAND: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      APPLY: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
      ANALYZE: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
      EVALUATE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      CREATE: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
    };
    return colors[level];
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || !sectionTitle}
      className={cn(
        "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20",
        "text-indigo-700 dark:text-indigo-300",
        "border-indigo-200 dark:border-indigo-700",
        "hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40",
        "hover:text-indigo-800 dark:hover:text-indigo-200",
        "hover:border-indigo-300 dark:hover:border-indigo-600",
        "transition-all duration-200 shadow-sm",
        (disabled || !sectionTitle) && "opacity-50 cursor-not-allowed"
      )}
    >
      <Brain className="h-4 w-4 mr-2" />
      AI Question Generator Pro
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn(
        "max-w-4xl max-h-[90vh] overflow-y-auto",
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">Enhanced AI Exam Assistant</span>
            <Badge variant="secondary" className="text-xs">Bloom&apos;s Taxonomy</Badge>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-gray-600 dark:text-gray-300">
              Generate pedagogically sophisticated exam questions with advanced Bloom&apos;s taxonomy analysis
            </span>
          </DialogDescription>
          <div className="flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700 mt-2">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-indigo-800 dark:text-indigo-200">
              Section: {sectionTitle || "Untitled Section"}
            </span>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="blooms">Bloom&apos;s Taxonomy</TabsTrigger>
            <TabsTrigger value="objectives">Learning Goals</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Question Count */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Number of Questions
                </Label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                    <SelectItem value="25">25 questions</SelectItem>
                    <SelectItem value="30">30 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Audience
                </Label>
                <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - New to subject</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                    <SelectItem value="advanced">Advanced - Experienced learners</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assessment Purpose */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 font-medium">Assessment Purpose</Label>
                <Select value={assessmentPurpose} onValueChange={(value: any) => setAssessmentPurpose(value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formative">Formative - Practice & Feedback</SelectItem>
                    <SelectItem value="summative">Summative - Final Assessment</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic - Identify Gaps</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cognitive Load Limit */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 font-medium">Max Cognitive Load</Label>
                <Select value={cognitiveLoadLimit} onValueChange={setCognitiveLoadLimit}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Light</SelectItem>
                    <SelectItem value="2">2 - Light</SelectItem>
                    <SelectItem value="3">3 - Moderate</SelectItem>
                    <SelectItem value="4">4 - Heavy</SelectItem>
                    <SelectItem value="5">5 - Very Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium">
                <Upload className="h-4 w-4" />
                Upload Reference Files (Optional)
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-indigo-500 dark:text-indigo-400" />
                      <p className="mb-2 text-sm text-indigo-600 dark:text-indigo-300 font-medium">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400">TXT, PDF, DOC files (MAX. 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                
                {/* Uploaded Files Display */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Uploaded Files:</p>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded border border-indigo-200 dark:border-indigo-700">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-sm text-indigo-800 dark:text-indigo-200">{file.name}</span>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="blooms" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Bloom&apos;s Taxonomy Distribution
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomDistribution"
                    checked={useCustomDistribution}
                    onChange={(e) => setUseCustomDistribution(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="useCustomDistribution" className="text-sm">Custom Distribution</Label>
                </div>
              </div>

              {!useCustomDistribution && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Using optimized distribution for {targetAudience} {assessmentPurpose} assessment</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(ENHANCED_BLOOMS_FRAMEWORK) as BloomsLevel[]).map((level) => {
                  const framework = ENHANCED_BLOOMS_FRAMEWORK[level];
                  return (
                    <Card key={level} className={cn(
                      "bg-gradient-to-br from-white via-gray-50 to-white",
                      "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
                      "border border-gray-200/60 dark:border-gray-700/60",
                      "shadow-sm hover:shadow-md transition-shadow duration-200"
                    )}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge className={cn("text-xs", getBloomsLevelColor(level))}>
                            {level}
                          </Badge>
                          <span className="text-xs text-gray-500">Load: {framework.cognitiveLoad}/5</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {framework.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={bloomsDistribution[level]}
                              onChange={(e) => updateBloomsDistribution(level, parseInt(e.target.value) || 0)}
                              disabled={!useCustomDistribution}
                              className="w-16 text-center"
                            />
                            <span className="text-xs text-gray-500">questions</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {framework.verbs.slice(0, 3).map((verb) => (
                              <Badge key={verb} variant="outline" className="text-xs">
                                {verb}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Total Questions:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {getTotalQuestions()} / {questionCount}
                  </span>
                </div>
                {getTotalQuestions() !== parseInt(questionCount) && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Distribution doesn&apos;t match total question count</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="objectives" className="space-y-4 mt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Learning Objectives
              </Label>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add a learning objective..."
                    onKeyPress={(e) => e.key === 'Enter' && addLearningObjective()}
                  />
                  <Button onClick={addLearningObjective} size="sm">Add</Button>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {customLearningObjectives.map((objective, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <span className="text-sm">{objective}</span>
                      <Button
                        onClick={() => removeLearningObjective(index)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Prerequisite Knowledge
              </Label>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    placeholder="Add prerequisite knowledge..."
                    onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
                  />
                  <Button onClick={addPrerequisite} size="sm">Add</Button>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {prerequisiteKnowledge.map((prereq, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <span className="text-sm">{prereq}</span>
                      <Button
                        onClick={() => removePrerequisite(index)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-6">
            <div className="space-y-4">
              {/* Special Instructions */}
              <div className="space-y-2">
                <Label htmlFor="user-prompt" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Special Instructions
                </Label>
                <Textarea
                  id="user-prompt"
                  placeholder="e.g., Focus on real-world applications, include case studies, emphasize critical thinking..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* SAM Quality Settings */}
              <div className="space-y-3">
                <Label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  SAM AI Validation Settings
                </Label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableQualityValidation"
                        checked={enableQualityValidation}
                        onChange={(e) => setEnableQualityValidation(e.target.checked)}
                        className="rounded accent-blue-600"
                      />
                      <Label htmlFor="enableQualityValidation" className="text-sm text-blue-800 dark:text-blue-200">
                        <Gauge className="inline h-3 w-3 mr-1" />
                        Quality Gates
                      </Label>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1 ml-5">
                      Completeness, structure, depth analysis
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableSafetyValidation"
                        checked={enableSafetyValidation}
                        onChange={(e) => setEnableSafetyValidation(e.target.checked)}
                        className="rounded accent-emerald-600"
                      />
                      <Label htmlFor="enableSafetyValidation" className="text-sm text-emerald-800 dark:text-emerald-200">
                        <ShieldCheck className="inline h-3 w-3 mr-1" />
                        Safety Validation
                      </Label>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1 ml-5">
                      Bias, accessibility, language checks
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enablePedagogicalValidation"
                        checked={enablePedagogicalValidation}
                        onChange={(e) => setEnablePedagogicalValidation(e.target.checked)}
                        className="rounded accent-purple-600"
                      />
                      <Label htmlFor="enablePedagogicalValidation" className="text-sm text-purple-800 dark:text-purple-200">
                        <Brain className="inline h-3 w-3 mr-1" />
                        Pedagogical Analysis
                      </Label>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-1 ml-5">
                      Bloom&apos;s alignment, scaffolding
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoOptimizeDistribution"
                        checked={autoOptimizeDistribution}
                        onChange={(e) => setAutoOptimizeDistribution(e.target.checked)}
                        className="rounded accent-amber-600"
                      />
                      <Label htmlFor="autoOptimizeDistribution" className="text-sm text-amber-800 dark:text-amber-200">
                        <Target className="inline h-3 w-3 mr-1" />
                        Auto-Optimize
                      </Label>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-1 ml-5">
                      Bloom&apos;s distribution optimization
                    </p>
                  </div>
                </div>
              </div>

              {/* Generation Preview */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
                <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  AI will generate:
                </h4>
                <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                  <li>• {questionCount} questions with sophisticated Bloom&apos;s taxonomy mapping</li>
                  <li>• {targetAudience.charAt(0).toUpperCase() + targetAudience.slice(1)} level cognitive complexity</li>
                  <li>• {assessmentPurpose.charAt(0).toUpperCase() + assessmentPurpose.slice(1)} assessment design</li>
                  <li>• Detailed explanations and pedagogical rationale</li>
                  <li>• Quality validation and cognitive load analysis</li>
                  {customLearningObjectives.length > 0 && <li>• Alignment with {customLearningObjectives.length} learning objectives</li>}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-end gap-3 pt-6">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !sectionTitle}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-6 py-2"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Questions...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Generate {questionCount} Advanced Questions</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};