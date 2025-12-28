# AI Tutor Implementation Guide

This document explains how to set up and use the AI tutor feature powered by DeepSeek's API.

## Overview

The AI tutor is designed to provide personalized learning assistance across various subjects. It uses DeepSeek's AI model to create a conversational, adaptive learning experience for users. The tutor can:

- Answer questions in a pedagogical manner
- Adapt to different learning styles
- Provide examples and explanations
- Break down complex topics
- Guide students through problem-solving

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root of your project with the following:

```
# AI Tutor (DeepSeek)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Rate Limiting (Optional - Upstash Redis)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
```

### 2. Install Dependencies

Make sure you have the required dependencies:

```bash
npm install react-markdown react-syntax-highlighter @upstash/redis @upstash/ratelimit
```

### 3. Rebuild the Application

```bash
npm run build
npm run start
```

## Architecture

The AI tutor implementation consists of several components:

1. **API Endpoint** - `/api/ai-tutor/route.ts`: Handles communication with DeepSeek's API
2. **Chat Interface** - `/app/ai-tutor/_components/chat-interface.tsx`: Manages the user interaction
3. **Syntax Highlighting** - `/components/markdown/prism.ts`: Provides formatting for code examples
4. **Rate Limiting** - `/lib/rate-limit.ts`: Prevents abuse of the API

## Customization

### Tutor Persona

You can modify the tutor's persona and teaching style by editing the system prompt in `/api/ai-tutor/route.ts`. Look for the `createTutorSystemPrompt` function.

### Subject-Specific Knowledge

The tutor automatically adapts to different subjects based on the context provided. You can enhance subject-specific responses by adding more detailed instructions in the system prompt.

### Learning Styles

The tutor supports different learning styles that can be selected by the user:

- Visual
- Auditory
- Reading/Writing
- Kinesthetic
- Socratic (questioning)
- Structured
- Exploratory

## API Usage and Costs

DeepSeek's API is a paid service. Be aware of the following:

- Each message costs based on the number of tokens used (both input and output)
- Rate limiting is implemented to prevent excessive costs
- Consider monitoring API usage to control costs

## Troubleshooting

### API Key Issues

If you encounter "Unauthorized" errors, verify that your DeepSeek API key is correctly set in the environment variables.

### Rate Limiting

If you see "Too many requests" errors, you may have hit the rate limit. The default is 50 requests per hour per user.

### Formatting Issues

If code blocks or other formatting appears incorrectly, check that `react-markdown` and `react-syntax-highlighter` are properly installed and imported.

## Future Enhancements

Potential improvements to consider:

1. User history tracking to provide more personalized learning
2. Integration with a knowledge base for specific educational content
3. Quiz generation based on conversation context
4. Multiple model options to control costs (e.g., smaller models for less complex questions)
5. Voice input/output capabilities
6. Support for image uploads for visual learning

## Using the AI Model

The AI tutor leverages DeepSeek's model to maintain conversation history and provide coherent responses. The key aspects include:

1. **System Prompt**: Defines the tutor's persona, capabilities, and teaching approach
2. **Message History**: Maintains the conversation context
3. **Response Generation**: Uses the model to generate appropriate educational responses

For detailed API documentation, refer to [DeepSeek's API documentation](https://platform.deepseek.com/docs). 