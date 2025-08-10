"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Lock, Unlock, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface SectionAccessFormProps {
  initialData: {
    isFree: boolean;
    isPublished: boolean;
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
}

const formSchema = z.object({
  isFree: z.boolean().default(false),
});

export const SectionAccessForm = ({
  initialData,
  courseId,
  chapterId,
  sectionId,
}: SectionAccessFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFree: !!initialData.isFree
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {

      const response = await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}`, 
        values
      );

      toast.success("Section access updated");
      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      logger.error("Section access update error:", error);
      toast.error(error.response?.data || "Failed to update section access");
    }
  };

  const Icon = form.getValues("isFree") ? Unlock : Lock;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl transition-all duration-200",
            form.getValues("isFree")
              ? "bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/50 dark:to-cyan-900/50 border border-emerald-200/50 dark:border-emerald-700/50"
              : "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 border border-amber-200/50 dark:border-amber-700/50"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              form.getValues("isFree")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Access Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Control who can access this section
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="ghost"
          size="sm"
          className={cn(
            "transition-all duration-200",
            "w-full sm:w-auto justify-center",
            "border",
            form.getValues("isFree")
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200/50 dark:border-emerald-700/50"
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-amber-200/50 dark:border-amber-700/50"
          )}
        >
          {isEditing ? "Cancel" : "Edit access"}
        </Button>
      </div>
      {!isEditing && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-lg border",
            form.getValues("isFree")
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/50"
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className={cn(
              "h-4 w-4",
              form.getValues("isFree")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )} />
            <p className={cn(
              "font-medium",
              form.getValues("isFree")
                ? "text-emerald-800 dark:text-emerald-200"
                : "text-amber-800 dark:text-amber-200"
            )}>
              {form.getValues("isFree") ? "Free Preview" : "Enrolled Students Only"}
            </p>
          </div>
          <p className={cn(
            "text-sm mt-1",
            form.getValues("isFree")
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-700 dark:text-amber-300"
          )}>
            {form.getValues("isFree") 
              ? "This section is available for preview without enrollment" 
              : "Students need to be enrolled to access this section"}
          </p>
        </motion.div>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className={cn(
                  "p-4 rounded-lg space-y-3",
                  "border border-gray-200 dark:border-gray-700/50",
                  "bg-white/50 dark:bg-gray-900/50"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className={cn(
                          "data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500",
                          "data-[state=unchecked]:bg-amber-600 dark:data-[state=unchecked]:bg-amber-500"
                        )}
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        Free Section Preview
                      </p>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        Make this section free for preview
                      </FormDescription>
                    </div>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2 pt-2">
              <Button
                disabled={isSubmitting}
                type="submit"
                size="sm"
                className={cn(
                  "transition-all duration-200",
                  "w-full sm:w-auto justify-center",
                  "shadow-sm",
                  form.getValues("isFree")
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-4 w-4" />
                    </motion.div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};