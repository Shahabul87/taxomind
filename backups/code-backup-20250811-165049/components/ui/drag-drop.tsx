"use client";

import React, { useState, useRef } from 'react';
import { cn } from "@/lib/utils";

interface DragDropProps {
  items: any[];
  onReorder: (newItems: any[]) => void;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}

export function DragDrop({ items, onReorder, renderItem, className }: DragDropProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<number | null>(null);
  const dragItemNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    dragItemNode.current = e.target as HTMLDivElement;
    dragItemNode.current.addEventListener('dragend', handleDragEnd);
    setTimeout(() => {
      setDraggedOverItem(index);
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragItemNode.current !== e.target) {
      setDraggedOverItem(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem !== null && draggedOverItem !== null) {
      const newItems = [...items];
      const draggedItemContent = newItems[draggedItem];
      newItems.splice(draggedItem, 1);
      newItems.splice(draggedOverItem, 0, draggedItemContent);
      onReorder(newItems);
    }
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
    if (dragItemNode.current) {
      dragItemNode.current.removeEventListener('dragend', handleDragEnd);
      dragItemNode.current = null;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "transition-all duration-200",
            draggedOverItem === index && "opacity-50",
            draggedItem === index && "opacity-30"
          )}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
} 