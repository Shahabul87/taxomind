'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillInputStep } from './SkillInputStep';
import { PreferencesStep } from './PreferencesStep';
import { RoadmapGeneratingView } from './RoadmapGeneratingView';
import {
  useRoadmapGeneration,
  type GenerationInput,
} from '@/hooks/use-skill-roadmap-journey';

interface RoadmapCreationWizardProps {
  onRoadmapCreated: (roadmapId: string) => void;
}

export function RoadmapCreationWizard({ onRoadmapCreated }: RoadmapCreationWizardProps) {
  const [step, setStep] = useState(1);

  // Wizard form state
  const [skillName, setSkillName] = useState('');
  const [currentLevel, setCurrentLevel] = useState('NOVICE');
  const [targetLevel, setTargetLevel] = useState('PROFICIENT');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [targetDate, setTargetDate] = useState('');
  const [learningStyle, setLearningStyle] = useState('MIXED');
  const [includeAssessments, setIncludeAssessments] = useState(true);
  const [prioritizeQuickWins, setPrioritizeQuickWins] = useState(true);

  const {
    isGenerating,
    progress,
    generatedRoadmapId,
    error,
    generate,
    reset: resetGeneration,
  } = useRoadmapGeneration();

  // Step validation
  const isStep1Valid = skillName.trim().length >= 2 && currentLevel !== targetLevel;
  const isStep2Valid = hoursPerWeek >= 1;

  const handleGenerate = useCallback(async () => {
    setStep(3);
    const input: GenerationInput = {
      skillName: skillName.trim(),
      currentLevel,
      targetLevel,
      hoursPerWeek,
      targetCompletionDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      learningStyle,
      includeAssessments,
      prioritizeQuickWins,
    };
    await generate(input);
  }, [
    skillName, currentLevel, targetLevel, hoursPerWeek, targetDate,
    learningStyle, includeAssessments, prioritizeQuickWins, generate,
  ]);

  // Auto-redirect when generation completes
  useEffect(() => {
    if (generatedRoadmapId && !isGenerating) {
      const timer = setTimeout(() => onRoadmapCreated(generatedRoadmapId), 800);
      return () => clearTimeout(timer);
    }
  }, [generatedRoadmapId, isGenerating, onRoadmapCreated]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/25 mb-4">
          <Map className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Create Your Skill Roadmap
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          AI will design a personalized learning journey from where you are to where you want to be
        </p>
      </div>

      {/* Step Indicator */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                s === step ? 'w-8 bg-violet-500' : 'w-2',
                s < step ? 'bg-violet-400' : s > step ? 'bg-slate-300 dark:bg-slate-600' : '',
              )}
            />
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        {step === 1 && (
          <SkillInputStep
            skillName={skillName}
            currentLevel={currentLevel}
            targetLevel={targetLevel}
            onSkillNameChange={setSkillName}
            onCurrentLevelChange={setCurrentLevel}
            onTargetLevelChange={setTargetLevel}
          />
        )}

        {step === 2 && (
          <PreferencesStep
            hoursPerWeek={hoursPerWeek}
            targetDate={targetDate}
            learningStyle={learningStyle}
            includeAssessments={includeAssessments}
            prioritizeQuickWins={prioritizeQuickWins}
            onHoursChange={setHoursPerWeek}
            onTargetDateChange={setTargetDate}
            onLearningStyleChange={setLearningStyle}
            onAssessmentsChange={setIncludeAssessments}
            onQuickWinsChange={setPrioritizeQuickWins}
          />
        )}

        {step === 3 && (
          <RoadmapGeneratingView progress={progress} error={error} />
        )}
      </div>

      {/* Navigation */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="h-11 px-5 rounded-xl border-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className={cn(
                'h-11 px-6 rounded-xl font-semibold',
                'bg-gradient-to-r from-violet-600 to-purple-600',
                'hover:from-violet-700 hover:to-purple-700',
                'shadow-lg shadow-purple-500/25',
                'disabled:opacity-50'
              )}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={handleGenerate}
              disabled={!isStep2Valid || isGenerating}
              className={cn(
                'h-11 px-6 rounded-xl font-semibold',
                'bg-gradient-to-r from-violet-600 to-purple-600',
                'hover:from-violet-700 hover:to-purple-700',
                'shadow-lg shadow-purple-500/25',
                'disabled:opacity-50'
              )}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Roadmap
            </Button>
          )}
        </div>
      )}

      {/* Error retry */}
      {step === 3 && error && (
        <div className="flex justify-center mt-6 gap-3">
          <Button
            variant="outline"
            onClick={() => {
              resetGeneration();
              setStep(2);
            }}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={handleGenerate}
            className={cn(
              'rounded-xl',
              'bg-gradient-to-r from-violet-600 to-purple-600',
              'hover:from-violet-700 hover:to-purple-700',
            )}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
