"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, BarChart3, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseAnalyticsDashboard } from "./course-analytics-dashboard";
import { StudentProfileAnalytics } from "./student-profile-analytics";

interface TeacherAnalyticsPageProps {
  courseId: string;
  courseName: string;
}

export const TeacherAnalyticsPage = ({
  courseId,
  courseName
}: TeacherAnalyticsPageProps) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'student'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleViewStudentProfile = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
    setActiveView('student');
  };

  const handleBackToDashboard = () => {
    setSelectedStudent(null);
    setActiveView('dashboard');
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {activeView === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CourseAnalyticsDashboard
              courseId={courseId}
              courseName={courseName}
            />
          </motion.div>
        )}

        {activeView === 'student' && selectedStudent && (
          <motion.div
            key="student"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <StudentProfileAnalytics
              courseId={courseId}
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              onBack={handleBackToDashboard}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};