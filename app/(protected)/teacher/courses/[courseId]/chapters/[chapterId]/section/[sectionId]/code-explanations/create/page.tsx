import React from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CodeExplanationForm } from "../../_components/_explanations/code-explanation-form";

const CodeExplanationCreatePage = async ({
  params
}: {
  params: Promise<{ 
    courseId: string; 
    chapterId: string; 
    sectionId: string; 
  }>
}) => {
  const { courseId, chapterId, sectionId } = await params;
  const user = await currentUser();
  const userId = user?.id;

  if (!userId) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: courseId,
      userId
    }
  });

  if (!course) {
    return redirect("/");
  }

  return ( 
    <div className="p-6">
      <CodeExplanationForm
        courseId={courseId}
        chapterId={chapterId}
        sectionId={sectionId}
        initialData={{}}
      />
    </div>
  );
}

export default CodeExplanationCreatePage; 