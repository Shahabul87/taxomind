"use client";

import { useParams, useRouter } from "next/navigation";
import { ExamBuilder } from "@/components/sam/exam-builder";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Exam Builder Page
 *
 * Enterprise-level exam creation with:
 * - AI-powered question generation
 * - Question bank browser
 * - Bloom&apos;s Taxonomy distribution picker
 * - Real-time preview with analytics
 */
export default function ExamBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const handleExamCreated = (examId: string) => {
    router.push(`/teacher/courses/${courseId}/exams/${examId}`);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Exam Builder
              </h1>
              <p className="text-sm text-slate-400">
                Create AI-powered assessments aligned with Bloom&apos;s Taxonomy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ExamBuilder
          courseId={courseId}
          onExamCreated={handleExamCreated}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
