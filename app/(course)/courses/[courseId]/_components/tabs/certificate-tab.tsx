"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Download, Share2, Calendar, Copy, ExternalLink, Play, HelpCircle, ListChecks, BookOpen } from 'lucide-react';
import { EventTracker } from '@/lib/analytics/event-tracker';

interface CertificateTabProps {
  courseId: string;
  isEnrolled?: boolean;
}

export const CertificateTab = ({
  courseId,
  isEnrolled = false,
}: CertificateTabProps): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    hasCompleted: boolean;
    courseTitle?: string | null;
    studentName?: string | null;
    completionDateISO?: string | null;
    certificateId?: string | null;
    verificationUrl?: string | null;
    issuer?: string | null;
    nextSection?: { chapterId: string; sectionId: string; chapterTitle: string | null; sectionTitle: string | null } | null;
    progressPercent?: number | null;
    lastAccessedAt?: string | null;
    pendingCounts?: { total: number; byType: Record<string, number> };
    canManage?: boolean;
  }>({ hasCompleted: false });

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetch(`/api/courses/${courseId}/certificate`).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((d) => { if (!cancelled) setData(d); }).catch(() => { if (!cancelled) setError('Unable to load certificate'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId]);

  const formattedDate = useMemo(() => {
    if (!data.completionDateISO) return '[Completion Date]';
    try { return new Date(data.completionDateISO).toLocaleDateString(); } catch { return '[Completion Date]'; }
  }, [data.completionDateISO]);

  const linkedInUrl = useMemo(() => {
    if (!data.courseTitle || !data.issuer || !data.verificationUrl || !data.completionDateISO) return null;
    try {
      const d = new Date(data.completionDateISO);
      const params = new URLSearchParams({
        startTask: 'CERTIFICATION_NAME',
        name: data.courseTitle || 'Course Certificate',
        organizationName: data.issuer || 'Taxomind',
        certId: data.certificateId || '',
        certUrl: data.verificationUrl || '',
        issueYear: String(d.getFullYear()),
        issueMonth: String(d.getMonth() + 1),
      });
      return `https://www.linkedin.com/profile/add?${params.toString()}`;
    } catch {
      return null;
    }
  }, [data.courseTitle, data.issuer, data.verificationUrl, data.certificateId, data.completionDateISO]);

  const timeAgo = (iso?: string | null): string | null => {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} day${d === 1 ? '' : 's'} ago`;
    if (h > 0) return `${h} hour${h === 1 ? '' : 's'} ago`;
    if (m > 0) return `${m} minute${m === 1 ? '' : 's'} ago`;
    return `just now`;
  };

  const requirements = [
    'Complete all course chapters',
    'Pass all quizzes with 70% or higher',
    'Complete the final project',
    'Achieve overall course progress of 100%',
  ];

  const handlePrint = () => {
    try {
      EventTracker.getInstance().trackInteraction('certificate_print_pdf', { courseId, certificateId: data.certificateId });
    } catch {}
    const win = window.open('', '_blank');
    if (!win) return;
    const style = `
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system; padding: 24px; color: #0f172a; }
        .frame { border: 6px solid #f59e0b; padding: 24px; border-radius: 12px; position: relative; }
        .corner { position:absolute; width: 64px; height: 64px; border-color: #f59e0b; }
        .tl { top: 8px; left: 8px; border-top: 6px solid; border-left: 6px solid; }
        .tr { top: 8px; right: 8px; border-top: 6px solid; border-right: 6px solid; }
        .bl { bottom: 8px; left: 8px; border-bottom: 6px solid; border-left: 6px solid; }
        .br { bottom: 8px; right: 8px; border-bottom: 6px solid; border-right: 6px solid; }
        .title { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .subtitle { color: #475569; }
        .name { font-size: 24px; font-weight: 700; color:#b45309; }
        .muted { color: #64748b; }
      </style>
    `;
    const html = `<!doctype html><html><head><meta charset="utf-8"/>${style}<title>Certificate</title></head><body>
      <div class="frame">
        <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
        <div style="text-align:center; padding: 24px 8px;">
          <div class="title">Certificate of Completion</div>
          <div class="subtitle">${data.courseTitle || '[Course Title]'}</div>
          <div class="subtitle" style="margin: 16px 0;">Presented to</div>
          <div class="name">${data.studentName || '[Student Name]'}</div>
          <div class="muted" style="margin-top: 16px;">${formattedDate}</div>
          ${data.certificateId ? `<div class="muted" style="margin-top: 4px;">ID: ${data.certificateId}</div>` : ''}
          ${data.issuer ? `<div class="muted" style="margin-top: 4px;">Issuer: ${data.issuer}</div>` : ''}
          ${data.verificationUrl ? `<div class="muted" style="margin-top: 8px;">Verify: ${data.verificationUrl}</div>` : ''}
        </div>
      </div>
      <script>window.onload = () => setTimeout(() => window.print(), 100);</script>
    </body></html>`;
    win.document.write(html);
    win.document.close();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {error && (
        <div className="p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">{error}</div>
      )}
      {loading && (
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 animate-pulse">Loading certificate…</div>
      )}
      {/* Certificate Preview */}
      <div className="bg-white dark:bg-slate-900/50 border border-amber-300/60 dark:border-amber-800/50 rounded-2xl p-8 md:p-12">
        <div className="text-center">
          {/* Certificate Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl"
          >
            <Award className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Certificate of Completion
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400 mb-8"
          >
            {data.hasCompleted
              ? 'Congratulations! You&apos;ve earned your certificate.'
              : 'Complete the course to earn your certificate'}
          </motion.p>

          {/* Certificate Preview Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 border-4 border-amber-300/70 dark:border-amber-800/70 max-w-2xl mx-auto"
          >
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-400" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-400" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-400" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-400" />

            <div className="py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Certificate of Completion
              </p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {data.courseTitle || '[Course Title]'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Presented to</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-6">
                {data.studentName || '[Student Name]'}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              {data.certificateId && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">ID: {data.certificateId}</div>
              )}
              {data.verificationUrl && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data.verificationUrl)}`}
                    alt="Certificate verification QR code"
                    width={120}
                    height={120}
                    className="rounded-md border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          {data.hasCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mt-6"
            >
              <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg font-medium shadow-lg transition-all duration-200">
                <Download className="w-4 h-4" />
                Save as PDF
              </button>
              {data.verificationUrl && (
                <button
                  onClick={() => { navigator.clipboard?.writeText(data.verificationUrl || ''); try { EventTracker.getInstance().trackInteraction('certificate_copy_verification', { courseId, certificateId: data.certificateId }); } catch {} }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium border-2 border-gray-200 dark:border-gray-700 transition-all duration-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy verification link
                </button>
              )}
              {data.verificationUrl && (
                <a href={data.verificationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium border-2 border-gray-200 dark:border-gray-700 transition-all duration-200">
                  <ExternalLink className="w-4 h-4" /> Verify online
                </a>
              )}
              {linkedInUrl && (
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { try { EventTracker.getInstance().trackInteraction('certificate_add_linkedin', { courseId, certificateId: data.certificateId }); } catch {} }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-lg font-medium shadow transition-all duration-200"
                >
                  Add to LinkedIn
                </a>
              )}
            </motion.div>
          )}
          {!data.hasCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mt-6"
            >
              <a
                href={`/courses/${courseId}?tab=content${data.nextSection ? `&chapter=${data.nextSection.chapterId}&section=${data.nextSection.sectionId}` : ''}`}
                onClick={() => { try { EventTracker.getInstance().trackInteraction('certificate_continue_learning', { courseId, chapterId: data.nextSection?.chapterId, sectionId: data.nextSection?.sectionId }); } catch {} }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition-all duration-200"
              >
                Continue Learning
              </a>
              {data.nextSection && (
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center px-2 gap-2 flex-wrap">
                  <span>
                    Next up: <span className="mx-1 font-semibold">{data.nextSection.sectionTitle || 'Section'}</span>
                    <span className="opacity-70">in</span>
                    <span className="ml-1">{data.nextSection.chapterTitle || 'Chapter'}</span>
                  </span>
                  {typeof data.progressPercent === 'number' && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                      Progress: {Math.max(0, Math.min(100, Math.round(data.progressPercent)))}%
                    </span>
                  )}
                  {data.lastAccessedAt && (
                    <span title={new Date(data.lastAccessedAt).toLocaleString()} className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                      Last accessed: {timeAgo(data.lastAccessedAt)}
                    </span>
                  )}
                </div>
              )}
              {data.pendingCounts && data.pendingCounts.total > 0 && (
                <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                  {Object.entries(data.pendingCounts.byType).map(([k, v]) => (
                    v > 0 ? (
                      <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
                        {k === 'Video' ? <Play className="w-3 h-3" /> : k === 'Quiz' ? <HelpCircle className="w-3 h-3" /> : k === 'Assignment' ? <ListChecks className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                        {k}: {v}
                      </span>
                    ) : null
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          Requirements to Earn Certificate
        </h3>

        <div className="space-y-3">
          {requirements.map((requirement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-start gap-3"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    strokeWidth={2.5}
                  />
                </div>
              </div>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {requirement}
              </p>
            </motion.div>
          ))}
        </div>

        {!isEnrolled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Enroll in this course to start working towards your
              certificate.
            </p>
          </motion.div>
        )}

        {data.canManage && !data.hasCompleted && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <a href={`/teacher/courses/${courseId}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Open teacher tools</a>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/courses/${courseId}/certificate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'issue' }) });
                  if (res.ok) {
                    setData((d) => ({ ...d, hasCompleted: true }));
                  }
                } catch {}
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            >
              Issue certificate (self)
            </button>
          </div>
        )}
      </div>

      {/* Certificate Features */}
      <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Certificate Features
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Shareable Certificate
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share on LinkedIn, Twitter, or your resume
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Downloadable PDF
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download in high-quality PDF format
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Verified</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unique ID for verification
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Lifetime Access</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access your certificate anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
