'use client';

import { motion, useReducedMotion } from '@/components/lazy-motion';

/**
 * Orbital Journey Map — A stylized globe with rotating coordinate grid,
 * cinematic flight arcs between cities, pulsing location markers,
 * and orbital rings that suggest global connectivity.
 */

interface CityMarker {
  name: string;
  cx: number;
  cy: number;
  color: string;
  delay: number;
  labelOffset: { x: number; y: number };
  labelAnchor: 'start' | 'end' | 'middle';
}

const cities: CityMarker[] = [
  {
    name: 'Dhaka',
    cx: 205,
    cy: 168,
    color: '#8B5CF6',
    delay: 0.5,
    labelOffset: { x: 12, y: 4 },
    labelAnchor: 'start',
  },
  {
    name: 'USA',
    cx: 85,
    cy: 115,
    color: '#3B82F6',
    delay: 1.0,
    labelOffset: { x: -12, y: -4 },
    labelAnchor: 'end',
  },
  {
    name: 'Dublin',
    cx: 125,
    cy: 92,
    color: '#10B981',
    delay: 1.5,
    labelOffset: { x: 10, y: -6 },
    labelAnchor: 'start',
  },
];

// Flight arc paths
const flightPaths = [
  {
    d: 'M205,168 C190,100 140,80 85,115',
    label: 'Dhaka → USA',
    delay: 1.2,
    duration: 2,
  },
  {
    d: 'M205,168 C180,110 150,90 125,92',
    label: 'Dhaka → Dublin',
    delay: 2.0,
    duration: 1.5,
  },
];

