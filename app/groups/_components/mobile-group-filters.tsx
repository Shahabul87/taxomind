"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobileGroupFiltersProps {
  categories: Array<{ id: string; name: string }>;
  currentCategory?: string;
}

export function MobileGroupFilters({ categories, currentCategory }: MobileGroupFiltersProps) {
  const searchParams = useSearchParams();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const hasActiveFilter = currentCategory && currentCategory !== "All Categories";

  return (
    <>
      {/* Desktop Dropdown */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "flex items-center gap-2 h-10",
                hasActiveFilter && "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden lg:inline">Filter by Category</span>
              <span className="lg:hidden">Filter</span>
              {hasActiveFilter && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <Link href="/groups" className="block">
              <DropdownMenuItem className={cn(
                "cursor-pointer",
                !hasActiveFilter && "bg-indigo-50 dark:bg-indigo-950/30"
              )}>
                All Categories
              </DropdownMenuItem>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/groups?category=${category.name}`}>
                <DropdownMenuItem 
                  className={cn(
                    "cursor-pointer",
                    currentCategory === category.name && "bg-indigo-50 dark:bg-indigo-950/30"
                  )}
                >
                  {category.name}
                </DropdownMenuItem>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Sheet */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                "relative h-9 px-3",
                hasActiveFilter && "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
              )}
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilter && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  1
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="text-left text-xl font-semibold">
                Filter Groups
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-1">
              <Link 
                href="/groups"
                onClick={() => setIsSheetOpen(false)}
                className={cn(
                  "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  !hasActiveFilter 
                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                )}
              >
                All Categories
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/groups?category=${category.name}`}
                  onClick={() => setIsSheetOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    currentCategory === category.name
                      ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  {category.name}
                </Link>
              ))}
            </div>
            {hasActiveFilter && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link href="/groups" onClick={() => setIsSheetOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Clear Filter
                  </Button>
                </Link>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

