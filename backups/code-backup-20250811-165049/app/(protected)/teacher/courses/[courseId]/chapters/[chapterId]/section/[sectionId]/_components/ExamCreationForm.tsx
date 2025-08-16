"use client";

import { useReducer, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FileQuestion, PlusCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExamList } from "./exam-creator/ExamList";
import { QuestionPreview } from "./exam-creator/QuestionPreview";
import { QuestionItem } from "./exam-creator/QuestionItem";
import { ExamForm } from "./exam-creator/ExamForm";
import { BloomsTaxonomyTabs } from "./exam-creator/BloomsTaxonomyTabs";
import { examReducer, initialExamState, ExamState } from "./exam-creator/exam-reducer";
import { logger } from '@/lib/logger';
import {
  ExamCreationFormProps,
  ExamFormData,
  Question,
  Exam,
  ExamQuestion,
  CourseContext,
} from "./exam-creator/types";

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  timeLimit: z.string().optional(),
});

export const ExamCreationForm = ({
  courseId,
  chapterId,
  sectionId,
  initialData,
}: ExamCreationFormProps) => {
  const router = useRouter();
  const [state, dispatch] = useReducer(examReducer, initialExamState);

  // Initialize form
  const form = useForm<ExamFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      timeLimit: "60",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  // Course context state
  const [courseContext, setCourseContext] = useState<CourseContext>({
    courseId,
    chapterId,
    sectionId,
    courseTitle: "",
    chapterTitle: "",
    sectionTitle: "",
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch section data
        const sectionResponse = await axios.get(
          `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`
        );
        const sectionTitle = sectionResponse.data.title || "";

        // Fetch chapter data
        let chapterTitle = "";
        try {
          const chapterResponse = await axios.get(
            `/api/courses/${courseId}/chapters/${chapterId}`
          );
          chapterTitle = chapterResponse.data.title || "";
        } catch (error) {
          logger.warn("Failed to fetch chapter title:", error);
        }

        // Fetch course data
        let courseTitle = "";
        try {
          const courseResponse = await axios.get(`/api/courses/${courseId}`);
          courseTitle = courseResponse.data.title || "";
        } catch (error) {
          logger.warn("Failed to fetch course title:", error);
        }

        // Update course context
        setCourseContext({
          courseId,
          chapterId,
          sectionId,
          courseTitle,
          chapterTitle,
          sectionTitle,
        });

        // Fetch existing exams
        const examsResponse = await axios.get(
          `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/exams`
        );
        if (examsResponse.data.success) {
          dispatch({ type: "SET_EXISTING_EXAMS", payload: examsResponse.data.exams });
        }
      } catch (error) {
        logger.error("Failed to fetch data:", error);
      } finally {
        dispatch({ type: "SET_LOADING_EXAMS", payload: false });
      }
    };
    fetchData();
  }, [courseId, chapterId, sectionId]);

  // Event handlers
  const onSubmit = async (values: ExamFormData) => {
    if (state.questions.length === 0) {
      toast.error("Please add at least one question to create an exam");
      return;
    }

    try {
      const examData = {
        ...values,
        questions: state.questions,
        totalPoints: state.questions.reduce((sum, q) => sum + q.points, 0),
      };

      const response = await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/exams`,
        examData
      );

      if (response.data.success) {
        toast.success(
          `Exam "${examData.title}" created successfully with ${examData.questions.length} questions!`
        );
        dispatch({ type: "RESET_FORM" });
        form.reset();

        // Refresh exams list
        const examsResponse = await axios.get(
          `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/exams`
        );
        if (examsResponse.data.success) {
          dispatch({ type: "SET_EXISTING_EXAMS", payload: examsResponse.data.exams });
        }

        router.refresh();
      } else {
        throw new Error(response.data.message || "Failed to create exam");
      }
    } catch (error: any) {
      logger.error("Exam creation error:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to create exam");
      }
    }
  };

  const handleAIGenerate = (generatedQuestions: Question[]) => {
    dispatch({ type: "ADD_QUESTIONS", payload: generatedQuestions });
  };

  const deleteQuestion = (questionId: string) => {
    dispatch({ type: "DELETE_QUESTION", payload: questionId });
    toast.success("Question deleted");
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    dispatch({
      type: "UPDATE_QUESTION",
      payload: { id: questionId, updates },
    });
    dispatch({ type: "SET_EDITING_QUESTION", payload: null });
    toast.success("Question updated");
  };

  const handlePublishToggle = async (examId: string, isCurrentlyPublished: boolean) => {
    try {
      dispatch({ type: "SET_PUBLISHING_EXAM_ID", payload: examId });

      const endpoint = isCurrentlyPublished ? "unpublish" : "publish";
      const response = await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/exams/${examId}/${endpoint}`
      );

      if (response.data) {
        toast.success(`Exam ${isCurrentlyPublished ? "unpublished" : "published"} successfully`);
        dispatch({
          type: "UPDATE_EXAM_PUBLISH_STATUS",
          payload: { examId, isPublished: !isCurrentlyPublished },
        });
        router.refresh();
      }
    } catch (error: any) {
      logger.error("Publish toggle error:", error);
      if (error.response?.data) {
        toast.error(error.response.data);
      } else {
        toast.error(`Failed to ${isCurrentlyPublished ? "unpublish" : "publish"} exam`);
      }
    } finally {
      dispatch({ type: "SET_PUBLISHING_EXAM_ID", payload: null });
    }
  };

  const handlePreviewExam = (exam: Exam) => {
    const questions: Question[] = exam.questions.map((q: ExamQuestion) => ({
      id: q.id,
      type: q.questionType.toLowerCase().replace("_", "-") as any,
      difficulty: q.difficulty.toLowerCase() as any,
      bloomsLevel: q.bloomsLevel?.toLowerCase() as any,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      points: q.points,
    }));
    dispatch({ type: "SET_QUESTIONS", payload: questions });
    dispatch({ type: "SET_PREVIEWING_EXAM", payload: exam });
    dispatch({ type: "SET_PREVIEW_VISIBLE", payload: true });
    toast.success(`Previewing exam: ${exam.title}`);
  };

  const handleHidePreview = () => {
    dispatch({ type: "SET_QUESTIONS", payload: [] });
    dispatch({ type: "SET_PREVIEWING_EXAM", payload: null });
    dispatch({ type: "SET_PREVIEW_VISIBLE", payload: false });
    toast.success("Preview hidden");
  };

  const handleEditExam = (exam: Exam) => {
    form.setValue("title", exam.title);
    form.setValue("description", exam.description || "");
    form.setValue("timeLimit", exam.timeLimit?.toString() || "60");

    const questions: Question[] = exam.questions.map((q: ExamQuestion) => ({
      id: q.id,
      type: q.questionType.toLowerCase().replace("_", "-") as any,
      difficulty: q.difficulty.toLowerCase() as any,
      bloomsLevel: q.bloomsLevel?.toLowerCase() as any,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      points: q.points,
    }));
    dispatch({ type: "SET_QUESTIONS", payload: questions });
    dispatch({ type: "SET_CREATING", payload: true });
    toast.success(`Editing exam: ${exam.title}`);
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/exams/${examId}`
      );

      if (response.data) {
        toast.success("Exam deleted successfully");
        dispatch({
          type: "SET_EXISTING_EXAMS",
          payload: state.existingExams.filter((exam) => exam.id !== examId),
        });
        router.refresh();
      }
    } catch (error: any) {
      logger.error("Delete exam error:", error);
      if (error.response?.data) {
        toast.error(error.response.data);
      } else {
        toast.error("Failed to delete exam");
      }
    }
  };

  const moveQuestion = (dragIndex: number, hoverIndex: number) => {
    dispatch({ type: "MOVE_QUESTION", payload: { dragIndex, hoverIndex } });
    toast.success("Question reordered");
  };

  return (
    <div className="w-full space-y-6">
      {/* Existing Exams */}
      {!state.isLoadingExams && (
        <ExamList
          exams={state.existingExams}
          publishingExamId={state.publishingExamId}
          onPreview={handlePreviewExam}
          onEdit={handleEditExam}
          onDelete={handleDeleteExam}
          onPublishToggle={handlePublishToggle}
        />
      )}

      {/* Exam Preview Section */}
      <QuestionPreview
        questions={state.questions}
        previewingExam={state.previewingExam}
        isPreviewVisible={state.isPreviewVisible}
        onHidePreview={handleHidePreview}
      />

      {/* Questions List */}
      {state.questions.length > 0 && state.isPreviewVisible && (
        <div className="space-y-3">
          {state.questions.map((question, index) => (
            <QuestionItem
              key={question.id}
              question={question}
              index={index}
              isEditing={state.editingQuestion === question.id}
              onEdit={() =>
                dispatch({
                  type: "SET_EDITING_QUESTION",
                  payload: state.editingQuestion === question.id ? null : question.id,
                })
              }
              onUpdate={(updates) => updateQuestion(question.id, updates)}
              onDelete={() => deleteQuestion(question.id)}
              onCancelEdit={() => dispatch({ type: "SET_EDITING_QUESTION", payload: null })}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", index.toString());
                e.currentTarget.style.opacity = "0.5";
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
                if (dragIndex !== index) {
                  moveQuestion(dragIndex, index);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Show Preview Button - When Hidden */}
      {!state.isPreviewVisible && (state.questions.length > 0 || state.previewingExam) && (
        <div className="flex justify-center">
          <Button
            onClick={() => dispatch({ type: "SET_PREVIEW_VISIBLE", payload: true })}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Show Preview
            {state.previewingExam && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {state.previewingExam.title}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Create New Exam */}
      {!state.isCreating ? (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <FileQuestion className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Create an Exam
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
            Create quizzes, assignments, and tests to assess your students&apos; understanding of the
            material
          </p>
          <Button
            onClick={() => dispatch({ type: "SET_CREATING", payload: true })}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Exam
          </Button>
        </div>
      ) : (
        <BloomsTaxonomyTabs
          activeTab={state.activeBloomsTab}
          onTabChange={(value) => dispatch({ type: "SET_ACTIVE_BLOOMS_TAB", payload: value })}
          questions={state.questions}
          courseContext={courseContext}
          onAIGenerate={handleAIGenerate}
          onValidationChange={(questionId, result) =>
            dispatch({ type: "SET_QUESTION_VALIDATION", payload: { questionId, result } })
          }
          onBloomsLevelSelect={(level) =>
            dispatch({ type: "SET_SELECTED_BLOOMS_LEVEL", payload: level })
          }
          selectedBloomsLevel={state.selectedBloomsLevel}
        >
          <ExamForm
            form={form}
            onSubmit={onSubmit}
            onCancel={() => dispatch({ type: "SET_CREATING", payload: false })}
            isSubmitting={isSubmitting}
            isValid={isValid}
          />
        </BloomsTaxonomyTabs>
      )}
    </div>
  );
};