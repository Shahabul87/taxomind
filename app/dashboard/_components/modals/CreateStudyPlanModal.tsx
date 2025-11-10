"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Calendar, Clock, BookOpen, GraduationCap, PlusCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface CreateStudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudyPlanData) => void;
}

export interface StudyPlanData {
  planType: "enrolled" | "new";

  // For enrolled courses
  enrolledCourseId?: string;

  // For new courses
  newCourseTitle?: string;
  newCourseDescription?: string;
  newCourseUrl?: string;
  newCoursePlatform?: string;

  // Common fields
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  weeklyHoursGoal: number;
  dailyStudyTime?: number;
  studyDaysPerWeek?: number;

  // AI options
  aiGenerated: boolean;
  aiPrompt?: string;
}

interface EnrolledCourse {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  progress?: number;
}

export function CreateStudyPlanModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateStudyPlanModalProps) {
  const [activeTab, setActiveTab] = useState<"enrolled" | "new">("enrolled");
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [weeklyHoursGoal, setWeeklyHoursGoal] = useState("10");
  const [dailyStudyTime, setDailyStudyTime] = useState("2");
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState("5");
  const [useAI, setUseAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Enrolled course fields
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // New course fields
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCourseUrl, setNewCourseUrl] = useState("");
  const [newCoursePlatform, setNewCoursePlatform] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch enrolled courses when modal opens
  useEffect(() => {
    if (isOpen && activeTab === "enrolled") {
      fetchEnrolledCourses();
    }
  }, [isOpen, activeTab]);

  const fetchEnrolledCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch("/api/enrollments/my-courses");
      if (response.ok) {
        const data = await response.json();
        setEnrolledCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch enrolled courses:", error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !startDate || !endDate) {
      return;
    }

    if (activeTab === "enrolled" && !selectedCourseId) {
      return;
    }

    if (activeTab === "new" && !newCourseTitle) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        planType: activeTab,
        enrolledCourseId: activeTab === "enrolled" ? selectedCourseId : undefined,
        newCourseTitle: activeTab === "new" ? newCourseTitle : undefined,
        newCourseDescription: activeTab === "new" ? newCourseDescription : undefined,
        newCourseUrl: activeTab === "new" ? newCourseUrl : undefined,
        newCoursePlatform: activeTab === "new" ? newCoursePlatform : undefined,
        title,
        description,
        startDate,
        endDate,
        weeklyHoursGoal: parseInt(weeklyHoursGoal),
        dailyStudyTime: parseInt(dailyStudyTime),
        studyDaysPerWeek: parseInt(studyDaysPerWeek),
        aiGenerated: useAI,
        aiPrompt: useAI ? aiPrompt : undefined,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating study plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate(undefined);
    setEndDate(undefined);
    setWeeklyHoursGoal("10");
    setDailyStudyTime("2");
    setStudyDaysPerWeek("5");
    setUseAI(false);
    setAiPrompt("");
    setSelectedCourseId("");
    setNewCourseTitle("");
    setNewCourseDescription("");
    setNewCourseUrl("");
    setNewCoursePlatform("");
  };

  // Auto-fill title based on selection
  useEffect(() => {
    if (activeTab === "enrolled" && selectedCourseId) {
      const course = enrolledCourses.find(c => c.id === selectedCourseId);
      if (course) {
        setTitle(`${course.title} - Study Plan`);
      }
    } else if (activeTab === "new" && newCourseTitle) {
      setTitle(`${newCourseTitle} - Study Plan`);
    }
  }, [selectedCourseId, newCourseTitle, activeTab, enrolledCourses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Create Study Plan
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Plan your learning journey
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-6">
          <button
            onClick={() => setActiveTab("enrolled")}
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
            onClick={() => setActiveTab("new")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "new"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            New Course to Enroll
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  AI-Powered Generation
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Let AI create a personalized study plan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseAI(!useAI)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                useAI ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  useAI ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* AI Prompt */}
          <AnimatePresence>
            {useAI && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="aiPrompt">What are your learning goals?</Label>
                <Textarea
                  id="aiPrompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., I want to complete this course in 8 weeks, focusing on practical projects, studying 2 hours daily..."
                  rows={3}
                  className="mt-2"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "enrolled" ? (
              <motion.div
                key="enrolled"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Course Selection */}
                <div>
                  <Label>
                    Select Course <span className="text-red-500">*</span>
                  </Label>
                  {isLoadingCourses ? (
                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                      <p className="text-sm text-slate-500">Loading your courses...</p>
                    </div>
                  ) : enrolledCourses.length === 0 ? (
                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center">
                      <p className="text-sm text-slate-500">No enrolled courses found</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("new")}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Create plan for a new course instead
                      </button>
                    </div>
                  ) : (
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {enrolledCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-slate-400" />
                              <span>{course.title}</span>
                              {course.progress !== undefined && (
                                <span className="text-xs text-slate-500">
                                  ({course.progress}% complete)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="new"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* New Course Details */}
                <div>
                  <Label htmlFor="newCourseTitle">
                    Course Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="newCourseTitle"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="E.g., Complete Web Development Bootcamp"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="newCourseDescription">Course Description</Label>
                  <Textarea
                    id="newCourseDescription"
                    value={newCourseDescription}
                    onChange={(e) => setNewCourseDescription(e.target.value)}
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
                      value={newCoursePlatform}
                      onChange={(e) => setNewCoursePlatform(e.target.value)}
                      placeholder="E.g., Udemy, Coursera"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCourseUrl">Course URL</Label>
                    <Input
                      id="newCourseUrl"
                      value={newCourseUrl}
                      onChange={(e) => setNewCourseUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-2"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Common Fields */}
          <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            {/* Plan Title */}
            <div>
              <Label htmlFor="title">
                Plan Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., 8-Week Intensive Study Plan"
                className="mt-2"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Plan Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Your goals and approach for this study plan..."
                rows={2}
                className="mt-2"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !startDate && "text-slate-500"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>
                  Target Completion <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !endDate && "text-slate-500"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Study Schedule */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="weeklyHours">Weekly Hours</Label>
                <Select value={weeklyHoursGoal} onValueChange={setWeeklyHoursGoal}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 hrs/week</SelectItem>
                    <SelectItem value="10">10 hrs/week</SelectItem>
                    <SelectItem value="15">15 hrs/week</SelectItem>
                    <SelectItem value="20">20 hrs/week</SelectItem>
                    <SelectItem value="25">25 hrs/week</SelectItem>
                    <SelectItem value="30">30+ hrs/week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dailyTime">Daily Time</Label>
                <Select value={dailyStudyTime} onValueChange={setDailyStudyTime}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour/day</SelectItem>
                    <SelectItem value="2">2 hours/day</SelectItem>
                    <SelectItem value="3">3 hours/day</SelectItem>
                    <SelectItem value="4">4 hours/day</SelectItem>
                    <SelectItem value="5">5+ hours/day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="studyDays">Days/Week</Label>
                <Select value={studyDaysPerWeek} onValueChange={setStudyDaysPerWeek}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days/week</SelectItem>
                    <SelectItem value="4">4 days/week</SelectItem>
                    <SelectItem value="5">5 days/week</SelectItem>
                    <SelectItem value="6">6 days/week</SelectItem>
                    <SelectItem value="7">7 days/week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            disabled={
              isSubmitting ||
              !title ||
              !startDate ||
              !endDate ||
              (activeTab === "enrolled" && !selectedCourseId) ||
              (activeTab === "new" && !newCourseTitle)
            }
          >
            {isSubmitting ? (
              <>Creating...</>
            ) : useAI ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </>
            ) : (
              "Create Study Plan"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
