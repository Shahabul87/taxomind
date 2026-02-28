import { Metadata } from "next";
import { Map, CheckCircle2, Clock, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Roadmap | Taxomind",
  description: "See what we're building next. Our public roadmap shows planned features and recent releases.",
};

const completed = [
  {
    title: "AI Course Generation",
    description: "Generate complete course outlines and content using AI",
    date: "January 2026",
  },
  {
    title: "Real-time Collaboration",
    description: "Collaborate on course creation with team members",
    date: "December 2025",
  },
  {
    title: "Advanced Analytics Dashboard",
    description: "Comprehensive insights into learner engagement and progress",
    date: "November 2025",
  },
  {
    title: "Mobile App (iOS & Android)",
    description: "Native mobile apps for learning on the go",
    date: "October 2025",
  },
];

const inProgress = [
  {
    title: "AI Tutor 2.0",
    description: "Enhanced AI tutoring with context-aware explanations and adaptive questioning",
    progress: 75,
  },
  {
    title: "Learning Paths",
    description: "Curated learning paths with skill mapping and career recommendations",
    progress: 60,
  },
  {
    title: "Enterprise SSO",
    description: "SAML and OIDC support for enterprise single sign-on",
    progress: 85,
  },
  {
    title: "Certification System",
    description: "Issue and verify digital certificates and badges",
    progress: 40,
  },
];

const planned = [
  {
    title: "Live Streaming",
    description: "Built-in live streaming for webinars and live classes",
    quarter: "Q2 2026",
  },
  {
    title: "AR/VR Learning",
    description: "Immersive learning experiences with AR and VR support",
    quarter: "Q3 2026",
  },
  {
    title: "Peer Review System",
    description: "Structured peer review for assignments and projects",
    quarter: "Q2 2026",
  },
  {
    title: "AI Voice Assistant",
    description: "Voice-based interaction with the AI tutor",
    quarter: "Q3 2026",
  },
  {
    title: "White-label Solution",
    description: "Fully customizable branded experience for enterprises",
    quarter: "Q4 2026",
  },
  {
    title: "Offline Mode",
    description: "Download courses for offline learning",
    quarter: "Q2 2026",
  },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-sm font-medium mb-6">
              <Map className="h-4 w-4" />
              Product Roadmap
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              See What&apos;s Next
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8">
              Our public roadmap shows what we&apos;re working on and what&apos;s planned. Have a feature request? Let us know!
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Request a Feature
            </Link>
          </div>
        </div>
      </section>

      {/* In Progress */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                In Progress
              </h2>
            </div>
            <div className="space-y-6">
              {inProgress.map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {item.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Planned */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Planned
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {planned.map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">
                      {item.quarter}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Completed */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Recently Shipped
              </h2>
            </div>
            <div className="space-y-4">
              {completed.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Have a Feature Idea?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              We&apos;re always looking to improve. Share your ideas and help shape the future of Taxomind.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Submit Feedback
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
