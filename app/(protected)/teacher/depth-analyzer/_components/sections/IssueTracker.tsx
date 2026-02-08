'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  Search,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Lightbulb,
  Code,
  FileText,
  Layers,
  GitBranch,
  Copy,
  Target,
  Sparkles,
  ExternalLink,
  Navigation,
  Clock,
  Link2,
  CircleDot,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AnalysisIssue, IssueSeverity, IssueType, IssueStatus } from '../types';

interface IssueTrackerProps {
  issues: AnalysisIssue[];
  courseId: string;
  onUpdateIssue?: (issueId: string, updates: { status?: string; userNotes?: string }) => Promise<void>;
}

function buildFixLocationUrl(courseId: string, location: AnalysisIssue['location']): string | null {
  if (location.chapterId && location.sectionId) {
    return `/teacher/courses/${courseId}/chapters/${location.chapterId}/section/${location.sectionId}`;
  }
  if (location.chapterId) {
    return `/teacher/courses/${courseId}/chapters/${location.chapterId}`;
  }
  if (!location.chapterId && !location.sectionId) {
    return `/teacher/courses/${courseId}`;
  }
  return null;
}

function getLocationLabel(location: AnalysisIssue['location']): string {
  if (location.sectionTitle) return 'Section';
  if (location.chapterTitle) return 'Chapter';
  return 'Course Level';
}

const severityConfig: Record<IssueSeverity, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  CRITICAL: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Critical' },
  HIGH: { icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: 'High' },
  MEDIUM: { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: 'Medium' },
  LOW: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Low' },
};

const typeConfig: Record<IssueType, { icon: React.ElementType; label: string }> = {
  STRUCTURE: { icon: Layers, label: 'Structure' },
  CONTENT: { icon: FileText, label: 'Content' },
  FLOW: { icon: GitBranch, label: 'Flow' },
  DUPLICATE: { icon: Copy, label: 'Duplicate' },
  CONSISTENCY: { icon: Target, label: 'Consistency' },
  DEPTH: { icon: Sparkles, label: 'Depth' },
  OBJECTIVE: { icon: Target, label: 'Objective' },
  ASSESSMENT: { icon: CheckCircle2, label: 'Assessment' },
  TIME: { icon: Clock, label: 'Time' },
  PREREQUISITE: { icon: Link2, label: 'Prerequisite' },
  GAP: { icon: CircleDot, label: 'Gap' },
};

