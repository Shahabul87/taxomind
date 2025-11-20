"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Code, FileText, X, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Editor } from "@/components/editor";

const PROGRAMMING_LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

const blockHeaderSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters"),
  language: z.string().min(1, "Please select a programming language"),
});

type BlockHeaderValues = z.infer<typeof blockHeaderSchema>;

interface EditorBlock {
  id: string;
  type: "code" | "explanation";
  content: string;
}

interface AddCodeExplanationFormProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  onSuccess?: () => void;
}

export const AddCodeExplanationForm = ({
  courseId,
  chapterId,
  sectionId,
  onSuccess,
}: AddCodeExplanationFormProps) => {
  const router = useRouter();
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<BlockHeaderValues>({
    resolver: zodResolver(blockHeaderSchema),
    defaultValues: {
      title: "",
      language: "typescript",
    },
  });

  // Add new editor block
  const handleAddBlock = useCallback((type: "code" | "explanation") => {
    const newBlock: EditorBlock = {
      id: `${type}-${Date.now()}`,
      type,
      content: "",
    };
    setBlocks((prev) => [...prev, newBlock]);
  }, []);

  // Update block content
  const handleUpdateBlock = useCallback((id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, content } : block
      )
    );
  }, []);

  // Remove a block
  const handleRemoveBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  }, []);

  // Clear all and reset
  const handleClearAll = useCallback(() => {
    setBlocks([]);
    form.reset();
    toast.success("Form cleared");
  }, [form]);

  // Save the complete code block section
  const handleSave = async (values: BlockHeaderValues) => {
    if (blocks.length === 0) {
      toast.error("Please add at least one code or explanation block");
      return;
    }

    // Check if all blocks have content
    const emptyBlocks = blocks.filter(b => !b.content.trim());
    if (emptyBlocks.length > 0) {
      toast.error("Please fill in all blocks or remove empty ones");
      return;
    }

    setIsSaving(true);

    try {
      // Combine all code blocks
      const codeContent = blocks
        .filter((block) => block.type === "code")
        .map((block) => block.content)
        .join("\n\n");

      // Combine all explanations
      const explanationContent = blocks
        .filter((block) => block.type === "explanation")
        .map((block) => block.content)
        .join("\n\n");

      if (!codeContent) {
        toast.error("Please add at least one code block");
        return;
      }

      const payload = {
        title: values.title,
        code: codeContent,
        explanation: explanationContent || null,
        language: values.language,
      };

      const response = await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-blocks`,
        { blocks: [payload] }
      );

      if (response.data.success) {
        toast.success("Code block saved successfully!");
        handleClearAll();
        router.refresh();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to save code block:", error);
      toast.error("Failed to save code block");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 md:space-y-6">
            {/* Title and Language - Two Column Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Block Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., User Authentication Function"
                        disabled={isSaving}
                        className="text-xs sm:text-sm h-9 sm:h-10"
                      />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Programming Language</FormLabel>
                    <Select
                      disabled={isSaving}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROGRAMMING_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value} className="text-xs sm:text-sm">
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
            </div>

            {/* Dynamic Editor Blocks */}
            <div className="space-y-4">
              <AnimatePresence>
                {blocks.map((block, index) => {
                  // Calculate the numbering based on type
                  const codeBlocksBefore = blocks
                    .slice(0, index)
                    .filter(b => b.type === "code").length;
                  const explanationBlocksBefore = blocks
                    .slice(0, index)
                    .filter(b => b.type === "explanation").length;

                  const blockNumber = block.type === "code"
                    ? codeBlocksBefore + 1
                    : explanationBlocksBefore + 1;

                  return (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative"
                    >
                      <div className="space-y-2">
                        {/* Editor Header with Clear Button */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                            {block.type === "code" ? (
                              <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            )}
                            <label className="text-xs sm:text-sm font-medium truncate">
                              {block.type === "code" ? "Code Editor" : "Explanation Editor"} #{blockNumber}
                            </label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBlock(block.id)}
                            disabled={isSaving}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>

                        {/* Editor - Code Textarea or Rich Text Editor */}
                        {block.type === "code" ? (
                          <Textarea
                            value={block.content}
                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                            placeholder="Enter your code here..."
                            className="text-xs sm:text-sm min-h-[100px] sm:min-h-[120px] md:min-h-[150px] resize-y font-mono"
                            disabled={isSaving}
                          />
                        ) : (
                          <div className="border rounded-md overflow-hidden">
                            <Editor
                              value={block.content}
                              onChange={(value) => handleUpdateBlock(block.id, value)}
                              placeholder="Enter your explanation here with rich formatting..."
                              disabled={isSaving}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Add Block Button */}
              <div className="flex justify-center pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      className="gap-1.5 sm:gap-2 border-dashed border-2 hover:border-solid h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Add Block
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-[200px] sm:w-auto">
                    <DropdownMenuItem onClick={() => handleAddBlock("code")} className="text-xs sm:text-sm">
                      <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-emerald-600" />
                      Add Code
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddBlock("explanation")} className="text-xs sm:text-sm">
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-blue-600" />
                      Add Explanation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Final Action Buttons - Responsive */}
            <div className="flex flex-col xs:flex-row justify-end items-stretch xs:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
              <Button
                type="submit"
                disabled={isSaving || blocks.length === 0}
                className="gap-1.5 sm:gap-2 w-full xs:w-auto touch-manipulation min-h-[44px] h-10 sm:h-11 px-4 sm:px-6 text-xs sm:text-sm"
              >
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{isSaving ? "Saving..." : "Save Code Block"}</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
