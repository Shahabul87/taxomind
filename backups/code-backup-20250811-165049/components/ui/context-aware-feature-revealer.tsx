"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Eye, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Target, 
  Star, 
  Crown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useProgressiveDisclosureSystem, ProgressiveFeature } from '@/lib/progressive-disclosure-system';

interface ContextAwareFeatureRevealerProps {
  userId?: string;
  currentPage?: string;
  contextualData?: Record<string, any>;
  className?: string;
}

interface FeatureRevealCardProps {
  feature: ProgressiveFeature;
  onUnlock: (featureId: string) => void;
  onDismiss: (featureId: string) => void;
  className?: string;
}

const getFeatureIcon = (featureId: string) => {
  switch (featureId) {
    case 'advanced-charts': return <TrendingUp className="w-5 h-5" />;
    case 'risk-analysis': return <AlertCircle className="w-5 h-5" />;
    case 'cognitive-analytics': return <Target className="w-5 h-5" />;
    case 'ai-bulk-generation': return <Sparkles className="w-5 h-5" />;
    case 'advanced-ai-settings': return <Crown className="w-5 h-5" />;
    case 'smart-presets': return <Star className="w-5 h-5" />;
    case 'intelligent-onboarding': return <BookOpen className="w-5 h-5" />;
    default: return <Eye className="w-5 h-5" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'basic':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        accent: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700'
      };
    case 'advanced':
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        accent: 'text-purple-600 dark:text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700'
      };
    case 'expert':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-300',
        accent: 'text-amber-600 dark:text-amber-400',
        button: 'bg-amber-600 hover:bg-amber-700'
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        accent: 'text-gray-600 dark:text-gray-400',
        button: 'bg-gray-600 hover:bg-gray-700'
      };
  }
};

