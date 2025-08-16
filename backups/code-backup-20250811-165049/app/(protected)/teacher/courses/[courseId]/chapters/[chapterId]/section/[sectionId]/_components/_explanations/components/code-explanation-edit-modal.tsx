"use client";

import * as z from "zod";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Send, Loader2, X } from "lucide-react";
import { logger } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Import modular components
import { CodeFormHeader } from "../_CodeTabComponents/CodeFormHeader";
import { CodeBlockTabs } from "../_CodeTabComponents/CodeBlockTabs";
import { useCodeExplanationLocalStorage } from "../_CodeTabComponents/useCodeExplanationLocalStorage";
import { CodeBlock, generateId } from "../_CodeTabComponents/types";

interface CodeExplanationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  chapterId: string;
  sectionId: string;
  explanationId: string;
  initialData?: {
    heading: string | null;
    code: string | null;
    explanation: string | null;
    language?: string;
  };
  onSuccess?: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  code: z.string().min(1, {
    message: "Code is required",
  }),
  explanation: z.string().min(1, {
    message: "Explanation is required",
  })
    .transform((str) => str.trim()) // Remove extra whitespace
    .refine((str) => {
      // Check if content is not empty or just empty HTML tags
      const isEmpty = str === '' || 
                     str === '<p></p>' || 
                     str === '<p><br></p>' || 
                     str === '<p><br/></p>' ||
                     str.replace(/<[^>]*>/g, '').trim() === ''; // Remove all HTML tags and check if empty
      return !isEmpty;
    }, { 
      message: "Explanation is required"
    }),
});

export const CodeExplanationEditModal = ({
  isOpen,
  onClose,
  courseId,
  chapterId,
  sectionId,
  explanationId,
  initialData,
  onSuccess
}: CodeExplanationEditModalProps) => {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      code: "",
      explanation: "",
    },
  });

  // Use local storage to persist code blocks - single block now
  const [codeBlocks, setCodeBlocks] = useCodeExplanationLocalStorage<CodeBlock[]>(`code-edit-${explanationId}`, [
    { id: generateId(), code: '', explanation: '', language: 'typescript' }
  ]);
  
  const initializedRef = useRef(false);
  
  // Run after mount to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Initialize form with existing data when modal opens
  useEffect(() => {
    if (isOpen && initialData && !initializedRef.current) {
      const language = initialData.language || 'typescript';
      const heading = initialData.heading || '';
      const code = initialData.code || '';
      const explanation = initialData.explanation || '';
      
      setTitle(heading);
      setCodeBlocks([{ 
        id: generateId(), 
        code: code, 
        explanation: explanation, 
        language: language 
      }]);
      
      form.reset({
        title: heading,
        code: code,
        explanation: explanation,
      });
      
      initializedRef.current = true;
    }
  }, [isOpen, initialData, form, setCodeBlocks]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      setTitle("");
      setCodeBlocks([{ id: generateId(), code: '', explanation: '', language: 'typescript' }]);
      form.reset();
      setMode('edit');
    }
  }, [isOpen, form, setCodeBlocks]);

  const updateBlockCode = (id: string, code: string) => {
    setCodeBlocks(blocks => blocks.map(block => 
      block.id === id ? { ...block, code } : block
    ));
  };

  const updateBlockExplanation = (id: string, explanation: string) => {
    setCodeBlocks(blocks => blocks.map(block => 
      block.id === id ? { ...block, explanation } : block
    ));
  };

  const updateBlockLanguage = (id: string, language: string) => {
    setCodeBlocks(blocks => blocks.map(block => 
      block.id === id ? { ...block, language } : block
    ));
  };

  // Update form values based on code blocks and title
  useEffect(() => {
    const block = codeBlocks[0];
    if (block) {
      form.setValue('title', title, { shouldValidate: true });
      form.setValue('code', block.code, { shouldValidate: true });
      form.setValue('explanation', block.explanation, { shouldValidate: true });
      
      // Force validation
      form.trigger(['title', 'code', 'explanation']);
    }
  }, [codeBlocks, title, form]);

  // Check if form is valid
  const isFormValid = () => {
    const values = form.getValues();
    const hasTitle = values.title && values.title.trim().length > 0;
    const hasCode = values.code && values.code.trim().length > 0;
    const hasExplanation = values.explanation && 
                          values.explanation.trim().length > 0 && 
                          values.explanation !== '<p></p>' && 
                          values.explanation !== '<p><br></p>' &&
                          values.explanation.replace(/<[^>]*>/g, '').trim().length > 0;
    
    return hasTitle && hasCode && hasExplanation;
  };

  // Manual reset function for better UX
  const handleManualReset = () => {
    if (window.confirm('Are you sure you want to reset the form? All unsaved data will be lost.')) {
      const language = initialData?.language || 'typescript';
      const heading = initialData?.heading || '';
      const code = initialData?.code || '';
      const explanation = initialData?.explanation || '';
      
      setTitle(heading);
      setCodeBlocks([{ 
        id: generateId(), 
        code: code, 
        explanation: explanation, 
        language: language 
      }]);
      
      form.reset({
        title: heading,
        code: code,
        explanation: explanation,
      });
      
      toast.success("Form reset successfully!");
    }
  };

  // Form submission handler
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const block = codeBlocks[0];
      if (!block) return;
      
      // Create payload for update
      const payload = {
        heading: title,
        code: block.code,
        explanation: block.explanation,
        language: block.language,
        order: 0
      };

      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-explanations/${explanationId}`,
        payload
      );
      
      toast.success("Code explanation updated successfully!");
      
      // Clear localStorage for this edit session
      localStorage.removeItem(`code-edit-${explanationId}`);
      
      // Call success callback and close modal
      onSuccess?.();
      onClose();
      
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      logger.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Edit Code Explanation</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Modify the code block and explanation content
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-6">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20 rounded border border-gray-300 dark:border-gray-600 shadow-lg h-full flex flex-col">
            {/* Form Content */}
            <div className="p-6 flex-1 overflow-hidden">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <CodeBlockTabs
                      codeBlocks={codeBlocks}
                      activeBlockId={codeBlocks[0]?.id || ''}
                      setActiveBlockId={() => {}}
                      updateBlockCode={updateBlockCode}
                      updateBlockExplanation={updateBlockExplanation}
                      updateBlockLanguage={updateBlockLanguage}
                      addCodeBlock={() => {}}
                      removeCodeBlock={() => {}}
                      moveBlockUp={() => {}}
                      moveBlockDown={() => {}}
                      isSubmitting={isSubmitting}
                      title={title}
                      setTitle={setTitle}
                      onReset={handleManualReset}
                      mode={mode}
                      setMode={setMode}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-4 border-t border-gray-300 dark:border-gray-600 mt-4">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        size="sm"
                        className="h-10 px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !isFormValid()}
                        size="sm"
                        className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Update Code Explanation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 