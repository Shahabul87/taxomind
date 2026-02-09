'use client';

import { Fragment, useRef } from 'react';
import { motion, useReducedMotion, useInView } from '@/components/lazy-motion';
import {
  BookOpen,
  Cpu,
  Calculator,
  Code,
  GraduationCap,
  Globe,
  Rocket,
  Sparkles,
  Award,
} from 'lucide-react';

interface Milestone {
  year: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const milestones: Milestone[] = [
  {
    year: '2009',
    title: 'The AI Spark',
    description:
      'Heard about artificial intelligence at a conference during my final year at KUET. Something clicked\u2014the idea that machines could learn captivated me and planted a seed that would grow for 16 years.',
    icon: <Cpu className="w-5 h-5" />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    year: '2010',
    title: 'The Teaching Path',
    description:
      'Graduated top of the EEE department and joined KUET as a lecturer\u2014a rare honor reserved for the department topper. Started digging into AI, enrolled in my MSc, but discovered there were no AI-related courses available.',
    icon: <GraduationCap className="w-5 h-5" />,
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    year: '2012',
    title: 'The Scattered Learning',
    description:
      'Enrolled in edX courses on Python and machine learning alongside teaching. Watched countless YouTube videos. But tracking progress was impossible\u2014content was scattered across channels, and nothing connected.',
    icon: <BookOpen className="w-5 h-5" />,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    year: '2014',
    title: 'The Math Revelation',
    description:
      'Preparing for GRE exposed a devastating truth: despite being first in class, my mathematical intuition was shallow. I had solved problems without truly understanding them. Rebuilding math from scratch changed how I think forever.',
    icon: <Calculator className="w-5 h-5" />,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    year: '2016',
    title: 'The Coding Wall',
    description:
      'After years rebuilding math foundations, returned to AI\u2014only to hit another wall. My EEE background gave me C, but AI demanded Python. Hundreds of tutorials watched, but building anything real felt impossible.',
    icon: <Code className="w-5 h-5" />,
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    year: '2019',
    title: 'PhD Dream Shattered',
    description:
      'Won a fully-funded PhD in Computing in the USA. Everything was processed, flights were booked. Then COVID struck worldwide\u2014the dream was cancelled. I returned to teaching at KUET.',
    icon: <Globe className="w-5 h-5" />,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    year: '2020',
    title: 'The Vision Takes Shape',
    description:
      'Locked down during COVID, I realized years of learning hadn\u2019t built real skills. I couldn\u2019t track anything. The idea crystallized: build a platform where self-learners can create courses, learn systematically, and share knowledge.',
    icon: <Rocket className="w-5 h-5" />,
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    year: '2023',
    title: 'The USA Chapter',
    description:
      'Left Bangladesh after 12 years for a PhD in the US. Built TaxoMind alongside research, coursework, and TA duties\u2014an exhausting but exhilarating journey. AI coding tools became the game-changer.',
    icon: <Sparkles className="w-5 h-5" />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    year: '2025',
    title: 'TaxoMind Is Born',
    description:
      'Sixteen years of struggle, teaching, and coding converged into a single platform\u2014powered by AI and Bloom\u2019s Taxonomy to guide self-learners through real mastery.',
    icon: <Award className="w-5 h-5" />,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
];

/**
 * Bold curved SVG flow arrow connecting consecutive milestones (desktop only).
 * Uses a manually drawn arrowhead (not <marker>) to avoid distortion
 * from preserveAspectRatio="none".
 */
function CurvedFlowArrow({
  direction,
  index,
}: {
  direction: 'left-to-right' | 'right-to-left';
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-40px' });
  const isLTR = direction === 'left-to-right';

  // Curve spans full height of viewBox so it visually touches the cards above/below.
  // viewBox 400×120 with uniform aspect ratio to prevent arrowhead distortion.
  const curvePath = isLTR
    ? 'M 60,0 C 30,50 370,60 340,105'
    : 'M 340,0 C 370,50 30,60 60,105';

  // Arrowhead aligned with curve tangent at the endpoint.
  // LTR ends at (340,105), tangent from (370,60)→(340,105) = (-30,45) normalized ≈ (-0.55,0.83)
  // RTL ends at (60,105), tangent from (30,60)→(60,105) = (30,45) normalized ≈ (0.55,0.83)
  // Tip extends forward along tangent; base wings sit at the curve endpoint.
  const arrowHead = isLTR
    ? 'M 333,115 L 345,108 L 335,101 Z'
    : 'M 67,115 L 55,108 L 65,101 Z';

  const gradId = `flow-grad-${index}`;
  const glowId = `flow-glow-${index}`;

  return (
    <div
      ref={ref}
      className="hidden md:block -my-1"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 120"
        className="w-full overflow-visible"
        style={{ height: 'auto' }}
      >
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={isLTR ? '60' : '340'}
            y1="0"
            x2={isLTR ? '340' : '60'}
            y2="105"
          >
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          <filter id={glowId} x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow layer — wider, softer, behind the main stroke */}
        <motion.path
          d={curvePath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.12"
          filter={`url(#${glowId})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            isInView
              ? { pathLength: 1, opacity: 0.12 }
              : { pathLength: 0, opacity: 0 }
          }
          transition={{
            pathLength: {
              duration: shouldReduceMotion ? 0 : 1,
              delay: shouldReduceMotion ? 0 : 0.1,
              ease: [0.45, 0, 0.15, 1],
            },
            opacity: {
              duration: shouldReduceMotion ? 0 : 0.4,
              delay: shouldReduceMotion ? 0 : 0.1,
            },
          }}
        />

        {/* Main bold stroke */}
        <motion.path
          d={curvePath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            isInView
              ? { pathLength: 1, opacity: 0.85 }
              : { pathLength: 0, opacity: 0 }
          }
          transition={{
            pathLength: {
              duration: shouldReduceMotion ? 0 : 1,
              delay: shouldReduceMotion ? 0 : 0.15,
              ease: [0.45, 0, 0.15, 1],
            },
            opacity: {
              duration: shouldReduceMotion ? 0 : 0.3,
              delay: shouldReduceMotion ? 0 : 0.1,
            },
          }}
        />

        {/* Arrowhead — manually drawn triangle, fades in at end of path animation */}
        <motion.path
          d={arrowHead}
          fill="#7C3AED"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={
            isInView
              ? { opacity: 0.85, scale: 1 }
              : { opacity: 0, scale: 0.5 }
          }
          transition={{
            duration: shouldReduceMotion ? 0 : 0.3,
            delay: shouldReduceMotion ? 0 : 1.05,
            ease: 'easeOut',
          }}
          style={{
            transformOrigin: isLTR ? '338px 108px' : '62px 108px',
          }}
        />
      </svg>
    </div>
  );
}

/** Shared card UI — year integrated into the card */
function MilestoneCard({ milestone }: { milestone: Milestone }) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${milestone.iconBg}`}>
          <span className={milestone.iconColor}>{milestone.icon}</span>
        </div>
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 px-2.5 py-1 rounded-full tracking-wide">
          {milestone.year}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {milestone.title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {milestone.description}
      </p>
    </div>
  );
}

function TimelineMilestone({
  milestone,
  index,
}: {
  milestone: Milestone;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-40px' });
  const isLeft = index % 2 === 0;

  return (
    <div ref={ref} className="relative">
      {/* ── Desktop layout — 2 columns, cards alternate sides ── */}
      <div className="hidden md:grid md:grid-cols-2 gap-x-10 items-start">
        {/* Left column */}
        <div className="min-w-0">
          {isLeft ? (
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={
                isInView
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: -24 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.4,
                ease: 'easeOut',
              }}
            >
              <MilestoneCard milestone={milestone} />
            </motion.div>
          ) : null}
        </div>

        {/* Right column */}
        <div className="min-w-0">
          {!isLeft ? (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={
                isInView
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: 24 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.4,
                ease: 'easeOut',
              }}
            >
              <MilestoneCard milestone={milestone} />
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* ── Mobile: stacked cards with left line ── */}
      <motion.div
        className="md:hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.4,
          ease: 'easeOut',
        }}
      >
        <div className="relative pl-10 border-l-2 border-violet-200 dark:border-violet-800 ml-4">
          {/* Mobile dot */}
          <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 ring-[3px] ring-violet-200/80 dark:ring-violet-800/60" />

          <MilestoneCard milestone={milestone} />
        </div>
      </motion.div>
    </div>
  );
}

export default function StoryJourneyTimeline() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 md:py-32 bg-slate-50/80 dark:bg-slate-900 overflow-hidden"
    >
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.span
            className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-violet-600 dark:text-violet-400 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          >
            The Journey
          </motion.span>
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.3,
              delay: 0.1,
            }}
          >
            16 Years. Two Countries.{' '}
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              One Mission.
            </span>
          </motion.h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="space-y-6 md:space-y-0">
            {milestones.map((milestone, index) => (
              <Fragment key={milestone.year}>
                <TimelineMilestone
                  milestone={milestone}
                  index={index}
                />
                {index < milestones.length - 1 && (
                  <CurvedFlowArrow
                    direction={
                      index % 2 === 0 ? 'left-to-right' : 'right-to-left'
                    }
                    index={index}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
