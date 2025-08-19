"use client";

import Link from "next/link";

import { Course } from "@prisma/client";
import { Menu } from "lucide-react";

interface CourseNavbarProps {
  course: Course;
}

export const CourseNavbar = ({ course }: CourseNavbarProps): JSX.Element => {
  return (
    <div className="p-4 border-b h-full flex items-center bg-white dark:bg-gray-900 shadow-sm">
      <Menu className="block md:hidden mr-2" size={24} />
      <Link href={`/courses/${course.id}`}>
        <h1 className="font-semibold line-clamp-1">{course.title}</h1>
      </Link>
    </div>
  );
}; 