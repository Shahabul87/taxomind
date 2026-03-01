"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Calendar, Clock, User, Tag, ArrowRight,
  Zap, Star, TrendingUp, BookOpen
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  createdAt: string;
  views: number;
  readingTime?: string;
  user?: {
    name: string | null;
    image?: string | null;
  };
  comments?: { length: number };
  tags?: string[];
}

interface TimelineEvent {
  date: string;
  posts: Post[];
}

interface TimelineSectionProps {
  posts: Post[];
  title?: string;
  showMilestones?: boolean;
}

export function TimelineSection({
  posts,
  title = "Recent Timeline",
  showMilestones = true
}: TimelineSectionProps) {
  // Group posts by date
  const groupPostsByDate = (posts: Post[]): TimelineEvent[] => {
    const grouped: { [key: string]: Post[] } = {};

    posts.forEach(post => {
      const date = new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(post);
    });

    return Object.entries(grouped)
      .map(([date, posts]) => ({ date, posts }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const timelineEvents = groupPostsByDate(posts);

  // Milestones for special dates
  const milestones = [
    { date: 'Today', icon: Zap, color: 'from-yellow-500 to-orange-500' },
    { date: 'This Week', icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
    { date: 'Featured', icon: Star, color: 'from-blue-500 to-indigo-500' }
  ];

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-transparent" />

        {/* Timeline Events */}
        <div className="space-y-12">
          {timelineEvents.map((event, eventIndex) => (
            <motion.div
              key={event.date}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: eventIndex * 0.1 }}
              className="relative"
            >
              {/* Date Marker */}
              <div className="absolute left-0 flex items-center">
                <div className="w-16 h-16 bg-white dark:bg-gray-900 border-4 border-purple-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>

              {/* Date Label */}
              <div className="ml-24 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {event.date}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {event.posts.length} {event.posts.length === 1 ? 'post' : 'posts'} published
                </p>
              </div>

              {/* Posts for this Date */}
              <div className="ml-24 space-y-4">
                {event.posts.map((post, postIndex) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: eventIndex * 0.1 + postIndex * 0.05 }}
                    whileHover={{ x: 5 }}
                    className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all"
                  >
                    {/* Connector Line */}
                    <div className="absolute -left-[68px] top-8 w-12 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" />

                    {/* Time Indicator */}
                    <div className="absolute -left-[76px] top-6 w-4 h-4 bg-white dark:bg-gray-900 border-2 border-blue-500 rounded-full" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Post Content */}
                      <div className="lg:col-span-2 space-y-3">
                        {/* Category & Time */}
                        <div className="flex items-center gap-3">
                          {post.category && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-medium">
                              {post.category}
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                            <Clock className="w-3 h-3" />
                            {new Date(post.createdAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                          {post.readingTime && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                              <BookOpen className="w-3 h-3" />
                              {post.readingTime}
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {post.title}
                        </h4>

                        {/* Description */}
                        {post.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {post.description}
                          </p>
                        )}

                        {/* Author & Tags */}
                        <div className="flex items-center justify-between">
                          {post.user && (
                            <div className="flex items-center gap-2">
                              {post.user.image ? (
                                <Image
                                  src={post.user.image}
                                  alt={post.user.name || 'Author'}
                                  width={24}
                                  height={24}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <User className="w-3 h-3 text-gray-500" />
                                </div>
                              )}
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {post.user.name}
                              </span>
                            </div>
                          )}

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Tag className="w-3 h-3 text-gray-400" />
                              {post.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-xs text-gray-500 dark:text-gray-400">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post Image */}
                      {post.imageUrl && (
                        <div className="relative aspect-[16/10] lg:aspect-[4/3] rounded-lg overflow-hidden">
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* End Marker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative mt-12"
        >
          <div className="absolute left-0 w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">END</span>
          </div>
          <div className="ml-24 pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You&apos;ve reached the end of the timeline
            </p>
          </div>
        </motion.div>
      </div>

      {/* Milestones Sidebar (Optional) */}
      {showMilestones && (
        <div className="absolute -right-4 top-0 hidden xl:block">
          <div className="sticky top-24 space-y-3">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.date}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className={`p-1.5 bg-gradient-to-r ${milestone.color} rounded`}>
                  <milestone.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {milestone.date}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}