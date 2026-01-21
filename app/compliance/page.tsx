import { Metadata } from "next";
import { Shield, FileCheck, Globe, Lock, CheckCircle2, Download, BadgeCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compliance | Taxomind",
  description: "Learn about Taxomind's compliance certifications, data protection practices, and regulatory adherence.",
};

const certifications = [
  {
    name: "SOC 2 Type II",
    status: "Certified",
    description: "Independent audit of security, availability, and confidentiality controls",
    icon: Shield,
  },
  {
    name: "GDPR",
    status: "Compliant",
    description: "Full compliance with EU General Data Protection Regulation",
    icon: Globe,
  },
  {
    name: "CCPA",
    status: "Compliant",
    description: "California Consumer Privacy Act compliance for US users",
    icon: FileCheck,
  },
  {
    name: "ISO 27001",
    status: "In Progress",
    description: "International standard for information security management",
    icon: BadgeCheck,
  },
  {
    name: "HIPAA",
    status: "Available",
    description: "Healthcare data compliance available for enterprise customers",
    icon: Lock,
  },
  {
    name: "FERPA",
    status: "Compliant",
    description: "Family Educational Rights and Privacy Act compliance",
    icon: FileCheck,
  },
];

const practices = [
  {
    title: "Data Encryption",
    description: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Encryption keys are managed using industry-standard key management services.",
  },
  {
    title: "Access Control",
    description: "Role-based access control with principle of least privilege. Multi-factor authentication required for all internal systems.",
  },
  {
    title: "Data Retention",
    description: "Clear data retention policies with automatic purging. Users can request data deletion at any time.",
  },
  {
    title: "Vendor Management",
    description: "All third-party vendors undergo security assessments. We maintain a limited number of sub-processors.",
  },
  {
    title: "Incident Response",
    description: "24/7 security monitoring with documented incident response procedures. Customers notified within 72 hours of any breach.",
  },
  {
    title: "Employee Training",
    description: "All employees complete annual security awareness training. Background checks required for all staff with data access.",
  },
];

const subProcessors = [
  { name: "Amazon Web Services", purpose: "Cloud Infrastructure", location: "United States" },
  { name: "Stripe", purpose: "Payment Processing", location: "United States" },
  { name: "OpenAI", purpose: "AI Processing", location: "United States" },
  { name: "Anthropic", purpose: "AI Processing", location: "United States" },
  { name: "Vercel", purpose: "Application Hosting", location: "United States" },
  { name: "Neon", purpose: "Database Hosting", location: "United States" },
];

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Compliance &amp; Trust
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Enterprise-Grade Compliance
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8">
              We maintain the highest standards of security and compliance to protect your data and meet regulatory requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#certifications"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                View Certifications
              </a>
              <Link
                href="/security"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Security Overview
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section id="certifications" className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Certifications &amp; Standards
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              We maintain compliance with major security standards and regulations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <cert.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {cert.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practices */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Security Practices
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              How we protect your data every day
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {practices.map((practice) => (
              <div
                key={practice.title}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {practice.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {practice.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-processors */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Sub-Processors
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Third-party services that process data on our behalf
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 font-semibold text-slate-900 dark:text-white text-sm">
                <div>Service</div>
                <div>Purpose</div>
                <div>Location</div>
              </div>
              {subProcessors.map((processor, index) => (
                <div
                  key={processor.name}
                  className={`grid grid-cols-3 gap-4 p-4 text-sm ${
                    index !== subProcessors.length - 1 ? "border-b border-slate-200 dark:border-slate-700" : ""
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-white">{processor.name}</div>
                  <div className="text-slate-600 dark:text-slate-400">{processor.purpose}</div>
                  <div className="text-slate-600 dark:text-slate-400">{processor.location}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DPA */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Data Processing Agreement
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Enterprise customers can request our standard Data Processing Agreement (DPA) for GDPR and other regulatory compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download DPA
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Request Custom DPA
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Compliance Questions?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Our security and compliance team is available to answer your questions and provide documentation.
            </p>
            <a
              href="mailto:compliance@taxomind.com"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              compliance@taxomind.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
