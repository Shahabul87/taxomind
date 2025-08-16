"use client";

import React from 'react';
import { Course, Chapter } from '@prisma/client';
import { CourseLayout } from './_components';

interface CourseCardProps {
  course: Course & { 
    category?: { name: string } | null;
    reviews?: {
      id: string;
      rating: number;
      createdAt: Date;
    }[];
    chapters?: Chapter[];
    _count?: {
      enrollments: number;
    };
    whatYouWillLearn?: string[];
  };
  userId?: string;
  isEnrolled?: boolean;
}

const CourseCard = ({ course, userId, isEnrolled = false }: CourseCardProps) => {
  return (
    <CourseLayout 
      course={course}
      userId={userId}
      isEnrolled={isEnrolled}
    />
  );
};

export default CourseCard;
