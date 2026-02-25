"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import dynamic from "next/dynamic";
import type {
  ExplanationPaneProps,
  LineExplanation,
  AddExplanationFormData,
  UpdateExplanationFormData,
} from "./code-explanation.types";
import { formatLineRange, getExplanationColor, getExplanationBorderColor } from "./code-explanation.types";
import { createRichSanitizedMarkup } from '@/lib/utils/sanitize-html';

// Lazy-load TipTap editor
const Editor = dynamic(() => import("@/components/editor").then((mod) => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
    </div>
  ),
});

/**
 * ExplanationPane - Right panel showing list of explanations
 *
 * Features:
 * - List existing explanations with edit/delete
 * - Add new explanation form (when lines selected)
 * - Edit existing explanation inline
 * - Visual indicators matching code highlights
 */
export function ExplanationPane({
  explanations = [],
  selectedRange,
  highlightedExplanation,
  onAddExplanation,
  onEditExplanation,
  onDeleteExplanation,
  onExplanationClick,
  onClearSelection,
  isLoading = false,
}: ExplanationPaneProps) {
  // Ensure explanations is always an array
  const safeExplanations = explanations || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Start editing an explanation
   */
  const handleStartEdit = useCallback((exp: LineExplanation) => {
    setEditingId(exp.id);
    setEditTitle(exp.title);
    setEditExplanation(exp.explanation);
  }, []);

  /**
   * Cancel editing
   */
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
    setEditExplanation("");
  }, []);

  /**
   * Save edited explanation
   */
  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editTitle.trim()) return;

    setIsSaving(true);
    try {
      const data: UpdateExplanationFormData = {
        title: editTitle,
        explanation: editExplanation,
      };
      await onEditExplanation(editingId, data);
      handleCancelEdit();
    } finally {
      setIsSaving(false);
    }
  }, [editingId, editTitle, editExplanation, onEditExplanation, handleCancelEdit]);

  /**
   * Add new explanation for selected range
   */
  const handleAddNew = useCallback(async () => {
    if (!selectedRange || !newTitle.trim()) return;

    setIsSaving(true);
    try {
      const data: AddExplanationFormData = {
        title: newTitle,
        explanation: newExplanation,
        lineStart: selectedRange.start,
        lineEnd: selectedRange.end,
      };
      await onAddExplanation(data);
      setNewTitle("");
      setNewExplanation("");
      onClearSelection();
    } finally {
      setIsSaving(false);
    }
  }, [selectedRange, newTitle, newExplanation, onAddExplanation, onClearSelection]);

  /**
   * Confirm and delete explanation
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteId) return;

    setIsSaving(true);
    try {
      await onDeleteExplanation(deleteId);
    } finally {
      setDeleteId(null);
      setIsSaving(false);
    }
  }, [deleteId, onDeleteExplanation]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Explanations ({safeExplanations.length})
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Click line numbers to add explanations
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Existing explanations list */}
          <AnimatePresence mode="popLayout">
            {safeExplanations.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    highlightedExplanation?.id === exp.id
                      ? "ring-2 ring-blue-500 shadow-md"
                      : "hover:shadow-md"
                  }`}
                  style={{
                    borderLeft: `4px solid ${getExplanationBorderColor(index)}`,
                    backgroundColor:
                      highlightedExplanation?.id === exp.id
                        ? getExplanationColor(index)
                        : undefined,
                  }}
                  onClick={() => onExplanationClick(exp)}
                >
                  <CardContent className="p-3">
                    {editingId === exp.id ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Explanation title"
                          className="text-sm"
                        />
                        <div className="min-h-[100px]">
                          <Editor
                            onChange={setEditExplanation}
                            value={editExplanation}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            disabled={isSaving}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit();
                            }}
                            disabled={!editTitle.trim() || isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: getExplanationColor(index),
                                  color: getExplanationBorderColor(index),
                                }}
                              >
                                {formatLineRange({
                                  start: exp.lineStart,
                                  end: exp.lineEnd,
                                })}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {exp.title}
                            </h4>
                            {exp.explanation && (
                              <div
                                className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 prose-sm"
                                dangerouslySetInnerHTML={createRichSanitizedMarkup(exp.explanation)}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(exp);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(exp.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {safeExplanations.length === 0 && !selectedRange && (
            <div className="py-8 text-center">
              <FileText className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No explanations yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Click on line numbers in the code editor to select lines and add explanations
              </p>
            </div>
          )}

          {/* Add new explanation form (shown when lines are selected) */}
          {selectedRange && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <Card className="border-2 border-dashed border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        Add Explanation
                      </span>
                    </div>
                    <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                      {formatLineRange(selectedRange)}
                    </span>
                  </div>

                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Explanation title (e.g., 'Import statements')"
                    className="text-sm"
                  />

                  <div className="min-h-[120px]">
                    <Editor
                      onChange={setNewExplanation}
                      value={newExplanation}
                      placeholder="Write your explanation for these lines..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClearSelection}
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddNew}
                      disabled={!newTitle.trim() || isSaving}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Add Explanation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
