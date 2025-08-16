"use client";

import React from 'react';
import { ContentViewer } from './tiptap/content-viewer';

interface PreviewProps {
  value: string;
}

export const Preview = ({ value }: PreviewProps) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ContentViewer content={value} />
    </div>
  );
};

export default Preview;