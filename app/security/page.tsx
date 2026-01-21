import { Metadata } from "next";
import { Shield, Lock, Eye, Server, CheckCircle2, BadgeCheck, FileKey2, RefreshCcw } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security | Taxomind",
  description: "Learn about Taxomind's enterprise-grade security measures, data protection, and compliance certifications.",
};

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
  },
  {
    icon: Shield,
    title: "SOC 2 Type II Compliant",
    description: "We maintain SOC 2 Type II compliance, audited annually by independent third parties.",
  },
  {
    icon: Eye,
    title: "Privacy by Design",
    description: "Built with GDPR and CCPA compliance in mind. Your data privacy is our priority.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Hosted on AWS with multi-region redundancy, DDoS protection, and 24/7 monitoring.",
  },
  {
    icon: FileKey2,
    title: "Access Controls",
    description: "Role-based access control (RBAC), SSO integration, and multi-factor authentication.",
  },
  {
    icon: RefreshCcw,
    title: "Regular Audits",
    description: "Continuous security assessments, penetration testing, and vulnerability scanning.",
  },
];

const certifications = [
  { name: "SOC 2 Type II", status: "Certified" },
  { name: "GDPR", status: "Compliant" },
  { name: "CCPA", status: "Compliant" },
  { name: "ISO 27001", status: "In Progress" },
  { name: "HIPAA", status: "Available" },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Enterprise Security
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Security You Can Trust
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8">
              We take security seriously. Your data is protected by industry-leading security measures and compliance certifications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                Contact Security Team
              </Link>
              <Link
                href="/compliance"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                View Compliance
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Comprehensive Security
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Multiple layers of protection to keep your data safe
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Certifications &amp; Compliance
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              We maintain the highest standards of security compliance
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {certifications.map((cert, index) => (
                <div
                  key={cert.name}
                  className={`flex items-center justify-between p-4 ${
                    index !== certifications.length - 1 ? "border-b border-slate-200 dark:border-slate-700" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-slate-900 dark:text-white">{cert.name}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cert.status === "Certified" || cert.status === "Compliant"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : cert.status === "In Progress"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {cert.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Report Vulnerability */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Report a Vulnerability
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              We appreciate security researchers who help keep Taxomind safe. If you discover a vulnerability, please report it responsibly.
            </p>
            <Link
              href="mailto:security@taxomind.com"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              security@taxomind.com
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
