"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface CognitiveNode {
  id: string;
  level: string;
  cx: number;
  cy: number;
  color: string;
}

const bloomsLevels: CognitiveNode[] = [
  { id: "remember", level: "Remember", cx: 250, cy: 180, color: "#9333ea" }, // purple-600
  { id: "understand", level: "Understand", cx: 350, cy: 200, color: "#7c3aed" }, // violet-600
  { id: "apply", level: "Apply", cx: 300, cy: 280, color: "#6366f1" }, // indigo-500
  { id: "analyze", level: "Analyze", cx: 220, cy: 320, color: "#4f46e5" }, // indigo-600
  { id: "evaluate", level: "Evaluate", cx: 350, cy: 360, color: "#3b82f6" }, // blue-500
  { id: "create", level: "Create", cx: 300, cy: 440, color: "#2563eb" }, // blue-600
];

interface NeuralConnection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}

const neuralConnections: NeuralConnection[] = [
  { x1: 250, y1: 180, x2: 350, y2: 200, delay: 0 },
  { x1: 350, y1: 200, x2: 300, y2: 280, delay: 0.2 },
  { x1: 300, y1: 280, x2: 220, y2: 320, delay: 0.4 },
  { x1: 220, y1: 320, x2: 350, y2: 360, delay: 0.6 },
  { x1: 350, y1: 360, x2: 300, y2: 440, delay: 0.8 },
  { x1: 250, y1: 180, x2: 300, y2: 280, delay: 0.3 },
  { x1: 300, y1: 280, x2: 350, y2: 360, delay: 0.5 },
  { x1: 220, y1: 320, x2: 300, y2: 440, delay: 0.7 },
];

interface DataParticle {
  id: number;
  startX: number;
  startY: number;
  delay: number;
}

const dataParticles: DataParticle[] = [
  { id: 1, startX: 300, startY: 500, delay: 0 },
  { id: 2, startX: 250, startY: 480, delay: 0.5 },
  { id: 3, startX: 350, startY: 490, delay: 1 },
  { id: 4, startX: 280, startY: 510, delay: 1.5 },
];

