"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, CheckCircle2, TrendingDown, 
  Clock, Brain, Target, Bell, X,
  AlertCircle, TrendingUp, Zap, BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "next-auth";
import axios from "axios";
import toast from "react-hot-toast";

interface ProgressMonitorProps {
  user: User;
}

interface ProgressAlert {
  id: string;
  alertType: "STRUGGLING" | "AT_RISK" | "INACTIVE" | "MILESTONE" | "ENCOURAGEMENT";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  aiSuggestion: string;
  actionRequired: boolean;
  createdAt: string;
  course: {
    id: string;
    title: string;
    imageUrl?: string;
  };
  chapter?: {
    id: string;
    title: string;
  };
}

interface LearningMetrics {
  overallProgress: number;
  learningVelocity: number;
  engagementTrend: "IMPROVING" | "STABLE" | "DECLINING";
  riskScore: number;
  averageEngagementScore: number;
  totalStudyTime: number;
  currentStreak?: number;
}

export function ProgressMonitor({ user }: ProgressMonitorProps) {
  const [alerts, setAlerts] = useState<ProgressAlert[]>([]);
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  useEffect(() => {
    fetchProgressData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchProgressData, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchProgressData = async () => {
    try {
      // Fetch alerts and metrics in parallel
      const [alertsResponse, metricsResponse] = await Promise.all([
        axios.get('/api/progress/alerts?unresolved=true&limit=5'),
        axios.get('/api/progress/metrics')
      ]);

      if (alertsResponse.data.success) {
        setAlerts(alertsResponse.data.alerts);
      }

      if (metricsResponse.data.success) {
        setMetrics(metricsResponse.data.overallStats);
      }
    } catch (error) {
      console.error("Failed to fetch progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await axios.patch(`/api/progress/alerts/${alertId}/resolve`);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success("Alert dismissed");
    } catch (error) {
      toast.error("Failed to dismiss alert");
    }
  };

  const getAlertIcon = (alertType: string, severity: string) => {
    if (severity === "CRITICAL") return AlertTriangle;
    
    switch (alertType) {
      case "STRUGGLING": return AlertCircle;
      case "AT_RISK": return TrendingDown;
      case "INACTIVE": return Clock;
      case "MILESTONE": return CheckCircle2;
      case "ENCOURAGEMENT": return Zap;
      default: return Bell;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "from-red-500 to-red-600";
      case "HIGH": return "from-orange-500 to-red-500";
      case "MEDIUM": return "from-yellow-500 to-orange-500";
      case "LOW": return "from-blue-500 to-purple-500";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "text-red-600";
      case "HIGH": return "text-orange-600";
      case "MEDIUM": return "text-yellow-600";
      case "LOW": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 80) return { level: "High Risk", color: "text-red-600", bgColor: "bg-red-100" };
    if (riskScore >= 60) return { level: "Medium Risk", color: "text-orange-600", bgColor: "bg-orange-100" };
    if (riskScore >= 30) return { level: "Low Risk", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { level: "Low Risk", color: "text-green-600", bgColor: "bg-green-100" };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING": return TrendingUp;
      case "DECLINING": return TrendingDown;
      default: return Target;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "IMPROVING": return "text-green-600";
      case "DECLINING": return "text-red-600";
      default: return "text-blue-600";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-slate-800/60 rounded-lg animate-pulse" />
        <div className="h-48 bg-slate-800/60 rounded-lg animate-pulse" />
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === "CRITICAL");
  const highAlerts = alerts.filter(a => a.severity === "HIGH");
  const riskData = metrics ? getRiskLevel(metrics.riskScore) : null;

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      <AnimatePresence>
        {criticalAlerts.length > 0 && showAlerts && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative"
          >
            <Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-red-800 dark:text-red-300">
                        Critical Learning Alert
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {criticalAlerts.length} critical issue{criticalAlerts.length > 1 ? 's' : ''} requiring immediate attention
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAlerts(false)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Overview */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-white">Learning Health Monitor</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Overall Progress */}
                <div className="text-center p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {metrics.averageEngagementScore}%
                  </div>
                  <div className="text-sm text-slate-300">Engagement Score</div>
                  <Progress value={metrics.averageEngagementScore} className="mt-2 h-2" />
                </div>

                {/* Learning Velocity */}
                <div className="text-center p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-600">
                      {metrics.learningVelocity}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300">Chapters/Week</div>
                </div>

                {/* Risk Assessment */}
                <div className="text-center p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                  {riskData && (
                    <>
                      <div className={`text-2xl font-bold mb-2 ${riskData.color}`}>
                        {metrics.riskScore}%
                      </div>
                      <div className="text-sm text-slate-300">Risk Score</div>
                      <Badge className={`mt-2 ${riskData.bgColor} ${riskData.color}`}>
                        {riskData.level}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Engagement Trend */}
                <div className="text-center p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {(() => {
                      const TrendIcon = getTrendIcon(metrics.engagementTrend);
                      return <TrendIcon className={`w-5 h-5 ${getTrendColor(metrics.engagementTrend)}`} />;
                    })()}
                    <span className={`text-lg font-bold ${getTrendColor(metrics.engagementTrend)}`}>
                      {metrics.engagementTrend}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300">Trend</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <Bell className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-white">Active Learning Alerts</span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {alerts.length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert, index) => {
                  const AlertIcon = getAlertIcon(alert.alertType, alert.severity);
                  
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 bg-slate-800/60 rounded-lg border border-slate-600/30 hover:bg-slate-700/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-full bg-gradient-to-r ${getAlertColor(alert.severity)} text-white`}>
                            <AlertIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-white">{alert.course.title}</h4>
                              <Badge className={getSeverityTextColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-300 mb-2">{alert.message}</p>
                            {alert.aiSuggestion && (
                              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-600/20">
                                <div className="flex items-center gap-2 mb-1">
                                  <Brain className="w-4 h-4 text-purple-400" />
                                  <span className="text-xs font-medium text-purple-400">AI Suggestion</span>
                                </div>
                                <p className="text-xs text-slate-400">{alert.aiSuggestion}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-xs text-slate-500">
                                {new Date(alert.createdAt).toLocaleString()}
                              </span>
                              {alert.chapter && (
                                <span className="text-xs text-slate-500">• {alert.chapter.title}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No Alerts State */}
      {alerts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
            <CardContent className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">All Good!</h3>
              <p className="text-slate-400">No learning alerts at the moment. Keep up the great work!</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}