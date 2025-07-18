"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full",
      // Glass effect background
      "bg-white/20 dark:bg-gray-900/20",
      "backdrop-blur-sm",
      "border border-white/30 dark:border-gray-700/30",
      "shadow-inner",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-500 ease-out",
        // Glass effect indicator with gradients
        "bg-gradient-to-r from-purple-500/80 via-purple-600/90 to-purple-700/80",
        "dark:from-purple-400/80 dark:via-purple-500/90 dark:to-purple-600/80",
        "backdrop-blur-sm",
        "shadow-lg shadow-purple-500/20 dark:shadow-purple-400/20",
        "border-t border-white/40 dark:border-purple-300/20",
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
