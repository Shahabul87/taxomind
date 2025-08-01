"use client";

import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Sparkles, 
  BookOpen, 
  Brain, 
  Target,
  CheckCircle,
  Loader2,
  Play,
  Edit,
  Eye,
  Save,
  X,
  ArrowLeft,
  ArrowRight,
  FileText,
  Video,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  Users,
  Clock,
  Languages,
  Globe,
  Zap,
  Shield,
  Activity,
  Award,
  Code,
  MessageSquare,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";

interface ChapterData {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  sections: any[];
  courseTitle?: string;
  courseDescription?: string;
  learningObjectives?: string[];
}

interface GeneratedSection {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'reading' | 'interactive' | 'assessment' | 'project' | 'mixed';
  estimatedDuration: string;
  bloomsLevel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: {
    summary: string;
    keyPoints: string[];
    activities?: string[];
    assessmentQuestions?: {
      question: string;
      type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
      options?: string[];
      correctAnswer?: string;
      explanation?: string;
    }[];
    resources?: {
      title: string;
      type: 'video' | 'article' | 'document' | 'tool';
      url?: string;
      description?: string;
    }[];
    codeExamples?: {
      title: string;
      language: string;
      code: string;
      explanation: string;
    }[];
  };
  aiInsights?: {
    learningPath: string;
    prerequisites: string[];
    outcomes: string[];
    teachingTips: string[];
  };
}

interface GeneratedContent {
  title: string;
  description: string;
  learningOutcomes: string[];
  estimatedDuration: string;
  difficulty: string;
  sections: GeneratedSection[];
  metadata: {
    generatedAt: string;
    model: string;
    language: string;
    targetAudience: string;
    pedagogicalApproach: string;
  };
  qualityScore?: {
    completeness: number;
    clarity: number;
    engagement: number;
    alignment: number;
    overall: number;
  };
}

interface GenerationPreferences {
  contentType: string;
  generationMode: string;
  sectionCount: number;
  focusAreas: string;
  targetAudience: string;
  difficulty: string;
  language: string;
  includeAssessments: boolean;
  includeInteractive: boolean;
  includeMultimedia: boolean;
  pedagogicalApproach: string;
  bloomsLevels: string[];
  estimatedDuration: number;
  tone: string;
  includeAIInsights: boolean;
}

interface AIChapterContentGeneratorEnhancedProps {
  open: boolean;
  onClose: () => void;
  chapter: ChapterData;
  onContentGenerated?: (content: GeneratedContent) => void;
}

const CONTENT_TYPES = [
  { 
    value: 'comprehensive', 
    label: 'Comprehensive Content', 
    description: 'Generate all content types for complete learning',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400'
  },
  { 
    value: 'video-focused', 
    label: 'Video-Focused', 
    description: 'Primarily video content with supporting materials',
    icon: Video,
    color: 'text-red-600 dark:text-red-400'
  },
  { 
    value: 'text-heavy', 
    label: 'Reading-Heavy', 
    description: 'Rich text content with interactive elements',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400'
  },
  { 
    value: 'assessment-rich', 
    label: 'Assessment-Rich', 
    description: 'Multiple quizzes and practical exercises',
    icon: CheckCircle2,
    color: 'text-purple-600 dark:text-purple-400'
  },
  { 
    value: 'project-based', 
    label: 'Project-Based', 
    description: 'Hands-on projects and case studies',
    icon: Code,
    color: 'text-orange-600 dark:text-orange-400'
  },
  { 
    value: 'interactive', 
    label: 'Interactive Learning', 
    description: 'Simulations, games, and interactive content',
    icon: Activity,
    color: 'text-pink-600 dark:text-pink-400'
  }
];

