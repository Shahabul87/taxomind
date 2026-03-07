'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Edit2,
  Camera,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Twitter,
  Linkedin,
  Github,
  Sparkles,
  Link as LinkIcon,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { UserProfile } from './types';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const router = useRouter();
  const hasSocialLinks = !!(profile.twitter || profile.linkedin || profile.github);
  const allStatsZero =
    profile.coursesEnrolled === 0 &&
    profile.coursesCompleted === 0 &&
    profile.certificatesEarned === 0 &&
    profile.totalLearningHours === 0 &&
    profile.currentStreak === 0 &&
    profile.longestStreak === 0;

  const stats = [
    {
      value: profile.coursesEnrolled,
      label: 'Courses Enrolled',
      color: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      value: profile.coursesCompleted,
      label: 'Completed',
      color: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      value: profile.certificatesEarned,
      label: 'Certificates',
      color: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      value: `${profile.totalLearningHours}h`,
      label: 'Learning Hours',
      color: 'from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20',
      textColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      value: profile.currentStreak,
      suffix: profile.currentStreak > 0 ? ' \uD83D\uDD25' : '',
      label: 'Day Streak',
      color: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      value: profile.longestStreak,
      label: 'Best Streak',
      color: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  return (
    <>
      {/* Banner */}
      <div className="relative overflow-hidden">
        <div className="h-40 xs:h-48 sm:h-56 md:h-64 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />
        </div>
      </div>

      {/* Profile Card */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-16 xs:-mt-20 sm:-mt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6 md:gap-8">
            {/* Avatar */}
            <div className="relative group mx-auto md:mx-0">
              <Avatar className="h-24 w-24 xs:h-28 xs:w-28 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.image} alt={profile.name} />
                <AvatarFallback className="text-xl xs:text-2xl sm:text-3xl">
                  {profile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => router.push('/settings?tab=profile')}
                title="Edit profile picture"
              >
                <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex items-start justify-between flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 w-full min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
                      {profile.name}
                    </h1>
                    <Sparkles className="h-4 w-4 xs:h-5 xs:w-5 text-indigo-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs xs:text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 break-all">
                    <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                    <span className="min-w-0 break-all">{profile.email}</span>
                  </p>
                  {profile.bio && (
                    <p className="mt-3 sm:mt-4 max-w-2xl text-sm xs:text-base text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-5 text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                    {profile.location && (
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full">
                        <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                        <span className="break-words">{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full">
                        <Globe className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all"
                        >
                          Portfolio
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full">
                      <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                      <span className="break-words">
                        Member since {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Social Links or Add Prompt */}
                  {hasSocialLinks ? (
                    <div className="flex gap-1.5 sm:gap-2 mt-4 sm:mt-5">
                      {profile.twitter && (
                        <a
                          href={profile.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 xs:h-9 xs:w-9 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors text-slate-600 dark:text-slate-400"
                        >
                          <Twitter className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        </a>
                      )}
                      {profile.linkedin && (
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 xs:h-9 xs:w-9 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 transition-colors text-slate-600 dark:text-slate-400"
                        >
                          <Linkedin className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        </a>
                      )}
                      {profile.github && (
                        <a
                          href={profile.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 xs:h-9 xs:w-9 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                        >
                          <Github className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push('/settings?tab=profile')}
                      className="flex items-center gap-1.5 mt-4 sm:mt-5 text-xs sm:text-sm text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Add your social links
                    </button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => router.push('/settings?tab=profile')}
                  className="border-slate-300 dark:border-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300 dark:hover:border-indigo-600 transition-all w-full sm:w-auto mt-3 sm:mt-0 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Edit2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 sm:mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-700">
            {allStatsZero && (
              <div className="col-span-full mb-3 sm:mb-4">
                <div className="flex items-center gap-2 justify-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 rounded-lg py-2.5 px-4">
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span>Enroll in a course to start tracking your progress!</span>
                </div>
              </div>
            )}
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  'text-center p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br',
                  stat.color
                )}
              >
                <div className={cn('text-xl xs:text-2xl sm:text-3xl font-bold', stat.textColor)}>
                  {stat.value}
                  {'suffix' in stat && stat.suffix}
                </div>
                <div className="text-[10px] xs:text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 break-words">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
