import { Metadata } from "next";
import { Download, ExternalLink, Mail, Calendar, Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Press | Taxomind",
  description: "Press resources, media kit, and latest news about Taxomind.",
};

const pressReleases = [
  {
    date: "January 15, 2026",
    title: "Taxomind Raises $25M Series B to Expand AI-Powered Learning Platform",
    excerpt: "Funding will accelerate product development and global expansion.",
  },
  {
    date: "December 1, 2025",
    title: "Taxomind Reaches 1 Million Active Learners Milestone",
    excerpt: "Platform growth accelerates as demand for AI-powered education surges.",
  },
  {
    date: "October 20, 2025",
    title: "Taxomind Launches Enterprise Solution for Corporate Training",
    excerpt: "New enterprise tier enables organizations to deploy custom AI tutors.",
  },
  {
    date: "August 5, 2025",
    title: "Taxomind Partners with Top Universities for Course Content",
    excerpt: "Strategic partnerships bring world-class curriculum to the platform.",
  },
];

const mediaFeatures = [
  { outlet: "TechCrunch", title: "The Future of AI in Education" },
  { outlet: "Forbes", title: "50 AI Companies to Watch in 2026" },
  { outlet: "Wired", title: "How Taxomind is Personalizing Learning" },
  { outlet: "The Verge", title: "AI Tutors That Actually Work" },
];

const stats = [
  { value: "1M+", label: "Active Learners" },
  { value: "50K+", label: "Courses Created" },
  { value: "100+", label: "Countries" },
  { value: "4.8★", label: "Average Rating" },
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium mb-6">
              <Newspaper className="h-4 w-4" />
              Press &amp; Media
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Taxomind Newsroom
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8">
              Get the latest news, press releases, and media resources about Taxomind.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#media-kit"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Media Kit
              </a>
              <a
                href="mailto:press@taxomind.com"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Media Inquiries
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Press Releases
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {pressReleases.map((release) => (
              <div
                key={release.title}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <Calendar className="h-4 w-4" />
                  {release.date}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {release.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {release.excerpt}
                </p>
                <Link
                  href="#"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Read More
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Features */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Featured In
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {mediaFeatures.map((feature) => (
              <div
                key={feature.outlet}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center"
              >
                <div className="text-2xl font-bold text-slate-400 dark:text-slate-500 mb-3">
                  {feature.outlet}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {feature.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section id="media-kit" className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Media Kit
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Download our brand assets, logos, and product screenshots for your coverage.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <a
                href="#"
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">🎨</div>
                <div className="font-medium text-slate-900 dark:text-white">Logos</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">SVG, PNG</div>
              </a>
              <a
                href="#"
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">📸</div>
                <div className="font-medium text-slate-900 dark:text-white">Screenshots</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">High-res</div>
              </a>
              <a
                href="#"
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">📄</div>
                <div className="font-medium text-slate-900 dark:text-white">Fact Sheet</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">PDF</div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Media Contact
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              For press inquiries, interviews, or additional information, please contact our communications team.
            </p>
            <a
              href="mailto:press@taxomind.com"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              press@taxomind.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
