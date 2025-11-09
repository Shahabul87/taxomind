"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Clock,
  Play,
  Pause,
  Settings,
  X,
  Moon,
  Sun,
  Timer,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FocusModeProps {
  isActive: boolean;
  onToggle: () => void;
  onBreakReminder?: () => void;
  children: React.ReactNode;
}

export const FocusMode = ({
  isActive,
  onToggle,
  onBreakReminder,
  children
}: FocusModeProps) => {
  const [showControls, setShowControls] = useState(true);
  const [focusTimer, setFocusTimer] = useState(0);
  const [breakTimer, setBreakTimer] = useState(25); // 25 minutes default
  const [ambientSound, setAmbientSound] = useState(false);
  const [dimBackground, setDimBackground] = useState(true);
  const [autoHideUI, setAutoHideUI] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);

  // Focus timer effect
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setFocusTimer(prev => prev + 1);

      // Pomodoro check (25 min = 1500 seconds)
      if (pomodoroEnabled && focusTimer > 0 && focusTimer % (breakTimer * 60) === 0) {
        setIsBreakTime(true);
        onBreakReminder?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, focusTimer, breakTimer, pomodoroEnabled, onBreakReminder]);

  // Auto-hide controls
  useEffect(() => {
    if (!isActive || !autoHideUI) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive, autoHideUI, showControls]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEncouragementMessage = () => {
    const minutes = Math.floor(focusTimer / 60);
    if (minutes === 0) return "Let's get focused!";
    if (minutes < 5) return "Great start! Keep going!";
    if (minutes < 15) return "You're in the zone!";
    if (minutes < 30) return "Excellent focus! 🎯";
    if (minutes < 60) return "Incredible dedication! 🌟";
    return "You're unstoppable! 🚀";
  };

  if (!isActive) {
    return (
      <div className="relative">
        {children}
        <Button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 group"
          size="lg"
        >
          <Maximize2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          Enter Focus Mode
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-all duration-500",
        darkMode
          ? "bg-slate-950"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      )}
      onMouseMove={() => autoHideUI && setShowControls(true)}
    >
      {/* Background dim overlay */}
      {dimBackground && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      )}

      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col">
        {/* Top controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 right-0 z-10"
            >
              <div className="bg-gradient-to-b from-black/40 to-transparent backdrop-blur-md p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  {/* Left: Timer and status */}
                  <div className="flex items-center gap-4">
                    <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Timer className="w-5 h-5 text-emerald-400" />
                          <div>
                            <p className="text-2xl font-bold text-white font-mono">
                              {formatTime(focusTimer)}
                            </p>
                            <p className="text-xs text-white/70">
                              {getEncouragementMessage()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {pomodoroEnabled && (
                      <Badge
                        variant="outline"
                        className="bg-purple-500/20 border-purple-400 text-white"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Break in {breakTimer - Math.floor(focusTimer / 60) % breakTimer} min
                      </Badge>
                    )}
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white hover:bg-white/10"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDarkMode(!darkMode)}
                      className="text-white hover:bg-white/10"
                    >
                      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>

                    <Button
                      onClick={onToggle}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10"
                    >
                      <Minimize2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>

        {/* Bottom controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-0 left-0 right-0 z-10"
            >
              <div className="bg-gradient-to-t from-black/40 to-transparent backdrop-blur-md p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAutoHideUI(!autoHideUI)}
                      className="text-white hover:bg-white/10"
                    >
                      {autoHideUI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="ml-2">Auto-hide UI</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAmbientSound(!ambientSound)}
                      className="text-white hover:bg-white/10"
                    >
                      {ambientSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      <span className="ml-2">Ambient Sound</span>
                    </Button>
                  </div>

                  <Badge className="bg-emerald-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Focus Mode Active
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            >
              <Card
                className="w-full max-w-md bg-white dark:bg-slate-900"
                onClick={(e) => e.stopPropagation()}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Focus Mode Settings</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSettings(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Pomodoro Timer</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          25-min focus with 5-min breaks
                        </p>
                      </div>
                      <Switch
                        checked={pomodoroEnabled}
                        onCheckedChange={setPomodoroEnabled}
                      />
                    </div>

                    {pomodoroEnabled && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Focus Duration (minutes)</p>
                        <Slider
                          value={[breakTimer]}
                          onValueChange={([value]) => setBreakTimer(value)}
                          min={15}
                          max={60}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                          {breakTimer} minutes
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Dim Background</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Reduce visual distractions
                        </p>
                      </div>
                      <Switch
                        checked={dimBackground}
                        onCheckedChange={setDimBackground}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Auto-hide Controls</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Hide UI after 3 seconds
                        </p>
                      </div>
                      <Switch
                        checked={autoHideUI}
                        onCheckedChange={setAutoHideUI}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Break reminder modal */}
        <AnimatePresence>
          {isBreakTime && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-md"
            >
              <Card className="w-full max-w-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <Timer className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold">Time for a Break!</h2>
                  <p className="text-emerald-100">
                    You&apos;ve been focused for {breakTimer} minutes. Take a 5-minute break to recharge.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setIsBreakTime(false);
                        setFocusTimer(0);
                      }}
                      className="flex-1 bg-white text-emerald-600 hover:bg-emerald-50"
                    >
                      Take Break
                    </Button>
                    <Button
                      onClick={() => setIsBreakTime(false)}
                      variant="outline"
                      className="flex-1 border-white/30 text-white hover:bg-white/10"
                    >
                      Keep Going
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
