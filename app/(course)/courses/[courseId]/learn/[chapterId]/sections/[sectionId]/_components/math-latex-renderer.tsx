"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calculator, Copy, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";

// Note: You'll need to add these scripts to your layout or install via npm:
// <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
// <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

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
  const mathRef = useRef<HTMLDivElement>(null);
  const equationRef = useRef<HTMLDivElement>(null);

  // Render LaTeX using MathJax
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).MathJax) {
      // Re-typeset the math content
      if (mathRef.current) {
        (window as any).MathJax.typesetPromise([mathRef.current]).catch((e: any) =>
          console.error("MathJax typesetting failed:", e)
        );
      }
      if (equationRef.current && (math.latex || math.latexEquation)) {
        (window as any).MathJax.typesetPromise([equationRef.current]).catch((e: any) =>
          console.error("MathJax equation typesetting failed:", e)
        );
      }
    }
  }, [math.latex, math.latexEquation, math.content]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Equation copied to clipboard!");
  };

  const openFullscreen = () => {
    if (mathRef.current) {
      if (mathRef.current.requestFullscreen) {
        mathRef.current.requestFullscreen();
      }
    }
  };

  // Determine which equation format to display
  const getEquationDisplay = () => {
    if (math.latexEquation) {
      return `\\[${math.latexEquation}\\]`;
    }
    if (math.latex) {
      return `\\[${math.latex}\\]`;
    }
    if (math.equation) {
      return math.equation;
    }
    return null;
  };

  const equationDisplay = getEquationDisplay();

  return (
    <Card className={cn("overflow-hidden", isCompleted && "border-green-500")}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-500" />
              {math.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {math.mode && (
              <Badge variant="outline" className="text-xs">
                {math.mode}
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main equation display */}
        {equationDisplay && (
          <div className="relative group">
            <div
              ref={equationRef}
              className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="text-center text-lg font-mono">{equationDisplay}</div>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(equationDisplay)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={openFullscreen}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content with inline math */}
        {math.content && (
          <div
            ref={mathRef}
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(math.content, {
                ALLOWED_TAGS: [
                  "p", "br", "strong", "b", "i", "em", "u", "ul", "ol", "li",
                  "h1", "h2", "h3", "h4", "h5", "h6", "span", "div", "sub", "sup",
                  "math", "mi", "mn", "mo", "mrow", "msup", "msub", "mfrac", "mtext"
                ],
                ALLOWED_ATTR: ["class", "style"],
              })
            }}
          />
        )}

        {/* Plain text explanation */}
        {math.explanation && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm">{math.explanation}</p>
            </div>
          </div>
        )}

        {/* Image representation if available */}
        {math.imageUrl && (
          <div className="mt-4">
            <img
              src={math.imageUrl}
              alt={`Mathematical representation for ${math.title}`}
              className="w-full rounded-lg"
            />
          </div>
        )}

        {/* Mark as complete button */}
        {canMarkComplete && !isCompleted && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => onMarkComplete(math.id)}
          >
            Mark as Understood
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Initialize MathJax configuration
 * Call this in your layout or app initialization
 */
export function initMathJax() {
  if (typeof window !== "undefined" && !(window as any).MathJax) {
    (window as any).MathJax = {
      tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        displayMath: [["$$", "$$"], ["\\[", "\\]"]],
        processEscapes: true,
        processEnvironments: true,
      },
      options: {
        skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"],
      },
      startup: {
        pageReady: () => {
          return (window as any).MathJax.startup.defaultPageReady().then(() => {
            console.log("MathJax initial typesetting complete");
          });
        },
      },
    };

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    document.head.appendChild(script);
  }
}