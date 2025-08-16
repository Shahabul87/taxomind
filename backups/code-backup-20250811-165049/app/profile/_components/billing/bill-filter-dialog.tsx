"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Filter, X } from "lucide-react";
import { BillCategory, BillStatus } from "@prisma/client";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface BillFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: Filters;
  onApplyFilters?: (filters: Filters) => void;
  categories?: BillCategory[];
}

export interface Filters {
  status?: BillStatus[];
  categories?: BillCategory[];
  dueDateRange?: DateRange;
  amountRange?: {
    min?: number;
    max?: number;
  };
}

export function BillFilterDialog({
  open,
  onOpenChange,
  filters = {},
  onApplyFilters = () => {},
  categories = Object.values(BillCategory)
}: BillFilterDialogProps) {
  // Initialize local state with props
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  const [statusOpen, setStatusOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // All available statuses
  const statuses = Object.values(BillStatus);

  // Reset filters
  const handleReset = () => {
    setLocalFilters({});
  };

  // Apply filters
  const handleApply = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  // Toggle status selection
  const toggleStatus = (status: BillStatus) => {
    setLocalFilters(prev => {
      const currentStatuses = prev.status || [];
      if (currentStatuses.includes(status)) {
        return {
          ...prev,
          status: currentStatuses.filter(s => s !== status)
        };
      } else {
        return {
          ...prev,
          status: [...currentStatuses, status]
        };
      }
    });
  };

  // Toggle category selection
  const toggleCategory = (category: BillCategory) => {
    setLocalFilters(prev => {
      const currentCategories = prev.categories || [];
      if (currentCategories.includes(category)) {
        return {
          ...prev,
          categories: currentCategories.filter(c => c !== category)
        };
      } else {
        return {
          ...prev,
          categories: [...currentCategories, category]
        };
      }
    });
  };

  // Status and category labels
  const statusLabels: Record<BillStatus, string> = {
    "PAID": "Paid",
    "UPCOMING": "Upcoming",
    "OVERDUE": "Overdue"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Bills
          </DialogTitle>
          <DialogDescription>
            Filter bills by status, category, due date, and amount.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow px-6">
          <div className="space-y-6">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={statusOpen}
                    className="w-full justify-between"
                  >
                    {localFilters.status?.length ? 
                      `${localFilters.status.length} selected` : 
                      "Select status"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search status..." />
                    <CommandList>
                      <CommandEmpty>No status found.</CommandEmpty>
                      <CommandGroup>
                        {statuses.map((status) => (
                          <CommandItem
                            key={status}
                            value={status}
                            onSelect={() => toggleStatus(status)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                localFilters.status?.includes(status)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {statusLabels[status]}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {localFilters.status && localFilters.status.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {localFilters.status.map(status => (
                    <Badge 
                      key={status} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {statusLabels[status]}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleStatus(status)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between"
                  >
                    {localFilters.categories?.length ? 
                      `${localFilters.categories.length} selected` : 
                      "Select categories"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search category..." />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category}
                            value={category}
                            onSelect={() => toggleCategory(category)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                localFilters.categories?.includes(category)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {category}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {localFilters.categories && localFilters.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {localFilters.categories.map(category => (
                    <Badge 
                      key={category} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {category}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleCategory(category)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Due Date Range Filter */}
            <div className="space-y-2">
              <Label>Due Date Range</Label>
              <DateRangePicker
                value={localFilters.dueDateRange}
                onChange={(range) => 
                  setLocalFilters(prev => ({ ...prev, dueDateRange: range }))
                }
              />
            </div>
            
            <Separator />
            
            {/* Amount Range Filter - could be implemented with a slider or number inputs */}
            <div className="space-y-2 mb-4">
              <Label>Amount Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Min</Label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <input
                      type="number"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Min amount"
                      value={localFilters.amountRange?.min || ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setLocalFilters(prev => ({
                          ...prev,
                          amountRange: {
                            ...prev.amountRange,
                            min: value
                          }
                        }));
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max</Label>
                  <div className="flex items-center">
                    <span className="text-sm mr-1">$</span>
                    <input
                      type="number"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Max amount"
                      value={localFilters.amountRange?.max || ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setLocalFilters(prev => ({
                          ...prev,
                          amountRange: {
                            ...prev.amountRange,
                            max: value
                          }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-6 pt-4 border-t">
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 