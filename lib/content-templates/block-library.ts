import React from 'react';
import { TemplateBlock } from './template-engine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Play, Download, Code, FileText, Image, Video, 
  CheckCircle, AlertCircle, Info, BookOpen, Users, Zap
} from 'lucide-react';

// Block Component Interface
export interface BlockComponentProps {
  block: TemplateBlock;
  editable?: boolean;
  onEdit?: (blockId: string, content: any) => void;
  onDelete?: (blockId: string) => void;
  className?: string;
}

// Base Block Component
export const BaseBlock: React.FC<BlockComponentProps> = ({ 
  block, 
  editable = false, 
  onEdit, 
  onDelete,
  className,
  children 
}) => {
  return (
    <div className={`block-container ${className || ''}`} data-block-id={block.id}>
      {editable && (
        <div className="block-controls absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit?.(block.id, block.content)}
            className="mr-1"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete?.(block.id)}
          >
            Delete
          </Button>
        </div>
      )}
      {children}
    </div>
  );
};

// Text Block Component
export const TextBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { text, alignment = 'left', fontSize = 'base' } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <div 
        className={`prose max-w-none text-${alignment} text-${fontSize}`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </BaseBlock>
  );
};

// Heading Block Component
export const HeadingBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { text, level = 1, alignment = 'left' } = block.content;
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <BaseBlock block={block} {...props}>
      <HeadingTag className={`font-bold text-${alignment} mb-4`}>
        {text}
      </HeadingTag>
    </BaseBlock>
  );
};

// Image Block Component
export const ImageBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    src, 
    alt = '', 
    caption, 
    alignment = 'center',
    width,
    height 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <figure className={`text-${alignment}`}>
        <img 
          src={src} 
          alt={alt}
          width={width}
          height={height}
          className="max-w-full h-auto rounded-lg shadow-md"
        />
        {caption && (
          <figcaption className="text-sm text-gray-600 mt-2">
            {caption}
          </figcaption>
        )}
      </figure>
    </BaseBlock>
  );
};

// Video Block Component
export const VideoBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    url, 
    title, 
    thumbnail,
    autoplay = false,
    controls = true,
    muted = false 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {title || 'Video Content'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            <video
              src={url}
              poster={thumbnail}
              controls={controls}
              autoPlay={autoplay}
              muted={muted}
              className="w-full h-full object-cover"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </CardContent>
      </Card>
    </BaseBlock>
  );
};

// Code Block Component
export const CodeBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    code, 
    language = 'javascript', 
    title,
    runnable = false,
    showLineNumbers = true 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {title || `${language} Code`}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{language}</Badge>
              {runnable && (
                <Button size="sm" variant="outline">
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code className={`language-${language}`}>
              {code}
            </code>
          </pre>
        </CardContent>
      </Card>
    </BaseBlock>
  );
};

// Quiz Block Component
export const QuizBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    title, 
    questions = [], 
    settings = {},
    showResults = false 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {title || 'Quiz'}
          </CardTitle>
          <CardDescription>
            {questions.length} question{questions.length !== 1 ? 's' : ''}
            {settings.timeLimit && ` • ${settings.timeLimit} minutes`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.slice(0, 3).map((question: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="font-medium mb-2">
                  {index + 1}. {question.text}
                </div>
                <div className="space-y-1">
                  {question.options?.map((option: string, optIndex: number) => (
                    <div key={optIndex} className="text-sm text-gray-600">
                      {String.fromCharCode(97 + optIndex)}) {option}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {questions.length > 3 && (
              <div className="text-sm text-gray-500 text-center">
                ... and {questions.length - 3} more questions
              </div>
            )}
          </div>
          <Button className="w-full mt-4">
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    </BaseBlock>
  );
};

// Interactive Block Component
export const InteractiveBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    type, 
    title, 
    description,
    config = {},
    data = {} 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {title || 'Interactive Element'}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-4xl mb-4">🎮</div>
            <div className="text-lg font-medium mb-2">Interactive Content</div>
            <div className="text-sm text-gray-600 mb-4">
              {type} interactive element
            </div>
            <Button>
              Launch Interactive
            </Button>
          </div>
        </CardContent>
      </Card>
    </BaseBlock>
  );
};

// Download Block Component
export const DownloadBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    title, 
    description,
    files = [],
    allowBulkDownload = true 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title || 'Downloads'}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-gray-600">
                    {file.size} • {file.type}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </div>
          {allowBulkDownload && files.length > 1 && (
            <Button className="w-full mt-4" variant="outline">
              Download All Files
            </Button>
          )}
        </CardContent>
      </Card>
    </BaseBlock>
  );
};

