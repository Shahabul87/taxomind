'use client';

import { Calculator } from 'lucide-react';
import { MathContentManager } from '../math/MathContentManager';
import { MathContentErrorBoundary } from '../math/MathContentErrorBoundary';
import { cn } from '@/lib/utils';
import type { MathExplanation } from '../enterprise-section-types';

interface MathTabProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: {
    mathExplanations?: MathExplanation[];
    [key: string]: unknown;
  };
}

export const MathTab = ({
  courseId,
  chapterId,
  sectionId,
  initialData
}: MathTabProps) => {
  return (
    <div className={cn(
      'p-3 sm:p-4 mt-3 sm:mt-4 rounded-lg sm:rounded-xl',
      'border border-gray-200 dark:border-gray-700/50',
      'bg-white/50 dark:bg-gray-800/40',
      'hover:bg-gray-50 dark:hover:bg-gray-800/60',
      'transition-all duration-200',
      'backdrop-blur-sm'
    )}>
      <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-x-2">
          <div className={cn(
            'p-1.5 sm:p-2 w-fit rounded-md sm:rounded-lg',
            'bg-purple-50 dark:bg-purple-500/10'
          )}>
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-foreground">
              Mathematical Content
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Add equations, images, and detailed explanations
            </p>
          </div>
        </div>
      </div>

      <MathContentErrorBoundary>
        <MathContentManager
          courseId={courseId}
          chapterId={chapterId}
          sectionId={sectionId}
        />
      </MathContentErrorBoundary>
    </div>
  );
}; 