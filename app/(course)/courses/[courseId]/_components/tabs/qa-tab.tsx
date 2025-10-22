'use client';

import React from 'react';
import { QuestionList } from '../qa/question-list';

interface QATabProps {
  courseId: string;
  sections?: Array<{
    id: string;
    title: string;
  }>;
  userId?: string;
  isInstructor?: boolean;
}

export const QATab = ({ courseId, sections = [], userId, isInstructor = false }: QATabProps): JSX.Element => {
  return (
    <div className="py-4">
      <QuestionList courseId={courseId} sections={sections} userId={userId} isInstructor={isInstructor} />
    </div>
  );
};
