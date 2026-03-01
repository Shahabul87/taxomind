'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Target,
  BookOpen,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface QualityGateIssue {
  id: string;
  type: 'error' | 'warning';
  title: string;
  description: string;
  level?: string;
  fixAction?: string;
}

interface CognitivePublishGateProps {
  courseId: string;
  courseTitle: string;
  meetsQualityGate: boolean;
  cognitiveGrade: string;
  cognitiveScore: number;
  issues: QualityGateIssue[];
  distribution: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  onPublish: () => Promise<void>;
  onViewRecommendations: () => void;
  isAdmin?: boolean;
  className?: string;
}

const REQUIRED_CHECKS = [
  {
    id: 'level_diversity',
    label: 'Minimum 3 Bloom&apos;s levels',
    description: 'Course covers at least 3 cognitive levels',
  },
  {
    id: 'no_single_dominance',
    label: 'No single level > 50%',
    description: 'Prevents all-recall or single-focus courses',
  },
  {
    id: 'higher_order_ratio',
    label: 'At least 15% in Apply+ levels',
    description: 'Includes practical application activities',
  },
];

export function CognitivePublishGate({
  courseId,
  courseTitle,
  meetsQualityGate,
  cognitiveGrade,
  cognitiveScore,
  issues,
  distribution,
  onPublish,
  onViewRecommendations,
  isAdmin = false,
  className,
}: CognitivePublishGateProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
    } finally {
      setIsPublishing(false);
    }
  };

  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');

  // Calculate which checks pass
  const levelCount = Object.values(distribution).filter((v) => v > 5).length;
  const maxLevel = Math.max(...Object.values(distribution));
  const higherOrderRatio =
    distribution.apply +
    distribution.analyze +
    distribution.evaluate +
    distribution.create;

  const checks = [
    { ...REQUIRED_CHECKS[0], passed: levelCount >= 3 },
    { ...REQUIRED_CHECKS[1], passed: maxLevel <= 50 },
    { ...REQUIRED_CHECKS[2], passed: higherOrderRatio >= 15 },
  ];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        className={cn(
          'text-white',
          meetsQualityGate
            ? 'bg-gradient-to-r from-emerald-500 to-green-600'
            : 'bg-gradient-to-r from-amber-500 to-orange-600'
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Cognitive Quality Gate
            </CardTitle>
            <CardDescription className="text-white/80 mt-1">
              {meetsQualityGate
                ? 'Your course meets cognitive quality standards'
                : 'Your course needs improvements to publish'}
            </CardDescription>
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl text-xl font-bold',
              meetsQualityGate
                ? 'bg-white/20 text-white'
                : 'bg-white/20 text-white'
            )}
          >
            {cognitiveGrade}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Quality Checks */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Quality Requirements
          </div>
          <div className="space-y-2">
            {checks.map((check) => (
              <div
                key={check.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  check.passed
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                )}
              >
                {check.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div
                    className={cn(
                      'font-medium text-sm',
                      check.passed
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-red-700 dark:text-red-300'
                    )}
                  >
                    {check.label}
                  </div>
                  <div className="text-xs text-slate-500">{check.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Issues to Address
            </div>
            <div className="space-y-2">
              {errors.map((issue) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-red-700 dark:text-red-300">
                      {issue.title}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {issue.description}
                    </div>
                  </div>
                  {issue.fixAction && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Fix
                    </Button>
                  )}
                </motion.div>
              ))}
              {warnings.map((issue) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                >
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-amber-700 dark:text-amber-300">
                      {issue.title}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      {issue.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Cognitive Score Progress */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cognitive Quality Score
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {cognitiveScore}/100
            </span>
          </div>
          <Progress
            value={cognitiveScore}
            className={cn(
              'h-3',
              cognitiveScore >= 80
                ? '[&>div]:bg-emerald-500'
                : cognitiveScore >= 60
                ? '[&>div]:bg-amber-500'
                : '[&>div]:bg-red-500'
            )}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>Minimum: 60</span>
            <span>Recommended: 80+</span>
          </div>
        </div>

        {/* Help Text */}
        {!meetsQualityGate && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm text-blue-700 dark:text-blue-300">
                Need help improving?
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Add 2-3 higher-order activities like case studies, evaluation quizzes, or creative
                projects to meet the quality gate requirements.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {meetsQualityGate ? (
            <Button onClick={handlePublish} disabled={isPublishing} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish Course'}
            </Button>
          ) : (
            <>
              <Button
                onClick={onViewRecommendations}
                variant="default"
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                View Recommendations
              </Button>

              {isAdmin && (
                <AlertDialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-amber-600 border-amber-300">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Override
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Override Quality Gate</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will publish the course despite not meeting cognitive quality
                        standards. This action should only be used in exceptional circumstances
                        and will be logged for audit purposes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setShowOverrideDialog(false);
                          handlePublish();
                        }}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Override & Publish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
