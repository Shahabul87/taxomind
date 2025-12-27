import Anthropic from '@anthropic-ai/sdk';
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages';

let _anthropic: Anthropic | null = null;

/**
 * Safely extracts text from an Anthropic ContentBlock.
 * ContentBlock is a union type that includes TextBlock and ThinkingBlock.
 * Only TextBlock has the 'text' property.
 */
export function extractTextFromContentBlock(block: ContentBlock): string {
  if (block.type === 'text') {
    return block.text;
  }
  return '';
}

/**
 * Extracts text from the first text block in a response's content array.
 * Returns the fallback value if no text block is found.
 */
export function getResponseText(
  content: ContentBlock[],
  fallback: string = ''
): string {
  const textBlock = content.find((block) => block.type === 'text');
  if (textBlock && textBlock.type === 'text') {
    return textBlock.text;
  }
  return fallback;
}

// Lazy initialization of Anthropic client
export const anthropic = new Proxy({} as Anthropic, {
  get: (target, prop) => {
    if (!_anthropic) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      _anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return (_anthropic as any)[prop];
  }
});

export default anthropic;