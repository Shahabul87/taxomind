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

// Block Factory Functions
export const createTextBlock = (content: TextBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'text',
  content,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  }
});

export const createHeadingBlock = (content: HeadingBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'heading',
  content,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  }
});

export const createImageBlock = (content: ImageBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'image',
  content,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  }
});

export const createVideoBlock = (content: VideoBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'video',
  content,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  }
});

export const createCodeBlock = (content: CodeBlockContent): TemplateBlock => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'code',
  content,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
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
      return typeof block.content.text === 'string';
    case 'heading':
      return typeof block.content.text === 'string' && 
             (!block.content.level || (block.content.level >= 1 && block.content.level <= 6));
    case 'image':
      return typeof block.content.src === 'string';
    case 'video':
      return typeof block.content.url === 'string';
    case 'code':
      return typeof block.content.code === 'string';
    default:
      return false;
  }
};