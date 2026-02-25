"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Eye, EyeOff, Loader2, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExplanationTooltip } from "./ExplanationTooltip";
import { CodeBlockEditModal } from "./CodeBlockEditModal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
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
}

export const UnifiedCodeView = ({
  courseId,
  chapterId,
  sectionId,
}: UnifiedCodeViewProps) => {
  const [blocks, setBlocks] = useState<CodeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openTooltips, setOpenTooltips] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [showExplanations, setShowExplanations] = useState(true);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<CodeBlock | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
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

  // Calculate smart tooltip position that stays within viewport
  const calculateTooltipPosition = (buttonElement: HTMLElement) => {
    const tooltipWidth = 384; // w-96 = 384px (24rem)
    const tooltipHeight = 400; // Approximate max height
    const offset = 10;

    const buttonRect = buttonElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Start position near the button
    let x = buttonRect.right + offset;
    let y = buttonRect.top;

    // Check right boundary - if tooltip would go off-screen, position it to the left
    if (x + tooltipWidth > viewportWidth) {
      x = buttonRect.left - tooltipWidth - offset;
    }

    // Check left boundary - ensure it does not go off left edge
    if (x < 0) {
      x = offset;
    }

    // Check bottom boundary
    if (y + tooltipHeight > viewportHeight) {
      y = viewportHeight - tooltipHeight - offset;
    }

    // Check top boundary
    if (y < 0) {
      y = offset;
    }

    return { x, y };
  };

  // Handle show explanation button click
  const handleShowExplanation = (
    blockId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block?.explanation) {
      toast.info('No explanation available for this block');
      return;
    }

    // If already open, do nothing
    if (openTooltips.has(blockId)) {
      toast.info('Explanation is already visible');
      return;
    }

    // Add new tooltip to the map with its position
    const position = calculateTooltipPosition(event.currentTarget);
    setOpenTooltips(prev => new Map(prev).set(blockId, position));
  };

  // Handle tooltip close
  const handleTooltipClose = (blockId: string) => {
    // Remove from open tooltips
    setOpenTooltips(prev => {
      const newMap = new Map(prev);
      newMap.delete(blockId);
      return newMap;
    });
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

  // Edit block
  const handleEdit = (block: CodeBlock) => {
    setEditingBlock(block);
    setIsEditModalOpen(true);
  };

  // Delete block
  const handleDelete = async (blockId: string) => {
    try {
      setIsDeletingId(blockId);

      await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-explanations/${blockId}`
      );

      // Remove from blocks state
      setBlocks(prev => prev.filter(b => b.id !== blockId));

      // Close any open tooltip for this block
      setOpenTooltips(prev => {
        const newMap = new Map(prev);
        newMap.delete(blockId);
        return newMap;
      });

      toast.success('Code block deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete code block');
      console.error('Delete error:', error);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Handle edit success
  const handleEditSuccess = () => {
    // Refetch blocks
    const fetchBlocks = async () => {
      try {
        const response = await axios.get(
          `/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/code-blocks`
        );
        if (response.data.success) {
          setBlocks(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch code blocks:', error);
      }
    };

    fetchBlocks();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 sm:py-12 flex flex-col items-center justify-center gap-2 sm:gap-3">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
          <p className="text-xs sm:text-sm text-muted-foreground">Loading code blocks...</p>
        </CardContent>
      </Card>
    );
  }

  if (sortedBlocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 sm:py-8 text-center text-muted-foreground px-3 sm:px-6">
          <p className="text-xs sm:text-sm">No code blocks yet. Add your first code block to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 p-3 sm:p-6">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold">
              Complete Code Implementation
            </CardTitle>
            <Badge variant="outline" className="gap-1 text-xs flex-shrink-0">
              {sortedBlocks.length} {sortedBlocks.length === 1 ? 'Block' : 'Blocks'}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-xs flex-shrink-0">
              {totalLines} Lines
            </Badge>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {language}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full xs:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanations(!showExplanations)}
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm flex-1 xs:flex-none"
            >
              {showExplanations ? (
                <>
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Hide Explanations</span>
                  <span className="xs:hidden">Hide</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Show Explanations</span>
                  <span className="xs:hidden">Show</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm flex-1 xs:flex-none"
            >
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Copy All</span>
              <span className="xs:hidden">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm flex-1 xs:flex-none"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Download</span>
              <span className="xs:hidden">DL</span>
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
            >
              {/* Block Header */}
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-200 dark:border-blue-800">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 break-words">
                    {block.title}
                  </span>
                  {!block.explanation && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 flex-shrink-0">
                      No explanation yet
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 w-full xs:w-auto">
                  {block.explanation && showExplanations && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleShowExplanation(block.id, e)}
                      className={`h-7 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-xs font-medium flex-1 xs:flex-none ${
                        openTooltips.has(block.id)
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-700 dark:hover:text-white'
                      }`}
                    >
                      <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                      <span className="hidden xs:inline">{openTooltips.has(block.id) ? 'Shown' : 'Show Explanation'}</span>
                      <span className="xs:hidden">{openTooltips.has(block.id) ? 'Shown' : 'Explain'}</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyBlock(block.id)}
                    className={`h-7 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-xs font-medium ${
                      copiedBlockId === block.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-600 hover:text-white dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white'
                    }`}
                  >
                    {copiedBlockId === block.id ? (
                      <>✓ Copied</>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                        <span className="hidden xs:inline">Copy</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(block)}
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-700 dark:hover:text-white"
                  >
                    <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                    <span className="hidden xs:inline">Edit</span>
                  </Button>
                  <ConfirmModal onConfirm={() => handleDelete(block.id)}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeletingId === block.id}
                      className="h-7 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-xs font-medium bg-red-100 text-red-700 hover:bg-red-600 hover:text-white dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                      <span className="hidden xs:inline">{isDeletingId === block.id ? 'Deleting...' : 'Delete'}</span>
                      <span className="xs:hidden">{isDeletingId === block.id ? '...' : 'Del'}</span>
                    </Button>
                  </ConfirmModal>
                </div>
              </div>

              {/* Code Block */}
              <div className="relative group overflow-x-auto">
                <div className="p-2 sm:p-3 md:p-4">
                  <SyntaxHighlighter
                    language={block.language}
                    style={vscDarkPlus}
                    showLineNumbers
                    startingLineNumber={block.lineStart || 1}
                    customStyle={{
                      margin: 0,
                      padding: 0,
                      background: 'transparent',
                      fontSize: '0.7rem',
                    }}
                    lineNumberStyle={{
                      minWidth: '2rem',
                      paddingRight: '0.5rem',
                      color: '#6B7280',
                      fontSize: '0.65rem',
                    }}
                    PreTag="div"
                  >
                    {block.code}
                  </SyntaxHighlighter>
                </div>

                {/* Active block overlay - shows when explanation is displayed */}
                {openTooltips.has(block.id) && (
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Explanation Tooltips - Multiple can be open */}
        <AnimatePresence>
          {showExplanations && Array.from(openTooltips.entries()).map(([blockId, position]) => {
            const block = blocks.find(b => b.id === blockId);
            if (!block) return null;

            return (
              <ExplanationTooltip
                key={blockId}
                explanation={block.explanation || ''}
                title={block.title}
                position={position}
                onClose={() => handleTooltipClose(blockId)}
              />
            );
          })}
        </AnimatePresence>
      </CardContent>

      {/* Edit Code Block Modal */}
      {editingBlock && (
        <CodeBlockEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBlock(null);
          }}
          courseId={courseId}
          chapterId={chapterId}
          sectionId={sectionId}
          blockId={editingBlock.id}
          initialData={{
            title: editingBlock.title,
            language: editingBlock.language,
            code: editingBlock.code,
            explanation: editingBlock.explanation,
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </Card>
  );
};
