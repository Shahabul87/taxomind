'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Calculator, Plus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Editor } from '@/components/editor';
import { MathImageUpload } from './MathImageUpload';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  mode: z.enum(['latex', 'visual']),
  latexEquation: z.string().optional(),
  imageUrl: z.string().optional(),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
});

type FormValues = z.infer<typeof formSchema>;

interface MathContentFormProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<FormValues>;
}

export const MathContentForm = ({
  courseId,
  chapterId,
  sectionId,
  onSubmit,
  onCancel,
  initialData
}: MathContentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMode, setCurrentMode] = useState<'latex' | 'visual'>('latex');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      mode: 'latex',
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
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
          Add Math Equation
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Add a new math equation to your section with LaTeX or visual mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Equation Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g., Pythagorean Theorem, Quadratic Formula"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] sm:text-xs">
                    A descriptive title for this equation (e.g., &quot;Pythagorean Theorem&quot;)
                  </FormDescription>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            {/* Mode Selector */}
            <div className="space-y-3 sm:space-y-4">
              <FormLabel className="text-xs sm:text-sm">Equation Mode</FormLabel>
              <Tabs
                value={currentMode}
                onValueChange={(value) => {
                  setCurrentMode(value as 'latex' | 'visual');
                  form.setValue('mode', value as 'latex' | 'visual');
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2">
                  <TabsTrigger value="latex" disabled={isSubmitting} className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4">
                    <span className="hidden xs:inline">📐 LaTeX Equation</span>
                    <span className="xs:hidden">📐 LaTeX</span>
                  </TabsTrigger>
                  <TabsTrigger value="visual" disabled={isSubmitting} className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4">
                    <span className="hidden xs:inline">📷 Visual (Image)</span>
                    <span className="xs:hidden">📷 Image</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="latex" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <FormField
                    control={form.control}
                    name="latexEquation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">LaTeX Equation</FormLabel>
                        <FormControl>
                          <Textarea
                            disabled={isSubmitting}
                            placeholder="e.g., a^2 + b^2 = c^2"
                            className="font-mono min-h-[120px] sm:min-h-[150px] resize-y text-xs sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] sm:text-xs">
                          Enter your equation in LaTeX format. Delimiters like $$, $, or \[ \] will be automatically removed.
                        </FormDescription>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="visual" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Equation Image</FormLabel>
                        <FormControl>
                          <MathImageUpload
                            courseId={courseId}
                            chapterId={chapterId}
                            sectionId={sectionId}
                            value={field.value || ''}
                            onChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] sm:text-xs">
                          Upload an equation image directly from your device
                        </FormDescription>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Explanation */}
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Explanation</FormLabel>
                  <FormControl>
                    <div className="border rounded-md overflow-hidden">
                      <Editor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Explain the equation, its meaning, and applications..."
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-[10px] sm:text-xs">
                    Provide a detailed explanation of the equation and its use cases
                  </FormDescription>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Add Equation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
