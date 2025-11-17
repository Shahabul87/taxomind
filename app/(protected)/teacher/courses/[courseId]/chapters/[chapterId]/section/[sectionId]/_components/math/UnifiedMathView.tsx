"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BlockMath } from 'react-katex';
import "katex/dist/katex.min.css";
import Image from "next/image";
import { Copy, Calculator, Loader2, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MathExplanationTooltip } from "./MathExplanationTooltip";
import { MathEquationEditModal } from "./MathEquationEditModal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import axios from "axios";

interface MathEquation {
  id: string;
  title: string;
  latexEquation: string | null;
  imageUrl: string | null;
  content: string | null;
  explanation: string | null;
  createdAt: string;
}

interface UnifiedMathViewProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const UnifiedMathView = ({
  courseId,
  chapterId,
  sectionId,
}: UnifiedMathViewProps) => {
  const [equations, setEquations] = useState<MathEquation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openTooltips, setOpenTooltips] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [showExplanations, setShowExplanations] = useState(true);
  const [copiedEquationId, setCopiedEquationId] = useState<string | null>(null);
  const [editingEquation, setEditingEquation] = useState<MathEquation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch math equations
  useEffect(() => {
    const fetchEquations = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations`
        );
        setEquations(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch math equations:', error);
        toast.error('Failed to load math equations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquations();
  }, [courseId, chapterId, sectionId]);

  // Calculate smart tooltip position that stays within viewport
  const calculateTooltipPosition = (buttonElement: HTMLElement) => {
    const tooltipWidth = 384;
    const tooltipHeight = 400;
    const offset = 10;

    const buttonRect = buttonElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = buttonRect.right + offset;
    let y = buttonRect.top;

    if (x + tooltipWidth > viewportWidth) {
      x = buttonRect.left - tooltipWidth - offset;
    }

    if (x < 0) {
      x = offset;
    }

    if (y + tooltipHeight > viewportHeight) {
      y = viewportHeight - tooltipHeight - offset;
    }

    if (y < 0) {
      y = offset;
    }

    return { x, y };
  };

  // Handle show explanation button click
  const handleShowExplanation = (
    equationId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const equation = equations.find(e => e.id === equationId);
    if (!equation?.explanation) {
      toast.info('No explanation available for this equation');
      return;
    }

    if (openTooltips.has(equationId)) {
      toast.info('Explanation is already visible');
      return;
    }

    const position = calculateTooltipPosition(event.currentTarget);
    setOpenTooltips(prev => new Map(prev).set(equationId, position));
  };

  // Handle tooltip close
  const handleTooltipClose = (equationId: string) => {
    setOpenTooltips(prev => {
      const newMap = new Map(prev);
      newMap.delete(equationId);
      return newMap;
    });
  };

  // Copy LaTeX equation to clipboard
  const handleCopyEquation = async (equationId: string) => {
    const equation = equations.find(e => e.id === equationId);
    if (!equation) return;

    if (!equation.latexEquation) {
      toast.info('Visual mode equations cannot be copied as text');
      return;
    }

    try {
      await navigator.clipboard.writeText(equation.latexEquation);
      setCopiedEquationId(equationId);
      toast.success(`LaTeX equation copied!`);
      setTimeout(() => setCopiedEquationId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy equation');
    }
  };

  // Edit equation
  const handleEdit = (equation: MathEquation) => {
    setEditingEquation(equation);
    setIsEditModalOpen(true);
  };

  // Delete equation
  const handleDelete = async (equationId: string) => {
    try {
      setIsDeletingId(equationId);

      await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations/${equationId}`
      );

      setEquations(prev => prev.filter(e => e.id !== equationId));

      setOpenTooltips(prev => {
        const newMap = new Map(prev);
        newMap.delete(equationId);
        return newMap;
      });

      toast.success('Math equation deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete math equation');
      console.error('Delete error:', error);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    const fetchEquations = async () => {
      try {
        const response = await axios.get(
          `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations`
        );
        setEquations(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch math equations:', error);
      }
    };

    fetchEquations();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading math equations...</p>
        </CardContent>
      </Card>
    );
  }

  if (equations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No math equations yet. Add your first equation to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900 dark:to-violet-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-bold">
              Math Equations
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              {equations.length} {equations.length === 1 ? 'Equation' : 'Equations'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanations(!showExplanations)}
              className="gap-2"
            >
              {showExplanations ? 'Hide Buttons' : 'Show Buttons'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative" ref={containerRef}>
        <div className="relative">
          {equations.map((equation, index) => {
            const isVisualMode = !!equation.imageUrl && !equation.latexEquation;

            return (
              <motion.div
                key={equation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative border-b border-gray-200 dark:border-gray-800 last:border-b-0"
              >
                {/* Equation Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-b border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      {equation.title}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {isVisualMode ? '📷 Visual' : '📐 LaTeX'}
                    </Badge>
                    {!equation.explanation && (
                      <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                        No explanation yet
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {equation.explanation && showExplanations && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleShowExplanation(equation.id, e)}
                        className={`h-7 px-2 text-xs font-medium ${
                          openTooltips.has(equation.id)
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-700 dark:hover:text-white'
                        }`}
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        {openTooltips.has(equation.id) ? 'Shown' : 'Show Explanation'}
                      </Button>
                    )}
                    {!isVisualMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyEquation(equation.id)}
                        className={`h-7 px-2 text-xs font-medium ${
                          copiedEquationId === equation.id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-600 hover:text-white dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white'
                        }`}
                      >
                        {copiedEquationId === equation.id ? (
                          <>✓ Copied</>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(equation)}
                      className="h-7 px-2 text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-700 dark:hover:text-white"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <ConfirmModal onConfirm={() => handleDelete(equation.id)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeletingId === equation.id}
                        className="h-7 px-2 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-600 hover:text-white dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {isDeletingId === equation.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </ConfirmModal>
                  </div>
                </div>

                {/* Equation Preview */}
                <div className="relative group p-4">
                  {isVisualMode ? (
                    equation.imageUrl && (
                      <div className="flex justify-center">
                        <Image
                          src={equation.imageUrl}
                          alt={equation.title}
                          width={400}
                          height={300}
                          className="max-w-full h-auto rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/placeholder-math-image.svg';
                          }}
                        />
                      </div>
                    )
                  ) : (
                    equation.latexEquation && (
                      <div className="flex justify-center">
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 p-6 rounded-lg w-fit max-w-full overflow-x-auto">
                          <BlockMath math={equation.latexEquation} />
                        </div>
                      </div>
                    )
                  )}

                  {/* Active equation overlay */}
                  {openTooltips.has(equation.id) && (
                    <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Explanation Tooltips - Multiple can be open */}
        <AnimatePresence>
          {showExplanations && Array.from(openTooltips.entries()).map(([equationId, position]) => {
            const equation = equations.find(e => e.id === equationId);
            if (!equation) return null;

            const isVisualMode = !!equation.imageUrl && !equation.latexEquation;

            return (
              <MathExplanationTooltip
                key={equationId}
                explanation={equation.explanation || ''}
                title={equation.title}
                position={position}
                isVisualMode={isVisualMode}
                imageUrl={equation.imageUrl || ''}
                content={equation.content || ''}
                latexEquation={equation.latexEquation || ''}
                onClose={() => handleTooltipClose(equationId)}
              />
            );
          })}
        </AnimatePresence>
      </CardContent>

      {/* Edit Math Equation Modal */}
      {editingEquation && (
        <MathEquationEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEquation(null);
          }}
          courseId={courseId}
          chapterId={chapterId}
          sectionId={sectionId}
          equationId={editingEquation.id}
          initialData={{
            title: editingEquation.title,
            latexEquation: editingEquation.latexEquation,
            imageUrl: editingEquation.imageUrl,
            content: editingEquation.content,
            explanation: editingEquation.explanation,
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </Card>
  );
};
