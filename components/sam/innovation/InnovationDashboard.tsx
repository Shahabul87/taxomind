"use client";

import React, { useState } from "react";
import { useInnovationFeatures } from "@sam-ai/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Brain,
  Dna,
  Bot,
  Sparkles,
  Activity,
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InnovationDashboardProps {
  userId?: string;
  className?: string;
}

export function InnovationDashboard({ userId, className }: InnovationDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const {
    // Feature states
    cognitiveFitness,
    learningDNA,
    studyBuddy,
    quantumPaths,
    // Loading states
    isLoadingFitness,
    isLoadingDNA,
    isLoadingBuddy,
    isLoadingPaths,
    // Error states
    fitnessError,
    dnaError,
    buddyError,
    pathsError,
    // Actions
    assessCognitiveFitness,
    generateLearningDNA,
    createStudyBuddy,
    createQuantumPath,
    // Exercise and interaction methods
    startFitnessExercise,
    completeFitnessExercise,
    getFitnessRecommendations,
    analyzeDNATraits,
    trackDNAEvolution,
    interactWithBuddy,
    observeQuantumPath,
    collapseQuantumPath,
  } = useInnovationFeatures({
    autoLoad: true,
    refreshInterval: 300000, // 5 minutes
  });

  // Calculate overview stats
  const hasFeatures = {
    fitness: !!cognitiveFitness,
    dna: !!learningDNA,
    buddy: !!studyBuddy,
    paths: quantumPaths && quantumPaths.length > 0,
  };

  const featureCount = Object.values(hasFeatures).filter(Boolean).length;
  const completionPercentage = (featureCount / 4) * 100;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            <Lightbulb className="mr-2 inline-block h-6 w-6 text-yellow-500" />
            Innovation Lab
          </h2>
          <p className="text-muted-foreground">
            Explore cutting-edge AI-powered learning features
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          {featureCount}/4 Features Active
        </Badge>
      </div>

      {/* Feature Progress Overview */}
      <Card className="border-yellow-200/50 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:border-yellow-900/50 dark:from-yellow-900/10 dark:to-orange-900/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Innovation Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={completionPercentage} className="flex-1" />
            <span className="text-sm font-medium">{completionPercentage.toFixed(0)}%</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Activate all innovation features to unlock your full learning potential
          </p>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="fitness" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Fitness</span>
          </TabsTrigger>
          <TabsTrigger value="dna" className="gap-2">
            <Dna className="h-4 w-4" />
            <span className="hidden sm:inline">DNA</span>
          </TabsTrigger>
          <TabsTrigger value="buddy" className="gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Buddy</span>
          </TabsTrigger>
          <TabsTrigger value="quantum" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Quantum</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cognitive Fitness Card */}
            <FeatureOverviewCard
              title="Cognitive Fitness"
              description="Train your mental muscles with targeted exercises"
              icon={<Brain className="h-5 w-5 text-blue-500" />}
              isActive={hasFeatures.fitness}
              isLoading={isLoadingFitness}
              error={fitnessError}
              onActivate={() => assessCognitiveFitness()}
              stats={cognitiveFitness ? [
                { label: "Overall Score", value: `${cognitiveFitness.overallScore || 0}%` },
                { label: "Dimensions", value: `${cognitiveFitness.dimensions?.length || 0}` },
              ] : undefined}
            />

            {/* Learning DNA Card */}
            <FeatureOverviewCard
              title="Learning DNA"
              description="Discover your unique learning traits and style"
              icon={<Dna className="h-5 w-5 text-green-500" />}
              isActive={hasFeatures.dna}
              isLoading={isLoadingDNA}
              error={dnaError}
              onActivate={() => generateLearningDNA()}
              stats={learningDNA ? [
                { label: "Traits", value: `${learningDNA.traits?.length || 0}` },
                { label: "Profile", value: learningDNA.phenotype?.type || "Unknown" },
              ] : undefined}
            />

            {/* Study Buddy Card */}
            <FeatureOverviewCard
              title="Study Buddy AI"
              description="Your personalized AI learning companion"
              icon={<Bot className="h-5 w-5 text-purple-500" />}
              isActive={hasFeatures.buddy}
              isLoading={isLoadingBuddy}
              error={buddyError}
              onActivate={() => createStudyBuddy({ preferences: {} })}
              stats={studyBuddy ? [
                { label: "Personality", value: studyBuddy.personality?.type || "Unknown" },
                { label: "Bond Level", value: `${studyBuddy.relationship?.bondLevel || 0}%` },
              ] : undefined}
            />

            {/* Quantum Paths Card */}
            <FeatureOverviewCard
              title="Quantum Learning Paths"
              description="Explore multiple learning trajectories simultaneously"
              icon={<Sparkles className="h-5 w-5 text-orange-500" />}
              isActive={hasFeatures.paths}
              isLoading={isLoadingPaths}
              error={pathsError}
              onActivate={() => createQuantumPath("General Learning")}
              stats={quantumPaths && quantumPaths.length > 0 ? [
                { label: "Active Paths", value: `${quantumPaths.length}` },
                { label: "Coherence", value: `${(quantumPaths[0]?.superposition?.coherenceLevel || 0) * 100}%` },
              ] : undefined}
            />
          </div>
        </TabsContent>

        {/* Cognitive Fitness Tab */}
        <TabsContent value="fitness" className="space-y-4">
          <CognitiveFitnessPanel
            fitness={cognitiveFitness}
            isLoading={isLoadingFitness}
            error={fitnessError}
            onAssess={assessCognitiveFitness}
            onStartExercise={startFitnessExercise}
            onCompleteExercise={completeFitnessExercise}
            onGetRecommendations={getFitnessRecommendations}
          />
        </TabsContent>

        {/* Learning DNA Tab */}
        <TabsContent value="dna" className="space-y-4">
          <LearningDNAPanel
            dna={learningDNA}
            isLoading={isLoadingDNA}
            error={dnaError}
            onGenerate={generateLearningDNA}
            onAnalyzeTraits={analyzeDNATraits}
            onTrackEvolution={trackDNAEvolution}
          />
        </TabsContent>

        {/* Study Buddy Tab */}
        <TabsContent value="buddy" className="space-y-4">
          <StudyBuddyPanel
            buddy={studyBuddy}
            isLoading={isLoadingBuddy}
            error={buddyError}
            onCreateBuddy={createStudyBuddy}
            onInteract={interactWithBuddy}
          />
        </TabsContent>

        {/* Quantum Paths Tab */}
        <TabsContent value="quantum" className="space-y-4">
          <QuantumPathsPanel
            paths={quantumPaths}
            isLoading={isLoadingPaths}
            error={pathsError}
            onCreatePath={createQuantumPath}
            onObservePath={observeQuantumPath}
            onCollapsePath={collapseQuantumPath}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Feature Overview Card Component
