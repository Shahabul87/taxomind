"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Play, Pause, Square, SkipForward, 
  AlertTriangle, TrendingDown, Zap,
  Brain, Target, Clock, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLearningSession } from "@/hooks/use-learning-session";
import { User } from "next-auth";

interface ProgressTrackingDemoProps {
  user: User;
}

export function ProgressTrackingDemo({ user }: ProgressTrackingDemoProps) {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  
  const {
    sessionId,
    isTracking,
    startSession,
    updateProgress,
    endSession,
    recordInteraction,
    recordPause,
    recordSeek,
    markStruggling
  } = useLearningSession();

  const handleStartSession = async () => {
    await startSession("demo-course-id", "demo-chapter-id");
    setIsPlaying(true);
    setAlerts([]);
    
    // Start simulating progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(100, prev + 2);
        
        // Update session progress
        updateProgress({
          completionPercentage: newProgress
        });
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
        }
        
        return newProgress;
      });
    }, 1000);
  };

  const handlePause = () => {
    setIsPlaying(false);
    recordPause();
    
    // Simulate alert if too many pauses
    setTimeout(() => {
      setAlerts(prev => [...prev, "Multiple pauses detected - content might be challenging"]);
    }, 500);
  };

  const handleSeek = () => {
    recordSeek();
    setProgress(prev => Math.min(100, prev + 10));
    
    // Simulate struggling detection
    setTimeout(() => {
      markStruggling(['seeking_behavior']);
      setAlerts(prev => [...prev, "Excessive seeking detected - consider reviewing prerequisites"]);
    }, 500);
  };

  const handleStruggling = () => {
    markStruggling(['content_difficulty', 'comprehension_issues']);
    setAlerts(prev => [...prev, "AI detected learning difficulty - intervention recommended"]);
  };

  const handleEndSession = async () => {
    await endSession({
      status: progress >= 100 ? 'COMPLETED' : 'ABANDONED',
      completionPercentage: progress
    });
    setIsPlaying(false);
    setProgress(0);
    setAlerts([]);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-white">Progress Tracking Demo</span>
              {isTracking && (
                <Badge className="bg-green-100 text-green-800 animate-pulse">
                  Live Tracking
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Session Status */}
              <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-600/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Demo Learning Session</h3>
                  <div className="flex items-center gap-2">
                    {sessionId && (
                      <Badge variant="outline" className="text-slate-300">
                        Session: {sessionId.slice(-8)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Progress</span>
                      <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isTracking ? (
                      <Button onClick={handleStartSession} className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Start Learning Session
                      </Button>
                    ) : (
                      <>
                        {isPlaying ? (
                          <Button onClick={handlePause} variant="outline" size="sm">
                            <Pause className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button onClick={() => setIsPlaying(true)} variant="outline" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button onClick={handleSeek} variant="outline" size="sm">
                          <SkipForward className="w-4 h-4" />
                          Seek
                        </Button>
                        
                        <Button onClick={handleStruggling} variant="outline" size="sm">
                          <AlertTriangle className="w-4 h-4" />
                          Mark Struggling
                        </Button>
                        
                        <Button onClick={handleEndSession} variant="destructive" size="sm">
                          <Square className="w-4 h-4" />
                          End Session
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Alerts */}
              {alerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Live AI Interventions
                  </h4>
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg"
                    >
                      <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-orange-300">{alert}</p>
                        <span className="text-xs text-orange-500">Just now</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Features Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-600/20">
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    Real-time Tracking
                  </h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Engagement score monitoring</li>
                    <li>• Interaction counting</li>
                    <li>• Pause/seek behavior analysis</li>
                    <li>• Activity level detection</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-600/20">
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    AI Interventions
                  </h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Struggling detection</li>
                    <li>• Personalized suggestions</li>
                    <li>• Risk assessment</li>
                    <li>• Learning pattern analysis</li>
                  </ul>
                </div>
              </div>

              {progress >= 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-6 bg-green-900/20 border border-green-600/30 rounded-lg"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Session Completed!</h3>
                  <p className="text-sm text-green-300">
                    Great job! Your learning session has been tracked and analyzed.
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}