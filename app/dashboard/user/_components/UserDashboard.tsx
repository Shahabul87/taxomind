"use client";

import { User } from 'next-auth';
import { AIWelcomeHub } from './smart-dashboard/AIWelcomeHub';
import { LearningJourneyMap } from './smart-dashboard/LearningJourneyMap';
import { SmartActionDashboard } from './smart-dashboard/SmartActionDashboard';
import { CommunityImpactCenter } from './smart-dashboard/CommunityImpactCenter';
import { GamificationEngine } from './smart-dashboard/GamificationEngine';
import { PredictiveAnalytics } from './smart-dashboard/PredictiveAnalytics';
import { RealtimePulse } from './smart-dashboard/RealtimePulse';
import { ProgressMonitor } from './smart-dashboard/ProgressMonitor';
import { ProgressTrackingDemo } from './smart-dashboard/ProgressTrackingDemo';
import { SAMInnovationFeatures } from './smart-dashboard/SAMInnovationFeatures';
import { IntelligentOnboarding } from '@/components/ui/intelligent-onboarding';
import { useIntelligentOnboarding } from '@/hooks/use-intelligent-onboarding';
import { OnboardingTrigger } from '@/components/ui/onboarding-trigger';

interface UserDashboardProps {
  user: User;
}

export function UserDashboard({ user }: UserDashboardProps) {
  const {
    isOnboardingVisible,
    isOnboardingComplete,
    startOnboarding,
    completeOnboarding,
    skipOnboarding
  } = useIntelligentOnboarding({
    userRole: "USER",
    userId: user.id,
    autoStart: true
  });

  return (
    <div className="relative w-full overflow-x-hidden min-h-screen bg-gradient-to-bl from-slate-900 via-slate-800 to-slate-900">
      <IntelligentOnboarding
        userRole="USER"
        isVisible={isOnboardingVisible}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
      {/* Background pattern */}
      
      {/* Glowing orbs */}
      <div className="absolute -top-40 -right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute top-[30%] -left-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      
      <div className="relative w-full">
        {/* AI Welcome Hub - 25% */}
        <AIWelcomeHub user={user} />
      
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Learning Journey Map - 35% */}
          <div className="mb-8">
            <LearningJourneyMap user={user} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            
            {/* Smart Action Dashboard */}
            <div className="lg:col-span-2">
              <SmartActionDashboard user={user} />
            </div>

            {/* Community Impact Center */}
            <div className="lg:col-span-2">
              <CommunityImpactCenter user={user} />
            </div>
          </div>

          {/* Analytics and Gamification Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Predictive Analytics */}
            <div className="lg:col-span-2">
              <PredictiveAnalytics user={user} />
            </div>

            {/* Gamification Engine */}
            <div>
              <GamificationEngine user={user} />
            </div>
          </div>

          {/* Real-time Pulse */}
          <RealtimePulse user={user} />
          
          {/* Progress Monitor */}
          <div className="mt-8">
            <ProgressMonitor user={user} />
          </div>
          
          {/* SAM Innovation Features - New! */}
          <div className="mt-8">
            <SAMInnovationFeatures user={user} />
          </div>
          
          {/* Progress Tracking Demo */}
          <div className="mt-8">
            <ProgressTrackingDemo user={user} />
          </div>
        </div>

        {/* Floating AI Tutor */}
        
        {/* Floating Onboarding Trigger */}
        <OnboardingTrigger
          onClick={startOnboarding}
          isComplete={isOnboardingComplete}
          variant="floating"
        />
      </div>
    </div>
  );
} 