"use client";

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Zap,
  Building,
  Check,
  X,
  Star,
  TrendingUp,
  Shield,
  Headphones,
  Cpu,
  Clock,
  Users,
  BarChart3,
  Brain,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  accessController,
  SubscriptionTier,
  FeatureAccess,
  UserSubscription,
} from '@/lib/tiered-access-control';

interface SubscriptionManagerProps {
  userId: string;
  currentTier?: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
  className?: string;
}

interface TierCardProps {
  tier: SubscriptionTier;
  features: FeatureAccess[];
  price: string;
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect: (tier: SubscriptionTier) => void;
}

const TierCard: React.FC<TierCardProps> = ({
  tier,
  features,
  price,
  isPopular,
  isCurrent,
  onSelect,
}) => {
  const getTierIcon = () => {
    switch (tier) {
      case 'basic': return <Star className="w-6 h-6" />;
      case 'pro': return <Crown className="w-6 h-6" />;
      case 'enterprise': return <Building className="w-6 h-6" />;
    }
  };

  const getTierColor = () => {
    switch (tier) {
      case 'basic': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/10';
      case 'pro': return 'border-purple-200 bg-purple-50 dark:bg-purple-900/10';
      case 'enterprise': return 'border-gold-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10';
    }
  };

  const getTierName = () => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getFeaturesByCategory = () => {
    const categories = {
      ai: features.filter(f => f.category === 'ai'),
      analytics: features.filter(f => f.category === 'analytics'),
      content: features.filter(f => f.category === 'content'),
      assessment: features.filter(f => f.category === 'assessment'),
      support: features.filter(f => f.category === 'support'),
    };
    return categories;
  };

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200 hover:shadow-lg',
      getTierColor(),
      isPopular && 'ring-2 ring-purple-500 scale-105',
      isCurrent && 'ring-2 ring-green-500'
    )}>
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-purple-600 text-white text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      {isCurrent && (
        <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-center py-1 text-sm font-medium">
          Current Plan
        </div>
      )}
      
      <CardHeader className={cn('text-center', (isPopular || isCurrent) && 'pt-8')}>
        <div className="flex items-center justify-center mb-2">
          {getTierIcon()}
        </div>
        <CardTitle className="text-2xl font-bold">
          {getTierName()}
        </CardTitle>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {price}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          per month, billed annually
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          {Object.entries(getFeaturesByCategory()).map(([category, categoryFeatures]) => {
            if (categoryFeatures.length === 0) return null;
            
            return (
              <div key={category}>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  {category === 'ai' && <Brain className="w-4 h-4" />}
                  {category === 'analytics' && <BarChart3 className="w-4 h-4" />}
                  {category === 'content' && <Sparkles className="w-4 h-4" />}
                  {category === 'assessment' && <TrendingUp className="w-4 h-4" />}
                  {category === 'support' && <Headphones className="w-4 h-4" />}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h4>
                <ul className="space-y-1">
                  {categoryFeatures.slice(0, 3).map((feature) => (
                    <li key={feature.id} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature.name}
                      </span>
                    </li>
                  ))}
                  {categoryFeatures.length > 3 && (
                    <li className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                      +{categoryFeatures.length - 3} more features
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        <Button 
          onClick={() => onSelect(tier)}
          className={cn(
            'w-full',
            isCurrent 
              ? 'bg-green-600 hover:bg-green-700' 
              : tier === 'pro' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900'
          )}
          disabled={isCurrent}
        >
          {isCurrent ? 'Current Plan' : `Upgrade to ${getTierName()}`}
          {!isCurrent && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </CardContent>
    </Card>
  );
};

interface UsageOverviewProps {
  userId: string;
  subscription?: UserSubscription;
}

const UsageOverview: React.FC<UsageOverviewProps> = ({ userId, subscription }) => {
  const [usageStats, setUsageStats] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadUsageStats = async () => {
      const stats = await accessController.getUserUsageStats(userId);
      setUsageStats(stats);
    };
    loadUsageStats();
  }, [userId]);

  if (!subscription) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No subscription found
          </p>
        </CardContent>
      </Card>
    );
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Usage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Tier</span>
                <Badge variant={subscription.tier === 'enterprise' ? 'default' : 'secondary'}>
                  {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Valid Until</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {subscription.validUntil.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <Badge variant={subscription.isActive ? 'default' : 'destructive'}>
                  {subscription.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Features Available</span>
                <span className="font-medium">{subscription.features.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Daily Resets</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Midnight UTC
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(usageStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(usageStats).map(([featureId, stats]: [string, any]) => {
                const dailyPercentage = stats.daily.limit > 0 ? (stats.daily.used / stats.daily.limit) * 100 : 0;
                const monthlyPercentage = stats.monthly.limit > 0 ? (stats.monthly.used / stats.monthly.limit) * 100 : 0;

                return (
                  <div key={featureId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{stats.feature}</span>
                      <Badge variant="outline" className="text-xs">
                        {stats.daily.limit > 0 ? `${stats.daily.used}/${stats.daily.limit}` : 'Unlimited'}
                      </Badge>
                    </div>
                    {stats.daily.limit > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Daily Usage</span>
                          <span className={getUsageColor(dailyPercentage)}>
                            {dailyPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={dailyPercentage} className="h-2" />
                      </div>
                    )}
                    {stats.monthly.limit > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Monthly Usage</span>
                          <span className={getUsageColor(monthlyPercentage)}>
                            {monthlyPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={monthlyPercentage} className="h-2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  userId,
  currentTier,
  onUpgrade,
  className,
}) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    const loadSubscription = async () => {
      const sub = await accessController.getUserSubscription(userId);
      setSubscription(sub);
    };
    loadSubscription();
  }, [userId]);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (subscription?.tier === tier) return;
    
    try {
      const upgradedSub = await accessController.upgradeSubscription(userId, tier);
      setSubscription(upgradedSub);
      onUpgrade?.(tier);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const tierComparison = accessController.getTierComparison();

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose Your AI Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Unlock the full potential of AI-powered education
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(tierComparison).map(([tier, data]) => (
              <TierCard
                key={tier}
                tier={tier as SubscriptionTier}
                features={data.features}
                price={data.price || 'Contact us'}
                isPopular={tier === 'pro'}
                isCurrent={subscription?.tier === tier}
                onSelect={handleUpgrade}
              />
            ))}
          </div>

          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Enterprise Solutions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Need custom features or dedicated support? Our enterprise team can help.
                  </p>
                </div>
                <Button variant="outline" className="ml-auto">
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageOverview userId={userId} subscription={subscription} />
        </TabsContent>
      </Tabs>
    </div>
  );
};