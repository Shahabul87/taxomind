"use client";

import { useState } from "react";
import { 
  Search,
  ListFilter,
  Calendar,
  DollarSign,
  CreditCard,
  Text
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SubscriptionFilterBarProps {
  onTabChange: (tab: string) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sortBy: "name" | "date" | "amount") => void;
  totalCount: number;
  expiringCount: number;
  expiredCount: number;
}

export const SubscriptionFilterBar = ({
  onTabChange,
  onSearchChange,
  onSortChange,
  totalCount,
  expiringCount,
  expiredCount
}: SubscriptionFilterBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSort, setCurrentSort] = useState<"name" | "date" | "amount">("date");
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };
  
  const handleSortChange = (sortBy: "name" | "date" | "amount") => {
    setCurrentSort(sortBy);
    onSortChange(sortBy);
  };
  
  const sortOptions = [
    { value: "date", label: "Renewal Date", icon: Calendar },
    { value: "amount", label: "Amount", icon: DollarSign },
    { value: "name", label: "Name", icon: Text },
  ];
  
  return (
    <div className="flex flex-col gap-4 mb-6">
      <Tabs defaultValue="all" onValueChange={onTabChange}>
        <TabsList className="grid grid-cols-4 mb-2">
          <TabsTrigger value="all" className="text-xs">
            All ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs">
            Active
          </TabsTrigger>
          <TabsTrigger value="expiring" className="text-xs">
            Soon ({expiringCount})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-xs">
            Expired ({expiredCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ListFilter className="h-4 w-4" />
              <span className="hidden sm:inline">Sort by</span>
              <span className="sm:hidden">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortOptions.map((option) => (
              <DropdownMenuItem 
                key={option.value}
                className={cn(
                  "cursor-pointer",
                  currentSort === option.value && "bg-gray-100 dark:bg-gray-800"
                )}
                onClick={() => handleSortChange(option.value as any)}
              >
                <option.icon className="mr-2 h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}; 