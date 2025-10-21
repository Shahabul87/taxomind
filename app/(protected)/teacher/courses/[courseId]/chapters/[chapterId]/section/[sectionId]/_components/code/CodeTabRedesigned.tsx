"use client";

import { useState } from "react";
import { Code2, Eye, Plus } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { UnifiedCodeView } from "./UnifiedCodeView";
import { AddCodeExplanationForm } from "./AddCodeExplanationForm";

interface CodeTabRedesignedProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const CodeTabRedesigned = ({
  courseId,
  chapterId,
  sectionId,
}: CodeTabRedesignedProps) => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/10">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex-shrink-0">
                  <Code2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Code & Explanation Manager
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">
                    Create and manage code blocks with detailed explanations
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Main Tabs - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "view" | "add")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="view" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">View Code & Explanation</span>
              <span className="xs:hidden">View</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Add Code & Explanation</span>
              <span className="xs:hidden">Add</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-0">
            <UnifiedCodeView
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
            />
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <AddCodeExplanationForm
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
              onSuccess={() => setActiveTab("view")}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};
