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
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-lg transition-all duration-200",
            form.getValues("isFree")
              ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:to-cyan-500/20 border border-emerald-500/20 dark:border-emerald-500/30"
              : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/20 dark:border-amber-500/30"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              form.getValues("isFree")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Access Settings
            </h3>
            <p className="text-xs text-muted-foreground">
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
            "h-8 px-3 text-xs font-medium",
            form.getValues("isFree")
              ? "bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30"
              : "bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 border-amber-500/20 dark:border-amber-500/30"
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
            "px-3 py-2.5 rounded-lg border",
            form.getValues("isFree")
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-amber-500/5 border-amber-500/20"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className={cn(
              "h-3.5 w-3.5",
              form.getValues("isFree")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )} />
            <p className={cn(
              "text-sm font-medium",
              form.getValues("isFree")
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-700 dark:text-amber-300"
            )}>
              {form.getValues("isFree") ? "Free Preview" : "Enrolled Students Only"}
            </p>
          </div>
          <p className={cn(
            "text-xs mt-1",
            form.getValues("isFree")
              ? "text-emerald-600/80 dark:text-emerald-400/80"
              : "text-amber-600/80 dark:text-amber-400/80"
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
                  "px-3 py-2.5 rounded-lg space-y-2",
                  "border border-border",
                  "bg-muted/30"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-x-3">
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
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        Free Section Preview
                      </p>
                      <FormDescription className="text-xs text-muted-foreground">
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
                  "h-8 px-3 text-xs font-medium",
                  form.getValues("isFree")
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-x-1.5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-3 w-3" />
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