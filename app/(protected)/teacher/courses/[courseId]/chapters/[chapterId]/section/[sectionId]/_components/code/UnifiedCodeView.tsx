"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Download, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExplanationTooltip } from "./ExplanationTooltip";
import axios from "axios";

interface CodeBlock {
  id: string;
  title: string;
  code: string;
  explanation: string | null;
  language: string;
  position: number;
  lineStart: number | null;
  lineEnd: number | null;
}

interface UnifiedCodeViewProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  onEdit?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
}

export const UnifiedCodeView = ({
  courseId,
  chapterId,
  sectionId,
  onEdit,
  onDelete
}: UnifiedCodeViewProps) => {
  const [blocks, setBlocks] = useState<CodeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showExplanations, setShowExplanations] = useState(true);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch code blocks
  useEffect(() => {
    const fetchBlocks = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-blocks`
        );
        if (response.data.success) {
          setBlocks(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch code blocks:', error);
        toast.error('Failed to load code blocks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [courseId, chapterId, sectionId]);

  // Sort blocks by position
  const sortedBlocks = Array.isArray(blocks)
    ? [...blocks].sort((a, b) => a.position - b.position)
    : [];

  // Combine all code into unified view
  const unifiedCode = sortedBlocks
    .map(block => `// ${block.title}\n${block.code}`)
    .join('\n\n');

  const totalLines = unifiedCode.split('\n').length;
  const language = sortedBlocks[0]?.language || 'typescript';

  // Handle mouse hover on code blocks
  const handleBlockHover = (
    blockId: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!showExplanations) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block?.explanation) return;

    setHoveredBlockId(blockId);

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 16,
      y: rect.top
    });
  };

  const handleBlockLeave = () => {
    setHoveredBlockId(null);
  };

  // Copy entire code to clipboard
  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(unifiedCode);
      toast.success('Code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  // Copy individual block
  const handleCopyBlock = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    try {
      await navigator.clipboard.writeText(block.code);
      setCopiedBlockId(blockId);
      toast.success(`"${block.title}" copied!`);
      setTimeout(() => setCopiedBlockId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  // Download as file
  const handleDownload = () => {
    const blob = new Blob([unifiedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-complete.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading code blocks...</p>
        </CardContent>
      </Card>
    );
  }

  if (sortedBlocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No code blocks yet. Add your first code block to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-bold">
              Complete Code Implementation
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              {sortedBlocks.length} {sortedBlocks.length === 1 ? 'Block' : 'Blocks'}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {totalLines} Lines
            </Badge>
            <Badge variant="secondary">
              {language}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanations(!showExplanations)}
              className="gap-2"
            >
              {showExplanations ? (
                <>
                  <Eye className="h-4 w-4" />
                  Hide Explanations
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Show Explanations
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative" ref={containerRef}>
        <div className="relative">
          {sortedBlocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative border-b border-gray-200 dark:border-gray-800 last:border-b-0"
              onMouseEnter={(e) => handleBlockHover(block.id, e)}
              onMouseLeave={handleBlockLeave}
            >
              {/* Block Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {block.title}
                  </span>
                  {block.explanation && showExplanations && (
                    <Badge variant="secondary" className="text-xs">
                      💡 Hover for explanation
                    </Badge>
                  )}
                  {!block.explanation && (
                    <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                      No explanation yet
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyBlock(block.id)}
                    className="h-7 px-2 text-xs"
                  >
                    {copiedBlockId === block.id ? (
                      <>✓ Copied</>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(block.id)}
                      className="h-7 px-2 text-xs"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Code Block */}
              <div className="relative group">
                <SyntaxHighlighter
                  language={block.language}
                  style={vscDarkPlus}
                  showLineNumbers
                  startingLineNumber={block.lineStart || 1}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: 'transparent',
                    fontSize: '0.875rem',
                  }}
                  lineNumberStyle={{
                    minWidth: '3rem',
                    paddingRight: '1rem',
                    color: '#6B7280',
                  }}
                >
                  {block.code}
                </SyntaxHighlighter>

                {/* Hover overlay */}
                {block.explanation && showExplanations && hoveredBlockId === block.id && (
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Explanation Tooltip */}
        <AnimatePresence>
          {hoveredBlockId && showExplanations && (
            <ExplanationTooltip
              explanation={blocks.find(b => b.id === hoveredBlockId)?.explanation || ''}
              title={blocks.find(b => b.id === hoveredBlockId)?.title || ''}
              position={tooltipPosition}
              onClose={() => setHoveredBlockId(null)}
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
