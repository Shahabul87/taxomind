"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Clock,
  Target,
  Shuffle,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  Unlock,
  Calendar,
  AlertCircle,
  CheckCircle,
  BarChart3,
  BookOpen,
  Timer,
  Award,
  Shield,
  Bell,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ExamSettings {
  title: string;
  description: string;
  timeLimit: number | null;
  passingScore: number;
  attempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  allowReview: boolean;
  isPublished: boolean;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  proctoring: boolean;
  randomizeFromPool: boolean;
  poolSize: number | null;
}

interface ExamSettingsPanelProps {
  settings: ExamSettings;
  onSettingsChange: (settings: ExamSettings) => void;
  totalQuestions: number;
}

const defaultSettings: ExamSettings = {
  title: "",
  description: "",
  timeLimit: 60,
  passingScore: 70,
  attempts: 3,
  shuffleQuestions: true,
  shuffleOptions: true,
  showResults: true,
  showCorrectAnswers: true,
  showExplanations: true,
  allowReview: true,
  isPublished: false,
  scheduledStart: null,
  scheduledEnd: null,
  proctoring: false,
  randomizeFromPool: false,
  poolSize: null,
};

export function ExamSettingsPanel({
  settings,
  onSettingsChange,
  totalQuestions,
}: ExamSettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<ExamSettings>(settings || defaultSettings);

  const updateSetting = <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-500" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Exam Title</Label>
            <Input
              id="title"
              value={localSettings.title}
              onChange={(e) => updateSetting("title", e.target.value)}
              placeholder="Enter exam title..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={localSettings.description}
              onChange={(e) => updateSetting("description", e.target.value)}
              placeholder="Brief description of the exam..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Timing Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-500" />
            Timing &amp; Attempts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                Time Limit
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={localSettings.timeLimit !== null}
                  onCheckedChange={(checked) =>
                    updateSetting("timeLimit", checked ? 60 : null)
                  }
                />
                {localSettings.timeLimit !== null && (
                  <span className="text-sm font-mono text-slate-600 dark:text-slate-400 min-w-[60px]">
                    {localSettings.timeLimit} min
                  </span>
                )}
              </div>
            </div>
            {localSettings.timeLimit !== null && (
              <Slider
                value={[localSettings.timeLimit]}
                onValueChange={([value]) => updateSetting("timeLimit", value)}
                min={5}
                max={180}
                step={5}
              />
            )}
            {localSettings.timeLimit === null && (
              <p className="text-sm text-slate-500">No time limit - students can take as long as needed</p>
            )}
          </div>

          <Separator />

          {/* Attempts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-slate-500" />
                Number of Attempts
              </Label>
              <Select
                value={localSettings.attempts.toString()}
                onValueChange={(value) => updateSetting("attempts", parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 attempt</SelectItem>
                  <SelectItem value="2">2 attempts</SelectItem>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                  <SelectItem value="-1">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-slate-500">
              {localSettings.attempts === -1
                ? "Students can retake this exam unlimited times"
                : `Students can take this exam up to ${localSettings.attempts} time(s)`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Scoring &amp; Passing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-500" />
                Passing Score
              </Label>
              <span className="text-lg font-bold text-violet-600">
                {localSettings.passingScore}%
              </span>
            </div>
            <Slider
              value={[localSettings.passingScore]}
              onValueChange={([value]) => updateSetting("passingScore", value)}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0% (All Pass)</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Visual Indicator */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-red-50 via-yellow-50 to-green-50 dark:from-red-950/30 dark:via-yellow-950/30 dark:to-green-950/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Fail</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Pass</span>
              </div>
            </div>
            <div className="relative h-2 mt-2 rounded-full bg-gradient-to-r from-red-300 via-yellow-300 to-green-300 overflow-hidden">
              <div
                className="absolute top-0 h-full w-1 bg-slate-800 dark:bg-white"
                style={{ left: `${localSettings.passingScore}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-500" />
            Display &amp; Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shuffle Options */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Shuffle className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="cursor-pointer">Shuffle Questions</Label>
                  <p className="text-xs text-slate-500">Randomize question order</p>
                </div>
              </div>
              <Switch
                checked={localSettings.shuffleQuestions}
                onCheckedChange={(checked) => updateSetting("shuffleQuestions", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Shuffle className="h-5 w-5 text-purple-500" />
                <div>
                  <Label className="cursor-pointer">Shuffle Options</Label>
                  <p className="text-xs text-slate-500">Randomize answer choices</p>
                </div>
              </div>
              <Switch
                checked={localSettings.shuffleOptions}
                onCheckedChange={(checked) => updateSetting("shuffleOptions", checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Results Display */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-500">After Submission</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-green-500" />
                  <div>
                    <Label className="cursor-pointer">Show Results</Label>
                    <p className="text-xs text-slate-500">Display score after submission</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.showResults}
                  onCheckedChange={(checked) => updateSetting("showResults", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <Label className="cursor-pointer">Show Correct Answers</Label>
                    <p className="text-xs text-slate-500">Reveal correct answers</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.showCorrectAnswers}
                  onCheckedChange={(checked) => updateSetting("showCorrectAnswers", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-violet-500" />
                  <div>
                    <Label className="cursor-pointer">Show Explanations</Label>
                    <p className="text-xs text-slate-500">Display answer explanations</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.showExplanations}
                  onCheckedChange={(checked) => updateSetting("showExplanations", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label className="cursor-pointer">Allow Review</Label>
                    <p className="text-xs text-slate-500">Let students review their answers</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.allowReview}
                  onCheckedChange={(checked) => updateSetting("allowReview", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Advanced Settings
          </CardTitle>
          <CardDescription>Security and scheduling options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Proctoring */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-red-500" />
              <div>
                <Label className="cursor-pointer">Enable Proctoring</Label>
                <p className="text-xs text-slate-500">Monitor for cheating behavior</p>
              </div>
            </div>
            <Switch
              checked={localSettings.proctoring}
              onCheckedChange={(checked) => updateSetting("proctoring", checked)}
            />
          </div>

          {/* Random from Pool */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-amber-500" />
                <div>
                  <Label className="cursor-pointer">Randomize from Pool</Label>
                  <p className="text-xs text-slate-500">
                    Select random subset from {totalQuestions} questions
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.randomizeFromPool}
                onCheckedChange={(checked) => {
                  updateSetting("randomizeFromPool", checked);
                  if (checked && !localSettings.poolSize) {
                    updateSetting("poolSize", Math.min(10, totalQuestions));
                  }
                }}
              />
            </div>
            {localSettings.randomizeFromPool && (
              <div className="pl-10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Questions per exam:</Label>
                  <span className="font-mono font-bold">{localSettings.poolSize}</span>
                </div>
                <Slider
                  value={[localSettings.poolSize || 10]}
                  onValueChange={([value]) => updateSetting("poolSize", value)}
                  min={1}
                  max={totalQuestions}
                  step={1}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Publishing Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-3">
              {localSettings.isPublished ? (
                <Unlock className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-slate-500" />
              )}
              <div>
                <Label className="cursor-pointer text-base font-medium">
                  {localSettings.isPublished ? "Published" : "Draft Mode"}
                </Label>
                <p className="text-sm text-slate-500">
                  {localSettings.isPublished
                    ? "Exam is visible to students"
                    : "Exam is hidden from students"}
                </p>
              </div>
            </div>
            <Switch
              checked={localSettings.isPublished}
              onCheckedChange={(checked) => updateSetting("isPublished", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-500" />
            Exam Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-violet-600">{totalQuestions}</p>
              <p className="text-xs text-slate-500">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {localSettings.timeLimit ? `${localSettings.timeLimit}m` : "∞"}
              </p>
              <p className="text-xs text-slate-500">Time Limit</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{localSettings.passingScore}%</p>
              <p className="text-xs text-slate-500">To Pass</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {localSettings.attempts === -1 ? "∞" : localSettings.attempts}
              </p>
              <p className="text-xs text-slate-500">Attempts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
