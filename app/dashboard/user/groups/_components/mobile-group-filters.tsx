"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface MobileGroupFiltersProps {
  categories: Array<{ id: string; name: string }>;
  currentCategory?: string;
}

export function MobileGroupFilters({ categories, currentCategory }: MobileGroupFiltersProps) {
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
                "border-[hsl(var(--groups-border))]",
                "hover:border-[hsl(var(--groups-primary))]",
                "hover:bg-[hsl(var(--groups-primary-muted))]",
                hasActiveFilter && "bg-[hsl(var(--groups-primary-muted))] border-[hsl(var(--groups-primary))]"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden lg:inline">Filter by Category</span>
              <span className="lg:hidden">Filter</span>
              {hasActiveFilter && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 h-5 px-1.5 text-xs",
                    "bg-[hsl(var(--groups-primary))] text-[hsl(var(--groups-primary-foreground))]"
                  )}
                >
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(
              "w-56",
              "bg-[hsl(var(--groups-surface-elevated))]",
              "border-[hsl(var(--groups-border))]"
            )}
          >
            <Link href="/dashboard/user/groups" className="block">
              <DropdownMenuItem className={cn(
                "cursor-pointer",
                !hasActiveFilter && "bg-[hsl(var(--groups-primary-muted))] text-[hsl(var(--groups-primary))]"
              )}>
                All Categories
              </DropdownMenuItem>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/groups?category=${category.name}`}>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer",
                    currentCategory === category.name && "bg-[hsl(var(--groups-primary-muted))] text-[hsl(var(--groups-primary))]"
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
                "border-[hsl(var(--groups-border))]",
                hasActiveFilter && "bg-[hsl(var(--groups-primary-muted))] border-[hsl(var(--groups-primary))]"
              )}
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilter && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]",
                    "bg-[hsl(var(--groups-primary))] text-[hsl(var(--groups-primary-foreground))]"
                  )}
                >
                  1
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className={cn(
              "w-[85vw] sm:w-[400px]",
              "bg-[hsl(var(--groups-surface-elevated))]",
              "border-l-[hsl(var(--groups-border))]"
            )}
          >
            <SheetHeader>
              <SheetTitle className="text-left text-xl font-semibold text-[hsl(var(--groups-text))]">
                Filter Communities
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-1">
              <Link
                href="/dashboard/user/groups"
                onClick={() => setIsSheetOpen(false)}
                className={cn(
                  "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  !hasActiveFilter
                    ? "bg-[hsl(var(--groups-primary-muted))] text-[hsl(var(--groups-primary))]"
                    : "hover:bg-[hsl(var(--groups-surface))] text-[hsl(var(--groups-text-muted))]"
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
                      ? "bg-[hsl(var(--groups-primary-muted))] text-[hsl(var(--groups-primary))]"
                      : "hover:bg-[hsl(var(--groups-surface))] text-[hsl(var(--groups-text-muted))]"
                  )}
                >
                  {category.name}
                </Link>
              ))}
            </div>
            {hasActiveFilter && (
              <div className="mt-6 pt-6 border-t border-[hsl(var(--groups-border))]">
                <Link href="/dashboard/user/groups" onClick={() => setIsSheetOpen(false)}>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full",
                      "border-[hsl(var(--groups-border))]",
                      "hover:border-[hsl(var(--groups-primary))]",
                      "hover:bg-[hsl(var(--groups-primary-muted))]"
                    )}
                  >
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

