"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Award, CheckCircle, Download, Calendar, ExternalLink, Share2 } from 'lucide-react';

interface CertificateTabProps {
  courseId: string;
  isEnrolled?: boolean;
}

interface CertificateData {
  hasCompleted: boolean;
  courseTitle?: string | null;
  studentName?: string | null;
  completionDateISO?: string | null;
  certificateId?: string | null;
  verificationUrl?: string | null;
  progressPercent?: number | null;
}

export const CertificateTab = ({
  courseId,
  isEnrolled = false,
}: CertificateTabProps): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CertificateData>({ hasCompleted: false });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/courses/${courseId}/certificate`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load certificate information');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const formattedDate = useMemo(() => {
    if (!data.completionDateISO) return 'Completion Date';
    try {
      return new Date(data.completionDateISO).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Completion Date';
    }
  }, [data.completionDateISO]);

  const handleDownloadPDF = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Certificate - ${data.courseTitle || 'Course'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', serif; padding: 40px; background: #fff; }
          .certificate {
            max-width: 800px;
            margin: 0 auto;
            border: 8px solid #d97706;
            padding: 60px;
            position: relative;
            background: linear-gradient(to bottom, #fffbeb 0%, #ffffff 100%);
          }
          .corner {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 4px solid #d97706;
          }
          .tl { top: 20px; left: 20px; border-bottom: none; border-right: none; }
          .tr { top: 20px; right: 20px; border-bottom: none; border-left: none; }
          .bl { bottom: 20px; left: 20px; border-top: none; border-right: none; }
          .br { bottom: 20px; right: 20px; border-top: none; border-left: none; }
          .header { text-align: center; margin-bottom: 40px; }
          .title { font-size: 36px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .subtitle { font-size: 18px; color: #6b7280; margin-bottom: 30px; }
          .presented { font-size: 16px; color: #6b7280; margin-bottom: 10px; }
          .name {
            font-size: 42px;
            font-weight: bold;
            color: #d97706;
            margin: 20px 0 30px;
            border-bottom: 2px solid #d97706;
            padding-bottom: 10px;
          }
          .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #9ca3af; }
          .id { margin-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>

          <div class="header">
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">${data.courseTitle || 'Course Title'}</div>
          </div>

          <div style="text-align: center;">
            <div class="presented">This certifies that</div>
            <div class="name">${data.studentName || 'Student Name'}</div>
            <div class="presented">has successfully completed the course</div>
          </div>

          <div class="footer">
            <div>${formattedDate}</div>
            ${data.certificateId ? `<div class="id">Certificate ID: ${data.certificateId}</div>` : ''}
            ${data.verificationUrl ? `<div class="id">Verify at: ${data.verificationUrl}</div>` : ''}
          </div>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 100);
        </script>
      </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const handleShare = async () => {
    if (data.verificationUrl && navigator.share) {
      try {
        await navigator.share({
          title: `Certificate - ${data.courseTitle}`,
          text: `I've completed ${data.courseTitle}!`,
          url: data.verificationUrl,
        });
      } catch {}
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Award className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Course Certificate
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {data.hasCompleted
            ? 'Congratulations! You&apos;ve earned your certificate'
            : 'Complete all requirements to earn your certificate'}
        </p>
      </div>

      {/* Certificate Preview */}
      <div className="bg-white dark:bg-slate-900 border-4 border-amber-500 dark:border-amber-600 rounded-xl p-12 relative shadow-xl">
        {/* Decorative Corners */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-400 dark:border-amber-500" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-400 dark:border-amber-500" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-400 dark:border-amber-500" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-400 dark:border-amber-500" />

        <div className="text-center space-y-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Certificate of Completion
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.courseTitle || 'Course Title'}
            </h3>
          </div>

          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              This certifies that
            </p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">
              {data.studentName || 'Student Name'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              has successfully completed the course
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>

          {data.certificateId && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Certificate ID: {data.certificateId}
            </p>
          )}

          {data.verificationUrl && (
            <div className="pt-4">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.verificationUrl)}`}
                alt="Verification QR Code"
                width={100}
                height={100}
                className="mx-auto rounded border border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Scan to verify
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {data.hasCompleted ? (
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          {data.verificationUrl && (
            <>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>

              <a
                href={data.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Verify
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="text-center space-y-4">
          {typeof data.progressPercent === 'number' && (
            <div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span>Course Progress</span>
                <span>{Math.round(data.progressPercent)}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${data.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <a
            href={`/courses/${courseId}?tab=content`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue Learning
          </a>
        </div>
      )}

      {/* Requirements */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Certificate Requirements
        </h3>

        <div className="space-y-4">
          {[
            'Complete all course chapters',
            'Pass all quizzes with 70% or higher',
            'Complete the final project',
            'Achieve 100% course progress',
          ].map((requirement, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-slate-700 dark:text-slate-300">{requirement}</p>
            </div>
          ))}
        </div>

        {!isEnrolled && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> Enroll in this course to start working towards your certificate.
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Certificate Features
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-1">
                Downloadable PDF
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Download in high-quality PDF format
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-1">
                Verified
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Unique ID with QR code verification
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-1">
                Shareable
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Share on LinkedIn, resume, or portfolio
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-1">
                Lifetime Access
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Access your certificate anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
