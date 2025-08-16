"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Course } from '@prisma/client';

interface CourseEnrollButtonProps {
  course: Course;
  userId?: string;
  isEnrolled?: boolean;
}

export const CourseEnrollButton = ({ course, userId, isEnrolled = false }: CourseEnrollButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    try {
      if (!userId) {
        // Store the current URL to redirect back after login
        router.push(`/auth/login?callbackUrl=/courses/${course.id}`);
        return;
      }

      setIsLoading(true);
      
      if (!course.price || course.price === 0) {
        try {
          const response = await axios.post(`/api/courses/${course.id}/enroll`);
          toast.success("Successfully enrolled in the course!");
          router.refresh();
          router.push(`/courses/${course.id}/success?success=1`);
        } catch (error: any) {
          toast.error(error.response?.data || "Failed to enroll in the course");
        }
      } else {
        try {
          const response = await axios.post(`/api/courses/${course.id}/checkout`);
          if (response.data.url) {
            window.location.href = response.data.url; // Stripe checkout URL
          }
        } catch (error) {
          toast.error("Failed to initiate payment");
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Add useEffect to handle successful payment/enrollment
  useEffect(() => {
    if (window.location.search.includes('success=1')) {
      toast.success("Successfully enrolled in the course!");
      // Use router.push instead of window.location
      router.push("/dashboard/student");
    }
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="w-full"
    >
      {isEnrolled ? (
        <button 
          className="w-full group relative px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-green-500/25"
          onClick={() => router.push(`/courses/${course.id}/learn`)}
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Go to Course
                <span className="text-white/90">✓ Enrolled</span>
              </>
            )}
          </span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600/50 to-emerald-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      ) : (
        <button 
          className="w-full group relative px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-purple-500/25"
          onClick={handleEnroll}
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Enroll Now
                <span className="text-white/90">
                  {course.price ? `$${course.price}` : 'Free'}
                </span>
              </>
            )}
          </span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/50 to-blue-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      )}
    </motion.div>
  );
}; 