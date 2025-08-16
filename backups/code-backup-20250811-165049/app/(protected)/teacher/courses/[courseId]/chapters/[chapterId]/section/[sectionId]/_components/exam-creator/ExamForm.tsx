"use client";

import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { ExamFormData } from "./types";

interface ExamFormProps {
  form: UseFormReturn<ExamFormData>;
  onSubmit: (values: ExamFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}

export function ExamForm({ form, onSubmit, onCancel, isSubmitting, isValid }: ExamFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
                  Exam Title *
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder="e.g. 'Module 1 Assessment'"
                    {...field}
                    data-form="exam-title"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
                  Time Limit (minutes)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={isSubmitting}
                    {...field}
                    data-form="exam-time-limit"
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 w-full"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
                Exam Description *
              </FormLabel>
              <FormControl>
                <Textarea
                  disabled={isSubmitting}
                  placeholder="Describe what this exam will cover, learning objectives, and any special instructions..."
                  {...field}
                  data-form="exam-description"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 min-h-[120px] resize-none"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            * Required fields
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              disabled={!isValid || isSubmitting}
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Exam'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}