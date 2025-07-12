"use client";

import { useCallback, useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

import { newVerification } from "@/actions/new-verification";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams?.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError("Missing token!");
      return;
    }

    newVerification(token)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
        
        // Auto-redirect to login after successful verification
        if (data.success) {
          setTimeout(() => {
            router.push("/auth/login?message=Email verified successfully! Please login.");
          }, 2000); // 2 second delay to show success message
        }
      })
      .catch(() => {
        setError("Something went wrong!");
      })
  }, [token, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

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

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <motion.div 
        className="flex flex-col items-center justify-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Verifying Your Email
        </h2>
        <p className="mt-4 text-lg text-gray-400 font-medium">
          Please wait while we confirm your email address
        </p>
      </motion.div>

      <motion.div 
        className="max-w-md mx-auto bg-white/50 dark:bg-gray-800/50 p-8 rounded-2xl 
          border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          <motion.div variants={itemVariants}>
            {!success && !error && (
              <div className="p-4">
                <BeatLoader color="#22D3EE" size={15} />
              </div>
            )}
            <FormSuccess message={success} />
            {!success && (
              <FormError message={error} />
            )}
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <Link 
              href="/auth/login"
              className="text-cyan-400 hover:text-cyan-300 transition-colors text-base font-medium"
            >
              Back to login
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}