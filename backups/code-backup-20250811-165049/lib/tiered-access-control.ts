// Tiered AI Feature Access Control System
// Manages access to AI features based on user subscription tier

export type SubscriptionTier = 'basic' | 'pro' | 'enterprise';

export interface FeatureAccess {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'analytics' | 'content' | 'assessment' | 'support';
  tiers: SubscriptionTier[];
  limits?: {
    [key in SubscriptionTier]?: {
      daily?: number;
      monthly?: number;
      concurrent?: number;
      storage?: number; // MB
    };
  };
  dependencies?: string[]; // Other features this depends on
}

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  features: string[];
  usage: {
    [featureId: string]: {
      daily: number;
      monthly: number;
      lastReset: Date;
    };
  };
  validUntil: Date;
  isActive: boolean;
}

export interface FeatureUsageCheck {
  allowed: boolean;
  reason?: string;
  remainingDaily?: number;
  remainingMonthly?: number;
  upgradeRequired?: boolean;
  suggestedTier?: SubscriptionTier;
}

// Define all AI features and their access levels
export const AI_FEATURES: FeatureAccess[] = [
  // Basic AI Features
  {
    id: 'basic_question_generation',
    name: 'Basic Question Generation',
    description: 'Generate simple questions using AI',
    category: 'ai',
    tiers: ['basic', 'pro', 'enterprise'],
    limits: {
      basic: { daily: 10, monthly: 100 },
      pro: { daily: 50, monthly: 500 },
      enterprise: { daily: 200, monthly: 2000 },
    },
  },
  {
    id: 'content_suggestions',
    name: 'Content Suggestions',
    description: 'AI-powered content recommendations',
    category: 'content',
    tiers: ['basic', 'pro', 'enterprise'],
    limits: {
      basic: { daily: 5, monthly: 50 },
      pro: { daily: 25, monthly: 250 },
      enterprise: { daily: 100, monthly: 1000 },
    },
  },
  {
    id: 'basic_analytics',
    name: 'Basic Analytics',
    description: 'Simple course analytics and insights',
    category: 'analytics',
    tiers: ['basic', 'pro', 'enterprise'],
    limits: {
      basic: { daily: 10, monthly: 100 },
      pro: { daily: 50, monthly: 500 },
      enterprise: { daily: -1, monthly: -1 }, // Unlimited
    },
  },

  // Pro AI Features
  {
    id: 'advanced_question_generation',
    name: 'Advanced Question Generation',
    description: 'Generate complex questions with Bloom\'s taxonomy',
    category: 'ai',
    tiers: ['pro', 'enterprise'],
    limits: {
      pro: { daily: 25, monthly: 250 },
      enterprise: { daily: 100, monthly: 1000 },
    },
    dependencies: ['basic_question_generation'],
  },
  {
    id: 'adaptive_assessments',
    name: 'Adaptive Assessments',
    description: 'AI-driven adaptive testing and assessment',
    category: 'assessment',
    tiers: ['pro', 'enterprise'],
    limits: {
      pro: { daily: 10, monthly: 100 },
      enterprise: { daily: 50, monthly: 500 },
    },
  },
  {
    id: 'ai_tutor',
    name: 'AI Tutor',
    description: 'Personal AI tutor for students',
    category: 'ai',
    tiers: ['pro', 'enterprise'],
    limits: {
      pro: { daily: 20, monthly: 200 },
      enterprise: { daily: 100, monthly: 1000 },
    },
  },
  {
    id: 'predictive_analytics',
    name: 'Predictive Analytics',
    description: 'AI-powered predictions and insights',
    category: 'analytics',
    tiers: ['pro', 'enterprise'],
    limits: {
      pro: { daily: 10, monthly: 100 },
      enterprise: { daily: 50, monthly: 500 },
    },
  },
  {
    id: 'content_curation',
    name: 'AI Content Curation',
    description: 'Automated content organization and curation',
    category: 'content',
    tiers: ['pro', 'enterprise'],
    limits: {
      pro: { daily: 15, monthly: 150 },
      enterprise: { daily: 75, monthly: 750 },
    },
  },

  // Enterprise AI Features
  {
    id: 'bulk_content_generation',
    name: 'Bulk Content Generation',
    description: 'Generate multiple courses and content at once',
    category: 'ai',
    tiers: ['enterprise'],
    limits: {
      enterprise: { daily: 20, monthly: 200 },
    },
    dependencies: ['advanced_question_generation', 'content_curation'],
  },
  {
    id: 'enterprise_analytics',
    name: 'Enterprise Analytics Dashboard',
    description: 'Advanced analytics with real-time insights',
    category: 'analytics',
    tiers: ['enterprise'],
    limits: {
      enterprise: { daily: -1, monthly: -1 }, // Unlimited
    },
  },
  {
    id: 'custom_ai_models',
    name: 'Custom AI Models',
    description: 'Train and deploy custom AI models',
    category: 'ai',
    tiers: ['enterprise'],
    limits: {
      enterprise: { daily: 5, monthly: 50, concurrent: 3 },
    },
  },
  {
    id: 'white_label_ai',
    name: 'White Label AI',
    description: 'Customizable AI interface and branding',
    category: 'ai',
    tiers: ['enterprise'],
    limits: {
      enterprise: { daily: -1, monthly: -1 },
    },
  },
  {
    id: 'api_access',
    name: 'API Access',
    description: 'Full API access to AI features',
    category: 'ai',
    tiers: ['enterprise'],
    limits: {
      enterprise: { daily: 1000, monthly: 10000 },
    },
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: '24/7 priority customer support',
    category: 'support',
    tiers: ['enterprise'],
    limits: {
      enterprise: { daily: -1, monthly: -1 },
    },
  },
  {
    id: 'advanced_integrations',
    name: 'Advanced Integrations',
    description: 'Integration with enterprise systems',
    category: 'ai',
    tiers: ['enterprise'],
    limits: {
      enterprise: { daily: -1, monthly: -1 },
    },
  },
];

