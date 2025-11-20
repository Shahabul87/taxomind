import * as z from "zod";
// NOTE: UserRole no longer exists - only AdminAccount has roles (AdminRole enum)
// import { UserRole } from "@prisma/client";

// export const SettingsSchema = z.object({
//   name: z.optional(z.string()),
//   isTwoFactorEnabled: z.optional(z.boolean()),
//   role: z.enum([UserRole.ADMIN, UserRole.USER]),
//   email: z.optional(z.string().email()),
//   password: z.optional(z.string().min(6)),
//   newPassword: z.optional(z.string().min(6)),
// })
//   .refine((data) => {
//     if (data.password && !data.newPassword) {
//       return false;
//     }

//     return true;
//   }, {
//     message: "New password is required!",
//     path: ["newPassword"]
//   })
//   .refine((data) => {
//     if (data.newPassword && !data.password) {
//       return false;
//     }

//     return true;
//   }, {
//     message: "Password is required!",
//     path: ["password"]
//   })

const passwordValidation = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least 1 lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least 1 number" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least 1 special character" });

// Phone number validation
const phoneValidation = z.string()
  .min(10, { message: "Phone number must be at least 10 digits" })
  .max(15, { message: "Phone number must be at most 15 digits" })
  .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number format" });

// Extended Settings Schema for Enterprise Features
export const SettingsSchema = z.object({
  // Basic Account Info
  name: z.optional(z.string()),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(1)),
  newPassword: z.optional(passwordValidation),
  role: z.enum(["ADMIN", "USER"]),
  isTwoFactorEnabled: z.optional(z.boolean()),

  // Profile Fields
  phone: z.optional(phoneValidation),
  image: z.optional(z.string().url()),
  learningStyle: z.optional(z.enum(["VISUAL", "AUDITORY", "KINESTHETIC", "READING_WRITING"])),

  // Notification Preferences
  emailNotifications: z.optional(z.boolean()),
  emailCourseUpdates: z.optional(z.boolean()),
  emailNewMessages: z.optional(z.boolean()),
  emailMarketingEmails: z.optional(z.boolean()),
  emailWeeklyDigest: z.optional(z.boolean()),
  pushNotifications: z.optional(z.boolean()),
  pushCourseReminders: z.optional(z.boolean()),
  pushNewMessages: z.optional(z.boolean()),
  pushAchievements: z.optional(z.boolean()),

  // Privacy Settings
  profileVisibility: z.optional(z.enum(["public", "private", "friends"])),
  showEmail: z.optional(z.boolean()),
  showPhone: z.optional(z.boolean()),
  showLearningProgress: z.optional(z.boolean()),
  allowDataCollection: z.optional(z.boolean()),
  allowPersonalization: z.optional(z.boolean()),
});


export const NewPasswordSchema = z.object({
  password: passwordValidation,
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: passwordValidation,
  name: z.string().min(1, {
    message: "Name is required",
  }),
  acceptTermsAndPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms and Conditions and Privacy Policy",
  }),
});

export const RegisterTeacherSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: passwordValidation,
  name: z.string().min(1, {
    message: "Name is required",
  }),
  qualifications: z.string().min(10, {
    message: "Please provide your qualifications (minimum 10 characters)",
  }),
  experience: z.string().min(10, {
    message: "Please describe your experience (minimum 10 characters)",
  }),
  subjects: z.string().min(5, {
    message: "Please list subjects you want to teach",
  }),
});

