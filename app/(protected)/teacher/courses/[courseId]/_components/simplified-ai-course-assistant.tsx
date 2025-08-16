"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import {
  Bot,
  Sparkles,
  BookOpen,
  FileText,
  Lightbulb,
  Wand2,
  Settings,
  ChevronRight,
  MessageCircle,
  Star,
  Zap,
  Brain,
  Target,
  Clock,
  Users,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InterfaceModeToggle } from "@/components/ui/interface-mode-toggle";
import { FeatureHint } from "@/components/ui/feature-hint";
import { useProgressiveDisclosure } from "@/hooks/use-progressive-disclosure";
import { SmartPresetSelector } from "@/components/ui/smart-preset-selector";
import { usePresetApplication } from "@/hooks/use-preset-application";
import { EducationalPreset } from "@/lib/educational-presets";
import { useOptimizedAI } from "@/lib/optimized-ai-api";
import { cn } from "@/lib/utils";

interface SimplifiedAICourseAssistantProps {
  courseId: string;
  courseTitle: string;
  currentChapters?: number;
}

// AI Assistant suggestions and features
const QUICK_SUGGESTIONS = [
  {
    id: "content-outline",
    title: "Generate Chapter Outline",
    description: "Create a structured outline for your next chapter",
    icon: <FileText className="w-4 h-4" />,
    category: "basic",
    estimatedTime: "30 seconds"
  },
  {
    id: "learning-objectives",
    title: "Create Learning Objectives",
    description: "Generate clear, measurable learning objectives",
    icon: <Target className="w-4 h-4" />,
    category: "basic",
    estimatedTime: "45 seconds"
  },
  {
    id: "assessment-ideas",
    title: "Assessment Ideas",
    description: "Get suggestions for quizzes and assignments",
    icon: <Brain className="w-4 h-4" />,
    category: "basic",
    estimatedTime: "1 minute"
  },
  {
    id: "bulk-chapters",
    title: "Bulk Chapter Generation",
    description: "Generate multiple chapters at once",
    icon: <Wand2 className="w-4 h-4" />,
    category: "advanced",
    estimatedTime: "2-3 minutes"
  },
  {
    id: "curriculum-mapping",
    title: "Curriculum Mapping",
    description: "Map content to educational standards",
    icon: <Star className="w-4 h-4" />,
    category: "advanced",
    estimatedTime: "5 minutes"
  },
  {
    id: "personalization",
    title: "Content Personalization",
    description: "Adapt content for different learning styles",
    icon: <Users className="w-4 h-4" />,
    category: "expert",
    estimatedTime: "3-4 minutes"
  },
  {
    id: "smart-presets",
    title: "Apply Smart Preset",
    description: "Use proven course templates for quick setup",
    icon: <Star className="w-4 h-4" />,
    category: "basic",
    estimatedTime: "2-3 minutes"
  }
];

