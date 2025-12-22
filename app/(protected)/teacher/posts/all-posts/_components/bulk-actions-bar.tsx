"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Archive,
  CheckSquare,
  Square,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Post } from "./types";

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  totalCount: number;
  posts: Post[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onExport: () => void;
  onArchive?: () => void;
  isLoading?: boolean;
}

export const BulkActionsBar = ({
  selectedIds,
  totalCount,
  posts,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onPublish,
  onUnpublish,
  onExport,
  onArchive,
  isLoading = false,
}: BulkActionsBarProps) => {
  const selectedCount = selectedIds.size;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount;

  // Count selected posts by status
  const selectedPosts = posts.filter(post => selectedIds.has(post.id));
  const publishedSelected = selectedPosts.filter(post => post.published).length;
  const draftSelected = selectedPosts.filter(post => !post.published).length;

  const SelectIcon = isAllSelected ? CheckSquare : isSomeSelected ? Minus : Square;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="sticky top-0 z-50 mx-4 mb-4"
        >
          <div className="bg-slate-900 dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 px-4 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Left section: Selection info */}
              <div className="flex items-center gap-3">
                <button
                  onClick={isAllSelected ? onDeselectAll : onSelectAll}
                  className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                >
                  <SelectIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {selectedCount} selected
                  </span>
                </button>

                {!isAllSelected && (
                  <button
                    onClick={onSelectAll}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Select all {totalCount}
                  </button>
                )}

                <button
                  onClick={onDeselectAll}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Right section: Actions */}
              <div className="flex items-center gap-2">
                {/* Publish/Unpublish actions */}
                {draftSelected > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPublish}
                    disabled={isLoading}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Publish</span>
                    {draftSelected > 1 && <span className="ml-1">({draftSelected})</span>}
                  </Button>
                )}

                {publishedSelected > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUnpublish}
                    disabled={isLoading}
                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                  >
                    <EyeOff className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Unpublish</span>
                    {publishedSelected > 1 && <span className="ml-1">({publishedSelected})</span>}
                  </Button>
                )}

                {/* Export */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>

                {/* Archive */}
                {onArchive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onArchive}
                    disabled={isLoading}
                    className="text-slate-400 hover:text-slate-300 hover:bg-slate-500/10"
                  >
                    <Archive className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Archive</span>
                  </Button>
                )}

                {/* Divider */}
                <div className="h-6 w-px bg-slate-600 mx-1" />

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  disabled={isLoading}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Delete</span>
                  {selectedCount > 1 && <span className="ml-1">({selectedCount})</span>}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Selection checkbox for individual posts
interface SelectionCheckboxProps {
  isSelected: boolean;
  onToggle: () => void;
  className?: string;
}

export const SelectionCheckbox = ({
  isSelected,
  onToggle,
  className,
}: SelectionCheckboxProps) => {
  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200",
        isSelected
          ? "bg-violet-600 border-violet-600 text-white"
          : "border-slate-300 dark:border-slate-600 hover:border-violet-500 dark:hover:border-violet-400",
        className
      )}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.svg
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-3 h-3"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2.5 6L5 8.5L9.5 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
