"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  blockId: z.string().min(1, {
    message: "Please select a code block",
  }),
  explanation: z.string().min(10, {
    message: "Explanation must be at least 10 characters",
  }).max(50000, {
    message: "Explanation must not exceed 50,000 characters",
  }),
});

interface CodeBlock {
  id: string;
  title: string;
  explanation: string | null;
  language: string;
}

interface AddExplanationFormProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  codeBlocks: CodeBlock[];
  onSuccess?: () => void;
}

export const AddExplanationForm = ({
  courseId,
  chapterId,
  sectionId,
  codeBlocks,
  onSuccess,
}: AddExplanationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<CodeBlock | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockId: "",
      explanation: "",
    },
  });

  const watchedBlockId = form.watch("blockId");

  useEffect(() => {
    if (watchedBlockId) {
      const block = codeBlocks.find(b => b.id === watchedBlockId);
      setSelectedBlock(block || null);

      // Pre-fill explanation if it exists
      if (block?.explanation) {
        form.setValue("explanation", block.explanation);
      } else {
        form.setValue("explanation", "");
      }
    }
  }, [watchedBlockId, codeBlocks, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const response = await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-blocks/${values.blockId}/explanation`,
        {
          explanation: values.explanation
        }
      );

      if (response.data.success) {
        toast.success("Explanation added successfully!");
        form.reset();
        setSelectedBlock(null);
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(response.data.error?.message || "Failed to add explanation");
      }
    } catch (error) {
      console.error("[ADD_EXPLANATION]", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const blocksWithoutExplanation = codeBlocks.filter(b => !b.explanation);
  const blocksWithExplanation = codeBlocks.filter(b => b.explanation);

  if (codeBlocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 text-amber-500" />
            <p className="font-medium">No code blocks available</p>
            <p className="text-sm mt-1">Add code blocks first before adding explanations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Add Explanation
        </CardTitle>
        <CardDescription>
          Add or update explanations for your code blocks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="blockId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Code Block</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a code block" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {blocksWithoutExplanation.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Without Explanation
                          </div>
                          {blocksWithoutExplanation.map((block) => (
                            <SelectItem key={block.id} value={block.id}>
                              <div className="flex items-center gap-2">
                                <span>{block.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {block.language}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {blocksWithExplanation.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            With Explanation (Update)
                          </div>
                          {blocksWithExplanation.map((block) => (
                            <SelectItem key={block.id} value={block.id}>
                              <div className="flex items-center gap-2">
                                <span>{block.title}</span>
                                <Badge variant="secondary" className="text-xs">
                                  Has explanation
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the code block you want to add or update an explanation for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedBlock && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Selected Block:</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedBlock.language}</Badge>
                  <span className="text-sm font-semibold">{selectedBlock.title}</span>
                  {selectedBlock.explanation && (
                    <Badge variant="secondary" className="text-xs">
                      Updating existing explanation
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="Explain what this code block does and why it's important..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Write a clear explanation that will help students understand this code block
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !watchedBlockId}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    {selectedBlock?.explanation ? "Update Explanation" : "Add Explanation"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedBlock(null);
                }}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
