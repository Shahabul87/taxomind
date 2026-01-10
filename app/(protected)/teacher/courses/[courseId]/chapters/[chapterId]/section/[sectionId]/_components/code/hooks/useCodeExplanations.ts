"use client";

import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import type {
  CodeExplanationGroup,
  LineExplanation,
  CreateCodeBlockFormData,
  AddExplanationFormData,
  UpdateExplanationFormData,
  UseCodeExplanationsReturn,
  CodeExplanationRecord,
} from "../code-explanation.types";

interface UseCodeExplanationsOptions {
  courseId: string;
  chapterId: string;
  sectionId: string;
}

/**
 * Hook for managing code explanations with CRUD operations
 */
export function useCodeExplanations({
  courseId,
  chapterId,
  sectionId,
}: UseCodeExplanationsOptions): UseCodeExplanationsReturn {
  const [codeBlocks, setCodeBlocks] = useState<CodeExplanationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to prevent stale closures
  const isLoadingRef = useRef(false);

  const baseUrl = `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-explanations`;

  /**
   * Transform raw database records into grouped structure
   */
  const transformToGroups = useCallback(
    (records: CodeExplanationRecord[]): CodeExplanationGroup[] => {
      // Separate main blocks (no groupId, no lineStart) from explanations (have groupId or lineStart)
      const mainBlocks = records.filter(
        (r) => r.groupId === null && r.lineStart === null
      );
      const explanations = records.filter(
        (r) => r.groupId !== null || r.lineStart !== null
      );

      return mainBlocks.map((block) => ({
        id: block.id,
        title: block.title,
        code: block.code,
        language: block.language as CodeExplanationGroup["language"],
        sectionId: block.sectionId,
        isPublished: block.isPublished,
        createdAt:
          typeof block.createdAt === "string"
            ? block.createdAt
            : block.createdAt.toISOString(),
        updatedAt:
          typeof block.updatedAt === "string"
            ? block.updatedAt
            : block.updatedAt.toISOString(),
        explanations: explanations
          .filter((exp) => exp.groupId === block.id)
          .map((exp) => ({
            id: exp.id,
            title: exp.title,
            explanation: exp.explanation || "",
            lineStart: exp.lineStart || 1,
            lineEnd: exp.lineEnd || 1,
            position: exp.position,
          }))
          .sort((a, b) => a.position - b.position),
      }));
    },
    []
  );

  /**
   * Fetch all code blocks with their explanations
   */
  const refetch = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get<CodeExplanationRecord[]>(baseUrl);
      const groups = transformToGroups(response.data);
      setCodeBlocks(groups);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch code blocks");
      setError(error);
      toast.error("Failed to load code explanations");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [baseUrl, transformToGroups]);

  /**
   * Create a new code block with optional explanations
   */
  const createCodeBlock = useCallback(
    async (data: CreateCodeBlockFormData): Promise<CodeExplanationGroup> => {
      try {
        // First, create the main code block
        const mainBlockResponse = await axios.post(baseUrl, {
          codeBlocks: [
            {
              title: data.title,
              code: data.code,
              language: data.language,
              explanation: "", // Main block has no explanation
            },
          ],
        });

        const mainBlock = mainBlockResponse.data[0];

        // If there are explanations, create them linked to the main block
        if (data.explanations && data.explanations.length > 0) {
          await Promise.all(
            data.explanations.map((exp, index) =>
              axios.post(baseUrl, {
                codeBlocks: [
                  {
                    title: exp.title,
                    code: "", // Explanation records don't store code
                    explanation: exp.explanation,
                    language: data.language,
                    lineStart: exp.lineStart,
                    lineEnd: exp.lineEnd,
                    groupId: mainBlock.id,
                    position: index,
                  },
                ],
              })
            )
          );
        }

        toast.success("Code block created successfully");
        await refetch();

        return codeBlocks.find((b) => b.id === mainBlock.id) || mainBlock;
      } catch (err) {
        toast.error("Failed to create code block");
        throw err;
      }
    },
    [baseUrl, refetch, codeBlocks]
  );

  /**
   * Add an explanation to an existing code block
   */
  const addExplanation = useCallback(
    async (
      codeBlockId: string,
      data: AddExplanationFormData
    ): Promise<LineExplanation> => {
      try {
        // Find the code block to get its language
        const codeBlock = codeBlocks.find((b) => b.id === codeBlockId);
        const nextPosition = codeBlock
          ? (codeBlock.explanations || []).length
          : 0;

        const response = await axios.post(baseUrl, {
          codeBlocks: [
            {
              title: data.title,
              code: "", // Explanation records don't store code
              explanation: data.explanation,
              language: codeBlock?.language || "typescript",
              lineStart: data.lineStart,
              lineEnd: data.lineEnd,
              groupId: codeBlockId,
              position: nextPosition,
            },
          ],
        });

        toast.success("Explanation added successfully");
        await refetch();

        return {
          id: response.data[0].id,
          title: data.title,
          explanation: data.explanation,
          lineStart: data.lineStart,
          lineEnd: data.lineEnd,
          position: nextPosition,
        };
      } catch (err) {
        toast.error("Failed to add explanation");
        throw err;
      }
    },
    [baseUrl, codeBlocks, refetch]
  );

  /**
   * Update an existing explanation
   */
  const updateExplanation = useCallback(
    async (
      explanationId: string,
      data: UpdateExplanationFormData
    ): Promise<LineExplanation> => {
      try {
        const response = await axios.patch(
          `${baseUrl}/${explanationId}`,
          data
        );

        toast.success("Explanation updated successfully");
        await refetch();

        return response.data;
      } catch (err) {
        toast.error("Failed to update explanation");
        throw err;
      }
    },
    [baseUrl, refetch]
  );

  /**
   * Delete an explanation
   */
  const deleteExplanation = useCallback(
    async (explanationId: string): Promise<void> => {
      try {
        await axios.delete(`${baseUrl}/${explanationId}`);
        toast.success("Explanation deleted successfully");
        await refetch();
      } catch (err) {
        toast.error("Failed to delete explanation");
        throw err;
      }
    },
    [baseUrl, refetch]
  );

  /**
   * Delete a code block and all its explanations
   */
  const deleteCodeBlock = useCallback(
    async (codeBlockId: string): Promise<void> => {
      try {
        // Find all explanations for this block
        const block = codeBlocks.find((b) => b.id === codeBlockId);
        if (block && block.explanations && block.explanations.length > 0) {
          // Delete all explanations first
          await Promise.all(
            block.explanations.map((exp) =>
              axios.delete(`${baseUrl}/${exp.id}`)
            )
          );
        }

        // Delete the main block
        await axios.delete(`${baseUrl}/${codeBlockId}`);

        toast.success("Code block deleted successfully");
        await refetch();
      } catch (err) {
        toast.error("Failed to delete code block");
        throw err;
      }
    },
    [baseUrl, codeBlocks, refetch]
  );

  /**
   * Update a code block (title, code, language)
   */
  const updateCodeBlock = useCallback(
    async (
      codeBlockId: string,
      data: Partial<CreateCodeBlockFormData>
    ): Promise<CodeExplanationGroup> => {
      try {
        const response = await axios.patch(`${baseUrl}/${codeBlockId}`, {
          title: data.title,
          code: data.code,
          language: data.language,
        });

        toast.success("Code block updated successfully");
        await refetch();

        return response.data;
      } catch (err) {
        toast.error("Failed to update code block");
        throw err;
      }
    },
    [baseUrl, refetch]
  );

  return {
    codeBlocks,
    isLoading,
    error,
    refetch,
    createCodeBlock,
    addExplanation,
    updateExplanation,
    deleteExplanation,
    deleteCodeBlock,
    updateCodeBlock,
  };
}
