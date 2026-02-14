import type { ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Code2, Terminal, Braces, GitBranch,
  Brain, Cpu, Network,
  Palette, Layers, Pen,
  Calculator, Sigma, TrendingUp,
  BookOpen, GraduationCap,
  BarChart3, Shield, Megaphone,
} from 'lucide-react';
import { ProgrammingPattern } from '../_components/category-heroes/patterns/programming-pattern';
import { AIMLPattern } from '../_components/category-heroes/patterns/ai-ml-pattern';
import { DesignPattern } from '../_components/category-heroes/patterns/design-pattern';
import { MathPattern } from '../_components/category-heroes/patterns/math-pattern';
import { DefaultPattern } from '../_components/category-heroes/patterns/default-pattern';
import type { CategoryLayoutVariant } from './category-layouts';

export type ImagePresentationType =
  | '3d-tilt'
  | 'stacked-layers'
  | 'glass-frame'
  | 'diagonal-slice'
  | 'browser-mockup'
  | 'dashboard-frame'
  | 'executive-card'
  | 'social-engagement';

export interface HeroStatConfig {
  icon: LucideIcon;
  label: string;
  colorClass: string;
}

export interface HeroBadgeConfig {
  icon: LucideIcon;
  label: string;
}

export interface HeroThemeConfig {
  gradient: string;
  pattern: ComponentType;

  glowColors: [string, string];

  colors: {
    breadcrumbText: string;
    breadcrumbHover: string;
    breadcrumbActive: string;
    subtitle: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    imageBorder: string;
    imageOverlay: string;
    instructorRing: string;
    instructorBg: string;
    instructorText: string;
    instructorLabel: string;
    studentIcon: string;
    borderColor: string;
    buttonFrom: string;
    buttonTo: string;
    buttonHoverFrom: string;
    buttonHoverTo: string;
    buttonShadow: string;
  };

  fallbackIcon: LucideIcon;
  fallbackExtra?: ReactNode;
  fallbackGradient?: string;

  stats: [HeroStatConfig, HeroStatConfig, HeroStatConfig];

  badge?: HeroBadgeConfig;

  contextBadge?: {
    text: string;
    className?: string;
  };

  floatingSymbols?: Array<{
    symbol: string;
    className: string;
  }>;

  imagePresentation: {
    type: ImagePresentationType;
  };
}

