"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, ExternalLink, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyticsNavigationProps {
  variant: 'dashboard' | 'fullpage';
  className?: string;
}

export function AnalyticsNavigation({ variant, className }: AnalyticsNavigationProps) {
  if (variant === 'dashboard') {
    return (
      <div className={`flex items-center justify-between mb-4 ${className || ''}`}>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Dashboard View
          </Badge>
        </div>
        <Link href="/analytics/student">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Full Analytics
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between mb-6 ${className || ''}`}>
      <Link href="/dashboard/user">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-600" />
        <Badge variant="outline" className="text-xs">
          Full Analytics View
        </Badge>
      </div>
    </div>
  );
}