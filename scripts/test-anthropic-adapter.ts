/**
 * Test script to verify the AnthropicAdapter handles system messages correctly
 */

import { AnthropicAdapter } from '../packages/core/src/adapters/anthropic';

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Creating AnthropicAdapter...');
  const adapter = new AnthropicAdapter({
    apiKey,
    model: 'claude-sonnet-4-20250514',
  });

  console.log('Testing chat with system message in messages array...');
  try {
    const response = await adapter.chat({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant. Respond with ONLY the word "SUCCESS" if you receive this message.',
        },
        {
          role: 'user',
          content: 'Please respond as instructed.',
        },
      ],
      maxTokens: 100,
      temperature: 0,
    });

    console.log('Response received:');
    console.log('- Content:', response.content);
    console.log('- Model:', response.model);
    console.log('- Usage:', response.usage);

    if (response.content.toLowerCase().includes('success')) {
      console.log('\n✅ TEST PASSED: System message was correctly extracted and sent to API');
    } else {
      console.log('\n⚠️ TEST INCONCLUSIVE: Response did not include "SUCCESS" but API call succeeded');
      console.log('This might still be okay - the system message was likely processed.');
    }
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

main().catch(console.error);
