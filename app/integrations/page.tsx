import { Metadata } from "next";
import { Puzzle, Check, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integrations | Taxomind",
  description: "Connect Taxomind with your favorite tools and workflows. Explore our growing ecosystem of integrations.",
};

const integrations = [
  {
    name: "Slack",
    category: "Communication",
    description: "Get learning updates and notifications directly in your Slack channels.",
    logo: "💬",
    status: "available",
  },
  {
    name: "Microsoft Teams",
    category: "Communication",
    description: "Seamlessly integrate with Microsoft Teams for enterprise collaboration.",
    logo: "👥",
    status: "available",
  },
  {
    name: "Zoom",
    category: "Video",
    description: "Host live sessions and webinars integrated with your courses.",
    logo: "📹",
    status: "available",
  },
  {
    name: "Google Workspace",
    category: "Productivity",
    description: "Single sign-on and integration with Google Drive, Docs, and Calendar.",
    logo: "🔷",
    status: "available",
  },
  {
    name: "Notion",
    category: "Productivity",
    description: "Sync your learning content and notes with Notion workspaces.",
    logo: "📝",
    status: "available",
  },
  {
    name: "Zapier",
    category: "Automation",
    description: "Connect Taxomind to 5,000+ apps with automated workflows.",
    logo: "⚡",
    status: "available",
  },
  {
    name: "Salesforce",
    category: "CRM",
    description: "Track learner engagement and sync with your CRM data.",
    logo: "☁️",
    status: "available",
  },
  {
    name: "HubSpot",
    category: "CRM",
    description: "Integrate learning journeys with your marketing automation.",
    logo: "🧡",
    status: "available",
  },
  {
    name: "GitHub",
    category: "Developer",
    description: "Sync code repositories and track technical learning progress.",
    logo: "🐙",
    status: "coming_soon",
  },
  {
    name: "Jira",
    category: "Project Management",
    description: "Connect learning milestones with your project workflows.",
    logo: "🔵",
    status: "coming_soon",
  },
  {
    name: "Workday",
    category: "HR",
    description: "Integrate with HR systems for employee development tracking.",
    logo: "📊",
    status: "coming_soon",
  },
  {
    name: "Canvas LMS",
    category: "LMS",
    description: "Migrate content from Canvas or use alongside existing infrastructure.",
    logo: "🎓",
    status: "coming_soon",
  },
];

const categories = ["All", "Communication", "Video", "Productivity", "Automation", "CRM", "Developer", "HR"];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-6">
              <Puzzle className="h-4 w-4" />
              Integrations
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Connect Your Workflow
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8">
              Integrate Taxomind with the tools you already use. Our growing ecosystem makes learning seamless across your organization.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  cat === "All"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{integration.logo}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {integration.name}
                      </h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {integration.category}
                      </span>
                    </div>
                  </div>
                  {integration.status === "available" ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Available
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  {integration.description}
                </p>
                {integration.status === "available" ? (
                  <Link
                    href="#"
                    className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:underline"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <button className="inline-flex items-center text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed">
                    Notify me
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Build Custom Integrations
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Use our REST API and webhooks to build custom integrations for your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                View API Docs
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Request Integration
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
