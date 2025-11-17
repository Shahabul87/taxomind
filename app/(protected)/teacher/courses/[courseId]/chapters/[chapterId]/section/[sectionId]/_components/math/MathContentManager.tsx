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
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading math equations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="font-medium text-destructive mb-2">Error loading math equations</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={fetchMathEquations}
              className="text-sm text-primary underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view" className="gap-2">
            <Calculator className="h-4 w-4" />
            View Equations
          </TabsTrigger>
          <TabsTrigger value="add">Add Equation</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-6">
          <UnifiedMathView
            courseId={courseId}
            chapterId={chapterId}
            sectionId={sectionId}
          />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <MathContentForm
            onSubmit={handleAdd}
            onCancel={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
