"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { GraduationCap, Briefcase, BookOpen, Eye, EyeOff, User, Mail, FileText, Award } from "lucide-react";
import { motion } from "framer-motion";

import { RegisterTeacherSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { registerTeacher } from "@/actions/register-teacher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const RegisterTeacherForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const form = useForm<z.infer<typeof RegisterTeacherSchema>>({
    resolver: zodResolver(RegisterTeacherSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      qualifications: "",
      experience: "",
      subjects: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterTeacherSchema>) => {
    setError("");
    setSuccess("");
    
    startTransition(() => {
      registerTeacher(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }
          if (data.success) {
            form.reset();
            setSuccess(data.success);
          }
        });
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 p-4">
      <motion.div 
        className="w-full max-w-2xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Become an Instructor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Join our community of educators and share your knowledge
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Instructor Application</CardTitle>
              <CardDescription>
                Complete your profile to start your teaching journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Your application will be reviewed by our admin team. 
                  You&apos;ll receive an email once your instructor status is approved.
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="John Doe"
                                className="pl-10"
                                onFocus={() => setFocusedField("name")}
                                onBlur={() => setFocusedField(null)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="john.doe@example.com"
                                type="email"
                                className="pl-10"
                                onFocus={() => setFocusedField("email")}
                                onBlur={() => setFocusedField(null)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="••••••••"
                                type={showPassword ? "text" : "password"}
                                className="pr-10"
                                onFocus={() => setFocusedField("password")}
                                onBlur={() => setFocusedField(null)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Professional Information
                    </h3>

                    <FormField
                      control={form.control}
                      name="qualifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualifications & Certifications</FormLabel>
                          <FormDescription>
                            List your educational background and relevant certifications
                          </FormDescription>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Textarea
                                {...field}
                                disabled={isPending}
                                placeholder="e.g., B.S. Computer Science, AWS Certified Developer"
                                className="pl-10 min-h-[100px]"
                                onFocus={() => setFocusedField("qualifications")}
                                onBlur={() => setFocusedField(null)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teaching Experience</FormLabel>
                          <FormDescription>
                            Describe your teaching or professional experience
                          </FormDescription>
                          <FormControl>
                            <div className="relative">
                              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Textarea
                                {...field}
                                disabled={isPending}
                                placeholder="e.g., 5 years teaching web development, 10 years industry experience"
                                className="pl-10 min-h-[100px]"
                                onFocus={() => setFocusedField("experience")}
                                onBlur={() => setFocusedField(null)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subjects"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subjects You Want to Teach</FormLabel>
                          <FormDescription>
                            List the topics or subjects you&apos;re qualified to teach
                          </FormDescription>
                          <FormControl>
                            <div className="relative">
                              <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Textarea
                                {...field}
                                disabled={isPending}
                                placeholder="e.g., JavaScript, React, Node.js, Web Development, Python"
                                className="pl-10"
                                onFocus={() => setFocusedField("subjects")}
                                onBlur={() => setFocusedField(null)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormError message={error} />
                  <FormSuccess message={success} />

                  <Button
                    disabled={isPending}
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isPending ? "Submitting Application..." : "Submit Application"}
                  </Button>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Already have an account?{" "}
                      <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        Sign in
                      </Link>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Want to register as a student?{" "}
                      <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        Student Registration
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits Section */}
        <motion.div variants={itemVariants} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold">Earn Revenue</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share your knowledge and earn
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold">Grow Your Network</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connect with learners globally
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold">Flexible Teaching</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Teach at your own pace
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};