'use client';

import React from 'react';
import type { User as NextAuthUser } from 'next-auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewQueueDashboard } from '@/components/sam/mentor-dashboard/review-queue-dashboard';

interface ReviewClientProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

/**
 * ReviewClient Component
 *
 * Client-side wrapper for the spaced repetition review page.
 * Provides a focused environment for learners to practice and
 * strengthen their knowledge using the SM-2 algorithm.
 */
export function ReviewClient({ user }: ReviewClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/user">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Review Queue</h1>
                  <p className="text-xs text-slate-400">Strengthen your knowledge</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>SM-2 Algorithm Powered</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Introduction Card */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Welcome to Spaced Repetition, {user.name?.split(' ')[0] ?? 'Learner'}
                </h2>
                <p className="text-slate-300 max-w-2xl">
                  Review concepts at optimal intervals to maximize long-term retention.
                  Rate your recall honestly - this helps SAM schedule future reviews
                  for peak memory efficiency.
                </p>
              </div>
            </div>
          </div>

          {/* Review Queue Dashboard */}
          <ReviewQueueDashboard />
        </motion.div>
      </main>
    </div>
  );
}
