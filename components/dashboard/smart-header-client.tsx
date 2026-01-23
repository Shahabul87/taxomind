'use client';

/**
 * @deprecated Use UnifiedHeaderClient from '@/components/dashboard/unified-header-client' instead.
 * This file is kept for backwards compatibility.
 */

import type { User as NextAuthUser } from 'next-auth';
import { UnifiedHeaderClient } from './unified-header-client';

interface SmartHeaderClientProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  quickActionHandlers?: {
    onCreateStudyPlan: () => void;
    onCreateCoursePlan: () => void;
    onCreateBlogPlan: () => void;
    onScheduleSession: () => void;
    onAddTodo: () => void;
    onSetGoal: () => void;
  };
  isMobileVisible?: boolean;
}

/**
 * @deprecated Use UnifiedHeaderClient instead for consistent header across all pages.
 */
export function SmartHeaderClient({
  user,
}: SmartHeaderClientProps) {
  return <UnifiedHeaderClient user={user} />;
}
