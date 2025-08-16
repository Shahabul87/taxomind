"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { logger } from '@/lib/logger';
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
  ArrowRight,
  FileText,
  Video,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChapterData {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  sections: any[];
}

interface GeneratedContent {
  title: string;
  description: string;
  learningOutcomes: string[];
  sections: {
    title: string;
    description: string;
    contentType: 'video' | 'reading' | 'interactive' | 'assessment' | 'project';
    estimatedDuration: string;
    bloomsLevel: string;
    content: {
      summary: string;
      keyPoints: string[];
      activities?: string[];
      assessmentQuestions?: string[];
    };
  }[];
}

interface AIChapterContentGeneratorProps {
  open: boolean;
  onClose: () => void;
  chapter: ChapterData;
  onContentGenerated?: (content: GeneratedContent) => void;
}

const CONTENT_TYPES = [
  { value: 'comprehensive', label: 'Comprehensive Content', description: 'Generate all content types for complete learning' },
  { value: 'video-focused', label: 'Video-Focused', description: 'Primarily video content with supporting materials' },
  { value: 'text-heavy', label: 'Reading-Heavy', description: 'Rich text content with interactive elements' },
  { value: 'assessment-rich', label: 'Assessment-Rich', description: 'Multiple quizzes and practical exercises' },
  { value: 'project-based', label: 'Project-Based', description: 'Hands-on projects and case studies' }
];

const GENERATION_MODES = [
  { value: 'detailed', label: 'Detailed Generation', description: 'Comprehensive content with examples and activities' },
  { value: 'outline', label: 'Content Outline', description: 'Structured outline for you to expand upon' },
  { value: 'hybrid', label: 'Hybrid Approach', description: 'Mix of detailed content and outlines' }
];

