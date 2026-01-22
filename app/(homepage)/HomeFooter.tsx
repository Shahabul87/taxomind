"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  ArrowRight,
  ArrowUp,
  Mail,
  MapPin,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ============================================
// Configuration
// ============================================

const COMPANY_INFO = {
  name: "TaxoMind",
  tagline: "Transform your learning journey with AI-powered education. Where minds are forged through intelligent, adaptive learning experiences.",
  email: "hello@taxomind.com",
  address: "San Francisco, CA",
  foundedYear: 2024,
};

const SOCIAL_LINKS = {
  twitter: "https://twitter.com/TaxoMind",
  github: "https://github.com/TaxoMind",
  linkedin: "https://www.linkedin.com/company/taxomind",
  discord: "https://discord.gg/X8bRJmkE",
  youtube: "https://youtube.com/@taxomind",
  tiktok: "https://www.tiktok.com/@taxomind",
  instagram: "https://instagram.com/taxomind.app",
};

const QUICK_LINKS = [
  { label: "Courses", href: "/courses" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/blog" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "API", href: "/docs" },
];

const RESOURCE_LINKS = [
  { label: "Documentation", href: "/docs" },
  { label: "Support", href: "/support" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Security", href: "/security" },
  { label: "Status", href: "/status" },
];

const LEGAL_LINKS = [
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Security", href: "/security" },
  { label: "Accessibility", href: "/accessibility" },
];

// Trust badges for enterprise credibility
const TRUST_BADGES = [
  { label: "GDPR Compliant", icon: Shield },
  { label: "SOC 2 Type II", icon: CheckCircle2 },
  { label: "256-bit Encryption", icon: Shield },
];

// ============================================
// Newsletter Form Component
// ============================================

interface NewsletterFormProps {
  variant?: "default" | "compact";
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({ variant = "default" }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error?.message || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }, [email]);

  return (
    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
      <label htmlFor="footer-newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="relative">
        <input
          id="footer-newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Enter your email"
          autoComplete="email"
          disabled={status === "loading" || status === "success"}
          className={`w-full bg-white/60 dark:bg-slate-800/50 border text-slate-700 dark:text-gray-300 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base transition-colors ${
            status === "error"
              ? "border-red-400 dark:border-red-500"
              : status === "success"
              ? "border-green-400 dark:border-green-500"
              : "border-slate-200 dark:border-slate-700"
          }`}
          aria-describedby="newsletter-status"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-4 py-2.5 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all duration-300 text-sm sm:text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        aria-label="Subscribe to newsletter"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Subscribing...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Subscribed!
          </>
        ) : (
          "Subscribe"
        )}
      </button>

      {/* Status message */}
      {(status === "error" || status === "success") && (
        <div
          id="newsletter-status"
          className={`flex items-center gap-1.5 text-xs sm:text-sm ${
            status === "error" ? "text-red-500" : "text-green-500"
          }`}
          role="alert"
        >
          {status === "error" ? (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-500">
        By subscribing, you agree to our{" "}
        <Link href="/legal/privacy" className="underline hover:text-purple-500 transition-colors">
          Privacy Policy
        </Link>{" "}
        and consent to receive updates.
      </p>
    </form>
  );
};

// ============================================
// Back to Top Button
// ============================================

const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isVisible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5" />
    </motion.button>
  );
};

// ============================================
// Main Footer Component
// ============================================

export const HomeFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Call to Action Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden bg-white dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900">
        {/* Angled divider at top */}
        <div
          className="absolute top-0 left-0 w-full h-12 sm:h-16 bg-slate-800"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 0)" }}
          aria-hidden="true"
        />

        {/* Glowing orbs */}
        <div
          className="absolute -top-40 -right-20 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[64px] sm:blur-[96px] md:blur-[128px] opacity-15 sm:opacity-20"
          aria-hidden="true"
        />
        <div
          className="absolute top-[30%] -left-20 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[64px] sm:blur-[96px] md:blur-[128px] opacity-15 sm:opacity-20"
          aria-hidden="true"
        />

        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-4 sm:mb-6 inline-block"
            >
              <span className="inline-block py-1.5 px-3 sm:py-2 sm:px-4 rounded-full text-xs sm:text-sm font-medium border dark:bg-slate-800/60 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/20">
                Join Our Community
              </span>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4 sm:mb-6 px-2 sm:px-0">
              Start Your Learning Journey Today
            </h2>
            <p className="text-slate-600 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
              Join thousands of learners who have already transformed their careers through our platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 items-stretch sm:items-center relative z-20 mt-6 sm:mt-8">
              <Link href="/auth/register" className="relative z-20 w-full sm:w-auto">
                <motion.span
                  className="inline-flex w-full sm:w-auto items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 0 }}
                >
                  <span className="mr-2">Get Started Free</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.span>
              </Link>
              <Link href="/courses" className="relative z-20 w-full sm:w-auto">
                <motion.span
                  className="inline-flex w-full sm:w-auto items-center justify-center bg-transparent border-2 font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg transition-colors duration-300 text-cyan-700 border-cyan-300 hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-500 dark:hover:bg-cyan-500/10 text-sm sm:text-base"
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 0 }}
                >
                  View Courses
                </motion.span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Wave pattern at bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden" aria-hidden="true">
          <svg className="fill-slate-900" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </section>

      {/* Main Footer Section */}
      <footer
        className="bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-600 dark:text-gray-300 pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8 md:pb-10 relative overflow-hidden"
        role="contentinfo"
        aria-label="Site footer"
      >
        {/* Background effects */}
        <div
          className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[80px] sm:blur-[120px] md:blur-[150px] opacity-10"
          aria-hidden="true"
        />
        <div
          className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[80px] sm:blur-[120px] md:blur-[150px] opacity-10"
          aria-hidden="true"
        />

        <div className="container mx-auto px-4 sm:px-6 relative">
          {/* Footer Grid */}
          <div className="mb-10 sm:mb-12 md:mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {/* Brand Section */}
              <div className="space-y-4 sm:space-y-6">
                <Link href="/" className="flex items-center space-x-2 group">
                  <div className="relative">
                    <Image
                      src="/taxomind-logo.png"
                      alt="TaxoMind Logo"
                      width={32}
                      height={32}
                      className="rounded-lg group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {COMPANY_INFO.name}
                  </span>
                </Link>
                <p className="text-xs sm:text-sm leading-relaxed">
                  {COMPANY_INFO.tagline}
                </p>

                {/* Contact Info */}
                <div className="space-y-2">
                  <a
                    href={`mailto:${COMPANY_INFO.email}`}
                    className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {COMPANY_INFO.email}
                  </a>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {COMPANY_INFO.address}
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {/* Twitter/X */}
                  <motion.a
                    whileHover={{ y: -3 }}
                    href={SOCIAL_LINKS.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#1DA1F2] text-slate-600 dark:text-gray-400 hover:text-white transition-all duration-300 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                    aria-label="Follow us on Twitter"
                  >
                    <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                  {/* YouTube */}
                  <motion.a
                    whileHover={{ y: -3 }}
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#FF0000] text-slate-600 dark:text-gray-400 hover:text-white transition-all duration-300 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                    aria-label="Subscribe on YouTube"
                  >
                    <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                  {/* Instagram */}
                  <motion.a
                    whileHover={{ y: -3 }}
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] text-slate-600 dark:text-gray-400 hover:text-white transition-all duration-300 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                    aria-label="Follow us on Instagram"
                  >
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                  {/* TikTok */}
                  <motion.a
                    whileHover={{ y: -3 }}
                    href={SOCIAL_LINKS.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-black text-slate-600 dark:text-gray-400 hover:text-white transition-all duration-300 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                    aria-label="Follow us on TikTok"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </motion.a>
                  {/* LinkedIn */}
                  <motion.a
                    whileHover={{ y: -3 }}
                    href={SOCIAL_LINKS.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#0A66C2] text-slate-600 dark:text-gray-400 hover:text-white transition-all duration-300 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                    aria-label="Connect on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                  {/* GitHub */}
                  <motion.a
                    whileHover={{ y: -3 }}
                    href={SOCIAL_LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#333] text-slate-600 dark:text-gray-400 hover:text-white transition-all duration-300 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                    aria-label="View our GitHub"
                  >
                    <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                  {/* Discord */}
                  <motion.a
                    whileHover={{ y: -3 }}
                    href={SOCIAL_LINKS.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#5865F2] text-slate-600 dark:text-gray-400 hover:text-white transition-all duration-300 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
                    aria-label="Join our Discord"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.a>
                </div>
              </div>

              {/* Quick Links */}
              <nav aria-label="Quick links">
                <h3 className="font-semibold mb-4 sm:mb-6 pl-2 border-l-2 border-cyan-400 text-slate-900 dark:text-white text-sm sm:text-base">
                  Quick Links
                </h3>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                  {QUICK_LINKS.map((link) => (
                    <motion.li key={link.label} whileHover={{ x: 3 }}>
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center group"
                      >
                        <span className="w-1 h-1 bg-cyan-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Resources */}
              <nav aria-label="Resources">
                <h3 className="font-semibold mb-4 sm:mb-6 pl-2 border-l-2 border-purple-400 text-slate-900 dark:text-white text-sm sm:text-base">
                  Resources
                </h3>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                  {RESOURCE_LINKS.map((link) => (
                    <motion.li key={link.label} whileHover={{ x: 3 }}>
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center group"
                      >
                        <span className="w-1 h-1 bg-purple-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Newsletter */}
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border shadow-lg bg-white/70 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/50">
                <h3 className="font-semibold mb-4 sm:mb-6 pl-2 border-l-2 border-gradient-to-r from-cyan-400 to-purple-400 text-slate-900 dark:text-white text-sm sm:text-base">
                  Stay Updated
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 mb-3 sm:mb-4">
                  Subscribe to our newsletter for the latest updates.
                </p>
                <NewsletterForm />
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="border-t border-b border-slate-200 dark:border-slate-700 py-6 sm:py-8 mb-6 sm:mb-8">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-gray-400"
                >
                  <badge.icon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            {/* Copyright & Legal Links */}
            <div className="text-xs sm:text-sm space-y-2 md:space-y-1 text-center md:text-left">
              <p className="text-slate-600 dark:text-gray-400">
                © {currentYear} {COMPANY_INFO.name}. All rights reserved.
              </p>
              <nav aria-label="Legal links" className="flex flex-wrap gap-3 sm:gap-4 text-slate-500 dark:text-gray-400 justify-center md:justify-start">
                {LEGAL_LINKS.map((link, index) => (
                  <React.Fragment key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                    {index < LEGAL_LINKS.length - 1 && (
                      <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Made with Love */}
            <p className="text-xs sm:text-sm flex items-center justify-center md:justify-end text-slate-500 dark:text-gray-400">
              Made with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mx-1 animate-pulse" /> by the {COMPANY_INFO.name} Team
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <BackToTopButton />
    </>
  );
};
