"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { DisplayExplanations } from "../_components/_explanations/components/display-explanations";
import { CodeExplanationEditModal } from "../_components/_explanations/components/code-explanation-edit-modal";
import { logger } from '@/lib/logger';

interface ExplanationActionsProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  codeExplanations: {
    id: string;
    heading: string | null;
    code: string | null;
    explanation: string | null;
    language?: string;
  }[];
}

export const ExplanationActions = ({
  courseId,
  chapterId,
  sectionId,
  codeExplanations
}: ExplanationActionsProps) => {
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExplanation, setEditingExplanation] = useState<{
    id: string;
    heading: string | null;
    code: string | null;
    explanation: string | null;
    language?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onCreate = () => {
    router.push(`/teacher/courses/${courseId}/chapters/${chapterId}/section/${sectionId}/code-explanations/create`);
  };

  const onEdit = async (id: string) => {
    try {
      setIsLoading(true);
      
      const apiEndpoint = `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-explanations/${id}`;
      
      const response = await axios.get(apiEndpoint);
      
      const explanationData = response.data;
      
      setEditingExplanation(explanationData);
      setEditModalOpen(true);
      
    } catch (error: any) {
      logger.error("Error fetching explanation:", error);
      toast.error(`Failed to load explanation data: ${error.response?.status || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      const deleteEndpoint = `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-explanations/${id}`;
      
      await axios.delete(deleteEndpoint);
      router.refresh();
    } catch (error) {
      logger.error("Delete error:", error);
      throw error;
    }
  };

  const handleEditSuccess = () => {
    router.refresh(); // Refresh to show updated data
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setEditingExplanation(null);
  };

  return (
    <>
      <DisplayExplanations 
        items={codeExplanations}
        onCreateClick={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      
      {/* Edit Modal */}
      {editingExplanation && (
        <CodeExplanationEditModal
          isOpen={editModalOpen}
          onClose={handleCloseModal}
          courseId={courseId}
          chapterId={chapterId}
          sectionId={sectionId}
          explanationId={editingExplanation.id}
          initialData={{
            heading: editingExplanation.heading,
            code: editingExplanation.code,
            explanation: editingExplanation.explanation,
            language: editingExplanation.language || 'typescript',
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}; 