export const BrainIllustration: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 600 600"
      className="w-full h-auto max-w-[600px] mx-auto"
      role="img"
      aria-labelledby="brain-illustration-title brain-illustration-desc"
    >
      <title id="brain-illustration-title">AI-Powered Learning Brain</title>
      <desc id="brain-illustration-desc">
        Interactive brain visualization showing Bloom&apos;s Taxonomy six cognitive levels: Remember,
        Understand, Apply, Analyze, Evaluate, and Create, connected by neural pathways.
      </desc>

      {/* Gradient Definitions */}
      <defs aria-hidden="true">
        <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333ea" /> {/* purple-600 */}
          <stop offset="50%" stopColor="#6366f1" /> {/* indigo-500 */}
          <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
        </linearGradient>

        <linearGradient id="brainGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" /> {/* purple-400 */}
          <stop offset="50%" stopColor="#818cf8" /> {/* indigo-400 */}
          <stop offset="100%" stopColor="#60a5fa" /> {/* blue-400 */}
        </linearGradient>

        <linearGradient id="neuralGradient">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
        </linearGradient>

        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Main Brain Outline - Left Hemisphere */}
      <g aria-hidden="true">
        <motion.path
          d="M200,150 Q150,200 150,280 Q150,350 180,400 Q200,430 240,450 Q280,470 300,480 L300,120 Q260,130 230,140 Q200,145 200,150 Z"
          fill="url(#brainGradient)"
          fillOpacity="0.1"
          stroke="url(#brainGradient)"
          strokeWidth="2"
          className="dark:fill-[url(#brainGradientDark)] dark:stroke-[url(#brainGradientDark)]"
          style={{ willChange: 'opacity' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 0.1 } : { pathLength: 1, opacity: 0.1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Main Brain Outline - Right Hemisphere */}
        <motion.path
          d="M400,150 Q450,200 450,280 Q450,350 420,400 Q400,430 360,450 Q320,470 300,480 L300,120 Q340,130 370,140 Q400,145 400,150 Z"
          fill="url(#brainGradient)"
          fillOpacity="0.1"
          stroke="url(#brainGradient)"
          strokeWidth="2"
          className="dark:fill-[url(#brainGradientDark)] dark:stroke-[url(#brainGradientDark)]"
          style={{ willChange: 'opacity' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 0.1 } : { pathLength: 1, opacity: 0.1 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
        />

        {/* Cerebellum */}
        <motion.ellipse
          cx="300"
          cy="500"
          rx="80"
          ry="40"
          fill="url(#brainGradient)"
          fillOpacity="0.08"
          stroke="url(#brainGradient)"
          strokeWidth="2"
          className="dark:fill-[url(#brainGradientDark)] dark:stroke-[url(#brainGradientDark)]"
          style={{ willChange: 'transform, opacity' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 0.08 } : { scale: 1, opacity: 0.08 }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        {/* Corpus Callosum - Connection between hemispheres */}
        <motion.path
          d="M280,200 Q300,210 320,200 M280,260 Q300,270 320,260 M280,320 Q300,330 320,320"
          fill="none"
          stroke="url(#brainGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="dark:stroke-[url(#brainGradientDark)]"
          style={{ willChange: 'opacity' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 0.5 } : { pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />

        {/* Neural Network Connections */}
        <g className="neural-connections" opacity="0.6">
          {neuralConnections.map((connection, index) => (
            <motion.line
              key={`connection-${index}`}
              x1={connection.x1}
              y1={connection.y1}
              x2={connection.x2}
              y2={connection.y2}
              stroke="url(#neuralGradient)"
              strokeWidth="2"
              strokeDasharray="5,5"
              style={{ willChange: 'opacity' }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                shouldReduceMotion
                  ? { opacity: 0.6 }
                  : {
                      pathLength: 1,
                      opacity: 0.6,
                      strokeDashoffset: [0, -10],
                    }
              }
              transition={{
                pathLength: { duration: 1, delay: connection.delay },
                opacity: { duration: 0.5, delay: connection.delay },
                strokeDashoffset: shouldReduceMotion
                  ? {}
                  : { duration: 2, repeat: Infinity, ease: "linear" },
              }}
            />
          ))}
        </g>
      </g>

      {/* Cognitive Nodes (Bloom's 6 Levels) - Semantic Layer */}
      <g className="cognitive-nodes" role="list" aria-label="Bloom's Taxonomy cognitive levels">
        {bloomsLevels.map((node, index) => (
          <g key={node.id} role="listitem">
            {/* Glow Effect - Decorative */}
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r="20"
              fill="url(#glowGradient)"
              aria-hidden="true"
              style={{ willChange: 'transform, opacity' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                shouldReduceMotion
                  ? { scale: 1, opacity: 0.3 }
                  : {
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0.5, delay: index * 0.15 }
                  : {
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.15,
                    }
              }
            />

            {/* Main Node - Decorative */}
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r="12"
              fill={node.color}
              opacity="0.9"
              aria-hidden="true"
              style={{ willChange: 'transform' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                duration: 0.8,
                delay: 1 + index * 0.1,
              }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.3 }}
            >
              {!shouldReduceMotion && (
                <animate attributeName="r" values="12;14;12" dur="3s" repeatCount="indefinite" />
              )}
            </motion.circle>

            {/* Node Label - Accessible Text */}
            <motion.text
              x={node.cx}
              y={node.cy - 20}
              textAnchor="middle"
              className="text-xs font-semibold fill-slate-700 dark:fill-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.5 + index * 0.1 }}
              aria-label={`${node.level} level`}
            >
              {node.level}
            </motion.text>
          </g>
        ))}
      </g>

      {/* Floating Data Particles - Decorative */}
      {!shouldReduceMotion && (
        <g className="particles" aria-hidden="true">
          {dataParticles.map((particle) => (
            <motion.circle
              key={`particle-${particle.id}`}
              cx={particle.startX}
              cy={particle.startY}
              r="3"
              fill="#a78bfa"
              style={{ willChange: 'transform, opacity' }}
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{
                y: [-50, -100, -150],
                opacity: [1, 0.5, 0],
                scale: [1, 1.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </g>
      )}

        {/* Brain Stem */}
        <motion.path
          d="M285,480 Q290,520 295,550 L305,550 Q310,520 315,480 Z"
          fill="url(#brainGradient)"
          fillOpacity="0.15"
          stroke="url(#brainGradient)"
          strokeWidth="2"
          className="dark:fill-[url(#brainGradientDark)] dark:stroke-[url(#brainGradientDark)]"
          style={{ willChange: 'opacity' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 0.15 } : { pathLength: 1, opacity: 0.15 }}
          transition={{ duration: 1, delay: 1.2 }}
        />

        {/* Sulci and Gyri (Brain folds) - Left Hemisphere */}
        <g opacity="0.4">
          <motion.path
            d="M180,200 Q190,210 180,220 M190,240 Q200,250 190,260 M170,280 Q180,290 170,300"
            fill="none"
            stroke="url(#brainGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="dark:stroke-[url(#brainGradientDark)]"
            style={{ willChange: 'opacity' }}
            initial={{ pathLength: 0 }}
            animate={shouldReduceMotion ? {} : { pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1 }}
          />
        </g>

        {/* Sulci and Gyri - Right Hemisphere */}
        <g opacity="0.4">
          <motion.path
            d="M420,200 Q410,210 420,220 M410,240 Q400,250 410,260 M430,280 Q420,290 430,300"
            fill="none"
            stroke="url(#brainGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="dark:stroke-[url(#brainGradientDark)]"
            style={{ willChange: 'opacity' }}
            initial={{ pathLength: 0 }}
            animate={shouldReduceMotion ? {} : { pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.1 }}
          />
        </g>

      {/* Pulse Animation - Central Brain Activity */}
      {!shouldReduceMotion && (
        <motion.circle
          cx="300"
          cy="300"
          r="150"
          fill="none"
          stroke="url(#brainGradient)"
          strokeWidth="1"
          opacity="0"
          aria-hidden="true"
          style={{ willChange: 'transform, opacity' }}
          animate={{
            r: [100, 200],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
    </svg>
  );
};
