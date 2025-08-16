"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { BookOpen, Calculator, ChevronDown, ChevronUp, Code2, Loader2, PlusCircle, RefreshCw, XCircle } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import { logger } from '@/lib/logger';
import "katex/dist/katex.min.css";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ContentViewer from '@/components/tiptap/content-viewer';
import { cn } from '@/lib/utils';

interface MathEquationsListProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  refreshTrigger?: number; // Optional prop that triggers a refresh when changed
}

type MathEquation = {
  id: string;
  heading: string;
  code: string;  // The equation in LaTeX format or JSON data for visual mode
  explanation: string;
  createdAt: string;
};

// Parse math equation content from the code field
const parseMathEquationContent = (codeString: string) => {
  try {
    // Try to parse as JSON (visual mode)
    const data = JSON.parse(codeString);
    if (data.isMathEquation && data.mode === "visual") {
      return {
        isVisualMode: true,
        imageUrl: data.imageUrl || "",
        content: data.content || "",
        equation: ""
      };
    }
    throw new Error("Not visual mode JSON");
  } catch (e) {
    // It's a regular LaTeX equation
    return {
      isVisualMode: false,
      imageUrl: "",
      content: "",
      equation: codeString
    };
  }
};

export const MathEquationsList = ({ courseId, chapterId, sectionId, refreshTrigger = 0 }: MathEquationsListProps) => {
  const [equations, setEquations] = useState<MathEquation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchEquations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations`
      );
      
      setEquations(response.data);
    } catch (err) {
      logger.error("Failed to fetch math equations:", err);
      setError("Failed to load math equations. Please try again later.");
      toast.error("Failed to load math equations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId, chapterId, sectionId]);

  // Initial fetch
  useEffect(() => {
    fetchEquations();
  }, [fetchEquations]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchEquations();
    }
  }, [refreshTrigger, fetchEquations]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEquations();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-pink-500 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading math equations...</p>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle className="h-8 w-8 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {error}
        </p>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (equations.length === 0 && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-10 w-10 text-pink-400 dark:text-pink-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No math explanations yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Add your first math explanation using the form above to help students understand mathematical concepts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calculator className="h-5 w-5 text-pink-500 mr-2" />
          <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
            Math Explanations ({equations.length})
          </h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className={cn(
            "transition-all duration-200",
            "text-gray-600 dark:text-gray-300",
            "border-gray-200 dark:border-gray-700",
            "hover:border-pink-300 dark:hover:border-pink-700"
          )}
        >
          <RefreshCw className={cn(
            "h-4 w-4 mr-2",
            refreshing && "animate-spin"
          )} />
          Refresh
        </Button>
      </div>

      {equations.map((equation) => {
        // Parse the content from the code field
        const { isVisualMode, imageUrl, content, equation: latexEquation } = parseMathEquationContent(equation.code);
        
        return (
          <Card
            key={equation.id}
            className={cn(
              "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200",
              "hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md",
            )}
          >
            <div 
              className={cn(
                "flex justify-between items-center p-4 cursor-pointer",
                "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20",
                openItems[equation.id] ? "border-b border-gray-200 dark:border-gray-700" : ""
              )}
              onClick={() => toggleItem(equation.id)}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <h4 className="text-lg font-semibold text-pink-800 dark:text-pink-200">
                  {equation.heading}
                </h4>
              </div>
              
              <Button variant="ghost" size="sm">
                {openItems[equation.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="ml-2">{openItems[equation.id] ? "Hide" : "Show"}</span>
              </Button>
            </div>
            
            {openItems[equation.id] && (
              <div 
                className={cn(
                  "p-4 bg-white dark:bg-gray-800",
                  "transition-all duration-300 ease-in-out"
                )}
              >
                {isVisualMode ? (
                  // Visual mode content
                  <div className="space-y-4">
                    {imageUrl && (
                      <div className="py-4 flex justify-center mb-4">
                        <div className="rounded-lg shadow-sm max-w-full overflow-hidden">
                          <Image 
                            src={imageUrl} 
                            alt={equation.heading}
                            width={400}
                            height={300}
                            className="max-w-full h-auto"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = '/placeholder-math-image.svg'; // Use our custom placeholder
                              target.alt = 'Math equation image';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {content && (
                      <div className="prose prose-pink dark:prose-invert max-w-none">
                        <ContentViewer content={content} />
                      </div>
                    )}
                  </div>
                ) : (
                  // Equation mode content
                  latexEquation && (
                    <div className="py-4 flex justify-center mb-4">
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 p-6 rounded-lg shadow-sm w-fit max-w-full overflow-x-auto">
                        <BlockMath math={latexEquation} />
                      </div>
                    </div>
                  )
                )}
                
                {equation.explanation && (
                  <div className="prose prose-pink dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: equation.explanation }} />
                  </div>
                )}
                
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Added on {new Date(equation.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}; 