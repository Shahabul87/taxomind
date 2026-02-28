import { Metadata } from "next";
import { Briefcase, MapPin, Clock, Users, Heart, Zap, Globe, Coffee, GraduationCap, Plane } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Careers | Taxomind",
  description: "Join the Taxomind team and help shape the future of AI-powered education.",
};

const benefits = [
  { icon: Heart, title: "Health Insurance", description: "Comprehensive medical, dental, and vision coverage" },
  { icon: Plane, title: "Unlimited PTO", description: "Take the time you need to recharge" },
  { icon: Globe, title: "Remote First", description: "Work from anywhere in the world" },
  { icon: GraduationCap, title: "Learning Budget", description: "$2,000 annual learning and development stipend" },
  { icon: Coffee, title: "Home Office", description: "$1,000 to set up your ideal workspace" },
  { icon: Users, title: "Team Retreats", description: "Annual company-wide gatherings" },
];

const openings = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Machine Learning Engineer",
    department: "AI/ML",
    location: "San Francisco / Remote",
    type: "Full-time",
  },
  {
    title: "Customer Success Manager",
    department: "Customer Success",
    location: "Remote (US)",
    type: "Full-time",
  },
  {
    title: "Content Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
];

const values = [
  {
    title: "Learn Continuously",
    description: "We believe in constant growth and encourage everyone to keep learning.",
  },
  {
    title: "Move Fast",
    description: "We ship early, iterate often, and aren't afraid to take calculated risks.",
  },
  {
    title: "Put Users First",
    description: "Every decision we make starts with understanding our users' needs.",
  },
  {
    title: "Be Transparent",
    description: "We share information openly and communicate honestly.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium mb-6">
              <Briefcase className="h-4 w-4" />
              We&apos;re Hiring
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Build the Future of Learning
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8">
              Join our mission to democratize education through AI. We&apos;re looking for passionate people who want to make a difference.
            </p>
            <a
              href="#openings"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
            >
              View Open Positions
            </a>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              These principles guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Benefits &amp; Perks
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              We take care of our team so they can focus on doing their best work
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="openings" className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Open Positions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Find your next opportunity with us
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {openings.map((job) => (
              <div
                key={job.title}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/careers/${job.title.toLowerCase().replace(/\s+/g, "-")}`}
                    className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Don&apos;t See a Fit?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              We&apos;re always looking for talented people. Send us your resume and we&apos;ll keep you in mind for future opportunities.
            </p>
            <a
              href="mailto:careers@taxomind.com"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Send Your Resume
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
