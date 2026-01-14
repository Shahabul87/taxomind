'use client';

import { useState, useCallback, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  CreditCard,
  LineChart,
  BarChart3,
  Calculator,
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Info,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  Target,
  Banknote,
  Building2,
  Coins,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface SimulationResult {
  year: number;
  balance: number;
  contributions: number;
  interest: number;
  totalContributions: number;
  totalInterest: number;
}

interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'bond' | 'etf' | 'crypto' | 'real-estate';
  allocation: number;
  expectedReturn: number;
  risk: 'low' | 'medium' | 'high';
}

interface FinancialSimulatorProps {
  userId: string;
  className?: string;
}

export function FinancialSimulator({ userId, className }: FinancialSimulatorProps) {
  const [activeTab, setActiveTab] = useState('compound');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compound Interest State
  const [principal, setPrincipal] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualRate, setAnnualRate] = useState(7);
  const [years, setYears] = useState(20);
  const [compoundResults, setCompoundResults] = useState<SimulationResult[]>([]);

  // Budget State
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([
    { id: '1', name: 'Housing', allocated: 1500, spent: 1450, color: 'bg-blue-500' },
    { id: '2', name: 'Food', allocated: 600, spent: 520, color: 'bg-green-500' },
    { id: '3', name: 'Transportation', allocated: 400, spent: 380, color: 'bg-yellow-500' },
    { id: '4', name: 'Utilities', allocated: 200, spent: 185, color: 'bg-purple-500' },
    { id: '5', name: 'Entertainment', allocated: 300, spent: 420, color: 'bg-pink-500' },
    { id: '6', name: 'Savings', allocated: 1000, spent: 1000, color: 'bg-emerald-500' },
  ]);

  // Investment Portfolio State
  const [investments, setInvestments] = useState<Investment[]>([
    { id: '1', name: 'S&P 500 Index', type: 'etf', allocation: 40, expectedReturn: 10, risk: 'medium' },
    { id: '2', name: 'Total Bond Market', type: 'bond', allocation: 20, expectedReturn: 4, risk: 'low' },
    { id: '3', name: 'Tech Growth Fund', type: 'stock', allocation: 25, expectedReturn: 12, risk: 'high' },
    { id: '4', name: 'Real Estate REIT', type: 'real-estate', allocation: 15, expectedReturn: 7, risk: 'medium' },
  ]);

  const isLoadingRef = useRef(false);

  const calculateCompoundInterest = useCallback(() => {
    const results: SimulationResult[] = [];
    let balance = principal;
    let totalContributions = principal;
    let totalInterest = 0;

    for (let year = 1; year <= years; year++) {
      const yearlyContribution = monthlyContribution * 12;
      const interest = (balance + yearlyContribution / 2) * (annualRate / 100);

      balance = balance + yearlyContribution + interest;
      totalContributions += yearlyContribution;
      totalInterest += interest;

      results.push({
        year,
        balance: Math.round(balance),
        contributions: yearlyContribution,
        interest: Math.round(interest),
        totalContributions: Math.round(totalContributions),
        totalInterest: Math.round(totalInterest),
      });
    }

    setCompoundResults(results);
  }, [principal, monthlyContribution, annualRate, years]);

  const getTotalBudget = () => budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);
  const getTotalSpent = () => budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const getRemainingBudget = () => monthlyIncome - getTotalBudget();

  const getPortfolioReturn = () => {
    return investments.reduce((sum, inv) => sum + (inv.allocation / 100) * inv.expectedReturn, 0);
  };

  const getRiskIcon = (risk: Investment['risk']) => {
    switch (risk) {
      case 'low':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'high':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
    }
  };

  const getInvestmentIcon = (type: Investment['type']) => {
    switch (type) {
      case 'stock':
        return LineChart;
      case 'bond':
        return Banknote;
      case 'etf':
        return BarChart3;
      case 'crypto':
        return Coins;
      case 'real-estate':
        return Building2;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate on mount
  useState(() => {
    calculateCompoundInterest();
  });

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-muted-foreground">Loading Financial Simulator...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" onClick={() => setError(null)} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Financial Simulator</CardTitle>
              <CardDescription>Learn financial concepts through interactive simulations</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="compound" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Compound Interest
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Budget Planner
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
          </TabsList>

          {/* Compound Interest Tab */}
          <TabsContent value="compound" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Initial Investment</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={principal}
                      onChange={(e) => setPrincipal(Number(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Monthly Contribution</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Annual Return Rate: {annualRate}%</Label>
                  <Slider
                    value={[annualRate]}
                    onValueChange={([value]) => setAnnualRate(value)}
                    min={1}
                    max={15}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Investment Period: {years} years</Label>
                  <Slider
                    value={[years]}
                    onValueChange={([value]) => setYears(value)}
                    min={1}
                    max={40}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <Button onClick={calculateCompoundInterest} className="w-full bg-emerald-500 hover:bg-emerald-600">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Growth
                </Button>
              </div>

              <div className="space-y-4">
                {compoundResults.length > 0 && (
                  <>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                      <p className="text-sm text-emerald-600 font-medium mb-1">Final Balance</p>
                      <p className="text-3xl font-bold text-emerald-700">
                        {formatCurrency(compoundResults[compoundResults.length - 1].balance)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">Total Contributed</p>
                        <p className="text-lg font-bold text-blue-700">
                          {formatCurrency(compoundResults[compoundResults.length - 1].totalContributions)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                        <p className="text-xs text-purple-600 font-medium">Interest Earned</p>
                        <p className="text-lg font-bold text-purple-700">
                          {formatCurrency(compoundResults[compoundResults.length - 1].totalInterest)}
                        </p>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="h-24 flex items-end gap-1">
                      {compoundResults.slice(-10).map((result, i) => (
                        <div
                          key={result.year}
                          className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t transition-all hover:opacity-80"
                          style={{
                            height: `${(result.balance / compoundResults[compoundResults.length - 1].balance) * 100}%`,
                          }}
                          title={`Year ${result.year}: ${formatCurrency(result.balance)}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Budget Planner Tab */}
          <TabsContent value="budget" className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium">Monthly Income</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(monthlyIncome)}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                <p className="text-xs text-amber-600 font-medium">Total Spent</p>
                <p className="text-xl font-bold text-amber-700">{formatCurrency(getTotalSpent())}</p>
              </div>
              <div
                className={cn(
                  'p-3 rounded-lg border',
                  getRemainingBudget() >= 0
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                )}
              >
                <p
                  className={cn(
                    'text-xs font-medium',
                    getRemainingBudget() >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  Remaining
                </p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    getRemainingBudget() >= 0 ? 'text-green-700' : 'text-red-700'
                  )}
                >
                  {formatCurrency(getRemainingBudget())}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {budgetCategories.map((category) => {
                const percentUsed = (category.spent / category.allocated) * 100;
                const isOverBudget = category.spent > category.allocated;

                return (
                  <div key={category.id} className="p-3 rounded-xl border border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', category.color)} />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {formatCurrency(category.spent)}
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-500">{formatCurrency(category.allocated)}</span>
                        {isOverBudget && (
                          <Badge className="bg-red-100 text-red-700">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Over
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress
                      value={Math.min(percentUsed, 100)}
                      className={cn('h-2', isOverBudget && '[&>div]:bg-red-500')}
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
                <p className="text-sm text-indigo-600 font-medium mb-1">Expected Annual Return</p>
                <p className="text-2xl font-bold text-indigo-700">{getPortfolioReturn().toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-1">Portfolio Diversification</p>
                <p className="text-2xl font-bold text-purple-700">{investments.length} Assets</p>
              </div>
            </div>

            {/* Allocation Chart */}
            <div className="flex items-center gap-1 h-8 rounded-lg overflow-hidden">
              {investments.map((inv, i) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];
                return (
                  <div
                    key={inv.id}
                    className={cn('h-full transition-all', colors[i % colors.length])}
                    style={{ width: `${inv.allocation}%` }}
                    title={`${inv.name}: ${inv.allocation}%`}
                  />
                );
              })}
            </div>

            <div className="space-y-3">
              {investments.map((investment, i) => {
                const InvIcon = getInvestmentIcon(investment.type);
                const colors = [
                  'bg-blue-100 text-blue-700 border-blue-200',
                  'bg-green-100 text-green-700 border-green-200',
                  'bg-amber-100 text-amber-700 border-amber-200',
                  'bg-purple-100 text-purple-700 border-purple-200',
                ];

                return (
                  <div
                    key={investment.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', colors[i % colors.length])}>
                          <InvIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{investment.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="outline" className="capitalize">
                              {investment.type}
                            </Badge>
                            <span className="flex items-center gap-1">
                              {getRiskIcon(investment.risk)}
                              <span className="capitalize">{investment.risk} risk</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{investment.allocation}%</p>
                        <p className="text-sm text-green-600 flex items-center justify-end gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {investment.expectedReturn}% return
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Risk Disclaimer */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  This is an educational simulation. Past performance does not guarantee future results.
                  Always consult a financial advisor before making investment decisions.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default FinancialSimulator;
