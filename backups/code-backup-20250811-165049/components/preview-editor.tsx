"use client";

import React from 'react';
import { ContentViewer } from './tiptap/content-viewer';
import './preview-editor.css';

interface PreviewEditorProps {
  value: string;
}

export const PreviewEditor = ({ value }: PreviewEditorProps) => {
  return (
    <div className="bg-transparent prose prose-sm dark:prose-invert max-w-none">
      <ContentViewer content={value || ""} />
    </div>
  );
};

export default PreviewEditor;
