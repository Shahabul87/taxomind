'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MathContentForm } from './MathContentForm';
import { UnifiedMathView } from './UnifiedMathView';
import { MathContentListSkeleton, MathContentFormSkeleton } from './MathContentSkeleton';
import type { MathExplanation } from '../enterprise-section-types';

interface MathContentManagerProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: MathExplanation[];
}

export const MathContentManager = ({
  courseId,
  chapterId,
  sectionId,
  initialData
}: MathContentManagerProps) => {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [mathExplanations, setMathExplanations] = useState<MathExplanation[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = useCallback(async (data: { title: string; explanation: string; imageUrl?: string; latexEquation?: string }) => {
    setIsLoading(true);
    try {
      // Convert undefined to null for database
      const payload = {
        title: data.title,
        explanation: data.explanation,
        imageUrl: data.imageUrl ?? null,
        latexEquation: data.latexEquation ?? null,
      };

      const response = await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations`,
        payload
      );

      if (response.data.success) {
        setMathExplanations(prev => [...prev, response.data.data]);
        setIsAdding(false);
        toast.success('Math content added successfully');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add math content:', error);
      toast.error('Failed to add math content');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId, sectionId, router]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">
            Math Content ({mathExplanations.length})
          </CardTitle>
          <Button
            onClick={() => setIsAdding(true)}
            disabled={isAdding || isLoading}
            className="gap-2 w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="hidden xs:inline">Add Math Content</span>
            <span className="xs:hidden">Add Content</span>
          </Button>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <>
              {isLoading ? (
                <MathContentFormSkeleton />
              ) : (
                <MathContentForm
                  onSubmit={handleAdd}
                  onCancel={() => setIsAdding(false)}
                />
              )}
            </>
          )}

          {isLoading && !isAdding ? (
            <MathContentListSkeleton count={3} />
          ) : (
            <UnifiedMathView
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