function IssueCard({
  issue,
  courseId,
  onUpdateIssue,
}: {
  issue: AnalysisIssue;
  courseId: string;
  onUpdateIssue?: IssueTrackerProps['onUpdateIssue'];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const severityCfg = severityConfig[issue.severity] ?? severityConfig.MEDIUM;
  const typeCfg = typeConfig[issue.type] ?? typeConfig.CONTENT;
  const SeverityIcon = severityCfg.icon;
  const TypeIcon = typeCfg.icon;
  const fixUrl = buildFixLocationUrl(courseId, issue.location);
  const locationLabel = getLocationLabel(issue.location);

  const handleStatusChange = async (status: IssueStatus) => {
    if (!onUpdateIssue) return;
    setIsUpdating(true);
    try {
      await onUpdateIssue(issue.id, { status });
    } finally {
      setIsUpdating(false);
    }
  };

  const isResolved = issue.status === 'RESOLVED' || issue.status === 'SKIPPED' || issue.status === 'WONT_FIX';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className={cn('overflow-hidden transition-all duration-200', isResolved && 'opacity-60')}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <button className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg', severityCfg.bgColor)}>
                  <SeverityIcon className={cn('h-4 w-4', severityCfg.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {issue.title}
                    </h4>
                    <Badge variant="secondary" className="text-[10px]">
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {typeCfg.label}
                    </Badge>
                    {isResolved && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {issue.status}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium text-slate-600 dark:text-slate-300">{locationLabel}:</span>
                      {issue.location.chapterTitle ? (
                        <>
                          <span className="text-violet-600 dark:text-violet-400">{issue.location.chapterTitle}</span>
                          {issue.location.sectionTitle && (
                            <>
                              <ChevronRight className="h-3 w-3 text-slate-400" />
                              <span className="text-violet-600 dark:text-violet-400">{issue.location.sectionTitle}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500">Course structure</span>
                      )}
                    </div>
                    {fixUrl && (
                      <Link
                        href={fixUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 bg-violet-50 dark:bg-violet-900/30 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation className="h-2.5 w-2.5" />
                        Go to Fix
                      </Link>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                    {issue.description}
                  </p>
                </div>

                <ChevronRight
                  className={cn(
                    'h-5 w-5 text-slate-400 transition-transform duration-200 flex-shrink-0',
                    isExpanded && 'rotate-90'
                  )}
                />
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-4">
              {/* Evidence */}
              {issue.evidence.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    Evidence
                  </h5>
                  <ul className="space-y-1">
                    {issue.evidence.map((e, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <span className="text-slate-400">&bull;</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Impact */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase">
                      Impact: {issue.impact.area}
                    </span>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      {issue.impact.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fix Instructions */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                      How to Fix ({issue.fix.action})
                    </span>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">
                      {issue.fix.what}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-2">
                      <strong>Why:</strong> {issue.fix.why}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                      <strong>How:</strong> {issue.fix.how}
                    </p>

                    {issue.fix.suggestedContent && (
                      <div className="mt-3 p-2 bg-white dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                          <Code className="h-3 w-3" />
                          Suggested Content
                        </div>
                        <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-x-auto">
                          {issue.fix.suggestedContent}
                        </pre>
                      </div>
                    )}

                    {issue.fix.examples && issue.fix.examples.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">Examples:</span>
                        <ul className="mt-1 space-y-1">
                          {issue.fix.examples.map((ex, i) => (
                            <li key={i} className="text-sm text-emerald-600 dark:text-emerald-500 flex items-start gap-2">
                              <span className="text-emerald-400">&bull;</span>
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                {fixUrl && (
                  <Button
                    size="sm"
                    asChild
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
                  >
                    <Link href={fixUrl} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Fix This Issue
                    </Link>
                  </Button>
                )}

                {onUpdateIssue && !isResolved && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('RESOLVED')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Mark Resolved
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('SKIPPED')}
                    >
                      Skip
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('WONT_FIX')}
                    >
                      Won&apos;t Fix
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

export function IssueTracker({ issues, courseId, onUpdateIssue }: IssueTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !issue.title.toLowerCase().includes(search) &&
          !issue.description.toLowerCase().includes(search) &&
          !(issue.location.chapterTitle?.toLowerCase().includes(search)) &&
          !(issue.location.sectionTitle?.toLowerCase().includes(search))
        ) {
          return false;
        }
      }

      if (severityFilter !== 'ALL' && issue.severity !== severityFilter) return false;
      if (typeFilter !== 'ALL' && issue.type !== typeFilter) return false;

      if (statusFilter !== 'ALL') {
        const isResolved = issue.status === 'RESOLVED' || issue.status === 'SKIPPED' || issue.status === 'WONT_FIX';
        if (statusFilter === 'OPEN' && isResolved) return false;
        if (statusFilter === 'RESOLVED' && !isResolved) return false;
      }

      return true;
    });
  }, [issues, searchTerm, severityFilter, typeFilter, statusFilter]);

  const groupedBySeverity = useMemo(() => {
    const groups: Record<IssueSeverity, AnalysisIssue[]> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };

    filteredIssues.forEach((issue) => {
      const bucket = groups[issue.severity] ?? groups.MEDIUM;
      bucket.push(issue);
    });

    return groups;
  }, [filteredIssues]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as IssueSeverity | 'ALL')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severity</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as IssueType | 'ALL')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="STRUCTURE">Structure</SelectItem>
                <SelectItem value="CONTENT">Content</SelectItem>
                <SelectItem value="FLOW">Flow</SelectItem>
                <SelectItem value="DUPLICATE">Duplicate</SelectItem>
                <SelectItem value="CONSISTENCY">Consistency</SelectItem>
                <SelectItem value="DEPTH">Depth</SelectItem>
                <SelectItem value="OBJECTIVE">Objective</SelectItem>
                <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                <SelectItem value="TIME">Time</SelectItem>
                <SelectItem value="PREREQUISITE">Prerequisite</SelectItem>
                <SelectItem value="GAP">Gap</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'ALL' | 'OPEN' | 'RESOLVED')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Issue List */}
      {filteredIssues.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {issues.length === 0 ? 'No issues found!' : 'No matching issues'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {issues.length === 0
                ? 'Your course looks great. Keep up the excellent work!'
                : 'Try adjusting your filters to see more issues.'}
            </p>
          </div>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={['CRITICAL', 'HIGH']} className="space-y-4">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as IssueSeverity[]).map((severity) => {
            const severityIssues = groupedBySeverity[severity];
            if (severityIssues.length === 0) return null;

            const cfg = severityConfig[severity];

            return (
              <AccordionItem key={severity} value={severity} className="border-none">
                <AccordionTrigger className={cn('px-4 py-3 rounded-lg', cfg.bgColor, 'hover:no-underline')}>
                  <div className="flex items-center gap-3">
                    <cfg.icon className={cn('h-5 w-5', cfg.color)} />
                    <span className={cn('font-semibold', cfg.color)}>{cfg.label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {severityIssues.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3">
                  <AnimatePresence>
                    {severityIssues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} courseId={courseId} onUpdateIssue={onUpdateIssue} />
                    ))}
                  </AnimatePresence>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
