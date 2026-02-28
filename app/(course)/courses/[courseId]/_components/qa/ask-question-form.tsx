'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TipTapEditor } from '@/components/lazy-imports';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Minimal client-side sanitizer: strips scripts/styles and on* attributes
function sanitizeHtml(input: string): string {
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    // remove script and style tags
    doc.querySelectorAll('script, style').forEach((el) => el.remove());
    // remove event handler attributes and javascript: URLs
    doc.querySelectorAll('*').forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.toLowerCase();
        if (name.startsWith('on') || value.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
    });
    return doc.body.innerHTML;
  } catch {
    return input;
  }
}

const questionFormSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be at most 200 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters').max(5000, 'Content must be at most 5000 characters'),
  sectionId: z.string(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface AskQuestionFormProps {
  courseId: string;
  sections?: Array<{
    id: string;
    title: string;
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AskQuestionForm = ({
  courseId,
  sections = [],
  open,
  onOpenChange,
  onSuccess,
}: AskQuestionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; _count: { answers: number } }>>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: '',
      content: '',
      sectionId: 'none',
    },
  });

  const onSubmit = async (values: QuestionFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          sectionId: values.sectionId === 'none' ? undefined : values.sectionId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to post question');
      }

      toast.success('Question posted successfully!');
      form.reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error posting question:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post question');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate suggestions: search similar questions as user types title
  const titleValue = form.watch('title');
  useEffect(() => {
    const q = (titleValue || '').trim();
    if (q.length < 3) { setSuggestions([]); return; }
    let cancelled = false;
    const fetchSuggestions = async () => {
      setIsSuggesting(true);
      try {
        const params = new URLSearchParams({ page: '1', limit: '5', search: q });
        const res = await fetch(`/api/courses/${courseId}/questions?${params.toString()}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error('Failed to fetch suggestions');
        if (!cancelled) setSuggestions((data.data.questions || []).map((x: any) => ({ id: x.id, title: x.title, _count: { answers: x._count?.answers || 0 } })));
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSuggesting(false);
      }
    };
    const t = setTimeout(fetchSuggestions, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [titleValue, courseId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ask a Question</DialogTitle>
          <DialogDescription>
            Post your question to get help from instructors and fellow students.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Section Selection */}
            {sections.length > 0 && (
              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Section (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific section</SelectItem>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What&apos;s your question about?"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <Search className="w-3.5 h-3.5" />
                        Similar questions — check before posting
                      </div>
                      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                        {suggestions.map((s) => (
                          <li key={s.id} className="px-3 py-2 text-sm">
                            <a
                              href={`/courses/${courseId}/questions/${s.id}`}
                              target="_blank"
                              className="text-blue-700 dark:text-blue-300 hover:underline"
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  window.dispatchEvent(new CustomEvent('analytics:click', { detail: { id: 'qa-duplicate-suggestion', questionId: s.id } }));
                                }
                              }}
                            >
                              {s.title}
                            </a>
                            <span className="ml-2 text-xs text-gray-500">• {s._count.answers} answer{s._count.answers === 1 ? '' : 's'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Content (Rich Text) */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Details</FormLabel>
                  <FormControl>
                    <div>
                      <TipTapEditor
                        value={field.value}
                        onChange={(html) => field.onChange(sanitizeHtml(html))}
                        placeholder="Provide more details, add code blocks, links, and images…"
                      />
                    </div>
                  </FormControl>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <FormMessage />
                    <span>{field.value.length} / 5000</span>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Question'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