// Callout Block Component
export const CalloutBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    type = 'info', 
    title, 
    content,
    icon 
  } = block.content;
  
  const variants = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: Info },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: AlertCircle },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: CheckCircle },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: AlertCircle }
  };
  
  const variant = variants[type as keyof typeof variants] || variants.info;
  const IconComponent = variant.icon;
  
  return (
    <BaseBlock block={block} {...props}>
      <div className={`p-4 rounded-lg border-l-4 ${variant.bg} ${variant.border}`}>
        <div className="flex items-start gap-3">
          <IconComponent className={`h-5 w-5 mt-0.5 ${variant.text}`} />
          <div className="flex-1">
            {title && (
              <div className={`font-medium mb-1 ${variant.text}`}>
                {title}
              </div>
            )}
            <div className={variant.text}>
              {content}
            </div>
          </div>
        </div>
      </div>
    </BaseBlock>
  );
};

// Divider Block Component
export const DividerBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    style = 'line', 
    message,
    spacing = 'normal' 
  } = block.content;
  
  const spacingClasses = {
    small: 'my-4',
    normal: 'my-8',
    large: 'my-12'
  };
  
  return (
    <BaseBlock block={block} {...props}>
      <div className={spacingClasses[spacing as keyof typeof spacingClasses]}>
        {style === 'line' && (
          <Separator className="w-full" />
        )}
        {style === 'gradient' && (
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        )}
        {style === 'dotted' && (
          <div className="border-t-2 border-dotted border-gray-300" />
        )}
        {message && (
          <div className="text-center text-sm text-gray-500 mt-4">
            {message}
          </div>
        )}
      </div>
    </BaseBlock>
  );
};

// List Block Component
export const ListBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    type = 'unordered', 
    items = [],
    title 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <div>
        {title && (
          <h3 className="font-medium mb-3">{title}</h3>
        )}
        {type === 'ordered' ? (
          <ol className="list-decimal list-inside space-y-2">
            {items.map((item: string, index: number) => (
              <li key={index} className="text-gray-700">{item}</li>
            ))}
          </ol>
        ) : (
          <ul className="list-disc list-inside space-y-2">
            {items.map((item: string, index: number) => (
              <li key={index} className="text-gray-700">{item}</li>
            ))}
          </ul>
        )}
      </div>
    </BaseBlock>
  );
};

// Table Block Component
export const TableBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    title, 
    headers = [],
    rows = [],
    striped = true 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {headers.length > 0 && (
                <thead>
                  <tr className="border-b bg-gray-50">
                    {headers.map((header: string, index: number) => (
                      <th key={index} className="text-left p-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row: string[], rowIndex: number) => (
                  <tr 
                    key={rowIndex} 
                    className={`border-b ${striped && rowIndex % 2 === 0 ? 'bg-gray-50' : ''}`}
                  >
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </BaseBlock>
  );
};

// Embed Block Component
export const EmbedBlock: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const { 
    url, 
    title,
    type = 'iframe',
    aspectRatio = '16:9' 
  } = block.content;
  
  return (
    <BaseBlock block={block} {...props}>
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={`aspect-${aspectRatio} rounded-lg overflow-hidden bg-gray-100`}>
            {type === 'iframe' ? (
              <iframe
                src={url}
                className="w-full h-full border-0"
                allowFullScreen
                title={title || 'Embedded content'}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📎</div>
                  <div className="text-lg font-medium mb-2">External Content</div>
                  <Button asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </BaseBlock>
  );
};

// Block Registry
export const BlockRegistry = {
  text: TextBlock,
  heading: HeadingBlock,
  image: ImageBlock,
  video: VideoBlock,
  code: CodeBlock,
  quiz: QuizBlock,
  interactive: InteractiveBlock,
  download: DownloadBlock,
  callout: CalloutBlock,
  divider: DividerBlock,
  list: ListBlock,
  table: TableBlock,
  embed: EmbedBlock
};

// Block Renderer
export const BlockRenderer: React.FC<BlockComponentProps> = ({ block, ...props }) => {
  const BlockComponent = BlockRegistry[block.type as keyof typeof BlockRegistry];
  
  if (!BlockComponent) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="text-red-800 font-medium">Unknown Block Type</div>
        <div className="text-red-600 text-sm">
          Block type "{block.type}" is not supported
        </div>
      </div>
    );
  }
  
  return <BlockComponent block={block} {...props} />;
};