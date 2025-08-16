"use client";

import { Card } from "@/components/ui/card";
import { Pencil, Trash2, Code2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { ReactNode } from "react";

interface ExplanationCardProps {
  id: string;
  heading: string | null;
  type: "math" | "code";
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  children: ReactNode;
  subtitle?: string;
}

export const ExplanationCard = ({
  id,
  heading,
  type,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isDeleting,
  children,
  subtitle
}: ExplanationCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:shadow-2xl bg-white dark:bg-gray-800 rounded-2xl">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-black text-white p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              {type === "math" ? (
                <BookOpen className="h-6 w-6 text-white" />
              ) : (
                <Code2 className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-1">
                {heading}
              </h4>
              <p className="text-gray-300 text-sm">
                {subtitle || (type === "math" ? "Math Explanation" : "Code Explanation")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={onToggleExpand}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 border border-white/20 rounded-xl px-4 py-2"
            >
              {isExpanded ? "Collapse" : "View Details"}
            </Button>
            <Button
              onClick={onEdit}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 rounded-xl p-2"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <ConfirmModal onConfirm={onDelete}>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-xl p-2"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </ConfirmModal>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      {isExpanded && (
        <div className="expand-content p-6 bg-gray-50 dark:bg-gray-900/50">
          {children}
        </div>
      )}
    </Card>
  );
}; 