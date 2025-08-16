"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  PieChart,
  ListFilter,
  Tag,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { cn, getCategoryIcon } from "@/lib/utils";
import { BillCategory, BillStatus } from "@prisma/client";
import { format, isSameMonth, startOfMonth } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Bill {
  id: string;
  title: string;
  category: BillCategory;
  amount: number;
  currency: string;
  dueDate: Date;
  status: BillStatus;
}

interface BillStatisticsProps {
  bills: Bill[];
  onFilter?: (filter: Partial<{status: BillStatus, category: BillCategory}>) => void;
}

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function BillStatistics({ bills, onFilter }: BillStatisticsProps) {
  // Calculate total amounts
  const totalAmount = useMemo(() => {
    return bills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [bills]);
  
  // Count bills by status
  const statusCounts = useMemo(() => {
    return bills.reduce((counts, bill) => {
      counts[bill.status] = (counts[bill.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, [bills]);
  
  // Calculate amounts by category
  const categoryAmounts = useMemo(() => {
    return bills.reduce((amounts, bill) => {
      amounts[bill.category] = (amounts[bill.category] || 0) + bill.amount;
      return amounts;
    }, {} as Record<string, number>);
  }, [bills]);
  
  // Calculate percentage for each category
  const categoryPercentages = useMemo(() => {
    return Object.entries(categoryAmounts).map(([category, amount]) => ({
      category: category as BillCategory,
      amount,
      percentage: Math.round((amount / totalAmount) * 100) || 0
    })).sort((a, b) => b.amount - a.amount);
  }, [categoryAmounts, totalAmount]);
  
  // Calculate this month's total
  const thisMonthTotal = useMemo(() => {
    const currentMonth = startOfMonth(new Date());
    
    return bills.reduce((sum, bill) => {
      const dueDate = new Date(bill.dueDate);
      return isSameMonth(dueDate, currentMonth) ? sum + bill.amount : sum;
    }, 0);
  }, [bills]);
  
  // Calculate month-over-month change
  const monthChange = 5.2; // In a real app, this would be calculated based on previous month data
  
  // Get colors for status indicators
  const getStatusColor = (status: BillStatus) => {
    switch(status) {
      case 'PAID': return 'bg-green-500';
      case 'UPCOMING': return 'bg-blue-500';
      case 'OVERDUE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Get category color
  const getCategoryColor = (category: BillCategory, isText = false) => {
    const colors: Record<BillCategory, {bg: string, text: string}> = {
      'UTILITY': {bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400'},
      'INTERNET': {bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400'},
      'INSURANCE': {bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400'},
      'RENT': {bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400'},
      'MORTGAGE': {bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400'},
      'SUBSCRIPTION': {bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400'},
      'TAX': {bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400'},
      'CREDIT_CARD': {bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400'},
      'OTHER': {bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400'}
    };
    
    return isText ? colors[category]?.text || colors.OTHER.text : colors[category]?.bg || colors.OTHER.bg;
  };
  
  // Filter handlers
  const handleFilterByStatus = (status: BillStatus) => {
    onFilter?.({ status });
  };
  
  const handleFilterByCategory = (category: BillCategory) => {
    onFilter?.({ category });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Bill Statistics
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ListFilter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            {Object.values(BillStatus).map((status) => (
              <DropdownMenuItem key={status} onClick={() => handleFilterByStatus(status)}>
                <div className={`h-2 w-2 rounded-full ${getStatusColor(status)} mr-2`} />
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
            {Object.entries(categoryAmounts).map(([category, amount]) => {
              const CategoryIcon = getCategoryIcon(category as BillCategory);
              return (
                <DropdownMenuItem key={category} onClick={() => handleFilterByCategory(category as BillCategory)}>
                  <CategoryIcon className={`h-4 w-4 mr-2 ${getCategoryColor(category as BillCategory, true)}`} />
                  {category.replace(/_/g, ' ')}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <Card className={cn(
          "border-gray-200 dark:border-gray-800",
          "bg-white/50 dark:bg-gray-900/50",
          "col-span-1"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <PieChart className="h-4 w-4 mr-2 text-blue-500" />
              Bill Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {count} bills ({Math.round((count / bills.length) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(count / bills.length) * 100} 
                    className={cn(
                      "h-2",
                      status === 'PAID' ? "bg-green-100" : 
                      status === 'UPCOMING' ? "bg-blue-100" : 
                      "bg-red-100"
                    )}
                    indicatorClassName={getStatusColor(status as BillStatus)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Monthly Overview */}
        <Card className={cn(
          "border-gray-200 dark:border-gray-800",
          "bg-white/50 dark:bg-gray-900/50",
          "col-span-1"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-purple-500" />
              Monthly Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(), 'MMMM yyyy')}
              </span>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {formatCurrency(thisMonthTotal)}
                </span>
                <div className={cn(
                  "flex items-center text-sm px-2 py-1 rounded-full",
                  monthChange < 0 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {monthChange < 0 
                    ? <ArrowDownCircle className="h-3 w-3 mr-1" />
                    : <ArrowUpCircle className="h-3 w-3 mr-1" />
                  }
                  {Math.abs(monthChange)}%
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upcoming Payments
              </h4>
              <div className="space-y-2">
                {bills
                  .filter(bill => bill.status === 'UPCOMING')
                  .slice(0, 3)
                  .map(bill => (
                    <div key={bill.id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center mr-2",
                          getCategoryColor(bill.category)
                        )}>
                          {React.createElement(getCategoryIcon(bill.category), {
                            className: `h-4 w-4 ${getCategoryColor(bill.category, true)}`
                          })}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {bill.title}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {formatCurrency(bill.amount)}
                      </span>
                    </div>
                  ))}
                
                {bills.filter(bill => bill.status === 'UPCOMING').length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No upcoming payments
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Category Breakdown */}
        <Card className={cn(
          "border-gray-200 dark:border-gray-800",
          "bg-white/50 dark:bg-gray-900/50",
          "col-span-1"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <Tag className="h-4 w-4 mr-2 text-pink-500" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryPercentages.slice(0, 5).map(({ category, amount, percentage }) => (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      {React.createElement(getCategoryIcon(category), {
                        className: `h-4 w-4 mr-1 ${getCategoryColor(category, true)}`
                      })}
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(amount)} ({percentage}%)
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2 bg-gray-100 dark:bg-gray-800"
                    indicatorClassName={cn(
                      "transition-all",
                      percentage > 50 ? "bg-red-500" :
                      percentage > 30 ? "bg-orange-500" :
                      percentage > 20 ? "bg-amber-500" :
                      percentage > 10 ? "bg-green-500" :
                      "bg-blue-500"
                    )}
                  />
                </div>
              ))}
              
              {categoryPercentages.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No category data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 