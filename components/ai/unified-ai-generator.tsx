"use client";

/**
 * Unified AI Content Generator
 *
 * A comprehensive, reusable AI content generation component that supports:
 * - Context awareness (Course → Chapter → Section hierarchy)
 * - Bloom's Taxonomy integration
 * - Simple/Advanced modes
 * - Multiple content types
 * - Premium gating
 * - Consistent form filling
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterfaceModeToggle } from "@/components/ui/interface-mode-toggle";
import {
  Brain,
  Sparkles,
  Loader2,
  MessageSquare,
  BookOpen,
  GraduationCap,
  FileText,
  Target,
  ChevronRight,
  Info,
  Zap,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/lib/logger";

import { AIButtonTrigger } from "./ai-button-trigger";
import { BloomsTaxonomySelector, buildBloomsPromptSection } from "./blooms-taxonomy-selector";
import { PremiumAIGate } from "@/components/premium/premium-ai-gate";
import type {
  UnifiedAIGeneratorProps,
  BloomsLevel,
  ContentType,
  AdvancedSettings,
  ChapterSettings,
  ChapterDifficulty,
  SectionSettings,
  SectionContentType,
} from "./unified-ai-generator-types";
import {
  DEFAULT_CHAPTER_SETTINGS,
  CHAPTER_DIFFICULTY_OPTIONS,
  CHAPTER_DURATION_OPTIONS,
  CHAPTER_FOCUS_AREA_OPTIONS,
  DEFAULT_SECTION_SETTINGS,
  SECTION_CONTENT_TYPE_OPTIONS,
  SECTION_FOCUS_AREA_OPTIONS,
} from "./unified-ai-generator-types";

// ============================================================================
// Content Type Configurations
// ============================================================================

const CONTENT_TYPE_CONFIG: Record<ContentType, {
  title: string;
  description: string;
  icon: typeof Brain;
  color: string;
  previewItems: string[];
  promptPlaceholder: string;
  focusPlaceholder: string;
}> = {
  description: {
    title: "AI Description Generator",
    description: "Generate comprehensive, engaging descriptions",
    icon: FileText,
    color: "blue",
    previewItems: [
      "Engaging hook to capture interest",
      "Clear overview of content and structure",
      "Real-world relevance and applications",
      "What learners will accomplish",
    ],
    promptPlaceholder: 'e.g., "Keep it concise", "Add real-world examples", "Focus on practical benefits"',
    focusPlaceholder: "e.g., beginner-friendly, industry applications, step-by-step approach",
  },
  learningObjectives: {
    title: "AI Learning Objectives Generator",
    description: "Create clear, measurable learning objectives using Bloom&apos;s Taxonomy",
    icon: Target,
    color: "indigo",
    previewItems: [
      "SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)",
      "Action-oriented using Bloom&apos;s Taxonomy verbs",
      "3-5 clear, distinct objectives",
      "Aligned with content and assessments",
    ],
    promptPlaceholder: 'e.g., "Focus on practical skills", "Include assessment criteria", "Use beginner-friendly language"',
    focusPlaceholder: "e.g., hands-on practice, theoretical foundations, real-world applications",
  },
  content: {
    title: "AI Content Generator",
    description: "Generate comprehensive educational content",
    icon: BookOpen,
    color: "emerald",
    previewItems: [
      "Well-structured content sections",
      "Examples and illustrations",
      "Practice exercises",
      "Summary and key takeaways",
    ],
    promptPlaceholder: 'e.g., "Include code examples", "Add diagrams", "Focus on fundamentals"',
    focusPlaceholder: "e.g., programming concepts, design principles, data analysis",
  },
  chapters: {
    title: "AI Chapter Generator",
    description: "Generate structured course chapters with titles and descriptions",
    icon: BookOpen,
    color: "purple",
    previewItems: [
      "Logical chapter sequence",
      "Progressive difficulty",
      "Clear learning paths",
      "Engaging chapter titles",
    ],
    promptPlaceholder: 'e.g., "Focus on practical examples", "Include hands-on projects", "Start with fundamentals"',
    focusPlaceholder: "e.g., web development, data science, machine learning",
  },
  sections: {
    title: "AI Section Generator",
    description: "Generate multiple sections for your chapter",
    icon: GraduationCap,
    color: "purple",
    previewItems: [
      "Logical section structure",
      "Progressive difficulty",
      "Clear learning paths",
      "Engaging section titles",
    ],
    promptPlaceholder: 'e.g., "Focus on practical examples", "Include assessments", "Start with basics"',
    focusPlaceholder: "e.g., fundamentals, advanced topics, hands-on projects",
  },
  questions: {
    title: "AI Question Generator",
    description: "Generate exam and quiz questions",
    icon: Target,
    color: "amber",
    previewItems: [
      "Various question types",
      "Answer keys with explanations",
      "Difficulty balancing",
      "Bloom&apos;s taxonomy alignment",
    ],
    promptPlaceholder: 'e.g., "Include code problems", "Focus on concepts", "Add practical scenarios"',
    focusPlaceholder: "e.g., variables, functions, algorithms",
  },
  codeExplanation: {
    title: "AI Code Explanation Generator",
    description: "Generate detailed code explanations",
    icon: FileText,
    color: "sky",
    previewItems: [
      "Line-by-line explanations",
      "Best practices highlighted",
      "Common pitfalls noted",
      "Alternative approaches",
    ],
    promptPlaceholder: 'e.g., "Explain for beginners", "Include performance notes", "Add examples"',
    focusPlaceholder: "e.g., specific function, algorithm, pattern",
  },
  mathExplanation: {
    title: "AI Math Explanation Generator",
    description: "Generate mathematical explanations with LaTeX",
    icon: Brain,
    color: "purple",
    previewItems: [
      "Step-by-step solutions",
      "LaTeX formatted equations",
      "Visual explanations",
      "Practice problems",
    ],
    promptPlaceholder: 'e.g., "Include proofs", "Add visualizations", "Explain intuition"',
    focusPlaceholder: "e.g., calculus, linear algebra, statistics",
  },
};

// ============================================================================
// Default Values
// ============================================================================

const defaultBloomsLevels: Record<BloomsLevel, boolean> = {
  remember: true,
  understand: true,
  apply: true,
  analyze: false,
  evaluate: false,
  create: false,
};

const defaultAdvancedSettings: AdvancedSettings = {
  targetAudience: "general",
  difficulty: "intermediate",
  duration: "8-12 weeks",
  tone: "professional",
  creativity: 7,
  detailLevel: 5,
  includeExamples: true,
  learningStyle: "mixed",
  industryFocus: "",
};

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedAIGenerator({
  contentType,
  entityLevel,
  entityTitle,
  onGenerate,
  context,
  courseId,
  chapterId,
  sectionId,
  bloomsTaxonomy = { enabled: true },
  chapterOptions = { defaultCount: 5, minCount: 3, maxCount: 10 },
  sectionOptions = { defaultCount: 5, minCount: 2, maxCount: 10 },
  trigger,
  triggerVariant = "sky-gradient",
  size = "sm",
  buttonText,
  premiumRequired = true,
  isPremium = true,
  showAdvancedMode = true,
  initialMode = "simple",
  disabled = false,
  existingContent,
}: UnifiedAIGeneratorProps) {
  // State
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(initialMode === "advanced");
  const [activeTab, setActiveTab] = useState("basics");
  const [userPrompt, setUserPrompt] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [bloomsLevels, setBloomsLevels] = useState<Record<BloomsLevel, boolean>>(
    bloomsTaxonomy.defaultLevels || defaultBloomsLevels
  );
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(defaultAdvancedSettings);
  // Chapter-specific settings
  const [chapterSettings, setChapterSettings] = useState<ChapterSettings>({
    ...DEFAULT_CHAPTER_SETTINGS,
    chapterCount: chapterOptions.defaultCount || 5,
  });
  // Section-specific settings
  const [sectionSettings, setSectionSettings] = useState<SectionSettings>({
    ...DEFAULT_SECTION_SETTINGS,
    sectionCount: sectionOptions.defaultCount || 5,
  });

  const config = CONTENT_TYPE_CONFIG[contentType];

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setUserPrompt("");
      setFocusArea("");
      setActiveTab("basics");
    }
  }, [open]);

  // Handle Bloom's level change
  const handleBloomsLevelChange = useCallback((level: BloomsLevel, enabled: boolean) => {
    setBloomsLevels((prev) => ({ ...prev, [level]: enabled }));
  }, []);

  // Handle advanced settings change
  const updateAdvancedSetting = useCallback(<K extends keyof AdvancedSettings>(
    key: K,
    value: AdvancedSettings[K]
  ) => {
    setAdvancedSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Reset all settings
  const handleReset = useCallback(() => {
    setUserPrompt("");
    setFocusArea("");
    setBloomsLevels(bloomsTaxonomy.defaultLevels || defaultBloomsLevels);
    setAdvancedSettings(defaultAdvancedSettings);
    setChapterSettings({
      ...DEFAULT_CHAPTER_SETTINGS,
      chapterCount: chapterOptions.defaultCount || 5,
    });
    setSectionSettings({
      ...DEFAULT_SECTION_SETTINGS,
      sectionCount: sectionOptions.defaultCount || 5,
    });
    setActiveTab("basics");
  }, [bloomsTaxonomy.defaultLevels, chapterOptions.defaultCount, sectionOptions.defaultCount]);

  // Generate content
  const handleGenerate = async () => {
    if (!entityTitle) {
      toast.error(`${entityLevel} title is required for AI generation`);
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        contentType,
        entityLevel,
        entityTitle,
        context,
        courseId,
        chapterId,
        sectionId,
        userPrompt,
        focusArea,
        bloomsEnabled: bloomsTaxonomy.enabled,
        bloomsLevels: bloomsTaxonomy.enabled ? bloomsLevels : undefined,
        advancedMode: isAdvancedMode,
        advancedSettings: isAdvancedMode ? advancedSettings : undefined,
        existingContent,
        // Chapter-specific options
        chapterSettings: contentType === "chapters" ? chapterSettings : undefined,
        // Section-specific options
        sectionSettings: contentType === "sections" ? sectionSettings : undefined,
      };

      const response = await fetch("/api/ai/unified-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.content) {
        onGenerate(data.content);
        toast.success(`${config.title.replace("AI ", "").replace(" Generator", "")} generated successfully!`);
        setOpen(false);
        handleReset();
      } else {
        throw new Error(data.error || "Invalid response format");
      }
    } catch (error) {
      logger.error("AI generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Build context display
  const contextBreadcrumb = [
    context.course?.title && { label: "Course", value: context.course.title },
    context.chapter?.title && { label: "Chapter", value: context.chapter.title },
    context.section?.title && { label: "Section", value: context.section.title },
  ].filter(Boolean) as { label: string; value: string }[];

  // Default trigger button
  const defaultTrigger = (
    <AIButtonTrigger
      variant={triggerVariant}
      size={size}
      disabled={disabled || !entityTitle}
      buttonText={buttonText || `Generate ${contentType === "learningObjectives" ? "Objectives" : "with AI"}`}
      isPremium={isPremium}
      showPremiumLock={premiumRequired && !isPremium}
    />
  );

  // Determine if we should show the premium gate
  // In development mode, always allow access (skip premium gate)
  // In production, check actual premium status
  const isDevelopment = process.env.NODE_ENV === "development";
  const shouldShowPremiumGate = premiumRequired && !isDevelopment && !isPremium;

  const triggerElement = shouldShowPremiumGate ? (
    <PremiumAIGate
      isPremium={isPremium}
      featureName={config.title}
      size={size}
    >
      {trigger || defaultTrigger}
    </PremiumAIGate>
  ) : (
    trigger || defaultTrigger
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Brain className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold">{config.title}</span>
            {showAdvancedMode && (
              <Badge variant="outline" className="ml-2">
                {isAdvancedMode ? "Advanced" : "Simple"} Mode
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            {config.description}
          </DialogDescription>

          {/* Context Breadcrumb */}
          {contextBreadcrumb.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-3 p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700">
              {contextBreadcrumb.map((item, index) => (
                <div key={item.label} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-3 w-3 mx-1 text-sky-400" />
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400 uppercase">
                      {item.label}:
                    </span>
                    <span className="text-xs font-medium text-sky-800 dark:text-sky-200 truncate max-w-[150px]">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
              {context.course?.difficulty && (
                <>
                  <span className="mx-2 text-sky-300">|</span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200"
                  >
                    {context.course.difficulty}
                  </Badge>
                </>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Toggle */}
          {showAdvancedMode && (
            <InterfaceModeToggle
              isAdvancedMode={isAdvancedMode}
              onModeChange={setIsAdvancedMode}
              className="mb-4"
            />
          )}

          <AnimatePresence mode="wait">
            {!isAdvancedMode ? (
              /* Simple Mode */
              <motion.div
                key="simple"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Quick Generation</span>
                </div>

                {/* Chapter Settings - Only for chapters content type */}
                {contentType === "chapters" && (
                  <div className="space-y-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                    {/* Number of Chapters */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                        <BookOpen className="h-4 w-4" />
                        Number of Chapters
                      </Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[chapterSettings.chapterCount]}
                          onValueChange={(v) => setChapterSettings(prev => ({ ...prev, chapterCount: v[0] }))}
                          min={chapterOptions.minCount || 2}
                          max={chapterOptions.maxCount || 20}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400 min-w-[2rem] text-center">
                          {chapterSettings.chapterCount}
                        </span>
                      </div>
                    </div>

                    {/* Difficulty Level */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Difficulty Level</Label>
                      <Select
                        value={chapterSettings.difficulty}
                        onValueChange={(v) => setChapterSettings(prev => ({ ...prev, difficulty: v as ChapterDifficulty }))}
                      >
                        <SelectTrigger className="border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CHAPTER_DIFFICULTY_OPTIONS).map(([key, option]) => (
                            <SelectItem key={key} value={key}>
                              {option.label} - {option.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Target Duration */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Target Duration per Chapter</Label>
                      <Select
                        value={chapterSettings.targetDuration}
                        onValueChange={(v) => setChapterSettings(prev => ({ ...prev, targetDuration: v }))}
                      >
                        <SelectTrigger className="border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHAPTER_DURATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Focus Areas */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Focus Areas (Optional)</Label>
                      <div className="flex flex-wrap gap-2">
                        {CHAPTER_FOCUS_AREA_OPTIONS.map((area) => (
                          <Badge
                            key={area}
                            variant={chapterSettings.focusAreas.includes(area) ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer transition-all",
                              chapterSettings.focusAreas.includes(area)
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            )}
                            onClick={() => {
                              setChapterSettings(prev => ({
                                ...prev,
                                focusAreas: prev.focusAreas.includes(area)
                                  ? prev.focusAreas.filter(a => a !== area)
                                  : [...prev.focusAreas, area]
                              }));
                            }}
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Include Keywords */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Include Keywords (Optional)</Label>
                      <Input
                        placeholder="e.g., React, JavaScript, web development"
                        value={chapterSettings.includeKeywords}
                        onChange={(e) => setChapterSettings(prev => ({ ...prev, includeKeywords: e.target.value }))}
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    {/* Additional Instructions */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Additional Instructions (Optional)</Label>
                      <Textarea
                        placeholder="Any specific requirements for chapter generation..."
                        value={chapterSettings.additionalInstructions}
                        onChange={(e) => setChapterSettings(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                        rows={2}
                        className="border-gray-300 dark:border-gray-600 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Section Settings - Only for sections content type */}
                {contentType === "sections" && (
                  <div className="space-y-4 p-4 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700">
                    {/* Number of Sections */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                        <GraduationCap className="h-4 w-4" />
                        Number of Sections
                      </Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[sectionSettings.sectionCount]}
                          onValueChange={(v) => setSectionSettings(prev => ({ ...prev, sectionCount: v[0] }))}
                          min={sectionOptions.minCount || 2}
                          max={sectionOptions.maxCount || 10}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-lg font-bold text-sky-600 dark:text-sky-400 min-w-[2rem] text-center">
                          {sectionSettings.sectionCount}
                        </span>
                      </div>
                    </div>

                    {/* Content Type */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Content Type</Label>
                      <Select
                        value={sectionSettings.contentType}
                        onValueChange={(v) => setSectionSettings(prev => ({ ...prev, contentType: v as SectionContentType }))}
                      >
                        <SelectTrigger className="border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SECTION_CONTENT_TYPE_OPTIONS).map(([key, option]) => (
                            <SelectItem key={key} value={key}>
                              {option.label} - {option.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Include Assessment */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">Include Assessment Section</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Add a quiz or assessment at the end</p>
                      </div>
                      <Switch
                        checked={sectionSettings.includeAssessment}
                        onCheckedChange={(v) => setSectionSettings(prev => ({ ...prev, includeAssessment: v }))}
                      />
                    </div>

                    {/* Focus Areas */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Section Types (Optional)</Label>
                      <div className="flex flex-wrap gap-2">
                        {SECTION_FOCUS_AREA_OPTIONS.map((area) => (
                          <Badge
                            key={area}
                            variant={sectionSettings.focusAreas.includes(area) ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer transition-all",
                              sectionSettings.focusAreas.includes(area)
                                ? "bg-sky-600 hover:bg-sky-700 text-white"
                                : "hover:bg-sky-100 dark:hover:bg-sky-900/30"
                            )}
                            onClick={() => {
                              setSectionSettings(prev => ({
                                ...prev,
                                focusAreas: prev.focusAreas.includes(area)
                                  ? prev.focusAreas.filter(a => a !== area)
                                  : [...prev.focusAreas, area]
                              }));
                            }}
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Additional Instructions */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 font-medium">Additional Instructions (Optional)</Label>
                      <Textarea
                        placeholder="Any specific requirements for section generation..."
                        value={sectionSettings.additionalInstructions}
                        onChange={(e) => setSectionSettings(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                        rows={2}
                        className="border-gray-300 dark:border-gray-600 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* User Prompt */}
                <div className="space-y-2">
                  <Label
                    htmlFor="user-prompt"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Custom Instructions (Optional)
                  </Label>
                  <Textarea
                    id="user-prompt"
                    placeholder={config.promptPlaceholder}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave empty for default generation with context awareness.
                  </p>
                </div>

                {/* Focus Area */}
                <div className="space-y-2">
                  <Label
                    htmlFor="focus-area"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Specific Focus (Optional)
                  </Label>
                  <Input
                    id="focus-area"
                    placeholder={config.focusPlaceholder}
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                  />
                </div>

                {/* Bloom's Taxonomy - Always Visible */}
                {bloomsTaxonomy.enabled && (
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                    <BloomsTaxonomySelector
                      selectedLevels={bloomsLevels}
                      onLevelChange={handleBloomsLevelChange}
                      compact
                    />
                  </div>
                )}

                {/* Existing Content Warning */}
                {existingContent && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium">Existing content will be replaced</p>
                      <p className="text-xs mt-0.5">
                        You can edit the generated content before saving.
                      </p>
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-500" />
                    AI will generate:
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    {config.previewItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-sky-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Advanced Mode */
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
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basics">Basics</TabsTrigger>
                    <TabsTrigger value="blooms">Bloom&apos;s</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                  </TabsList>

                  {/* Basics Tab */}
                  <TabsContent value="basics" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Select
                          value={advancedSettings.targetAudience}
                          onValueChange={(v) => updateAdvancedSetting("targetAudience", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Audience</SelectItem>
                            <SelectItem value="students">Students</SelectItem>
                            <SelectItem value="professionals">Professionals</SelectItem>
                            <SelectItem value="beginners">Beginners</SelectItem>
                            <SelectItem value="advanced">Advanced Learners</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Difficulty Level</Label>
                        <Select
                          value={advancedSettings.difficulty}
                          onValueChange={(v) => updateAdvancedSetting("difficulty", v)}
                        >
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Learning Style</Label>
                        <Select
                          value={advancedSettings.learningStyle}
                          onValueChange={(v) => updateAdvancedSetting("learningStyle", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mixed">Mixed</SelectItem>
                            <SelectItem value="visual">Visual</SelectItem>
                            <SelectItem value="hands-on">Hands-on</SelectItem>
                            <SelectItem value="theoretical">Theoretical</SelectItem>
                            <SelectItem value="case-study">Case Study</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Industry Focus (Optional)</Label>
                        <Input
                          placeholder="e.g., Healthcare, Finance, Tech"
                          value={advancedSettings.industryFocus}
                          onChange={(e) => updateAdvancedSetting("industryFocus", e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Bloom's Tab */}
                  <TabsContent value="blooms" className="space-y-4 pt-4">
                    {bloomsTaxonomy.enabled ? (
                      <BloomsTaxonomySelector
                        selectedLevels={bloomsLevels}
                        onLevelChange={handleBloomsLevelChange}
                        showVerbs
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Bloom&apos;s Taxonomy is disabled for this generator.
                      </div>
                    )}
                  </TabsContent>

                  {/* Style Tab */}
                  <TabsContent value="style" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Writing Tone</Label>
                      <Select
                        value={advancedSettings.tone}
                        onValueChange={(v) => updateAdvancedSetting("tone", v)}
                      >
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

                    <div className="space-y-3">
                      <Label>Creativity Level: {advancedSettings.creativity}/10</Label>
                      <Slider
                        value={[advancedSettings.creativity]}
                        onValueChange={(v) => updateAdvancedSetting("creativity", v[0])}
                        max={10}
                        min={1}
                        step={1}
                      />
                      <p className="text-xs text-gray-500">
                        Higher values = more creative and unique content
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Detail Level: {advancedSettings.detailLevel}/10</Label>
                      <Slider
                        value={[advancedSettings.detailLevel]}
                        onValueChange={(v) => updateAdvancedSetting("detailLevel", v[0])}
                        max={10}
                        min={1}
                        step={1}
                      />
                      <p className="text-xs text-gray-500">
                        Higher values = more detailed and comprehensive content
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="include-examples"
                        checked={advancedSettings.includeExamples}
                        onCheckedChange={(v) => updateAdvancedSetting("includeExamples", v)}
                      />
                      <Label htmlFor="include-examples">Include practical examples</Label>
                    </div>
                  </TabsContent>

                  {/* Custom Tab */}
                  <TabsContent value="custom" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-prompt-adv">Custom Instructions</Label>
                      <Textarea
                        id="user-prompt-adv"
                        placeholder={config.promptPlaceholder}
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="focus-area-adv">Specific Focus</Label>
                      <Input
                        id="focus-area-adv"
                        placeholder={config.focusPlaceholder}
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Advanced Preview */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Advanced Configuration:
                  </h4>
                  <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                    <p>
                      • Target: {advancedSettings.targetAudience} ({advancedSettings.difficulty})
                    </p>
                    <p>• Style: {advancedSettings.learningStyle} | Tone: {advancedSettings.tone}</p>
                    <p>
                      • Creativity: {advancedSettings.creativity}/10 | Detail:{" "}
                      {advancedSettings.detailLevel}/10
                    </p>
                    {bloomsTaxonomy.enabled && (
                      <p>
                        • Bloom&apos;s levels:{" "}
                        {Object.entries(bloomsLevels)
                          .filter(([, enabled]) => enabled)
                          .map(([level]) => level)
                          .join(", ") || "None selected"}
                      </p>
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
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !entityTitle}
              className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-6 shadow-md hover:shadow-lg transition-all"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Generate</span>
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
