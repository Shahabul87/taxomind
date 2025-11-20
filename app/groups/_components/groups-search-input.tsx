"use client";

import qs from "query-string";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface GroupsSearchInputProps {
  placeholder?: string;
  className?: string;
}

export function GroupsSearchInput({ 
  placeholder = "Search groups...", 
  className
}: GroupsSearchInputProps) {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 500);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentQuery = searchParams?.get("query") || "";
  const currentCategory = searchParams?.get("category");
  const currentView = searchParams?.get("view");

  // Initialize value from URL
  useEffect(() => {
    if (currentQuery) {
      setValue(currentQuery);
    }
  }, [currentQuery]);

  useEffect(() => {
    const query: Record<string, string> = {};
    
    if (debouncedValue) {
      query.query = debouncedValue;
    }
    
    if (currentCategory) {
      query.category = currentCategory;
    }
    
    if (currentView) {
      query.view = currentView;
    }

    const url = qs.stringifyUrl({
      url: pathname || "",
      query
    }, { skipEmptyString: true, skipNull: true });
    
    router.push(url);
  }, [debouncedValue, currentCategory, currentView, router, pathname]);

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 w-full"
      />
    </div>
  );
}

