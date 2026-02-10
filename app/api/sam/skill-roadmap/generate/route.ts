/**
 * Skill Roadmap Generation API (SSE)
 *
 * AI-powered roadmap generation with course matching.
 * Streams progress events back to the client.
 *
 * Uses comprehensive pedagogical guidelines from prompt-templates.ts
 * to ensure consistent, high-quality roadmap generation.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runSAMChatWithMetadata, handleAIAccessError, getResolvedProviderName } from '@/lib/sam/ai-provider';
import { db } from '@/lib/db';
import {
  buildComprehensiveRoadmapPrompt,
  validateAIResponse,
  PROFICIENCY_DEFINITIONS,
  type RoadmapGenerationInput,
  type AIRoadmapResponse,
} from '@/lib/sam/roadmap-generation/prompt-templates';

export const runtime = 'nodejs';

// SSE helper
const textEncoder = new TextEncoder();
function sseEvent(event: string, data: unknown): Uint8Array {
  return textEncoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Validation schema
const GenerateRoadmapSchema = z.object({
  skillName: z.string().min(2).max(200),
  currentLevel: z.enum([
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
  ]),
  targetLevel: z.enum([
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
  ]),
  hoursPerWeek: z.number().min(1).max(40).default(10),
  targetCompletionDate: z.string().datetime().optional(),
  learningStyle: z.enum(['STRUCTURED', 'PROJECT_BASED', 'MIXED']).default('MIXED'),
  includeAssessments: z.boolean().default(true),
  prioritizeQuickWins: z.boolean().default(true),
});

// Level ordering for validation
const LEVEL_ORDER = [
  'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const validated = GenerateRoadmapSchema.parse(body);

    // Validate target > current level
    const currentIdx = LEVEL_ORDER.indexOf(validated.currentLevel);
    const targetIdx = LEVEL_ORDER.indexOf(validated.targetLevel);
    if (targetIdx <= currentIdx) {
      return new Response(
        JSON.stringify({ error: 'Target level must be above current level' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.id;

    // Create SSE stream
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Stage 1: Analyzing skill landscape
          controller.enqueue(sseEvent('progress', {
            stage: 'analyzing',
            percent: 5,
            message: 'Analyzing skill landscape...',
          }));

          // Find or create SkillBuildDefinition
          let skillDef = await db.skillBuildDefinition.findFirst({
            where: {
              name: { equals: validated.skillName, mode: 'insensitive' },
            },
          });

          if (!skillDef) {
            skillDef = await db.skillBuildDefinition.create({
              data: {
                name: validated.skillName,
                category: 'TECHNICAL',
                difficultyFactor: 1.0,
                retentionDifficulty: 1.0,
              },
            });
          }

          controller.enqueue(sseEvent('progress', {
            stage: 'analyzing',
            percent: 10,
            message: `Found skill definition for "${validated.skillName}"`,
          }));

          // Resolve the AI provider for this capability
          const resolvedProvider = await getResolvedProviderName(userId);

          const providerDisplayName = resolvedProvider.charAt(0).toUpperCase() + resolvedProvider.slice(1);

          controller.enqueue(sseEvent('progress', {
            stage: 'designing',
            percent: 20,
            message: `Connecting to ${providerDisplayName} AI...`,
            provider: resolvedProvider,
          }));

          // Stage 2: AI Generation with Comprehensive Pedagogical Prompt
          const promptInput: RoadmapGenerationInput = {
            skillName: validated.skillName,
            currentLevel: validated.currentLevel,
            targetLevel: validated.targetLevel,
            hoursPerWeek: validated.hoursPerWeek,
            targetCompletionDate: validated.targetCompletionDate,
            learningStyle: validated.learningStyle,
            includeAssessments: validated.includeAssessments,
            prioritizeQuickWins: validated.prioritizeQuickWins,
          };

          const prompt = buildComprehensiveRoadmapPrompt(promptInput);

          controller.enqueue(sseEvent('progress', {
            stage: 'designing',
            percent: 25,
            message: `${providerDisplayName} is designing your learning phases with pedagogical guidelines...`,
            provider: resolvedProvider,
          }));

          // Use lower temperature for more consistent output
          const aiResult = await runSAMChatWithMetadata({
            userId,
            capability: 'skill-roadmap',
            systemPrompt: `You are an expert instructional designer following Bloom's Taxonomy and evidence-based learning principles.
You MUST return ONLY valid JSON (no markdown, no code blocks, no explanations).
You MUST follow the exact schema provided in the prompt.
You MUST ensure proper cognitive progression through Bloom's levels.
You MUST ensure difficulty increases progressively (never decreases).`,
            messages: [{ role: 'user', content: prompt }],
            maxTokens: 6000, // Increased for more detailed output
            temperature: 0.5, // Lower temperature for more consistent structure
            extended: true,
          });

          const aiResponseText = aiResult.content;

          controller.enqueue(sseEvent('progress', {
            stage: 'parsing',
            percent: 50,
            message: `${providerDisplayName} generated a response. Validating roadmap structure...`,
            provider: aiResult.provider,
          }));

          // Parse and validate AI response
          let roadmapData: AIRoadmapResponse;

          try {
            // Clean up potential markdown formatting
            let cleanJson = aiResponseText
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim();

            // Handle potential leading/trailing text
            const jsonStart = cleanJson.indexOf('{');
            const jsonEnd = cleanJson.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              cleanJson = cleanJson.slice(jsonStart, jsonEnd + 1);
            }

            const parsedData = JSON.parse(cleanJson);

            // Validate with comprehensive schema
            const validation = validateAIResponse(parsedData);

            if (!validation.valid) {
              logger.warn('[SkillRoadmap] AI response validation failed', {
                errors: validation.errors,
                responsePreview: aiResponseText.slice(0, 500),
              });

              // Try to use the data anyway with relaxed validation for backward compatibility
              if (parsedData.phases && parsedData.phases.length > 0) {
                logger.info('[SkillRoadmap] Using AI response with validation warnings');
                roadmapData = parsedData as AIRoadmapResponse;
              } else {
                controller.enqueue(sseEvent('error', {
                  message: `AI response validation failed: ${validation.errors?.slice(0, 2).join('; ')}. Please try again.`,
                }));
                controller.close();
                return;
              }
            } else {
              roadmapData = validation.data!;
            }
          } catch (parseError) {
            const detail = parseError instanceof Error ? parseError.message : 'Unknown parse error';
            logger.error('[SkillRoadmap] Failed to parse AI response', {
              detail,
              responsePreview: aiResponseText.slice(0, 500),
            });
            controller.enqueue(sseEvent('error', {
              message: `AI returned invalid JSON. ${detail}. Please try again.`,
            }));
            controller.close();
            return;
          }

          if (!roadmapData.phases || roadmapData.phases.length === 0) {
            controller.enqueue(sseEvent('error', {
              message: 'AI generated an empty roadmap with no phases. Please try again.',
            }));
            controller.close();
            return;
          }

          // Log successful generation with stats
          logger.info('[SkillRoadmap] AI roadmap generated successfully', {
            skill: validated.skillName,
            phases: roadmapData.phases.length,
            totalHours: roadmapData.totalEstimatedHours,
            bloomsProgression: roadmapData.phases.map(p => p.bloomsLevel).join(' → '),
            difficultyProgression: roadmapData.phases.map(p => p.difficulty).join(' → '),
          });

          // Stage 3: Course matching
          const totalAICourses = roadmapData.phases.reduce((sum, p) => sum + p.courses.length, 0);

          controller.enqueue(sseEvent('progress', {
            stage: 'matching',
            percent: 55,
            message: `Matching ${totalAICourses} courses against platform catalog...`,
          }));

          const courseMatchCache = new Map<string, string | null>();
          let matchedCount = 0;

          for (let phaseIdx = 0; phaseIdx < roadmapData.phases.length; phaseIdx++) {
            const phase = roadmapData.phases[phaseIdx];
            for (const course of phase.courses) {
              if (courseMatchCache.has(course.title)) continue;

              const keywords = course.title.split(/[\s:,\-&]+/).filter(w => w.length > 3);
              const matchedCourse = await db.course.findFirst({
                where: {
                  isPublished: true,
                  OR: [
                    { title: { contains: validated.skillName, mode: 'insensitive' } },
                    ...keywords.slice(0, 3).map(kw => ({
                      title: { contains: kw, mode: 'insensitive' as const },
                    })),
                  ],
                },
                select: { id: true, title: true },
              });

              courseMatchCache.set(course.title, matchedCourse?.id ?? null);
              if (matchedCourse) matchedCount++;
            }

            // Per-phase progress update
            const matchPercent = 55 + Math.round(((phaseIdx + 1) / roadmapData.phases.length) * 20);
            controller.enqueue(sseEvent('progress', {
              stage: 'matching',
              percent: matchPercent,
              message: `Phase ${phaseIdx + 1}/${roadmapData.phases.length}: ${matchedCount} platform courses matched so far...`,
            }));
          }

          controller.enqueue(sseEvent('progress', {
            stage: 'building',
            percent: 80,
            message: `Building your roadmap (${matchedCount} platform courses linked)...`,
          }));

          // Stage 4: Persist to database with enhanced schema
          const totalEstimatedHours = roadmapData.totalEstimatedHours ||
            roadmapData.phases.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);

          const roadmap = await db.skillBuildRoadmap.create({
            data: {
              userId,
              title: roadmapData.title || `${validated.skillName} Learning Roadmap`,
              description: roadmapData.description,
              status: 'ACTIVE',
              targetOutcome: {
                type: 'SKILL_SET',
                targetName: validated.skillName,
                currentLevel: validated.currentLevel,
                targetLevel: validated.targetLevel,
                skillDefId: skillDef.id,
                learningStyle: validated.learningStyle,
                hoursPerWeek: validated.hoursPerWeek,
              },
              totalEstimatedHours,
              startedAt: new Date(),
              targetCompletionDate: validated.targetCompletionDate
                ? new Date(validated.targetCompletionDate)
                : null,
              milestones: {
                create: roadmapData.phases.map((phase, idx) => {
                  const matchedIds = phase.courses
                    .map(c => courseMatchCache.get(c.title))
                    .filter((id): id is string => id !== null && id !== undefined);

                  return {
                    order: idx + 1,
                    title: phase.title,
                    description: phase.description,
                    status: idx === 0 ? 'AVAILABLE' : 'LOCKED',
                    estimatedHours: phase.estimatedHours || 0,
                    skills: phase.skills.map(s => ({
                      skillName: s.skillName,
                      targetLevel: s.targetLevel,
                      estimatedHours: s.estimatedHours,
                      progress: 0,
                      prerequisiteSkills: s.prerequisiteSkills || [],
                    })),
                    resources: {
                      // Enhanced course data with learning outcomes and key topics
                      courses: phase.courses.map((c, courseIdx) => ({
                        courseNumber: c.courseNumber || courseIdx + 1,
                        title: c.title,
                        description: c.description,
                        difficulty: c.difficulty,
                        estimatedHours: c.estimatedHours,
                        learningOutcomes: c.learningOutcomes || [],
                        keyTopics: c.keyTopics || [],
                        prerequisiteConcepts: c.prerequisiteConcepts || [],
                        reason: c.reason,
                        matchedCourseId: courseMatchCache.get(c.title) ?? null,
                      })),
                      // Enhanced project data with deliverables
                      projects: phase.projects.map(p => ({
                        title: p.title,
                        description: p.description,
                        difficulty: p.difficulty,
                        estimatedHours: p.estimatedHours,
                        deliverables: p.deliverables || [],
                        skillsApplied: p.skillsApplied || [],
                      })),
                      // Phase-level metadata
                      assessmentCriteria: phase.assessmentCriteria,
                      bloomsLevel: phase.bloomsLevel,
                      difficulty: phase.difficulty,
                      durationWeeks: phase.durationWeeks,
                      prerequisites: phase.prerequisites || '',
                      learningObjectives: phase.learningObjectives || [],
                    },
                    matchedCourseIds: matchedIds,
                    assessmentRequired: validated.includeAssessments,
                  };
                }),
              },
            },
            include: {
              milestones: {
                orderBy: { order: 'asc' },
              },
            },
          });

          controller.enqueue(sseEvent('progress', {
            stage: 'saving',
            percent: 95,
            message: 'Saving roadmap to your account...',
          }));

          controller.enqueue(sseEvent('progress', {
            stage: 'complete',
            percent: 100,
            message: 'Roadmap created successfully!',
          }));

          // Send the complete roadmap
          controller.enqueue(sseEvent('roadmap', {
            id: roadmap.id,
            title: roadmap.title,
            description: roadmap.description,
            totalEstimatedHours: roadmap.totalEstimatedHours,
            milestoneCount: roadmap.milestones.length,
            milestones: roadmap.milestones.map(m => ({
              id: m.id,
              order: m.order,
              title: m.title,
              status: m.status,
              estimatedHours: m.estimatedHours,
            })),
          }));

          controller.enqueue(sseEvent('done', { timestamp: Date.now() }));
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[SkillRoadmap] Generation error:', message);
          controller.enqueue(sseEvent('error', {
            message: `Roadmap generation failed: ${message}`,
          }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    logger.error('[SkillRoadmap] Route error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
