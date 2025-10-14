import { Metadata } from 'next';
import { Mail, ArrowRight, RefreshCw, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Check Your Email - Taxomind',
  description: 'Verify your email address to complete registration',
};

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8 border border-gray-100 dark:border-slate-700">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-cyan-400 to-purple-500 p-4 rounded-full">
              <Mail className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Check Your Email
          </h1>

          {/* Description */}
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6 text-lg">
            We&apos;ve sent a verification email to your inbox. Please click the link in the email to verify your account.
          </p>

          {/* Steps */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 mb-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-sm font-semibold flex-shrink-0 mt-0.5">
                1
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Check your email inbox (and spam folder)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-semibold flex-shrink-0 mt-0.5">
                2
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Click the verification link in the email
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-sm font-semibold flex-shrink-0 mt-0.5">
                3
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Complete verification and start learning!
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                  Didn&apos;t receive the email?
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Check your spam folder or wait a few minutes. The email should arrive shortly.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl h-12 font-medium transition-all shadow-lg hover:shadow-xl"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/register"
              className="flex items-center justify-center gap-2 w-full border-2 border-gray-200 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-400 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-xl h-12 font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Register Again
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6">
            The verification link will expire in 1 hour
          </p>
        </div>

        {/* Bottom Link */}
        <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
          Need help?{' '}
          <Link
            href="/support"
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
