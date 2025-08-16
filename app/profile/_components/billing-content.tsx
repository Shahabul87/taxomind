"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Receipt, Calendar, Edit2, Trash2, Repeat, AlertTriangle, Download, Home, Wifi, Shield, DollarSign, CreditCard, Briefcase, Zap, Cloud, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BillCard } from "./billing/bill-card";
import { NewBillDialog } from "./billing/new-bill-dialog";
import { BillFilterDialog } from "./billing/bill-filter-dialog";
import { BillDetailsDialog } from "./billing/bill-details-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { BillCategory, BillStatus } from "@prisma/client";
import { BillDashboard } from "./billing/bill-dashboard";
import { BillVisualization } from "./billing/bill-visualization";
import { FinancialIntelligenceDashboard } from "@/components/billing/financial-intelligence-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { logger } from '@/lib/logger';

// Define the categories object with the required properties
const categories = [
  { id: BillCategory.UTILITY, name: 'Utility', color: 'bg-yellow-200', icon: <Zap className="h-4 w-4 text-yellow-600" /> },
  { id: BillCategory.INTERNET, name: 'Internet', color: 'bg-blue-200', icon: <Wifi className="h-4 w-4 text-blue-600" /> },
  { id: BillCategory.INSURANCE, name: 'Insurance', color: 'bg-green-200', icon: <Shield className="h-4 w-4 text-green-600" /> },
  { id: BillCategory.RENT, name: 'Rent', color: 'bg-pink-200', icon: <Home className="h-4 w-4 text-pink-600" /> },
  { id: BillCategory.MORTGAGE, name: 'Mortgage', color: 'bg-purple-200', icon: <Home className="h-4 w-4 text-purple-600" /> },
  { id: BillCategory.SUBSCRIPTION, name: 'Subscription', color: 'bg-indigo-200', icon: <Cloud className="h-4 w-4 text-indigo-600" /> },
  { id: BillCategory.TAX, name: 'Tax', color: 'bg-red-200', icon: <Briefcase className="h-4 w-4 text-red-600" /> },
  { id: BillCategory.CREDIT_CARD, name: 'Credit Card', color: 'bg-slate-200', icon: <CreditCard className="h-4 w-4 text-slate-600" /> },
  { id: BillCategory.OTHER, name: 'Other', color: 'bg-gray-200', icon: <FileText className="h-4 w-4 text-gray-600" /> },
];

// Add this helper function at the top of the file, after the categories array
const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Helper to safely format dates
const safeFormatDate = (date: Date | string | null | undefined, formatStr: string): string => {
  if (!date) return 'No date';
  
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (!isValidDate(dateObj)) {
    return 'Invalid date';
  }
  
  try {
    return format(dateObj, formatStr);
  } catch (error: any) {
    logger.error('Error formatting date:', error);
    return 'Date error';
  }
};

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
  paymentHistory: any[];
  attachments: any[];
  recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  createdAt: Date;
}