export const AIChapterContentGenerator = ({ 
  open, 
  onClose, 
  chapter,
  onContentGenerated 
}: AIChapterContentGeneratorProps) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    contentType: 'comprehensive',
    generationMode: 'detailed',
    sectionCount: 4,
    focusAreas: '',
    targetAudience: '',
    difficultyLevel: 'intermediate'
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const generateChapterContent = async () => {
    setIsGenerating(true);
    try {

      const response = await fetch('/api/courses/generate-chapter-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: chapter.id,
          courseId: chapter.courseId,
          chapterTitle: chapter.title,
          chapterDescription: chapter.description,
          preferences,
          existingSections: chapter.sections
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to generate content: ${errorData}`);
      }

      const content = await response.json();

      setGeneratedContent(content);
      setSelectedContent(content.sections.map((_: any, index: number) => index.toString()));
      setStep(2);
      
      toast.success("Chapter content generated successfully!");
    } catch (error: any) {
      logger.error('Error generating chapter content:', error);
      toast.error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedContent = async () => {
    if (!generatedContent) return;

    setIsGenerating(true);
    try {

      // Update chapter details
      const chapterUpdateResponse = await fetch(`/api/courses/${chapter.courseId}/chapters/${chapter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: generatedContent.title,
          description: generatedContent.description,
          learningOutcomes: generatedContent.learningOutcomes,
        }),
      });

      if (!chapterUpdateResponse.ok) {
        throw new Error('Failed to update chapter');
      }

      // Create selected sections
      for (const indexStr of selectedContent) {
        const index = parseInt(indexStr);
        const section = generatedContent.sections[index];

        const sectionResponse = await fetch(`/api/courses/${chapter.courseId}/chapters/${chapter.id}/sections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: section.title,
            description: section.description,
            contentType: section.contentType,
            estimatedDuration: section.estimatedDuration,
            bloomsLevel: section.bloomsLevel,
            generatedContent: section.content,
          }),
        });

        if (!sectionResponse.ok) {
          logger.warn(`Failed to create section: ${section.title}`);
        }
      }

      toast.success("Content applied successfully!");
      onContentGenerated?.(generatedContent);
      onClose();
      
      // Refresh the page to show new content
      window.location.reload();
      
    } catch (error: any) {
      logger.error('Error applying content:', error);
      toast.error(`Failed to apply content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSectionSelection = (index: string) => {
    setSelectedContent(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-xl font-semibold">AI Chapter Content Generator</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                Generate comprehensive content for &quot;{chapter.title}&quot;
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                stepNumber === step 
                  ? "bg-blue-600 text-white" 
                  : stepNumber < step 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}>
                {stepNumber < step ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < 3 && (
                <div className={cn(
                  "w-12 h-0.5 mx-2 transition-colors",
                  stepNumber < step ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Configure Content Generation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Customize how AI generates content for your chapter
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Content Type Focus</Label>
                    <Select 
                      value={preferences.contentType} 
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, contentType: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Generation Mode</Label>
                    <Select 
                      value={preferences.generationMode} 
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, generationMode: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENERATION_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            <div>
                              <div className="font-medium">{mode.label}</div>
                              <div className="text-xs text-gray-500">{mode.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Number of Sections</Label>
                    <Select 
                      value={preferences.sectionCount.toString()} 
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, sectionCount: parseInt(value) }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} sections
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Target Audience (Optional)</Label>
                    <Textarea
                      placeholder="e.g., Beginner web developers, Marketing professionals, Students with basic programming knowledge..."
                      value={preferences.targetAudience}
                      onChange={(e) => setPreferences(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="mt-1 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label>Specific Focus Areas (Optional)</Label>
                    <Textarea
                      placeholder="e.g., Practical examples, Case studies, Real-world applications, Hands-on exercises..."
                      value={preferences.focusAreas}
                      onChange={(e) => setPreferences(prev => ({ ...prev, focusAreas: e.target.value }))}
                      className="mt-1 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label>Difficulty Level</Label>
                    <Select 
                      value={preferences.difficultyLevel} 
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, difficultyLevel: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium">Content Preview</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  AI will generate <strong>{preferences.sectionCount} sections</strong> with{' '}
                  <strong>{preferences.contentType.replace('-', ' ')}</strong> focus in{' '}
                  <strong>{preferences.generationMode}</strong> mode for{' '}
                  <strong>{preferences.difficultyLevel}</strong> level learners.
                </p>
              </div>
            </div>
          )}

          {step === 2 && generatedContent && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Review Generated Content
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select the sections you want to add to your chapter
                </p>
              </div>

              {/* Chapter Updates */}
              <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-700">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-3">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Chapter Enhancements</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div><strong>Enhanced Title:</strong> {generatedContent.title}</div>
                  <div><strong>Description:</strong> {generatedContent.description}</div>
                  <div><strong>Learning Outcomes:</strong> {generatedContent.learningOutcomes.join(', ')}</div>
                </div>
              </Card>

              {/* Generated Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Generated Sections ({generatedContent.sections.length})</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedContent(generatedContent.sections.map((_, i) => i.toString()))}
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedContent([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {generatedContent.sections.map((section, index) => (
                    <Card 
                      key={index}
                      className={cn(
                        "p-4 cursor-pointer transition-all",
                        selectedContent.includes(index.toString())
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "hover:border-gray-300"
                      )}
                      onClick={() => toggleSectionSelection(index.toString())}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                          selectedContent.includes(index.toString())
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        )}>
                          {selectedContent.includes(index.toString()) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium">{section.title}</h5>
                            <Badge variant="secondary" className="text-xs">
                              {section.contentType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {section.bloomsLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {section.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {section.estimatedDuration}
                            </span>
                            <span>
                              {section.content.keyPoints.length} key points
                            </span>
                            {section.content.activities && (
                              <span>
                                {section.content.activities.length} activities
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Content Applied Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your chapter has been enhanced with AI-generated content
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Chapter Enhanced Successfully!
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {selectedContent.length} sections have been added to your chapter with comprehensive content.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="ghost"
            onClick={step === 1 ? onClose : handleBack}
            className="flex items-center gap-2"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step === 1 && (
            <Button
              onClick={generateChapterContent}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={applyGeneratedContent}
              disabled={selectedContent.length === 0 || isGenerating}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying Content...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Apply Selected Content ({selectedContent.length})
                </>
              )}
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};