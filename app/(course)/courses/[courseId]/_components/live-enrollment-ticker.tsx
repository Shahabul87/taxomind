"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Globe, Zap } from 'lucide-react';

interface EnrollmentActivity {
  id: string;
  name: string;
  location: string;
  timeAgo: string;
  action: string;
}

interface LiveEnrollmentTickerProps {
  initialEnrollments?: number;
  courseId?: string;
}

export const LiveEnrollmentTicker = ({
  initialEnrollments = 0,
  courseId
}: LiveEnrollmentTickerProps): JSX.Element => {
  const [currentEnrollments, setCurrentEnrollments] = useState(initialEnrollments);
  const [recentActivity, setRecentActivity] = useState<EnrollmentActivity | null>(null);
  const [viewersCount, setViewersCount] = useState(Math.floor(Math.random() * 20) + 5);
  const [isVisible, setIsVisible] = useState(false);

  // Track all nested timeouts for proper cleanup
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Simulated live data - in production, this would connect to a WebSocket or SSE
  useEffect(() => {
    // Generate random viewer count changes
    const viewerInterval = setInterval(() => {
      setViewersCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(1, prev + change);
      });
    }, 8000);

    // Simulate enrollment activities
    const activities = [
      { name: "Sarah M.", location: "New York", action: "just enrolled" },
      { name: "James L.", location: "London", action: "started learning" },
      { name: "Maria G.", location: "Barcelona", action: "just enrolled" },
      { name: "Alex K.", location: "Toronto", action: "completed intro" },
      { name: "Chen W.", location: "Singapore", action: "just enrolled" },
      { name: "Emma S.", location: "Sydney", action: "left a review" },
      { name: "Lucas R.", location: "Berlin", action: "just enrolled" },
      { name: "Priya P.", location: "Mumbai", action: "started chapter 2" },
    ];

    let activityIndex = 0;
    const activityInterval = setInterval(() => {
      const activity = activities[activityIndex % activities.length];
      setRecentActivity({
        id: `${Date.now()}`,
        name: activity.name,
        location: activity.location,
        timeAgo: "just now",
        action: activity.action
      });

      if (activity.action === "just enrolled") {
        setCurrentEnrollments(prev => prev + 1);
      }

      activityIndex++;
      setIsVisible(true);

      // Hide after 4 seconds - tracked for cleanup
      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
      timeoutRefs.current.push(hideTimeout);
    }, 12000); // Show new activity every 12 seconds

    // Show initial activity after 3 seconds - tracked for cleanup
    const initialTimeout = setTimeout(() => {
      const activity = activities[0];
      setRecentActivity({
        id: `${Date.now()}`,
        name: activity.name,
        location: activity.location,
        timeAgo: "just now",
        action: activity.action
      });
      setIsVisible(true);
      const initialHideTimeout = setTimeout(() => setIsVisible(false), 4000);
      timeoutRefs.current.push(initialHideTimeout);
    }, 3000);
    timeoutRefs.current.push(initialTimeout);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(activityInterval);
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Live Viewers Badge */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-400/40 rounded-full backdrop-blur-md"
      >
        <motion.div
          className="w-2 h-2 bg-red-500 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <span className="text-red-100 text-sm font-medium flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {viewersCount} viewing now
        </span>
      </motion.div>

      {/* Recent Activity Notification */}
      <AnimatePresence mode="wait">
        {isVisible && recentActivity && (
          <motion.div
            key={recentActivity.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20 rounded-lg backdrop-blur-md"
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {recentActivity.action === "just enrolled" ? (
                <Zap className="w-5 h-5 text-yellow-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-400" />
              )}
            </motion.div>
            <div className="text-sm">
              <span className="font-semibold text-white">{recentActivity.name}</span>
              <span className="text-white/80"> from </span>
              <span className="text-white/90 inline-flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {recentActivity.location}
              </span>
              <span className="text-white/80"> {recentActivity.action}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enrollment Momentum */}
      {currentEnrollments > initialEnrollments && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-400/40 rounded-full backdrop-blur-md"
        >
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-green-100 text-sm font-medium">
            {currentEnrollments - initialEnrollments} new students today
          </span>
        </motion.div>
      )}
    </div>
  );
};

// Enrollment surge indicator
export const EnrollmentSurge = (): JSX.Element => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show surge indicator after 5 seconds
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return <></>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/40 rounded-full backdrop-blur-md"
    >
      <motion.div
        animate={{
          rotate: [0, 10, -10, 10, 0],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <Zap className="w-5 h-5 text-orange-400" />
      </motion.div>
      <span className="text-orange-100 text-sm font-semibold">
        🔥 High demand - 73% enrolled in last 24h
      </span>
    </motion.div>
  );
};