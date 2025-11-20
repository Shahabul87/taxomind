'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Calculator, Loader2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedMathView } from './UnifiedMathView';
import { MathContentForm } from './MathContentForm';
import { MathContentErrorBoundary } from './MathContentErrorBoundary';

interface MathEquation {
  id: string;
  title: string;
  latexEquation: string | null;
  imageUrl: string | null;
  content: string | null;
  explanation: string | null;
  createdAt: string;
}

interface MathContentManagerProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const MathContentManager = ({
  courseId,
  chapterId,
  sectionId,
}: MathContentManagerProps) => {
  const [mathEquations, setMathEquations] = useState<MathEquation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchMathEquations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations`
      );

      if (response.data.success) {
        setMathEquations(response.data.data || []);
      } else {
        setError(response.data.error?.message || 'Failed to load math equations');
      }
    } catch (err) {
      console.error('[FETCH_MATH_EQUATIONS]', err);
      setError('Failed to load math equations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId, sectionId]);

  useEffect(() => {
    fetchMathEquations();
  }, [fetchMathEquations]);

  const handleSuccess = useCallback(() => {
    fetchMathEquations();
    router.refresh();
  }, [fetchMathEquations, router]);

  const handleAdd = useCallback(async (data: { title: string; explanation: string; imageUrl?: string; latexEquation?: string }) => {
    try {
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
        toast.success('Math equation added successfully');
        handleSuccess();
      }
    } catch (error) {
      console.error('Failed to add math equation:', error);
      toast.error('Failed to add math equation');
    }
  }, [courseId, chapterId, sectionId, handleSuccess]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-muted-foreground">Loading math equations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm font-medium text-destructive mb-1.5 sm:mb-2">Error loading math equations</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4 px-2">{error}</p>
            <button
              onClick={fetchMathEquations}
              className="text-xs sm:text-sm text-primary underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2">
          <TabsTrigger value="view" className="gap-1 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4">
            <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">View Equations</span>
            <span className="xs:hidden">View</span>
          </TabsTrigger>
          <TabsTrigger value="add" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4">
            <span className="hidden xs:inline">Add Equation</span>
            <span className="xs:hidden">Add</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-4 sm:mt-6">
          <MathContentErrorBoundary>
            <UnifiedMathView
              courseId={courseId}
              chapterId={chapterId}
              sectionId={sectionId}
            />
          </MathContentErrorBoundary>
        </TabsContent>

        <TabsContent value="add" className="mt-4 sm:mt-6">
          <MathContentForm
            courseId={courseId}
            chapterId={chapterId}
            sectionId={sectionId}
            onSubmit={handleAdd}
            onCancel={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
