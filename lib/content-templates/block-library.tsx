import React from 'react';
import Image from 'next/image';
import { TemplateBlock } from './template-engine';

// Block Component Interface
export interface BlockComponentProps {
  block: TemplateBlock;
  editable?: boolean;
  onEdit?: (blockId: string, content: any) => void;
  onDelete?: (blockId: string) => void;
  className?: string;
}

// Base Block Configuration
export interface BaseBlockConfig {
  block: TemplateBlock;
  editable?: boolean;
  onEdit?: (blockId: string, content: any) => void;
  onDelete?: (blockId: string) => void;
  className?: string;
}

// Block Type Definitions
export interface TextBlockContent {
  text: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
}

export interface HeadingBlockContent {
  text: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  alignment?: 'left' | 'center' | 'right';
}

export interface ImageBlockContent {
  src: string;
  alt?: string;
  caption?: string;
  alignment?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
}

export interface VideoBlockContent {
  url: string;
  title?: string;
  thumbnail?: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
}

export interface CodeBlockContent {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  title?: string;
}

// Minimal BlockRenderer used by gallery and builder
export function BlockRenderer({ block }: BaseBlockConfig) {
  switch (block.type) {
    case 'heading':
      return <h2 className="text-xl font-semibold">{(block.content as any)?.text}</h2>;
    case 'text':
      return <p className="text-sm">{(block.content as any)?.text}</p>;
    case 'image':
      return (
        <div className="relative w-full h-48">
          <Image 
            src={(block.content as any)?.src} 
            alt={(block.content as any)?.alt || 'Block image'} 
            fill
            className="object-cover"
          />
        </div>
      );
    case 'video':
      return <div className="text-xs text-gray-500">Video block</div>;
    case 'code':
      return <pre className="text-xs bg-gray-100 p-2 rounded">{(block.content as any)?.code}</pre>;
    default:
      return <div className="text-xs text-gray-500">Unsupported block</div>;
  }
}

// Block Factory Functions
export const createTextBlock = (content: TextBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'text',
  content,
  metadata: {
    title: '',
    description: ''
  }
});

export const createHeadingBlock = (content: HeadingBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'heading',
  content,
  metadata: {
    title: '',
    description: ''
  }
});

export const createImageBlock = (content: ImageBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'image',
  content,
  metadata: {
    title: '',
    description: ''
  }
});

export const createVideoBlock = (content: VideoBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'video',
  content,
  metadata: {
    title: '',
    description: ''
  }
});

export const createCodeBlock = (content: CodeBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'code',
  content,
  metadata: {
    title: '',
    description: ''
  }
});

// Block Type Registry
export const BLOCK_TYPES = {
  text: 'text',
  heading: 'heading',
  image: 'image',
  video: 'video',
  code: 'code',
} as const;

export type BlockType = typeof BLOCK_TYPES[keyof typeof BLOCK_TYPES];

// Block Validation
export const validateBlock = (block: TemplateBlock): boolean => {
  if (!block.id || !block.type || !block.content) {
    return false;
  }
  
  switch (block.type) {
    case 'text':
      return typeof (block as any).content.text === 'string';
    case 'heading':
      return typeof (block as any).content.text === 'string' && 
             (!(block as any).content.level || ((block as any).content.level >= 1 && (block as any).content.level <= 6));
    case 'image':
      return typeof (block as any).content.src === 'string';
    case 'video':
      return typeof (block as any).content.url === 'string';
    case 'code':
      return typeof (block as any).content.code === 'string';
    default:
      return false;
  }
};


