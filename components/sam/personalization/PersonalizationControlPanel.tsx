'use client';

import { useState, useCallback } from 'react';
import { Brain, HeartPulse, Sparkles, Target, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PersonalizationControlPanelProps {
  className?: string;
}

type PanelState = 'idle' | 'loading' | 'error';

export function PersonalizationControlPanel({ className }: PersonalizationControlPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [learningStyle, setLearningStyle] = useState<any | null>(null);
  const [motivation, setMotivation] = useState<any | null>(null);
  const [emotionalState, setEmotionalState] = useState<any | null>(null);
  const [personalization, setPersonalization] = useState<any | null>(null);

  const [learningGoals, setLearningGoals] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [availableHours, setAvailableHours] = useState('');

  const runAction = useCallback(async (action: string, data: Record<string, unknown> = {}) => {
    setPanelState('loading');
    setError(null);

    try {
      const response = await fetch('/api/sam/personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        throw new Error('Personalization request failed');
      }

      const payload = await response.json();
      return payload.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run personalization');
      setPanelState('error');
      return null;
    } finally {
      setPanelState('idle');
    }
  }, []);

  const handleDetectLearningStyle = useCallback(async () => {
    const result = await runAction('detect-learning-style');
    if (result) setLearningStyle(result);
  }, [runAction]);

  const handleAnalyzeMotivation = useCallback(async () => {
    const result = await runAction('analyze-motivation');
    if (result) setMotivation(result);
  }, [runAction]);

  const handleRecognizeEmotion = useCallback(async () => {
    const result = await runAction('recognize-emotional-state');
    if (result) setEmotionalState(result);
  }, [runAction]);

  const handleApplyPersonalization = useCallback(async () => {
    const goals = learningGoals
      .split(',')
      .map((goal) => goal.trim())
      .filter(Boolean);

    const available = Number(availableHours);
    const timeConstraints = Number.isFinite(available) && available > 0
      ? { available }
      : undefined;

    const result = await runAction('apply-personalization', {
      currentContent: currentContent.trim() ? { summary: currentContent.trim() } : undefined,
      learningGoals: goals,
      timeConstraints,
    });

    if (result) setPersonalization(result);
  }, [availableHours, currentContent, learningGoals, runAction]);

  return (
    <Card className={cn('border-slate-200/70 bg-white', className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Personalization Control Panel</CardTitle>
            <CardDescription>
              Tune SAM to your goals, motivation, and emotional state.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <Button variant="outline" onClick={handleDetectLearningStyle} disabled={panelState === 'loading'}>
            {panelState === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
            Detect Learning Style
          </Button>
          <Button variant="outline" onClick={handleAnalyzeMotivation} disabled={panelState === 'loading'}>
            {panelState === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
            Analyze Motivation
          </Button>
          <Button variant="outline" onClick={handleRecognizeEmotion} disabled={panelState === 'loading'}>
            {panelState === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HeartPulse className="mr-2 h-4 w-4" />}
            Detect Emotional State
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Input
              placeholder="Learning goals (comma separated)"
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
            />
            <Input
              placeholder="Available hours this week"
              value={availableHours}
              onChange={(e) => setAvailableHours(e.target.value)}
            />
            <Textarea
              placeholder="Current focus or content summary"
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleApplyPersonalization}
              className="w-full"
              disabled={panelState === 'loading'}
            >
              {panelState === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Apply Personalization
            </Button>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Learning Style</span>
              </div>
              <p className="text-sm text-slate-600">
                {learningStyle?.primaryStyle ? `Primary: ${learningStyle.primaryStyle}` : 'Run detection to see insights.'}
              </p>
              {learningStyle?.confidence !== undefined && (
                <Badge variant="secondary" className="mt-2">Confidence: {Math.round(learningStyle.confidence * 100)}%</Badge>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Motivation</span>
              </div>
              <p className="text-sm text-slate-600">
                {motivation?.currentLevel !== undefined ? `Current level: ${Math.round(motivation.currentLevel * 100)}%` : 'Analyze to reveal motivation signals.'}
              </p>
              {motivation?.triggers?.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">Top triggers: {motivation.triggers.slice(0, 2).join(', ')}</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium">Emotional State</span>
              </div>
              <p className="text-sm text-slate-600">
                {emotionalState?.currentEmotion ? `Now: ${emotionalState.currentEmotion}` : 'Detect your current learning mood.'}
              </p>
              {emotionalState?.trend && (
                <p className="mt-1 text-xs text-slate-500">Trend: {emotionalState.trend}</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Personalization Output</span>
              </div>
              <p className="text-sm text-slate-600">
                {personalization?.recommendations?.length
                  ? `${personalization.recommendations.length} recommendations ready.`
                  : 'Apply personalization to generate tailored recommendations.'}
              </p>
              {personalization?.confidence !== undefined && (
                <Badge variant="secondary" className="mt-2">Confidence: {Math.round(personalization.confidence * 100)}%</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PersonalizationControlPanel;
