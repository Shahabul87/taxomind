"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import {
  Brain,
  Lightbulb,
  Target,
  Puzzle,
  FlaskConical,
  Sparkles,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Zap,
  Layers,
  Cpu,
  Network
} from "lucide-react";
import Link from "next/link";
import { HomeNavbar } from "@/app/(homepage)/components/HomeNavbar";
import { HomeFooter } from "@/app/(homepage)/HomeFooter";
import { CognitiveVisualizer } from "./components/CognitiveVisualizer";

// --- Data ---
const taxonomyLevels = [
  {
    level: 1,
    name: "Remember",
    icon: Brain,
    color: "from-violet-500 to-purple-600",
    glowColor: "shadow-purple-500/50",
    accentColor: "text-purple-400",
    description: "Recall facts and basic concepts",
    longDescription: "The foundation of intelligence. Our AI reinforces your memory pathways through smart repetition and active recall, ensuring core concepts are locked in.",
    examples: ["Define terms", "List features", "Identify components"],
    platformFeatures: ["Smart Flashcards", "Recall Quizzes", "Memory Anchors"],
    percentage: 15
  },
  {
    level: 2,
    name: "Understand",
    icon: Lightbulb,
    color: "from-blue-500 to-cyan-500",
    glowColor: "shadow-blue-500/50",
    accentColor: "text-blue-400",
    description: "Explain ideas and concepts",
    longDescription: "True comprehension. We don't just test facts; we verify you can explain complex topics in your own words, building a robust mental model.",
    examples: ["Summarize content", "Explain processes", "Give examples"],
    platformFeatures: ["AI Explanations", "Concept Mapping", "Visual Analogies"],
    percentage: 20
  },
  {
    level: 3,
    name: "Apply",
    icon: Target,
    color: "from-emerald-400 to-green-500",
    glowColor: "shadow-emerald-500/50",
    accentColor: "text-emerald-400",
    description: "Use information in new situations",
    longDescription: "Knowledge in action. We simulate real-world scenarios where you must apply your learning to solve practical, dynamic problems.",
    examples: ["Solve problems", "Apply methods", "Implement solutions"],
    platformFeatures: ["Simulations", "Code Sandboxes", "Scenario Challenges"],
    percentage: 25
  },
  {
    level: 4,
    name: "Analyze",
    icon: Puzzle,
    color: "from-amber-400 to-orange-500",
    glowColor: "shadow-amber-500/50",
    accentColor: "text-amber-400",
    description: "Draw connections among ideas",
    longDescription: "Deep dive. Our analytical tools help you deconstruct complex systems, identify patterns, and understand the 'why' behind the 'what'.",
    examples: ["Compare concepts", "Identify patterns", "Break down problems"],
    platformFeatures: ["Data Analysis", "Pattern Recognition", "System Debugging"],
    percentage: 20
  },
  {
    level: 5,
    name: "Evaluate",
    icon: FlaskConical,
    color: "from-rose-500 to-red-600",
    glowColor: "shadow-rose-500/50",
    accentColor: "text-rose-400",
    description: "Justify decisions and judgments",
    longDescription: "Critical thinking. Learn to critique, defend, and make high-stakes judgments based on evidence, criteria, and standards.",
    examples: ["Critique work", "Make judgments", "Defend positions"],
    platformFeatures: ["Peer Review", "Debate Mode", "Critical Essays"],
    percentage: 15
  },
  {
    level: 6,
    name: "Create",
    icon: Sparkles,
    color: "from-fuchsia-500 to-pink-600",
    glowColor: "shadow-fuchsia-500/50",
    accentColor: "text-fuchsia-400",
    description: "Produce original work",
    longDescription: "The pinnacle. Synthesize everything you've learned to design, build, and invent new solutions. This is where mastery lives.",
    examples: ["Design solutions", "Build projects", "Generate ideas"],
    platformFeatures: ["Project Studio", "Innovation Labs", "Portfolio Builder"],
    percentage: 5
  }
];

// --- Components ---

const GlowingCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
    <div className="relative h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
      {children}
    </div>
  </div>
);

const TechBadge = ({ children, color }: { children: React.ReactNode, color: string }) => (
  <span className={`
    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
    bg-white/5 border border-white/10 ${color} shadow-[0_0_10px_rgba(0,0,0,0.2)]
  `}>
    {children}
  </span>
);

