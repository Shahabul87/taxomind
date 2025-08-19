"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import axios from "axios";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { logger } from '@/lib/logger';

interface EnrollButtonProps {
  courseId: string;
  price: number;
  userId?: string;
}

export const EnrollButton = ({ courseId, price, userId }: EnrollButtonProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async (): Promise<void> => {
    try {
      if (!userId) {
        router.push("/auth/login");
        return;
      }

      setIsLoading(true);
      
      if (price === 0) {

        await axios.post(`/api/courses/${courseId}/enroll`);

        toast.success("Successfully enrolled in the course!");
        router.refresh(); // Refresh the page data
        router.push(`/courses/${courseId}/success?success=1`);
      } else {

        const response = await axios.post<{ url?: string }>(`/api/courses/${courseId}/checkout`);

        if (response.data?.url) {
          window.location.href = response.data.url;
        } else {
          throw new Error("No checkout URL received");
        }
      }
    } catch (error: unknown) {
      logger.error("Enrollment error:", error);
      const axiosError = error as { response?: { data?: string } };
      toast.error(axiosError.response?.data ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={() => {
        handleEnroll().catch((error) => {
          console.error('Enrollment failed:', error);
        });
      }}
      disabled={isLoading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        px-8 py-4 rounded-full font-semibold text-lg
        ${price === 0 
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
          : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg hover:shadow-xl transition-all duration-300
      `}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </div>
      ) : (
        <span>
          {price === 0 ? "Enroll Now - Free!" : `Enroll Now - $${price}`}
        </span>
      )}
    </motion.button>
  );
}; 