const FeatureRevealCard = ({ feature, onUnlock, onDismiss, className }: FeatureRevealCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const colors = getCategoryColor(feature.category);
  
  const handleUnlock = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onUnlock(feature.id);
      setIsAnimating(false);
    }, 1000);
  };

  const getFeatureDescription = (featureId: string) => {
    switch (featureId) {
      case 'advanced-charts':
        return 'Unlock detailed performance charts and trend analysis to better understand student progress patterns.';
      case 'risk-analysis':
        return 'Identify students who may need additional support with AI-powered risk assessment and intervention suggestions.';
      case 'cognitive-analytics':
        return 'Deep dive into Bloom\'s taxonomy analysis and cognitive skill development tracking across all assessments.';
      case 'ai-bulk-generation':
        return 'Generate multiple chapters, sections, and assessments automatically with advanced AI configuration options.';
      case 'advanced-ai-settings':
        return 'Fine-tune AI generation with custom prompts, tone settings, difficulty levels, and content personalization.';
      case 'smart-presets':
        return 'Access pre-configured templates and scenarios for common educational contexts and subject areas.';
      case 'intelligent-onboarding':
        return 'Get personalized guidance and tours tailored to your specific teaching goals and experience level.';
      default:
        return 'Unlock this feature to access advanced functionality and enhanced capabilities.';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn('relative', className)}
    >
      <Card className={cn(
        'relative overflow-hidden transition-all duration-200 hover:shadow-lg',
        colors.bg,
        colors.border,
        'ring-2 ring-offset-2 ring-offset-background',
        colors.accent.includes('blue') && 'ring-blue-400/20',
        colors.accent.includes('purple') && 'ring-purple-400/20',
        colors.accent.includes('amber') && 'ring-amber-400/20'
      )}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-current to-transparent opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        {/* Category badge */}
        <div className="absolute top-3 right-3">
          <Badge className={cn(
            'text-xs font-medium',
            colors.button,
            'text-white border-0'
          )}>
            {feature.category}
          </Badge>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg flex-shrink-0',
              colors.bg,
              colors.text
            )}>
              {getFeatureIcon(feature.id)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className={cn('text-lg mb-1', colors.text)}>
                {feature.name}
              </CardTitle>
              <CardDescription className={cn('text-sm', colors.text, 'opacity-80')}>
                {getFeatureDescription(feature.id)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Feature requirements */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className={cn('w-4 h-4', colors.accent)} />
              <span className={cn('text-sm font-medium', colors.text)}>
                Requirements Met
              </span>
            </div>
            <ul className={cn('text-xs space-y-1', colors.text, 'opacity-70')}>
              {feature.dependencies && (
                <li>✓ Prerequisites: {feature.dependencies.join(', ')}</li>
              )}
              {feature.minUsageCount && (
                <li>✓ Minimum usage: {feature.minUsageCount} actions</li>
              )}
              {feature.contextualTriggers?.dataThresholds && (
                <li>✓ Data thresholds: {Object.entries(feature.contextualTriggers.dataThresholds).map(([key, value]) => `${key}: ${value}`).join(', ')}</li>
              )}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUnlock}
              disabled={isAnimating}
              className={cn(
                'flex-1 text-white',
                colors.button
              )}
            >
              {isAnimating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 mr-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Unlocking...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Unlock Feature
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(feature.id)}
              className={cn('px-3', colors.text)}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ContextAwareFeatureRevealer = ({
  userId,
  currentPage,
  contextualData,
  className
}: ContextAwareFeatureRevealerProps) => {
  const {
    system,
    userState,
    trackPageView,
    unlockFeature,
    dismissHint,
    getNextSuggestedFeature,
    updateContextualData,
    getProgressScore,
    getUnlockedFeatures
  } = useProgressiveDisclosureSystem(userId);

  const [suggestedFeature, setSuggestedFeature] = useState<ProgressiveFeature | null>(null);
  const [showFeatureProgress, setShowFeatureProgress] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (currentPage) {
      trackPageView(currentPage);
    }
  }, [currentPage, trackPageView]);

  useEffect(() => {
    if (contextualData) {
      updateContextualData(contextualData);
    }
  }, [contextualData, updateContextualData]);

  useEffect(() => {
    // Check for new suggested features
    const nextFeature = getNextSuggestedFeature();
    setSuggestedFeature(nextFeature);
  }, [userState, getNextSuggestedFeature]);

  const handleUnlockFeature = (featureId: string) => {
    const success = unlockFeature(featureId);
    if (success) {
      setSuggestedFeature(null);
      // Check for next feature after a short delay
      setTimeout(() => {
        const nextFeature = getNextSuggestedFeature();
        setSuggestedFeature(nextFeature);
      }, 2000);
    }
  };

  const handleDismissFeature = (featureId: string) => {
    dismissHint(featureId);
    setSuggestedFeature(null);
    // Check for next feature
    setTimeout(() => {
      const nextFeature = getNextSuggestedFeature();
      setSuggestedFeature(nextFeature);
    }, 500);
  };

  const progressScore = getProgressScore();
  const unlockedFeatures = getUnlockedFeatures();

  if (!isClient) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Feature Progress Indicator */}
      {unlockedFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Feature Progress
            </span>
            <Badge variant="outline" className="text-xs">
              {unlockedFeatures.length} unlocked
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeatureProgress(!showFeatureProgress)}
            className="text-xs"
          >
            {showFeatureProgress ? 'Hide' : 'Show'} Details
          </Button>
        </motion.div>
      )}

      {/* Detailed Progress View */}
      <AnimatePresence>
        {showFeatureProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm font-bold">{progressScore}%</span>
                  </div>
                  <Progress value={progressScore} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Unlocked Features</span>
                      <div className="font-medium">{unlockedFeatures.length}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Session Actions</span>
                      <div className="font-medium">{userState.actionHistory.length}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Suggestion */}
      <AnimatePresence>
        {suggestedFeature && (
          <FeatureRevealCard
            feature={suggestedFeature}
            onUnlock={handleUnlockFeature}
            onDismiss={handleDismissFeature}
            className="mb-4"
          />
        )}
      </AnimatePresence>

      {/* Welcome message for new users */}
      {unlockedFeatures.length === 0 && !suggestedFeature && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Welcome to Progressive Feature Discovery
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            As you use the platform, new features will be unlocked automatically based on your usage patterns.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ContextAwareFeatureRevealer;