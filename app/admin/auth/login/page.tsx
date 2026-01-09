import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { AdminLoginBackground } from "@/components/auth/admin-login-background";
import { Suspense } from "react";
import { Metadata } from "next";
import { Shield, Lock, Eye, FileCheck, Server, Fingerprint } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Login - Taxomind",
  description: "Secure administrator authentication portal",
};

const SecurityFeature = ({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: string;
}) => (
  <div
    className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all duration-500 animate-fade-in-up"
    style={{ animationDelay: delay }}
  >
    <div className="relative flex-shrink-0">
      <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md group-hover:bg-emerald-500/30 transition-all duration-500" />
      <div className="relative p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30 group-hover:border-emerald-400/50 transition-all duration-300">
        <Icon className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

const ComplianceBadge = ({
  label,
  delay,
}: {
  label: string;
  delay: string;
}) => (
  <div
    className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 animate-fade-in"
    style={{ animationDelay: delay }}
  >
    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
    <span className="text-xs font-medium text-slate-300">{label}</span>
  </div>
);

const AdminLoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <AdminLoginBackground />

      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-7xl">
          <div className="mx-auto max-w-6xl">
            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Panel - Security Information */}
              <div className="hidden lg:block space-y-8 animate-fade-in">
                {/* Logo & Title */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-xl animate-pulse" />
                      <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl shadow-emerald-500/20">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />
                    <span className="text-xs font-semibold tracking-[0.2em] text-emerald-400 uppercase">
                      Secure Portal
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-4xl xl:text-5xl font-bold tracking-tight">
                      <span className="text-white">Taxomind</span>
                      <br />
                      <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        Admin Console
                      </span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-md">
                      Enterprise-grade security for privileged access. All sessions are encrypted,
                      monitored, and protected with multi-factor authentication.
                    </p>
                  </div>
                </div>

                {/* Security Features */}
                <div className="space-y-3">
                  <SecurityFeature
                    icon={Fingerprint}
                    title="Multi-Factor Authentication"
                    description="Hardware keys, TOTP, and biometric verification supported"
                    delay="0.1s"
                  />
                  <SecurityFeature
                    icon={Eye}
                    title="Real-Time Threat Monitoring"
                    description="AI-powered anomaly detection with instant alerts"
                    delay="0.2s"
                  />
                  <SecurityFeature
                    icon={Lock}
                    title="Zero-Trust Architecture"
                    description="Every request verified with role-based access control"
                    delay="0.3s"
                  />
                  <SecurityFeature
                    icon={FileCheck}
                    title="Comprehensive Audit Logs"
                    description="Immutable records of all administrative actions"
                    delay="0.4s"
                  />
                </div>

                {/* Compliance Badges */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Compliance & Certifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ComplianceBadge label="SOC 2 Type II" delay="0.5s" />
                    <ComplianceBadge label="ISO 27001" delay="0.55s" />
                    <ComplianceBadge label="GDPR" delay="0.6s" />
                    <ComplianceBadge label="HIPAA" delay="0.65s" />
                  </div>
                </div>

                {/* Infrastructure Status */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-slate-800/30 rounded-xl border border-slate-700/50 animate-fade-in"
                  style={{ animationDelay: "0.7s" }}
                >
                  <Server className="w-4 h-4 text-emerald-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-400">
                      All systems operational
                    </span>
                  </div>
                  <div className="ml-auto text-xs text-slate-500">
                    99.99% uptime
                  </div>
                </div>
              </div>

              {/* Right Panel - Login Form */}
              <div id="main-content" className="flex items-center justify-center">
                <div className="w-full max-w-md">
                  <Suspense
                    fallback={
                      <div className="p-12 text-center bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50">
                        <div className="relative w-12 h-12 mx-auto">
                          <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full" />
                          <div className="absolute inset-0 border-2 border-transparent border-t-emerald-500 rounded-full animate-spin" />
                        </div>
                        <p className="mt-4 text-sm text-slate-400">
                          Initializing secure connection...
                        </p>
                      </div>
                    }
                  >
                    <AdminLoginForm />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center lg:text-left animate-fade-in" style={{ animationDelay: "0.8s" }}>
              <p className="text-xs text-slate-500">
                Protected by enterprise-grade encryption. Unauthorized access attempts are logged and reported.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
