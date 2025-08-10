"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";
import TipTapEditor from "@/components/tiptap/editor";
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
import { PlusCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-72 h-72 bg-gold-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl"></div>
      
      {submitError && (
        <div className="mb-6 p-4 border border-red-400/50 bg-red-500/20 rounded-lg">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-300 mr-2" />
            <p className="text-red-200 font-medium">Error: {submitError}</p>
          </div>
          <p className="mt-2 text-sm text-red-300">
            Please try again or check your network connection.
          </p>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6">
              <Card className="border border-amber-400/30 shadow-lg bg-slate-800/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-amber-400/20 to-yellow-400/20 rounded-t-lg border-b border-amber-400/30">
                  <CardTitle className="text-xl text-white font-bold">
                    Create Math Equation
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Add mathematical equations with LaTeX syntax or use visual editor
                  </CardDescription>
                  
                  <MathModeSelector 
                    editorMode={editorMode} 
                    onModeChange={toggleEditorMode} 
                  />
                </CardHeader>
                
                <CardContent className="pt-6 bg-slate-800/30">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 mb-4 w-full bg-slate-700/50">
                      <TabsTrigger value="edit" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-gold-300 data-[state=active]:border data-[state=active]:border-gold-400/50 text-gray-200 font-medium">
                        Edit
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-gold-300 data-[state=active]:border data-[state=active]:border-gold-400/50 text-gray-200 font-medium">
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="edit" className="space-y-4">
                      {/* Title field */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-gray-200">
                              Title
                            </FormLabel>
                            <FormControl>
                              <Input
                                disabled={isSubmitting}
                                placeholder="e.g., 'Quadratic Formula'"
                                {...field}
                                className="border-amber-400/50 bg-slate-700/30 text-white placeholder:text-gray-400 focus-visible:ring-amber-400/50"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      {/* Conditional content based on mode */}
                      {editorMode === "equation" ? (
                        <div className="space-y-6">
                          {/* Top Row - Equation and Explanation Side by Side */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Equation Editor */}
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="equation"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-semibold text-gray-200">
                                      Equation (LaTeX)
                                    </FormLabel>
                                    <FormControl>
                                      <div className="space-y-3">
                                        <Textarea
                                          disabled={isSubmitting}
                                          placeholder="e.g., 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'"
                                          {...field}
                                          className="h-[320px] font-mono text-sm border-amber-400/50 bg-slate-700/30 text-white placeholder:text-gray-400 focus-visible:ring-amber-400/50 resize-none"
                                        />
                                        <LatexTips />
                                      </div>
                                    </FormControl>
                                    <FormMessage className="text-red-300" />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Right Column - LaTeX Enabled Explanation Editor */}
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="explanation"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-semibold text-gray-200">
                                      Explanation (Text + LaTeX)
                                    </FormLabel>
                                    <FormControl>
                                      <LatexEnabledEditor
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        placeholder="Explain the mathematical concept... Use $equation$ for inline LaTeX."
                                        minHeight="320px"
                                        maxHeight="400px"
                                        showHelp={false}
                                        disabled={isSubmitting}
                                        showPreview={true}
                                        theme="dark"
                                        className="h-[400px]"
                                      />
                                    </FormControl>
                                    <FormMessage className="text-red-300" />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Bottom Row - Math Templates (Full Width) */}
                          <div className="w-full">
                            <div className="mb-3">
                              <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                                <span className="text-amber-400">📚</span>
                                Quick Math Templates
                              </h3>
                              <p className="text-sm text-gray-400 mt-1">
                                Click any template to quickly apply equation and explanation
                              </p>
                            </div>
                            <QuickTemplateComponent
                              templates={mathTemplates}
                              onApplyTemplate={applyTemplate}
                              showSearch={true}
                              showCategoryFilter={true}
                              maxHeight="320px"
                              title="Browse Templates"
                              theme="dark"
                              className="w-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            </div>

                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-semibold text-gray-200">
                                      Explanation
                                    </FormLabel>
                                    <FormControl>
                                      <div className="border rounded-md border-amber-400/50 bg-slate-700/20">
                                        <TipTapEditor
                                          value={field.value || ""}
                                          onChange={field.onChange}
                                          placeholder="Write an explanation for your math concept..."
                                          editorClassName="text-white min-h-[320px]"
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage className="text-red-300" />
                                    <p className="text-xs text-gray-400 mt-1">
                                      {!field.value && !formImageUrl && 
                                        "Either provide rich text content or upload an image above."}
                                    </p>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="preview" className="bg-slate-800/40 rounded-lg border border-amber-400/30 p-6 min-h-[20rem]">
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
                </CardContent>
                
                <CardFooter className="bg-gradient-to-r from-amber-400/20 to-yellow-400/20 rounded-b-lg border-t border-amber-400/30 flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      form.reset();
                      setActiveTab("edit");
                    }}
                    disabled={isSubmitting}
                    className="text-gray-200 hover:text-slate-900 hover:bg-amber-400/30"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Equation
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}; 