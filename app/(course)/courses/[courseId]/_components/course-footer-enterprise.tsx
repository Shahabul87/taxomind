"use client";

import React from "react";
import Link from "next/link";

export const CourseFooterEnterprise: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-200/70 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md" role="contentinfo" aria-label="Course Footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top section: brand + controls */}
        <div className="py-8 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Taxomind
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Intelligent learning for teams and individuals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="course-footer-language">Language</label>
            <select id="course-footer-language" className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm">
              <option>English</option>
              <option>Deutsch</option>
              <option>Español</option>
              <option>Français</option>
            </select>
            <label className="sr-only" htmlFor="course-footer-currency">Currency</label>
            <select id="course-footer-currency" className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>INR</option>
            </select>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 py-6">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/features">Features</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/pricing">Pricing</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/integrations">Integrations</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/roadmap">Roadmap</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Solutions</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/solutions">Teams</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/solutions">Enterprise</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/become-instructor">Instructors</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/intelligent-lms/overview">Intelligent LMS</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Resources</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/docs">Documentation</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/blog">Blog</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/support">Help Center</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/status">System Status</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/about">About</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/careers">Careers</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/contact">Contact</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/press">Press</Link></li>
            </ul>
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Legal</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/legal/privacy">Privacy</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/legal/terms">Terms</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/security">Security</Link></li>
              <li><Link className="hover:text-slate-900 dark:hover:text-white" href="/compliance">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="py-6 border-t border-slate-200/70 dark:border-slate-800">
          <div className="grid md:grid-cols-3 gap-6 md:items-center">
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Stay in the loop</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Get product updates, early access, and curated learning resources.</p>
            </div>
            <form
              className="flex w-full items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); /* no-op */ }}
              aria-label="Subscribe to newsletter"
            >
              <label className="sr-only" htmlFor="newsletter-email">Email</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              />
              <button
                type="submit"
                className="rounded-md bg-slate-900 dark:bg-purple-600 text-white text-sm font-semibold px-4 py-2 hover:bg-black dark:hover:bg-purple-700 active:bg-slate-800 dark:active:bg-purple-800"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()} Taxomind Inc. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link className="hover:text-slate-900 dark:hover:text-white" href="/legal/terms">Terms</Link>
            <Link className="hover:text-slate-900 dark:hover:text-white" href="/legal/privacy">Privacy</Link>
            <Link className="hover:text-slate-900 dark:hover:text-white" href="/security">Security</Link>
            <Link className="hover:text-slate-900 dark:hover:text-white" href="/status">Status</Link>
            <span className="text-slate-400">SLA 99.9% uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

