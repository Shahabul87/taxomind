/**
 * Financial Engine Types
 */
import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';
export interface FinancialEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
export interface FinancialAnalytics {
    revenue: RevenueMetrics;
    costs: CostBreakdown;
    profitability: ProfitabilityAnalysis;
    pricing: PricingAnalysis;
    subscriptions: SubscriptionMetrics;
    forecasts: FinancialForecasts;
    recommendations: FinancialRecommendation[];
}
export interface RevenueMetrics {
    totalRevenue: number;
    recurringRevenue: number;
    oneTimeRevenue: number;
    revenueBySource: RevenueSource[];
    revenueGrowth: GrowthMetrics;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    churnRate: number;
}
export interface RevenueSource {
    source: string;
    amount: number;
    percentage: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    growth: number;
}
export interface GrowthMetrics {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    projectedAnnual: number;
}
export interface CostBreakdown {
    totalCosts: number;
    fixedCosts: number;
    variableCosts: number;
    costCategories: CostCategory[];
    costPerStudent: number;
    costPerCourse: number;
    infrastructureCosts: number;
    contentCreationCosts: number;
    marketingCosts: number;
}
export interface CostCategory {
    category: string;
    amount: number;
    percentage: number;
    isFixed: boolean;
    optimizationPotential: number;
}
export interface ProfitabilityAnalysis {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
    breakEvenPoint: Date;
    profitableCourses: CourseProfitability[];
    unprofitableCourses: CourseProfitability[];
    customerAcquisitionCost: number;
    returnOnInvestment: number;
}
export interface CourseProfitability {
    courseId: string;
    courseName: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    enrollments: number;
    completionRate: number;
    recommendedAction?: string;
}
export interface PricingAnalysis {
    currentPricing: PricingStrategy;
    optimalPricing: PricingStrategy;
    priceElasticity: number;
    competitorAnalysis: CompetitorPricing[];
    pricingExperiments: PricingExperiment[];
    recommendations: PricingRecommendation[];
}
export interface PricingStrategy {
    basePrice: number;
    discountStrategy: DiscountRule[];
    bundleOptions: BundleOption[];
    dynamicPricing: boolean;
    regionPricing: RegionPrice[];
}
export interface DiscountRule {
    type: string;
    discountPercentage: number;
    conditions: string[];
    usage: number;
    revenue: number;
}
export interface BundleOption {
    bundleId: string;
    bundleName: string;
    courses: string[];
    price: number;
    savings: number;
    popularity: number;
}
export interface RegionPrice {
    region: string;
    price: number;
    currency: string;
    purchasingPowerParity: number;
}
export interface CompetitorPricing {
    competitor: string;
    averagePrice: number;
    priceRange: {
        min: number;
        max: number;
    };
    features: string[];
    marketShare: number;
}
export interface PricingExperiment {
    experimentId: string;
    name: string;
    variant: string;
    price: number;
    conversions: number;
    revenue: number;
    significance: number;
    status: 'active' | 'completed' | 'paused';
}
export interface PricingRecommendation {
    action: string;
    expectedImpact: number;
    confidence: number;
    rationale: string;
}
export interface SubscriptionMetrics {
    totalSubscribers: number;
    activeSubscribers: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    averageSubscriptionValue: number;
    churnRate: number;
    retentionRate: number;
    subscriptionGrowth: GrowthMetrics;
    tierDistribution: TierMetrics[];
}
export interface TierMetrics {
    tier: string;
    subscribers: number;
    revenue: number;
    churnRate: number;
    upgradeRate: number;
    downgradeRate: number;
}
export interface FinancialForecasts {
    shortTerm: Forecast;
    mediumTerm: Forecast;
    longTerm: Forecast;
    scenarios: ScenarioAnalysis[];
    confidence: number;
}
export interface Forecast {
    period: string;
    projectedRevenue: number;
    projectedCosts: number;
    projectedProfit: number;
    projectedGrowth: number;
    assumptions: string[];
    risks: string[];
}
export interface ScenarioAnalysis {
    scenario: string;
    probability: number;
    revenue: number;
    profit: number;
    keyFactors: string[];
}
export interface FinancialRecommendation {
    category: 'revenue' | 'cost' | 'pricing' | 'investment';
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    expectedImpact: {
        revenue?: number;
        cost?: number;
        timeframe: string;
    };
    implementation: string[];
    risks: string[];
}
export interface DateRange {
    start: Date;
    end: Date;
}
export interface FinancialEngine {
    analyzeFinancials(organizationId: string, dateRange: DateRange): Promise<FinancialAnalytics>;
}
//# sourceMappingURL=financial.types.d.ts.map