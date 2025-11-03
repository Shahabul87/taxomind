"use client";

import React from 'react';
import Image from 'next/image';
import { User, Mail } from 'lucide-react';
import { Course } from '@prisma/client';

interface InstructorProfileTabProps {
  course: Course & {
    user?: {
      id: string;
      name: string | null;
      image: string | null;
      bio?: string | null;
      email?: string | null;
    } | null;
  };
}

export const InstructorProfileTab = ({ course }: InstructorProfileTabProps): JSX.Element => {
  const instructor = course.user;

  if (!instructor) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <User className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-600 dark:text-slate-400">Instructor information not available</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Instructor Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
              {instructor.image ? (
                <Image
                  src={instructor.image}
                  alt={instructor.name || 'Instructor'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="w-12 h-12 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          {/* Instructor Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {instructor.name || 'Anonymous Instructor'}
            </h2>

            {instructor.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail className="w-4 h-4" />
                <span>{instructor.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About Instructor */}
      {instructor.bio && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            About the Instructor
          </h3>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {instructor.bio}
            </p>
          </div>
        </div>
      )}

      {/* No bio fallback */}
      {!instructor.bio && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            {instructor.name || 'This instructor'} has not added a bio yet.
          </p>
        </div>
      )}
    </div>
  );
};
