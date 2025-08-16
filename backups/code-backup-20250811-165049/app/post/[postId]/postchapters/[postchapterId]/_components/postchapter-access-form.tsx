"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Lock, Unlock, ShieldCheck, ShieldAlert, Key, Check, X, RefreshCw } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

interface PostchapterAccessFormProps {
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

export const PostchapterAccessForm = ({
  initialData,
  postId,
  chapterId,
}: PostchapterAccessFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<{
    success?: boolean;
    error?: boolean;
    message?: string;
  }>({});
  
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFree: !!initialData.isFree
    },
  });

  const { isSubmitting } = form.formState;

  // Handle form submission status updates with useEffect instead of in render
  useEffect(() => {
    if (formState.success) {
      toast.success(formState.message || "Access settings updated");
      setFormState({});
    } else if (formState.error) {
      toast.error(formState.message || "Something went wrong");
      setFormState({});
    }
  }, [formState]);

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/posts/${postId}/postchapters/${chapterId}`, values);
      setFormState({ success: true, message: "Access settings updated" });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setFormState({ error: true, message: "Something went wrong" });
    } finally {
      setIsLoading(false);
    }
  }, [postId, chapterId, router]);

  const handleToggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl transition-all duration-300">
      {/* Background design elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-emerald-950/30 -z-10"></div>
      
      {/* Shape decorations */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-100/20 to-teal-200/20 blur-3xl dark:from-emerald-900/10 dark:to-teal-900/10 -z-5"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-100/20 to-yellow-200/20 blur-3xl dark:from-amber-900/10 dark:to-yellow-900/10 -z-5"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.100/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.100/10)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,theme(colors.gray.800/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.800/10)_1px,transparent_1px)] -z-5"></div>

      <div className="relative border border-gray-200/70 dark:border-gray-800/50 shadow-lg dark:shadow-emerald-500/5 transition-all duration-300 backdrop-blur-sm">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200/70 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/50 px-7 py-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 opacity-70 blur-md group-hover:opacity-100 transition duration-200"></div>
              <div className="relative flex items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 dark:from-amber-400 dark:via-emerald-400 dark:to-teal-400">
                Access Control
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage who can access this chapter
              </p>
            </div>
          </div>
          
          <div className="flex items-center mt-4 sm:mt-0 gap-2 self-end sm:self-auto">
            <Button
              onClick={handleToggleEdit}
              variant={isEditing ? "outline" : "default"}
              size="sm"
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                isEditing 
                  ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20" 
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20"
              )}
            >
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  <span>Manage Access</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm p-7">
          {/* Current Status Display */}
          {!isEditing && (
            <div className="rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800/50 shadow-sm">
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200/80 dark:border-gray-800/50">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Current Access Status</h4>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-6">
                <div className="flex items-center gap-3">
                  {initialData.isFree ? (
                    <>
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Unlock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-emerald-700 dark:text-emerald-400">Free Access</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">This chapter is available to everyone</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-amber-700 dark:text-amber-400">Premium Content</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">This chapter requires purchase for access</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Editor Form */}
          {isEditing && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div className="rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-800/50 shadow-sm">
                  <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200/80 dark:border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Access Settings</h4>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 p-6">
                    <FormField
                      control={form.control}
                      name="isFree"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 bg-white/70 dark:bg-gray-800/30">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              {field.value ? (
                                <Unlock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              )}
                              <span>Free Chapter Access</span>
                            </div>
                            <FormDescription className="text-sm text-gray-500 dark:text-gray-400">
                              Make this chapter freely available to attract readers
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting || isLoading}
                              className={cn(
                                "data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:bg-emerald-600",
                                "data-[state=unchecked]:bg-amber-200 dark:data-[state=unchecked]:bg-amber-700",
                                "transition-colors"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleEdit}
                    className="border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={isSubmitting || isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20"
                  >
                    {(isSubmitting || isLoading) ? (
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        <span>Save Changes</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}; 