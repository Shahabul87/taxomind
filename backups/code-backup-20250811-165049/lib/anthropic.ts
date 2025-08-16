import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;

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