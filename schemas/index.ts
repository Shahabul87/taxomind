import * as z from "zod";
import { UserRole } from "@prisma/client";

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

export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(1)),
  newPassword: z.optional(passwordValidation),
  role: z.enum(["ADMIN", "USER"]), // All roles for compatibility
  isTwoFactorEnabled: z.optional(z.boolean())
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

