'use client';

/**
 * ConversationalOptions
 *
 * Displays clickable options for SAM tool interactions during conversational
 * data collection flows (e.g., skill roadmap builder).
 *
 * Features:
 * - Responsive grid layout for options
 * - Support for descriptions on hover/display
 * - Keyboard navigation support
 * - Loading state when option is selected
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

export interface ConversationalOption {
  value: string;
  label: string;
  description?: string;
}

interface ConversationalOptionsProps {
  options: ConversationalOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  selectedValue?: string;
  showDescriptions?: boolean;
  columns?: 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConversationalOptions({
  options,
  onSelect,
  disabled = false,
  selectedValue,
  showDescriptions = true,
  columns = 2,
  size = 'md',
  className,
}: ConversationalOptionsProps) {
  const [loadingValue, setLoadingValue] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    if (disabled || loadingValue) return;
    setLoadingValue(value);
    onSelect(value);
  };

  // Check if any option has a long description (> 30 chars) - use single column if so
  const hasLongDescriptions = showDescriptions && options.some(
    (opt) => opt.description && opt.description.length > 30
  );

  // Use single column for long descriptions to ensure readability
  // Otherwise, use responsive grid
  const gridCols = hasLongDescriptions
    ? { 2: 'grid-cols-1', 3: 'grid-cols-1', 4: 'grid-cols-2' }
    : {
        2: 'grid-cols-2',
        3: 'grid-cols-2 sm:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-4',
      };

  const buttonPadding = {
    sm: 'py-2 px-3',
    md: 'py-3 px-4',
    lg: 'py-4 px-5',
  };

  return (
    <div className={cn('grid gap-2 mt-3', gridCols[columns], className)}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        const isLoading = loadingValue === option.value;

        return (
          <Button
            key={option.value}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            disabled={disabled || !!loadingValue}
            className={cn(
              'flex flex-col items-start h-auto text-left transition-all min-w-0 overflow-hidden',
              buttonPadding[size],
              isSelected && 'ring-2 ring-primary ring-offset-2',
              !isSelected && !disabled && !isLoading && 'hover:border-primary/50 hover:bg-primary/5',
              // Loading state: clear visual with high contrast
              isLoading && 'bg-primary/10 border-primary text-foreground'
            )}
            onClick={() => handleSelect(option.value)}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <span className={cn(
                'font-medium truncate flex-1 min-w-0',
                isLoading && 'text-foreground'
              )}>{option.label}</span>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2 flex-shrink-0 text-primary" />}
              {isSelected && !isLoading && (
                <Check className="h-4 w-4 ml-2 text-primary flex-shrink-0" />
              )}
            </div>
            {showDescriptions && option.description && (
              <span className={cn(
                'text-xs mt-1 w-full',
                isLoading ? 'text-muted-foreground' : 'text-muted-foreground'
              )}>
                {option.description}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Compact version for inline option selection (e.g., yes/no questions)
 */
interface InlineOptionsProps {
  options: ConversationalOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function InlineOptions({
  options,
  onSelect,
  disabled = false,
  className,
}: InlineOptionsProps) {
  const [loadingValue, setLoadingValue] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    if (disabled || loadingValue) return;
    setLoadingValue(value);
    onSelect(value);
  };

  return (
    <div className={cn('flex flex-wrap gap-2 mt-2', className)}>
      {options.map((option) => {
        const isLoading = loadingValue === option.value;

        return (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            disabled={disabled || !!loadingValue}
            className="h-8"
            onClick={() => handleSelect(option.value)}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
