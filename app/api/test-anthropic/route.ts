import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Anthropic API key from environment
// IMPORTANT: In production, always use environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_VERSION = '2023-06-01';
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

export async function GET(req: NextRequest) {
  try {

    // Check if API key is available
    if (!ANTHROPIC_API_KEY) {
      logger.error("Test Anthropic API: No Anthropic API key found in environment variables");
      return NextResponse.json({
        success: false,
        error: "API key not configured. Please set ANTHROPIC_API_KEY environment variable.",
      }, { status: 500 });
    }
    
    // Call Anthropic Claude API
    const apiUrl = 'https://api.anthropic.com/v1/messages';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        system: "You are a helpful assistant that provides clear, concise explanations about science.",
        messages: [
          { 
            role: 'user', 
            content: 'What is photosynthesis? Please explain in a couple sentences.'
          }
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Test Anthropic API: Error:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      return NextResponse.json({
        success: false,
        error: errorData,
        status: response.status,
      }, { status: 500 });
    }

    const data = await response.json();

    // Return test results
    return NextResponse.json({
      success: true,
      model: CLAUDE_MODEL,
      apiVersion: ANTHROPIC_API_VERSION,
      responseId: data.id,
      response: data.content?.[0]?.text || "No response content",
    });
  } catch (error: any) {
    logger.error('Test Anthropic API: Unhandled error:', error);
    return NextResponse.json({
      success: false, 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
} 