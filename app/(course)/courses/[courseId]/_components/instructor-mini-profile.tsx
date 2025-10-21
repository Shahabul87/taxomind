"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, User as UserIcon } from 'lucide-react';

interface InstructorMiniProfileProps {
  instructor: {
    id: string;
    name: string | null;
    image: string | null;
  };
  instructorRating?: number;
  linkToProfile?: boolean;
}

export const InstructorMiniProfile = ({
  instructor,
  instructorRating,
  linkToProfile = true,
}: InstructorMiniProfileProps): JSX.Element => {
  const instructorName = instructor.name ?? 'Unknown Instructor';
  const instructorImage = instructor.image ?? '/default-avatar.png';
  const hasRating = instructorRating !== undefined && instructorRating > 0;

  const ProfileContent = (
    <div className="flex items-center gap-3">
      {/* Instructor Avatar */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
        <Image
          src={instructorImage}
          alt={instructorName}
          fill
          className="object-cover"
        />
      </div>

      {/* Instructor Info */}
      <div className="flex flex-col">
        <span className="text-white/70 text-xs font-medium">Created by</span>
        <span className="text-white font-semibold text-sm hover:text-white/90 transition-colors">
          {instructorName}
        </span>
        {hasRating && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-white/80 text-xs font-medium">
              {instructorRating.toFixed(1)} instructor rating
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="mb-4"
    >
      {linkToProfile ? (
        <Link
          href={`#instructor`}
          className="inline-block"
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            const instructorTab = document.querySelector('[data-tab="instructor"]') as HTMLButtonElement | null;
            if (instructorTab) {
              instructorTab.click();
              instructorTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          {ProfileContent}
        </Link>
      ) : (
        ProfileContent
      )}
    </motion.div>
  );
};
