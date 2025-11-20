import { AdminResetForm } from "@/components/auth/admin-reset-form";
import { Suspense } from "react";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Admin Password Reset - Taxomind",
  description: "Secure administrator password recovery portal",
};

const AdminResetPage = () => {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Background - Analytics Page Style with Gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700" />

      {/* Page content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Main container with glassmorphism */}
        <div className="w-full max-w-7xl">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Brand / Info panel - Glassmorphism card */}
              <div className="hidden lg:flex relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-10">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-400/5 to-transparent dark:from-blue-500/10 dark:via-indigo-500/10" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center space-y-8">
                  {/* Header with icon */}
                  <div className="space-y-4">
                    <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-md">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      Password Recovery
                    </h1>

                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                      Secure password reset for administrators. We&apos;ll send a verification link to your registered email address.
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 group">
                      <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-colors duration-200">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Secure email verification</span>
                    </div>

                    <div className="flex items-center gap-3 group">
                      <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/30 transition-colors duration-200">
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Time-limited reset tokens</span>
                    </div>

                    <div className="flex items-center gap-3 group">
                      <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg group-hover:bg-purple-500/20 dark:group-hover:bg-purple-500/30 transition-colors duration-200">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Complete audit trail logging</span>
                    </div>
                  </div>

                  {/* Security badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/50 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enterprise Security Certified</span>
                  </div>
                </div>
              </div>

              {/* Reset form card */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md">
                  <Suspense fallback={
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading admin password reset...</p>
                    </div>
                  }>
                    <AdminResetForm />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminResetPage;