export const SimplifiedAICourseAssistant = ({
  courseId,
  courseTitle,
  currentChapters = 0
}: SimplifiedAICourseAssistantProps) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [generationType, setGenerationType] = useState("chapter");
  const [showPresetSelector, setShowPresetSelector] = useState(false);

  const {
    isFeatureRevealed,
    revealFeature,
    markFeatureUsed,
    getProgressScore
  } = useProgressiveDisclosure();

  const {
    updateCourseWithPreset,
    isApplying,
    progress,
    currentStep,
    error: presetError
  } = usePresetApplication();

  const {
    generateContent,
    generateQuestions,
    warmupCache,
    getCacheStats
  } = useOptimizedAI();

  // Filter suggestions based on revealed features and mode
  const getAvailableSuggestions = () => {
    if (!isAdvancedMode) {
      return QUICK_SUGGESTIONS.filter(s => s.category === "basic");
    }
    
    return QUICK_SUGGESTIONS.filter(suggestion => {
      switch (suggestion.category) {
        case "basic":
          return true;
        case "advanced":
          return isFeatureRevealed("ai-bulk-generation");
        case "expert":
          return isFeatureRevealed("advanced-ai-settings");
        default:
          return false;
      }
    });
  };

  const availableSuggestions = getAvailableSuggestions();

  // Warm up cache when component mounts
  useEffect(() => {
    if (courseId) {
      warmupCache(courseId);
    }
  }, [courseId, warmupCache]);

  const handleFeatureActivate = (featureId: string) => {
    revealFeature(featureId);
    markFeatureUsed(featureId);
    
    if (featureId === "ai-bulk-generation") {
      setIsAdvancedMode(true);
    }
  };

  const handleSuggestionClick = async (suggestionId: string) => {
    if (suggestionId === 'smart-presets') {
      setShowPresetSelector(true);
      markFeatureUsed("smart-presets");
      return;
    }
    
    setActiveFeature(suggestionId);
    markFeatureUsed("basic-course-creation");
    setIsGenerating(true);
    
    try {
      // Use optimized AI API based on suggestion type
      switch (suggestionId) {
        case 'content-outline':
          await generateContent({
            type: 'outline',
            topic: courseTitle,
            level: 'intermediate',
            tone: 'engaging',
            length: 'medium',
            includeExamples: true
          }, {
            courseId,
            priority: 'medium'
          });
          break;
          
        case 'learning-objectives':
          await generateContent({
            type: 'outline',
            topic: `Learning objectives for ${courseTitle}`,
            level: 'intermediate',
            tone: 'formal',
            length: 'short'
          }, {
            courseId,
            priority: 'medium'
          });
          break;
          
        case 'assessment-ideas':
          await generateQuestions({
            topic: courseTitle,
            count: 5,
            bloomsLevel: ['apply', 'analyze'],
            difficulty: 'medium',
            questionType: 'multiple-choice'
          }, {
            courseId,
            priority: 'medium'
          });
          break;
          
        default:
          // Simulate other AI operations
          await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      logger.error('AI generation error:', error);
      // Error handling is done in the individual components/hooks
    } finally {
      // Always clear the loading state and active feature
      setIsGenerating(false);
      setActiveFeature(null);
    }
  };

  const handleCustomRequest = () => {
    if (!userInput.trim()) return;
    
    setIsGenerating(true);
    markFeatureUsed("basic-course-creation");
    
    setTimeout(() => {
      setIsGenerating(false);
      setUserInput("");
    }, 3000);
  };

  const handlePresetSelect = async (preset: EducationalPreset) => {
    markFeatureUsed("smart-presets");
    
    // Start generation
    setIsGenerating(true);
    setActiveFeature('smart-presets');
    
    try {
      // For now, just simulate preset application
      // In a real implementation, this would use the preset application hook
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Close preset selector on successful completion
      setShowPresetSelector(false);
      // You could show a success message or redirect here
    } catch (error: any) {
      logger.error('Preset application failed:', error);
      // Keep preset selector open on error to allow retry
    } finally {
      setIsGenerating(false);
      setActiveFeature(null);
    }
  };

  const handleCustomPresetCreate = () => {
    setShowPresetSelector(false);
    // Navigate to custom preset creation wizard
    // This would typically open a modal or navigate to a dedicated page

  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            AI Course Assistant
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Get intelligent help creating content for &quot;{courseTitle}&quot;
          </p>
        </div>
        
        <InterfaceModeToggle
          isAdvancedMode={isAdvancedMode}
          onModeChange={setIsAdvancedMode}
          showBadge={false}
        />
      </div>

      {/* Progressive Feature Hints */}
      <div className="space-y-3">
        {!isFeatureRevealed("ai-bulk-generation") && currentChapters >= 2 && (
          <FeatureHint
            featureId="ai-bulk-generation"
            title="Bulk Chapter Generation Available"
            description="You've created multiple chapters! Unlock bulk generation to create several chapters at once."
            priority="medium"
            category="advanced"
            onActivate={() => handleFeatureActivate("ai-bulk-generation")}
          />
        )}

        {isFeatureRevealed("ai-bulk-generation") && !isFeatureRevealed("advanced-ai-settings") && (
          <FeatureHint
            featureId="advanced-ai-settings"
            title="Advanced AI Settings"
            description="Fine-tune AI generation with custom prompts, tone settings, and content personalization options."
            priority="low"
            category="expert"
            isNew={true}
            onActivate={() => handleFeatureActivate("advanced-ai-settings")}
          />
        )}
      </div>

      {/* Simple Mode Interface */}
      {!isAdvancedMode ? (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Quick AI Actions
              </CardTitle>
              <CardDescription>
                One-click AI assistance for common course creation tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSuggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-all duration-200 border-2",
                        activeFeature === suggestion.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600"
                      )}
                      onClick={() => handleSuggestionClick(suggestion.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            {suggestion.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm mb-1">{suggestion.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {suggestion.estimatedTime}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Simple Chat Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                Ask AI Assistant
              </CardTitle>
              <CardDescription>
                Describe what you need help with, and AI will assist you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="e.g., 'Create a chapter about data structures with practical examples'"
                  rows={3}
                />
                <Button
                  onClick={handleCustomRequest}
                  disabled={!userInput.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 mr-2"
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Advanced Mode Interface */
        <div className="space-y-6">
          {/* Advanced Generation Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                Advanced AI Generation
              </CardTitle>
              <CardDescription>
                Powerful AI tools with detailed configuration options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Generation Type Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Generation Type</label>
                    <Select value={generationType} onValueChange={setGenerationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chapter">Single Chapter</SelectItem>
                        <SelectItem value="bulk-chapters">Multiple Chapters</SelectItem>
                        <SelectItem value="curriculum">Full Curriculum</SelectItem>
                        <SelectItem value="assessment">Assessment Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic/Subject</label>
                    <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="programming">Programming</SelectItem>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="language">Language Arts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableSuggestions.map((suggestion) => (
                    <Card
                      key={suggestion.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        suggestion.category === "expert" && "border-purple-300 bg-purple-50 dark:bg-purple-900/20",
                        suggestion.category === "advanced" && "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                      )}
                      onClick={() => handleSuggestionClick(suggestion.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            suggestion.category === "expert" && "bg-purple-100 dark:bg-purple-900/40",
                            suggestion.category === "advanced" && "bg-blue-100 dark:bg-blue-900/40",
                            suggestion.category === "basic" && "bg-gray-100 dark:bg-gray-800"
                          )}>
                            {suggestion.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{suggestion.title}</h3>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs mt-1",
                                suggestion.category === "expert" && "border-purple-300 text-purple-700",
                                suggestion.category === "advanced" && "border-blue-300 text-blue-700"
                              )}
                            >
                              {suggestion.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {suggestion.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Advanced Settings (if feature revealed) */}
                {isFeatureRevealed("advanced-ai-settings") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-800 dark:text-purple-300">
                        Advanced AI Settings
                      </span>
                      <Badge className="bg-purple-600 text-white text-xs">Expert</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-purple-700 dark:text-purple-300">Content Tone</label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="formal">Formal Academic</SelectItem>
                            <SelectItem value="conversational">Conversational</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="engaging">Engaging & Fun</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="font-medium text-purple-700 dark:text-purple-300">Difficulty Level</label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="mixed">Mixed Levels</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generation Status */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Bot className="w-6 h-6 text-blue-600" />
                  </motion.div>
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-300">
                      AI is working on your request...
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      This usually takes 30-60 seconds. Please wait.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Preset Selector Modal */}
      <AnimatePresence>
        {showPresetSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPresetSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Smart Course Presets
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPresetSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
                <SmartPresetSelector
                  onPresetSelect={handlePresetSelect}
                  onCustomCreate={handleCustomPresetCreate}
                  userProfile={{
                    experience: 'intermediate', // This would come from user data
                    interests: ['programming', 'education'],
                    previousCourses: []
                  }}
                  className="p-6"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};