/**
 * Skill Roadmap Generation API (SSE)
 *
 * AI-powered roadmap generation with course matching.
 * Streams progress events back to the client.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { aiClient } from '@/lib/ai/enterprise-client';

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

// AI prompt for roadmap generation
function buildRoadmapPrompt(input: z.infer<typeof GenerateRoadmapSchema>): string {
  return `You are an expert learning path designer. Generate a structured skill development roadmap.

SKILL: ${input.skillName}
CURRENT LEVEL: ${input.currentLevel}
TARGET LEVEL: ${input.targetLevel}
HOURS PER WEEK: ${input.hoursPerWeek}
LEARNING STYLE: ${input.learningStyle}
INCLUDE ASSESSMENTS: ${input.includeAssessments}
PRIORITIZE QUICK WINS: ${input.prioritizeQuickWins}

Generate a roadmap with 4-6 sequential phases to go from ${input.currentLevel} to ${input.targetLevel} in ${input.skillName}.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Roadmap title",
  "description": "One-line roadmap description",
  "phases": [
    {
      "title": "Phase title",
      "description": "What this phase covers (2-3 sentences)",
      "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "estimatedHours": 20,
      "durationWeeks": 2,
      "skills": [
        {
          "skillName": "Sub-skill name",
          "targetLevel": "BEGINNER|COMPETENT|PROFICIENT|ADVANCED",
          "estimatedHours": 8
        }
      ],
      "courses": [
        {
          "title": "Specific course title (10+ chars, actionable)",
          "description": "What the student will learn in this course (50-100 words)",
          "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
          "estimatedHours": 8,
          "reason": "Why this course is needed for this phase"
        }
      ],
      "projects": [
        {
          "title": "Hands-on project title",
          "description": "Project description and deliverable",
          "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
          "estimatedHours": 6
        }
      ],
      "assessmentCriteria": "What proves mastery of this phase"
    }
  ]
}

Requirements:
- Each phase should have 2-3 courses and 1-2 projects
- Course titles should be specific and actionable (e.g., "React Fundamentals: Components, Props & State")
- Course descriptions should be detailed (50-100 words explaining what the student will learn)
- Projects should be practical and build on the phase skills
- Hours should be realistic and add up to a reasonable total
- Earlier phases should have more foundational content
- Later phases should have more advanced, applied content
- If prioritizing quick wins, put high-impact skills early`;
}

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
          let resolvedProvider: string;
          try {
            resolvedProvider = await aiClient.getResolvedProvider({
              userId,
            });
          } catch {
            resolvedProvider = 'anthropic';
          }

          const providerDisplayName = resolvedProvider.charAt(0).toUpperCase() + resolvedProvider.slice(1);

          controller.enqueue(sseEvent('progress', {
            stage: 'designing',
            percent: 20,
            message: `Connecting to ${providerDisplayName} AI...`,
            provider: resolvedProvider,
          }));

          // Stage 2: AI Generation
          const prompt = buildRoadmapPrompt(validated);

          controller.enqueue(sseEvent('progress', {
            stage: 'designing',
            percent: 25,
            message: `${providerDisplayName} is designing your learning phases...`,
            provider: resolvedProvider,
          }));

          const aiResult = await aiClient.chat({
            userId,
            capability: 'skill-roadmap',
            systemPrompt: 'You are a learning path design expert. Return only valid JSON.',
            messages: [{ role: 'user', content: prompt }],
            maxTokens: 4000,
            temperature: 0.7,
            extended: true,
          });

          const aiResponseText = aiResult.content;

          controller.enqueue(sseEvent('progress', {
            stage: 'parsing',
            percent: 50,
            message: `${providerDisplayName} generated a response. Parsing roadmap structure...`,
            provider: aiResult.provider,
          }));

          // Parse AI response
          let roadmapData: {
            title: string;
            description: string;
            phases: Array<{
              title: string;
              description: string;
              bloomsLevel: string;
              estimatedHours: number;
              durationWeeks: number;
              skills: Array<{
                skillName: string;
                targetLevel: string;
                estimatedHours: number;
              }>;
              courses: Array<{
                title: string;
                description: string;
                difficulty: string;
                estimatedHours: number;
                reason: string;
              }>;
              projects: Array<{
                title: string;
                description: string;
                difficulty: string;
                estimatedHours: number;
              }>;
              assessmentCriteria: string;
            }>;
          };

          try {
            const cleanJson = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            roadmapData = JSON.parse(cleanJson);
          } catch (parseError) {
            const detail = parseError instanceof Error ? parseError.message : 'Unknown parse error';
            logger.error('[SkillRoadmap] Failed to parse AI response', { detail, responsePreview: aiResponseText.slice(0, 200) });
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

          // Stage 4: Persist to database
          const totalEstimatedHours = roadmapData.phases.reduce(
            (sum, p) => sum + (p.estimatedHours || 0), 0
          );

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
                    })),
                    resources: {
                      courses: phase.courses.map(c => ({
                        title: c.title,
                        description: c.description,
                        difficulty: c.difficulty,
                        estimatedHours: c.estimatedHours,
                        reason: c.reason,
                        matchedCourseId: courseMatchCache.get(c.title) ?? null,
                      })),
                      projects: phase.projects.map(p => ({
                        title: p.title,
                        description: p.description,
                        difficulty: p.difficulty,
                        estimatedHours: p.estimatedHours,
                      })),
                      assessmentCriteria: phase.assessmentCriteria,
                      bloomsLevel: phase.bloomsLevel,
                      durationWeeks: phase.durationWeeks,
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
