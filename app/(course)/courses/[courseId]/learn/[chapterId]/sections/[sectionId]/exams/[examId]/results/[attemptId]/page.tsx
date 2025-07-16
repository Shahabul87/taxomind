import { use } from "react";
import ExamResultsClient from "./exam-results-client";

interface PageProps {
  params: Promise<{
    courseId: string;
    chapterId: string;
    sectionId: string;
    examId: string;
    attemptId: string;
  }>;
}

export default function ExamResultsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <ExamResultsClient params={resolvedParams} />;
}