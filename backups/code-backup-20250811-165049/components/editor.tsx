"use client";

import React from 'react';
import TipTapEditor from './tiptap/editor';

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
  placeholder?: string;
}

export const Editor = ({ onChange, value, disabled, placeholder }: EditorProps) => {
  return (
    <TipTapEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={disabled}
    />
  );
};

export default Editor;


