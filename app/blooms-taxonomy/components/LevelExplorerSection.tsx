"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, CheckCircle2 } from "lucide-react";
import { CognitiveVisualizer } from "./CognitiveVisualizer";
import { taxonomyLevels } from "../data/blooms-data";

export const LevelExplorerSection = () => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isHoveringStack, setIsHoveringStack] = useState(false);

  const activeLevelData = taxonomyLevels.find((l) => l.level === selectedLevel) ?? taxonomyLevels[0];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300 font-medium">The 6 Levels</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bloom&apos;s Cognitive Hierarchy
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto">
            Click any level to explore its cognitive depth and learning outcomes.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: 3D Stack */}
          <div className="relative h-[450px] flex items-center justify-center perspective-1000">
            <div
              className="relative w-full max-w-sm h-[350px] preserve-3d"
              onMouseEnter={() => setIsHoveringStack(true)}
              onMouseLeave={() => setIsHoveringStack(false)}
            >
              {taxonomyLevels.map((level, index) => {
                const isActive = selectedLevel === level.level;

                return (
                  <motion.div
                    key={level.level}
                    onClick={() => setSelectedLevel(level.level)}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{
                      opacity: 1,
                      y: isHoveringStack ? index * 55 - 80 : index * 12,
                      z: isActive ? 50 : 0,
                      scale: isActive ? 1.08 : 1,
                      rotateX: isHoveringStack ? 8 : 35,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.08,
                    }}
                    className={`
                      absolute left-0 right-0 h-20
                      cursor-pointer transition-colors duration-300
                      ${isActive ? "z-50" : `z-${10 + index}`}
                    `}
                    style={{ transformStyle: "preserve-3d", top: 0 }}
                  >
                    <div
                      className={`
                      relative h-full rounded-xl border backdrop-blur-md overflow-hidden
                      flex items-center justify-between px-5
                      transition-all duration-300
                      ${
                        isActive
                          ? `bg-gradient-to-r ${level.color} border-white/50 shadow-lg`
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }
                    `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? "bg-white/20" : "bg-white/5"}`}>
                          <level.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                        </div>
                        <span className={`font-semibold ${isActive ? "text-white" : "text-gray-300"}`}>
                          {level.name}
                        </span>
                      </div>
                      <span className={`text-sm font-mono ${isActive ? "text-white/80" : "text-gray-500"}`}>
                        L{level.level}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: Level Details */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedLevel}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Visualizer */}
                <CognitiveVisualizer level={activeLevelData.level} color={activeLevelData.color} />

                {/* Level Info Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${activeLevelData.color}`}>
                      <activeLevelData.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{activeLevelData.name}</h3>
                      <p className="text-sm text-gray-400">Level {activeLevelData.level} of 6</p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-5 leading-relaxed">
                    {activeLevelData.longDescription}
                  </p>

                  {/* Key Verbs */}
                  <div className="mb-5">
                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Key Cognitive Verbs
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeLevelData.cognitiveVerbs.slice(0, 6).map((verb, i) => (
                        <span
                          key={i}
                          className={`px-2.5 py-1 rounded-md text-sm bg-white/5 border border-white/10 ${activeLevelData.accentColor}`}
                        >
                          {verb}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Platform Features */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                      What You&apos;ll Do
                    </h4>
                    <ul className="space-y-2">
                      {activeLevelData.platformFeatures.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                          <CheckCircle2 className={`w-4 h-4 ${activeLevelData.accentColor}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
