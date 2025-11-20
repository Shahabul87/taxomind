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
  const iconClass = "w-4 h-4 sm:w-5 sm:h-5";
  switch (featureId) {
    case 'advanced-charts': return <TrendingUp className={iconClass} />;
    case 'risk-analysis': return <AlertCircle className={iconClass} />;
    case 'cognitive-analytics': return <Target className={iconClass} />;
    case 'ai-bulk-generation': return <Sparkles className={iconClass} />;
    case 'advanced-ai-settings': return <Crown className={iconClass} />;
    case 'smart-presets': return <Star className={iconClass} />;
    case 'intelligent-onboarding': return <BookOpen className={iconClass} />;
    default: return <Eye className={iconClass} />;
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
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <Badge className={cn(
            'text-[10px] xs:text-xs font-medium',
            colors.button,
            'text-white border-0'
          )}>
            {feature.category}
          </Badge>
        </div>

        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className={cn(
              'p-1.5 sm:p-2 rounded-lg flex-shrink-0',
              colors.bg,
              colors.text
            )}>
              {getFeatureIcon(feature.id)}
            </div>
            <div className="flex-1 min-w-0 pr-6 sm:pr-0">
              <CardTitle className={cn('text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 break-words', colors.text)}>
                {feature.name}
              </CardTitle>
              <CardDescription className={cn('text-xs sm:text-sm break-words', colors.text, 'opacity-80')}>
                {getFeatureDescription(feature.id)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 p-3 sm:p-6">
          {/* Feature requirements */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <CheckCircle className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0', colors.accent)} />
              <span className={cn('text-xs sm:text-sm font-medium', colors.text)}>
                Requirements Met
              </span>
            </div>
            <ul className={cn('text-[10px] sm:text-xs space-y-0.5 sm:space-y-1 break-words', colors.text, 'opacity-70')}>
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
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <Button
              onClick={handleUnlock}
              disabled={isAnimating}
              className={cn(
                'flex-1 text-white h-9 sm:h-10 text-xs sm:text-sm',
                colors.button
              )}
            >
              {isAnimating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </motion.div>
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden xs:inline">Unlock Feature</span>
                  <span className="xs:hidden">Unlock</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 hidden xs:inline" />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(feature.id)}
              className={cn('px-3 h-9 sm:h-10 text-xs sm:text-sm', colors.text)}
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
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {/* Feature Progress Indicator */}
      {unlockedFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Feature Progress
            </span>
            <Badge variant="outline" className="text-[10px] xs:text-xs">
              {unlockedFeatures.length} unlocked
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeatureProgress(!showFeatureProgress)}
            className="text-xs h-8 sm:h-9 w-full xs:w-auto"
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
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium">Overall Progress</span>
                    <span className="text-xs sm:text-sm font-bold">{progressScore}%</span>
                  </div>
                  <Progress value={progressScore} className="h-1.5 sm:h-2" />
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">Unlocked Features</span>
                      <div className="font-medium text-sm sm:text-base">{unlockedFeatures.length}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">Session Actions</span>
                      <div className="font-medium text-sm sm:text-base">{userState.actionHistory.length}</div>
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
          className="text-center py-4 sm:py-6 md:py-8 px-2"
        >
          <div className="flex flex-col xs:flex-row items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Welcome to Progressive Feature Discovery
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto break-words">
            As you use the platform, new features will be unlocked automatically based on your usage patterns.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ContextAwareFeatureRevealer;