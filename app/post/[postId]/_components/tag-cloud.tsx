"use client";

import Link from "next/link";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagCloudProps {
  tags: Array<{ name: string; count?: number }>;
}

export function TagCloud({ tags }: TagCloudProps) {
  if (!tags || tags.length === 0) return null;

  // Sort tags by count (if available) or alphabetically
  const sortedTags = [...tags].sort((a, b) => {
    if (a.count && b.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  // Get font size based on popularity
  const getTagSize = (count?: number) => {
    if (!count) return "text-sm";
    if (count > 20) return "text-lg";
    if (count > 10) return "text-base";
    return "text-sm";
  };

  return (
    <div className="py-8 px-4 md:px-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Popular Tags
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/blog?tag=${encodeURIComponent(tag.name)}`}
            >
              <Badge
                variant="secondary"
                className={`${getTagSize(tag.count)} px-3 py-1 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer`}
              >
                {tag.name}
                {tag.count && (
                  <span className="ml-1 text-xs opacity-70">
                    ({tag.count})
                  </span>
                )}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
