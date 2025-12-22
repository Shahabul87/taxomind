"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  Search,
  Plus,
  Sparkles,
  PenLine,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedEmptyStateProps {
  type: 'no-posts' | 'no-drafts' | 'no-published' | 'no-results';
  searchQuery?: string;
  onClearSearch?: () => void;
}

// Abstract illustration components
const PublishedIllustration = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none" className="mx-auto">
    {/* Background shapes */}
    <motion.circle
      cx="100"
      cy="80"
      r="60"
      fill="url(#gradient1)"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.15 }}
      transition={{ duration: 0.6 }}
    />
    <motion.circle
      cx="140"
      cy="60"
      r="30"
      fill="url(#gradient2)"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    />

    {/* Document stack */}
    <motion.g
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Back document */}
      <rect x="55" y="45" width="70" height="90" rx="6" fill="#e2e8f0" className="dark:fill-slate-700" />

      {/* Middle document */}
      <rect x="65" y="35" width="70" height="90" rx="6" fill="#f1f5f9" className="dark:fill-slate-600" />

      {/* Front document */}
      <rect x="75" y="25" width="70" height="90" rx="6" fill="white" className="dark:fill-slate-500" stroke="#e2e8f0" strokeWidth="1" />

      {/* Lines on document */}
      <rect x="85" y="45" width="40" height="4" rx="2" fill="#cbd5e1" />
      <rect x="85" y="55" width="50" height="4" rx="2" fill="#e2e8f0" />
      <rect x="85" y="65" width="35" height="4" rx="2" fill="#e2e8f0" />
      <rect x="85" y="80" width="45" height="4" rx="2" fill="#e2e8f0" />
      <rect x="85" y="90" width="30" height="4" rx="2" fill="#e2e8f0" />
    </motion.g>

    {/* Sparkle effects */}
    <motion.g
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <circle cx="155" cy="40" r="3" fill="#8b5cf6" />
      <circle cx="50" cy="60" r="2" fill="#f472b6" />
      <circle cx="160" cy="100" r="2.5" fill="#3b82f6" />
    </motion.g>

    {/* Gradients */}
    <defs>
      <linearGradient id="gradient1" x1="40" y1="20" x2="160" y2="140">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="gradient2" x1="110" y1="30" x2="170" y2="90">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

const DraftIllustration = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none" className="mx-auto">
    {/* Background */}
    <motion.ellipse
      cx="100"
      cy="85"
      rx="65"
      ry="55"
      fill="url(#draftGradient)"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.12 }}
      transition={{ duration: 0.6 }}
    />

    {/* Notepad */}
    <motion.g
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Paper */}
      <rect x="60" y="30" width="80" height="100" rx="4" fill="white" className="dark:fill-slate-600" stroke="#fbbf24" strokeWidth="2" />

      {/* Spiral binding */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle
          key={i}
          cx="60"
          cy={40 + i * 13}
          r="4"
          fill="#fbbf24"
        />
      ))}

      {/* Lines */}
      <rect x="72" y="50" width="55" height="3" rx="1.5" fill="#fef3c7" />
      <rect x="72" y="62" width="45" height="3" rx="1.5" fill="#fef3c7" />
      <rect x="72" y="74" width="55" height="3" rx="1.5" fill="#fef3c7" />
      <rect x="72" y="86" width="35" height="3" rx="1.5" fill="#fef3c7" />
    </motion.g>

    {/* Pencil */}
    <motion.g
      initial={{ rotate: -45, x: 30, y: -20, opacity: 0 }}
      animate={{ rotate: 0, x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <rect x="130" y="55" width="8" height="45" rx="1" fill="#f59e0b" />
      <polygon points="134,100 130,100 129,110 134,107 139,110 138,100" fill="#fcd34d" />
      <rect x="130" y="55" width="8" height="8" fill="#92400e" />
      <polygon points="134,107 131,115 137,115" fill="#1f2937" />
    </motion.g>

    {/* Clock indicator */}
    <motion.g
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.6 }}
    >
      <circle cx="155" cy="35" r="15" fill="white" stroke="#f59e0b" strokeWidth="2" />
      <line x1="155" y1="35" x2="155" y2="27" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      <line x1="155" y1="35" x2="161" y2="38" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
    </motion.g>

    <defs>
      <linearGradient id="draftGradient" x1="35" y1="30" x2="165" y2="140">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
    </defs>
  </svg>
);

