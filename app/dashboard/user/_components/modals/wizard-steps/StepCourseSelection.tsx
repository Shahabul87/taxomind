"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  PlusCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WizardData } from "./index";

interface StepCourseSelectionProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  isValid: boolean;
  onValidChange: (valid: boolean) => void;
}

interface EnrolledCourse {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  progress?: number;
}

export function StepCourseSelection({
  data,
  onUpdate,
  isValid,
  onValidChange,
}: StepCourseSelectionProps) {
  const [activeTab, setActiveTab] = useState<"enrolled" | "new">(
    data.courseType || "enrolled"
  );
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Fetch enrolled courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const response = await fetch("/api/enrollments/my-courses");
        if (response.ok) {
          const result = await response.json();
          const courses = result.data || result.courses || [];
          if (Array.isArray(courses) && courses.length > 0) {
            setEnrolledCourses(
              courses.map(
                (course: {
                  id: string;
                  title: string;
                  description?: string;
                  imageUrl?: string;
                }) => ({
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  imageUrl: course.imageUrl,
                })
              )
            );
          } else {
            setEnrolledCourses([]);
          }
        } else {
          setEnrolledCourses([]);
        }
      } catch {
        setEnrolledCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // Validate the form
  useEffect(() => {
    let valid = false;
    if (activeTab === "enrolled") {
      valid = !!data.enrolledCourseId;
    } else {
      valid = !!(data.newCourse?.title && data.newCourse.title.length >= 3);
    }
    if (valid !== isValid) {
      onValidChange(valid);
    }
  }, [activeTab, data.enrolledCourseId, data.newCourse, isValid, onValidChange]);

  const handleTabChange = (tab: "enrolled" | "new") => {
    setActiveTab(tab);
    onUpdate({ courseType: tab });
  };

  const handleCourseSelect = (courseId: string) => {
    const course = enrolledCourses.find((c) => c.id === courseId);
    onUpdate({
      enrolledCourseId: courseId,
      enrolledCourseTitle: course?.title,
      courseType: "enrolled",
    });
  };

  const handleNewCourseUpdate = (
    field: keyof NonNullable<WizardData["newCourse"]>,
    value: string
  ) => {
    onUpdate({
      newCourse: {
        title: data.newCourse?.title || "",
        description: data.newCourse?.description || "",
        platform: data.newCourse?.platform || "",
        url: data.newCourse?.url || "",
        [field]: value,
      },
      courseType: "new",
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => handleTabChange("enrolled")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "enrolled"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
          )}
        >
          <GraduationCap className="h-4 w-4" />
          My Enrolled Courses
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("new")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "new"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
          )}
        >
          <PlusCircle className="h-4 w-4" />
          New Course
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "enrolled" ? (
          <motion.div
            key="enrolled"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {isLoadingCourses ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-600" />
                        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 text-center">
                <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  No enrolled courses found
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange("new")}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create plan for a new course instead
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {enrolledCourses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => handleCourseSelect(course.id)}
                    className={cn(
                      "group w-full p-4 rounded-xl border text-left transition-all duration-200",
                      data.enrolledCourseId === course.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/30"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          data.enrolledCourseId === course.id
                            ? "bg-blue-500 text-white"
                            : "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400"
                        )}
                      >
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={cn(
                            "font-medium truncate transition-colors",
                            data.enrolledCourseId === course.id
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                          )}
                        >
                          {course.title}
                        </h4>
                        {course.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {course.description}
                          </p>
                        )}
                      </div>
                      {data.enrolledCourseId === course.id && (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="new"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div>
              <Label htmlFor="newCourseTitle">
                Course Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newCourseTitle"
                value={data.newCourse?.title || ""}
                onChange={(e) => handleNewCourseUpdate("title", e.target.value)}
                placeholder="E.g., Complete Web Development Bootcamp"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="newCourseDescription">Description</Label>
              <Textarea
                id="newCourseDescription"
                value={data.newCourse?.description || ""}
                onChange={(e) =>
                  handleNewCourseUpdate("description", e.target.value)
                }
                placeholder="Brief overview of what you&apos;ll learn..."
                rows={2}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newCoursePlatform">Platform</Label>
                <Input
                  id="newCoursePlatform"
                  value={data.newCourse?.platform || ""}
                  onChange={(e) =>
                    handleNewCourseUpdate("platform", e.target.value)
                  }
                  placeholder="E.g., Udemy, Coursera"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="newCourseUrl">Course URL</Label>
                <div className="relative mt-2">
                  <Input
                    id="newCourseUrl"
                    value={data.newCourse?.url || ""}
                    onChange={(e) =>
                      handleNewCourseUpdate("url", e.target.value)
                    }
                    placeholder="https://..."
                    className="pr-9"
                  />
                  {data.newCourse?.url && (
                    <a
                      href={data.newCourse.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