export class TieredAccessController {
  private featureMap: Map<string, FeatureAccess>;
  private userSubscriptions: Map<string, UserSubscription>;

  constructor() {
    this.featureMap = new Map(AI_FEATURES.map(f => [f.id, f]));
    this.userSubscriptions = new Map();
  }

  // Check if user has access to a specific feature
  async checkFeatureAccess(
    userId: string, 
    featureId: string, 
    requestedUsage: number = 1
  ): Promise<FeatureUsageCheck> {
    const feature = this.featureMap.get(featureId);
    if (!feature) {
      return { allowed: false, reason: 'Feature not found' };
    }

    const subscription = await this.getUserSubscription(userId);
    if (!subscription || !subscription.isActive) {
      return { 
        allowed: false, 
        reason: 'No active subscription',
        upgradeRequired: true,
        suggestedTier: 'basic',
      };
    }

    // Check if tier has access to this feature
    if (!feature.tiers.includes(subscription.tier)) {
      const suggestedTier = this.getSuggestedTier(featureId);
      return {
        allowed: false,
        reason: `Feature requires ${suggestedTier} subscription`,
        upgradeRequired: true,
        suggestedTier,
      };
    }

    // Check dependencies
    if (feature.dependencies) {
      for (const depId of feature.dependencies) {
        const depCheck = await this.checkFeatureAccess(userId, depId, 0);
        if (!depCheck.allowed) {
          return {
            allowed: false,
            reason: `Missing dependency: ${depId}`,
            upgradeRequired: depCheck.upgradeRequired,
            suggestedTier: depCheck.suggestedTier,
          };
        }
      }
    }

    // Check usage limits
    const limits = feature.limits?.[subscription.tier];
    if (limits) {
      const usage = subscription.usage[featureId] || { daily: 0, monthly: 0, lastReset: new Date() };
      
      // Reset usage if needed
      this.resetUsageIfNeeded(usage);

      // Check daily limit
      if (limits.daily && limits.daily > 0 && usage.daily + requestedUsage > limits.daily) {
        return {
          allowed: false,
          reason: 'Daily limit exceeded',
          remainingDaily: Math.max(0, limits.daily - usage.daily),
        };
      }

      // Check monthly limit
      if (limits.monthly && limits.monthly > 0 && usage.monthly + requestedUsage > limits.monthly) {
        return {
          allowed: false,
          reason: 'Monthly limit exceeded',
          remainingMonthly: Math.max(0, limits.monthly - usage.monthly),
        };
      }

      return {
        allowed: true,
        remainingDaily: limits.daily && limits.daily > 0 ? limits.daily - usage.daily : -1,
        remainingMonthly: limits.monthly && limits.monthly > 0 ? limits.monthly - usage.monthly : -1,
      };
    }

    return { allowed: true };
  }

