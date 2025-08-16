"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Lightbulb, 
  TrendingUp,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Gap {
  level: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface DepthInsightsPanelProps {
  insights: string[];
  gaps: Gap[];
  onAskSam: (context: string) => void;
}

export function DepthInsightsPanel({ insights, gaps, onAskSam }: DepthInsightsPanelProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
      case 'low':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
      default:
        return '';
    }
  };

  const criticalGaps = gaps.filter(g => g.severity === 'high');
  const warnings = gaps.filter(g => g.severity === 'medium');
  const suggestions = gaps.filter(g => g.severity === 'low');

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{insight}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAskSam(`How do I address: ${insight}`)}
                      className="mt-2 text-purple-600 hover:text-purple-700"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Get Suggestions
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Critical Gaps */}
      {criticalGaps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Gaps
          </h3>
          <div className="space-y-3">
            {criticalGaps.map((gap, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn("p-4 border-2", getSeverityColor(gap.severity))}>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(gap.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">{gap.level} Level</span>
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {gap.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAskSam(`Help me fix the ${gap.level} level gap: ${gap.description}`)}
                    >
                      Fix Now
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Warnings
          </h3>
          <div className="space-y-3">
            {warnings.map((gap, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn("p-4 border", getSeverityColor(gap.severity))}>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(gap.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">{gap.level} Level</span>
                        <Badge variant="secondary" className="text-xs">
                          Warning
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {gap.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-blue-500" />
            Suggestions
          </h3>
          <div className="space-y-3">
            {suggestions.map((gap, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn("p-4", getSeverityColor(gap.severity))}>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(gap.severity)}
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium capitalize">{gap.level} Level:</span>{' '}
                        {gap.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Success State */}
      {gaps.length === 0 && (
        <Card className="p-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Excellent Balance!
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your course has a well-balanced distribution across all Bloom&apos;s taxonomy levels.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}