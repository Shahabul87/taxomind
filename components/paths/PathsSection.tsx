'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATHS_TABS, type TabKey } from '@/lib/paths/data';
import CategoryTabs from './CategoryTabs';
import CourseList from './CourseList';
import DemoCard from './DemoCard';

export default function PathsSection() {
  const [activeTab, setActiveTab] = useState<TabKey>('math');

  const currentTabData = PATHS_TABS.find((tab) => tab.key === activeTab);

  if (!currentTabData) return null;

  return (
    <section className="relative overflow-hidden py-20" aria-labelledby="paths-heading">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* Section Heading with highlight */}
        <div className="mb-16 text-center">
          <h2
            id="paths-heading"
            className="relative inline-block text-[clamp(2rem,5vw,3.75rem)] font-bold tracking-tight text-foreground"
          >
            {/* Background highlight bar */}
            <span
              className="absolute inset-x-0 bottom-2 -z-10 h-4 bg-brand/20"
              aria-hidden="true"
            />
            Guided paths for every journey
          </h2>
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          tabs={PATHS_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-12 gap-10 lg:gap-14"
          >
            {/* Left Column: Course List */}
            <div className="col-span-12 lg:col-span-5">
              <CourseList
                heading={currentTabData.heading}
                courses={currentTabData.courses}
                moreCount={currentTabData.moreCount}
                moreHref={`/${currentTabData.key}/courses`}
              />
            </div>

            {/* Right Column: Demo Card */}
            <div className="col-span-12 lg:col-span-7">
              <DemoCard
                type={currentTabData.demo.type}
                ctaLabel={currentTabData.cta.label}
                ctaHref={currentTabData.cta.href}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
