"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Save, Eye, Code2, Trash2, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { MonacoCodePane } from "./MonacoCodePane";
import { ExplanationPane } from "./ExplanationPane";
import { useCodeExplanations } from "./hooks/useCodeExplanations";
import { useLineSelection } from "./hooks/useLineSelection";
import type {
  CodeExplanationEditorProps,
  CodeExplanationGroup,
  LineExplanation,
  SupportedLanguage,
  LineRange,
  AddExplanationFormData,
  UpdateExplanationFormData,
} from "./code-explanation.types";
import { SUPPORTED_LANGUAGES, doRangesOverlap } from "./code-explanation.types";

/**
 * CodeExplanationEditor - Main container for the two-column code explanation editor
 *
 * Features:
 * - Two-column layout: Monaco Editor (left) + Explanations (right)
 * - Create new code blocks with line-by-line explanations
 * - Edit existing code blocks and explanations
 * - Visual connection between code lines and explanations
 */
export function CodeExplanationEditor({
  courseId,
  chapterId,
  sectionId,
  initialData,
  onSave,
  onCancel,
}: CodeExplanationEditorProps) {
  // State for the code block being edited
  const [title, setTitle] = useState(initialData?.title || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [language, setLanguage] = useState<SupportedLanguage>(
    (initialData?.language as SupportedLanguage) || "typescript"
  );
  const [explanations, setExplanations] = useState<LineExplanation[]>(
    initialData?.explanations || []
  );
  const [codeBlockId, setCodeBlockId] = useState<string | null>(
    initialData?.id || null
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [hoveredExplanation, setHoveredExplanation] =
    useState<LineExplanation | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Hooks
  const {
    codeBlocks,
    isLoading,
    refetch,
    createCodeBlock,
    addExplanation,
    updateExplanation,
    deleteExplanation,
    deleteCodeBlock,
    updateCodeBlock,
  } = useCodeExplanations({ courseId, chapterId, sectionId });

  const { selectedRange, clearSelection, setSelection } = useLineSelection();

  // Load initial data on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // If we have code blocks and no initial data, load the first one
  useEffect(() => {
    if (!initialData && codeBlocks.length > 0 && !codeBlockId) {
      const firstBlock = codeBlocks[0];
      setCodeBlockId(firstBlock.id);
      setTitle(firstBlock.title);
      setCode(firstBlock.code);
      setLanguage(firstBlock.language);
      setExplanations(firstBlock.explanations || []);
    }
  }, [codeBlocks, initialData, codeBlockId]);

  /**
   * Handle line selection from Monaco Editor
   */
  const handleLineSelect = useCallback(
    (range: LineRange) => {
      // Check for overlapping explanations
      const safeExplanations = explanations || [];
      const hasOverlap = safeExplanations.some((exp) =>
        doRangesOverlap(range, { start: exp.lineStart, end: exp.lineEnd })
      );

      if (hasOverlap) {
        toast.warning("Selected lines overlap with an existing explanation");
      }

      setSelection(range);
    },
    [explanations, setSelection]
  );

  /**
   * Handle adding a new explanation
   */
  const handleAddExplanation = useCallback(
    async (data: AddExplanationFormData) => {
      // If no code block exists yet, create one first
      if (!codeBlockId) {
        if (!title.trim()) {
          toast.error("Please enter a title for the code block");
          return;
        }
        if (!code.trim()) {
          toast.error("Please enter some code first");
          return;
        }

        setIsSaving(true);
        try {
          const newBlock = await createCodeBlock({
            title,
            code,
            language,
            explanations: [data],
          });
          setCodeBlockId(newBlock.id);
          setExplanations(newBlock.explanations);
          clearSelection();
        } finally {
          setIsSaving(false);
        }
        return;
      }

      // Add explanation to existing block
      setIsSaving(true);
      try {
        const newExp = await addExplanation(codeBlockId, data);
        setExplanations((prev) =>
          [...prev, newExp].sort((a, b) => a.lineStart - b.lineStart)
        );
        clearSelection();
      } finally {
        setIsSaving(false);
      }
    },
    [
      codeBlockId,
      title,
      code,
      language,
      createCodeBlock,
      addExplanation,
      clearSelection,
    ]
  );

  /**
   * Handle editing an explanation
   */
  const handleEditExplanation = useCallback(
    async (expId: string, data: UpdateExplanationFormData) => {
      setIsSaving(true);
      try {
        await updateExplanation(expId, data);
        setExplanations((prev) =>
          prev.map((exp) =>
            exp.id === expId
              ? {
                  ...exp,
                  title: data.title ?? exp.title,
                  explanation: data.explanation ?? exp.explanation,
                  lineStart: data.lineStart ?? exp.lineStart,
                  lineEnd: data.lineEnd ?? exp.lineEnd,
                }
              : exp
          )
        );
      } finally {
        setIsSaving(false);
      }
    },
    [updateExplanation]
  );

  /**
   * Handle deleting an explanation
   */
  const handleDeleteExplanation = useCallback(
    async (expId: string) => {
      setIsSaving(true);
      try {
        await deleteExplanation(expId);
        setExplanations((prev) => prev.filter((exp) => exp.id !== expId));
      } finally {
        setIsSaving(false);
      }
    },
    [deleteExplanation]
  );

  /**
   * Handle clicking on an explanation to highlight its lines
   */
  const handleExplanationClick = useCallback(
    (exp: LineExplanation) => {
      setSelection({ start: exp.lineStart, end: exp.lineEnd });
      setHoveredExplanation(exp);
    },
    [setSelection]
  );

  /**
   * Handle code change
   */
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  /**
   * Save the code block
   */
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!code.trim()) {
      toast.error("Please enter some code");
      return;
    }

    setIsSaving(true);
    try {
      if (codeBlockId) {
        // Update existing block
        await updateCodeBlock(codeBlockId, { title, code, language });
      } else {
        // Create new block
        const newBlock = await createCodeBlock({
          title,
          code,
          language,
          explanations: [],
        });
        setCodeBlockId(newBlock.id);
      }
      toast.success("Code block saved successfully");
      onSave?.();
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    code,
    language,
    codeBlockId,
    updateCodeBlock,
    createCodeBlock,
    onSave,
  ]);

  /**
   * Delete the entire code block
   */
  const handleDeleteBlock = useCallback(async () => {
    if (!codeBlockId) return;

    setIsSaving(true);
    try {
      await deleteCodeBlock(codeBlockId);
      // Reset state
      setCodeBlockId(null);
      setTitle("");
      setCode("");
      setLanguage("typescript");
      setExplanations([]);
      clearSelection();
      toast.success("Code block deleted");
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
    }
  }, [codeBlockId, deleteCodeBlock, clearSelection]);

  /**
   * Create a new code block (reset form)
   */
  const handleNewBlock = useCallback(() => {
    setCodeBlockId(null);
    setTitle("");
    setCode("");
    setLanguage("typescript");
    setExplanations([]);
    clearSelection();
  }, [clearSelection]);

  // Calculate line count
  const lineCount = useMemo(() => code.split("\n").length, [code]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/10">
          <CardHeader className="pb-3 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                  <Code2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Code Explanation Editor
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Add code and create line-by-line explanations
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {codeBlockId && (
                  <Badge variant="outline" className="text-xs">
                    {(explanations || []).length} explanations
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {lineCount} lines
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Code block title..."
            className="max-w-xs text-sm"
          />
          <Select
            value={language}
            onValueChange={(val) => setLanguage(val as SupportedLanguage)}
          >
            <SelectTrigger className="w-36 text-sm">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleNewBlock}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Block
          </Button>
          {codeBlockId && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            {isPreview ? "Edit" : "Preview"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Main Editor Area - Two Column Layout (same width as display) */}
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-5 h-[500px]">
          {/* Left Column - Monaco Editor (60%) */}
          <div className="lg:col-span-3 border-r border-gray-200 dark:border-gray-700 h-full overflow-hidden">
            <MonacoCodePane
              code={code}
              language={language}
              explanations={explanations}
              selectedRange={selectedRange}
              onCodeChange={handleCodeChange}
              onLineSelect={handleLineSelect}
              onExplanationHover={setHoveredExplanation}
              readOnly={isPreview}
            />
          </div>

          {/* Right Column - Explanations (40%) */}
          <div className="lg:col-span-2 h-full overflow-hidden">
            <ExplanationPane
              explanations={explanations}
              selectedRange={selectedRange}
              highlightedExplanation={hoveredExplanation}
              onAddExplanation={handleAddExplanation}
              onEditExplanation={handleEditExplanation}
              onDeleteExplanation={handleDeleteExplanation}
              onExplanationClick={handleExplanationClick}
              onClearSelection={clearSelection}
              isLoading={isSaving}
            />
          </div>
        </div>
      </Card>

      {/* Code blocks list */}
      {codeBlocks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Existing Code Blocks
          </h4>
          <div className="flex flex-wrap gap-2">
            {codeBlocks.map((block) => (
              <Button
                key={block.id}
                size="sm"
                variant={codeBlockId === block.id ? "default" : "outline"}
                onClick={() => {
                  setCodeBlockId(block.id);
                  setTitle(block.title);
                  setCode(block.code);
                  setLanguage(block.language);
                  setExplanations(block.explanations || []);
                  clearSelection();
                }}
              >
                {block.title}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {(block.explanations || []).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteBlock}
      />
    </div>
  );
}
