"use client";

import * as z from "zod";
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

// Import modular components
import { CodeFormHeader } from "./_CodeTabComponents/CodeFormHeader";
import { CodeBlockTabs } from "./_CodeTabComponents/CodeBlockTabs";
import { useCodeExplanationLocalStorage } from "./_CodeTabComponents/useCodeExplanationLocalStorage";
import { CodeBlock, generateId } from "./_CodeTabComponents/types";

interface CodeExplanationFormProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: {
    codeExplanations?: {
      id: string;
      heading: string | null;
      code: string | null;
      explanation: string | null;
    }[];
  };
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

export const CodeExplanationForm = ({
  courseId,
  chapterId,
  sectionId,
  initialData = { codeExplanations: [] }
}: CodeExplanationFormProps) => {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const router = useRouter();
  
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
  const [codeBlocks, setCodeBlocks] = useCodeExplanationLocalStorage<CodeBlock[]>('code-explanation-code-blocks', [
    { id: generateId(), code: '', explanation: '', language: 'typescript' }
  ]);
  
  const initializedRef = useRef(false);
  
  // Run after mount to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Listen for reset event from parent form
  useEffect(() => {
    const handleReset = () => {
      setCodeBlocks([{ id: generateId(), code: '', explanation: '', language: 'typescript' }]);
      setTitle("");
      form.reset();
    };

    window.addEventListener('resetCodeExplanationForm', handleReset);
    return () => {
      window.removeEventListener('resetCodeExplanationForm', handleReset);
    };
  }, [form, setCodeBlocks]);

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
      setCodeBlocks([{ id: generateId(), code: '', explanation: '', language: 'typescript' }]);
      setTitle("");
      form.reset({
        title: "",
        code: "",
        explanation: "",
      });
      
      // Clear localStorage
      localStorage.removeItem('code-explanation-code-blocks');
      
      // Dispatch reset event
      window.dispatchEvent(new CustomEvent('resetCodeExplanationForm'));
      
      toast.success("Form reset successfully!");
    }
  };

  // Form submission handler
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const block = codeBlocks[0];
      if (!block) return;
      
      // Create payload with single code block
      const payload = {
        codeBlocks: [{
          title: title,
          code: block.code,
          explanation: block.explanation,
          language: block.language,
          order: 0
        }]
      };

      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-explanations`,
        payload
      );
      
      toast.success("Code explanation added successfully!");
      
      // Hold form data for a moment before reset for better UX
      setTimeout(() => {
        // Reset the form and clear localStorage
        form.reset({
          title: "",
          code: "",
          explanation: "",
        });
        
        setCodeBlocks([{ id: generateId(), code: '', explanation: '', language: 'typescript' }]);
        setTitle("");
        
        // Clear localStorage
        localStorage.removeItem('code-explanation-code-blocks');
        
        // Dispatch reset event
        window.dispatchEvent(new CustomEvent('resetCodeExplanationForm'));
        
        toast.info("Form reset for next entry");
        
        // Refresh the page to show the new explanation in the list
        router.refresh();
      }, 2000); // Hold for 2 seconds
      
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {hasMounted && (
        <div className="w-full h-full">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20 rounded border border-gray-300 dark:border-gray-600 shadow-lg h-full flex flex-col">
            <CodeFormHeader />
            
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
                    <Button
                      type="submit"
                      disabled={isSubmitting || !isFormValid()}
                      size="sm"
                      className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Create Code Explanation
                        </>
                      )}
                    </Button>
                    {/* Debug info - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="ml-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                        <div>Valid: {isFormValid().toString()}</div>
                        <div>Errors: {Object.keys(form.formState.errors).join(', ') || 'None'}</div>
                        <div>Title: &quot;{form.getValues().title}&quot; ({form.getValues().title?.length || 0})</div>
                        <div>Code: {form.getValues().code?.length || 0} chars</div>
                        <div>Explanation: {form.getValues().explanation?.length || 0} chars</div>
                        <div className="break-all">Expl content: &quot;{form.getValues().explanation?.substring(0, 50)}...&quot;</div>
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 