  // Record feature usage
  async recordFeatureUsage(userId: string, featureId: string, usage: number = 1): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return;

    if (!subscription.usage[featureId]) {
      subscription.usage[featureId] = { daily: 0, monthly: 0, lastReset: new Date() };
    }

    const featureUsage = subscription.usage[featureId];
    this.resetUsageIfNeeded(featureUsage);

    featureUsage.daily += usage;
    featureUsage.monthly += usage;

    // Update subscription
    this.userSubscriptions.set(userId, subscription);
  }

  // Get user's subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    // In a real implementation, this would query the database
    // For now, return a mock subscription
    if (!this.userSubscriptions.has(userId)) {
      // Create a default subscription
      const subscription: UserSubscription = {
        userId,
        tier: 'basic', // Default tier
        features: AI_FEATURES.filter(f => f.tiers.includes('basic')).map(f => f.id),
        usage: {},
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      };
      this.userSubscriptions.set(userId, subscription);
    }

    return this.userSubscriptions.get(userId) || null;
  }

  // Upgrade user subscription
  async upgradeSubscription(userId: string, newTier: SubscriptionTier): Promise<UserSubscription> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    subscription.tier = newTier;
    subscription.features = AI_FEATURES.filter(f => f.tiers.includes(newTier)).map(f => f.id);
    subscription.validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Extend by 30 days

    this.userSubscriptions.set(userId, subscription);
    return subscription;
  }

  // Get features available for a tier
  getFeaturesForTier(tier: SubscriptionTier): FeatureAccess[] {
    return AI_FEATURES.filter(f => f.tiers.includes(tier));
  }

  // Get usage statistics for a user
  async getUserUsageStats(userId: string): Promise<Record<string, any>> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return {};

    const stats: Record<string, any> = {};
    
    for (const [featureId, usage] of Object.entries(subscription.usage)) {
      const feature = this.featureMap.get(featureId);
      const limits = feature?.limits?.[subscription.tier];
      
      stats[featureId] = {
        feature: feature?.name || featureId,
        daily: {
          used: usage.daily,
          limit: limits?.daily || -1,
          remaining: limits?.daily && limits.daily > 0 ? limits.daily - usage.daily : -1,
        },
        monthly: {
          used: usage.monthly,
          limit: limits?.monthly || -1,
          remaining: limits?.monthly && limits.monthly > 0 ? limits.monthly - usage.monthly : -1,
        },
      };
    }

    return stats;
  }

  // Get suggested tier for a feature
  private getSuggestedTier(featureId: string): SubscriptionTier {
    const feature = this.featureMap.get(featureId);
    if (!feature) return 'basic';

    // Return the lowest tier that has access to this feature
    if (feature.tiers.includes('basic')) return 'basic';
    if (feature.tiers.includes('pro')) return 'pro';
    return 'enterprise';
  }

  // Reset usage counters if needed
  private resetUsageIfNeeded(usage: { daily: number; monthly: number; lastReset: Date }): void {
    const now = new Date();
    const lastReset = new Date(usage.lastReset);

    // Reset daily if it's a new day
    if (now.getDate() !== lastReset.getDate() || 
        now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      usage.daily = 0;
    }

    // Reset monthly if it's a new month
    if (now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      usage.monthly = 0;
    }

    usage.lastReset = now;
  }

  // Get tier comparison
  getTierComparison(): Record<SubscriptionTier, { 
    features: FeatureAccess[], 
    price?: string,
    limits: Record<string, any> 
  }> {
    return {
      basic: {
        features: this.getFeaturesForTier('basic'),
        price: '$9/month',
        limits: {
          questionGeneration: '10/day',
          analytics: 'Basic',
          support: 'Email',
        },
      },
      pro: {
        features: this.getFeaturesForTier('pro'),
        price: '$29/month',
        limits: {
          questionGeneration: '50/day',
          analytics: 'Advanced',
          support: 'Priority Email',
          aiTutor: 'Included',
        },
      },
      enterprise: {
        features: this.getFeaturesForTier('enterprise'),
        price: '$99/month',
        limits: {
          questionGeneration: 'Unlimited',
          analytics: 'Enterprise',
          support: '24/7 Priority',
          customModels: 'Included',
          apiAccess: 'Full',
        },
      },
    };
  }
}

// Export singleton instance
export const accessController = new TieredAccessController();