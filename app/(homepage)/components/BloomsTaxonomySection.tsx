'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLOOMS_LEVELS, type BloomsLevel } from '@/lib/blooms/data';
import { ChevronRight } from 'lucide-react';

export default function BloomsTaxonomySection() {
  const [activeLevel, setActiveLevel] = useState<BloomsLevel>('remember');

  const currentLevel = BLOOMS_LEVELS.find((level) => level.key === activeLevel);

  if (!currentLevel) return null;

  return (
    <section className="relative overflow-hidden py-20 bg-background" aria-labelledby="blooms-heading">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* Section Heading */}
        <div className="mb-16 text-center">
          <h2
            id="blooms-heading"
            className="relative inline-block text-[clamp(2rem,5vw,3.75rem)] font-bold tracking-tight text-foreground"
          >
            <span
              className="absolute inset-x-0 bottom-2 -z-10 h-4 bg-lime-500/20"
              aria-hidden="true"
            />
            Master All 6 Cognitive Levels
          </h2>
        </div>

        {/* Level Tabs */}
        <div
          className="mb-12 flex flex-wrap justify-center gap-3"
          role="tablist"
          aria-label="Bloom's Taxonomy cognitive levels"
        >
          {BLOOMS_LEVELS.map((level) => {
            const isActive = activeLevel === level.key;
            return (
              <button
                key={level.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`level-panel-${level.key}`}
                id={`level-tab-${level.key}`}
                onClick={() => setActiveLevel(level.key)}
                className={`group relative inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r ' + level.color + ' text-white shadow-lg scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {level.icon}
                {level.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLevel}
            role="tabpanel"
            id={`level-panel-${activeLevel}`}
            aria-labelledby={`level-tab-${activeLevel}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-12 gap-10 lg:gap-14"
          >
            {/* Left Column: Description */}
            <div className="col-span-12 lg:col-span-5">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${currentLevel.color}`}>
                    {currentLevel.icon}
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">{currentLevel.label}</h3>
                </div>

                <p className="text-xl text-muted-foreground leading-relaxed">
                  {currentLevel.description}
                </p>

                <div>
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Key Actions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentLevel.examples.map((example) => (
                      <span
                        key={example}
                        className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Card */}
            <div className="col-span-12 lg:col-span-7">
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${currentLevel.color} p-8 lg:p-12 shadow-2xl`}>
                {/* Level Number */}
                <div className="absolute top-4 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-3xl font-bold text-white">
                    {BLOOMS_LEVELS.findIndex((l) => l.key === activeLevel) + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-6 text-white">
                  <h4 className="text-2xl font-bold">Progress to {currentLevel.label}</h4>
                  <p className="text-lg opacity-90">
                    AI-powered exercises designed to help you master this cognitive level through
                    interactive learning experiences.
                  </p>

                  <a
                    href={`/courses?level=${currentLevel.key}`}
                    className="group mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-gray-900 shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  >
                    Start Learning
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