export const HERO_THEMES: Record<CategoryLayoutVariant, HeroThemeConfig> = {
  programming: {
    gradient: 'from-slate-900 via-blue-900 to-indigo-900',
    pattern: ProgrammingPattern,
    glowColors: ['cyan-500', 'blue-500'],
    colors: {
      breadcrumbText: 'blue-200/70',
      breadcrumbHover: 'blue-200',
      breadcrumbActive: 'blue-200',
      subtitle: 'blue-200',
      badgeBg: 'blue-500/20',
      badgeText: 'blue-100',
      badgeBorder: 'blue-400/30',
      imageBorder: 'blue-400/30',
      imageOverlay: 'blue-900/60',
      instructorRing: 'blue-400/30',
      instructorBg: 'blue-500/20',
      instructorText: 'blue-300',
      instructorLabel: 'blue-200/70',
      studentIcon: 'cyan-400',
      borderColor: 'blue-400/20',
      buttonFrom: 'blue-600',
      buttonTo: 'cyan-600',
      buttonHoverFrom: 'blue-700',
      buttonHoverTo: 'cyan-700',
      buttonShadow: 'blue-500/30',
    },
    fallbackIcon: Code2,
    stats: [
      { icon: Braces, label: 'Modules', colorClass: 'text-cyan-400' },
      { icon: GitBranch, label: 'Lessons', colorClass: 'text-purple-400' },
      { icon: Code2, label: 'Resources', colorClass: 'text-green-400' },
    ],
    badge: { icon: Terminal, label: 'Tech Stack' },
    imagePresentation: { type: 'browser-mockup' },
  },

  'ai-ml': {
    gradient: 'from-purple-900 via-indigo-900 to-pink-900',
    pattern: AIMLPattern,
    glowColors: ['purple-500', 'pink-500'],
    colors: {
      breadcrumbText: 'purple-200/70',
      breadcrumbHover: 'purple-200',
      breadcrumbActive: 'purple-200',
      subtitle: 'purple-200',
      badgeBg: 'purple-500/20',
      badgeText: 'purple-100',
      badgeBorder: 'purple-400/30',
      imageBorder: 'purple-400/30',
      imageOverlay: 'purple-900/60',
      instructorRing: 'purple-400/30',
      instructorBg: 'purple-500/20',
      instructorText: 'purple-300',
      instructorLabel: 'purple-200/70',
      studentIcon: 'pink-400',
      borderColor: 'purple-400/20',
      buttonFrom: 'purple-600',
      buttonTo: 'pink-600',
      buttonHoverFrom: 'purple-700',
      buttonHoverTo: 'pink-700',
      buttonShadow: 'purple-500/30',
    },
    fallbackIcon: Brain,
    stats: [
      { icon: Brain, label: 'Modules', colorClass: 'text-cyan-400' },
      { icon: Cpu, label: 'Lessons', colorClass: 'text-pink-400' },
      { icon: Network, label: 'Resources', colorClass: 'text-purple-400' },
    ],
    badge: { icon: Network, label: 'ML Models & Algorithms' },
    imagePresentation: { type: 'stacked-layers' },
  },

  'data-science': {
    gradient: 'from-slate-950 via-emerald-950 to-teal-950',
    pattern: AIMLPattern,
    glowColors: ['emerald-500', 'teal-500'],
    colors: {
      breadcrumbText: 'emerald-200/70',
      breadcrumbHover: 'emerald-200',
      breadcrumbActive: 'emerald-200',
      subtitle: 'emerald-200',
      badgeBg: 'emerald-500/20',
      badgeText: 'emerald-100',
      badgeBorder: 'emerald-400/30',
      imageBorder: 'emerald-400/30',
      imageOverlay: 'emerald-900/60',
      instructorRing: 'emerald-400/30',
      instructorBg: 'emerald-500/20',
      instructorText: 'emerald-300',
      instructorLabel: 'emerald-200/70',
      studentIcon: 'teal-400',
      borderColor: 'emerald-400/20',
      buttonFrom: 'emerald-600',
      buttonTo: 'teal-600',
      buttonHoverFrom: 'emerald-700',
      buttonHoverTo: 'teal-700',
      buttonShadow: 'emerald-500/30',
    },
    fallbackIcon: BarChart3,
    stats: [
      { icon: BarChart3, label: 'Modules', colorClass: 'text-emerald-400' },
      { icon: TrendingUp, label: 'Lessons', colorClass: 'text-teal-400' },
      { icon: Network, label: 'Resources', colorClass: 'text-cyan-400' },
    ],
    badge: { icon: BarChart3, label: 'Data Tools & Frameworks' },
    imagePresentation: { type: 'dashboard-frame' },
  },

  design: {
    gradient: 'from-pink-900 via-rose-900 to-purple-900',
    pattern: DesignPattern,
    glowColors: ['pink-500', 'purple-500'],
    colors: {
      breadcrumbText: 'pink-200/70',
      breadcrumbHover: 'pink-200',
      breadcrumbActive: 'pink-200',
      subtitle: 'pink-200',
      badgeBg: 'pink-500/20',
      badgeText: 'pink-100',
      badgeBorder: 'pink-400/30',
      imageBorder: 'pink-400/30',
      imageOverlay: 'pink-900/60',
      instructorRing: 'pink-400/30',
      instructorBg: 'pink-500/20',
      instructorText: 'pink-300',
      instructorLabel: 'pink-200/70',
      studentIcon: 'rose-400',
      borderColor: 'pink-400/20',
      buttonFrom: 'pink-600',
      buttonTo: 'purple-600',
      buttonHoverFrom: 'pink-700',
      buttonHoverTo: 'purple-700',
      buttonShadow: 'pink-500/30',
    },
    fallbackIcon: Palette,
    stats: [
      { icon: Palette, label: 'Modules', colorClass: 'text-rose-400' },
      { icon: Pen, label: 'Lessons', colorClass: 'text-purple-400' },
      { icon: Layers, label: 'Resources', colorClass: 'text-pink-400' },
    ],
    badge: { icon: Layers, label: 'Design Tools' },
    imagePresentation: { type: 'diagonal-slice' },
  },

  math: {
    gradient: 'from-slate-950 via-blue-950 to-indigo-950',
    pattern: MathPattern,
    glowColors: ['blue-500', 'indigo-500'],
    colors: {
      breadcrumbText: 'blue-200/70',
      breadcrumbHover: 'blue-200',
      breadcrumbActive: 'blue-200',
      subtitle: 'blue-200',
      badgeBg: 'blue-500/20',
      badgeText: 'blue-100',
      badgeBorder: 'blue-400/30',
      imageBorder: 'indigo-400/30',
      imageOverlay: 'indigo-900/60',
      instructorRing: 'indigo-400/30',
      instructorBg: 'indigo-500/20',
      instructorText: 'blue-300',
      instructorLabel: 'blue-200/70',
      studentIcon: 'cyan-400',
      borderColor: 'indigo-400/20',
      buttonFrom: 'blue-600',
      buttonTo: 'indigo-600',
      buttonHoverFrom: 'blue-700',
      buttonHoverTo: 'indigo-700',
      buttonShadow: 'blue-500/30',
    },
    fallbackIcon: Sigma,
    fallbackGradient: 'from-slate-900 to-indigo-900/40',
    contextBadge: {
      text: 'dy/dx',
      className: 'font-mono',
    },
    stats: [
      { icon: Calculator, label: 'Chapters', colorClass: 'text-cyan-400' },
      { icon: Sigma, label: 'Lessons', colorClass: 'text-blue-400' },
      { icon: TrendingUp, label: 'Problems', colorClass: 'text-indigo-400' },
    ],
    badge: { icon: Sigma, label: 'Topics Covered' },
    floatingSymbols: [
      { symbol: '\u03C0', className: 'top-20 left-10 text-6xl text-blue-400/20' },
      { symbol: '\u221A', className: 'top-40 right-20 text-5xl text-indigo-400/20' },
      { symbol: '\u2211', className: 'bottom-32 left-1/4 text-4xl text-cyan-400/20' },
      { symbol: '\u222B', className: 'bottom-20 right-1/3 text-5xl text-blue-400/20' },
      { symbol: '\u0394', className: 'top-1/3 right-10 text-4xl text-indigo-400/20' },
    ],
    imagePresentation: { type: 'glass-frame' },
  },

  business: {
    gradient: 'from-slate-950 via-slate-900 to-amber-950/30',
    pattern: DefaultPattern,
    glowColors: ['amber-500', 'slate-500'],
    colors: {
      breadcrumbText: 'amber-200/70',
      breadcrumbHover: 'amber-200',
      breadcrumbActive: 'amber-200',
      subtitle: 'amber-200',
      badgeBg: 'amber-500/15',
      badgeText: 'amber-100',
      badgeBorder: 'amber-400/30',
      imageBorder: 'amber-600/20',
      imageOverlay: 'slate-900/80',
      instructorRing: 'amber-400/30',
      instructorBg: 'amber-500/15',
      instructorText: 'amber-300',
      instructorLabel: 'amber-200/70',
      studentIcon: 'amber-400',
      borderColor: 'amber-400/20',
      buttonFrom: 'amber-600',
      buttonTo: 'orange-600',
      buttonHoverFrom: 'amber-700',
      buttonHoverTo: 'orange-700',
      buttonShadow: 'amber-500/30',
    },
    fallbackIcon: Shield,
    stats: [
      { icon: BookOpen, label: 'Modules', colorClass: 'text-amber-400' },
      { icon: GraduationCap, label: 'Lessons', colorClass: 'text-orange-400' },
      { icon: Shield, label: 'Resources', colorClass: 'text-yellow-400' },
    ],
    imagePresentation: { type: 'executive-card' },
  },

  marketing: {
    gradient: 'from-slate-950 via-orange-950/40 to-rose-950/30',
    pattern: DefaultPattern,
    glowColors: ['orange-500', 'rose-500'],
    colors: {
      breadcrumbText: 'orange-200/70',
      breadcrumbHover: 'orange-200',
      breadcrumbActive: 'orange-200',
      subtitle: 'orange-200',
      badgeBg: 'orange-500/15',
      badgeText: 'orange-100',
      badgeBorder: 'orange-400/30',
      imageBorder: 'orange-400/30',
      imageOverlay: 'slate-900/80',
      instructorRing: 'orange-400/30',
      instructorBg: 'orange-500/15',
      instructorText: 'orange-300',
      instructorLabel: 'orange-200/70',
      studentIcon: 'rose-400',
      borderColor: 'orange-400/20',
      buttonFrom: 'orange-600',
      buttonTo: 'rose-600',
      buttonHoverFrom: 'orange-700',
      buttonHoverTo: 'rose-700',
      buttonShadow: 'orange-500/30',
    },
    fallbackIcon: Megaphone,
    stats: [
      { icon: BookOpen, label: 'Modules', colorClass: 'text-orange-400' },
      { icon: TrendingUp, label: 'Lessons', colorClass: 'text-rose-400' },
      { icon: Megaphone, label: 'Resources', colorClass: 'text-amber-400' },
    ],
    imagePresentation: { type: 'social-engagement' },
  },

  default: {
    gradient: 'from-slate-900 via-gray-900 to-slate-800',
    pattern: DefaultPattern,
    glowColors: ['blue-500', 'indigo-500'],
    colors: {
      breadcrumbText: 'slate-400',
      breadcrumbHover: 'slate-300',
      breadcrumbActive: 'slate-300',
      subtitle: 'blue-200',
      badgeBg: 'slate-700/50',
      badgeText: 'slate-200',
      badgeBorder: 'slate-600',
      imageBorder: 'slate-700/50',
      imageOverlay: 'slate-900/80',
      instructorRing: 'slate-600',
      instructorBg: 'slate-700',
      instructorText: 'slate-400',
      instructorLabel: 'slate-400',
      studentIcon: 'indigo-400',
      borderColor: 'slate-700',
      buttonFrom: 'blue-600',
      buttonTo: 'indigo-600',
      buttonHoverFrom: 'blue-700',
      buttonHoverTo: 'indigo-700',
      buttonShadow: 'blue-500/30',
    },
    fallbackIcon: GraduationCap,
    stats: [
      { icon: BookOpen, label: 'Modules', colorClass: 'text-blue-400' },
      { icon: GraduationCap, label: 'Lessons', colorClass: 'text-cyan-400' },
      { icon: BookOpen, label: 'Resources', colorClass: 'text-indigo-400' },
    ],
    imagePresentation: { type: '3d-tilt' },
  },
};
