"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Code2,
  Copy,
  Download,
  Check,
  X,
  Columns,
  Square,
  Loader2,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { useCodeExplanations } from "./hooks/useCodeExplanations";
import type { CodeExplanationGroup, LineExplanation } from "./code-explanation.types";
import { getExplanationColor, getExplanationBorderColor } from "./code-explanation.types";
import { createRichSanitizedMarkup } from '@/lib/utils/sanitize-html';

// Lazy-load syntax highlighter
const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter/dist/esm/prism-async-light").then((m) => m.default),
  { ssr: false }
);

import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type ViewMode = "side-by-side" | "modal";

interface CodeExplanationDisplayProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
}

/**
 * CodeExplanationDisplay - Display saved code explanations with viewing options
 *
 * Features:
 * - Two viewing modes: Side-by-side and Modal
 * - Clickable highlighted code sections
 * - Navigation between explanations
 * - Copy and download functionality
 */
export function CodeExplanationDisplay({
  courseId,
  chapterId,
  sectionId,
}: CodeExplanationDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [selectedBlock, setSelectedBlock] = useState<CodeExplanationGroup | null>(null);
  const [activeExplanation, setActiveExplanation] = useState<LineExplanation | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { codeBlocks, isLoading, refetch } = useCodeExplanations({
    courseId,
    chapterId,
    sectionId,
  });

  // Load data on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-select first block when loaded
  useEffect(() => {
    if (codeBlocks.length > 0 && !selectedBlock) {
      setSelectedBlock(codeBlocks[0]);
    }
  }, [codeBlocks, selectedBlock]);

  // Get sorted explanations for current block
  const sortedExplanations = useMemo(() => {
    if (!selectedBlock) return [];
    return [...(selectedBlock.explanations || [])].sort(
      (a, b) => a.lineStart - b.lineStart
    );
  }, [selectedBlock]);

  // Find explanation for a line
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
        if (viewMode === "modal") {
          setIsModalOpen(true);
        }
      }
    },
    [getExplanationForLine, viewMode]
  );

  // Copy code
  const handleCopy = useCallback(async () => {
    if (!selectedBlock) return;
    try {
      await navigator.clipboard.writeText(selectedBlock.code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  }, [selectedBlock]);

  // Download code
  const handleDownload = useCallback(() => {
    if (!selectedBlock) return;
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
    };

    const ext = extensions[selectedBlock.language] || "txt";
    const blob = new Blob([selectedBlock.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedBlock.title.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded");
  }, [selectedBlock]);

  // Line props for syntax highlighter
  const lineProps = useCallback(
    (lineNumber: number): React.HTMLAttributes<HTMLElement> => {
      const result = getExplanationForLine(lineNumber);
      const isHovered =
        hoveredLine !== null &&
        result?.explanation &&
        lineNumber >= result.explanation.lineStart &&
        lineNumber <= result.explanation.lineEnd;
      const isActive =
        activeExplanation && result?.explanation?.id === activeExplanation.id;
      const colorIndex = result?.index ?? 0;
      const colors = {
        bg: getExplanationColor(colorIndex),
        border: getExplanationBorderColor(colorIndex),
        hover: getExplanationColor(colorIndex).replace("0.15", "0.25"),
      };

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading code explanations...</p>
        </CardContent>
      </Card>
    );
  }

  if (codeBlocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-sm text-muted-foreground mb-2">No code explanations yet</p>
          <p className="text-xs text-gray-400">
            Switch to the Code Editor tab to create your first code explanation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/10">
        <CardHeader className="pb-3 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Code Explanations
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Click highlighted code to view explanations
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* View Mode Toggle & Code Block Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Code Block Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {codeBlocks.map((block) => (
            <Button
              key={block.id}
              size="sm"
              variant={selectedBlock?.id === block.id ? "default" : "outline"}
              onClick={() => {
                setSelectedBlock(block);
                setActiveExplanation(null);
              }}
            >
              {block.title}
              <Badge variant="secondary" className="ml-2 text-xs">
                {(block.explanations || []).length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
        >
          <ToggleGroupItem
            value="side-by-side"
            aria-label="Side by side view"
            className="text-xs px-3"
          >
            <Columns className="h-3.5 w-3.5 mr-1.5" />
            Side by Side
          </ToggleGroupItem>
          <ToggleGroupItem
            value="modal"
            aria-label="Modal view"
            className="text-xs px-3"
          >
            <Square className="h-3.5 w-3.5 mr-1.5" />
            Modal
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Main Content */}
      {selectedBlock && (
        <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
          {/* Code Block Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {selectedBlock.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedBlock.language.toUpperCase()} &bull;{" "}
                    {sortedExplanations.length} explanations
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

          {/* Content Area - Depends on View Mode */}
          {viewMode === "side-by-side" ? (
            <SideBySideView
              code={selectedBlock.code}
              language={selectedBlock.language}
              explanations={sortedExplanations}
              activeExplanation={activeExplanation}
              lineProps={lineProps}
              onExplanationClick={setActiveExplanation}
              onClearActive={() => setActiveExplanation(null)}
            />
          ) : (
            <ModalCodeView
              code={selectedBlock.code}
              language={selectedBlock.language}
              explanations={sortedExplanations}
              lineProps={lineProps}
            />
          )}
        </Card>
      )}

      {/* Explanation Modal (for modal view mode) */}
      <Dialog open={isModalOpen && viewMode === "modal"} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-medium">
                {activeExplanation?.lineStart === activeExplanation?.lineEnd
                  ? `Line ${activeExplanation?.lineStart}`
                  : `Lines ${activeExplanation?.lineStart}-${activeExplanation?.lineEnd}`}
              </Badge>
              <span className="text-gray-900 dark:text-gray-100">
                {activeExplanation?.title}
              </span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
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
                dangerouslySetInnerHTML={createRichSanitizedMarkup(activeExplanation?.explanation || "")}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Side-by-Side View Component
 */
interface SideBySideViewProps {
  code: string;
  language: string;
  explanations: LineExplanation[];
  activeExplanation: LineExplanation | null;
  lineProps: (lineNumber: number) => React.HTMLAttributes<HTMLElement>;
  onExplanationClick: (exp: LineExplanation) => void;
  onClearActive: () => void;
}

function SideBySideView({
  code,
  language,
  explanations,
  activeExplanation,
  lineProps,
  onExplanationClick,
  onClearActive,
}: SideBySideViewProps) {
  const safeExplanations = explanations || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-[500px]">
      {/* Code Column (50%) - horizontally scrollable */}
      <div className="border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
        {/* Hint banner */}
        {safeExplanations.length > 0 && !activeExplanation && (
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
                  onClick={onClearActive}
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
                    dangerouslySetInnerHTML={createRichSanitizedMarkup(activeExplanation.explanation)}
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
              {safeExplanations.length > 0 && (
                <div className="mt-6 space-y-2 w-full max-w-[240px]">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                    Quick jump:
                  </p>
                  {safeExplanations.slice(0, 5).map((exp, idx) => (
                    <Button
                      key={exp.id}
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start text-left text-xs"
                      onClick={() => onExplanationClick(exp)}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                        style={{
                          backgroundColor: getExplanationBorderColor(idx),
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
  );
}

/**
 * Modal Code View - Full width code display
 */
interface ModalCodeViewProps {
  code: string;
  language: string;
  explanations: LineExplanation[];
  lineProps: (lineNumber: number) => React.HTMLAttributes<HTMLElement>;
}

function ModalCodeView({ code, language, explanations, lineProps }: ModalCodeViewProps) {
  const safeExplanations = explanations || [];

  return (
    <div className="relative">
      {/* Hint banner */}
      {safeExplanations.length > 0 && (
        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
          <Square className="h-3.5 w-3.5" />
          Click highlighted sections to open explanation modal
        </div>
      )}

      {/* Code display - horizontally scrollable */}
      <div
        className="bg-[#1e1e1e] max-h-[500px]"
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
            minHeight: "400px",
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
  );
}
