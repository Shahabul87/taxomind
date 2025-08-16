"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FaEnvelope } from "react-icons/fa";
import { motion } from "framer-motion";

import { ResetSchema } from "@/schemas";
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
import { reset } from "@/actions/reset";

export const ResetForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      reset(values)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }
          if (data?.success) {
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
          Forgot Password?
        </h2>
        <p className="mt-4 text-lg text-gray-400 font-medium">
          Enter your email to reset your password
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
                    name="email"
                    render={({ field }) => (
                      <FormItem className="w-full relative">
                        <FormLabel className="text-gray-700 dark:text-gray-300 text-lg">Email</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              placeholder="john.doe@example.com"
                              type="email"
                              className="w-full h-14 bg-transparent border-2 border-gray-700/50 dark:border-gray-700/50 
                                rounded-xl text-gray-900 dark:text-gray-100 text-lg pl-12
                                focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/20 
                                transition-all duration-300
                                placeholder:text-gray-500 dark:placeholder:text-gray-500
                                focus:pl-5"
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                            />
                          </FormControl>
                          <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 transition-all duration-300 
                            ${field.value || focusedField === 'email' ? 'opacity-0 -translate-x-2' : 'opacity-100'}`}>
                            <FaEnvelope className="w-5 h-5" />
                          </div>
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
                  <span className="relative z-10">{isPending ? "Sending..." : "Send reset email"}</span>
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