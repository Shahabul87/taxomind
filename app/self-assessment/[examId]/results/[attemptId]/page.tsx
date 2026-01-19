import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import SelfAssessmentResultsClient from "./self-assessment-results-client";

interface PageProps {
  params: Promise<{
    examId: string;
    attemptId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Assessment Results | Taxomind",
    description: "Review your self-assessment results and cognitive insights",
  };
}

export default async function SelfAssessmentResultsPage({ params }: PageProps) {
  const user = await currentUser();
  const { examId, attemptId } = await params;

  if (!user) {
    redirect("/login");
  }

  return (
    <SelfAssessmentResultsClient
      params={{
        examId,
        attemptId,
      }}
      userId={user.id ?? ""}
    />
  );
}
