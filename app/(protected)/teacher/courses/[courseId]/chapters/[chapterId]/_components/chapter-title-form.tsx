"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import {toast} from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChapterTitleFormProps {
  initialData: {
    title: string;
  };
  courseId: string;
  chapterId: string;
};

const formSchema = z.object({
  title: z.string().min(1),
});

export const ChapterTitleForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterTitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, values);
      toast.success("Chapter updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-4">
      {/* Display Mode */}
      {!isEditing && (
        <div className="group relative">
          <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-300">
            <div className="flex-1 min-w-0">
              {initialData.title ? (
                <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-300 break-words">
                  {initialData.title}
                </p>
              ) : (
                <div className="space-y-2 py-3 rounded-xl border border-dashed border-purple-300/60 dark:border-purple-700/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 px-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No title set
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md px-3">
                    Add a clear, descriptive title for your chapter
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={toggleEdit}
              variant="outline"
              size="sm"
              className={cn(
                "flex-shrink-0 h-9 px-4",
                "bg-white/80 dark:bg-slate-800/80",
                "border-slate-200 dark:border-slate-700",
                "text-slate-700 dark:text-slate-300",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                "hover:border-purple-300 dark:hover:border-purple-600",
                "hover:text-purple-600 dark:hover:text-purple-400",
                "font-semibold text-sm",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md",
                "backdrop-blur-sm"
              )}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled={isSubmitting}
                        placeholder="e.g. 'Introduction to the topic'"
                        className={cn(
                          "pr-20",
                          "bg-white dark:bg-slate-900",
                          "border border-slate-300/60 dark:border-slate-600/60",
                          "text-slate-900 dark:text-slate-100",
                          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                          "focus:border-slate-400/70 dark:focus:border-slate-500/70",
                          "focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                          "text-base font-normal",
                          "h-11",
                          "rounded-md",
                          "transition-all duration-200"
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between gap-x-2">
              <Button
                onClick={toggleEdit}
                variant="outline"
                size="sm"
                type="button"
                className={cn(
                  "h-9 px-4",
                  "bg-white dark:bg-slate-800",
                  "border-slate-300 dark:border-slate-600",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-50 dark:hover:bg-slate-700",
                  "font-semibold",
                  "transition-all duration-200"
                )}
              >
                Cancel
              </Button>
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
