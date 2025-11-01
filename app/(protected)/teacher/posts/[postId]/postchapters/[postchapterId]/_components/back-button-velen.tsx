"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const BackButtonVelen = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      variant="ghost"
      size="sm"
      className={cn(
        "group flex items-center gap-2",
        "h-9 px-3 rounded-lg",
        "text-sm font-medium",
        "text-slate-600 dark:text-slate-400",
        "hover:text-slate-900 dark:hover:text-slate-100",
        "hover:bg-slate-100 dark:hover:bg-slate-800",
        "active:scale-95",
        "transition-all duration-200"
      )}
    >
      <ArrowLeft className={cn(
        "h-4 w-4 transition-transform duration-200",
        "group-hover:-translate-x-1"
      )} />
      <span className="hidden sm:inline">Back</span>
    </Button>
  );
};
