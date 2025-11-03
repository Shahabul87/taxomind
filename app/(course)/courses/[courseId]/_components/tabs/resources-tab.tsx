"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Link as LinkIcon,
  ExternalLink,
  Search,
  FolderOpen,
  File,
  Globe
} from 'lucide-react';

interface ResourcesTabProps {
  courseId: string;
}

interface Resource {
  id: string;
  name: string;
  url?: string | null;
  type?: string | null;
  size?: string | null;
  description?: string;
  chapterId?: string | null;
  chapterTitle?: string | null;
}

interface ResourcesData {
  downloadable: Resource[];
  external: Resource[];
}

export const ResourcesTab = ({ courseId }: ResourcesTabProps): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<ResourcesData>({ downloadable: [], external: [] });
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/courses/${courseId}/resources`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setResources({
          downloadable: data.downloadable || [],
          external: data.external || [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load resources');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return resources;
    const q = query.toLowerCase();
    return {
      downloadable: resources.downloadable.filter((r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.type || '').toLowerCase().includes(q) ||
        (r.chapterTitle || '').toLowerCase().includes(q)
      ),
      external: resources.external.filter((r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.chapterTitle || '').toLowerCase().includes(q)
      ),
    };
  }, [resources, query]);

  const totalResources = resources.downloadable.length + resources.external.length;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (totalResources === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No Resources Available
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Resources for this course will be added soon
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Course Resources
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Downloadable files and external links to enhance your learning
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>{resources.downloadable.length} downloadable files</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>{resources.external.length} external links</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Downloadable Resources */}
      {filtered.downloadable.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Downloadable Files
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({filtered.downloadable.length})
            </span>
          </div>

          <div className="grid gap-3">
            {filtered.downloadable.map((resource) => (
              <div
                key={resource.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {resource.name}
                        </p>
                        {resource.type && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {resource.type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {resource.size && <span>{resource.size}</span>}
                        {resource.chapterTitle && (
                          <>
                            <span>•</span>
                            <span>{resource.chapterTitle}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <a
                    href={resource.url || '#'}
                    download
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Resources */}
      {filtered.external.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              External Links
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({filtered.external.length})
            </span>
          </div>

          <div className="grid gap-3">
            {filtered.external.map((resource) => (
              <a
                key={resource.id}
                href={resource.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {resource.name}
                      </p>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0" />
                    </div>

                    {resource.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {resource.description}
                      </p>
                    )}

                    {resource.url && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                        {resource.url}
                      </p>
                    )}

                    {resource.chapterTitle && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        From: {resource.chapterTitle}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {query && filtered.downloadable.length === 0 && filtered.external.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">
            No resources match your search
          </p>
        </div>
      )}
    </div>
  );
};
