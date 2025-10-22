"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Link as LinkIcon,
  Code,
  BookOpen,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { EventTracker } from '@/lib/analytics/event-tracker';

interface ResourcesTabProps {
  courseId: string;
}

export const ResourcesTab = ({ courseId }: ResourcesTabProps): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<{
    downloadable: Array<{ id: string; name: string; url?: string | null; type?: string | null; size?: string | null; chapterId?: string | null; chapterTitle?: string | null }>;
    external: Array<{ id: string; name: string; url?: string | null; description?: string; chapterId?: string | null; chapterTitle?: string | null }>;
  }>({ downloadable: [], external: [] });

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetch(`/api/courses/${courseId}/resources`).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((data) => {
      if (cancelled) return;
      setResources({
        downloadable: (data.downloadable || []).map((d: any) => ({ ...d })),
        external: (data.external || []).map((e: any) => ({ ...e })),
      });
    }).catch((e) => {
      if (cancelled) return;
      setError('Unable to load resources');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [courseId]);

  const [query, setQuery] = useState('');
  const hasQuery = query.trim().length > 0;

  const filtered = useMemo(() => {
    if (!hasQuery) return resources;
    const q = query.toLowerCase();
    return {
      downloadable: resources.downloadable.filter((r) =>
        (r.name || '').toLowerCase().includes(q) || (r.type || '').toLowerCase().includes(q) || (r.chapterTitle || '').toLowerCase().includes(q)
      ),
      external: resources.external.filter((r) =>
        (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.chapterTitle || '').toLowerCase().includes(q)
      ),
    };
  }, [resources, hasQuery, query]);

  // Group by chapter for clearer structure
  type Group<T> = { key: string; title: string; items: T[] };
  const groupByChapter = useCallback(<T extends { chapterId?: string | null; chapterTitle?: string | null }>(items: T[]): Group<T>[] => {
    const map = new Map<string, Group<T>>();
    items.forEach((r) => {
      const key = (r.chapterId || r.chapterTitle || 'course') as string;
      const title = r.chapterTitle || 'Course Resources';
      if (!map.has(key)) map.set(key, { key, title, items: [] });
      map.get(key)!.items.push(r);
    });
    return Array.from(map.values());
  }, []);
  const groupsDownloadable = useMemo(() => groupByChapter(filtered.downloadable), [filtered.downloadable, groupByChapter]);
  const groupsExternal = useMemo(() => groupByChapter(filtered.external), [filtered.external, groupByChapter]);

  // Accordion state per group
  const [expandedDl, setExpandedDl] = useState<Record<string, boolean>>({});
  const [expandedExt, setExpandedExt] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setExpandedDl((prev) => {
      const next = { ...prev };
      groupsDownloadable.forEach((g) => { if (next[g.key] === undefined) next[g.key] = true; });
      return next;
    });
  }, [groupsDownloadable]);
  useEffect(() => {
    setExpandedExt((prev) => {
      const next = { ...prev };
      groupsExternal.forEach((g) => { if (next[g.key] === undefined) next[g.key] = true; });
      return next;
    });
  }, [groupsExternal]);

  const setAllExpanded = (expanded: boolean) => {
    setExpandedDl(Object.fromEntries(groupsDownloadable.map((g) => [g.key, expanded])));
    setExpandedExt(Object.fromEntries(groupsExternal.map((g) => [g.key, expanded])));
  };

  const hostFromUrl = (url?: string | null): string | null => {
    if (!url) return null;
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 cv-auto"
    >
      {/* Search */}
      <div className="flex justify-center">
        <label htmlFor="resources-search" className="sr-only">Search resources</label>
        <div className="w-full max-w-xl flex items-center gap-2">
          <input
            id="resources-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search PDFs, code, links…"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">{error}</div>
      )}
      {loading && (
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 animate-pulse">Loading resources…</div>
      )}

      {/* Global expand/collapse controls */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setAllExpanded(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Expand all
        </button>
        <button
          type="button"
          onClick={() => setAllExpanded(false)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Collapse all
        </button>
      </div>

      {/* Downloadable Resources */}
      <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 md:p-8" role="region" aria-labelledby="resources-downloadable">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Download className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 id="resources-downloadable" className="text-xl font-bold text-gray-900 dark:text-white">
              Downloadable Resources
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Files you can download and use offline
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {groupsDownloadable.map((group) => (
            <div key={`dl-group-${group.key}`} role="group" aria-labelledby={`dl-h-${group.key}`} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  {group.key !== 'course' && (
                    <a href={`?tab=content&chapter=${group.key}`} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">From Content</a>
                  )}
                  <h4 id={`dl-h-${group.key}`} className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{group.items.length} item{group.items.length === 1 ? '' : 's'}</span>
                  <button
                    type="button"
                    onClick={() => setExpandedDl((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                    aria-expanded={!!expandedDl[group.key]}
                    aria-controls={`dl-list-${group.key}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span>{expandedDl[group.key] ? 'Hide' : 'Show'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedDl[group.key] ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {expandedDl[group.key] && (
              <div className="space-y-3" role="list" id={`dl-list-${group.key}`}>
                {group.items.map((resource, index) => (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 shadow-none md:hover:shadow-md transition-all duration-200"
                    role="listitem"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white break-words word-break-anywhere text-balance">{resource.name}</p>
                          {(resource.type || 'FILE') && (
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                              {(resource.type || 'FILE').toString().toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 break-words word-break-anywhere">
                          {(resource.type || 'FILE')}{resource.size ? ` • ${resource.size}` : ''}{resource.chapterTitle ? ` • ${resource.chapterTitle}` : ''}
                        </p>
                      </div>
                    </div>
                    <a
                      href={resource.url || '#'}
                      download
                      onClick={() => { try { EventTracker.getInstance().trackInteraction('resource_download', { courseId, name: resource.name, type: resource.type, chapter: resource.chapterTitle }); } catch {} }}
                      aria-label={`Download ${resource.name}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </motion.div>
                ))}
              </div>
              )}
            </div>
          ))}
          {filtered.downloadable.length === 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">No downloadable resources match your search.</div>
          )}
        </div>
      </div>

      {/* External Links */}
      <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 md:p-8" role="region" aria-labelledby="resources-external">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
            <LinkIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 id="resources-external" className="text-xl font-bold text-gray-900 dark:text-white">External Resources</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Helpful links and references
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {groupsExternal.map((group) => (
            <div key={`ext-group-${group.key}`} role="group" aria-labelledby={`ext-h-${group.key}`} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  {group.key !== 'course' && (
                    <a href={`?tab=content&chapter=${group.key}`} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">From Content</a>
                  )}
                  <h4 id={`ext-h-${group.key}`} className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{group.items.length} link{group.items.length === 1 ? '' : 's'}</span>
                  <button
                    type="button"
                    onClick={() => setExpandedExt((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                    aria-expanded={!!expandedExt[group.key]}
                    aria-controls={`ext-list-${group.key}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span>{expandedExt[group.key] ? 'Hide' : 'Show'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedExt[group.key] ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {expandedExt[group.key] && (
              <div className="space-y-3" role="list" id={`ext-list-${group.key}`}>
                {group.items.map((resource, index) => (
                  <motion.a
                    key={resource.id}
                    href={resource.url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => { try { EventTracker.getInstance().trackInteraction('resource_external_open', { courseId, name: resource.name, url: resource.url, chapter: resource.chapterTitle }); } catch {} }}
                    className="group flex items-start justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600 shadow-none md:hover:shadow-md transition-all duration-200"
                    role="listitem"
                  >
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors break-words word-break-anywhere text-balance">
                          {resource.name}
                        </p>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                        {hostFromUrl(resource.url) && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20">
                            {hostFromUrl(resource.url)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words word-break-anywhere">{resource.description || resource.url}</p>
                      {resource.chapterTitle && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">From: {resource.chapterTitle}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        try {
                          navigator.clipboard?.writeText(resource.url || '').catch(() => {});
                          EventTracker.getInstance().trackInteraction('resource_external_copy', { courseId, name: resource.name, url: resource.url, chapter: resource.chapterTitle });
                        } catch {}
                      }}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 inline-flex items-center px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                      aria-label={`Copy link for ${resource.name}`}
                    >
                      Copy link
                    </button>
                  </motion.a>
                ))}
              </div>
              )}
            </div>
          ))}
          {filtered.external.length === 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">No external resources match your search.</div>
          )}
        </div>
      </div>

      {/* Empty State - For when no resources */}
      {filtered.downloadable.length === 0 && filtered.external.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-12 text-center"
        >
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Resources Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Resources for this course will be added soon
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
