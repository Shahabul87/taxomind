"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BillStatus, BillCategory } from "@prisma/client";
import { format, subMonths, eachMonthOfInterval } from "date-fns";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Calendar, 
  DollarSign,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn, getCategoryIcon } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Bill {
  id: string;
  title: string;
  category: BillCategory;
  amount: number;
  currency: string;
  dueDate: Date;
  status: BillStatus;
}

interface BillVisualizationProps {
  bills: Bill[];
}

export function BillVisualization({ bills }: BillVisualizationProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get category color
  const getCategoryColor = (category: BillCategory, isBackground = true) => {
    const colors: Record<BillCategory, { bg: string, text: string }> = {
      'UTILITY': { bg: '#fbbf24', text: '#92400e' },
      'INTERNET': { bg: '#60a5fa', text: '#1e40af' },
      'INSURANCE': { bg: '#34d399', text: '#065f46' },
      'RENT': { bg: '#a78bfa', text: '#5b21b6' },
      'MORTGAGE': { bg: '#f87171', text: '#991b1b' },
      'SUBSCRIPTION': { bg: '#f472b6', text: '#9d174d' },
      'TAX': { bg: '#9ca3af', text: '#374151' },
      'CREDIT_CARD': { bg: '#818cf8', text: '#3730a3' },
      'OTHER': { bg: '#fb923c', text: '#9a3412' }
    };
    
    return isBackground 
      ? colors[category]?.bg || colors.OTHER.bg 
      : colors[category]?.text || colors.OTHER.text;
  };
  
  // Calculate category totals for pie chart
  const categoryData = useMemo(() => {
    const totals = bills.reduce((acc, bill) => {
      acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
      return acc;
    }, {} as Record<BillCategory, number>);
    
    return Object.entries(totals).map(([category, amount]) => ({
      category: category as BillCategory,
      amount,
      color: getCategoryColor(category as BillCategory),
      textColor: getCategoryColor(category as BillCategory, false)
    })).sort((a, b) => b.amount - a.amount);
  }, [bills]);
  
  // Calculate monthly data for line chart
  const monthlyData = useMemo(() => {
    // Get last 6 months
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
    
    // Create data structure with month labels
    const data = months.map(month => {
      const monthLabel = format(month, 'MMM');
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Filter bills for this month
      const monthBills = bills.filter(bill => {
        const dueDate = new Date(bill.dueDate);
        return dueDate >= monthStart && dueDate <= monthEnd;
      });
      
      // Calculate totals
      const total = monthBills.reduce((sum, bill) => sum + bill.amount, 0);
      
      // Calculate category subtotals
      const categories = Object.values(BillCategory).reduce((acc, cat) => {
        acc[cat] = monthBills
          .filter(bill => bill.category === cat)
          .reduce((sum, bill) => sum + bill.amount, 0);
        return acc;
      }, {} as Record<BillCategory, number>);
      
      return {
        month: monthLabel,
        total,
        categories
      };
    });
    
    return data;
  }, [bills]);
  
  // Calculate status distribution
  const statusData = useMemo(() => {
    const totals = bills.reduce((acc, bill) => {
      acc[bill.status] = (acc[bill.status] || 0) + 1;
      return acc;
    }, {} as Record<BillStatus, number>);
    
    return Object.entries(totals).map(([status, count]) => ({
      status: status as BillStatus,
      count,
      color: status === 'PAID' ? '#22c55e' : 
             status === 'UPCOMING' ? '#3b82f6' : '#ef4444'
    }));
  }, [bills]);
  
  // Calculate highest bill
  const highestBill = useMemo(() => {
    if (bills.length === 0) return null;
    return bills.reduce((highest, bill) => 
      bill.amount > highest.amount ? bill : highest
    , bills[0]);
  }, [bills]);

  // Calculate upcoming bills
  const upcomingBills = useMemo(() => {
    return bills
      .filter(bill => bill.status === 'UPCOMING')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [bills]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Bill Visualization
        </h2>
        <div className="flex items-center gap-2">
          <Select defaultValue="6">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="spending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spending">Spending Breakdown</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
          <TabsTrigger value="status">Bill Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="spending" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pie Chart */}
            <Card className={cn(
              "border-gray-200 dark:border-gray-800",
              "bg-white/50 dark:bg-gray-900/50",
              "col-span-2"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <PieChart className="h-4 w-4 mr-2 text-purple-600" />
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  {/* Pie Chart Visualization (Simplified for demo) */}
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        {formatCurrency(bills.reduce((sum, bill) => sum + bill.amount, 0))}
                      </span>
                    </div>
                    {categoryData.map((category, index) => {
                      const percentage = category.amount / bills.reduce((sum, bill) => sum + bill.amount, 0);
                      // This is a simplified visual. In a real app, you would use a proper charting library
                      const size = 20 + percentage * 60;
                      return (
                        <motion.div
                          key={category.category}
                          className="absolute rounded-full"
                          style={{
                            backgroundColor: category.color,
                            width: `${size}%`,
                            height: `${size}%`,
                            top: `${50 - size/2 + (index * 4) % 15 - 7.5}%`,
                            left: `${50 - size/2 + ((index * 5) % 20) - 10}%`,
                            zIndex: categoryData.length - index,
                            opacity: 0.7 + (0.3 * (index / categoryData.length))
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Category Legend */}
                  <div className="space-y-3 w-full max-w-xs">
                    {categoryData.slice(0, 5).map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {category.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(category.amount)}
                        </span>
                      </div>
                    ))}
                    
                    {categoryData.length > 5 && (
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Others</span>
                        <span>
                          {formatCurrency(
                            categoryData
                              .slice(5)
                              .reduce((sum, cat) => sum + cat.amount, 0)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Bills */}
            <Card className={cn(
              "border-gray-200 dark:border-gray-800",
              "bg-white/50 dark:bg-gray-900/50",
              "col-span-1"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                  Top Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {highestBill && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                      <div className="text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold">
                        Highest Bill
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-2",
                            `bg-${getCategoryColor(highestBill.category)}-100 dark:bg-${getCategoryColor(highestBill.category)}-900/30`
                          )}>
                            {(() => {
                              const Icon = getCategoryIcon(highestBill.category);
                              return <Icon className={`h-4 w-4 text-${getCategoryColor(highestBill.category)}-600 dark:text-${getCategoryColor(highestBill.category)}-400`} />;
                            })()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {highestBill.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {highestBill.category.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(highestBill.amount)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upcoming Bills
                    </h4>
                    <div className="space-y-3">
                      {upcomingBills.map(bill => (
                        <div key={bill.id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                                style={{ backgroundColor: getCategoryColor(bill.category) + '33' }}>
                              {(() => {
                                const Icon = getCategoryIcon(bill.category);
                                return <Icon className='h-3 w-3' style={{ color: getCategoryColor(bill.category, false) }} />;
                              })()}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {bill.title}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(bill.amount)}
                          </span>
                        </div>
                      ))}
                      
                      {upcomingBills.length === 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No upcoming bills
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-4 pt-4">
          <Card className={cn(
            "border-gray-200 dark:border-gray-800",
            "bg-white/50 dark:bg-gray-900/50"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <LineChart className="h-4 w-4 mr-2 text-green-600" />
                Monthly Spending Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simple Bar Chart Visualization */}
              <div className="h-64 flex items-end justify-between">
                {monthlyData.map((month, index) => (
                  <div key={month.month} className="flex flex-col items-center">
                    <div className="flex-grow flex items-end mb-2">
                      <motion.div
                        className="w-10 bg-blue-500 dark:bg-blue-600 rounded-t-md relative group"
                        style={{ height: `${Math.min(100, (month.total / 2000) * 100)}%` }}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(100, (month.total / 2000) * 100)}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(month.total)}
                        </div>
                      </motion.div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {month.month}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Categories Legend */}
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {Object.values(BillCategory)
                  .filter(category => 
                    monthlyData.some(month => month.categories[category] > 0)
                  )
                  .slice(0, 5)
                  .map(category => {
                    const CategoryIcon = getCategoryIcon(category);
                    return (
                      <div key={category} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-1"
                             style={{ backgroundColor: getCategoryColor(category) }}></div>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    );
                  })
                }
              </div>
            </CardContent>
          </Card>
          
          {/* Monthly Comparison Table */}
          <Card className={cn(
            "border-gray-200 dark:border-gray-800",
            "bg-white/50 dark:bg-gray-900/50"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                Month-to-Month Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">Month</th>
                      <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Total</th>
                      <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((month, index) => {
                      const prevMonth = index > 0 ? monthlyData[index - 1] : null;
                      const change = prevMonth 
                        ? ((month.total - prevMonth.total) / prevMonth.total) * 100 
                        : 0;
                      
                      return (
                        <tr key={month.month} className="border-b border-gray-200 dark:border-gray-800">
                          <td className="py-2 text-gray-700 dark:text-gray-300">{month.month}</td>
                          <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(month.total)}
                          </td>
                          <td className="py-2 text-right">
                            {index > 0 && (
                              <div className={cn(
                                "inline-flex items-center",
                                change < 0 
                                  ? "text-green-600 dark:text-green-400" 
                                  : change > 0 
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-500 dark:text-gray-400"
                              )}>
                                {change < 0 
                                  ? <ChevronDown className="h-3 w-3 mr-1" />
                                  : change > 0 
                                    ? <ChevronUp className="h-3 w-3 mr-1" />
                                    : null
                                }
                                {Math.abs(change).toFixed(1)}%
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Chart */}
            <Card className={cn(
              "border-gray-200 dark:border-gray-800",
              "bg-white/50 dark:bg-gray-900/50"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <PieChart className="h-4 w-4 mr-2 text-indigo-600" />
                  Bill Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {/* Simplified Status Doughnut Chart */}
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 rounded-full border-8 border-gray-100 dark:border-gray-800" />
                  {statusData.map((status, index) => {
                    const totalBills = bills.length;
                    const percentage = (status.count / totalBills) * 100;
                    const offset = statusData
                      .slice(0, index)
                      .reduce((total, s) => total + (s.count / totalBills) * 100, 0);
                    
                    return (
                      <div 
                        key={status.status}
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `conic-gradient(transparent ${offset}%, ${status.color} ${offset}%, ${status.color} ${offset + percentage}%, transparent ${offset + percentage}%)`,
                          borderRadius: '100%'
                        }}
                      />
                    );
                  })}
                  <div className="absolute inset-4 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {bills.length}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4 mt-4">
                  {statusData.map(status => (
                    <div key={status.status} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-1" 
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {status.status.charAt(0) + status.status.slice(1).toLowerCase()}
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          ({status.count})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Status Breakdown */}
            <Card className={cn(
              "border-gray-200 dark:border-gray-800",
              "bg-white/50 dark:bg-gray-900/50"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-teal-600" />
                  Status Financial Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(BillStatus).map(status => {
                    const statusBills = bills.filter(bill => bill.status === status);
                    const totalAmount = statusBills.reduce((sum, bill) => sum + bill.amount, 0);
                    const percentage = bills.length > 0 
                      ? (statusBills.length / bills.length) * 100 
                      : 0;
                    
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(totalAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <motion.div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: status === 'PAID' ? '#22c55e' : 
                                              status === 'UPCOMING' ? '#3b82f6' : '#ef4444'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {statusBills.slice(0, 2).map(bill => {
                            const CategoryIcon = getCategoryIcon(bill.category);
                            return (
                              <div key={bill.id} className="text-xs flex items-center">
                                <div className="w-4 h-4 rounded-full flex items-center justify-center mr-1"
                                    style={{ backgroundColor: getCategoryColor(bill.category) + '33' }}>
                                  <CategoryIcon className='h-2 w-2' style={{ color: getCategoryColor(bill.category, false) }} />
                                </div>
                                <span className="truncate text-gray-600 dark:text-gray-400">
                                  {bill.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 