/**
 * @sam-ai/api - Analyze Handler
 * Handles content analysis requests
 */

import type {
  SAMConfig,
  SAMContext,
  SAMUserContext,
  BloomsAnalysis,
} from '@sam-ai/core';
import {
  createOrchestrator,
  createBloomsEngine,
  createContentEngine,
  createDefaultContext,
} from '@sam-ai/core';
import type {
  SAMApiRequest,
  SAMApiResponse,
  SAMHandler,
  SAMHandlerContext,
  AnalyzeRequest,
  AnalyzeResponse,
} from '../types';

/**
 * Create success response
 */
function createSuccessResponse<T>(data: T, status = 200): SAMApiResponse {
  return {
    status,
    body: {
      success: true,
      data,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Create error response
 */
function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): SAMApiResponse {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Build user context from handler context
 */
function buildUserContext(
  handlerContext: SAMHandlerContext
): Partial<SAMUserContext> | undefined {
  if (!handlerContext.user) return undefined;

  return {
    id: handlerContext.user.id,
    role: handlerContext.user.role === 'teacher' ? 'teacher' : 'student',
    name: handlerContext.user.name,
    preferences: {
      learningStyle: 'visual',
      preferredTone: 'encouraging',
      teachingMethod: 'mixed',
    },
    capabilities: [],
  };
}

/**
 * Create analyze handler
 */
export function createAnalyzeHandler(config: SAMConfig): SAMHandler {
  const orchestrator = createOrchestrator(config);

  // Register engines
  orchestrator.registerEngine(createBloomsEngine(config));
  orchestrator.registerEngine(createContentEngine(config));

  return async (
    request: SAMApiRequest,
    handlerContext: SAMHandlerContext
  ): Promise<SAMApiResponse> => {
    const body = request.body as AnalyzeRequest;
    const startTime = Date.now();

    // Validate request
    if (!body.content && !body.context) {
      return createErrorResponse(
        400,
        'INVALID_REQUEST',
        'Either content or context is required'
      );
    }

    try {
      const analysisType = body.type ?? 'full';
      const enginesUsed: string[] = [];
      const recommendations: string[] = [];

      // Initialize analysis result
      const analysis: AnalyzeResponse['analysis'] = {};

      // Build user context
      const userContext = buildUserContext(handlerContext);

      // Create SAM context using factory
      const samContext: SAMContext = createDefaultContext({
        user: userContext as SAMUserContext,
        page: {
          type: 'other',
          path: '/',
          capabilities: [],
          breadcrumb: [],
        },
      });

      // Determine which engines to run
      const enginesToRun: string[] = [];
      if (analysisType === 'blooms' || analysisType === 'full') {
        enginesToRun.push('blooms');
      }
      if (analysisType === 'content' || analysisType === 'full') {
        enginesToRun.push('content');
      }

      // Run orchestration with selected engines
      const result = await orchestrator.orchestrate(
        samContext,
        body.content ?? 'Analyze the current context',
        { engines: enginesToRun }
      );

      // Extract Bloom's analysis from results
      if (result.results['blooms']?.success && result.results['blooms']?.data) {
        const bloomsData = result.results['blooms'].data as Record<string, unknown>;
        if (bloomsData.distribution && bloomsData.dominantLevel) {
          analysis.blooms = bloomsData as unknown as BloomsAnalysis;
          enginesUsed.push('blooms');

          // Add Bloom's recommendations
          if (body.options?.includeRecommendations) {
            const blooms = analysis.blooms;
            if (blooms && blooms.cognitiveDepth < 50) {
              recommendations.push(
                'Consider adding higher-order thinking questions (analyze, evaluate, create)'
              );
            }
            if (blooms && blooms.dominantLevel === 'REMEMBER') {
              recommendations.push(
                'The content is focused on basic recall. Consider adding application exercises.'
              );
            }
            if (blooms?.recommendations) {
              recommendations.push(...blooms.recommendations.slice(0, 3));
            }
          }
        }
      }

      // Extract content analysis from results
      if (result.results['content']?.success && result.results['content']?.data) {
        const contentData = result.results['content'].data as Record<string, unknown>;
        analysis.content = {
          score: (contentData.score as number) ?? 0,
          metrics: (contentData.metrics as Record<string, number>) ?? {},
          suggestions: ((contentData.suggestions as Array<{ text: string }>) ?? []).map(
            (s) => (typeof s === 'string' ? s : s.text)
          ),
        };
        enginesUsed.push('content');

        // Add content recommendations
        if (body.options?.includeRecommendations && analysis.content.suggestions) {
          recommendations.push(...analysis.content.suggestions.slice(0, 3));
        }
      }

      // Run assessment analysis if requested
      if (analysisType === 'assessment' || analysisType === 'full') {
        // For assessment, we analyze question distribution if available
        if (body.context?.page?.type === 'section-detail') {
          analysis.assessment = {
            questionCount: 0,
            distribution: {
              multipleChoice: 0,
              trueFalse: 0,
              shortAnswer: 0,
              essay: 0,
            },
          };
          enginesUsed.push('assessment');

          // Add assessment recommendations
          if (body.options?.includeRecommendations) {
            recommendations.push(
              'Consider adding a variety of question types for comprehensive assessment'
            );
          }
        }
      }

      const processingTime = Date.now() - startTime;

      const response: AnalyzeResponse = {
        analysis,
        recommendations: [...new Set(recommendations)], // Deduplicate
        metadata: {
          processingTime,
          enginesUsed,
        },
      };

      return createSuccessResponse(response);
    } catch (error) {
      console.error('[SAM Analyze Handler] Error:', error);

      if (error instanceof Error) {
        return createErrorResponse(
          500,
          'ANALYSIS_ERROR',
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'An error occurred during analysis'
        );
      }

      return createErrorResponse(
        500,
        'INTERNAL_ERROR',
        'An unexpected error occurred'
      );
    }
  };
}

/**
 * Quick Bloom's analysis utility
 */
export async function analyzeBloomsLevel(
  config: SAMConfig,
  content: string
): Promise<BloomsAnalysis | null> {
  const orchestrator = createOrchestrator(config);
  orchestrator.registerEngine(createBloomsEngine(config));

  try {
    // Create default context
    const context: SAMContext = createDefaultContext({
      user: {
        id: 'system',
        role: 'teacher',
        preferences: {},
        capabilities: [],
      },
    });

    const result = await orchestrator.orchestrate(context, content, {
      engines: ['blooms'],
    });

    if (result.results['blooms']?.success && result.results['blooms']?.data) {
      const data = result.results['blooms'].data as Record<string, unknown>;
      if (data.distribution && data.dominantLevel) {
        return data as unknown as BloomsAnalysis;
      }
    }
    return null;
  } catch {
    return null;
  }
}
