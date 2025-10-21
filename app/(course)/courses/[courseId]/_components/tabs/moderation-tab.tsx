"use client";

import React from 'react';

interface ModerationTabProps { courseId: string; }

interface QuestionReport {
  id: string;
  reason: string;
  createdAt: string;
  question?: {
    id: string;
    title?: string;
  };
  user?: {
    id: string;
    name?: string;
  };
}

export const ModerationTab: React.FC<ModerationTabProps> = ({ courseId }) => {
  const [reports, setReports] = React.useState<QuestionReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/reports`);
      if (res.status === 403) { setError('You do not have access to moderation.'); setReports([]); return; }
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error?.message || 'Failed to load reports');
      setReports(data.data.reports || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => { load().catch(() => {}); }, [load]);

  const dismiss = async (id: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error('Failed to dismiss');
      setReports((prev) => prev.filter(r => r.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Moderation</h3>
        <button className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => load()}>Refresh</button>
      </div>
      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-red-600">{error}</div>
      ) : reports.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">No reports</div>
      ) : (
        <div className="overflow-auto rounded border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left">Question</th>
                <th className="px-3 py-2 text-left">Reporter</th>
                <th className="px-3 py-2 text-left">Reason</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2"/>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2">
                    <a className="text-blue-700 dark:text-blue-300 hover:underline" href={`/courses/${courseId}/questions/${r.question?.id}`} target="_blank" rel="noreferrer">
                      {r.question?.title || r.question?.id}
                    </a>
                  </td>
                  <td className="px-3 py-2">{r.user?.name || r.user?.id || 'User'}</td>
                  <td className="px-3 py-2">{r.reason || '-'}</td>
                  <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => dismiss(r.id)}>Dismiss</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

