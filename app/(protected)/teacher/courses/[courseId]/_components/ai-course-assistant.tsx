"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterfaceModeToggle } from "@/components/ui/interface-mode-toggle";
import { FeatureHint } from "@/components/ui/feature-hint";
import { Sparkles, Loader2, Brain, MessageSquare, Wand2, Settings, Zap, BookOpen, Target, Users, Clock, Star, Lightbulb, ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProgressiveDisclosure } from "@/hooks/use-progressive-disclosure";
import { motion, AnimatePresence } from "framer-motion";

interface AICourseAssistantProps {
  courseTitle: string;
  type: "description" | "objectives";
  onGenerate: (content: string) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
  initialMode?: 'simple' | 'advanced';
}

export const AICourseAssistant = ({
  courseTitle,
  type,
  onGenerate,
  trigger,
  disabled = false,
  initialMode = 'simple'
}: AICourseAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [userPrompt, setUserPrompt] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [isAdvancedMode, setIsAdvancedMode] = useState(initialMode === 'advanced');
  const [targetAudience, setTargetAudience] = useState('general');
  const [courseDuration, setCourseDuration] = useState('8-12 weeks');
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate');
  const [learningStyle, setLearningStyle] = useState('mixed');
  const [industryFocus, setIndustryFocus] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [tone, setTone] = useState('professional');
  const [creativity, setCreativity] = useState([7]);
  const [detailLevel, setDetailLevel] = useState([5]);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [activeTab, setActiveTab] = useState('basics');
  
  const { recordFeatureUsage, isFeatureUnlocked } = useProgressiveDisclosure();
  
  const isAdvancedPromptsUnlocked = isFeatureUnlocked('advanced-ai-prompts');

  const getDefaultPrompt = () => {
    if (type === "description") {
      return `Create a comprehensive course description that explains what students will learn and the value they'll get from this course.`;
    } else {
      return `Generate clear, measurable learning objectives that students will achieve after completing this course.`;
    }
  };
  
  const getAdvancedPrompt = () => {
    const basePrompt = getDefaultPrompt();
    const context = {
      targetAudience,
      courseDuration,
      difficultyLevel,
      learningStyle,
      industryFocus,
      prerequisites,
      tone
    };
    
    return `${basePrompt}

Context and Requirements:
- Target audience: ${targetAudience}
- Course duration: ${courseDuration}
- Difficulty level: ${difficultyLevel}
- Learning style: ${learningStyle}
${industryFocus ? `- Industry focus: ${industryFocus}` : ''}
${prerequisites ? `- Prerequisites: ${prerequisites}` : ''}
- Tone: ${tone}
- Creativity level: ${creativity[0]}/10
- Detail level: ${detailLevel[0]}/10
${includeExamples ? '- Include practical examples and real-world applications' : ''}

Additional instructions: ${userPrompt || 'Follow the context requirements above.'}`;
  };
  
  useEffect(() => {
    if (open) {
      try {
        recordFeatureUsage('ai-course-assistant', 2);
      } catch (error) {
        console.warn('Failed to record feature usage:', error);
      }
    }
  }, [open, recordFeatureUsage]);

  // Cleanup effect to prevent state updates after unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  const handleGenerate = async () => {
    if (!courseTitle) {
      toast.error("Course title is required for AI generation");
      return;
    }

    setIsGenerating(true);
    
    try {
      const finalPrompt = isAdvancedMode && isAdvancedPromptsUnlocked ? getAdvancedPrompt() : (userPrompt || getDefaultPrompt());
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/ai/course-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle,
          type,
          userPrompt: finalPrompt,
          focusArea,
          advancedMode: isAdvancedMode,
          parameters: isAdvancedMode ? {
            targetAudience,
            courseDuration,
            difficultyLevel,
            learningStyle,
            industryFocus,
            prerequisites,
            tone,
            creativity: creativity[0],
            detailLevel: detailLevel[0],
            includeExamples
          } : undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        // Safely call onGenerate
        try {
          onGenerate(data.content);
        } catch (onGenerateError) {
          console.error('Error in onGenerate callback:', onGenerateError);
          toast.error('Failed to apply generated content');
          return;
        }
        
        toast.success(`Course ${type} generated successfully!`);
        
        // Safely record feature usage
        try {
          recordFeatureUsage('ai-course-assistant', 3);
          if (isAdvancedMode && isAdvancedPromptsUnlocked) {
            recordFeatureUsage('advanced-ai-prompts', 1);
          }
        } catch (usageError) {
          console.warn('Failed to record feature usage:', usageError);
        }
        
        // Reset state and close modal
        if (isMounted) {
          setUserPrompt("");
          setFocusArea("");
          setOpen(false);
        }
        
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else if (error.message.includes('Network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Failed to generate ${type}. ${error.message || 'Please try again.'}`);
      }
    } finally {
      // Ensure we always reset the loading state if component is still mounted
      if (isMounted) {
        setIsGenerating(false);
      }
    }
  };
  
  const handleReset = () => {
    setUserPrompt("");
    setFocusArea("");
    setTargetAudience('general');
    setCourseDuration('8-12 weeks');
    setDifficultyLevel('intermediate');
    setLearningStyle('mixed');
    setIndustryFocus('');
    setPrerequisites('');
    setTone('professional');
    setCreativity([7]);
    setDetailLevel([5]);
    setIncludeExamples(true);
    setActiveTab('basics');
  };

  const defaultTrigger = (
    <FeatureHint featureId="ai-course-assistant">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || !courseTitle}
        className={cn(
          "text-purple-700 dark:text-purple-300",
          "border-purple-200 dark:border-purple-700",
          "hover:text-purple-800 dark:hover:text-purple-200",
          "hover:bg-purple-50 dark:hover:bg-purple-500/10",
          "transition-all duration-200"
        )}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate with AI
      </Button>
    </FeatureHint>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">AI Course Assistant</span>
            <Badge variant="outline" className="ml-2">
              {isAdvancedMode ? 'Advanced' : 'Simple'} Mode
            </Badge>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-gray-600 dark:text-gray-300">
              Generate {type === "description" ? "description" : "learning objectives"} for your course using AI.
            </span>
          </DialogDescription>
          <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-700 mt-2">
            <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-800 dark:text-purple-200">
              Course: {courseTitle || "Untitled Course"}
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

          {/* Simple Mode */}
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
                  <span className="font-medium">Quick & Easy Generation</span>
                </div>
                
                {/* User Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="user-prompt" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                    <MessageSquare className="h-4 w-4" />
                    What would you like to focus on? (Optional)
                  </Label>
                  <Textarea
                    id="user-prompt"
                    placeholder={`e.g., "Focus on practical applications" or "Make it beginner-friendly" or "Include real-world examples"`}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    rows={3}
                    className="resize-none border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave empty to use smart defaults, or add specific instructions.
                  </p>
                </div>

                {/* Focus Area */}
                <div className="space-y-2">
                  <Label htmlFor="focus-area" className="text-gray-700 dark:text-gray-300 font-medium">Specific Topic/Focus (Optional)</Label>
                  <Input
                    id="focus-area"
                    placeholder="e.g., JavaScript fundamentals, UI design principles, etc."
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                {/* Preview */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    AI will generate:
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {type === "description" 
                      ? "A comprehensive course description with smart defaults and best practices"
                      : "Clear, measurable learning objectives using proven educational frameworks"}
                  </p>
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
                  <span className="font-medium">Advanced Customization</span>
                  {!isAdvancedPromptsUnlocked && (
                    <FeatureHint featureId="advanced-ai-prompts">
                      <Badge variant="outline" className="text-xs cursor-pointer">
                        <Star className="h-3 w-3 mr-1" />
                        Unlock Advanced Features
                      </Badge>
                    </FeatureHint>
                  )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basics">Basics</TabsTrigger>
                    <TabsTrigger value="audience">Audience</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basics" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Course Duration</Label>
                        <Select value={courseDuration} onValueChange={setCourseDuration}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2-4 weeks">2-4 weeks</SelectItem>
                            <SelectItem value="4-6 weeks">4-6 weeks</SelectItem>
                            <SelectItem value="8-12 weeks">8-12 weeks</SelectItem>
                            <SelectItem value="12+ weeks">12+ weeks</SelectItem>
                            <SelectItem value="self-paced">Self-paced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty Level</Label>
                        <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prerequisites">Prerequisites</Label>
                      <Input
                        id="prerequisites"
                        placeholder="e.g., Basic programming knowledge, HTML/CSS"
                        value={prerequisites}
                        onChange={(e) => setPrerequisites(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="audience" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <Select value={targetAudience} onValueChange={setTargetAudience}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Audience</SelectItem>
                          <SelectItem value="students">Students</SelectItem>
                          <SelectItem value="professionals">Working Professionals</SelectItem>
                          <SelectItem value="developers">Developers</SelectItem>
                          <SelectItem value="designers">Designers</SelectItem>
                          <SelectItem value="managers">Managers</SelectItem>
                          <SelectItem value="educators">Educators</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Learning Style</Label>
                      <Select value={learningStyle} onValueChange={setLearningStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mixed">Mixed (Visual + Hands-on)</SelectItem>
                          <SelectItem value="visual">Visual Learning</SelectItem>
                          <SelectItem value="hands-on">Hands-on/Practical</SelectItem>
                          <SelectItem value="theoretical">Theoretical</SelectItem>
                          <SelectItem value="case-study">Case Study Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry-focus">Industry Focus (Optional)</Label>
                      <Input
                        id="industry-focus"
                        placeholder="e.g., Healthcare, Finance, E-commerce"
                        value={industryFocus}
                        onChange={(e) => setIndustryFocus(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="style" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Writing Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual & Friendly</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="inspiring">Inspiring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {isAdvancedPromptsUnlocked && (
                      <>
                        <div className="space-y-3">
                          <Label>Creativity Level: {creativity[0]}/10</Label>
                          <Slider
                            value={creativity}
                            onValueChange={setCreativity}
                            max={10}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Higher values = more creative and unique content
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <Label>Detail Level: {detailLevel[0]}/10</Label>
                          <Slider
                            value={detailLevel}
                            onValueChange={setDetailLevel}
                            max={10}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Higher values = more detailed and comprehensive content
                          </p>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="custom-instructions">Custom Instructions</Label>
                  <Textarea
                    id="custom-instructions"
                    placeholder="Any specific requirements, examples to include, or style preferences..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Advanced Preview */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Advanced AI Configuration:
                  </h4>
                  <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                    <p>• Target: {targetAudience} ({difficultyLevel} level)</p>
                    <p>• Duration: {courseDuration} | Style: {learningStyle}</p>
                    <p>• Tone: {tone}</p>
                    {isAdvancedPromptsUnlocked && (
                      <p>• Creativity: {creativity[0]}/10 | Detail: {detailLevel[0]}/10</p>
                    )}
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
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isGenerating}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !courseTitle}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 shadow-md hover:shadow-lg transition-all"
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
                    Generate {type === "description" ? "Description" : "Objectives"}
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