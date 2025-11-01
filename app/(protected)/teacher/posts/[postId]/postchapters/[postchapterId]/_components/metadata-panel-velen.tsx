"use client";

import React from "react";
import { Clock, Hash, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetadataPanelVelenProps {
  chapterId: string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
}

export const MetadataPanelVelen = ({
  chapterId,
  updatedAt,
  createdAt
}: MetadataPanelVelenProps) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800/60">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Chapter Metadata
        </h4>
      </div>

      {/* Content */}
      <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
        {/* Chapter ID */}
        <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-150">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                <Hash className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Chapter ID
              </p>
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                {chapterId}
              </p>
            </div>
          </div>
        </div>

        {/* Created Date */}
        {createdAt && (
          <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-150">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Created
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {updatedAt && (
          <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-150">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-900/30">
                  <Clock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Last Updated
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(updatedAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-slate-800/60">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Auto-saved • Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">⌘S</kbd> to save manually
        </p>
      </div>
    </div>
  );
};
