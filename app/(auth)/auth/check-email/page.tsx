import { Metadata } from 'next';
import { Mail, ArrowRight, RefreshCw, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Check Your Email - Taxomind',
  description: 'Verify your email address to complete registration',
};

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 dark:bg-slate-900/95 dark:backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700/50">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-full">
              <Mail className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-4">
            Check Your Email
          </h1>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-6 text-lg">
            We&apos;ve sent a verification email to your inbox. Please click the link in the email to verify your account.
          </p>

          {/* Steps */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-sm font-semibold flex-shrink-0 mt-0.5">
                1
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Check your email inbox (and spam folder)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0 mt-0.5">
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
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium mb-1">
                  Didn&apos;t receive the email?
                </p>
                <p className="text-xs text-muted-foreground">
                  Check your spam folder or wait a few minutes. The email should arrive shortly.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-medium transition-all shadow-lg hover:shadow-xl"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/register"
              className="flex items-center justify-center gap-2 w-full border border-slate-200 dark:border-slate-700/50 hover:border-purple-500 text-foreground hover:text-purple-500 rounded-xl h-12 font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Register Again
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-center text-muted-foreground text-xs mt-6">
            The verification link will expire in 1 hour
          </p>
        </div>

        {/* Bottom Link */}
        <p className="text-center text-muted-foreground mt-6">
          Need help?{' '}
          <Link
            href="/support"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
