'use client';

import React from 'react';
import { QuestionList } from '../qa/question-list';

interface QATabProps {
  courseId: string;
  sections?: Array<{
    id: string;
    title: string;
  }>;
}

export const QATab = ({ courseId, sections = [] }: QATabProps): JSX.Element => {
  return (
    <div className="py-4">
      <QuestionList courseId={courseId} sections={sections} />
    </div>
  );
};