const PEDAGOGICAL_APPROACHES = [
  { value: 'constructivist', label: 'Constructivist', description: 'Learn by building on prior knowledge' },
  { value: 'inquiry-based', label: 'Inquiry-Based', description: 'Learn through questioning and exploration' },
  { value: 'problem-based', label: 'Problem-Based', description: 'Learn by solving real-world problems' },
  { value: 'collaborative', label: 'Collaborative', description: 'Learn through group work and discussion' },
  { value: 'experiential', label: 'Experiential', description: 'Learn by doing and reflecting' },
  { value: 'traditional', label: 'Traditional', description: 'Structured lectures and assessments' }
];

const BLOOMS_LEVELS = [
  { value: 'remember', label: 'Remember', color: 'bg-blue-100 text-blue-700' },
  { value: 'understand', label: 'Understand', color: 'bg-green-100 text-green-700' },
  { value: 'apply', label: 'Apply', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'analyze', label: 'Analyze', color: 'bg-orange-100 text-orange-700' },
  { value: 'evaluate', label: 'Evaluate', color: 'bg-red-100 text-red-700' },
  { value: 'create', label: 'Create', color: 'bg-purple-100 text-purple-700' }
];

export const AIChapterContentGeneratorEnhanced = ({ 
  open, 
  onClose, 
  chapter,
  onContentGenerated 
}: AIChapterContentGeneratorEnhancedProps) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("preferences");
  
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    contentType: 'comprehensive',
    generationMode: 'detailed',
    sectionCount: 4,
    focusAreas: '',
    targetAudience: '',
    difficulty: 'intermediate',
    language: 'English',
    includeAssessments: true,
    includeInteractive: true,
    includeMultimedia: true,
    pedagogicalApproach: 'constructivist',
    bloomsLevels: ['understand', 'apply', 'analyze'],
    estimatedDuration: 60,
    tone: 'professional',
    includeAIInsights: true
  });

  const generateContent = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const response = await axios.post("/api/sam/content-generation", {
        action: "generate-chapter-content",
        data: {
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterDescription: chapter.description,
          courseContext: {
            courseId: chapter.courseId,
            courseTitle: chapter.courseTitle,
            courseDescription: chapter.courseDescription,
            learningObjectives: chapter.learningObjectives
          },
          preferences,
          config: {
            model: "advanced",
            includeMultimedia: preferences.includeMultimedia,
            includeAssessments: preferences.includeAssessments,
            includeInteractive: preferences.includeInteractive,
            includeAIInsights: preferences.includeAIInsights,
            targetBloomsLevels: preferences.bloomsLevels,
            language: preferences.language
          }
        }
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.data.success && response.data.data.content) {
        setGeneratedContent(response.data.data.content);
        setStep(2);
        toast.success("Chapter content generated successfully!");
      } else {
        throw new Error("Failed to generate content");
      }
    } catch (error) {
      console.error("Content generation error:", error);
      toast.error("Failed to generate content. Using demo content.");
      // Use demo content as fallback
      setGeneratedContent(getDemoContent());
      setStep(2);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 500);
    }
  }, [chapter, preferences]);

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleApplyContent = () => {
    if (generatedContent && selectedSections.length > 0) {
      const selectedContent: GeneratedContent = {
        ...generatedContent,
        sections: generatedContent.sections.filter(s => selectedSections.includes(s.id))
      };
      
      onContentGenerated?.(selectedContent);
      toast.success(`Applied ${selectedSections.length} sections to your chapter`);
      onClose();
    } else {
      toast.error("Please select at least one section to apply");
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 dark:bg-gray-900 p-6 border-r border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  SAM Content Generator
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered chapter content
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4 mb-6">
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                step >= 1 ? "bg-purple-100 dark:bg-purple-900/30" : "bg-gray-100 dark:bg-gray-800"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= 1 ? "bg-purple-600 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-600"
                )}>
                  1
                </div>
                <div>
                  <p className={cn(
                    "font-medium",
                    step >= 1 ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"
                  )}>
                    Configure Preferences
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Set generation parameters
                  </p>
                </div>
              </div>

              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                step >= 2 ? "bg-purple-100 dark:bg-purple-900/30" : "bg-gray-100 dark:bg-gray-800"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= 2 ? "bg-purple-600 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-600"
                )}>
                  2
                </div>
                <div>
                  <p className={cn(
                    "font-medium",
                    step >= 2 ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"
                  )}>
                    Review & Select
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Choose sections to apply
                  </p>
                </div>
              </div>
            </div>

            {/* Chapter Info */}
            <Card className="bg-white/50 dark:bg-gray-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Chapter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Title</p>
                  <p className="text-sm font-medium">{chapter.title}</p>
                </div>
                {chapter.description && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Description</p>
                    <p className="text-sm line-clamp-2">{chapter.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Current Sections</p>
                  <p className="text-sm font-medium">{chapter.sections?.length || 0} sections</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <DialogTitle className="text-xl flex items-center gap-3">
                {step === 1 ? (
                  <>
                    <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Configure Content Generation
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Review Generated Content
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto p-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                        <TabsTrigger value="content">Content Type</TabsTrigger>
                        <TabsTrigger value="pedagogy">Pedagogy</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>

                      <TabsContent value="preferences" className="space-y-6 mt-6">
                        {/* Target Audience */}
                        <div>
                          <Label>Target Audience</Label>
                          <Textarea
                            placeholder="e.g., Beginners in web development, College students, Working professionals..."
                            value={preferences.targetAudience}
                            onChange={(e) => setPreferences({...preferences, targetAudience: e.target.value})}
                            className="mt-2"
                            rows={2}
                          />
                        </div>

                        {/* Focus Areas */}
                        <div>
                          <Label>Focus Areas</Label>
                          <Textarea
                            placeholder="Specific topics or concepts to emphasize..."
                            value={preferences.focusAreas}
                            onChange={(e) => setPreferences({...preferences, focusAreas: e.target.value})}
                            className="mt-2"
                            rows={2}
                          />
                        </div>

                        {/* Difficulty Level */}
                        <div>
                          <Label>Difficulty Level</Label>
                          <Select
                            value={preferences.difficulty}
                            onValueChange={(v) => setPreferences({...preferences, difficulty: v})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Section Count */}
                        <div>
                          <Label>Number of Sections</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              value={[preferences.sectionCount]}
                              onValueChange={([v]) => setPreferences({...preferences, sectionCount: v})}
                              min={2}
                              max={10}
                              step={1}
                              className="flex-1"
                            />
                            <span className="w-12 text-center font-medium">{preferences.sectionCount}</span>
                          </div>
                        </div>

                        {/* Estimated Duration */}
                        <div>
                          <Label>Estimated Chapter Duration (minutes)</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              value={[preferences.estimatedDuration]}
                              onValueChange={([v]) => setPreferences({...preferences, estimatedDuration: v})}
                              min={15}
                              max={180}
                              step={15}
                              className="flex-1"
                            />
                            <span className="w-16 text-center font-medium">{preferences.estimatedDuration}m</span>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="content" className="space-y-6 mt-6">
                        {/* Content Type Selection */}
                        <div>
                          <Label>Content Type</Label>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {CONTENT_TYPES.map((type) => {
                              const Icon = type.icon;
                              return (
                                <Card
                                  key={type.value}
                                  className={cn(
                                    "cursor-pointer transition-all",
                                    preferences.contentType === type.value
                                      ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                      : "hover:border-purple-300 dark:hover:border-purple-700"
                                  )}
                                  onClick={() => setPreferences({...preferences, contentType: type.value})}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <Icon className={cn("w-5 h-5", type.color)} />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{type.label}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          {type.description}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>

                        {/* Content Features */}
                        <div className="space-y-3">
                          <Label>Include in Content</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <div>
                                  <p className="font-medium text-sm">Assessments & Quizzes</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Knowledge checks and evaluations
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={preferences.includeAssessments}
                                onCheckedChange={(v) => setPreferences({...preferences, includeAssessments: v})}
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <div>
                                  <p className="font-medium text-sm">Interactive Elements</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Simulations and hands-on activities
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={preferences.includeInteractive}
                                onCheckedChange={(v) => setPreferences({...preferences, includeInteractive: v})}
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <div>
                                  <p className="font-medium text-sm">Multimedia Resources</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Videos, images, and audio content
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={preferences.includeMultimedia}
                                onCheckedChange={(v) => setPreferences({...preferences, includeMultimedia: v})}
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                  <p className="font-medium text-sm">AI Learning Insights</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Personalized tips and recommendations
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={preferences.includeAIInsights}
                                onCheckedChange={(v) => setPreferences({...preferences, includeAIInsights: v})}
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="pedagogy" className="space-y-6 mt-6">
                        {/* Pedagogical Approach */}
                        <div>
                          <Label>Pedagogical Approach</Label>
                          <Select
                            value={preferences.pedagogicalApproach}
                            onValueChange={(v) => setPreferences({...preferences, pedagogicalApproach: v})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PEDAGOGICAL_APPROACHES.map((approach) => (
                                <SelectItem key={approach.value} value={approach.value}>
                                  <div className="flex flex-col">
                                    <span>{approach.label}</span>
                                    <span className="text-xs text-gray-500">{approach.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bloom's Taxonomy Levels */}
                        <div>
                          <Label>Target Bloom&apos;s Taxonomy Levels</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {BLOOMS_LEVELS.map((level) => (
                              <div
                                key={level.value}
                                className={cn(
                                  "p-2 rounded-lg text-center cursor-pointer transition-all text-sm",
                                  preferences.bloomsLevels.includes(level.value)
                                    ? level.color
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                )}
                                onClick={() => {
                                  const levels = preferences.bloomsLevels.includes(level.value)
                                    ? preferences.bloomsLevels.filter(l => l !== level.value)
                                    : [...preferences.bloomsLevels, level.value];
                                  setPreferences({...preferences, bloomsLevels: levels});
                                }}
                              >
                                {level.label}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tone */}
                        <div>
                          <Label>Content Tone</Label>
                          <Select
                            value={preferences.tone}
                            onValueChange={(v) => setPreferences({...preferences, tone: v})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual & Friendly</SelectItem>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="conversational">Conversational</SelectItem>
                              <SelectItem value="motivational">Motivational</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>

                      <TabsContent value="advanced" className="space-y-6 mt-6">
                        {/* Language */}
                        <div>
                          <Label>Content Language</Label>
                          <Select
                            value={preferences.language}
                            onValueChange={(v) => setPreferences({...preferences, language: v})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="Spanish">Spanish</SelectItem>
                              <SelectItem value="French">French</SelectItem>
                              <SelectItem value="German">German</SelectItem>
                              <SelectItem value="Portuguese">Portuguese</SelectItem>
                              <SelectItem value="Chinese">Chinese (Simplified)</SelectItem>
                              <SelectItem value="Japanese">Japanese</SelectItem>
                              <SelectItem value="Korean">Korean</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Generation Mode */}
                        <div>
                          <Label>Generation Mode</Label>
                          <RadioGroup
                            value={preferences.generationMode}
                            onValueChange={(v) => setPreferences({...preferences, generationMode: v})}
                            className="mt-2 space-y-2"
                          >
                            <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <RadioGroupItem value="detailed" id="detailed" />
                              <Label htmlFor="detailed" className="flex-1 cursor-pointer">
                                <div>
                                  <p className="font-medium">Detailed Generation</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Complete content with examples and activities
                                  </p>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <RadioGroupItem value="outline" id="outline" />
                              <Label htmlFor="outline" className="flex-1 cursor-pointer">
                                <div>
                                  <p className="font-medium">Content Outline</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Structured outline for manual expansion
                                  </p>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <RadioGroupItem value="hybrid" id="hybrid" />
                              <Label htmlFor="hybrid" className="flex-1 cursor-pointer">
                                <div>
                                  <p className="font-medium">Hybrid Approach</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Mix of detailed content and outlines
                                  </p>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                )}

                {step === 2 && generatedContent && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Content Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Generated Chapter Content</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              <Globe className="w-3 h-3 mr-1" />
                              {generatedContent.metadata.language}
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {generatedContent.estimatedDuration}
                            </Badge>
                            <Badge className={getDifficultyColor(generatedContent.difficulty)}>
                              {generatedContent.difficulty}
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Chapter Description</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {generatedContent.description}
                          </p>
                        </div>

                        {/* Learning Outcomes */}
                        <div>
                          <h4 className="font-medium mb-2">Learning Outcomes</h4>
                          <ul className="space-y-1">
                            {generatedContent.learningOutcomes.map((outcome, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Quality Score */}
                        {generatedContent.qualityScore && (
                          <div>
                            <h4 className="font-medium mb-2">Content Quality Analysis</h4>
                            <div className="grid grid-cols-5 gap-3">
                              {Object.entries(generatedContent.qualityScore).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div className={cn("text-2xl font-bold", getQualityColor(value))}>
                                    {value}%
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                    {key}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Generated Sections */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                          Generated Sections ({generatedContent.sections.length})
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSections(generatedContent.sections.map(s => s.id))}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSections([])}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {generatedContent.sections.map((section, index) => {
                          const Icon = section.contentType === 'video' ? Video :
                                       section.contentType === 'assessment' ? CheckCircle2 :
                                       section.contentType === 'interactive' ? Activity :
                                       section.contentType === 'project' ? Code : FileText;
                          
                          return (
                            <motion.div
                              key={section.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                "border rounded-lg p-4 cursor-pointer transition-all",
                                selectedSections.includes(section.id)
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                              )}
                              onClick={() => handleSectionToggle(section.id)}
                            >
                              <div className="flex items-start gap-4">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  selectedSections.includes(section.id)
                                    ? "bg-purple-100 dark:bg-purple-900/50"
                                    : "bg-gray-100 dark:bg-gray-800"
                                )}>
                                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium">
                                        Section {index + 1}: {section.title}
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {section.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {section.estimatedDuration}
                                      </Badge>
                                      <Badge className={getDifficultyColor(section.difficulty)}>
                                        {section.difficulty}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Content Summary */}
                                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                                    <p className="text-sm">{section.content.summary}</p>
                                    
                                    {/* Key Points */}
                                    {section.content.keyPoints.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Key Points:
                                        </p>
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                                          {section.content.keyPoints.slice(0, 3).map((point, idx) => (
                                            <li key={idx}>• {point}</li>
                                          ))}
                                          {section.content.keyPoints.length > 3 && (
                                            <li className="text-gray-500">
                                              • +{section.content.keyPoints.length - 3} more...
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Content Features */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {section.content.activities && section.content.activities.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Activity className="w-3 h-3 mr-1" />
                                          {section.content.activities.length} Activities
                                        </Badge>
                                      )}
                                      {section.content.assessmentQuestions && section.content.assessmentQuestions.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          {section.content.assessmentQuestions.length} Questions
                                        </Badge>
                                      )}
                                      {section.content.resources && section.content.resources.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Globe className="w-3 h-3 mr-1" />
                                          {section.content.resources.length} Resources
                                        </Badge>
                                      )}
                                      {section.content.codeExamples && section.content.codeExamples.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Code className="w-3 h-3 mr-1" />
                                          {section.content.codeExamples.length} Code Examples
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* AI Insights */}
                                  {section.aiInsights && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                          AI Teaching Insights
                                        </p>
                                      </div>
                                      <div className="space-y-1 text-xs text-purple-600 dark:text-purple-400">
                                        <p>• Learning Path: {section.aiInsights.learningPath}</p>
                                        {section.aiInsights.teachingTips.length > 0 && (
                                          <p>• Teaching Tip: {section.aiInsights.teachingTips[0]}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Bloom's Level */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      Bloom&apos;s Level:
                                    </span>
                                    <Badge className={
                                      BLOOMS_LEVELS.find(l => l.value === section.bloomsLevel)?.color || ''
                                    }>
                                      {section.bloomsLevel}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  {step === 1 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure your preferences to generate tailored content
                    </p>
                  )}
                  {step === 2 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Selected {selectedSections.length} of {generatedContent?.sections.length || 0} sections
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {step === 2 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep(1);
                        setGeneratedContent(null);
                        setSelectedSections([]);
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Preferences
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>

                  {step === 1 && (
                    <Button
                      onClick={generateContent}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Content...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  )}

                  {step === 2 && (
                    <Button
                      onClick={handleApplyContent}
                      disabled={selectedSections.length === 0}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply Selected Sections
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="mt-4">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
                    SAM AI is generating your chapter content...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Demo content fallback
function getDemoContent(): GeneratedContent {
  return {
    title: "Introduction to React Hooks",
    description: "Learn the fundamentals of React Hooks and how to use them effectively in modern React applications.",
    learningOutcomes: [
      "Understand the purpose and benefits of React Hooks",
      "Master the useState and useEffect hooks",
      "Apply custom hooks to solve real-world problems",
      "Optimize component performance with useMemo and useCallback"
    ],
    estimatedDuration: "60 minutes",
    difficulty: "intermediate",
    sections: [
      {
        id: "section-1",
        title: "Understanding React Hooks",
        description: "Introduction to the concept of hooks and why they were introduced",
        contentType: "reading",
        estimatedDuration: "15 min",
        bloomsLevel: "understand",
        difficulty: "beginner",
        content: {
          summary: "React Hooks revolutionized how we write React components by allowing state and lifecycle features in functional components.",
          keyPoints: [
            "Hooks allow state in functional components",
            "They replace class component lifecycle methods",
            "Hooks follow specific rules for usage",
            "They promote code reusability"
          ],
          activities: [
            "Compare class components vs functional components with hooks",
            "Identify scenarios where hooks are beneficial"
          ],
          resources: [
            {
              title: "Official React Hooks Documentation",
              type: "article",
              url: "https://react.dev/reference/react",
              description: "Comprehensive guide to all React hooks"
            }
          ]
        },
        aiInsights: {
          learningPath: "Start with useState before moving to useEffect",
          prerequisites: ["Basic React knowledge", "JavaScript ES6"],
          outcomes: ["Understand hook motivation", "Know hook rules"],
          teachingTips: ["Use visual diagrams to explain component lifecycle"]
        }
      },
      {
        id: "section-2",
        title: "Working with useState",
        description: "Master the most fundamental hook for managing component state",
        contentType: "interactive",
        estimatedDuration: "20 min",
        bloomsLevel: "apply",
        difficulty: "intermediate",
        content: {
          summary: "useState is the most commonly used hook that allows you to add state to functional components.",
          keyPoints: [
            "useState returns a state value and setter function",
            "State updates are asynchronous",
            "Multiple state variables can be used",
            "State should be treated as immutable"
          ],
          activities: [
            "Build a counter component with useState",
            "Create a form with multiple state variables",
            "Implement a todo list with state management"
          ],
          codeExamples: [
            {
              title: "Basic useState Example",
              language: "javascript",
              code: "const [count, setCount] = useState(0);",
              explanation: "Declares a state variable 'count' with initial value 0"
            }
          ]
        }
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      model: "SAM-GPT-4",
      language: "English",
      targetAudience: "Intermediate React developers",
      pedagogicalApproach: "constructivist"
    },
    qualityScore: {
      completeness: 92,
      clarity: 88,
      engagement: 85,
      alignment: 90,
      overall: 89
    }
  };
}

// RadioGroup component import
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";