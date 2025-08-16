import React from 'react';
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({
  children,
  className
}: DashboardShellProps) {
  return (
    <div className={cn(
      "flex-1 p-4 md:p-8 pt-6 overflow-auto", 
      className
    )}>
      {children}
    </div>
  );
} 