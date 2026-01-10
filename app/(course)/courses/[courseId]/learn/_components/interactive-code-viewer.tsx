"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, X, BookOpen, Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Lazy-load syntax highlighter with proper typing
const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter/dist/esm/prism-async-light").then((m) => m.default),
  { ssr: false }
);
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * Line explanation data structure
 */
interface LineExplanation {
  id: string;
  title: string;
  explanation: string;
  lineStart: number;
  lineEnd: number;
  position: number;
}

/**
 * Code block with explanations
 */
interface CodeExplanationGroup {
  id: string;
  title: string;
  code: string;
  language: string;
  explanations: LineExplanation[];
}

interface InteractiveCodeViewerProps {
  codeBlock: CodeExplanationGroup;
}

// Colors for highlighting different explanations
const HIGHLIGHT_COLORS = [
  { bg: "rgba(59, 130, 246, 0.25)", border: "rgba(59, 130, 246, 0.6)", hover: "rgba(59, 130, 246, 0.35)" },
  { bg: "rgba(16, 185, 129, 0.25)", border: "rgba(16, 185, 129, 0.6)", hover: "rgba(16, 185, 129, 0.35)" },
  { bg: "rgba(245, 158, 11, 0.25)", border: "rgba(245, 158, 11, 0.6)", hover: "rgba(245, 158, 11, 0.35)" },
  { bg: "rgba(139, 92, 246, 0.25)", border: "rgba(139, 92, 246, 0.6)", hover: "rgba(139, 92, 246, 0.35)" },
  { bg: "rgba(236, 72, 153, 0.25)", border: "rgba(236, 72, 153, 0.6)", hover: "rgba(236, 72, 153, 0.35)" },
  { bg: "rgba(6, 182, 212, 0.25)", border: "rgba(6, 182, 212, 0.6)", hover: "rgba(6, 182, 212, 0.35)" },
  { bg: "rgba(249, 115, 22, 0.25)", border: "rgba(249, 115, 22, 0.6)", hover: "rgba(249, 115, 22, 0.35)" },
  { bg: "rgba(34, 197, 94, 0.25)", border: "rgba(34, 197, 94, 0.6)", hover: "rgba(34, 197, 94, 0.35)" },
];

/**
 * InteractiveCodeViewer - Student view for code with clickable explanations
 *
 * Features:
 * - Two-column layout: Code on left (50%), explanation on right (50%)
 * - Highlighted code sections that are clickable
 * - Click to show explanation (no prev/next buttons)
 * - Horizontal scrolling for long lines
 * - Copy and download functionality
 */
export function InteractiveCodeViewer({ codeBlock }: InteractiveCodeViewerProps) {
  const [activeExplanation, setActiveExplanation] = useState<LineExplanation | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const { title, code, language, explanations } = codeBlock;

  // Sort explanations by line number (ensure it's always an array)
  const sortedExplanations = useMemo(
    () => {
      const safeExplanations = explanations || [];
      return [...safeExplanations].sort((a, b) => a.lineStart - b.lineStart);
    },
    [explanations]
  );

  // Find which explanation a line belongs to
  const getExplanationForLine = useCallback(
    (lineNumber: number): { explanation: LineExplanation; index: number } | null => {
      const index = sortedExplanations.findIndex(
        (exp) => lineNumber >= exp.lineStart && lineNumber <= exp.lineEnd
      );
      if (index !== -1) {
        return { explanation: sortedExplanations[index], index };
      }
      return null;
    },
    [sortedExplanations]
  );

  // Handle line click
  const handleLineClick = useCallback(
    (lineNumber: number) => {
      const result = getExplanationForLine(lineNumber);
      if (result) {
        setActiveExplanation(result.explanation);
      }
    },
    [getExplanationForLine]
  );

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  }, [code]);

  // Download code as file
  const handleDownload = useCallback(() => {
    const extensions: Record<string, string> = {
      typescript: "ts",
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      csharp: "cs",
      go: "go",
      rust: "rs",
      php: "php",
      ruby: "rb",
      swift: "swift",
      kotlin: "kt",
    };

    const ext = extensions[language] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded");
  }, [code, language, title]);

  // Line props for syntax highlighter
  const lineProps = useCallback(
    (lineNumber: number): React.HTMLAttributes<HTMLElement> => {
      const result = getExplanationForLine(lineNumber);
      const isHovered = hoveredLine !== null && result?.explanation
        ? lineNumber >= result.explanation.lineStart && lineNumber <= result.explanation.lineEnd
        : false;
      const isActive = activeExplanation && result?.explanation?.id === activeExplanation.id;
      const colorIndex = result?.index ?? 0;
      const colors = HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length];

      return {
        style: result
          ? {
              backgroundColor: isActive
                ? colors.hover
                : isHovered
                ? colors.hover
                : colors.bg,
              borderLeft: `3px solid ${colors.border}`,
              cursor: "pointer",
              display: "block",
              transition: "background-color 0.2s ease",
            }
          : { display: "block" },
        onClick: () => handleLineClick(lineNumber),
        onMouseEnter: () => setHoveredLine(lineNumber),
        onMouseLeave: () => setHoveredLine(null),
      };
    },
    [getExplanationForLine, hoveredLine, activeExplanation, handleLineClick]
  );

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
              <Code className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language.toUpperCase()} &bull; {sortedExplanations.length} explanations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout (50-50 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[500px]">
        {/* Code Column (50%) - horizontally scrollable */}
        <div className="border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
          {/* Hint banner */}
          {sortedExplanations.length > 0 && !activeExplanation && (
            <div className="flex-shrink-0 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Click highlighted sections to view explanations
            </div>
          )}

          {/* Code display - horizontally scrollable */}
          <div
            className="flex-1 bg-[#1e1e1e]"
            style={{ overflow: "auto" }}
          >
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: "16px",
                fontSize: "14px",
                lineHeight: "1.6",
                background: "#1e1e1e",
                overflow: "visible",
              }}
              showLineNumbers
              wrapLines={true}
              wrapLongLines={false}
              lineProps={lineProps}
              codeTagProps={{
                style: {
                  whiteSpace: "pre",
                  display: "block",
                }
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Explanation Column (50%) */}
        <div className="bg-gray-50 dark:bg-gray-900/50 h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {activeExplanation ? (
              <motion.div
                key={activeExplanation.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                {/* Explanation header */}
                <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-medium shrink-0">
                        {activeExplanation.lineStart === activeExplanation.lineEnd
                          ? `Line ${activeExplanation.lineStart}`
                          : `Lines ${activeExplanation.lineStart}-${activeExplanation.lineEnd}`}
                      </Badge>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {activeExplanation.title}
                      </h4>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 ml-2"
                    onClick={() => setActiveExplanation(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Explanation content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
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
                      dangerouslySetInnerHTML={{ __html: activeExplanation.explanation }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-6 text-center"
              >
                <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Code to Learn
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
                  Click on highlighted code sections to view detailed explanations
                </p>

                {/* Quick navigation buttons */}
                {sortedExplanations.length > 0 && (
                  <div className="mt-6 space-y-2 w-full max-w-[240px]">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                      Quick jump:
                    </p>
                    {sortedExplanations.slice(0, 5).map((exp, idx) => (
                      <Button
                        key={exp.id}
                        size="sm"
                        variant="ghost"
                        className="w-full justify-start text-left text-xs"
                        onClick={() => setActiveExplanation(exp)}
                      >
                        <div
                          className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                          style={{
                            backgroundColor:
                              HIGHLIGHT_COLORS[idx % HIGHLIGHT_COLORS.length].border,
                          }}
                        />
                        <span className="truncate">{exp.title}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
