'use client';

import { MathContentCard } from './MathContentCard';
import type { MathExplanation } from '../enterprise-section-types';

interface MathContentListProps {
  items: MathExplanation[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: string | null;
}

export const MathContentList = ({ items, onEdit, onDelete, isDeleting }: MathContentListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <span className="text-4xl">📐</span>
        </div>
        <p className="text-lg font-medium">No math content yet</p>
        <p className="text-sm mt-1">Click &quot;Add Math Content&quot; to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {items.map((item) => (
        <MathContentCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting === item.id}
        />
      ))}
    </div>
  );
};
