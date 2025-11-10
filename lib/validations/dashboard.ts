/**
 * Dashboard Validation Schemas
 * Enterprise-grade Zod schemas for dashboard API validation
 */

import { z } from "zod";

// ==========================================
// Activity Validation
// ==========================================

export const activitySchema = z.object({
  type: z.enum([
    "ASSIGNMENT",
    "QUIZ",
    "EXAM",
    "READING",
    "VIDEO",
    "DISCUSSION",
    "STUDY_SESSION",
    "PROJECT",
    "PRESENTATION",
    "CUSTOM",
  ]),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000).optional(),
  courseId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  points: z.number().int().min(0).max(1000).default(0),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  estimatedMinutes: z.number().int().min(1).max(480).optional(),
  tags: z.array(z.string()).default([]),
  googleEventId: z.string().optional(),
  calendarSynced: z.boolean().default(false),
});

export const updateActivitySchema = activitySchema.partial().extend({
  id: z.string(),
  status: z
    .enum([
      "NOT_STARTED",
      "IN_PROGRESS",
      "SUBMITTED",
      "GRADED",
      "OVERDUE",
      "CANCELLED",
    ])
    .optional(),
  completedAt: z.coerce.date().optional(),
  actualMinutes: z.number().int().min(1).optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

// ==========================================
// Course Plan Validation
// ==========================================

export const coursePlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  startDate: z.coerce.date(),
  targetCompletionDate: z.coerce.date().optional(),
  daysPerWeek: z.number().int().min(1).max(7),
  timePerSession: z.number().int().min(15).max(480), // 15 min to 8 hours
  difficultyLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  courseType: z.enum(["VIDEO", "READING", "PRACTICE", "MIXED"]),
  learningGoals: z.string().max(2000, "Learning goals too long").optional(),
  studyReminders: z.boolean().default(true),
  progressCheckins: z.boolean().default(true),
  milestoneAlerts: z.boolean().default(true),
  syncToGoogleCalendar: z.boolean().default(false),
  courseId: z.string().optional(),
});

export const updateCoursePlanSchema = coursePlanSchema.partial().extend({
  id: z.string(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
});

export type CoursePlanInput = z.infer<typeof coursePlanSchema>;
export type UpdateCoursePlanInput = z.infer<typeof updateCoursePlanSchema>;

// ==========================================
// Blog Plan Validation
// ==========================================

export const blogPlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  topics: z.array(z.string()).min(1, "At least one topic required"),
  startPublishingDate: z.coerce.date(),
  postFrequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  specificDays: z.string().max(100).optional(),
  platform: z.string().max(100).optional(),
  targetAudience: z.string().max(500).optional(),
  contentGoal: z.enum(["TRAFFIC", "PORTFOLIO", "MONETIZATION", "KNOWLEDGE_SHARING"]),
  writingReminders: z.boolean().default(true),
  publishingReminders: z.boolean().default(true),
  deadlineAlerts: z.boolean().default(true),
  syncToGoogleCalendar: z.boolean().default(false),
});

