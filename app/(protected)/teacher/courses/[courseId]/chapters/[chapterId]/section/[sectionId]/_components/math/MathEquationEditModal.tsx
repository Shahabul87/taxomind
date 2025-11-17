"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { X, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Editor } from "@/components/editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  mode: z.enum(["equation", "visual"]),
  latexEquation: z.string().optional(),
  imageUrl: z.string().optional(),
  content: z.string().optional(),
  explanation: z.string().optional(),
});

interface MathEquationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  chapterId: string;
  sectionId: string;
  equationId: string;
  initialData: {
    title: string;
    latexEquation: string | null;
    imageUrl: string | null;
    content: string | null;
    explanation: string | null;
  };
  onSuccess: () => void;
}

export const MathEquationEditModal = ({
  isOpen,
  onClose,
  courseId,
  chapterId,
  sectionId,
  equationId,
  initialData,
  onSuccess,
}: MathEquationEditModalProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [currentMode, setCurrentMode] = useState<"equation" | "visual">("equation");
  const [editorKey, setEditorKey] = useState(0);

  // Determine initial mode based on data
  const initialMode = initialData.imageUrl && !initialData.latexEquation ? "visual" : "equation";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      mode: initialMode,
      latexEquation: initialData.latexEquation || "",
      imageUrl: initialData.imageUrl || "",
      content: initialData.content || "",
      explanation: initialData.explanation || "",
    },
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      const mode = initialData.imageUrl && !initialData.latexEquation ? "visual" : "equation";
      setCurrentMode(mode);
      // Increment editorKey to force Editor remount and proper cleanup
      setEditorKey(prev => prev + 1);
      form.reset({
        title: initialData.title,
        mode: mode,
        latexEquation: initialData.latexEquation || "",
        imageUrl: initialData.imageUrl || "",
        content: initialData.content || "",
        explanation: initialData.explanation || "",
      });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true);

      // Prepare the payload based on mode
      const payload = {
        title: values.title,
        latexEquation: currentMode === "equation" ? (values.latexEquation || null) : null,
        imageUrl: currentMode === "visual" ? (values.imageUrl || null) : null,
        content: currentMode === "visual" ? (values.content || null) : null,
        explanation: values.explanation || null,
      };

      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations/${equationId}`,
        payload
      );

      toast.success("Math equation updated successfully!");

      // Close modal first to prevent DOM conflicts
      onClose();

      // Then trigger data refresh with proper timing
      onSuccess();
    } catch (error) {
      toast.error("Failed to update math equation");
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Math Equation</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equation Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Pythagorean Theorem"
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mode Selector */}
            <div className="space-y-2">
              <FormLabel>Equation Mode</FormLabel>
              <Tabs
                value={currentMode}
                onValueChange={(value) => {
                  setCurrentMode(value as "equation" | "visual");
                  form.setValue("mode", value as "equation" | "visual");
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="equation" disabled={isSaving}>
                    📐 LaTeX Equation
                  </TabsTrigger>
                  <TabsTrigger value="visual" disabled={isSaving}>
                    📷 Visual (Image)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="equation" className="space-y-4">
                  {/* LaTeX Equation */}
                  <FormField
                    control={form.control}
                    name="latexEquation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LaTeX Equation</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="e.g., a^2 + b^2 = c^2"
                            className="font-mono min-h-[120px] resize-y"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your equation in LaTeX format. Delimiters like $$, $, or \[ \] will be automatically removed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="visual" className="space-y-4">
                  {/* Image URL */}
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              {...field}
                              placeholder="https://example.com/equation-image.png"
                              disabled={isSaving}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={isSaving}
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Provide a URL to an equation image (Cloudinary, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Rich Content */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visual Content (Optional)</FormLabel>
                        <FormControl>
                          <div className="border rounded-md overflow-hidden">
                            <Editor
                              key={`content-editor-${editorKey}`}
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Add additional visual content or context..."
                              disabled={isSaving}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Explanation */}
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation (Optional)</FormLabel>
                  <FormControl>
                    <div className="border rounded-md overflow-hidden">
                      <Editor
                        key={`explanation-editor-${editorKey}`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Explain the equation, its meaning, and applications..."
                        disabled={isSaving}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
