"use client";

import { Search } from "lucide-react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  placeholder = "What do you want to learn?",
  className,
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/courses?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-11 pl-12 pr-4 text-base rounded-full bg-white/90 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-400/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
          aria-label="Search courses"
        />
        <button
          type="submit"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          aria-label="Submit search"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