export const updateBlogPlanSchema = blogPlanSchema.partial().extend({
  id: z.string(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
});

export type BlogPlanInput = z.infer<typeof blogPlanSchema>;
export type UpdateBlogPlanInput = z.infer<typeof updateBlogPlanSchema>;

// ==========================================
// Study Plan Validation
// ==========================================

// Base schema without refinement (for use with .partial())
const studyPlanBaseSchema = z.object({
  // Plan type
  planType: z.enum(["enrolled", "new"]),

  // For enrolled courses
  enrolledCourseId: z.string().optional(),

  // For new courses to enroll
  newCourseTitle: z.string().max(200).optional(),
  newCourseDescription: z.string().max(2000).optional(),
  newCourseUrl: z.string().url().max(500).optional().or(z.literal("")),
  newCoursePlatform: z.string().max(100).optional(),

  // Common fields
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  weeklyHoursGoal: z.number().int().min(1).max(168), // max hours in a week
  dailyStudyTime: z.number().int().min(1).max(24).optional(),
  studyDaysPerWeek: z.number().int().min(1).max(7).optional(),

  // AI options
  aiGenerated: z.boolean().default(false),
  aiPrompt: z.string().max(1000).optional(),
});

// Export schema with refinement for creation
export const studyPlanSchema = studyPlanBaseSchema.refine(
  (data) => {
    // If planType is "enrolled", enrolledCourseId is required
    if (data.planType === "enrolled" && !data.enrolledCourseId) {
      return false;
    }
    // If planType is "new", newCourseTitle is required
    if (data.planType === "new" && !data.newCourseTitle) {
      return false;
    }
    return true;
  },
  {
    message: "Enrolled course or new course details are required based on plan type",
  }
);

// Use base schema for partial update schema
export const updateStudyPlanSchema = studyPlanBaseSchema.partial().extend({
  id: z.string(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
});

export type StudyPlanInput = z.infer<typeof studyPlanSchema>;
export type UpdateStudyPlanInput = z.infer<typeof updateStudyPlanSchema>;

// ==========================================
// Study Session Validation
// ==========================================

export const studySessionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  notes: z.string().max(2000).optional(),
  startTime: z.coerce.date(),
  duration: z.number().int().min(15).max(480), // 15 min to 8 hours
  syncToGoogleCalendar: z.boolean().default(false),
  studyPlanId: z.string().optional(),
  courseId: z.string().optional(),
});

export const updateStudySessionSchema = studySessionSchema.partial().extend({
  id: z.string(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "MISSED"]).optional(),
  actualStartTime: z.coerce.date().optional(),
  actualEndTime: z.coerce.date().optional(),
  productivity: z.number().int().min(0).max(100).optional(),
});

export type StudySessionInput = z.infer<typeof studySessionSchema>;
export type UpdateStudySessionInput = z.infer<typeof updateStudySessionSchema>;

// ==========================================
// Todo Validation
// ==========================================

export const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  tags: z.array(z.string()).default([]),
  courseId: z.string().optional(),
  estimatedMinutes: z.number().int().min(1).max(480).optional(),
});

export const updateTodoSchema = todoSchema.partial().extend({
  id: z.string(),
  completed: z.boolean().optional(),
  completedAt: z.coerce.date().optional(),
  position: z.number().int().min(0).optional(),
});

export type TodoInput = z.infer<typeof todoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

// ==========================================
// Goal Validation
// ==========================================

export const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  targetDate: z.coerce.date(),
});

export const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000).optional(),
  type: z.enum(["COURSE_COMPLETION", "SKILL_MASTERY", "TIME_MILESTONE", "GRADE_TARGET", "CERTIFICATION", "CUSTOM"]),
  targetDate: z.coerce.date(),
  courseId: z.string().optional(),
  milestones: z.array(milestoneSchema).default([]),
});

export const updateGoalSchema = goalSchema.partial().extend({
  id: z.string(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

// ==========================================
// Common Query Parameters
// ==========================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const filterSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
  courseId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const activityFilterSchema = z.object({
  status: z
    .enum([
      "NOT_STARTED",
      "IN_PROGRESS",
      "SUBMITTED",
      "GRADED",
      "OVERDUE",
      "CANCELLED",
    ])
    .optional(),
  type: z
    .enum([
      "ASSIGNMENT",
      "QUIZ",
      "EXAM",
      "READING",
      "VIDEO",
      "DISCUSSION",
      "STUDY_SESSION",
      "PROJECT",
      "PRESENTATION",
      "CUSTOM",
    ])
    .optional(),
  courseId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const goalFilterSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).optional(),
  courseId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
export type ActivityFilterInput = z.infer<typeof activityFilterSchema>;
export type GoalFilterInput = z.infer<typeof goalFilterSchema>;
