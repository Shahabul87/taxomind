"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Lock, Unlock, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface PostchapterAccessFormVelenProps {
  initialData: {
    isFree: boolean;
    isPublished: boolean;
  };
  postId: string;
  chapterId: string;
}

const formSchema = z.object({
  isFree: z.boolean().default(false),
});

export const PostchapterAccessFormVelen = ({
  initialData,
  postId,
  chapterId,
}: PostchapterAccessFormVelenProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFree: !!initialData.isFree
    },
  });

  const { isSubmitting } = form.formState;
  const isFreeValue = form.watch("isFree");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true);
      await axios.patch(`/api/posts/${postId}/postchapters/${chapterId}`, values);

      toast.success("Access settings updated", {
        description: values.isFree
          ? "Chapter is now free for all users"
          : "Chapter requires access to view",
        icon: <Check className="h-4 w-4" />
      });

      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update settings", {
        description: "Please try again"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Current Status Display */}
      <div className={cn(
        "p-4 rounded-lg border transition-all duration-200",
        isFreeValue
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
          : "bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/50"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 p-2 rounded-lg",
            isFreeValue
              ? "bg-emerald-100 dark:bg-emerald-900/50"
              : "bg-violet-100 dark:bg-violet-900/50"
          )}>
            {isFreeValue ? (
              <Unlock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                "text-sm font-semibold",
                isFreeValue
                  ? "text-emerald-900 dark:text-emerald-100"
                  : "text-violet-900 dark:text-violet-100"
              )}>
                {isFreeValue ? "Free Access" : "Restricted Access"}
              </h4>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium",
                isFreeValue
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                  : "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
              )}>
                {isFreeValue ? "Public" : "Members Only"}
              </span>
            </div>
            <p className={cn(
              "text-sm",
              isFreeValue
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-violet-600 dark:text-violet-400"
            )}>
              {isFreeValue
                ? "Anyone can access this chapter"
                : "Only members with access can view this chapter"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing ? (
        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="space-y-1 pr-4">
                      <FormLabel className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Free Chapter Preview
                      </FormLabel>
                      <FormDescription className="text-sm text-slate-500 dark:text-slate-400">
                        Allow anyone to preview this chapter without requiring access
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting || isSaving}
                        className={cn(
                          "data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:bg-emerald-600",
                          "data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700"
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <Button
                  disabled={isSubmitting || isSaving}
                  type="submit"
                  size="sm"
                  className={cn(
                    "h-9 px-4 rounded-lg",
                    "bg-violet-500 hover:bg-violet-600",
                    "text-white font-medium",
                    "shadow-sm shadow-violet-500/20",
                    "hover:shadow-md hover:shadow-violet-500/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200"
                  )}
                >
                  {(isSubmitting || isSaving) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset({ isFree: !!initialData.isFree });
                  }}
                  disabled={isSubmitting || isSaving}
                  className={cn(
                    "h-9 px-4 rounded-lg",
                    "text-slate-600 dark:text-slate-400",
                    "hover:text-slate-900 dark:hover:text-slate-100",
                    "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-lg",
              "text-sm font-medium",
              "text-slate-600 dark:text-slate-400",
              "hover:text-violet-600 dark:hover:text-violet-400",
              "hover:bg-violet-50 dark:hover:bg-violet-950/30",
              "transition-all duration-200"
            )}
          >
            Change Settings
          </Button>
        </div>
      )}
    </div>
  );
};
