"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";

import { NewPasswordSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,  
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { newPassword } from "@/actions/new-password";

export const NewPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");
    
    startTransition(() => {
      newPassword(values, token)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }
          if (data?.success) {
            form.reset();
            setSuccess(data.success);
            
            // Auto-redirect to login after successful password reset
            setTimeout(() => {
              router.push("/auth/login?message=Password updated successfully! Please login with your new password.");
            }, 2000); // 2 second delay to show success message
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
      transition: { type: "spring", stiffness: 100 }
    }
  };
  
  const buttonVariants = {
    hover: { 
      scale: 1.03,
      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400 }
    },
    tap: { scale: 0.97 }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <motion.div 
        className="flex flex-col items-center justify-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <p className="mt-4 text-lg text-gray-400 font-medium">
          Enter your new password below
        </p>
      </motion.div>

      <div className="grid grid-cols-1 max-w-md mx-auto relative">
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 w-full"
            >
              <div className="space-y-6 w-full min-w-[320px]">
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="w-full relative">
                        <FormLabel className="text-gray-700 dark:text-gray-300 text-lg">New Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              placeholder="******"
                              type={showPassword ? "text" : "password"}
                              className="w-full h-14 bg-transparent border-2 border-gray-700/50 dark:border-gray-700/50 
                                rounded-xl text-gray-900 dark:text-gray-100 text-lg pr-12 pl-12
                                focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/20 
                                transition-all duration-300
                                placeholder:text-gray-500 dark:placeholder:text-gray-500
                                focus:pl-5"
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField(null)}
                            />
                          </FormControl>
                          <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 transition-all duration-300
                            ${field.value || focusedField === 'password' ? 'opacity-0 -translate-x-2' : 'opacity-100'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </div>
                          <button 
                            type="button"
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                          </button>
                          <div className={`absolute top-0 left-0 h-full w-2 rounded-l-xl transition-all duration-300 ${field.value ? 'bg-gradient-to-b from-cyan-400 to-purple-400' : 'bg-transparent'}`}></div>
                        </div>
                        <FormMessage className="text-red-400 absolute -bottom-6 left-0 text-sm" />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </div>
              
              <motion.div variants={itemVariants}>
                <FormError message={error} />
                <FormSuccess message={success} />
              </motion.div>
              
              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  disabled={isPending}
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 
                    hover:to-purple-400 text-white rounded-xl text-lg font-medium tracking-wide 
                    transition-all duration-300 shadow-lg relative overflow-hidden group"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <span className="relative z-10">{isPending ? "Resetting..." : "Reset password"}</span>
                  <span className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-r from-cyan-400 to-purple-400 
                    transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></span>
                </motion.button>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="flex justify-center"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Link 
                    href="/auth/login"
                    className="text-base text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Back to login
                  </Link>
                </motion.div>
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
};