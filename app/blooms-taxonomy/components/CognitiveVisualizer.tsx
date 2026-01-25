"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CognitiveVisualizerProps {
    level: number;
    color: string;
}

// Map gradient strings to actual hex colors
const colorMap: Record<string, string> = {
    "from-violet-500 to-purple-600": "#8b5cf6",
    "from-blue-500 to-cyan-500": "#3b82f6",
    "from-emerald-400 to-green-500": "#34d399",
    "from-amber-400 to-orange-500": "#fbbf24",
    "from-rose-500 to-red-600": "#f43f5e",
    "from-fuchsia-500 to-pink-600": "#d946ef",
};

const getHexColor = (color: string): string => {
    return colorMap[color] || "#a855f7"; // Default purple
};

export const CognitiveVisualizer = ({ level, color }: CognitiveVisualizerProps) => {
    const hexColor = getHexColor(color);

    return (
        <div className="relative w-full h-48 md:h-56 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
                {level === 1 && <RememberViz key="remember" color={hexColor} />}
                {level === 2 && <UnderstandViz key="understand" color={hexColor} />}
                {level === 3 && <ApplyViz key="apply" color={hexColor} />}
                {level === 4 && <AnalyzeViz key="analyze" color={hexColor} />}
                {level === 5 && <EvaluateViz key="evaluate" color={hexColor} />}
                {level === 6 && <CreateViz key="create" color={hexColor} />}
            </AnimatePresence>
        </div>
    );
};

