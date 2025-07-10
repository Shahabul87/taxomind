"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnalyticsHeaderProps {
  variant: 'dashboard' | 'fullpage';
  selectedPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  onPeriodChange: (period: 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
  onRefreshAll: () => void;
}

export function AnalyticsHeader({ 
  variant, 
  selectedPeriod, 
  onPeriodChange, 
  onRefreshAll 
}: AnalyticsHeaderProps) {
  if (variant === 'fullpage') {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-600 dark:from-white dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
            Learning Analytics
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Comprehensive insights into your learning progress and performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((period) => (
              <button
                key={period}
                onClick={() => onPeriodChange(period)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  selectedPeriod === period
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50"
                )}
              >
                {period.charAt(0) + period.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefreshAll}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard variant
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Learning Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Real-time insights into your learning progress and performance
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange(period)}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                selectedPeriod === period
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
              )}
            >
              {period.charAt(0) + period.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        
        <Button variant="outline" size="sm" onClick={onRefreshAll}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}