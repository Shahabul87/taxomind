"use client";

import { useMemo } from "react";
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { EnhancedSubscription } from "./types";
import { differenceInDays, format, isBefore, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";

interface SubscriptionStatsProps {
  subscriptions: EnhancedSubscription[];
}

export const SubscriptionStats = ({ subscriptions }: SubscriptionStatsProps) => {
  // Memoize stats calculation to prevent recalculation on every render
  const stats = useMemo(() => {
    // Define today outside the loop to avoid creating new Date objects repeatedly
    const today = new Date();
    
    // Calculate total monthly and yearly costs
    let totalMonthly = 0;
    let totalYearly = 0;
    const byCategory: Record<string, number> = {};
    const byPaymentMethod: Record<string, number> = {};
    
    // Calculate upcoming payments within the next 30 days
    const upcomingPayments = [];
    
    for (const sub of subscriptions) {
      // Skip expired subscriptions that aren't renewing
      const subEndDate = new Date(sub.endOfSubscription);
      const isExpired = isBefore(subEndDate, today);
        
      if (isExpired && sub.isRenewing === false) continue;
      
      // Add to category stats
      if (sub.category) {
        byCategory[sub.category] = (byCategory[sub.category] || 0) + sub.amount;
      } else {
        byCategory["Other"] = (byCategory["Other"] || 0) + sub.amount;
      }
      
      // Add to payment method stats
      const paymentMethod = sub.cardUsed?.slice(-4) || "Unknown"; // Use last 4 digits as identifier
      byPaymentMethod[paymentMethod] = (byPaymentMethod[paymentMethod] || 0) + sub.amount;
      
      // Determine billing cycle and add to totals
      // For simplicity, we'll assume all are monthly if not specified
      totalMonthly += sub.amount;
      totalYearly += sub.amount * 12;
      
      // Check if this is an upcoming payment within 30 days
      const renewalDate = sub.endOfSubscription ? subEndDate : null;
      
      if (renewalDate) {
        const daysLeft = differenceInDays(renewalDate, today);
        
        if (daysLeft <= 30 && daysLeft >= 0) {
          upcomingPayments.push({
            id: sub.id,
            name: sub.name,
            amount: sub.amount,
            dueDate: renewalDate,
            daysLeft
          });
        }
      }
    }
    
    // Sort upcoming payments by days left
    upcomingPayments.sort((a, b) => a.daysLeft - b.daysLeft);
    
    return {
      totalMonthly,
      totalYearly,
      byCategory,
      byPaymentMethod,
      upcomingPayments
    };
  }, [subscriptions]); // Only depend on subscriptions changing
  
  const hasUpcomingPayments = stats.upcomingPayments.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/30 border border-indigo-100 dark:border-indigo-800/40 rounded-xl p-4 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-600 dark:text-indigo-300 text-sm font-medium">Monthly Expenses</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${stats.totalMonthly.toFixed(2)}
              </h3>
            </div>
            <div className="bg-indigo-100 dark:bg-indigo-800/60 p-2 rounded-lg">
              <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {subscriptions.length} active subscriptions
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/40 dark:to-green-900/30 border border-emerald-100 dark:border-emerald-800/40 rounded-xl p-4 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-600 dark:text-emerald-300 text-sm font-medium">Yearly Total</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${stats.totalYearly.toFixed(2)}
              </h3>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-800/60 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Projected annual spending
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "border rounded-xl p-4 shadow-sm",
            hasUpcomingPayments
              ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/30 border-amber-100 dark:border-amber-800/40"
              : "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/40 dark:to-slate-900/30 border-gray-100 dark:border-gray-800/40"
          )}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className={cn(
                "text-sm font-medium",
                hasUpcomingPayments 
                  ? "text-amber-600 dark:text-amber-300"
                  : "text-gray-600 dark:text-gray-300"
              )}>
                Upcoming Payments
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {hasUpcomingPayments 
                  ? stats.upcomingPayments.length 
                  : 0}
              </h3>
            </div>
            <div className={cn(
              "p-2 rounded-lg",
              hasUpcomingPayments 
                ? "bg-amber-100 dark:bg-amber-800/60"
                : "bg-gray-100 dark:bg-gray-800/60"
            )}>
              <Calendar className={cn(
                "h-5 w-5",
                hasUpcomingPayments 
                  ? "text-amber-600 dark:text-amber-300"
                  : "text-gray-600 dark:text-gray-300"
              )} />
            </div>
          </div>
          {hasUpcomingPayments ? (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Next: {stats.upcomingPayments[0].name} in {stats.upcomingPayments[0].daysLeft} days
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              No payments due soon
            </p>
          )}
        </motion.div>
      </div>
      
      {/* Upcoming Payments Section */}
      {hasUpcomingPayments && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              Upcoming Payments
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {stats.upcomingPayments.map((payment) => (
              <div key={payment.id} className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{payment.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Due on {format(payment.dueDate, "MMM d, yyyy")}
                  </p>
                </div>
                
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 dark:text-white mr-3">
                    ${payment.amount.toFixed(2)}
                  </span>
                  <Badge daysLeft={payment.daysLeft} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Badge component for days left
const Badge = ({ daysLeft }: { daysLeft: number }) => {
  let color = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
  let text = `${daysLeft} days`;
  
  if (daysLeft === 0) {
    color = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    text = "Today";
  } else if (daysLeft === 1) {
    color = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    text = "Tomorrow";
  } else if (daysLeft <= 3) {
    color = "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
  }
  
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
      {text}
    </span>
  );
}; 