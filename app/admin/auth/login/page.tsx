import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Suspense } from "react";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Admin Login - Taxomind",
  description: "Secure administrator authentication portal",
};

const AdminLoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Background - Optimized for performance */}
      <div className="fixed inset-0 -z-10 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Grid pattern overlay - minimal performance impact */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10"></div>
      </div>

      {/* Page content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Dark mode container box */}
        <div className="w-full max-w-7xl dark:bg-slate-800/80 dark:rounded-3xl dark:p-8 dark:shadow-2xl dark:border dark:border-slate-700/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
            {/* Top actions intentionally empty to avoid duplicate theme toggle */}

            {/* Split layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Brand / Info panel */}
              <div className="hidden md:flex relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-700/50 p-8 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-400/5 to-transparent dark:from-red-500/10 dark:via-orange-500/10" />
                <div className="relative z-10 flex flex-col justify-center">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                    Taxomind Admin
                  </h1>
                  <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300">
                    Secure access for administrators. All sign-ins are monitored and protected with MFA.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Role-based access</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Session integrity checks</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Detailed audit logs</li>
                  </ul>
                </div>
              </div>

              {/* Login form card */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md">
                  <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading admin authentication...</div>}>
                    <AdminLoginForm />
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

export default AdminLoginPage;
