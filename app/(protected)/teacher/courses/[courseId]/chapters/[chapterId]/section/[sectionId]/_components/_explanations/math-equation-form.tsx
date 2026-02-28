"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";
import { TipTapEditor } from "@/components/lazy-imports";
import { logger } from '@/lib/logger';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PlusCircle, XCircle, Loader2 } from "lucide-react";

// Import modular components
import { MathModeSelector } from "./_MathTabComponents/MathModeSelector";
import { LatexTips } from "./_MathTabComponents/LatexTips";
import { MathImageUpload } from "./_MathTabComponents/MathImageUpload";
import { MathPreview } from "./_MathTabComponents/MathPreview";
import QuickTemplateComponent, { Template } from "@/components/QuickTemplateComponent";
import LatexEnabledEditor from "@/components/LatexEnabledEditor";
import mathTemplates from "./_MathTabComponents/mathTemplatesData";

interface MathEquationFormProps {
  initialData: any;
  courseId: string;
  chapterId: string;
  sectionId: string;
  onEquationAdded?: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  equation: z.string().optional(),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
  content: z.string().optional(),
  mode: z.enum(["equation", "visual"]),
});

export const MathEquationForm = ({
  initialData = { mathExplanations: [] },
  courseId,
  chapterId,
  sectionId,
  onEquationAdded
}: MathEquationFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [editorMode, setEditorMode] = useState<"equation" | "visual">("equation");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      equation: "",
      explanation: "",
      imageUrl: "",
      content: "",
      mode: "equation",
    },
    mode: "onChange",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { watch, setValue } = form;
  const equation = watch("equation");
  const explanation = watch("explanation");
  const title = watch("title");
  const content = watch("content");
  const formImageUrl = watch("imageUrl");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      const currentMode = editorMode;
      const submitValues = { ...values, mode: currentMode };
      
      // Custom validation
      const validationErrors: string[] = [];
      
      if (!submitValues.title?.trim()) {
        validationErrors.push("Title is required");
      }
      
      if (currentMode === "equation") {
        if (!submitValues.equation?.trim()) {
          validationErrors.push("Equation is required in equation mode");
        }
        if (!submitValues.explanation?.trim()) {
          validationErrors.push("Explanation is required in equation mode");
        }
      } else if (currentMode === "visual") {
        const hasImage = submitValues.imageUrl?.trim();
        const hasContent = submitValues.content?.trim();
        if (!hasImage && !hasContent) {
          validationErrors.push("Either an image or content is required in visual mode");
        }
      }
      
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.join("; ");
        setSubmitError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      // Prepare payload
      let finalPayload;
      if (currentMode === "visual") {
        finalPayload = {
          title: submitValues.title,
          mode: "visual",
          imageUrl: submitValues.imageUrl || "",
          content: submitValues.content || "",
          explanation: submitValues.content || "",
          equation: "",
        };
      } else {
        finalPayload = {
          title: submitValues.title,
          mode: "equation",
          equation: submitValues.equation,
          explanation: submitValues.explanation,
          imageUrl: "",
          content: "",
        };
      }
      
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations`, 
        finalPayload
      );
      
      toast.success("Math equation added successfully");
      
      if (onEquationAdded) {
        onEquationAdded();
      }
      
      router.refresh();
      form.reset({
        title: "",
        equation: "",
        explanation: "",
        imageUrl: "",
        content: "",
        mode: "equation",
      });
      setEditorMode("equation");
      setActiveTab("edit");
    } catch (error: any) {
      logger.error("Math equation submission error:", error);
      
      let errorMessage = "Something went wrong";
      if (error.response?.data) {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEditorMode = (mode: "equation" | "visual") => {
    setEditorMode(mode);
    form.setValue("mode", mode, { shouldValidate: true });
    form.clearErrors();
    
    if (mode === "visual") {
      form.setValue("equation", "");
      form.setValue("explanation", "");
      toast.info("Visual mode: Add an image or rich text content");
    } else {
      form.setValue("imageUrl", "");
      form.setValue("content", "");
      toast.info("Equation mode: Write LaTeX equation and explanation");
    }
  };

  const applyTemplate = (template: Template) => {
    form.setValue("title", template.title);
    form.setValue("equation", template.equation);
    form.setValue("explanation", template.explanation);
    toast.success(`Applied template: ${template.title}`);
  };

  return (
    <div className="space-y-4">
      {submitError && (
        <div className="p-4 border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-900 dark:text-red-200 font-medium">Error: {submitError}</p>
          </div>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300 ml-6">
            Please try again or check your network connection.
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Mode Selector */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode:</span>
            <MathModeSelector
              editorMode={editorMode}
              onModeChange={toggleEditorMode}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <TabsTrigger
                value="edit"
                className="data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-700 data-[state=active]:text-white dark:data-[state=active]:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all duration-200"
              >
                Edit
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-700 data-[state=active]:text-white dark:data-[state=active]:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all duration-200"
              >
                Preview
              </TabsTrigger>
            </TabsList>
                    
            <TabsContent value="edit" className="space-y-4 mt-4">
              {/* Title field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title <span className="text-purple-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g., Quadratic Formula"
                        {...field}
                        className="bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-gray-200 focus:ring-purple-500/20 text-sm transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                  </FormItem>
                )}
              />

              {/* Conditional content based on mode */}
              {editorMode === "equation" ? (
                <div className="space-y-4">
                  {/* Equation Editor */}
                  <FormField
                    control={form.control}
                    name="equation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Equation (LaTeX) <span className="text-purple-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Textarea
                              disabled={isSubmitting}
                              placeholder="e.g., x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
                              {...field}
                              className="h-32 font-mono text-sm bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-gray-200 placeholder:text-gray-400 focus:ring-purple-500/20 resize-none"
                            />
                            <LatexTips />
                          </div>
                        </FormControl>
                        <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                      </FormItem>
                    )}
                  />

                  {/* LaTeX Enabled Explanation Editor */}
                  <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Explanation (Text + LaTeX) <span className="text-purple-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <LatexEnabledEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Explain the mathematical concept... Use $equation$ for inline LaTeX."
                            minHeight="200px"
                            maxHeight="300px"
                            showHelp={false}
                            disabled={isSubmitting}
                            showPreview={true}
                            className="border border-gray-200 dark:border-gray-700/50 rounded-lg bg-white dark:bg-gray-900"
                          />
                        </FormControl>
                        <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                      </FormItem>
                    )}
                  />

                  {/* Math Templates */}
                  <div className="w-full">
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        Quick Math Templates
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Click any template to quickly apply equation and explanation
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700/50">
                      <QuickTemplateComponent
                        templates={mathTemplates}
                        onApplyTemplate={applyTemplate}
                        showSearch={true}
                        showCategoryFilter={true}
                        maxHeight="200px"
                        title="Browse Templates"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <MathImageUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        courseId={courseId}
                        chapterId={chapterId}
                        sectionId={sectionId}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Explanation
                        </FormLabel>
                        <FormControl>
                          <div className="border rounded-lg border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/50">
                            <TipTapEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Write an explanation for your math concept..."
                              editorClassName="min-h-[200px]"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-rose-500 dark:text-rose-400 text-sm" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {!field.value && !formImageUrl &&
                            "Either provide rich text content or upload an image above."}
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/50 p-4 min-h-[200px] mt-4">
              <MathPreview
                title={title}
                editorMode={editorMode}
                equation={equation || ""}
                explanation={explanation || ""}
                content={content || ""}
                imageUrl={formImageUrl || ""}
                previewError={previewError}
              />
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                form.reset();
                setActiveTab("edit");
              }}
              disabled={isSubmitting}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Equation
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}; 