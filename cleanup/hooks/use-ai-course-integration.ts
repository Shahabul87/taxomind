"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

interface UseAICourseIntegrationProps {
  courseId: string;
}

export const useAICourseIntegration = ({ courseId }: UseAICourseIntegrationProps) => {
  const router = useRouter();
  const [isApplyingObjectives, setIsApplyingObjectives] = useState(false);
  const [isApplyingChapters, setIsApplyingChapters] = useState(false);

  const applyLearningObjectives = useCallback(async (objectives: string[]) => {
    setIsApplyingObjectives(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatYouWillLearn: objectives
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update learning objectives");
      }

      toast.success("Learning objectives updated successfully");
      router.refresh();
    } catch (error: any) {
      logger.error("Error updating learning objectives:", error);
      toast.error(error.message || "Failed to update learning objectives");
    } finally {
      setIsApplyingObjectives(false);
    }
  }, [courseId, router]);

  const applyChapterStructure = useCallback(async (chapters: any[]) => {
    setIsApplyingChapters(true);
    
    try {
      // Create chapters sequentially to maintain order
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        
        const chapterResponse = await fetch(`/api/courses/${courseId}/chapters`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: chapter.title,
            description: chapter.description,
            position: i + 1
          }),
        });

        if (!chapterResponse.ok) {
          throw new Error(`Failed to create chapter: ${chapter.title}`);
        }

        const chapterData = await chapterResponse.json();
        
        // Create sections for this chapter
        if (chapter.sections && chapter.sections.length > 0) {
          for (let j = 0; j < chapter.sections.length; j++) {
            const section = chapter.sections[j];
            
            await fetch(`/api/courses/${courseId}/chapters/${chapterData.id}/sections`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: section.title
              }),
            });
          }
        }
      }

      toast.success(`Successfully created ${chapters.length} chapters with sections`);
      router.refresh();
    } catch (error: any) {
      logger.error("Error creating chapters:", error);
      toast.error(error.message || "Failed to create chapter structure");
    } finally {
      setIsApplyingChapters(false);
    }
  }, [courseId, router]);

  const generateChapterContent = useCallback(async (chapterTitle: string, courseContext: string) => {
    try {
      const response = await fetch("/api/ai/chapter-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseContext,
          chapterTopic: chapterTitle,
          position: 1, // This would be dynamic based on actual position
          difficulty: "intermediate", // This would come from course data
          learningObjectives: [] // This would come from the course
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate chapter content");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      logger.error("Error generating chapter content:", error);
      toast.error(error.message || "Failed to generate chapter content");
      return null;
    }
  }, []);

  const curateSectionContent = useCallback(async (sectionTopic: string, learningObjectives: string[]) => {
    try {
      const response = await fetch("/api/ai/content-curator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionTopic,
          targetAudience: "Course students",
          difficulty: "intermediate",
          learningObjectives,
          contentTypes: ["video", "article", "exercise"],
          keywords: [],
          estimatedTime: "2 hours"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to curate section content");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      logger.error("Error curating section content:", error);
      toast.error(error.message || "Failed to curate section content");
      return null;
    }
  }, []);

  return {
    applyLearningObjectives,
    applyChapterStructure,
    generateChapterContent,
    curateSectionContent,
    isApplyingObjectives,
    isApplyingChapters
  };
};