"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  Download,
  ExternalLink,
  Users,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FinancialTabProps {
  walletBalance: number;
  affiliateEarnings: number;
  affiliateCode: string | null;
  isTeacher: boolean;
  isAffiliate: boolean;
}

export const FinancialTab = ({
  walletBalance,
  affiliateEarnings,
  affiliateCode,
  isTeacher,
  isAffiliate
}: FinancialTabProps) => {
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Wallet Balance */}
      <div className={cn(
        "p-6 rounded-xl",
        "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
        "backdrop-blur-sm",
        "border border-green-200/50 dark:border-green-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Balance</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(walletBalance)}
              </h2>
            </div>
          </div>
          <Button
            onClick={() => setShowPayoutModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-green-200/30 dark:border-green-700/30">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Available</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(walletBalance * 0.8)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-green-200/30 dark:border-green-700/30">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pending</p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(walletBalance * 0.15)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-green-200/30 dark:border-green-700/30">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">On Hold</p>
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              {formatCurrency(walletBalance * 0.05)}
            </p>
          </div>
        </div>
      </div>

      {/* Teacher Earnings (if teacher) */}
      {isTeacher && (
        <div className={cn(
          "p-6 rounded-xl",
          "bg-white/60 dark:bg-slate-800/60",
          "backdrop-blur-sm",
          "border border-slate-200/30 dark:border-slate-700/30",
          "shadow-lg"
        )}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Instructor Earnings
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Revenue from your courses
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">This Month</span>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(1234.56)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                +24% from last month
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">All Time</span>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(45678.90)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total earnings
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/teacher/courses">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>
      )}

      {/* Affiliate Program (if affiliate) */}
      {isAffiliate && (
        <div className={cn(
          "p-6 rounded-xl",
          "bg-white/60 dark:bg-slate-800/60",
          "backdrop-blur-sm",
          "border border-slate-200/30 dark:border-slate-700/30",
          "shadow-lg"
        )}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Affiliate Program
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Earn by referring new users
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Your Affiliate Code</p>
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono font-semibold text-purple-600 dark:text-purple-400">
                  {affiliateCode || 'AFFILIATE123'}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(affiliateCode || 'AFFILIATE123');
                    alert('Affiliate code copied!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Earnings</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(affiliateEarnings)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Referrals</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  42
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Conversion Rate</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  12.5%
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💰 <strong>Commission:</strong> Earn 10% commission on all referred purchases for the first year!
            </p>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className={cn(
        "p-6 rounded-xl",
        "bg-white/60 dark:bg-slate-800/60",
        "backdrop-blur-sm",
        "border border-slate-200/30 dark:border-slate-700/30",
        "shadow-lg"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Payout Methods
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage how you receive payments
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Add Method
          </Button>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">PP</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">PayPal</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">user@example.com</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded">
                Default
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Add Stripe, Bank Transfer, or other payment methods
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Link */}
      <div className={cn(
        "p-6 rounded-xl",
        "bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/60 dark:to-blue-900/20",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
              Transaction History
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View all your earnings and payouts
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/transactions">
              View All
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
