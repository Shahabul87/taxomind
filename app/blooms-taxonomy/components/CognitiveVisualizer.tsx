"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface CognitiveVisualizerProps {
    level: number;
    color: string;
}

export const CognitiveVisualizer = ({ level, color }: CognitiveVisualizerProps) => {
    // Extract tailwind color class to hex/rgba for SVG if needed, 
    // but for now we'll use currentColor or specific classes.

    return (
        <div className="relative w-full h-64 md:h-80 bg-black/20 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />

            <AnimatePresence mode="wait">
                {level === 1 && <RememberViz key="remember" color={color} />}
                {level === 2 && <UnderstandViz key="understand" color={color} />}
                {level === 3 && <ApplyViz key="apply" color={color} />}
                {level === 4 && <AnalyzeViz key="analyze" color={color} />}
                {level === 5 && <EvaluateViz key="evaluate" color={color} />}
                {level === 6 && <CreateViz key="create" color={color} />}
            </AnimatePresence>

            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent animate-scan" />
        </div>
    );
};

// --- Level 1: Remember (Neural Network) ---
const RememberViz = ({ color }: { color: string }) => {
    const nodes = Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: Math.random() * 140 - 70,
    }));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex items-center justify-center"
        >
            <svg width="300" height="200" viewBox="-150 -100 300 200" className="overflow-visible">
                {/* Connections */}
                {nodes.map((node, i) => (
                    nodes.slice(i + 1).map((target, j) => (
                        <motion.line
                            key={`${i}-${j}`}
                            x1={node.x}
                            y1={node.y}
                            x2={target.x}
                            y2={target.y}
                            stroke="currentColor"
                            strokeWidth="1"
                            className={`${color.replace('from-', 'text-').replace('to-', '')} opacity-20`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: [0, 1, 1, 0],
                                opacity: [0, 0.3, 0.3, 0]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: "linear"
                            }}
                        />
                    ))
                ))}
                {/* Nodes */}
                {nodes.map((node, i) => (
                    <motion.circle
                        key={i}
                        cx={node.x}
                        cy={node.y}
                        r="4"
                        className={`${color.replace('from-', 'fill-').replace('to-', '')}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </svg>
        </motion.div>
    );
};

// --- Level 2: Understand (Pattern Synthesis) ---
const UnderstandViz = ({ color }: { color: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
        >
            <svg width="300" height="200" viewBox="-150 -100 300 200" className="overflow-visible">
                {/* Chaotic particles organizing into a grid */}
                {Array.from({ length: 9 }).map((_, i) => {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const targetX = (col - 1) * 40;
                    const targetY = (row - 1) * 40;

                    return (
                        <motion.rect
                            key={i}
                            width="20"
                            height="20"
                            rx="4"
                            x={-10}
                            y={-10}
                            className={`${color.replace('from-', 'fill-').replace('to-', '')} opacity-80`}
                            initial={{
                                x: (Math.random() - 0.5) * 200,
                                y: (Math.random() - 0.5) * 150,
                                rotate: Math.random() * 360,
                                opacity: 0
                            }}
                            animate={{
                                x: targetX,
                                y: targetY,
                                rotate: 0,
                                opacity: 1
                            }}
                            transition={{
                                duration: 1.5,
                                ease: "backOut",
                                delay: i * 0.1
                            }}
                        />
                    );
                })}
                {/* Connecting lines appearing after organization */}
                <motion.path
                    d="M-40 -40 H40 M-40 0 H40 M-40 40 H40 M-40 -40 V40 M0 -40 V40 M40 -40 V40"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/20"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                />
            </svg>
        </motion.div>
    );
};

// --- Level 3: Apply (Process Flow) ---
const ApplyViz = ({ color }: { color: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <svg width="300" height="200" viewBox="-150 -100 300 200" className="overflow-visible">
                {/* Input Particles */}
                <motion.circle cx="-100" cy="0" r="8" className="fill-white/50"
                    animate={{ x: [0, 60], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.circle cx="-100" cy="0" r="8" className="fill-white/50"
                    animate={{ x: [0, 60], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1, ease: "linear" }}
                />

                {/* Central Processor (Gear) */}
                <motion.g animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                    <circle cx="0" cy="0" r="30" className="stroke-white/20 fill-transparent" strokeWidth="4" strokeDasharray="10 5" />
                    <circle cx="0" cy="0" r="15" className={`${color.replace('from-', 'fill-').replace('to-', '')}`} />
                </motion.g>

                {/* Output Particles (Transformed) */}
                <motion.rect x="40" y="-8" width="16" height="16" rx="4" className={`${color.replace('from-', 'fill-').replace('to-', '')}`}
                    animate={{ x: [0, 60], opacity: [0, 1, 0], rotate: [0, 90] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "linear" }}
                />
            </svg>
        </motion.div>
    );
};

// --- Level 4: Analyze (Deconstruction) ---
const AnalyzeViz = ({ color }: { color: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <svg width="300" height="200" viewBox="-150 -100 300 200" className="overflow-visible">
                {/* Central Cube Parts */}
                <motion.g>
                    {/* Top Left */}
                    <motion.rect x="-20" y="-20" width="30" height="30" rx="4"
                        className={`${color.replace('from-', 'fill-').replace('to-', '')} opacity-80`}
                        animate={{ x: [-20, -40, -20], y: [-20, -40, -20] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Top Right */}
                    <motion.rect x="15" y="-20" width="30" height="30" rx="4"
                        className="fill-white/20"
                        animate={{ x: [15, 35, 15], y: [-20, -40, -20] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Bottom Left */}
                    <motion.rect x="-20" y="15" width="30" height="30" rx="4"
                        className="fill-white/20"
                        animate={{ x: [-20, -40, -20], y: [15, 35, 15] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Bottom Right */}
                    <motion.rect x="15" y="15" width="30" height="30" rx="4"
                        className={`${color.replace('from-', 'fill-').replace('to-', '')} opacity-80`}
                        animate={{ x: [15, 35, 15], y: [15, 35, 15] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Connecting Lines showing relationships */}
                    <motion.line x1="0" y1="0" x2="0" y2="0" stroke="currentColor" strokeWidth="2" className="text-white/30"
                        animate={{ x1: -25, y1: -25, x2: 25, y2: 25 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.line x1="0" y1="0" x2="0" y2="0" stroke="currentColor" strokeWidth="2" className="text-white/30"
                        animate={{ x1: 25, y1: -25, x2: -25, y2: 25 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.g>
            </svg>
        </motion.div>
    );
};

// --- Level 5: Evaluate (The Filter) ---
const EvaluateViz = ({ color }: { color: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <svg width="300" height="200" viewBox="-150 -100 300 200" className="overflow-visible">
                {/* The Gate/Scale */}
                <path d="M-10 -40 L-10 40" stroke="currentColor" strokeWidth="4" className="text-white/20" />

                {/* Items Passing Through */}
                <motion.circle cx="-100" cy="0" r="10" className="fill-white/50"
                    animate={{ cx: [-100, 20], opacity: [0, 1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Valid Item (Green Check) */}
                <motion.g animate={{ opacity: [0, 0, 1, 0], x: [0, 0, 60, 80] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <circle cx="20" cy="0" r="10" className={`${color.replace('from-', 'fill-').replace('to-', '')}`} />
                    <path d="M16 0 L19 3 L24 -2" stroke="white" strokeWidth="2" fill="none" />
                </motion.g>

                {/* Rejected Item (Red X) - Animated separately to simulate filtering */}
                <motion.g animate={{ opacity: [0, 0, 1, 0], y: [0, 0, 40, 60], x: [0, 0, 0, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1, ease: "linear" }}>
                    <circle cx="-20" cy="0" r="10" className="fill-red-500/50" />
                    <path d="M-23 -3 L-17 3 M-23 3 L-17 -3" stroke="white" strokeWidth="2" fill="none" />
                </motion.g>
            </svg>
        </motion.div>
    );
};

// --- Level 6: Create (Synthesis) ---
const CreateViz = ({ color }: { color: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <svg width="300" height="200" viewBox="-150 -100 300 200" className="overflow-visible">
                {/* Swirling Particles */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <motion.circle
                        key={i}
                        r="4"
                        className="fill-white/50"
                        animate={{
                            cx: [Math.cos(i) * 60, 0],
                            cy: [Math.sin(i) * 60, 0],
                            opacity: [1, 0]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeIn" }}
                    />
                ))}

                {/* Central Core Explosion */}
                <motion.circle
                    cx="0"
                    cy="0"
                    r="20"
                    className={`${color.replace('from-', 'fill-').replace('to-', '')}`}
                    animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Radiating Rings */}
                <motion.circle
                    cx="0"
                    cy="0"
                    r="30"
                    className="fill-none stroke-white/30"
                    strokeWidth="1"
                    animate={{ scale: [1, 2], opacity: [1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.circle
                    cx="0"
                    cy="0"
                    r="30"
                    className="fill-none stroke-white/30"
                    strokeWidth="1"
                    animate={{ scale: [1, 2], opacity: [1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
                />
            </svg>
        </motion.div>
    );
};
