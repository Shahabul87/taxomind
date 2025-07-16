import { use } from "react";
import ExamTakeClient from "./exam-take-client";

interface PageProps {
  params: Promise<{
    courseId: string;
    chapterId: string;
    sectionId: string;
    examId: string;
    attemptId: string;
  }>;
}

export default function ExamTakePage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <ExamTakeClient params={resolvedParams} />;
} 