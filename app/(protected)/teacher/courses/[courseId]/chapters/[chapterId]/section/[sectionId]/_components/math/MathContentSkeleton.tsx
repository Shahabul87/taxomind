'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const MathContentCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col xs:flex-row xs:items-center justify-between pb-3 gap-3">
        <Skeleton className="h-6 w-full xs:w-48" />
        <div className="flex gap-2 flex-shrink-0">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Equation or Image skeleton */}
          <div className="flex items-center justify-center bg-muted/30 rounded-lg border p-6 min-h-[200px]">
            <Skeleton className="h-32 w-full" />
          </div>

          {/* Right: Explanation skeleton */}
          <div className="bg-muted/30 rounded-lg border p-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        </div>

        {/* Metadata skeleton */}
        <div className="mt-4 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
};

export const MathContentListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-6 mt-6">
      {Array.from({ length: count }).map((_, index) => (
        <MathContentCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const MathContentFormSkeleton = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6 border rounded-lg bg-muted/20">
      {/* Title field skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* LaTeX input skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
        <div className="border rounded-lg p-4 bg-muted/30">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Image upload skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      {/* Explanation editor skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="border rounded-t-lg p-2 bg-muted/30">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-b-lg" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-col xs:flex-row gap-3 justify-end">
        <Skeleton className="h-10 w-full xs:w-20" />
        <Skeleton className="h-10 w-full xs:w-32" />
      </div>
    </div>
  );
};