const SearchIllustration = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none" className="mx-auto">
    {/* Background */}
    <motion.circle
      cx="100"
      cy="80"
      r="55"
      fill="url(#searchGradient)"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.1 }}
      transition={{ duration: 0.6 }}
    />

    {/* Magnifying glass */}
    <motion.g
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <circle
        cx="90"
        cy="70"
        r="35"
        fill="white"
        className="dark:fill-slate-700"
        stroke="#6366f1"
        strokeWidth="6"
      />
      <line
        x1="115"
        y1="95"
        x2="145"
        y2="125"
        stroke="#6366f1"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Reflection */}
      <ellipse
        cx="75"
        cy="58"
        rx="12"
        ry="8"
        fill="#c7d2fe"
        transform="rotate(-30 75 58)"
      />
    </motion.g>

    {/* Question marks */}
    <motion.g
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <text x="50" y="50" fontSize="24" fill="#a5b4fc">?</text>
      <text x="130" y="45" fontSize="18" fill="#c4b5fd">?</text>
      <text x="145" y="75" fontSize="14" fill="#ddd6fe">?</text>
    </motion.g>

    <defs>
      <linearGradient id="searchGradient" x1="45" y1="25" x2="155" y2="135">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

const NoPostsIllustration = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none" className="mx-auto">
    {/* Background */}
    <motion.circle
      cx="100"
      cy="80"
      r="60"
      fill="url(#noPostsGradient)"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.12 }}
      transition={{ duration: 0.6 }}
    />

    {/* Rocket */}
    <motion.g
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
    >
      {/* Rocket body */}
      <ellipse cx="100" cy="70" rx="18" ry="40" fill="white" className="dark:fill-slate-600" stroke="#8b5cf6" strokeWidth="2" />

      {/* Rocket tip */}
      <path d="M100 30 L85 50 L115 50 Z" fill="#8b5cf6" />

      {/* Window */}
      <circle cx="100" cy="60" r="8" fill="#c4b5fd" stroke="#8b5cf6" strokeWidth="2" />

      {/* Fins */}
      <path d="M82 90 L70 110 L82 105 Z" fill="#ec4899" />
      <path d="M118 90 L130 110 L118 105 Z" fill="#ec4899" />

      {/* Flames */}
      <motion.g
        animate={{ scaleY: [1, 1.2, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      >
        <ellipse cx="100" cy="118" rx="10" ry="15" fill="#f59e0b" />
        <ellipse cx="100" cy="115" rx="6" ry="10" fill="#fbbf24" />
      </motion.g>
    </motion.g>

    {/* Stars */}
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <circle cx="45" cy="45" r="2" fill="#fbbf24" />
      <circle cx="160" cy="55" r="2.5" fill="#f472b6" />
      <circle cx="55" cy="110" r="1.5" fill="#8b5cf6" />
      <circle cx="150" cy="100" r="2" fill="#3b82f6" />
      <circle cx="170" cy="130" r="1.5" fill="#fbbf24" />
    </motion.g>

    <defs>
      <linearGradient id="noPostsGradient" x1="40" y1="20" x2="160" y2="140">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
  </svg>
);

const emptyStateConfig = {
  'no-posts': {
    illustration: <NoPostsIllustration />,
    title: "Start Your Content Journey",
    description: "Your content hub is ready and waiting. Create your first post to share knowledge, insights, and engage with your audience.",
    actionText: "Create Your First Post",
    actionLink: "/teacher/posts/create-post",
    icon: <Sparkles className="w-5 h-5" />,
  },
  'no-drafts': {
    illustration: <DraftIllustration />,
    title: "No Drafts in Progress",
    description: "All your drafts have been published! Start a new draft to continue creating amazing content.",
    actionText: "Start New Draft",
    actionLink: "/teacher/posts/create-post",
    icon: <PenLine className="w-5 h-5" />,
  },
  'no-published': {
    illustration: <PublishedIllustration />,
    title: "No Published Posts Yet",
    description: "Your audience is waiting! Publish your first post to start building your content library and reach more readers.",
    actionText: "Create & Publish",
    actionLink: "/teacher/posts/create-post",
    icon: <BookOpen className="w-5 h-5" />,
  },
  'no-results': {
    illustration: <SearchIllustration />,
    title: "No Results Found",
    description: "We couldn&apos;t find any posts matching your search. Try adjusting your filters or search terms.",
    actionText: "Clear Search",
    actionLink: "",
    icon: <Search className="w-5 h-5" />,
  },
};

export const EnhancedEmptyState = ({
  type,
  searchQuery,
  onClearSearch,
}: EnhancedEmptyStateProps) => {
  const config = emptyStateConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Illustration */}
      <div className="mb-6">
        {config.illustration}
      </div>

      {/* Content */}
      <div className="text-center max-w-md">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold text-slate-900 dark:text-white mb-2"
        >
          {config.title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-600 dark:text-slate-400 mb-6"
        >
          {type === 'no-results' && searchQuery
            ? `No posts found for "${searchQuery}". Try a different search term.`
            : config.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          {type === 'no-results' && onClearSearch ? (
            <Button
              onClick={onClearSearch}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
            >
              {config.icon}
              <span className="ml-2">{config.actionText}</span>
            </Button>
          ) : (
            <Link href={config.actionLink}>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300">
                {config.icon}
                <span className="ml-2">{config.actionText}</span>
              </Button>
            </Link>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
