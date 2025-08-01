"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BillStatus, BillCategory } from "@prisma/client";
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  DollarSign,
  BarChart4,
  Brain,
  Activity,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface Bill {
  id: string;
  title: string;
  description: string | null;
  category: BillCategory;
  amount: number;
  currency: string;
  startDate: Date;
  dueDate: Date;
  status: BillStatus;
  provider: string | null;
  autoPayEnabled: boolean;
  notifyBefore: number;
}

interface BillDashboardProps {
  bills: Bill[];
}

export function BillDashboard({ bills }: BillDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Filter bills within the selected date range
  const filteredBills = useMemo(() => {
    if (!dateRange?.from) return bills;
    
    return bills.filter(bill => {
      const dueDate = new Date(bill.dueDate);
      const from = dateRange.from!;
      const to = dateRange.to || dateRange.from;
      
      return dueDate >= from && dueDate <= to;
    });
  }, [bills, dateRange]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [filteredBills]);

  // Count bills by status
  const statusCounts = useMemo(() => {
    const counts = {
      PAID: 0,
      UPCOMING: 0,
      OVERDUE: 0
    };
    
    filteredBills.forEach(bill => {
      counts[bill.status]++;
    });
    
    return counts;
  }, [filteredBills]);

  // Calculate bills due soon (within 7 days)
  const dueSoonCount = useMemo(() => {
    const today = new Date();
    
    return filteredBills.filter(bill => {
      if (bill.status !== 'UPCOMING') return false;
      
      const dueDate = new Date(bill.dueDate);
      const daysDifference = differenceInDays(dueDate, today);
      
      return daysDifference >= 0 && daysDifference <= 7;
    }).length;
  }, [filteredBills]);

  // Calculate monthly trend (comparing to previous month)
  const monthlyTrend = useMemo(() => {
    if (!dateRange?.from) return { trend: 0, isPositive: false };
    
    const selectedMonth = dateRange.from;
    const previousMonth = new Date(selectedMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const currentMonthTotal = filteredBills.reduce((sum, bill) => {
      const dueDate = new Date(bill.dueDate);
      return isSameMonth(dueDate, selectedMonth) ? sum + bill.amount : sum;
    }, 0);
    
    const previousMonthTotal = bills.reduce((sum, bill) => {
      const dueDate = new Date(bill.dueDate);
      return isSameMonth(dueDate, previousMonth) ? sum + bill.amount : sum;
    }, 0);
    
    if (previousMonthTotal === 0) return { trend: 0, isPositive: false };
    
    const trend = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
    
    return {
      trend: Math.abs(Math.round(trend)),
      isPositive: trend <= 0 // Negative is good for bills (spending less)
    };
  }, [bills, filteredBills, dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Financial Overview
        </h2>
        <DateRangePicker 
          value={dateRange} 
          onChange={setDateRange}
          className="w-[300px]"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bills */}
        <Card className={cn(
          "border-gray-200 dark:border-gray-800",
          "bg-white/50 dark:bg-gray-900/50"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalAmount)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Monthly Trend */}
        <Card className={cn(
          "border-gray-200 dark:border-gray-800",
          "bg-white/50 dark:bg-gray-900/50"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {monthlyTrend.trend}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {monthlyTrend.isPositive ? 'Less' : 'More'} than last month
                </p>
              </div>
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                monthlyTrend.isPositive 
                  ? "bg-green-100 dark:bg-green-900/30" 
                  : "bg-red-100 dark:bg-red-900/30"
              )}>
                {monthlyTrend.isPositive 
                  ? <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400" />
                  : <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
                }
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Status Overview */}
        <Card className={cn(
          "border-gray-200 dark:border-gray-800",
          "bg-white/50 dark:bg-gray-900/50"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Paid: {statusCounts.PAID}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Upcoming: {statusCounts.UPCOMING}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Overdue: {statusCounts.OVERDUE}</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BarChart4 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Due Soon */}
        <Card className={cn(
          "border-gray-200 dark:border-gray-800",
          "bg-white/50 dark:bg-gray-900/50"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Due Soon (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {dueSoonCount}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {dueSoonCount === 1 ? 'bill' : 'bills'} due
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Intelligence Insights */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            SAM Financial Intelligence
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cost Optimization */}
          <Card className={cn(
            "border-gray-200 dark:border-gray-800",
            "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Cost Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Potential monthly savings: <span className="font-semibold">${(totalAmount * 0.15).toFixed(2)}</span>
                </p>
                <p className="text-xs text-green-500 dark:text-green-400">
                  {statusCounts.OVERDUE > 0 ? 'Reduce late fees by setting up auto-pay' : 'Great payment discipline!'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Spending Trends */}
          <Card className={cn(
            "border-gray-200 dark:border-gray-800",
            "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Spending Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {monthlyTrend.isPositive ? 'Spending decreased' : 'Spending increased'}
                </p>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    monthlyTrend.isPositive 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  )}>
                    {monthlyTrend.trend}% {monthlyTrend.isPositive ? 'savings' : 'increase'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Health */}
          <Card className={cn(
            "border-gray-200 dark:border-gray-800",
            "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Payment Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Health Score: <span className="font-semibold">
                    {Math.round(((statusCounts.PAID / Math.max(1, filteredBills.length)) * 100))}%
                  </span>
                </p>
                <p className="text-xs text-purple-500 dark:text-purple-400">
                  {statusCounts.OVERDUE === 0 
                    ? 'Excellent payment history' 
                    : `${statusCounts.OVERDUE} bill${statusCounts.OVERDUE > 1 ? 's' : ''} need attention`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* AI Recommendations */}
        {(statusCounts.OVERDUE > 0 || dueSoonCount > 2) && (
          <Card className={cn(
            "mt-4",
            "border-amber-200 dark:border-amber-800",
            "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                SAM AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusCounts.OVERDUE > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Priority: Address {statusCounts.OVERDUE} overdue bill{statusCounts.OVERDUE > 1 ? 's' : ''} to avoid additional fees
                    </p>
                  </div>
                )}
                {dueSoonCount > 2 && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Consider setting up auto-pay for {dueSoonCount} upcoming bills to ensure timely payments
                    </p>
                  </div>
                )}
                {totalAmount > 0 && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Review utility bills for potential savings through energy efficiency or plan changes
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 