// --- Level 1: Remember (Neural Network) ---
const RememberViz = ({ color }: { color: string }) => {
    const nodes = [
        { x: -60, y: -30 }, { x: 0, y: -50 }, { x: 60, y: -30 },
        { x: -80, y: 20 }, { x: -20, y: 30 }, { x: 40, y: 20 }, { x: 80, y: 40 },
    ];

    return (
        <motion.svg
            width="280" height="160" viewBox="-140 -80 280 160"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Connections */}
            {nodes.map((node, i) =>
                nodes.slice(i + 1).map((target, j) => (
                    <motion.line
                        key={`${i}-${j}`}
                        x1={node.x} y1={node.y}
                        x2={target.x} y2={target.y}
                        stroke={color}
                        strokeWidth="2"
                        strokeOpacity="0.4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: [0, 1, 1, 0], strokeOpacity: [0.2, 0.6, 0.6, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity, delay: (i + j) * 0.15 }}
                    />
                ))
            )}
            {/* Nodes */}
            {nodes.map((node, i) => (
                <motion.circle
                    key={i}
                    cx={node.x} cy={node.y} r="10"
                    fill={color}
                    initial={{ scale: 0 }}
                    animate={{ scale: [0.8, 1.3, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </motion.svg>
    );
};

// --- Level 2: Understand (Pattern Organization) ---
const UnderstandViz = ({ color }: { color: string }) => {
    const initialPositions = [
        { x: -100, y: -50 }, { x: 80, y: -60 }, { x: -60, y: 50 },
        { x: 100, y: 40 }, { x: -20, y: -40 }, { x: 50, y: 60 },
        { x: -80, y: 10 }, { x: 70, y: -20 }, { x: 10, y: 50 },
    ];

    return (
        <motion.svg
            width="280" height="160" viewBox="-140 -80 280 160"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {Array.from({ length: 9 }).map((_, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                const targetX = (col - 1) * 50;
                const targetY = (row - 1) * 45;

                return (
                    <motion.rect
                        key={i}
                        width="35" height="35" rx="6"
                        fill={color}
                        initial={{ x: initialPositions[i].x, y: initialPositions[i].y, rotate: 45, opacity: 0.3 }}
                        animate={{ x: targetX - 17, y: targetY - 17, rotate: 0, opacity: 0.9 }}
                        transition={{ duration: 1.5, ease: "backOut", delay: i * 0.1 }}
                    />
                );
            })}
            {/* Grid lines */}
            <motion.path
                d="M-50 -45 H50 M-50 0 H50 M-50 45 H50 M-50 -45 V45 M0 -45 V45 M50 -45 V45"
                stroke="white" strokeWidth="2" strokeOpacity="0.3" fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
            />
        </motion.svg>
    );
};

// --- Level 3: Apply (Process Flow) ---
const ApplyViz = ({ color }: { color: string }) => {
    return (
        <motion.svg
            width="280" height="160" viewBox="-140 -80 280 160"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Input circles */}
            <motion.circle r="12" fill="rgba(255,255,255,0.6)"
                initial={{ cx: -120, cy: -20, opacity: 0 }}
                animate={{ cx: [-120, -20], cy: [-20, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle r="12" fill="rgba(255,255,255,0.6)"
                initial={{ cx: -120, cy: 20, opacity: 0 }}
                animate={{ cx: [-120, -20], cy: [20, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />

            {/* Central gear */}
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                <circle cx="0" cy="0" r="40" stroke="rgba(255,255,255,0.3)" fill="transparent" strokeWidth="6" strokeDasharray="15 8" />
                <circle cx="0" cy="0" r="22" fill={color} />
            </motion.g>

            {/* Output */}
            <motion.rect width="24" height="24" rx="6" fill={color}
                initial={{ x: 20, y: -12, opacity: 0, rotate: 0 }}
                animate={{ x: [20, 100], y: [-12, -12], opacity: [0, 1, 0], rotate: [0, 180] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
            />
        </motion.svg>
    );
};

// --- Level 4: Analyze (Deconstruction) ---
const AnalyzeViz = ({ color }: { color: string }) => {
    return (
        <motion.svg
            width="280" height="160" viewBox="-140 -80 280 160"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Four quadrants that separate */}
            <motion.rect width="40" height="40" rx="6" fill={color}
                initial={{ x: -22, y: -22 }}
                animate={{ x: [-22, -50, -22], y: [-22, -50, -22] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.rect width="40" height="40" rx="6" fill="rgba(255,255,255,0.3)"
                initial={{ x: 2, y: -22 }}
                animate={{ x: [2, 30, 2], y: [-22, -50, -22] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.rect width="40" height="40" rx="6" fill="rgba(255,255,255,0.3)"
                initial={{ x: -22, y: 2 }}
                animate={{ x: [-22, -50, -22], y: [2, 30, 2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.rect width="40" height="40" rx="6" fill={color}
                initial={{ x: 2, y: 2 }}
                animate={{ x: [2, 30, 2], y: [2, 30, 2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Connecting lines */}
            <motion.line stroke="white" strokeWidth="2" strokeOpacity="0.4"
                x1={-10} y1={-10} x2={30} y2={30}
                initial={{ x1: -10, y1: -10, x2: 30, y2: 30 }}
                animate={{ x1: [-10, -35, -10], y1: [-10, -35, -10], x2: [30, 55, 30], y2: [30, 55, 30] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.line stroke="white" strokeWidth="2" strokeOpacity="0.4"
                x1={30} y1={-10} x2={-10} y2={30}
                initial={{ x1: 30, y1: -10, x2: -10, y2: 30 }}
                animate={{ x1: [30, 55, 30], y1: [-10, -35, -10], x2: [-10, -35, -10], y2: [30, 55, 30] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
        </motion.svg>
    );
};

// --- Level 5: Evaluate (Filter/Judge) ---
const EvaluateViz = ({ color }: { color: string }) => {
    return (
        <motion.svg
            width="280" height="160" viewBox="-140 -80 280 160"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Filter line */}
            <line x1="0" y1="-60" x2="0" y2="60" stroke="white" strokeWidth="4" strokeOpacity="0.3" />

            {/* Incoming item */}
            <motion.circle r="16" fill="rgba(255,255,255,0.6)"
                initial={{ cx: -100, cy: 0 }}
                animate={{ cx: [-100, -10] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Accepted (goes right with checkmark) */}
            <motion.g
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: [0, 100], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
            >
                <circle cx="20" cy="0" r="16" fill={color} />
                <path d="M14 0 L18 4 L26 -4" stroke="white" strokeWidth="3" fill="none" />
            </motion.g>

            {/* Rejected (goes down with X) */}
            <motion.g
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: [0, 60], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.8 }}
            >
                <circle cx="-20" cy="0" r="16" fill="#ef4444" />
                <path d="M-25 -5 L-15 5 M-25 5 L-15 -5" stroke="white" strokeWidth="3" fill="none" />
            </motion.g>
        </motion.svg>
    );
};

// --- Level 6: Create (Synthesis/Explosion) ---
const CreateViz = ({ color }: { color: string }) => {
    const angles = [0, 60, 120, 180, 240, 300];

    return (
        <motion.svg
            width="280" height="160" viewBox="-140 -80 280 160"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Converging particles */}
            {angles.map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const startX = Math.cos(rad) * 80;
                const startY = Math.sin(rad) * 60;
                return (
                    <motion.circle
                        key={i}
                        r="8"
                        fill="rgba(255,255,255,0.6)"
                        initial={{ cx: startX, cy: startY, opacity: 1 }}
                        animate={{ cx: [startX, 0], cy: [startY, 0], opacity: [1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                    />
                );
            })}

            {/* Central pulsing core */}
            <motion.circle
                cx="0" cy="0" r="30"
                fill={color}
                animate={{ scale: [0.7, 1.4, 0.7], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Radiating rings */}
            <motion.circle
                cx="0" cy="0" r="40"
                fill="none" stroke="white" strokeWidth="2"
                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
                cx="0" cy="0" r="40"
                fill="none" stroke="white" strokeWidth="2"
                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
            />
        </motion.svg>
    );
};
