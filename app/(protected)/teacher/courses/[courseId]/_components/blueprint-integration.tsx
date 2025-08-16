"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logger } from '@/lib/logger';
import { 
  Bot, 
  Sparkles, 
  BookOpen, 
  Users, 
  Clock, 
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  Play,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CourseBlueprint {
  id: string;
  course: {
    title: string;
    description: string;
    subtitle?: string;
    difficulty: string;
    duration: string;
    targetAudience: string;
    goals: string[];
    includeAssessments: boolean;
  };
  chapters: {
    title: string;
    description: string;
    position: number;
    bloomsLevel: string;
    sections: {
      title: string;
      description: string;
      position: number;
      contentType: string;
      estimatedDuration: string;
      bloomsLevel: string;
    }[];
  }[];
  metadata: {
    bloomsFocus: string[];
    preferredContentTypes: string[];
    aiGenerated: boolean;
    generatedAt: string;
    generatedBy: string;
  };
}

interface BlueprintIntegrationProps {
  courseId: string;
  currentCourse: {
    title?: string;
    description?: string;
    chapters: any[];
  };
}

export const BlueprintIntegration = ({ courseId, currentCourse }: BlueprintIntegrationProps) => {
  const [blueprint, setBlueprint] = useState<CourseBlueprint | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Check if there's a blueprint for this course in sessionStorage
    const storedBlueprint = sessionStorage.getItem(`course_blueprint_${courseId}`);
    if (storedBlueprint) {
      try {
        const parsedBlueprint = JSON.parse(storedBlueprint);
        setBlueprint(parsedBlueprint);

      } catch (error: any) {
        logger.error('Error parsing blueprint:', error);
        sessionStorage.removeItem(`course_blueprint_${courseId}`);
      }
    }
  }, [courseId]);

  const generateChaptersFromBlueprint = async () => {
    if (!blueprint) return;

    setIsGenerating(true);
    try {

      // Create chapters sequentially to maintain order
      for (const chapter of blueprint.chapters) {

        const chapterResponse = await fetch(`/api/courses/${courseId}/chapters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: chapter.title,
            description: chapter.description,
            position: chapter.position,
            bloomsLevel: chapter.bloomsLevel,
          }),
        });

        if (!chapterResponse.ok) {
          throw new Error(`Failed to create chapter: ${chapter.title}`);
        }

        const createdChapter = await chapterResponse.json();

        // Create sections for this chapter
        for (const section of chapter.sections) {

          const sectionResponse = await fetch(`/api/courses/${courseId}/chapters/${createdChapter.id}/sections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: section.title,
              description: section.description,
              position: section.position,
              contentType: section.contentType,
              estimatedDuration: section.estimatedDuration,
              bloomsLevel: section.bloomsLevel,
            }),
          });

          if (!sectionResponse.ok) {
            logger.warn(`Failed to create section: ${section.title}`);
            // Continue with other sections even if one fails
          } else {
            const createdSection = await sectionResponse.json();

          }
        }
      }

      // Update course with additional blueprint data
      const courseUpdateResponse = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtitle: blueprint.course.subtitle,
          whatYouWillLearn: blueprint.course.goals,
          targetAudience: blueprint.course.targetAudience,
          difficulty: blueprint.course.difficulty,
        }),
      });

      if (!courseUpdateResponse.ok) {
        logger.warn('Failed to update course with blueprint data');
      }

      toast.success("Course structure generated successfully!");
      
      // Clean up blueprint from storage
      sessionStorage.removeItem(`course_blueprint_${courseId}`);
      
      // Refresh the page to show the new structure
      window.location.reload();
      
    } catch (error: any) {
      logger.error('Error generating chapters from blueprint:', error);
      toast.error(`Failed to generate course structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const dismissBlueprint = () => {
    sessionStorage.removeItem(`course_blueprint_${courseId}`);
    setBlueprint(null);
    toast.success("Blueprint dismissed");
  };

  if (!blueprint) {
    return null;
  }

  const hasContent = currentCourse.chapters.length > 0;

  return (
    <Card className="mb-6 border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-Generated Course Blueprint Ready
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Sam has created a complete course structure based on your requirements
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            AI Generated
          </Badge>
        </div>

        {/* Blueprint Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/60 dark:bg-gray-800/40 rounded-lg p-3 border border-purple-200/50 dark:border-purple-700/30">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Chapters</span>
            </div>
            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {blueprint.chapters.length}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {blueprint.chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} total sections
            </p>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/40 rounded-lg p-3 border border-purple-200/50 dark:border-purple-700/30">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Difficulty</span>
            </div>
            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {blueprint.course.difficulty}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {blueprint.course.duration}
            </p>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/40 rounded-lg p-3 border border-purple-200/50 dark:border-purple-700/30">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Bloom&apos;s Focus</span>
            </div>
            <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
              {blueprint.metadata.bloomsFocus.join(', ')}
            </p>
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
          >
            <FileText className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Preview'} Course Structure
            <ArrowRight className={cn("h-4 w-4 ml-2 transition-transform", showPreview && "rotate-90")} />
          </Button>
        </div>

        {/* Structure Preview */}
        {showPreview && (
          <div className="mb-4 bg-white/80 dark:bg-gray-800/60 rounded-lg border border-purple-200/50 dark:border-purple-700/30 p-4 max-h-64 overflow-y-auto">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-3">Course Structure Preview:</h4>
            <div className="space-y-2">
              {blueprint.chapters.map((chapter, index) => (
                <div key={index} className="border-l-2 border-purple-300 dark:border-purple-600 pl-3">
                  <h5 className="font-medium text-sm text-purple-800 dark:text-purple-200">
                    {chapter.title}
                  </h5>
                  <div className="ml-4 mt-1 space-y-1">
                    {chapter.sections.map((section, sIndex) => (
                      <p key={sIndex} className="text-xs text-purple-600 dark:text-purple-400">
                        • {section.title} ({section.contentType})
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning if course has content */}
        {hasContent && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Course Already Has Content
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Generating from blueprint will add new chapters alongside existing ones. 
                  Review the structure after generation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={generateChaptersFromBlueprint}
            disabled={isGenerating}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Course Structure...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Course Structure
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={dismissBlueprint}
            disabled={isGenerating}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30"
          >
            Dismiss Blueprint
          </Button>
        </div>

        {/* Generation Info */}
        <div className="mt-4 p-3 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">What happens next:</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-purple-600 dark:text-purple-400">
            <li>• Creates {blueprint.chapters.length} chapters with {blueprint.chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} sections</li>
            <li>• Pre-populates learning objectives from your blueprint</li>
            <li>• Sets up content structure based on Bloom&apos;s taxonomy</li>
            <li>• You can edit and customize everything after generation</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};