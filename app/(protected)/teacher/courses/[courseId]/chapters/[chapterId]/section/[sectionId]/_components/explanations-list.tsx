"use client";

import { Card } from "@/components/ui/card";
import { Pencil, Trash2, Code2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ExplanationsListProps {
  items: {
    id: string;
    heading: string | null;
    code?: string | null;
    explanation: string | null;
    type: "math" | "code";
  }[];
  onCreateClick?: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  type: "math" | "code";
}

export const ExplanationsList = ({
  items,
  onCreateClick,
  onEdit,
  onDelete,
  type
}: ExplanationsListProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      toast.success(`${type === "math" ? "Math explanation" : "Code explanation"} deleted successfully`);
    } catch (error: any) {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = items.filter(item => item.type === type);

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        {type === "math" ? (
          <Calculator className="h-10 w-10 text-pink-400 dark:text-pink-600 mb-4" />
        ) : (
          <Code2 className="h-10 w-10 text-cyan-400 dark:text-cyan-600 mb-4" />
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          No {type === "math" ? "math" : "code"} explanations yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
          Add your first {type === "math" ? "math" : "code"} explanation to help others understand the concepts better.
        </p>
        {onCreateClick && (
          <Button
            onClick={onCreateClick}
            variant="ghost"
            className={cn(
              type === "math" 
                ? "bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-500/20"
                : "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/20",
              "transition-all duration-200"
            )}
          >
            Add {type === "math" ? "math" : "code"} explanation
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredItems.map((item) => (
        <Card 
          key={item.id}
          className={cn(
            "overflow-hidden transition-all duration-200",
            "border border-gray-200 dark:border-gray-700",
            type === "math" 
              ? "hover:border-pink-300 dark:hover:border-pink-700" 
              : "hover:border-cyan-300 dark:hover:border-cyan-700",
          )}
        >
          <div className={cn(
            "flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700",
            type === "math"
              ? "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20" 
              : "bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20"
          )}>
            <div className="flex items-center space-x-2">
              {type === "math" ? (
                <Calculator className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              ) : (
                <Code2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              )}
              <h4 className={cn(
                "text-lg font-semibold",
                type === "math"
                  ? "text-pink-800 dark:text-pink-200"
                  : "text-cyan-800 dark:text-cyan-200"
              )}>
                {item.heading}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => toggleExpand(item.id)}
                variant="ghost"
                size="sm"
              >
                {expandedItems[item.id] ? "Collapse" : "Expand"}
              </Button>
              <Button
                onClick={() => onEdit(item.id)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <ConfirmModal 
                onConfirm={() => handleDelete(item.id)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ConfirmModal>
            </div>
          </div>
          
          {expandedItems[item.id] && (
            <div className="p-4 bg-white dark:bg-gray-800">
              {type === "math" ? (
                <div className="prose prose-pink dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {item.explanation || "No explanation available"}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-4">
                  {item.code && (
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-md text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
                      {item.code}
                    </pre>
                  )}
                  
                  <div className="prose prose-cyan dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {item.explanation || "No explanation available"}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}; 