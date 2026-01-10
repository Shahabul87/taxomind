"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Brain, MessageSquare, GraduationCap, Upload, FileText, X, Settings, Zap, Star, Crown, CheckCircle, Info, ShieldCheck, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InterfaceModeToggle } from "@/components/ui/interface-mode-toggle";
import { FeatureHint } from "@/components/ui/feature-hint";
import { useProgressiveDisclosure } from "@/hooks/use-progressive-disclosure";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';

interface AIExamAssistantProps {
  sectionTitle: string;
  chapterTitle?: string;
  courseTitle?: string;
  onGenerate: (questions: any[]) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
  initialMode?: 'simple' | 'advanced';
}

export const AIExamAssistant = ({
  sectionTitle,
  chapterTitle,
  courseTitle,
  onGenerate,
  trigger,
  disabled = false,
  initialMode = 'simple'
}: AIExamAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionCount, setQuestionCount] = useState("5");
  const [difficulty, setDifficulty] = useState("mixed");
  const [questionTypes, setQuestionTypes] = useState("mixed");
  const [userPrompt, setUserPrompt] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>("");
  const [isAdvancedMode, setIsAdvancedMode] = useState(initialMode === 'advanced');
  const [activeTab, setActiveTab] = useState('basics');
  
  // Advanced settings
  const [bloomsLevels, setBloomsLevels] = useState({
    remember: true,
    understand: true,
    apply: true,
    analyze: false,
    evaluate: false,
    create: false
  });
  const [targetAudience, setTargetAudience] = useState('general');
  const [complexity, setComplexity] = useState([5]);
  const [creativity, setCreativity] = useState([7]);
  const [questionDistribution, setQuestionDistribution] = useState('auto');
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [includeDistractors, setIncludeDistractors] = useState(true);
  const [customPromptTemplate, setCustomPromptTemplate] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');

  // SAM integration settings
  const [useSAMValidation, setUseSAMValidation] = useState(true);
  const [samValidationResult, setSamValidationResult] = useState<{
    score?: number;
    quality?: number;
    safety?: number;
    pedagogical?: number;
  } | null>(null);
  
  const { recordFeatureUsage, isFeatureUnlocked } = useProgressiveDisclosure();
  
  const isBloomsTaxonomyUnlocked = isFeatureUnlocked('blooms-taxonomy-guide');
  const isQuestionValidationUnlocked = isFeatureUnlocked('question-validation');
  const isAdvancedPromptsUnlocked = isFeatureUnlocked('advanced-ai-prompts');
  
  useEffect(() => {
    if (open) {
      recordFeatureUsage('ai-exam-assistant', 2);
    }
  }, [open, recordFeatureUsage]);

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
    setSamValidationResult(null);

    try {
      // Determine which API to use based on SAM validation toggle
      const apiEndpoint = useSAMValidation
        ? '/api/ai/advanced-exam-generator'
        : '/api/ai/exam-generator';

      const basePayload = {
        sectionTitle,
        chapterTitle,
        courseTitle,
        questionCount: parseInt(questionCount),
        difficulty,
        questionTypes,
        userPrompt,
        focusArea,
        fileContent: fileContent || undefined,
        advancedMode: isAdvancedMode,
        ...(isAdvancedMode && {
          bloomsLevels: isBloomsTaxonomyUnlocked ? bloomsLevels : undefined,
          targetAudience,
          complexity: complexity[0],
          creativity: creativity[0],
          questionDistribution,
          includeExplanations,
          includeDistractors,
          customPromptTemplate: isAdvancedPromptsUnlocked ? customPromptTemplate : undefined,
          learningObjectives
        })
      };

      // Add SAM-specific options if using SAM validation
      const payload = useSAMValidation
        ? {
            ...basePayload,
            useSAMIntegration: true,
            enableQualityValidation: true,
            enableSafetyValidation: true,
            enablePedagogicalValidation: true,
            autoOptimizeDistribution: true,
            targetAudience: targetAudience === 'general' ? 'intermediate' : targetAudience,
            assessmentPurpose: 'summative',
            cognitiveLoadLimit: Math.ceil(complexity[0] / 2),
            learningObjectives: learningObjectives
              ? learningObjectives.split('\n').filter(Boolean)
              : [],
          }
        : basePayload;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate exam questions');
      }

      const data = await response.json();

      if (data.success && data.questions) {
        onGenerate(data.questions);

        // Extract and store SAM validation results if available
        if (useSAMValidation && data.validation) {
          setSamValidationResult({
            score: data.validation.overall?.score,
            quality: data.validation.quality?.score,
            safety: data.validation.safety?.score,
            pedagogical: data.validation.pedagogical?.score,
          });
        }

        toast.success(
          `Generated ${data.questions.length} exam questions!${
            useSAMValidation && data.validation?.overall?.score
              ? ` (SAM Score: ${data.validation.overall.score}%)`
              : ''
          }`
        );
        recordFeatureUsage('ai-exam-assistant', 3);

        // Record advanced feature usage
        if (isAdvancedMode && isBloomsTaxonomyUnlocked) {
          recordFeatureUsage('blooms-taxonomy-guide', 1);
        }
        if (isAdvancedMode && isQuestionValidationUnlocked) {
          recordFeatureUsage('question-validation', 1);
        }
        if (isAdvancedMode && isAdvancedPromptsUnlocked && customPromptTemplate) {
          recordFeatureUsage('advanced-ai-prompts', 1);
        }

        setOpen(false);
        setUserPrompt("");
        setFocusArea("");
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: unknown) {
      logger.error('AI exam generation error:', error);
      toast.error(`Failed to generate exam questions. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleReset = () => {
    setQuestionCount("5");
    setDifficulty("mixed");
    setQuestionTypes("mixed");
    setUserPrompt("");
    setFocusArea("");
    setBloomsLevels({
      remember: true,
      understand: true,
      apply: true,
      analyze: false,
      evaluate: false,
      create: false
    });
    setTargetAudience('general');
    setComplexity([5]);
    setCreativity([7]);
    setQuestionDistribution('auto');
    setIncludeExplanations(true);
    setIncludeDistractors(true);
    setCustomPromptTemplate('');
    setLearningObjectives('');
    setActiveTab('basics');
  };

  const defaultTrigger = (
    <FeatureHint 
      featureId="ai-exam-assistant"
      title="AI Exam Assistant"
      description="AI-powered exam and quiz generation assistant"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || !sectionTitle}
        className={cn(
          "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
          "text-purple-700 dark:text-purple-300",
          "border-purple-200 dark:border-purple-700",
          "hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40",
          "hover:text-purple-800 dark:hover:text-purple-200",
          "hover:border-purple-300 dark:hover:border-purple-600",
          "transition-all duration-200 shadow-sm",
          (disabled || !sectionTitle) && "opacity-50 cursor-not-allowed"
        )}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate Questions with AI
      </Button>
    </FeatureHint>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn(
        "max-w-5xl max-h-[90vh] overflow-y-auto",
        "bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50",
        "dark:from-blue-950/50 dark:via-cyan-950/50 dark:to-blue-950/50",
        "border border-blue-200/60 dark:border-blue-700/60"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold bg-gradient-to-r from-blue-700 via-cyan-700 to-blue-700 dark:from-blue-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
              AI Exam Assistant
            </span>
            <Badge variant="outline" className="ml-2">
              {isAdvancedMode ? 'Advanced' : 'Simple'} Mode
            </Badge>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-blue-700 dark:text-blue-300">
              {isAdvancedMode 
                ? "Comprehensive AI question generation with advanced customization and Bloom's taxonomy integration."
                : "Quick and easy AI question generation for your exam."}
            </span>
          </DialogDescription>
          <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700 mt-2">
            <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-800 dark:text-blue-200">
              Section: {sectionTitle || "Untitled Section"}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Toggle */}
          <InterfaceModeToggle
            isAdvancedMode={isAdvancedMode}
            onModeChange={setIsAdvancedMode}
            className="mb-4"
          />

          <AnimatePresence mode="wait">
            {!isAdvancedMode ? (
              <motion.div
                key="simple"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Quick Generation</span>
                </div>
                
                {/* Basic Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-blue-800 dark:text-blue-200 font-semibold">Number of Questions</Label>
                    <Select value={questionCount} onValueChange={setQuestionCount}>
                      <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                        <SelectValue placeholder="Select count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 questions</SelectItem>
                        <SelectItem value="10">10 questions</SelectItem>
                        <SelectItem value="15">15 questions</SelectItem>
                        <SelectItem value="20">20 questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-blue-800 dark:text-blue-200 font-semibold">Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Special Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="user-prompt" className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-semibold">
                    <MessageSquare className="h-4 w-4" />
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    id="user-prompt"
                    placeholder={`e.g., "Focus on practical applications" or "Include code examples"`}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    rows={3}
                    className="resize-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </div>
                
                {/* SAM Validation Toggle */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-4 rounded-lg border border-violet-200 dark:border-violet-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      <div>
                        <Label htmlFor="sam-validation" className="text-sm font-medium text-violet-800 dark:text-violet-200">
                          SAM AI Validation
                        </Label>
                        <p className="text-xs text-violet-600 dark:text-violet-400">
                          Quality gates, safety checks, and pedagogical analysis
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="sam-validation"
                      checked={useSAMValidation}
                      onCheckedChange={setUseSAMValidation}
                    />
                  </div>

                  {/* SAM Score Display (if available from previous generation) */}
                  {samValidationResult && (
                    <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-700">
                      <div className="text-xs font-medium text-violet-800 dark:text-violet-200 mb-2">
                        Last Generation Score
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5 text-violet-600" />
                          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                            {samValidationResult.score}%
                          </span>
                        </div>
                        <Progress
                          value={samValidationResult.score}
                          className="flex-1 h-2 bg-violet-200 dark:bg-violet-800"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    AI will generate:
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• {questionCount} smart questions with automatic difficulty balancing</li>
                    <li>• Mixed question types (multiple choice, true/false, short answer)</li>
                    <li>• Automatic answer keys and detailed explanations</li>
                    <li>• Questions mapped to learning objectives</li>
                    {useSAMValidation && (
                      <li className="text-violet-600 dark:text-violet-400">
                        • SAM validation: Quality gates, safety checks, Bloom&apos;s alignment
                      </li>
                    )}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Advanced Question Generation</span>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basics">Basics</TabsTrigger>
                    <TabsTrigger value="taxonomy" className="relative">
                      Bloom&apos;s
                      {!isBloomsTaxonomyUnlocked && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          <Star className="w-2 h-2" />
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basics" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Number of Questions</Label>
                        <Select value={questionCount} onValueChange={setQuestionCount}>
                          <SelectTrigger>
                            <SelectValue />
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
                      
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Select value={targetAudience} onValueChange={setTargetAudience}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Students</SelectItem>
                            <SelectItem value="beginners">Beginners</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="professionals">Professionals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Question Types</Label>
                        <Select value={questionTypes} onValueChange={setQuestionTypes}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                            <SelectItem value="true-false">True/False</SelectItem>
                            <SelectItem value="short-answer">Short Answer</SelectItem>
                            <SelectItem value="mixed">Mixed Types</SelectItem>
                            <SelectItem value="blooms-based">Bloom&apos;s Taxonomy Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Distribution Strategy</Label>
                        <Select value={questionDistribution} onValueChange={setQuestionDistribution}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-Balance</SelectItem>
                            <SelectItem value="easy-heavy">More Easy Questions</SelectItem>
                            <SelectItem value="balanced">Even Distribution</SelectItem>
                            <SelectItem value="hard-heavy">More Challenging</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="taxonomy" className="space-y-4">
                    {!isBloomsTaxonomyUnlocked ? (
                      <FeatureHint 
                        featureId="blooms-taxonomy-guide"
                        title="Bloom's Taxonomy Guide"
                        description="Advanced cognitive learning taxonomy guide and tools"
                      >
                        <Card className="border-dashed border-2 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                          <CardContent className="flex items-center justify-center p-6">
                            <div className="text-center space-y-2">
                              <Star className="w-8 h-8 text-yellow-600 mx-auto" />
                              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Unlock Bloom&apos;s Taxonomy Integration</h3>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">Use the AI Exam Assistant more to unlock advanced Bloom&apos;s taxonomy features</p>
                            </div>
                          </CardContent>
                        </Card>
                      </FeatureHint>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Cognitive Levels to Include</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(bloomsLevels).map(([level, enabled]) => (
                              <div key={level} className="flex items-center space-x-2">
                                <Switch
                                  id={level}
                                  checked={enabled}
                                  onCheckedChange={(checked) => 
                                    setBloomsLevels(prev => ({ ...prev, [level]: checked }))
                                  }
                                />
                                <Label htmlFor={level} className="capitalize text-sm">
                                  {level}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="learning-objectives">Learning Objectives</Label>
                          <Textarea
                            id="learning-objectives"
                            placeholder="Enter specific learning objectives to map questions to..."
                            value={learningObjectives}
                            onChange={(e) => setLearningObjectives(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label>Question Complexity: {complexity[0]}/10</Label>
                        <Slider
                          value={complexity}
                          onValueChange={setComplexity}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Higher values create more complex, multi-step questions
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>AI Creativity: {creativity[0]}/10</Label>
                        <Slider
                          value={creativity}
                          onValueChange={setCreativity}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Higher values generate more creative and unique questions
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="explanations"
                            checked={includeExplanations}
                            onCheckedChange={setIncludeExplanations}
                          />
                          <Label htmlFor="explanations" className="text-sm">
                            Include detailed explanations
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="distractors"
                            checked={includeDistractors}
                            onCheckedChange={setIncludeDistractors}
                          />
                          <Label htmlFor="distractors" className="text-sm">
                            Include distractor analysis
                          </Label>
                        </div>
                      </div>
                      
                      {isAdvancedPromptsUnlocked && (
                        <div className="space-y-2">
                          <Label htmlFor="custom-template">Custom Prompt Template</Label>
                          <Textarea
                            id="custom-template"
                            placeholder="Enter custom prompt template for question generation..."
                            value={customPromptTemplate}
                            onChange={(e) => setCustomPromptTemplate(e.target.value)}
                            rows={3}
                          />
                        </div>
                      )}
                      
                      {!isAdvancedPromptsUnlocked && (
                        <FeatureHint 
                          featureId="advanced-ai-prompts"
                          title="Advanced AI Prompts"
                          description="Advanced AI prompting features and customization"
                        >
                          <Card className="border-dashed border-2 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                            <CardContent className="flex items-center justify-center p-4">
                              <div className="text-center space-y-1">
                                <Crown className="w-6 h-6 text-purple-600 mx-auto" />
                                <h4 className="font-medium text-purple-800 dark:text-purple-200 text-sm">Unlock Custom Prompts</h4>
                                <p className="text-xs text-purple-700 dark:text-purple-300">Advanced prompt customization coming soon</p>
                              </div>
                            </CardContent>
                          </Card>
                        </FeatureHint>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-semibold">
                        <Upload className="h-4 w-4" />
                        Upload Reference Files
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-blue-500 dark:text-blue-400" />
                              <p className="mb-2 text-sm text-blue-600 dark:text-blue-300 font-medium">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-blue-500 dark:text-blue-400">TXT, PDF, DOC files (MAX. 10MB)</p>
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
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Uploaded Files:</p>
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm text-blue-800 dark:text-blue-200">{file.name}</span>
                                  <span className="text-xs text-blue-600 dark:text-blue-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Focus Area */}
                    <div className="space-y-2">
                      <Label htmlFor="focus-area">Specific Topics to Cover</Label>
                      <Input
                        id="focus-area"
                        placeholder="e.g., variables, functions, loops, etc."
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                      />
                    </div>
                    
                    {/* Special Instructions */}
                    <div className="space-y-2">
                      <Label htmlFor="user-prompt-advanced">Special Instructions</Label>
                      <Textarea
                        id="user-prompt-advanced"
                        placeholder="Any specific requirements, context, or style preferences..."
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Advanced Preview */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Advanced AI Configuration:
                  </h4>
                  <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                    <p>• {questionCount} questions for {targetAudience} audience</p>
                    <p>• Complexity: {complexity[0]}/10 | Creativity: {creativity[0]}/10</p>
                    {isBloomsTaxonomyUnlocked && (
                      <p>• Bloom&apos;s levels: {Object.entries(bloomsLevels).filter(([_, enabled]) => enabled).map(([level]) => level).join(', ')}</p>
                    )}
                    <p>• {includeExplanations ? 'With' : 'Without'} explanations | {includeDistractors ? 'With' : 'Without'} distractor analysis</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={handleReset}
              disabled={isGenerating}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Reset
            </Button>
            {isAdvancedMode && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Info className="w-3 h-3" />
                <span>Advanced features unlock with usage</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isGenerating}
              className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !sectionTitle}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 shadow-md hover:shadow-lg transition-all"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Generating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">
                    Generate {questionCount} Questions
                    {isAdvancedMode && " (Advanced)"}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};