interface FeatureOverviewCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  onActivate: () => void;
  stats?: Array<{ label: string; value: string }>;
}

function FeatureOverviewCard({
  title,
  description,
  icon,
  isActive,
  isLoading,
  error,
  onActivate,
  stats,
}: FeatureOverviewCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isActive && "border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-900/10"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {isActive ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isActive && stats ? (
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <Button onClick={onActivate} className="w-full">
            <Zap className="mr-2 h-4 w-4" />
            Activate Feature
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Cognitive Fitness Panel
interface CognitiveFitnessPanelProps {
  fitness: ReturnType<typeof useInnovationFeatures>["cognitiveFitness"];
  isLoading: boolean;
  error: string | null;
  onAssess: () => void;
  onStartExercise: (exerciseId: string) => void;
  onCompleteExercise: (sessionId: string, performance: Record<string, unknown>, duration: number) => void;
  onGetRecommendations: () => void;
}

function CognitiveFitnessPanel({
  fitness,
  isLoading,
  error,
  onAssess,
  onStartExercise,
}: CognitiveFitnessPanelProps) {
  if (isLoading) {
    return <CognitiveFitnessLoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!fitness) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Start Your Cognitive Assessment</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Measure your mental fitness across 5 key dimensions: Memory, Attention, Reasoning, Creativity, and Processing Speed
          </p>
          <Button onClick={onAssess} size="lg">
            <Brain className="mr-2 h-5 w-5" />
            Begin Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-900 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Cognitive Fitness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-blue-200 dark:border-blue-800">
                <span className="text-4xl font-bold text-blue-600">{fitness.overallScore || 0}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Your cognitive fitness score is based on performance across all dimensions. Higher scores indicate stronger mental agility.
              </p>
              <Button variant="outline" className="mt-4" onClick={onAssess}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reassess
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fitness.dimensions?.map((dimension: { name: string; score: number; trend?: string }, index: number) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{dimension.name}</span>
                <Badge variant={dimension.score >= 70 ? "default" : "secondary"}>
                  {dimension.score}%
                </Badge>
              </div>
              <Progress value={dimension.score} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {dimension.trend === "improving" && <TrendingUp className="mr-1 inline h-3 w-3 text-green-500" />}
                {dimension.trend || "Stable"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Exercises</CardTitle>
          <CardDescription>Strengthen your cognitive abilities with targeted training</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {fitness.exercises?.slice(0, 4).map((exercise: { exerciseId: string; name: string; dimension: string; duration: number }, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {exercise.duration} min • {exercise.dimension}
                  </p>
                </div>
                <Button size="sm" onClick={() => onStartExercise(exercise.exerciseId)}>
                  Start
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CognitiveFitnessLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-4 h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Learning DNA Panel
interface LearningDNAPanelProps {
  dna: ReturnType<typeof useInnovationFeatures>["learningDNA"];
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  onAnalyzeTraits: () => void;
  onTrackEvolution: () => void;
}

function LearningDNAPanel({
  dna,
  isLoading,
  error,
  onGenerate,
  onAnalyzeTraits,
}: LearningDNAPanelProps) {
  if (isLoading) {
    return <LearningDNALoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dna) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Dna className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Discover Your Learning DNA</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Uncover your unique learning traits, style, and cognitive patterns
          </p>
          <Button onClick={onGenerate} size="lg">
            <Dna className="mr-2 h-5 w-5" />
            Generate My DNA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* DNA Profile Card */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-900 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Dna className="h-5 w-5 text-green-500" />
              Your Learning DNA
            </CardTitle>
            <Badge variant="outline">
              {dna.dnaSequence?.cognitiveCode?.slice(0, 8) || "DNA-XXX"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium">Learning Phenotype</h4>
              <p className="text-sm text-muted-foreground capitalize">
                {dna.phenotype?.type || "Unknown"} Learner
              </p>
            </div>
            <div>
              <h4 className="font-medium">Trait Count</h4>
              <p className="text-sm text-muted-foreground">
                {dna.traits?.length || 0} unique traits identified
              </p>
            </div>
          </div>
          <Button variant="outline" className="mt-4" onClick={onAnalyzeTraits}>
            <Target className="mr-2 h-4 w-4" />
            Analyze Traits
          </Button>
        </CardContent>
      </Card>

      {/* Traits Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dna.traits?.map((trait: { traitId: string; name: string; strength: number; malleability: number }, index: number) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{trait.name}</span>
                <div className="flex items-center gap-1">
                  {trait.strength > 0.7 && <Star className="h-4 w-4 text-yellow-500" />}
                  <Badge variant={trait.strength > 0.7 ? "default" : "secondary"}>
                    {(trait.strength * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <Progress value={trait.strength * 100} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                Malleability: {(trait.malleability * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capabilities */}
      {dna.phenotype?.capabilities && dna.phenotype.capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Capabilities</CardTitle>
            <CardDescription>Natural abilities derived from your DNA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dna.phenotype.capabilities.map((cap: { name: string; level: number }, index: number) => (
                <Badge key={index} variant="outline" className="py-1">
                  {cap.name} - Level {cap.level}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LearningDNALoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Study Buddy Panel
interface StudyBuddyPanelProps {
  buddy: ReturnType<typeof useInnovationFeatures>["studyBuddy"];
  isLoading: boolean;
  error: string | null;
  onCreateBuddy: (preferences: Record<string, unknown>) => void;
  onInteract: (interactionType: string, context: Record<string, unknown>) => void;
}

function StudyBuddyPanel({
  buddy,
  isLoading,
  error,
  onCreateBuddy,
  onInteract,
}: StudyBuddyPanelProps) {
  const [message, setMessage] = useState("");

  if (isLoading) {
    return <StudyBuddyLoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!buddy) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Create Your Study Buddy</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Get a personalized AI companion to support your learning journey
          </p>
          <div className="flex gap-2">
            <Button onClick={() => onCreateBuddy({ personalityType: "motivator" })} variant="outline">
              <Star className="mr-2 h-4 w-4" />
              Motivator
            </Button>
            <Button onClick={() => onCreateBuddy({ personalityType: "challenger" })} variant="outline">
              <Target className="mr-2 h-4 w-4" />
              Challenger
            </Button>
            <Button onClick={() => onCreateBuddy({ personalityType: "supporter" })} variant="outline">
              <Bot className="mr-2 h-4 w-4" />
              Supporter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSendMessage = () => {
    if (message.trim() && buddy) {
      onInteract("conversation", { message });
      setMessage("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Buddy Profile Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-900 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <CardTitle>Your Study Buddy</CardTitle>
              <CardDescription className="capitalize">
                {buddy.personality?.type || "AI"} Personality
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{buddy.relationship?.bondLevel || 0}%</p>
              <p className="text-xs text-muted-foreground">Bond Level</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{buddy.relationship?.interactions || 0}</p>
              <p className="text-xs text-muted-foreground">Interactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{buddy.relationship?.helpfulnessScore || 0}</p>
              <p className="text-xs text-muted-foreground">Helpfulness</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Area */}
      <Card>
        <CardHeader>
          <CardTitle>Chat with Your Buddy</CardTitle>
          <CardDescription>Get support, motivation, or challenge yourself</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => buddy && onInteract("encouragement", {})}
            >
              Get Encouragement
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => buddy && onInteract("challenge", {})}
            >
              Give Me a Challenge
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => buddy && onInteract("quiz", {})}
            >
              Quiz Me
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      {buddy.capabilities && buddy.capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Buddy Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {buddy.capabilities.map((cap: { capability: string; proficiency: number; specializations?: string[]; limitations?: string[] } | string, index: number) => {
                // Handle both string and object capabilities
                const capName = typeof cap === "string" ? cap : cap.capability;
                const proficiency = typeof cap === "object" && cap.proficiency ? Math.round(cap.proficiency * 100) : null;
                return (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {capName}
                    {proficiency !== null && (
                      <span className="ml-1 text-xs opacity-70">({proficiency}%)</span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StudyBuddyLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Quantum Paths Panel
interface QuantumPathsPanelProps {
  paths: ReturnType<typeof useInnovationFeatures>["quantumPaths"];
  isLoading: boolean;
  error: string | null;
  onCreatePath: (goal: string) => void;
  onObservePath: (pathId: string, observationType: string, data: Record<string, unknown>) => void;
  onCollapsePath: (pathId: string, reason?: string) => void;
}

function QuantumPathsPanel({
  paths,
  isLoading,
  error,
  onCreatePath,
  onCollapsePath,
}: QuantumPathsPanelProps) {
  const [newGoal, setNewGoal] = useState("");

  if (isLoading) {
    return <QuantumPathsLoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const handleCreatePath = () => {
    if (newGoal.trim()) {
      onCreatePath(newGoal);
      setNewGoal("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Path */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:border-orange-900 dark:from-orange-900/20 dark:to-yellow-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            Create Quantum Learning Path
          </CardTitle>
          <CardDescription>
            Define a learning goal and explore multiple paths simultaneously
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePath()}
              placeholder="Enter your learning goal..."
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <Button onClick={handleCreatePath}>
              <Zap className="mr-2 h-4 w-4" />
              Create Path
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Paths */}
      {(!paths || paths.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Active Quantum Paths</h3>
            <p className="text-center text-sm text-muted-foreground">
              Create a new quantum learning path to explore multiple trajectories
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paths.map((path, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{path.learningGoal}</CardTitle>
                  <Badge variant={path.collapsed ? "secondary" : "default"}>
                    {path.collapsed ? "Collapsed" : "Superposition"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Coherence Level */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>Coherence Level</span>
                      <span>{((path.superposition?.coherenceLevel || 0) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(path.superposition?.coherenceLevel || 0) * 100} />
                  </div>

                  {/* Possible States */}
                  {path.superposition?.possibleStates && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Possible States</h4>
                      <div className="flex flex-wrap gap-2">
                        {path.superposition.possibleStates.slice(0, 4).map((state: { stateId: string }, stateIndex: number) => (
                          <Badge key={stateIndex} variant="outline">
                            {state.stateId.replace("state-", "Path ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Probability */}
                  {path.probability && (
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Success Probability</p>
                        <p className="text-lg font-bold">
                          {((path.probability?.successProbability || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!path.collapsed && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => path.pathId && onCollapsePath(path.pathId, "Manual collapse")}
                      >
                        Collapse Path
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function QuantumPathsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="mb-4 h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default InnovationDashboard;
