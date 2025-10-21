"use client";

import { CodeTabRedesigned } from "../code/CodeTabRedesigned";

interface CodeTabProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: {
    [key: string]: unknown;
  };
}

export const CodeTab = ({
  courseId,
  chapterId,
  sectionId,
}: CodeTabProps) => {
  return (
    <CodeTabRedesigned
      courseId={courseId}
      chapterId={chapterId}
      sectionId={sectionId}
    />
  );
};