export default function GlobeJourneySvg() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        {/* Globe gradient */}
        <linearGradient id="gj-globe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        {/* Globe surface shine */}
        <radialGradient id="gj-shine" cx="35%" cy="35%">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="60%" stopColor="white" stopOpacity="0.05" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        {/* Atmosphere glow */}
        <radialGradient id="gj-atmosphere">
          <stop offset="70%" stopColor="#7C3AED" stopOpacity="0" />
          <stop offset="85%" stopColor="#7C3AED" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.15" />
        </radialGradient>

        {/* Flight arc gradient */}
        <linearGradient id="gj-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Marker glow */}
        <filter id="gj-marker-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle glow */}
        <filter id="gj-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Atmosphere layer ── */}
      <circle cx="150" cy="150" r="125" fill="url(#gj-atmosphere)" />

      {/* ── Globe base ── */}
      <motion.g
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.8,
          ease: 'easeOut',
        }}
        style={{ transformOrigin: '150px 150px' }}
      >
        <circle
          cx="150"
          cy="150"
          r="110"
          fill="url(#gj-globe-grad)"
        />
      </motion.g>

      {/* Globe outline */}
      <motion.circle
        cx="150"
        cy="150"
        r="110"
        fill="none"
        stroke="url(#gj-globe-grad)"
        strokeWidth="1.5"
        opacity="0.35"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 1.5,
          ease: [0.65, 0, 0.35, 1],
        }}
      />

      {/* Globe shine */}
      <circle cx="150" cy="150" r="110" fill="url(#gj-shine)" />

      {/* ── Rotating coordinate grid ── */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.15 }
            : { opacity: 0.15, rotate: 360 }
        }
        transition={{
          opacity: { duration: 1, delay: 0.3 },
          rotate: {
            duration: 120,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
        style={{ transformOrigin: '150px 150px' }}
      >
        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map((lat, i) => (
          <ellipse
            key={`lat-${i}`}
            cx="150"
            cy={150 + lat}
            rx={Math.sqrt(110 * 110 - lat * lat)}
            ry="10"
            fill="none"
            stroke="url(#gj-globe-grad)"
            strokeWidth="0.6"
          />
        ))}

        {/* Longitude curves */}
        <ellipse cx="150" cy="150" rx="110" ry="110" fill="none" stroke="url(#gj-globe-grad)" strokeWidth="0.4" />
        <ellipse cx="150" cy="150" rx="60" ry="110" fill="none" stroke="url(#gj-globe-grad)" strokeWidth="0.6" />
        <ellipse cx="150" cy="150" rx="30" ry="110" fill="none" stroke="url(#gj-globe-grad)" strokeWidth="0.6" />
        <ellipse cx="150" cy="150" rx="85" ry="110" fill="none" stroke="url(#gj-globe-grad)" strokeWidth="0.4" />
      </motion.g>

      {/* ── Orbital rings ── */}
      <motion.ellipse
        cx="150"
        cy="150"
        rx="130"
        ry="45"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="0.5"
        strokeDasharray="4 8"
        opacity="0.12"
        initial={{ opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.12 }
            : { opacity: 0.12, rotate: -360 }
        }
        transition={{
          opacity: { duration: 1, delay: 0.5 },
          rotate: {
            duration: 60,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
        style={{ transformOrigin: '150px 150px' }}
        transform="rotate(-20 150 150)"
      />

      <motion.ellipse
        cx="150"
        cy="150"
        rx="140"
        ry="35"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="0.4"
        strokeDasharray="2 10"
        opacity="0.08"
        initial={{ opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.08 }
            : { opacity: 0.08, rotate: 360 }
        }
        transition={{
          opacity: { duration: 1, delay: 0.7 },
          rotate: {
            duration: 80,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
        style={{ transformOrigin: '150px 150px' }}
        transform="rotate(15 150 150)"
      />

      {/* ── Flight arcs — drawn with path reveal ── */}
      {flightPaths.map((path, i) => (
        <motion.g key={`flight-${i}`}>
          {/* Arc trail */}
          <motion.path
            d={path.d}
            fill="none"
            stroke="url(#gj-arc-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{
              pathLength: {
                duration: shouldReduceMotion ? 0 : path.duration,
                delay: shouldReduceMotion ? 0 : path.delay,
                ease: [0.65, 0, 0.35, 1],
              },
              opacity: {
                duration: shouldReduceMotion ? 0 : 0.5,
                delay: shouldReduceMotion ? 0 : path.delay,
              },
            }}
          />

          {/* Moving airplane dot along arc */}
          {!shouldReduceMotion && (
            <>
              <circle
                cx="0"
                cy="0"
                r="3.5"
                fill="#F59E0B"
                filter="url(#gj-soft-glow)"
              >
                <animateMotion
                  dur="3.5s"
                  begin={`${3 + i * 2}s`}
                  repeatCount="indefinite"
                  path={path.d}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="3.5s"
                  begin={`${3 + i * 2}s`}
                  repeatCount="indefinite"
                />
              </circle>

              {/* Trailing glow behind airplane */}
              <circle
                cx="0"
                cy="0"
                r="6"
                fill="#F59E0B"
              >
                <animateMotion
                  dur="3.5s"
                  begin={`${3.1 + i * 2}s`}
                  repeatCount="indefinite"
                  path={path.d}
                />
                <animate
                  attributeName="opacity"
                  values="0;0.2;0.15;0"
                  dur="3.5s"
                  begin={`${3.1 + i * 2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </motion.g>
      ))}

      {/* ── City markers ── */}
      {cities.map((city) => (
        <motion.g
          key={city.name}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: shouldReduceMotion ? 0 : city.delay,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          style={{ transformOrigin: `${city.cx}px ${city.cy}px` }}
        >
          {/* Outer glow */}
          <circle
            cx={city.cx}
            cy={city.cy}
            r="12"
            fill={city.color}
            opacity="0.15"
            filter="url(#gj-marker-glow)"
          />

          {/* Core marker */}
          <circle
            cx={city.cx}
            cy={city.cy}
            r="6"
            fill={city.color}
            filter="url(#gj-soft-glow)"
          />

          {/* Inner bright dot */}
          <circle
            cx={city.cx - 1.5}
            cy={city.cy - 1.5}
            r="2"
            fill="white"
            opacity="0.6"
          />

          {/* Pulse ring */}
          <motion.g
            initial={{ scale: 1, opacity: 0.8 }}
            animate={
              shouldReduceMotion
                ? { scale: 1, opacity: 0.4 }
                : {
                    scale: [1, 2.5, 3.5],
                    opacity: [0.8, 0.3, 0],
                  }
            }
            transition={{
              duration: 2.5,
              delay: city.delay + 0.5,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeOut',
            }}
            style={{ transformOrigin: `${city.cx}px ${city.cy}px` }}
          >
            <circle
              cx={city.cx}
              cy={city.cy}
              r="6"
              fill="none"
              stroke={city.color}
              strokeWidth="2"
            />
          </motion.g>

          {/* City label */}
          <motion.text
            x={city.cx + city.labelOffset.x}
            y={city.cy + city.labelOffset.y}
            textAnchor={city.labelAnchor}
            fill={city.color}
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.5"
            initial={{ opacity: 0, x: city.cx + city.labelOffset.x - 5 }}
            animate={{ opacity: 0.85, x: city.cx + city.labelOffset.x }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.4,
              delay: shouldReduceMotion ? 0 : city.delay + 0.3,
            }}
          >
            {city.name}
          </motion.text>
        </motion.g>
      ))}

      {/* ── Year markers along arcs ── */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 3 }}
      >
        <rect x="130" y="76" width="30" height="14" rx="3" fill="#1E1B4B" opacity="0.8" />
        <text x="145" y="86" textAnchor="middle" fill="#A78BFA" fontSize="7.5" fontWeight="600">
          2023
        </text>
      </motion.g>

      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 3.5 }}
      >
        <rect x="170" y="118" width="30" height="14" rx="3" fill="#1E1B4B" opacity="0.8" />
        <text x="185" y="128" textAnchor="middle" fill="#A78BFA" fontSize="7.5" fontWeight="600">
          2019
        </text>
      </motion.g>

      {/* ── Subtle star field background ── */}
      {[
        { cx: 20, cy: 30, r: 1 },
        { cx: 280, cy: 25, r: 0.8 },
        { cx: 15, cy: 270, r: 1.2 },
        { cx: 275, cy: 280, r: 0.7 },
        { cx: 50, cy: 140, r: 0.5 },
        { cx: 250, cy: 160, r: 0.6 },
        { cx: 30, cy: 200, r: 0.8 },
        { cx: 270, cy: 70, r: 0.5 },
      ].map((star, i) => (
        <motion.circle
          key={`star-${i}`}
          cx={star.cx}
          cy={star.cy}
          r={star.r}
          fill="white"
          initial={{ opacity: 0 }}
          animate={
            shouldReduceMotion
              ? { opacity: 0.3 }
              : { opacity: [0.1, 0.4, 0.1] }
          }
          transition={{
            duration: 3 + i * 0.5,
            delay: i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  );
}
