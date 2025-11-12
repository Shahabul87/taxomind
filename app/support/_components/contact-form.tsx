"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  category: z.string().min(1, "Category is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

interface ContactFormProps {
  userId: string;
}

export const ContactForm = ({ userId }: ContactFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      category: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await axios.post("/api/support/tickets", {
        ...values,
        userId,
      });
      toast.success("Support ticket submitted successfully");
      form.reset();
    } catch (error: any) {
      toast.error("Failed to submit support ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <Select
            onValueChange={(value) => form.setValue("category", value)}
            defaultValue={form.watch("category")}
          >
            <SelectTrigger
              className={cn(
                "w-full h-9 sm:h-10",
                "bg-white/50 dark:bg-gray-800/50",
                "border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-gray-100",
                "text-sm",
                "focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                form.formState.errors.category && "border-red-500 dark:border-red-500"
              )}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className={cn(
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700"
            )}>
              <SelectItem 
                value="technical"
                className="text-gray-900 dark:text-gray-100"
              >
                Technical Issue
              </SelectItem>
              <SelectItem 
                value="billing"
                className="text-gray-900 dark:text-gray-100"
              >
                Billing
              </SelectItem>
              <SelectItem 
                value="account"
                className="text-gray-900 dark:text-gray-100"
              >
                Account
              </SelectItem>
              <SelectItem 
                value="course"
                className="text-gray-900 dark:text-gray-100"
              >
                Course Related
              </SelectItem>
              <SelectItem 
                value="other"
                className="text-gray-900 dark:text-gray-100"
              >
                Other
              </SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.category && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {form.formState.errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Subject
          </label>
          <Input
            {...form.register("subject")}
            placeholder="Brief description of your issue"
            className={cn(
              "w-full h-9 sm:h-10",
              "bg-white/50 dark:bg-gray-800/50",
              "border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-gray-100",
              "text-sm",
              "focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20",
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              form.formState.errors.subject && "border-red-500 dark:border-red-500"
            )}
          />
          {form.formState.errors.subject && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {form.formState.errors.subject.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Message
          </label>
          <Textarea
            {...form.register("message")}
            placeholder="Describe your issue in detail..."
            className={cn(
              "min-h-[150px] sm:min-h-[200px]",
              "bg-white/50 dark:bg-gray-800/50",
              "border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-gray-100",
              "text-sm",
              "focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20",
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              "resize-y",
              form.formState.errors.message && "border-red-500 dark:border-red-500"
            )}
          />
          {form.formState.errors.message && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {form.formState.errors.message.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        size="sm"
        className={cn(
          "w-full h-9 sm:h-10",
          "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
          "dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600",
          "text-white",
          "text-xs sm:text-sm",
          "font-medium",
          "transition-all duration-200",
          "shadow-lg hover:shadow-xl",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Submitting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            Submit Ticket
          </span>
        )}
      </Button>
    </form>
  );
}; 