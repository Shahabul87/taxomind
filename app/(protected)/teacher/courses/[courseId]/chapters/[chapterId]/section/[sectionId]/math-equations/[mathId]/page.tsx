"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { MathEquationForm } from "../../_components/_explanations/math-equation-form";

interface MathEditPageProps {
  params: Promise<{
    courseId: string;
    chapterId: string;
    sectionId: string;
    mathId: string;
  }>;
}

const formSchema = z.object({
  title: z.string().min(1),
  equation: z.string().optional(),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
  content: z.string().optional(),
  mode: z.enum(["equation", "visual"]).optional(),
});

const MathEditPage = (props: MathEditPageProps) => {
  const params = use(props.params);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mathData, setMathData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMathExplanation = async () => {
      try {
        const response = await axios.get(
          `/api/courses/${params.courseId}/chapters/${params.chapterId}/sections/${params.sectionId}/math-equations/${params.mathId}`
        );
        setMathData(response.data);
      } catch (error) {
        toast.error("Failed to load math explanation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMathExplanation();
  }, [params.courseId, params.chapterId, params.sectionId, params.mathId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await axios.patch(
        `/api/courses/${params.courseId}/chapters/${params.chapterId}/sections/${params.sectionId}/math-equations/${params.mathId}`,
        values
      );
      toast.success("Math explanation updated");
      router.push(`/teacher/courses/${params.courseId}/chapters/${params.chapterId}/section/${params.sectionId}`);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading math explanation...</p>
        </div>
      </div>
    );
  }

  if (!mathData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Math explanation not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}/section/${params.sectionId}`}
          className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to section
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Math Explanation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update your math explanation content
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <MathEquationForm
          courseId={params.courseId}
          chapterId={params.chapterId}
          sectionId={params.sectionId}
          initialData={{
            title: mathData.title || "",
            equation: mathData.equation || "",
            explanation: mathData.content || "",
            imageUrl: mathData.imageUrl || "",
            mode: mathData.mode || "equation",
          }}
          onEquationAdded={() => {
            router.push(`/teacher/courses/${params.courseId}/chapters/${params.chapterId}/section/${params.sectionId}`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
};

export default MathEditPage; 