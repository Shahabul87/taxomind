"use client";

import axios from "axios";
import { Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface FeaturedFormProps {
  initialData: {
    isFeatured: boolean;
  };
  courseId: string;
}

export const FeaturedForm = ({
  initialData,
  courseId,
}: FeaturedFormProps) => {
  const [isFeatured, setIsFeatured] = useState(initialData.isFeatured);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onToggle = async () => {
    try {
      setIsLoading(true);
      const newValue = !isFeatured;

      await axios.patch(`/api/courses/${courseId}`, {
        isFeatured: newValue,
      });

      setIsFeatured(newValue);
      toast.success(newValue ? "Course marked as featured" : "Course removed from featured");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Star className={cn(
            "h-4 w-4 flex-shrink-0 transition-colors",
            isFeatured ? "text-amber-500 fill-amber-500" : "text-slate-400"
          )} />
          <span className={cn(
            "text-sm font-medium transition-colors",
            isFeatured ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
          )}>
            {isFeatured ? "Featured on Homepage" : "Not Featured"}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Featured courses appear first on the homepage
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        )}
        <Switch
          checked={isFeatured}
          onCheckedChange={onToggle}
          disabled={isLoading}
          className={cn(
            "data-[state=checked]:bg-amber-500",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
    </div>
  );
};
