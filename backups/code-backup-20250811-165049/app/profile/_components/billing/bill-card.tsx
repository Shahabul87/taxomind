"use client";

import { useState } from "react";
import { Calendar, Clock, DollarSign, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { BillCategory, BillStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategoryIcon } from "@/lib/utils";
import { formatRelative } from "date-fns";

interface Bill {
  id: string;
  title: string;
  category: BillCategory;
  amount: number;
  currency: string;
  dueDate: Date;
  status: BillStatus;
  createdAt: Date;
}

interface BillCardProps {
  bill: Bill;
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  onView: (bill: Bill) => void;
}

export const BillCard = ({ bill, onEdit, onDelete, onView }: BillCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: bill.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get status badge color
  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "UPCOMING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Format relative date
  const formatDueDate = (date: Date) => {
    return formatRelative(new Date(date), new Date());
  };

  // Handle delete
  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(bill.id);
  };

  const statusLabels: Record<BillStatus, string> = {
    "PAID": "Paid",
    "UPCOMING": "Upcoming",
    "OVERDUE": "Overdue"
  };

  // Get the icon component
  const CategoryIcon = getCategoryIcon(bill.category);

  return (
    <Card 
      className="h-full transition-all hover:shadow-md cursor-pointer bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800"
      onClick={() => onView(bill)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <CardTitle className="text-base font-medium line-clamp-1">{bill.title}</CardTitle>
          <div className="flex items-center space-x-1 mt-0.5">
            <Badge variant="outline" className="text-xs font-normal">
              <CategoryIcon className="h-3 w-3 mr-1" />
              <span className="ml-1">{bill.category}</span>
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onEdit(bill);
            }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600" 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm">
              <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{formatCurrency(bill.amount)}</span>
            </div>
            <Badge className={getStatusColor(bill.status)}>
              {statusLabels[bill.status]}
            </Badge>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="mr-1 h-3.5 w-3.5" />
            <span>Due {formatDueDate(bill.dueDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 