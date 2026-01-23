'use client';

import Link from 'next/link';
import { LayoutDashboard, GraduationCap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickNavigationProps {
  isTeacher?: boolean;
  className?: string;
}

export function QuickNavigation({ isTeacher, className }: QuickNavigationProps) {
  return (
    <nav className={cn('hidden md:flex items-center gap-1', className)}>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <LayoutDashboard className="h-4 w-4" />
        <span className="hidden lg:inline">Dashboard</span>
      </Link>
      <Link
        href="/courses"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <GraduationCap className="h-4 w-4" />
        <span className="hidden lg:inline">Courses</span>
      </Link>
      {isTeacher && (
        <Link
          href="/teacher/courses"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden lg:inline">My Courses</span>
        </Link>
      )}
    </nav>
  );
}
