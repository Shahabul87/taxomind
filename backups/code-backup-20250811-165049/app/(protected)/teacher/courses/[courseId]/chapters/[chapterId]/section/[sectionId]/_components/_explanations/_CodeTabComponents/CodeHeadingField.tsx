import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface CodeHeadingFieldProps {
  form: UseFormReturn<{
    heading: string;
    code: string;
    explanation: string;
  }>;
  isSubmitting: boolean;
}

export const CodeHeadingField = ({ form, isSubmitting }: CodeHeadingFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="heading"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Heading *
          </FormLabel>
          <FormControl>
            <Input
              disabled={isSubmitting}
              placeholder="Enter a descriptive heading for your code explanation..."
              {...field}
              className="text-base"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}; 