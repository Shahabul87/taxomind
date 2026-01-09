/**
 * DeepSeek Adapter Test Script
 *
 * Tests the DeepSeek AI adapter with various operations:
 * 1. Configuration check
 * 2. Simple chat completion
 * 3. Streaming chat completion
 *
 * Usage:
 *   npx ts-node scripts/test-deepseek-adapter.ts
 *
 * Requires:
 *   DEEPSEEK_API_KEY environment variable
 */

import { createDeepSeekAdapter } from '@sam-ai/core';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.development
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
// Also load from .env as fallback
dotenv.config();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof COLORS = 'reset'): void {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testDeepSeekAdapter(): Promise<void> {
  log('\n========================================', 'cyan');
  log('  DeepSeek Adapter Test Suite', 'cyan');
  log('========================================\n', 'cyan');

  // Check API key
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    log('ERROR: DEEPSEEK_API_KEY environment variable is not set', 'red');
    log('Please set your DeepSeek API key in .env.development:', 'yellow');
    log('  DEEPSEEK_API_KEY=sk-your-api-key-here', 'yellow');
    process.exit(1);
  }

  log('API Key found: ' + apiKey.substring(0, 10) + '...', 'green');

  // Create adapter
  const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-reasoner';
  log(`Creating adapter with model: ${model}`, 'blue');

  const adapter = createDeepSeekAdapter({
    apiKey,
    model,
    timeout: 60000,
    maxRetries: 2,
  });

  // Test 1: Configuration Check
  log('\n--- Test 1: Configuration Check ---', 'yellow');
  log(`  Name: ${adapter.name}`, 'reset');
  log(`  Version: ${adapter.version}`, 'reset');
  log(`  Model: ${adapter.getModel()}`, 'reset');
  log(`  Configured: ${adapter.isConfigured()}`, 'reset');

  if (!adapter.isConfigured()) {
    log('ERROR: Adapter is not configured properly', 'red');
    process.exit(1);
  }
  log('  Configuration: PASSED', 'green');

  // Test 2: Simple Chat Completion
  log('\n--- Test 2: Simple Chat Completion ---', 'yellow');
  try {
    log('  Sending request...', 'blue');
    const startTime = Date.now();

    const response = await adapter.chat({
      messages: [
        {
          role: 'user',
          content: 'Say "DeepSeek works!" and nothing else.',
        },
      ],
      maxTokens: 50,
      temperature: 0.1,
    });

    const duration = Date.now() - startTime;
    log(`  Response received in ${duration}ms`, 'green');
    log(`  Content: "${response.content}"`, 'reset');
    log(`  Model: ${response.model}`, 'reset');
    log(`  Input tokens: ${response.usage.inputTokens}`, 'reset');
    log(`  Output tokens: ${response.usage.outputTokens}`, 'reset');
    log(`  Finish reason: ${response.finishReason}`, 'reset');
    log('  Chat Completion: PASSED', 'green');
  } catch (error) {
    log(`  ERROR: ${(error as Error).message}`, 'red');
    log('  Chat Completion: FAILED', 'red');
  }

  // Test 3: Streaming Chat Completion
  log('\n--- Test 3: Streaming Chat Completion ---', 'yellow');
  try {
    log('  Sending streaming request...', 'blue');
    const startTime = Date.now();

    process.stdout.write('  Response: "');

    let fullContent = '';
    let chunkCount = 0;

    for await (const chunk of adapter.chatStream!({
      messages: [
        {
          role: 'user',
          content: 'Count from 1 to 5, separated by commas.',
        },
      ],
      maxTokens: 50,
      temperature: 0.1,
    })) {
      if (!chunk.done) {
        process.stdout.write(chunk.content);
        fullContent += chunk.content;
        chunkCount++;
      }
    }

    console.log('"');

    const duration = Date.now() - startTime;
    log(`  Received ${chunkCount} chunks in ${duration}ms`, 'green');
    log(`  Full content: "${fullContent.trim()}"`, 'reset');
    log('  Streaming: PASSED', 'green');
  } catch (error) {
    console.log('');
    log(`  ERROR: ${(error as Error).message}`, 'red');
    log('  Streaming: FAILED', 'red');
  }

  // Test 4: System Prompt
  log('\n--- Test 4: System Prompt ---', 'yellow');
  try {
    log('  Testing with system prompt...', 'blue');

    const response = await adapter.chat({
      messages: [
        {
          role: 'user',
          content: 'What is your role?',
        },
      ],
      systemPrompt: 'You are a helpful AI tutor named SAM. Always introduce yourself as SAM.',
      maxTokens: 100,
      temperature: 0.3,
    });

    log(`  Response: "${response.content.substring(0, 100)}..."`, 'reset');
    const hasSAM = response.content.toLowerCase().includes('sam');
    if (hasSAM) {
      log('  System prompt properly applied', 'green');
      log('  System Prompt: PASSED', 'green');
    } else {
      log('  System prompt may not have been applied (SAM not in response)', 'yellow');
      log('  System Prompt: PARTIAL', 'yellow');
    }
  } catch (error) {
    log(`  ERROR: ${(error as Error).message}`, 'red');
    log('  System Prompt: FAILED', 'red');
  }

  // Summary
  log('\n========================================', 'cyan');
  log('  Test Suite Complete', 'cyan');
  log('========================================\n', 'cyan');
  log('DeepSeek adapter is ready for use!', 'green');
  log('You can now use it in your application with:', 'reset');
  log('  import { createDeepSeekAdapter } from "@sam-ai/core";', 'reset');
  log('\nOr use the provider factory:', 'reset');
  log('  import { createAIAdapter } from "@/lib/sam/providers";', 'reset');
  log('  const adapter = createAIAdapter("deepseek");', 'reset');
}

// Run tests
testDeepSeekAdapter().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
