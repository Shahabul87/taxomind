'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MathLatexInput } from './MathLatexInput';
import { MathImageUpload } from './MathImageUpload';
import { MathRichTextEditor } from './MathRichTextEditor';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  latexEquation: z.string().optional(),
  imageUrl: z.string().url().optional(),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
}).refine(
  (data) => data.latexEquation || data.imageUrl,
  { message: 'Provide either a LaTeX equation or an image' }
);

type FormValues = z.infer<typeof formSchema>;

interface MathContentFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<FormValues>;
}

export const MathContentForm = ({
  onSubmit,
  onCancel,
  initialData
}: MathContentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      latexEquation: initialData?.latexEquation || '',
      imageUrl: initialData?.imageUrl || '',
      explanation: initialData?.explanation || ''
    }
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-4 sm:p-6 border rounded-lg mb-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Pythagorean Theorem"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LaTeX Input */}
        <FormField
          control={form.control}
          name="latexEquation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LaTeX Equation (Optional)</FormLabel>
              <FormControl>
                <MathLatexInput
                  value={field.value || ''}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image Upload (Optional)</FormLabel>
              <FormControl>
                <MathImageUpload
                  value={field.value || ''}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Explanation */}
        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation *</FormLabel>
              <FormControl>
                <MathRichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex flex-col xs:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full xs:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full xs:w-auto"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {initialData ? 'Update' : 'Add'} Math Content
          </Button>
        </div>
      </form>
    </Form>
  );
};
