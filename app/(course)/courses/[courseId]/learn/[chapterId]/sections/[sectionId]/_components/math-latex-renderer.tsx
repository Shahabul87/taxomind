"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calculator, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { KaTeXRenderer, cleanLatex } from "@/components/shared/katex-renderer";
import DOMPurify from "isomorphic-dompurify";

interface MathExplanation {
  id: string;
  title: string;
  content?: string;
  latex?: string;
  latexEquation?: string;
  equation?: string;
  explanation?: string;
  imageUrl?: string;
  mode?: string;
  isPublished?: boolean;
  position?: number;
}

interface MathLatexRendererProps {
  math: MathExplanation;
  isCompleted: boolean;
  canMarkComplete: boolean;
  onMarkComplete: (id: string) => void;
}

export function MathLatexRenderer({
  math,
  isCompleted,
  canMarkComplete,
  onMarkComplete,
}: MathLatexRendererProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get the LaTeX equation to display
  const getLatexEquation = (): string | null => {
    if (math.latexEquation) return cleanLatex(math.latexEquation);
    if (math.latex) return cleanLatex(math.latex);
    if (math.equation) return cleanLatex(math.equation);
    return null;
  };

  const latexEquation = getLatexEquation();
  const hasExplanation = !!(math.explanation || math.content);

  const copyToClipboard = async () => {
    const textToCopy = math.latexEquation || math.latex || math.equation || "";
    if (!textToCopy) {
      toast.info("No equation to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Equation copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy equation");
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      isCompleted && "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/10"
    )}>
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b border-purple-100 dark:border-purple-900/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 shrink-0">
              <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {math.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {math.mode && (
              <Badge variant="secondary" className="text-xs">
                {math.imageUrl && !latexEquation ? "Visual" : "LaTeX"}
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Done
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Equation Display */}
        <div className="relative group">
          {latexEquation ? (
            <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-50/50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/20 border-b border-purple-100 dark:border-purple-900/30">
              <div className="flex justify-center overflow-x-auto">
                <KaTeXRenderer
                  math={latexEquation}
                  displayMode={true}
                  className="text-lg"
                />
              </div>
              {/* Copy button */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyToClipboard}
                  className={cn(
                    "h-8 px-2 text-xs",
                    copied && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : math.imageUrl ? (
            <div className="p-4 sm:p-6 flex justify-center bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
              <Image
                src={math.imageUrl}
                alt={`Mathematical representation for ${math.title}`}
                width={600}
                height={400}
                className="max-w-full h-auto rounded-lg shadow-sm"
                style={{ objectFit: "contain" }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/placeholder-math-image.svg";
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Explanation Section */}
        {hasExplanation && (
          <div className="border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span>View Explanation</span>
              {showExplanation ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    {/* Rich text content */}
                    {math.content && (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none
                          prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                          prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                          prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold
                          prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-purple-600 dark:prose-code:text-purple-400 prose-code:font-mono prose-code:text-sm
                          prose-pre:bg-gray-900 prose-pre:rounded-lg prose-pre:shadow-md
                          prose-ul:space-y-1 prose-ol:space-y-1
                          prose-li:text-gray-700 dark:prose-li:text-gray-300
                          prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                          prose-blockquote:border-l-purple-500 prose-blockquote:bg-purple-50 dark:prose-blockquote:bg-purple-900/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                          prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:shadow-md prose-img:my-4"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(math.content, {
                            ALLOWED_TAGS: [
                              "p", "br", "strong", "b", "i", "em", "u", "ul", "ol", "li",
                              "h1", "h2", "h3", "h4", "h5", "h6", "span", "div", "sub", "sup",
                              "a", "img", "blockquote", "pre", "code",
                              "math", "mi", "mn", "mo", "mrow", "msup", "msub", "mfrac", "mtext"
                            ],
                            ALLOWED_ATTR: ["class", "style", "href", "src", "alt", "width", "height", "target", "rel"],
                          })
                        }}
                      />
                    )}

                    {/* Plain text explanation */}
                    {math.explanation && (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none mt-3
                          prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                          prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                          prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:shadow-md prose-img:my-4"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(math.explanation, {
                            ALLOWED_TAGS: [
                              "p", "br", "strong", "b", "i", "em", "u", "ul", "ol", "li",
                              "h1", "h2", "h3", "h4", "h5", "h6", "span", "div",
                              "a", "img", "blockquote", "pre", "code"
                            ],
                            ALLOWED_ATTR: ["class", "style", "href", "src", "alt", "width", "height", "target", "rel"],
                          })
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Mark as complete button */}
        {canMarkComplete && !isCompleted && (
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={() => onMarkComplete(math.id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Understood
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Initialize MathJax configuration (kept for backwards compatibility)
 * New implementation uses KaTeX which doesn't require initialization
 */
export function initMathJax() {
  // KaTeX is used now - no initialization needed
  // This function is kept for backwards compatibility with existing imports
}
