'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { FeatureGate } from '@/lib/dashboard/FeatureGate';

// Career & Professional Growth
import { CareerGrowthHub } from '@/components/sam/career-growth-hub';
import { CareerProgressWidget } from '@/components/sam/CareerProgressWidget';
import { PortfolioExport } from '@/components/sam/portfolio-export';

// Certifications (moved from Skills tab)
import {
  CertificationTracker,
  SkillToCertificationMap,
} from '@/components/sam/certification';

// Course Marketplace
// import { CourseMarketplace } from '@/components/sam/course-marketplace';

interface CareerTabProps {
  userId: string;
}

export function CareerTab({ userId }: CareerTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/30 dark:from-slate-900 dark:via-cyan-900/10 dark:to-blue-900/10">
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        <FeatureGate feature="CAREER_TAB_ENABLED">
          {/* Career Growth Hub - Unified career development experience */}
          <div className="mb-6 sm:mb-8">
            <CareerGrowthHub userId={userId} />
          </div>

          {/* Career Progress Widget */}
          <div className="mb-6 sm:mb-8">
            <CareerProgressWidget />
          </div>

          {/* Portfolio Export */}
          <div className="mb-6 sm:mb-8">
            <PortfolioExport userId={userId} />
          </div>

          {/* Certifications */}
          <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <CertificationTracker userId={userId} />
            <SkillToCertificationMap userId={userId} />
          </div>

          {/* Course Marketplace (when available) */}
          <FeatureGate feature="COURSE_MARKETPLACE">
            <div className="mb-6 sm:mb-8">
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Course Marketplace coming soon
                </p>
              </div>
            </div>
          </FeatureGate>
        </FeatureGate>
      </div>
    </div>
  );
}