export default function BloomsTaxonomyPage() {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isHoveringStack, setIsHoveringStack] = useState(false);

  const activeLevelData = taxonomyLevels.find(l => l.level === selectedLevel) || taxonomyLevels[0];

  // Scroll animations
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden selection:bg-purple-500/30">
      <HomeNavbar />

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-pink-900/10 rounded-full blur-[100px] animate-pulse-slow delay-2000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <main className="relative z-10 pt-32 pb-20">

        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 mb-32">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative inline-block mb-6"
            >
              <div className="absolute inset-0 bg-purple-500 blur-[40px] opacity-20" />
              <TechBadge color="text-purple-300">
                <Cpu className="w-3 h-3" />
                Cognitive Engine v2.0
              </TechBadge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter"
            >
              The <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                Holographic
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Mind
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12"
            >
              Unlock your full potential with an AI that adapts to your cognitive architecture.
              From basic recall to creative mastery.
            </motion.p>
          </div>
        </section>

        {/* The Holographic Interface */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            {/* Left: 3D Stack Control */}
            <div className="lg:col-span-5 relative h-[600px] flex items-center justify-center perspective-1000">
              <div
                className="relative w-full max-w-md h-[400px] preserve-3d group"
                onMouseEnter={() => setIsHoveringStack(true)}
                onMouseLeave={() => setIsHoveringStack(false)}
              >
                {taxonomyLevels.map((level, index) => {
                  const isActive = selectedLevel === level.level;
                  const isHovered = isHoveringStack;

                  // Calculate 3D positioning
                  const yOffset = index * 40; // Vertical stack spacing
                  const zOffset = isActive ? 50 : 0; // Pop out active card
                  const scale = isActive ? 1.05 : 1;
                  const rotateX = 20; // Tilt for 3D effect

                  return (
                    <motion.div
                      key={level.level}
                      onClick={() => setSelectedLevel(level.level)}
                      initial={{ opacity: 0, y: 100 }}
                      animate={{
                        opacity: 1,
                        y: isHovered ? index * 60 - 100 : index * 15, // Spread on hover
                        z: isActive ? 50 : 0,
                        scale: isActive ? 1.1 : 1,
                        rotateX: isHovered ? 10 : 40, // Flatten on hover
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.1
                      }}
                      className={`
                        absolute left-0 right-0 h-24 
                        cursor-pointer transition-colors duration-300
                        ${isActive ? 'z-50' : `z-${10 + index}`}
                      `}
                      style={{
                        transformStyle: 'preserve-3d',
                        top: 0
                      }}
                    >
                      <div className={`
                        relative h-full rounded-2xl border backdrop-blur-md overflow-hidden
                        flex items-center justify-between px-6
                        transition-all duration-300
                        ${isActive
                          ? `bg-gradient-to-r ${level.color} border-white/50 ${level.glowColor} shadow-[0_0_50px_rgba(0,0,0,0.5)]`
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                        }
                      `}>
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                            <level.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <span className={`text-lg font-bold tracking-wide ${isActive ? 'text-white' : 'text-gray-300'}`}>
                            {level.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-mono ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                            Lvl {level.level}
                          </span>
                          {isActive && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                        </div>

                        {/* Glass Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Platform Base */}
              <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-purple-900/20 to-transparent blur-3xl -z-10" />
            </div>

            {/* Right: Bento Grid HUD */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedLevel}
                  initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Cognitive Visualizer */}
                  <CognitiveVisualizer level={activeLevelData.level} color={activeLevelData.color} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Header Card */}
                    <GlowingCard className="md:col-span-2 !p-8 bg-gradient-to-br from-white/5 to-white/[0.02]">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${activeLevelData.color} shadow-lg`}>
                            <activeLevelData.icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-white mb-1">{activeLevelData.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Layers className="w-4 h-4" />
                              <span>Taxonomy Level {activeLevelData.level}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${activeLevelData.color}`}>
                            {activeLevelData.percentage}%
                          </span>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Focus Area</p>
                        </div>
                      </div>
                      <p className="text-lg text-gray-300 leading-relaxed">
                        {activeLevelData.longDescription}
                      </p>
                    </GlowingCard>

                    {/* Features Card */}
                    <GlowingCard>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Platform Capabilities
                      </h3>
                      <ul className="space-y-3">
                        {activeLevelData.platformFeatures.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-300">
                            <CheckCircle2 className={`w-5 h-5 ${activeLevelData.accentColor}`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </GlowingCard>

                    {/* Outcomes Card */}
                    <GlowingCard>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                        <Target className="w-5 h-5 text-blue-400" />
                        Learning Outcomes
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {activeLevelData.examples.map((example, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-gray-300"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </GlowingCard>

                    {/* AI Integration Card */}
                    <GlowingCard className="md:col-span-2 flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-white/5 border border-white/10">
                          <Network className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">AI-Powered Adaptation</h4>
                          <p className="text-sm text-gray-400">The engine automatically adjusts content to this level.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                    </GlowingCard>
                  </div>

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent" />

          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to Upgrade Your Mind?
            </h2>
            <Link href="/get-started">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold text-lg overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </Link>
          </div>
        </section>

      </main>
      <HomeFooter />
    </div>
  );
}
