'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Award,
  Briefcase,
  BookOpen,
  Trophy,
  Clock,
  Target,
  CheckCircle2,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Twitter,
  Star,
  GraduationCap,
  Code,
  Palette,
  BarChart3,
} from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Types matching the portfolio API
export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  type: string;
  skills: string[];
  technologies: string[];
  url?: string;
  repositoryUrl?: string;
  imageUrl?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  highlights: string[];
  isPublic: boolean;
  courseId?: string;
  courseName?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PortfolioSkill {
  skillId: string;
  skillName: string;
  proficiencyLevel: string;
  compositeScore: number;
  category: string;
  lastPracticedAt?: Date | string;
  projectCount: number;
  certificationCount: number;
  verificationStatus: 'self_assessed' | 'course_verified' | 'certified' | 'peer_validated';
}

export interface PortfolioCertification {
  certificationId: string;
  certificationName: string;
  provider: string;
  status: string;
  completedDate?: Date | string;
  expiryDate?: Date | string;
  credentialUrl?: string;
  credentialId?: string;
}

export interface PortfolioAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  earnedAt: Date | string;
  badgeUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PortfolioData {
  userId: string;
  userName: string;
  userImage?: string;
  settings: {
    isPublic: boolean;
    title: string;
    bio?: string;
    headline?: string;
    socialLinks?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      website?: string;
    };
    theme: string;
    featuredProjectIds: string[];
    featuredSkillIds: string[];
  };
  projects: PortfolioProject[];
  skills: PortfolioSkill[];
  certifications: PortfolioCertification[];
  achievements: PortfolioAchievement[];
  stats: {
    totalProjects: number;
    totalSkills: number;
    totalCertifications: number;
    totalAchievements: number;
    totalStudyHours: number;
    coursesCompleted: number;
    avgSkillScore: number;
  };
}

export interface ExportSections {
  profile: boolean;
  skills: boolean;
  certifications: boolean;
  projects: boolean;
  achievements: boolean;
  stats: boolean;
}

export interface PortfolioPreviewProps {
  portfolio: PortfolioData;
  sections: ExportSections;
  theme?: 'professional' | 'creative' | 'minimal' | 'dark';
  className?: string;
}

const THEME_STYLES = {
  professional: {
    bg: 'bg-white',
    text: 'text-slate-900',
    accent: 'text-blue-600',
    border: 'border-slate-200',
    card: 'bg-white border-slate-200',
  },
  creative: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    text: 'text-slate-900',
    accent: 'text-purple-600',
    border: 'border-purple-200',
    card: 'bg-white/90 border-purple-200',
  },
  minimal: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    accent: 'text-slate-600',
    border: 'border-slate-200',
    card: 'bg-white border-slate-100',
  },
  dark: {
    bg: 'bg-slate-900',
    text: 'text-white',
    accent: 'text-indigo-400',
    border: 'border-slate-700',
    card: 'bg-slate-800 border-slate-700',
  },
};

const PROFICIENCY_COLORS: Record<string, string> = {
  STRATEGIST: 'bg-purple-500',
  EXPERT: 'bg-indigo-500',
  ADVANCED: 'bg-blue-500',
  PROFICIENT: 'bg-emerald-500',
  COMPETENT: 'bg-yellow-500',
  BEGINNER: 'bg-orange-500',
  NOVICE: 'bg-slate-400',
};

const VERIFICATION_BADGES: Record<string, { label: string; color: string }> = {
  certified: { label: 'Certified', color: 'bg-emerald-100 text-emerald-700' },
  course_verified: { label: 'Course Verified', color: 'bg-blue-100 text-blue-700' },
  peer_validated: { label: 'Peer Validated', color: 'bg-purple-100 text-purple-700' },
  self_assessed: { label: 'Self Assessed', color: 'bg-slate-100 text-slate-600' },
};

