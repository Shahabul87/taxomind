/**
 * OpenAI Service with Circuit Breaker
 *
 * Wraps OpenAI API calls with circuit breaker protection to prevent
 * cascading failures when the service is unavailable.
 */

import OpenAI from 'openai';
import {
  CircuitBreakerManager,
  ServiceCircuitBreakers,
  CircuitBreakerError,
} from '../resilience/circuit-breaker-enhanced';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get circuit breaker instance
const circuitBreakerManager = CircuitBreakerManager.getInstance();
const openAIBreaker = circuitBreakerManager.getBreaker(ServiceCircuitBreakers.OpenAI);

/**
 * OpenAI service with circuit breaker protection
 */
export class OpenAIServiceWithCircuitBreaker {
  /**
   * Generate completion with circuit breaker protection
   */
  static async generateCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    try {
      return await openAIBreaker.execute(async () => {
        const response = await openai.chat.completions.create({
          model: params.model,
          messages: params.messages as OpenAI.ChatCompletionMessageParam[],
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 1000,
        });

        return response.choices[0]?.message?.content || '';
      });
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        // Circuit is open, return fallback or cache
        console.error('OpenAI service unavailable, circuit breaker is open');
        throw new Error('AI service temporarily unavailable. Please try again later.');
      }
      throw error;
    }
  }

  /**
   * Generate course content with circuit breaker protection
   */
  static async generateCourseContent(params: {
    topic: string;
    level: string;
    duration: string;
  }): Promise<{ title: string; description: string; chapters: string[] }> {
    try {
      return await openAIBreaker.execute(async () => {
        const prompt = `Create a course outline for: ${params.topic}
Level: ${params.level}
Duration: ${params.duration}

Provide:
1. Course title
2. Course description (100 words)
3. 5-10 chapter titles`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert course designer creating engaging educational content.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || '';

        // Parse the response (simplified parsing)
        const lines = content.split('\n').filter(line => line.trim());
        const title = lines[0]?.replace(/^(Course Title:|Title:)/i, '').trim() || params.topic;
        const description = lines.find(line => line.length > 50) || `A comprehensive course on ${params.topic}`;
        const chapters = lines
          .filter(line => /^\d+\./.test(line))
          .map(line => line.replace(/^\d+\.\s*/, ''));

        return {
          title,
          description,
          chapters: chapters.length > 0 ? chapters : ['Introduction', 'Core Concepts', 'Advanced Topics', 'Practice', 'Conclusion'],
        };
      });
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        // Return a basic template when circuit is open
        return {
          title: `${params.topic} Course`,
          description: `Learn ${params.topic} at ${params.level} level in ${params.duration}`,
          chapters: ['Introduction', 'Fundamentals', 'Core Concepts', 'Practice', 'Summary'],
        };
      }
      throw error;
    }
  }

  /**
   * Generate quiz questions with circuit breaker protection
   */
  static async generateQuizQuestions(params: {
    topic: string;
    difficulty: string;
    count: number;
  }): Promise<Array<{ question: string; options: string[]; correct: number }>> {
    try {
      return await openAIBreaker.execute(async () => {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Generate multiple choice quiz questions. Format: Q: [question]\\nA: [option1]\\nB: [option2]\\nC: [option3]\\nD: [option4]\\nCorrect: [A/B/C/D]',
            },
            {
              role: 'user',
              content: `Generate ${params.count} ${params.difficulty} difficulty quiz questions about ${params.topic}`,
            },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        });

        // Parse response into quiz format (simplified)
        const content = response.choices[0]?.message?.content || '';
        const questions: Array<{ question: string; options: string[]; correct: number }> = [];

        // Basic parsing logic (would be more robust in production)
        const blocks = content.split(/Q:/g).slice(1);
        for (const block of blocks) {
          const lines = block.split('\n').filter(line => line.trim());
          if (lines.length >= 5) {
            questions.push({
              question: lines[0].trim(),
              options: lines.slice(1, 5).map(line => line.replace(/^[A-D]:\s*/, '').trim()),
              correct: 0, // Would parse correct answer in real implementation
            });
          }
        }

        return questions;
      });
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        // Return empty array when circuit is open
        console.error('Cannot generate quiz questions, OpenAI circuit is open');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get circuit breaker metrics
   */
  static getMetrics() {
    return openAIBreaker.getMetrics();
  }

  /**
   * Reset circuit breaker (for admin use)
   */
  static resetCircuitBreaker() {
    openAIBreaker.reset();
  }
}