export const BillingContent = ({ userId }: { userId: string }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newBill, setNewBill] = useState<Partial<Bill>>({
    title: '',
    amount: 0,
    dueDate: new Date(),
    category: '',
    status: BillStatus.UNPAID,
    recurring: false,
  });

  const fetchBills = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Debug request
      //console.log("Fetching bills for month:", selectedMonth);
      
      const { data } = await axios.get<Bill[]>('/api/bills', {
        params: {
          month: selectedMonth
        }
      });
      
      // Process the bills to ensure dates are properly parsed
      const processedBills = data.map(bill => ({
        ...bill,
        createdAt: bill.createdAt ? new Date(bill.createdAt) : new Date(),
        updatedAt: bill.updatedAt ? new Date(bill.updatedAt) : new Date(),
        dueDate: bill.dueDate ? new Date(bill.dueDate) : new Date(),
        startDate: bill.startDate ? new Date(bill.startDate) : new Date(),
        completedDate: bill.completedDate ? new Date(bill.completedDate) : undefined
      }));
      
      // Debug response
      //console.log("Processed bills:", processedBills);
      
      setBills(processedBills);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        logger.error('Error fetching bills:', error.response?.data);
        toast.error(error.response?.data || "Failed to fetch bills");
      } else {
        logger.error('Error fetching bills:', error);
        toast.error("Failed to fetch bills");
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const totalDue = bills
    .filter(bill => bill.status === BillStatus.UNPAID)
    .reduce((sum, bill) => sum + bill.amount, 0);

  const upcomingBills = bills
    .filter(bill => bill.status === BillStatus.UPCOMING)
    .length;

  // Filter bills based on search query
  const filteredBills = bills.filter(bill => {
    const categoryName = categories.find(c => c.id === bill.category)?.name || '';
    return bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.provider?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddBill = () => {
    if (!newBill.title || !newBill.amount || !newBill.dueDate || !newBill.category) return;

    const bill: Bill = {
      id: Math.random().toString(36).substr(2, 9),
      title: newBill.title,
      amount: newBill.amount,
      dueDate: newBill.dueDate,
      category: newBill.category as BillCategory,
      status: BillStatus.UNPAID,
      recurring: newBill.recurring || false,
      frequency: newBill.frequency,
      notes: newBill.notes,
      createdAt: new Date(),
      startDate: new Date(),
      autoPayEnabled: false,
      notifyBefore: 0,
      paymentHistory: [],
      attachments: [],
      provider: null,
    };

    setBills([...bills, bill]);
    setIsNewBillOpen(false);
    setNewBill({
      title: '',
      amount: 0,
      dueDate: new Date(),
      category: '',
      status: BillStatus.UNPAID,
      recurring: false,
    });
  };

  const deleteBill = (id: string) => {
    setBills(bills.filter(bill => bill.id !== id));
  };

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case BillStatus.PAID:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case BillStatus.UNPAID:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case BillStatus.OVERDUE:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredBillsByCategory = selectedCategory === 'all'
    ? filteredBills
    : filteredBills.filter(bill => {
        const categoryName = categories.find(c => c.id === bill.category)?.name || '';
        return categoryName === selectedCategory;
      });

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="intelligence">Financial Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Existing dashboard content */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Bills & Payments</h2>
            <Button onClick={() => setIsNewBillOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Due</p>
                    <h3 className="text-2xl font-bold mt-1">${totalDue.toFixed(2)}</h3>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Upcoming Bills</p>
                    <h3 className="text-2xl font-bold mt-1">{upcomingBills}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Overdue Bills</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {bills.filter(bill => bill.status === BillStatus.OVERDUE).length}
                    </h3>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Existing bills list and visualization */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading bills...</p>
            </div>
          ) : filteredBillsByCategory.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBillsByCategory.map((bill) => (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={cn(
                              "p-2 rounded-lg",
                              categories.find(c => c.id === bill.category)?.color || 'bg-gray-500'
                            )}>
                              {categories.find(c => c.id === bill.category)?.icon}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{bill.title}</h3>
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  getStatusColor(bill.status)
                                )}>
                                  {bill.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <span>${bill.amount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  <span>{safeFormatDate(bill.dueDate, 'MMM d, yyyy')}</span>
                                </div>
                                {bill.recurring && (
                                  <div className="flex items-center">
                                    <span>{bill.frequency}</span>
                                  </div>
                                )}
                              </div>
                              {bill.notes && (
                                <p className="text-sm text-gray-500 mt-1">{bill.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteBill(bill.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              
              {/* Bill Visualization */}
              <div className="mt-10">
                <div className={cn(
                  "p-6 rounded-xl",
                  "bg-white/30 dark:bg-gray-900/50",
                  "border border-gray-200/50 dark:border-gray-800"
                )}>
                  <BillVisualization bills={filteredBillsByCategory} />
                </div>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-center py-16 rounded-xl",
                "bg-white/20 dark:bg-gray-900/30",
                "border border-gray-200 dark:border-gray-800"
              )}
            >
              <Receipt className="w-16 h-16 mx-auto mb-4 text-purple-600 dark:text-purple-400 opacity-50" />
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">No bills found for this month</p>
              <Button 
                variant="outline" 
                className={cn(
                  "border-purple-500/50",
                  "text-purple-600 dark:text-purple-400",
                  "hover:bg-purple-50 dark:hover:bg-purple-500/10",
                  "font-medium"
                )}
                onClick={() => setIsNewBillOpen(true)}
              >
                Add Your First Bill
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Billing Plan</h2>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Budget</span>
                    <span className="font-medium">$5,000.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Spent</span>
                    <span className="font-medium text-green-600">$3,200.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Remaining</span>
                    <span className="font-medium">$1,800.00</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '64%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bills
                    // Filter bills that are not paid yet
                    .filter(bill => bill.status !== BillStatus.PAID)
                    // Sort by due date (earliest first)
                    .sort((a, b) => {
                      // Use safeFormatDate to ensure we're handling dates correctly
                      const aTime = a.dueDate instanceof Date ? a.dueDate.getTime() : 0;
                      const bTime = b.dueDate instanceof Date ? b.dueDate.getTime() : 0;
                      return aTime - bTime;
                    })
                    .slice(0, 5)
                    .map(bill => (
                      <div key={bill.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{bill.title}</p>
                          <p className="text-sm text-gray-500">
                            Due {safeFormatDate(bill.dueDate, 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className="font-medium">${bill.amount.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bill Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => {
                  const categoryBills = bills.filter(bill => bill.category === category.id);
                  const totalAmount = categoryBills.reduce((sum, bill) => sum + bill.amount, 0);
                  
                  return (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", category.color)}>
                          {category.icon}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-500">{categoryBills.length} bills</p>
                        </div>
                      </div>
                      <span className="font-medium">${totalAmount.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Billing Activity</h2>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bills
                  .sort((a, b) => {
                    // Sort by created date (newest first)
                    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                    return bTime - aTime; // Descending order
                  })
                  .slice(0, 10)
                  .map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          categories.find(c => c.id === bill.category)?.color || 'bg-gray-500'
                        )}>
                          {categories.find(c => c.id === bill.category)?.icon}
                        </div>
                        <div>
                          <p className="font-medium">{bill.title}</p>
                          <p className="text-sm text-gray-500">
                            {safeFormatDate(bill.createdAt, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "font-medium",
                          bill.status === BillStatus.PAID ? 'text-green-600' : 'text-red-600'
                        )}>
                          ${bill.amount.toFixed(2)}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          getStatusColor(bill.status)
                        )}>
                          {bill.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bills
                  .filter(bill => bill.status === BillStatus.PAID)
                  .sort((a, b) => {
                    // Sort by created date (newest first)
                    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                    return bTime - aTime; // Descending order
                  })
                  .slice(0, 5)
                  .map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          categories.find(c => c.id === bill.category)?.color || 'bg-gray-500'
                        )}>
                          {categories.find(c => c.id === bill.category)?.icon}
                        </div>
                        <div>
                          <p className="font-medium">{bill.title}</p>
                          <p className="text-sm text-gray-500">
                            Paid on {safeFormatDate(bill.createdAt, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-green-600">
                        ${bill.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Financial Intelligence</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Advanced financial analytics and insights powered by SAM AI
              </p>
            </div>
          </div>

          {/* Financial Intelligence Dashboard */}
          <FinancialIntelligenceDashboard 
            organizationId={userId} 
            className="w-full"
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewBillDialog 
        open={isNewBillOpen} 
        onOpenChange={(open) => setIsNewBillOpen(open)} 
        onSuccess={() => {
          fetchBills();
          toast.success("Bill added successfully");
        }} 
      />
      <BillFilterDialog
        open={isFilterOpen}
        onOpenChange={(open) => setIsFilterOpen(open)}
        filters={{}}
        onApplyFilters={(filters) => {

          // Here you would typically filter your bills based on the selected filters
        }}
        categories={categories.map(c => c.id)}
      />
      {selectedBill && (
        <BillDetailsDialog
          bill={selectedBill}
          open={!!selectedBill}
          onOpenChange={(open) => {
            if (!open) setSelectedBill(null);
          }}
          onEdit={(bill) => {

            // Here you would typically open the edit form
          }}
          onDelete={(id) => {

            // Here you would typically delete the bill
            setSelectedBill(null);
            fetchBills();
          }}
          onMarkAsPaid={(id) => {

            // Here you would typically mark the bill as paid
            fetchBills();
          }}
        />
      )}

      {/* Add Bill Dialog */}
      <Dialog open={isNewBillOpen} onOpenChange={setIsNewBillOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Bill</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Bill Title</Label>
              <Input
                id="title"
                value={newBill.title}
                onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                placeholder="Enter bill title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={newBill.amount}
                onChange={(e) => setNewBill({ ...newBill, amount: parseFloat(e.target.value) })}
                placeholder="Enter amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newBill.category}
                onValueChange={(value) => setNewBill({ ...newBill, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1 rounded", category.color)}>
                          {category.icon}
                        </div>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newBill.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newBill.dueDate ? safeFormatDate(newBill.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newBill.dueDate}
                    onSelect={(date) => setNewBill({ ...newBill, dueDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={newBill.recurring}
                onCheckedChange={(checked) => setNewBill({ ...newBill, recurring: checked as boolean })}
              />
              <Label htmlFor="recurring">Recurring Bill</Label>
            </div>
            {newBill.recurring && (
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newBill.frequency}
                  onValueChange={(value) => setNewBill({ ...newBill, frequency: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newBill.notes}
                onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                placeholder="Add any notes about this bill"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewBillOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBill}>
              Add Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 