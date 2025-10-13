"use client";

import { useRouter } from "next/navigation";
import { Code2, Sparkles, BookOpen, Zap } from "lucide-react";
import { CodeExplanationForm } from "../_explanations/code-explanation-form";
import { ExplanationActions } from "../explanation-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import type { CodeExplanation } from "../enterprise-section-types";

interface CodeTabProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: {
    codeExplanations?: CodeExplanation[];
    [key: string]: unknown;
  };
}

export const CodeTab = ({
  courseId,
  chapterId,
  sectionId,
  initialData
}: CodeTabProps) => {
  const router = useRouter();

  // Get only code explanations and ensure they have the right structure
  const codeExplanations = (initialData.codeExplanations || []).map((item: CodeExplanation) => ({
    id: item.id,
    heading: item.heading,
    code: item.code,
    explanation: item.explanation,
    language: item.language || 'typescript'
  }));

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                  <Code2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Code Explanations
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Create interactive code examples with detailed explanations
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  <BookOpen className="h-3 w-3" />
                  {codeExplanations.length} {codeExplanations.length === 1 ? 'Block' : 'Blocks'}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Quick Tips Banner */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Pro Tips for Code Explanations
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li className="flex items-center gap-2">
                <Zap className="h-3 w-3 flex-shrink-0" />
                Use syntax highlighting with the language selector for better readability
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-3 w-3 flex-shrink-0" />
                Write clear, step-by-step explanations that break down complex concepts
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-3 w-3 flex-shrink-0" />
                Preview your code block before submitting to ensure formatting is correct
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      <Separator className="my-6" />

      {/* Code Explanation Creator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Create New Code Block
                </CardTitle>
                <CardDescription>
                  Add code examples with explanations to help students learn
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CodeExplanationForm
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
              initialData={initialData}
            />
          </CardContent>
        </Card>
      </motion.div>

      <Separator className="my-6" />

      {/* Existing Code Explanations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-lg shadow-amber-500/20">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                    Your Code Blocks
                  </CardTitle>
                  <CardDescription>
                    Manage and edit your existing code explanations
                  </CardDescription>
                </div>
              </div>
              {codeExplanations.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  {codeExplanations.length} Total
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {codeExplanations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Code2 className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No code blocks yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  Start by creating your first code explanation above. Add code examples with detailed explanations to help your students understand complex concepts.
                </p>
              </div>
            ) : (
              <ExplanationActions
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                codeExplanations={codeExplanations}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
