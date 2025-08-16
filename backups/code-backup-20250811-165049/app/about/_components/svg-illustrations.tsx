"use client";

import { motion } from "framer-motion";

export const FounderAvatar = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="founder-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <clipPath id="founder-clip">
        <circle cx="100" cy="100" r="90" />
      </clipPath>
    </defs>
    <circle cx="100" cy="100" r="95" fill="white" stroke="#e5e7eb" strokeWidth="2" />
    <g clipPath="url(#founder-clip)">
      <rect x="0" y="0" width="200" height="200" fill="#f3f4f6" />
      <circle cx="100" cy="85" r="40" fill="url(#founder-gradient)" opacity="0.8" />
      <rect x="30" y="125" width="140" height="120" rx="70" fill="url(#founder-gradient)" />
    </g>
  </svg>
);

export const MissionIllustration = () => (
  <svg viewBox="0 0 800 600" className="w-full h-full">
    <defs>
      <linearGradient id="mission-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="#f9fafb" rx="20" />
    
    {/* Books */}
    <motion.g
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <rect x="150" y="200" width="200" height="300" rx="5" fill="#8B5CF6" />
      <rect x="160" y="220" width="180" height="260" rx="3" fill="white" />
      <rect x="180" y="250" width="140" height="10" rx="2" fill="#e5e7eb" />
      <rect x="180" y="270" width="100" height="10" rx="2" fill="#e5e7eb" />
      
      <rect x="200" y="180" width="200" height="300" rx="5" fill="#3B82F6" />
      <rect x="210" y="200" width="180" height="260" rx="3" fill="white" />
      <rect x="230" y="230" width="140" height="10" rx="2" fill="#e5e7eb" />
      <rect x="230" y="250" width="100" height="10" rx="2" fill="#e5e7eb" />
      
      <rect x="250" y="160" width="200" height="300" rx="5" fill="#A855F7" />
      <rect x="260" y="180" width="180" height="260" rx="3" fill="white" />
      <rect x="280" y="210" width="140" height="10" rx="2" fill="#e5e7eb" />
      <rect x="280" y="230" width="100" height="10" rx="2" fill="#e5e7eb" />
    </motion.g>
    
    {/* Light bulb */}
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <circle cx="550" cy="250" r="80" fill="#FBBF24" opacity="0.2" />
      <circle cx="550" cy="250" r="60" fill="#FBBF24" opacity="0.3" />
      <circle cx="550" cy="250" r="40" fill="#FBBF24" opacity="0.4" />
      <path d="M550 170 L550 200" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      <path d="M550 300 L550 330" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      <path d="M470 250 L500 250" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      <path d="M600 250 L630 250" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      <path d="M490 190 L510 210" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      <path d="M590 310 L610 290" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      <path d="M490 310 L510 290" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      <path d="M590 190 L610 210" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
    </motion.g>
    
    {/* Connected dots */}
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <circle cx="200" cy="400" r="10" fill="#3B82F6" />
      <circle cx="300" cy="450" r="10" fill="#3B82F6" />
      <circle cx="400" cy="380" r="10" fill="#3B82F6" />
      <circle cx="500" cy="420" r="10" fill="#3B82F6" />
      <circle cx="600" cy="390" r="10" fill="#3B82F6" />
      
      <line x1="200" y1="400" x2="300" y2="450" stroke="#3B82F6" strokeWidth="2" />
      <line x1="300" y1="450" x2="400" y2="380" stroke="#3B82F6" strokeWidth="2" />
      <line x1="400" y1="380" x2="500" y2="420" stroke="#3B82F6" strokeWidth="2" />
      <line x1="500" y1="420" x2="600" y2="390" stroke="#3B82F6" strokeWidth="2" />
    </motion.g>
  </svg>
);

export const TeamMemberSVG = ({ color = "#8B5CF6", index = 0 }: { color?: string; index?: number }) => (
  <svg viewBox="0 0 400 500" className="w-full h-full">
    <defs>
      <linearGradient id={`team-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <clipPath id={`team-clip-${index}`}>
        <rect x="50" y="50" width="300" height="300" rx="8" />
      </clipPath>
    </defs>
    
    {/* Background */}
    <rect x="50" y="50" width="300" height="300" rx="8" fill="#f3f4f6" />
    
    {/* Abstract person */}
    <g clipPath={`url(#team-clip-${index})`}>
      <rect x="50" y="50" width="300" height="300" fill="#f9fafb" />
      <circle cx="200" cy="150" r="70" fill={`url(#team-gradient-${index})`} opacity="0.8" />
      <rect x="100" y="220" width="200" height="200" rx="100" fill={`url(#team-gradient-${index})`} />
    </g>
  </svg>
);

export const TestimonialAvatar = ({ index = 0 }: { index?: number }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id={`testimonial-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={index % 3 === 0 ? "#8B5CF6" : index % 3 === 1 ? "#3B82F6" : "#EC4899"} />
        <stop offset="100%" stopColor={index % 3 === 0 ? "#3B82F6" : index % 3 === 1 ? "#8B5CF6" : "#8B5CF6"} />
      </linearGradient>
      <clipPath id={`testimonial-clip-${index}`}>
        <circle cx="100" cy="100" r="90" />
      </clipPath>
    </defs>
    <circle cx="100" cy="100" r="95" fill="white" stroke="#e5e7eb" strokeWidth="2" />
    <g clipPath={`url(#testimonial-clip-${index})`}>
      <rect x="0" y="0" width="200" height="200" fill="#f3f4f6" />
      <circle cx="100" cy="85" r="40" fill={`url(#testimonial-gradient-${index})`} opacity="0.8" />
      <rect x="30" y="125" width="140" height="120" rx="70" fill={`url(#testimonial-gradient-${index})`} />
    </g>
  </svg>
);

export const WavyBackground = () => (
  <svg viewBox="0 0 1200 400" className="absolute bottom-0 left-0 w-full h-auto" preserveAspectRatio="none">
    <path
      d="M0,192L48,202.7C96,213,192,235,288,229.3C384,224,480,192,576,181.3C672,171,768,181,864,192C960,203,1056,213,1152,208C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      fill="url(#wave-gradient)"
      fillOpacity="0.2"
    >
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </path>
  </svg>
); 