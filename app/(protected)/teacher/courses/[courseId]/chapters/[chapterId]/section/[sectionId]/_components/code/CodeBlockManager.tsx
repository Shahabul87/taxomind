"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Code, Loader2, AlertCircle } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedCodeView } from "./UnifiedCodeView";
import { AddCodeBlockForm } from "./AddCodeBlockForm";
import { AddExplanationForm } from "./AddExplanationForm";

interface CodeBlock {
  id: string;
  title: string;
  code: string;
  explanation: string | null;
  language: string;
  position: number;
  lineStart: number | null;
  lineEnd: number | null;
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CodeBlockManagerProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const CodeBlockManager = ({
  courseId,
  chapterId,
  sectionId,
}: CodeBlockManagerProps) => {
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCodeBlocks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-blocks`
      );

      if (response.data.success) {
        setCodeBlocks(response.data.data || []);
      } else {
        setError(response.data.error?.message || "Failed to load code blocks");
      }
    } catch (err) {
      console.error("[FETCH_CODE_BLOCKS]", err);
      setError("Failed to load code blocks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId, sectionId]);

  useEffect(() => {
    fetchCodeBlocks();
  }, [fetchCodeBlocks]);

  const handleSuccess = useCallback(() => {
    fetchCodeBlocks();
    router.refresh();
  }, [fetchCodeBlocks, router]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading code blocks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="font-medium text-destructive mb-2">Error loading code blocks</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={fetchCodeBlocks}
              className="text-sm text-primary underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="view" className="gap-2">
            <Code className="h-4 w-4" />
            View Code
          </TabsTrigger>
          <TabsTrigger value="add">Add Block</TabsTrigger>
          <TabsTrigger value="explain">Add Explanation</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-6">
          <UnifiedCodeView
            courseId={courseId}
            chapterId={chapterId}
            sectionId={sectionId}
          />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <AddCodeBlockForm
            courseId={courseId}
            chapterId={chapterId}
            sectionId={sectionId}
            onSuccess={handleSuccess}
          />
        </TabsContent>

        <TabsContent value="explain" className="mt-6">
          <AddExplanationForm
            courseId={courseId}
            chapterId={chapterId}
            sectionId={sectionId}
            codeBlocks={codeBlocks}
            onSuccess={handleSuccess}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