const PROJECT_TYPE_ICONS: Record<string, React.ElementType> = {
  personal: Code,
  course: GraduationCap,
  open_source: Github,
  professional: Briefcase,
  hackathon: Trophy,
  research: BookOpen,
};

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Present';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function PortfolioPreview({
  portfolio,
  sections,
  theme = 'professional',
  className,
}: PortfolioPreviewProps) {
  const styles = THEME_STYLES[theme];

  return (
    <div
      className={cn(
        'min-h-[600px] rounded-xl p-6 overflow-hidden',
        styles.bg,
        styles.text,
        className
      )}
    >
      {/* Profile Section */}
      {sections.profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-white shadow-lg">
              {portfolio.userImage ? (
                <Image
                  src={portfolio.userImage}
                  alt={portfolio.userName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500">
                  <User className="h-10 w-10 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{portfolio.userName}</h1>
              {portfolio.settings.headline && (
                <p className={cn('mt-1 text-lg', styles.accent)}>
                  {portfolio.settings.headline}
                </p>
              )}
              {portfolio.settings.bio && (
                <p className="mt-2 text-sm opacity-80">{portfolio.settings.bio}</p>
              )}

              {/* Social Links */}
              {portfolio.settings.socialLinks && (
                <div className="mt-3 flex items-center gap-3">
                  {portfolio.settings.socialLinks.linkedin && (
                    <a
                      href={portfolio.settings.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('opacity-60 hover:opacity-100', styles.accent)}
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {portfolio.settings.socialLinks.github && (
                    <a
                      href={portfolio.settings.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('opacity-60 hover:opacity-100', styles.accent)}
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {portfolio.settings.socialLinks.twitter && (
                    <a
                      href={portfolio.settings.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('opacity-60 hover:opacity-100', styles.accent)}
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {portfolio.settings.socialLinks.website && (
                    <a
                      href={portfolio.settings.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('opacity-60 hover:opacity-100', styles.accent)}
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Section */}
      {sections.stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-3 gap-4 sm:grid-cols-6"
        >
          {[
            { label: 'Skills', value: portfolio.stats.totalSkills, icon: Target },
            { label: 'Projects', value: portfolio.stats.totalProjects, icon: Briefcase },
            { label: 'Certifications', value: portfolio.stats.totalCertifications, icon: Award },
            { label: 'Achievements', value: portfolio.stats.totalAchievements, icon: Trophy },
            { label: 'Study Hours', value: portfolio.stats.totalStudyHours, icon: Clock },
            { label: 'Courses', value: portfolio.stats.coursesCompleted, icon: BookOpen },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-lg border p-3 text-center',
                styles.card
              )}
            >
              <stat.icon className={cn('mx-auto h-5 w-5 mb-1', styles.accent)} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs opacity-60">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Skills Section */}
      {sections.skills && portfolio.skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className={cn('mb-4 flex items-center gap-2 text-lg font-semibold', styles.accent)}>
            <Target className="h-5 w-5" />
            Skills
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {portfolio.skills.slice(0, 8).map((skill) => {
              const verification = VERIFICATION_BADGES[skill.verificationStatus];
              return (
                <div
                  key={skill.skillId}
                  className={cn('rounded-lg border p-3', styles.card)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{skill.skillName}</span>
                    <Badge className={verification.color} variant="secondary">
                      {verification.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={skill.compositeScore}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium">{skill.compositeScore}%</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs opacity-60">
                    <span className={cn('rounded-full px-2 py-0.5 text-white text-[10px]', PROFICIENCY_COLORS[skill.proficiencyLevel] || 'bg-slate-400')}>
                      {skill.proficiencyLevel}
                    </span>
                    <span>{skill.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {portfolio.skills.length > 8 && (
            <p className="mt-2 text-center text-sm opacity-60">
              +{portfolio.skills.length - 8} more skills
            </p>
          )}
        </motion.div>
      )}

      {/* Certifications Section */}
      {sections.certifications && portfolio.certifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className={cn('mb-4 flex items-center gap-2 text-lg font-semibold', styles.accent)}>
            <Award className="h-5 w-5" />
            Certifications
          </h2>
          <div className="space-y-3">
            {portfolio.certifications.slice(0, 5).map((cert) => (
              <div
                key={cert.certificationId}
                className={cn('flex items-center gap-3 rounded-lg border p-3', styles.card)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{cert.certificationName}</div>
                  <div className="text-sm opacity-60">
                    {cert.provider} • {formatDate(cert.completedDate)}
                  </div>
                </div>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('opacity-60 hover:opacity-100', styles.accent)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
          {portfolio.certifications.length > 5 && (
            <p className="mt-2 text-center text-sm opacity-60">
              +{portfolio.certifications.length - 5} more certifications
            </p>
          )}
        </motion.div>
      )}

      {/* Projects Section */}
      {sections.projects && portfolio.projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className={cn('mb-4 flex items-center gap-2 text-lg font-semibold', styles.accent)}>
            <Briefcase className="h-5 w-5" />
            Projects
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {portfolio.projects.slice(0, 4).map((project) => {
              const TypeIcon = PROJECT_TYPE_ICONS[project.type] || Briefcase;
              return (
                <div
                  key={project.id}
                  className={cn('rounded-lg border p-4', styles.card)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', 'bg-gradient-to-br from-indigo-500 to-purple-500')}>
                      <TypeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{project.title}</span>
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn('opacity-60 hover:opacity-100 flex-shrink-0', styles.accent)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="mt-1 text-sm opacity-70 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.technologies.length > 3 && (
                          <span className="text-[10px] opacity-60">
                            +{project.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {portfolio.projects.length > 4 && (
            <p className="mt-2 text-center text-sm opacity-60">
              +{portfolio.projects.length - 4} more projects
            </p>
          )}
        </motion.div>
      )}

      {/* Achievements Section */}
      {sections.achievements && portfolio.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className={cn('mb-4 flex items-center gap-2 text-lg font-semibold', styles.accent)}>
            <Trophy className="h-5 w-5" />
            Achievements
          </h2>
          <div className="flex flex-wrap gap-2">
            {portfolio.achievements.slice(0, 10).map((achievement) => (
              <Badge
                key={achievement.id}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5"
              >
                <Star className="h-3.5 w-3.5 text-amber-500" />
                {achievement.title}
              </Badge>
            ))}
            {portfolio.achievements.length > 10 && (
              <Badge variant="outline">
                +{portfolio.achievements.length - 10} more
              </Badge>
            )}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-dashed opacity-50 text-center text-xs">
        Generated by Taxomind • {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
