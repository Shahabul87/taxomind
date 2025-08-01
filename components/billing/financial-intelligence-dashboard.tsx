"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Users,
  CreditCard,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Lightbulb,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Eye,
  Brain,
  Activity,
  Award,
  Clock,
  Settings,
  LineChart,
  Globe,
  Percent,
  Coins,
  Banknote,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  ShoppingCart,
  Package,
  Repeat,
  UserCheck,
  UserMinus,
  ChevronUp,
  ChevronDown,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";

// Advanced chart components
import {
  ClientLineChart,
  ClientBarChart,
  ClientPieChart,
  ClientAreaChart
} from "@/components/charts/client-charts";

interface FinancialIntelligenceProps {
  organizationId?: string;
  className?: string;
}

interface FinancialMetrics {
  revenue: {
    totalRevenue: number;
    recurringRevenue: number;
    oneTimeRevenue: number;
    revenueGrowth: {
      monthly: number;
      quarterly: number;
      yearly: number;
    };
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    churnRate: number;
    revenueBySource: {
      source: string;
      amount: number;
      percentage: number;
      trend: string;
    }[];
  };
  costs: {
    totalCosts: number;
    fixedCosts: number;
    variableCosts: number;
    costPerStudent: number;
    costCategories: {
      category: string;
      amount: number;
      percentage: number;
      optimizationPotential: number;
    }[];
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
    customerAcquisitionCost: number;
    returnOnInvestment: number;
    profitableCourses: any[];
    unprofitableCourses: any[];
  };
  pricing: {
    currentPricing: {
      basePrice: number;
      dynamicPricing: boolean;
    };
    optimalPricing: {
      basePrice: number;
    };
    priceElasticity: number;
    recommendations: {
      action: string;
      expectedImpact: number;
      confidence: number;
      rationale: string;
    }[];
  };
  subscriptions: {
    totalSubscribers: number;
    activeSubscribers: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    averageSubscriptionValue: number;
    churnRate: number;
    retentionRate: number;
    tierDistribution: {
      tier: string;
      subscribers: number;
      revenue: number;
      churnRate: number;
    }[];
  };
  forecasts: {
    shortTerm: {
      period: string;
      projectedRevenue: number;
      projectedCosts: number;
      projectedProfit: number;
      projectedGrowth: number;
    };
    mediumTerm: {
      period: string;
      projectedRevenue: number;
      projectedCosts: number;
      projectedProfit: number;
      projectedGrowth: number;
    };
    scenarios: {
      scenario: string;
      probability: number;
      revenue: number;
      profit: number;
    }[];
    confidence: number;
  };
  recommendations: {
    category: string;
    priority: string;
    recommendation: string;
    expectedImpact: {
      revenue?: number;
      cost?: number;
      timeframe: string;
    };
  }[];
}

