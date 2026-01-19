import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import SelfAssessmentTakeClient from "./self-assessment-take-client";

interface PageProps {
  params: Promise<{
    examId: string;
    attemptId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Take Self-Assessment | Taxomind",
    description: "Test your knowledge with AI-powered self-assessment",
  };
}

export default async function SelfAssessmentTakePage({ params }: PageProps) {
  const user = await currentUser();
  const { examId, attemptId } = await params;

  if (!user) {
    redirect("/login");
  }

  return (
    <SelfAssessmentTakeClient
      params={{
        examId,
        attemptId,
      }}
      userId={user.id ?? ""}
    />
  );
}
