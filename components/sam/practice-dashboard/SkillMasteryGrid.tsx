'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Loader2,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SkillMasteryCard } from './SkillMasteryCard';
import type { SkillMasteryGridProps, ProficiencyLevel } from './types';

type SortOption = 'hours' | 'sessions' | 'streak' | 'name' | 'lastPractice';
type SortDirection = 'asc' | 'desc';

const PROFICIENCY_ORDER: ProficiencyLevel[] = [
  'BEGINNER',
  'NOVICE',
  'INTERMEDIATE',
  'COMPETENT',
  'PROFICIENT',
  'ADVANCED',
  'EXPERT',
  'MASTER',
];

export function SkillMasteryGrid({
  masteries,
  isLoading,
  onSkillClick,
  className,
}: SkillMasteryGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('hours');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterLevel, setFilterLevel] = useState<ProficiencyLevel | 'all'>('all');

  // Filter and sort masteries
  const filteredMasteries = useMemo(() => {
    let result = [...masteries];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          (m.skill?.name || m.skillName || '').toLowerCase().includes(query) ||
          (m.skill?.category || '').toLowerCase().includes(query)
      );
    }

    // Level filter
    if (filterLevel !== 'all') {
      result = result.filter((m) => m.proficiencyLevel === filterLevel);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'hours':
          comparison = a.totalQualityHours - b.totalQualityHours;
          break;
        case 'sessions':
          comparison = a.totalSessions - b.totalSessions;
          break;
        case 'streak':
          comparison = a.currentStreak - b.currentStreak;
          break;
        case 'name':
          comparison = (a.skill?.name || a.skillName || '').localeCompare(
            b.skill?.name || b.skillName || ''
          );
          break;
        case 'lastPractice':
          const aDate = a.lastPracticedAt ? new Date(a.lastPracticedAt).getTime() : 0;
          const bDate = b.lastPracticedAt ? new Date(b.lastPracticedAt).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [masteries, searchQuery, sortBy, sortDirection, filterLevel]);

  if (isLoading) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-slate-500 dark:text-slate-400">Loading skills...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (masteries.length === 0) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="py-12 text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Skills Tracked Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Start a practice session to begin tracking your skill mastery.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterLevel === 'all' ? 'All Levels' : filterLevel}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterLevel('all')}>
                All Levels
              </DropdownMenuItem>
              {PROFICIENCY_ORDER.map((level) => (
                <DropdownMenuItem key={level} onClick={() => setFilterLevel(level)}>
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {sortDirection === 'desc' ? (
                  <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                )}
                Sort
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSortBy('hours'); setSortDirection('desc'); }}>
                Hours (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('hours'); setSortDirection('asc'); }}>
                Hours (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('sessions'); setSortDirection('desc'); }}>
                Sessions (Most)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('streak'); setSortDirection('desc'); }}>
                Streak (Longest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('lastPractice'); setSortDirection('desc'); }}>
                Recently Practiced
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('name'); setSortDirection('asc'); }}>
                Name (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing {filteredMasteries.length} of {masteries.length} skills
      </p>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
          },
        }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filteredMasteries.map((mastery) => (
          <SkillMasteryCard
            key={mastery.id}
            mastery={mastery}
            onClick={onSkillClick}
          />
        ))}
      </motion.div>

      {/* No results */}
      {filteredMasteries.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            No skills match your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}

export default SkillMasteryGrid;
