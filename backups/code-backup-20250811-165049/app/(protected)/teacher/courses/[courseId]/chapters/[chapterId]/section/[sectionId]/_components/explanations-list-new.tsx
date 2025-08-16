"use client";

import { useState } from "react";
import { toast } from "sonner";
import { injectCustomStyles, parseExplanationBlocks } from "./_explanations/utils";
import { ExplanationsListProps } from "./_explanations/types";
import { EmptyState } from "./_explanations/EmptyState";
import { ExplanationCard } from "./_explanations/ExplanationCard";
import { MathExplanationContent } from "./_explanations/_MathTabComponents/MathExplanationContent";

export const ExplanationsList = ({
  items,
  onCreateClick,
  onEdit,
  onDelete,
  type = "math" // Default to math for backwards compatibility
}: ExplanationsListProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Debug the filtering
  console.log(`🔍 ExplanationsList (${type}) - received items:`, items);
  console.log(`🔍 ExplanationsList (${type}) - items length:`, items.length);
  console.log(`🔍 ExplanationsList (${type}) - type filter:`, type);

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
      toast.success("Math explanation deleted successfully");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter items for math explanations only
  const filteredItems = items.filter(item => {
    // For math explanations, look for equation, mode, or default to math type
    return item.type === "math" || item.equation || item.mode || !item.type;
  });

  console.log(`🔍 ExplanationsList (${type}) - filtered items:`, filteredItems);
  console.log(`🔍 ExplanationsList (${type}) - filtered items length:`, filteredItems.length);

  // Inject custom styles
  injectCustomStyles();

  if (filteredItems.length === 0) {
    return <EmptyState type={type} onCreateClick={onCreateClick} />;
  }

  return (
    <div className="space-y-8">
      {filteredItems.map((item) => {
        return (
          <ExplanationCard
            key={item.id}
            id={item.id}
            heading={item.heading}
            type="math"
            isExpanded={expandedItems[item.id] || false}
            onToggleExpand={() => toggleExpand(item.id)}
            onEdit={() => onEdit(item.id)}
            onDelete={() => handleDelete(item.id)}
            isDeleting={isDeleting}
            subtitle="Math Explanation"
          >
            <MathExplanationContent item={item} />
          </ExplanationCard>
        );
      })}
    </div>
  );
}; 