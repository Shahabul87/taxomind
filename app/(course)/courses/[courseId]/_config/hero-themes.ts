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

export interface HeroGlowConfig {
  topRight: string;
  bottomLeft: string;
  shadowReflection?: string;
  layerGradient1?: string;
  layerGradient2?: string;
  accentGradient?: string;
  iconCircleBg?: string;
}

export interface HeroThemeConfig {
  gradient: string;
  pattern: ComponentType;

  glowColors: HeroGlowConfig;

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
    instructorTextHalf: string;
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
    glowColors: {
      topRight: 'bg-cyan-500/20',
      bottomLeft: 'bg-blue-500/20',
      shadowReflection: 'from-blue-500/10',
    },
    colors: {
      breadcrumbText: 'text-blue-200/70',
      breadcrumbHover: 'hover:text-blue-200',
      breadcrumbActive: 'text-blue-200',
      subtitle: 'text-blue-200',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-100',
      badgeBorder: 'border-blue-400/30',
      imageBorder: 'border-blue-400/30',
      imageOverlay: 'from-blue-900/60',
      instructorRing: 'ring-blue-400/30',
      instructorBg: 'bg-blue-500/20',
      instructorText: 'text-blue-300',
      instructorTextHalf: 'text-blue-300/50',
      instructorLabel: 'text-blue-200/70',
      studentIcon: 'text-cyan-400',
      borderColor: 'border-blue-400/20',
      buttonFrom: 'from-blue-600',
      buttonTo: 'to-cyan-600',
      buttonHoverFrom: 'hover:from-blue-700',
      buttonHoverTo: 'hover:to-cyan-700',
      buttonShadow: 'shadow-blue-500/30',
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
    glowColors: {
      topRight: 'bg-purple-500/20',
      bottomLeft: 'bg-pink-500/20',
      shadowReflection: 'from-pink-500/10',
      layerGradient1: 'from-purple-500/20 to-pink-500/10',
      layerGradient2: 'from-pink-500/15 to-purple-500/5',
    },
    colors: {
      breadcrumbText: 'text-purple-200/70',
      breadcrumbHover: 'hover:text-purple-200',
      breadcrumbActive: 'text-purple-200',
      subtitle: 'text-purple-200',
      badgeBg: 'bg-purple-500/20',
      badgeText: 'text-purple-100',
      badgeBorder: 'border-purple-400/30',
      imageBorder: 'border-purple-400/30',
      imageOverlay: 'from-purple-900/60',
      instructorRing: 'ring-purple-400/30',
      instructorBg: 'bg-purple-500/20',
      instructorText: 'text-purple-300',
      instructorTextHalf: 'text-purple-300/50',
      instructorLabel: 'text-purple-200/70',
      studentIcon: 'text-pink-400',
      borderColor: 'border-purple-400/20',
      buttonFrom: 'from-purple-600',
      buttonTo: 'to-pink-600',
      buttonHoverFrom: 'hover:from-purple-700',
      buttonHoverTo: 'hover:to-pink-700',
      buttonShadow: 'shadow-purple-500/30',
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
    glowColors: {
      topRight: 'bg-emerald-500/20',
      bottomLeft: 'bg-teal-500/20',
      shadowReflection: 'from-teal-500/10',
    },
    colors: {
      breadcrumbText: 'text-emerald-200/70',
      breadcrumbHover: 'hover:text-emerald-200',
      breadcrumbActive: 'text-emerald-200',
      subtitle: 'text-emerald-200',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-100',
      badgeBorder: 'border-emerald-400/30',
      imageBorder: 'border-emerald-400/30',
      imageOverlay: 'from-emerald-900/60',
      instructorRing: 'ring-emerald-400/30',
      instructorBg: 'bg-emerald-500/20',
      instructorText: 'text-emerald-300',
      instructorTextHalf: 'text-emerald-300/50',
      instructorLabel: 'text-emerald-200/70',
      studentIcon: 'text-teal-400',
      borderColor: 'border-emerald-400/20',
      buttonFrom: 'from-emerald-600',
      buttonTo: 'to-teal-600',
      buttonHoverFrom: 'hover:from-emerald-700',
      buttonHoverTo: 'hover:to-teal-700',
      buttonShadow: 'shadow-emerald-500/30',
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
    glowColors: {
      topRight: 'bg-pink-500/20',
      bottomLeft: 'bg-purple-500/20',
      shadowReflection: 'from-purple-500/10',
      accentGradient: 'from-pink-500/30 to-purple-500/20',
      iconCircleBg: 'bg-pink-500/20 border-pink-400/30',
    },
    colors: {
      breadcrumbText: 'text-pink-200/70',
      breadcrumbHover: 'hover:text-pink-200',
      breadcrumbActive: 'text-pink-200',
      subtitle: 'text-pink-200',
      badgeBg: 'bg-pink-500/20',
      badgeText: 'text-pink-100',
      badgeBorder: 'border-pink-400/30',
      imageBorder: 'border-pink-400/30',
      imageOverlay: 'from-pink-900/60',
      instructorRing: 'ring-pink-400/30',
      instructorBg: 'bg-pink-500/20',
      instructorText: 'text-pink-300',
      instructorTextHalf: 'text-pink-300/50',
      instructorLabel: 'text-pink-200/70',
      studentIcon: 'text-rose-400',
      borderColor: 'border-pink-400/20',
      buttonFrom: 'from-pink-600',
      buttonTo: 'to-purple-600',
      buttonHoverFrom: 'hover:from-pink-700',
      buttonHoverTo: 'hover:to-purple-700',
      buttonShadow: 'shadow-pink-500/30',
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
    glowColors: {
      topRight: 'bg-blue-500/20',
      bottomLeft: 'bg-indigo-500/20',
      shadowReflection: 'from-indigo-500/10',
    },
    colors: {
      breadcrumbText: 'text-blue-200/70',
      breadcrumbHover: 'hover:text-blue-200',
      breadcrumbActive: 'text-blue-200',
      subtitle: 'text-blue-200',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-100',
      badgeBorder: 'border-blue-400/30',
      imageBorder: 'border-indigo-400/30',
      imageOverlay: 'from-indigo-900/60',
      instructorRing: 'ring-indigo-400/30',
      instructorBg: 'bg-indigo-500/20',
      instructorText: 'text-blue-300',
      instructorTextHalf: 'text-blue-300/50',
      instructorLabel: 'text-blue-200/70',
      studentIcon: 'text-cyan-400',
      borderColor: 'border-indigo-400/20',
      buttonFrom: 'from-blue-600',
      buttonTo: 'to-indigo-600',
      buttonHoverFrom: 'hover:from-blue-700',
      buttonHoverTo: 'hover:to-indigo-700',
      buttonShadow: 'shadow-blue-500/30',
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
    glowColors: {
      topRight: 'bg-amber-500/10',
      bottomLeft: 'bg-amber-600/10',
    },
    colors: {
      breadcrumbText: 'text-amber-200/70',
      breadcrumbHover: 'hover:text-amber-200',
      breadcrumbActive: 'text-amber-200',
      subtitle: 'text-amber-200',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-100',
      badgeBorder: 'border-amber-400/30',
      imageBorder: 'border-amber-600/20',
      imageOverlay: 'from-slate-900/80',
      instructorRing: 'ring-amber-400/30',
      instructorBg: 'bg-amber-500/15',
      instructorText: 'text-amber-300',
      instructorTextHalf: 'text-amber-300/50',
      instructorLabel: 'text-amber-200/70',
      studentIcon: 'text-amber-400',
      borderColor: 'border-amber-400/20',
      buttonFrom: 'from-amber-700',
      buttonTo: 'to-orange-700',
      buttonHoverFrom: 'hover:from-amber-800',
      buttonHoverTo: 'hover:to-orange-800',
      buttonShadow: 'shadow-amber-500/30',
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
    glowColors: {
      topRight: 'bg-orange-500/20',
      bottomLeft: 'bg-rose-500/20',
      shadowReflection: 'from-rose-500/10',
    },
    colors: {
      breadcrumbText: 'text-orange-200/70',
      breadcrumbHover: 'hover:text-orange-200',
      breadcrumbActive: 'text-orange-200',
      subtitle: 'text-orange-200',
      badgeBg: 'bg-orange-500/15',
      badgeText: 'text-orange-100',
      badgeBorder: 'border-orange-400/30',
      imageBorder: 'border-orange-400/30',
      imageOverlay: 'from-slate-900/80',
      instructorRing: 'ring-orange-400/30',
      instructorBg: 'bg-orange-500/15',
      instructorText: 'text-orange-300',
      instructorTextHalf: 'text-orange-300/50',
      instructorLabel: 'text-orange-200/70',
      studentIcon: 'text-rose-400',
      borderColor: 'border-orange-400/20',
      buttonFrom: 'from-orange-600',
      buttonTo: 'to-rose-600',
      buttonHoverFrom: 'hover:from-orange-700',
      buttonHoverTo: 'hover:to-rose-700',
      buttonShadow: 'shadow-orange-500/30',
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
    glowColors: {
      topRight: 'bg-blue-500/20',
      bottomLeft: 'bg-indigo-500/20',
      shadowReflection: 'from-indigo-500/10',
    },
    colors: {
      breadcrumbText: 'text-slate-400',
      breadcrumbHover: 'hover:text-slate-300',
      breadcrumbActive: 'text-slate-300',
      subtitle: 'text-blue-200',
      badgeBg: 'bg-slate-700/50',
      badgeText: 'text-slate-200',
      badgeBorder: 'border-slate-600',
      imageBorder: 'border-slate-700/50',
      imageOverlay: 'from-slate-900/80',
      instructorRing: 'ring-slate-600',
      instructorBg: 'bg-slate-700',
      instructorText: 'text-slate-400',
      instructorTextHalf: 'text-slate-400/50',
      instructorLabel: 'text-slate-400',
      studentIcon: 'text-indigo-400',
      borderColor: 'border-slate-700',
      buttonFrom: 'from-blue-600',
      buttonTo: 'to-indigo-600',
      buttonHoverFrom: 'hover:from-blue-700',
      buttonHoverTo: 'hover:to-indigo-700',
      buttonShadow: 'shadow-blue-500/30',
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
