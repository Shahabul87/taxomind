// This file exports Prism syntax highlighting themes for code blocks

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Light theme for syntax highlighting
export const prismLight = {
  ...oneLight,
  'pre[class*="language-"]': {
    ...oneLight['pre[class*="language-"]'],
    background: '#f5f7fa',
    borderRadius: '0.5rem',
    padding: '1rem',
    overflow: 'auto',
  },
  'code[class*="language-"]': {
    ...oneLight['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: "'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
    fontSize: '0.9rem',
  },
};

// Dark theme for syntax highlighting
export const prismDark = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: '#1e293b',
    borderRadius: '0.5rem',
    padding: '1rem',
    overflow: 'auto',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: "'JetBrains Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
    fontSize: '0.9rem',
  },
}; 