export const FinancialIntelligenceDashboard = ({ organizationId, className }: FinancialIntelligenceProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "costs" | "pricing" | "forecasts">("overview");
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "12m">("3m");
  const [financialData, setFinancialData] = useState<FinancialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load financial intelligence data
  useEffect(() => {
    loadFinancialData();
  }, [timeRange, organizationId, loadFinancialData]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadFinancialData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, organizationId, loadFinancialData]);

  const loadFinancialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateRange = getDateRangeFromSelection(timeRange);
      
      const response = await axios.post("/api/sam/financial-intelligence", {
        action: "analyze-financials",
        data: {
          organizationId,
          dateRange
        }
      });

      if (response.data.success) {
        setFinancialData(response.data.data);
      } else {
        // Use demo data as fallback
        setFinancialData(getDemoFinancialData());
        toast.info("Using demo financial data");
      }
    } catch (error) {
      console.error("Failed to load financial data:", error);
      // Use demo data as fallback
      setFinancialData(getDemoFinancialData());
      toast.error("Failed to load financial data, showing demo data");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, organizationId]);

  const getDateRangeFromSelection = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case "1m":
        start.setMonth(start.getMonth() - 1);
        break;
      case "3m":
        start.setMonth(start.getMonth() - 3);
        break;
      case "6m":
        start.setMonth(start.getMonth() - 6);
        break;
      case "12m":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <LineChart className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const renderOverviewDashboard = () => {
    if (!financialData) return null;

    return (
      <div className="space-y-6">
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(financialData.revenue.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    {getTrendIcon(financialData.revenue.revenueGrowth.monthly)}
                    <span className={getTrendColor(financialData.revenue.revenueGrowth.monthly)}>
                      {Math.abs(financialData.revenue.revenueGrowth.monthly)}% vs last period
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Net Profit</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(financialData.profitability.netProfit)}
                  </p>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <span className="text-blue-600 dark:text-blue-400">
                      {financialData.profitability.netMargin.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">MRR</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency(financialData.subscriptions.monthlyRecurringRevenue)}
                  </p>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <Repeat className="w-3 h-3 text-purple-600" />
                    <span className="text-purple-600 dark:text-purple-400">
                      {financialData.subscriptions.activeSubscribers} subscribers
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                  <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">CAC</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {formatCurrency(financialData.profitability.customerAcquisitionCost)}
                  </p>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <Users className="w-3 h-3 text-orange-600" />
                    <span className="text-orange-600 dark:text-orange-400">
                      vs CLV: {formatCurrency(financialData.revenue.customerLifetimeValue)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-full">
                  <Calculator className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Sources & Growth Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Revenue Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ClientPieChart
                  data={financialData.revenue.revenueBySource.map(source => ({
                    name: source.source,
                    value: source.amount
                  }))}
                  colors={['#8b5cf6', '#3b82f6', '#10b981', '#f472b6', '#f59e0b']}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Financial Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ClientBarChart
                  data={[
                    {
                      period: "Current",
                      revenue: financialData.revenue.totalRevenue,
                      costs: financialData.costs.totalCosts,
                      profit: financialData.profitability.netProfit
                    },
                    {
                      period: financialData.forecasts.shortTerm.period,
                      revenue: financialData.forecasts.shortTerm.projectedRevenue,
                      costs: financialData.forecasts.shortTerm.projectedCosts,
                      profit: financialData.forecasts.shortTerm.projectedProfit
                    },
                    {
                      period: financialData.forecasts.mediumTerm.period,
                      revenue: financialData.forecasts.mediumTerm.projectedRevenue,
                      costs: financialData.forecasts.mediumTerm.projectedCosts,
                      profit: financialData.forecasts.mediumTerm.projectedProfit
                    }
                  ]}
                  xDataKey="period"
                  barDataKey="profit"
                  color="#10b981"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI-Powered Financial Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className={cn("p-2 rounded-full", {
                    'bg-red-100 dark:bg-red-900/30': rec.priority === 'high',
                    'bg-yellow-100 dark:bg-yellow-900/30': rec.priority === 'medium',
                    'bg-blue-100 dark:bg-blue-900/30': rec.priority === 'low'
                  })}>
                    <Brain className={cn("w-4 h-4", {
                      'text-red-600': rec.priority === 'high',
                      'text-yellow-600': rec.priority === 'medium',
                      'text-blue-600': rec.priority === 'low'
                    })} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.category}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{rec.recommendation}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Expected impact: {rec.expectedImpact.revenue ? formatCurrency(rec.expectedImpact.revenue) + ' revenue' : 
                                      rec.expectedImpact.cost ? formatCurrency(rec.expectedImpact.cost) + ' cost savings' : 'TBD'} 
                      • Timeframe: {rec.expectedImpact.timeframe}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRevenueDashboard = () => {
    if (!financialData) return null;

    return (
      <div className="space-y-6">
        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.revenue.totalRevenue)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Repeat className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.revenue.recurringRevenue)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recurring Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.revenue.oneTimeRevenue)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">One-time Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ARPU & CLV */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Per User Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Revenue Per User (ARPU)</span>
                <span className="text-lg font-bold">{formatCurrency(financialData.revenue.averageRevenuePerUser)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Customer Lifetime Value (CLV)</span>
                <span className="text-lg font-bold">{formatCurrency(financialData.revenue.customerLifetimeValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Churn Rate</span>
                <span className="text-lg font-bold text-red-600">{financialData.revenue.churnRate.toFixed(1)}%</span>
              </div>
              <Progress value={100 - financialData.revenue.churnRate} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth Trends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Growth</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(financialData.revenue.revenueGrowth.monthly)}
                  <span className={getTrendColor(financialData.revenue.revenueGrowth.monthly)}>
                    {Math.abs(financialData.revenue.revenueGrowth.monthly).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Quarterly Growth</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(financialData.revenue.revenueGrowth.quarterly)}
                  <span className={getTrendColor(financialData.revenue.revenueGrowth.quarterly)}>
                    {Math.abs(financialData.revenue.revenueGrowth.quarterly).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Yearly Growth</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(financialData.revenue.revenueGrowth.yearly)}
                  <span className={getTrendColor(financialData.revenue.revenueGrowth.yearly)}>
                    {Math.abs(financialData.revenue.revenueGrowth.yearly).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Sources Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData.revenue.revenueBySource.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="font-medium text-sm">{source.source}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {source.percentage.toFixed(1)}% of total revenue
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(source.amount)}</p>
                    <Badge variant={source.trend === 'increasing' ? 'default' : source.trend === 'decreasing' ? 'destructive' : 'secondary'}>
                      {source.trend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCostsDashboard = () => {
    if (!financialData) return null;

    return (
      <div className="space-y-6">
        {/* Cost Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Wallet className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.costs.totalCosts)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Costs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.costs.fixedCosts)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fixed Costs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.costs.variableCosts)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Variable Costs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Categories & Per Unit Costs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData.costs.costCategories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category.category}</span>
                      <div className="text-right">
                        <span className="font-bold">{formatCurrency(category.amount)}</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {category.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    {category.optimizationPotential > 0.3 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        💡 High optimization potential: {(category.optimizationPotential * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Per-Unit Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div>
                  <p className="font-medium text-sm">Cost Per Student</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Monthly operational cost</p>
                </div>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(financialData.costs.costPerStudent)}</p>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div>
                  <p className="font-medium text-sm">Customer Acquisition Cost</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Marketing cost per new customer</p>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(financialData.profitability.customerAcquisitionCost)}</p>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-medium mb-2">Cost Efficiency Ratio</p>
                <div className="flex items-center gap-2">
                  <Progress value={(financialData.costs.fixedCosts / financialData.costs.totalCosts) * 100} className="flex-1 h-3" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {((financialData.costs.fixedCosts / financialData.costs.totalCosts) * 100).toFixed(1)}% fixed
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderPricingDashboard = () => {
    if (!financialData) return null;

    return (
      <div className="space-y-6">
        {/* Pricing Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Coins className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.pricing.currentPricing.basePrice)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Base Price</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.pricing.optimalPricing.basePrice)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Optimal Price</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Percent className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{financialData.pricing.priceElasticity.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Price Elasticity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Strategy Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current vs Optimal Pricing</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Current Price</span>
                      <span className="font-bold">{formatCurrency(financialData.pricing.currentPricing.basePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Optimal Price</span>
                      <span className="font-bold text-green-600">{formatCurrency(financialData.pricing.optimalPricing.basePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Potential Uplift</span>
                      <span className="font-bold text-blue-600">
                        {(((financialData.pricing.optimalPricing.basePrice - financialData.pricing.currentPricing.basePrice) / financialData.pricing.currentPricing.basePrice) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Pricing Features</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dynamic Pricing</span>
                      <Badge variant={financialData.pricing.currentPricing.dynamicPricing ? 'default' : 'secondary'}>
                        {financialData.pricing.currentPricing.dynamicPricing ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Price Elasticity</span>
                      <Badge variant={Math.abs(financialData.pricing.priceElasticity) > 1 ? 'default' : 'secondary'}>
                        {Math.abs(financialData.pricing.priceElasticity) > 1 ? 'Elastic' : 'Inelastic'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Price Elasticity Impact</h4>
                <div className="h-[200px]">
                  <ClientAreaChart
                    data={[
                      { price: financialData.pricing.currentPricing.basePrice * 0.8, demand: 120 },
                      { price: financialData.pricing.currentPricing.basePrice * 0.9, demand: 110 },
                      { price: financialData.pricing.currentPricing.basePrice, demand: 100 },
                      { price: financialData.pricing.currentPricing.basePrice * 1.1, demand: 85 },
                      { price: financialData.pricing.currentPricing.basePrice * 1.2, demand: 70 }
                    ]}
                    xDataKey="price"
                    areaDataKey="demand"
                    color="#8b5cf6"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Pricing Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData.pricing.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{rec.action}</h4>
                      <Badge variant="outline">
                        {(rec.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.rationale}</p>
                    <p className="text-sm font-medium text-green-600">
                      Expected impact: {formatCurrency(rec.expectedImpact)} additional revenue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderForecastsDashboard = () => {
    if (!financialData) return null;

    return (
      <div className="space-y-6">
        {/* Forecast Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Short-term Forecast (3 months)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Projected Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(financialData.forecasts.shortTerm.projectedRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Projected Costs</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(financialData.forecasts.shortTerm.projectedCosts)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Projected Profit</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(financialData.forecasts.shortTerm.projectedProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Growth Rate</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(financialData.forecasts.shortTerm.projectedGrowth)}
                  <span className={getTrendColor(financialData.forecasts.shortTerm.projectedGrowth)}>
                    {Math.abs(financialData.forecasts.shortTerm.projectedGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medium-term Forecast (6 months)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Projected Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(financialData.forecasts.mediumTerm.projectedRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Projected Costs</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(financialData.forecasts.mediumTerm.projectedCosts)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Projected Profit</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(financialData.forecasts.mediumTerm.projectedProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Growth Rate</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(financialData.forecasts.mediumTerm.projectedGrowth)}
                  <span className={getTrendColor(financialData.forecasts.mediumTerm.projectedGrowth)}>
                    {Math.abs(financialData.forecasts.mediumTerm.projectedGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scenario Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Scenario Analysis
              <Badge variant="outline">
                {(financialData.forecasts.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {financialData.forecasts.scenarios.map((scenario, index) => (
                <div key={index} className={cn("p-4 rounded-lg border", {
                  'bg-green-50 dark:bg-green-900/20 border-green-200': scenario.scenario === 'Best Case',
                  'bg-blue-50 dark:bg-blue-900/20 border-blue-200': scenario.scenario === 'Most Likely',
                  'bg-red-50 dark:bg-red-900/20 border-red-200': scenario.scenario === 'Worst Case'
                })}>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-sm">{scenario.scenario}</h4>
                    <Badge variant="outline" className="text-xs">
                      {(scenario.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Revenue</span>
                      <span className="text-sm font-medium">{formatCurrency(scenario.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Profit</span>
                      <span className="text-sm font-medium">{formatCurrency(scenario.profit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Projections Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Projections Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ClientLineChart
                data={[
                  {
                    period: "Current",
                    revenue: financialData.revenue.totalRevenue,
                    costs: financialData.costs.totalCosts,
                    profit: financialData.profitability.netProfit
                  },
                  {
                    period: "3 Months",
                    revenue: financialData.forecasts.shortTerm.projectedRevenue,
                    costs: financialData.forecasts.shortTerm.projectedCosts,
                    profit: financialData.forecasts.shortTerm.projectedProfit
                  },
                  {
                    period: "6 Months",
                    revenue: financialData.forecasts.mediumTerm.projectedRevenue,
                    costs: financialData.forecasts.mediumTerm.projectedCosts,
                    profit: financialData.forecasts.mediumTerm.projectedProfit
                  }
                ]}
                xDataKey="period"
                lineDataKey="profit"
                color="#10b981"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading && !financialData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 animate-pulse text-green-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading Financial Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Intelligence</h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered financial analytics, revenue optimization, and predictive insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label className="text-sm">Auto-refresh</Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadFinancialData()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="costs">
            <Wallet className="w-4 h-4 mr-2" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <Target className="w-4 h-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="forecasts">
            <TrendingUp className="w-4 h-4 mr-2" />
            Forecasts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverviewDashboard()}
        </TabsContent>

        <TabsContent value="revenue">
          {renderRevenueDashboard()}
        </TabsContent>

        <TabsContent value="costs">
          {renderCostsDashboard()}
        </TabsContent>

        <TabsContent value="pricing">
          {renderPricingDashboard()}
        </TabsContent>

        <TabsContent value="forecasts">
          {renderForecastsDashboard()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Demo data function
function getDemoFinancialData(): FinancialMetrics {
  return {
    revenue: {
      totalRevenue: 125000,
      recurringRevenue: 95000,
      oneTimeRevenue: 30000,
      revenueGrowth: {
        monthly: 12.5,
        quarterly: 45.2,
        yearly: 250.8
      },
      averageRevenuePerUser: 85,
      customerLifetimeValue: 2040,
      churnRate: 3.2,
      revenueBySource: [
        { source: "Course Sales", amount: 75000, percentage: 60, trend: "increasing" },
        { source: "Subscriptions", amount: 40000, percentage: 32, trend: "stable" },
        { source: "Enterprise", amount: 10000, percentage: 8, trend: "increasing" }
      ]
    },
    costs: {
      totalCosts: 85000,
      fixedCosts: 35000,
      variableCosts: 50000,
      costPerStudent: 45,
      costCategories: [
        { category: "Infrastructure", amount: 25000, percentage: 29.4, optimizationPotential: 0.3 },
        { category: "Content Creation", amount: 30000, percentage: 35.3, optimizationPotential: 0.4 },
        { category: "Marketing", amount: 20000, percentage: 23.5, optimizationPotential: 0.5 },
        { category: "Operations", amount: 10000, percentage: 11.8, optimizationPotential: 0.2 }
      ]
    },
    profitability: {
      grossProfit: 75000,
      netProfit: 40000,
      grossMargin: 60,
      netMargin: 32,
      customerAcquisitionCost: 35,
      returnOnInvestment: 47,
      profitableCourses: [],
      unprofitableCourses: []
    },
    pricing: {
      currentPricing: {
        basePrice: 49.99,
        dynamicPricing: false
      },
      optimalPricing: {
        basePrice: 57.49
      },
      priceElasticity: -1.2,
      recommendations: [
        {
          action: "Increase base prices by 15%",
          expectedImpact: 18750,
          confidence: 0.8,
          rationale: "Current prices below market optimal"
        },
        {
          action: "Implement dynamic pricing",
          expectedImpact: 12500,
          confidence: 0.7,
          rationale: "High price elasticity indicates opportunity"
        }
      ]
    },
    subscriptions: {
      totalSubscribers: 1250,
      activeSubscribers: 1180,
      monthlyRecurringRevenue: 95000,
      annualRecurringRevenue: 1140000,
      averageSubscriptionValue: 80.5,
      churnRate: 4.2,
      retentionRate: 95.8,
      tierDistribution: [
        { tier: "Basic", subscribers: 750, revenue: 45000, churnRate: 5.1 },
        { tier: "Premium", subscribers: 350, revenue: 35000, churnRate: 2.8 },
        { tier: "Enterprise", subscribers: 80, revenue: 15000, churnRate: 1.2 }
      ]
    },
    forecasts: {
      shortTerm: {
        period: "3 months",
        projectedRevenue: 165000,
        projectedCosts: 95000,
        projectedProfit: 70000,
        projectedGrowth: 32
      },
      mediumTerm: {
        period: "6 months",
        projectedRevenue: 210000,
        projectedCosts: 115000,
        projectedProfit: 95000,
        projectedGrowth: 68
      },
      scenarios: [
        { scenario: "Best Case", probability: 0.2, revenue: 280000, profit: 145000 },
        { scenario: "Most Likely", probability: 0.6, revenue: 210000, profit: 95000 },
        { scenario: "Worst Case", probability: 0.2, revenue: 165000, profit: 55000 }
      ],
      confidence: 0.78
    },
    recommendations: [
      {
        category: "pricing",
        priority: "high",
        recommendation: "Implement dynamic pricing strategy",
        expectedImpact: { revenue: 25000, timeframe: "3 months" }
      },
      {
        category: "cost",
        priority: "medium",
        recommendation: "Optimize marketing costs",
        expectedImpact: { cost: 8000, timeframe: "2 months" }
      },
      {
        category: "revenue",
        priority: "high",
        recommendation: "Launch enterprise tier",
        expectedImpact: { revenue: 35000, timeframe: "6 months" }
      }
    ]
  };
}