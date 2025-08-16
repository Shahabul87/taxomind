import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Types
interface LearningAnalysis {
  completedCourses: Array<{
    courseId: string;
    title: string;
    category: string;
    completionPercentage: number;
    averageScore?: number;
  }>;
  examPerformance: Array<{
    courseTitle: string;
    examTitle: string;
    scorePercentage: number;
    bloomsPerformance: Record<string, number>;
    weakAreas: string[];
  }>;
  learningPatterns: {
    preferredCategories: string[];
    averageCompletionRate: number;
    strongBloomsLevels: string[];
    weakBloomsLevels: string[];
    learningPace: "fast" | "moderate" | "slow";
  };
}

interface PathNode {
  name: string;
  description: string;
  contentType: "COURSE" | "SKILL" | "ASSESSMENT";
  contentId?: string;
  order: number;
  prerequisites: string[];
}

interface RecommendedPath {
  name: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  estimatedDuration: number;
  reason: string;
  nodes: PathNode[];
  basedOn: "PERFORMANCE_BASED" | "SKILL_GAP" | "INTEREST_BASED" | "SEQUENTIAL" | "REMEDIAL";
  score: number;
}

async function analyzeLearningHistory(userId: string): Promise<LearningAnalysis> {
  // Get completed courses with progress
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      Course: {
        include: {
          category: true,
        }
      }
    }
  });

  const completedCourses = enrollments.map(enrollment => {
    // For now, assume 100% completion since we don't have access to progress relation
    const completionPercentage = 100;

    return {
      courseId: enrollment.courseId,
      title: enrollment.Course.title,
      category: enrollment.Course.category?.name || "Uncategorized",
      completionPercentage,
    };
  });

  // Get exam performance
  const examAttempts = await db.userExamAttempt.findMany({
    where: { 
      userId,
      status: "GRADED"
    },
    include: {
      Exam: {
        include: {
          section: {
            include: {
              chapter: {
                include: {
                  course: true
                }
              }
            }
          }
        }
      },
      UserAnswer: {
        include: {
          ExamQuestion: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 10 // Last 10 exams
  });

  const examPerformance = examAttempts.map(attempt => {
    // Calculate Bloom's taxonomy performance
    const bloomsPerformance: Record<string, { correct: number; total: number }> = {};
    const weakAreas: string[] = [];

    attempt.UserAnswer.forEach(answer => {
      const bloomsLevel = answer.ExamQuestion.bloomsLevel || "REMEMBER";
      if (!bloomsPerformance[bloomsLevel]) {
        bloomsPerformance[bloomsLevel] = { correct: 0, total: 0 };
      }
      bloomsPerformance[bloomsLevel].total++;
      if (answer.isCorrect) {
        bloomsPerformance[bloomsLevel].correct++;
      }
    });

    // Calculate percentages and identify weak areas
    const bloomsScores: Record<string, number> = {};
    Object.entries(bloomsPerformance).forEach(([level, stats]) => {
      const percentage = (stats.correct / stats.total) * 100;
      bloomsScores[level] = percentage;
      if (percentage < 60) {
        weakAreas.push(level);
      }
    });

    return {
      courseTitle: attempt.Exam.section.chapter.course.title,
      examTitle: attempt.Exam.title,
      scorePercentage: attempt.scorePercentage || 0,
      bloomsPerformance: bloomsScores,
      weakAreas,
    };
  });

  // Analyze learning patterns
  const categoryCount: Record<string, number> = {};
  let totalCompletionRate = 0;
  let courseCount = 0;

  completedCourses.forEach(course => {
    categoryCount[course.category] = (categoryCount[course.category] || 0) + 1;
    if (course.completionPercentage > 0) {
      totalCompletionRate += course.completionPercentage;
      courseCount++;
    }
  });

  const preferredCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);

  const averageCompletionRate = courseCount > 0 ? totalCompletionRate / courseCount : 0;

  // Analyze Bloom's taxonomy strengths and weaknesses
  const allBloomsScores: Record<string, number[]> = {};
  examPerformance.forEach(exam => {
    Object.entries(exam.bloomsPerformance).forEach(([level, score]) => {
      if (!allBloomsScores[level]) allBloomsScores[level] = [];
      allBloomsScores[level].push(score);
    });
  });

  const bloomsAverages: Record<string, number> = {};
  Object.entries(allBloomsScores).forEach(([level, scores]) => {
    bloomsAverages[level] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  const strongBloomsLevels = Object.entries(bloomsAverages)
    .filter(([, avg]) => avg >= 80)
    .map(([level]) => level);

  const weakBloomsLevels = Object.entries(bloomsAverages)
    .filter(([, avg]) => avg < 60)
    .map(([level]) => level);

  // Determine learning pace
  let learningPace: "fast" | "moderate" | "slow" = "moderate";
  if (averageCompletionRate >= 80 && examPerformance.length > 5) {
    learningPace = "fast";
  } else if (averageCompletionRate < 50) {
    learningPace = "slow";
  }

  return {
    completedCourses,
    examPerformance,
    learningPatterns: {
      preferredCategories,
      averageCompletionRate,
      strongBloomsLevels,
      weakBloomsLevels,
      learningPace,
    },
  };
}

async function getAvailableCourses(userId: string, categories: string[]) {
  // Get courses the user hasn't enrolled in yet
  const enrolledCourseIds = await db.enrollment.findMany({
    where: { userId },
    select: { courseId: true }
  });

  const enrolledIds = enrolledCourseIds.map(e => e.courseId);

  const availableCourses = await db.course.findMany({
    where: {
      isPublished: true,
      id: { notIn: enrolledIds },
      ...(categories.length > 0 ? {
        category: {
          name: { in: categories }
        }
      } : {})
    },
    include: {
      category: true,
      chapters: {
        where: { isPublished: true },
        orderBy: { position: "asc" }
      }
    },
    take: 50
  });

  return availableCourses;
}

async function generateAIRecommendations(
  analysis: LearningAnalysis,
  availableCourses: any[]
): Promise<RecommendedPath[]> {
  try {
    const systemPrompt = `You are an expert educational path recommender. Based on the learner's history and available courses, create personalized learning paths.

Learner Analysis:
- Completed Courses: ${analysis.completedCourses.length}
- Average Completion Rate: ${analysis.learningPatterns.averageCompletionRate.toFixed(1)}%
- Preferred Categories: ${analysis.learningPatterns.preferredCategories.join(", ")}
- Learning Pace: ${analysis.learningPatterns.learningPace}
- Strong Bloom's Levels: ${analysis.learningPatterns.strongBloomsLevels.join(", ")}
- Weak Bloom's Levels: ${analysis.learningPatterns.weakBloomsLevels.join(", ")}

Recent Exam Performance:
${analysis.examPerformance.slice(0, 3).map(exam => 
  `- ${exam.courseTitle}: ${exam.scorePercentage}% (Weak areas: ${exam.weakAreas.join(", ")})`
).join("\n")}

Available Courses:
${availableCourses.slice(0, 20).map(course => 
  `- ${course.title} (${course.category?.name || "General"}, ${course.chapters.length} chapters)`
).join("\n")}

Create 3-5 personalized learning paths. Each path should:
1. Address identified weaknesses or build on strengths
2. Match the learner's pace and preferences
3. Include 3-7 logical steps (courses or skills)
4. Provide clear reasoning for the recommendation
5. Estimate realistic duration based on learner's pace

Return as JSON array with this structure:
{
  "paths": [
    {
      "name": "Path name",
      "description": "Path description",
      "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
      "estimatedDuration": hours_as_number,
      "reason": "Why this path is recommended",
      "basedOn": "PERFORMANCE_BASED|SKILL_GAP|INTEREST_BASED|SEQUENTIAL|REMEDIAL",
      "score": 0.0-1.0,
      "nodes": [
        {
          "name": "Node name",
          "description": "What learner will achieve",
          "contentType": "COURSE|SKILL|ASSESSMENT",
          "suggestedCourseTitle": "Exact course title from available courses or 'NEW' for skills",
          "order": 1,
          "prerequisites": []
        }
      ]
    }
  ]
}`;

    const userContext = `Generate personalized learning paths for this learner.`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userContext }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    // Parse AI response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);
    const paths: RecommendedPath[] = aiResponse.paths;

    // Map suggested courses to actual course IDs
    paths.forEach(path => {
      path.nodes.forEach(node => {
        if (node.contentType === "COURSE") {
          const matchingCourse = availableCourses.find(
            c => c.title.toLowerCase() === (node as any).suggestedCourseTitle?.toLowerCase()
          );
          if (matchingCourse) {
            node.contentId = matchingCourse.id;
          }
        }
      });
    });

    return paths;
  } catch (error: any) {
    logger.error("AI recommendation generation failed:", error);
    // Return fallback recommendations
    return generateFallbackRecommendations(analysis, availableCourses);
  }
}

function generateFallbackRecommendations(
  analysis: LearningAnalysis,
  availableCourses: any[]
): RecommendedPath[] {
  const recommendations: RecommendedPath[] = [];

  // 1. Skill Gap Path - Address weak Bloom's levels
  if (analysis.learningPatterns.weakBloomsLevels.length > 0) {
    const weakLevel = analysis.learningPatterns.weakBloomsLevels[0];
    const relevantCourses = availableCourses
      .filter(c => c.category?.name && analysis.learningPatterns.preferredCategories.includes(c.category.name))
      .slice(0, 3);

    recommendations.push({
      name: `Strengthen ${weakLevel} Skills`,
      description: `Focus on improving your ${weakLevel.toLowerCase()} cognitive skills through targeted practice`,
      difficulty: "INTERMEDIATE",
      estimatedDuration: 40,
      reason: `Your recent assessments show room for improvement in ${weakLevel} level questions`,
      basedOn: "SKILL_GAP",
      score: 0.85,
      nodes: relevantCourses.map((course, index) => ({
        name: course.title,
        description: `Complete this course with focus on ${weakLevel} exercises`,
        contentType: "COURSE",
        contentId: course.id,
        order: index + 1,
        prerequisites: index > 0 ? [`node-${index}`] : []
      }))
    });
  }

  // 2. Interest-Based Path - Build on preferred categories
  if (analysis.learningPatterns.preferredCategories.length > 0) {
    const category = analysis.learningPatterns.preferredCategories[0];
    const categoryCourses = availableCourses
      .filter(c => c.category?.name === category)
      .slice(0, 4);

    if (categoryCourses.length > 0) {
      recommendations.push({
        name: `Advanced ${category} Mastery`,
        description: `Deepen your expertise in ${category} with advanced courses`,
        difficulty: "ADVANCED",
        estimatedDuration: 60,
        reason: `You've shown strong interest and performance in ${category} topics`,
        basedOn: "INTEREST_BASED",
        score: 0.80,
        nodes: categoryCourses.map((course, index) => ({
          name: course.title,
          description: `Master advanced concepts in ${course.title}`,
          contentType: "COURSE",
          contentId: course.id,
          order: index + 1,
          prerequisites: []
        }))
      });
    }
  }

  // 3. Sequential Path - Next logical steps
  const diverseCourses = availableCourses
    .filter(c => !analysis.learningPatterns.preferredCategories.includes(c.category?.name || ""))
    .slice(0, 3);

  if (diverseCourses.length > 0) {
    recommendations.push({
      name: "Explore New Horizons",
      description: "Broaden your knowledge with courses in new areas",
      difficulty: "BEGINNER",
      estimatedDuration: 30,
      reason: "Diversifying your skills can open new opportunities and perspectives",
      basedOn: "SEQUENTIAL",
      score: 0.70,
      nodes: diverseCourses.map((course, index) => ({
        name: course.title,
        description: `Introduction to ${course.category?.name || "new concepts"}`,
        contentType: "COURSE",
        contentId: course.id,
        order: index + 1,
        prerequisites: []
      }))
    });
  }

  return recommendations;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Analyze user's learning history
    const analysis = await analyzeLearningHistory(userId);

    // Get available courses
    const availableCourses = await getAvailableCourses(
      userId,
      analysis.learningPatterns.preferredCategories
    );

    // Generate AI recommendations
    const recommendedPaths = await generateAIRecommendations(analysis, availableCourses);

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendedPaths.map(async (path) => {
        // Create learning path
        const createdPath = await db.learningPath.create({
          data: {
            id: randomUUID(),
            name: path.name,
            description: path.description,
            difficulty: path.difficulty,
            estimatedDuration: path.estimatedDuration,
            generationType: "AI_GENERATED",
            isPublic: false,
            updatedAt: new Date(),
            LearningPathNode: {
              create: path.nodes.map(node => ({
                id: randomUUID(),
                name: node.name,
                description: node.description,
                contentType: node.contentType,
                contentId: node.contentId,
                order: node.order,
                prerequisites: node.prerequisites,
                updatedAt: new Date(),
              }))
            }
          },
          include: {
            LearningPathNode: true
          }
        });

        // Create recommendation
        const recommendation = await db.pathRecommendation.create({
          data: {
            id: randomUUID(),
            userId,
            pathId: createdPath.id,
            reason: path.reason,
            score: path.score,
            basedOn: path.basedOn,
            priority: Math.round(path.score * 100),
            updatedAt: new Date(),
            metadata: {
              analysis: {
                completedCourses: analysis.completedCourses.length,
                averageCompletion: analysis.learningPatterns.averageCompletionRate,
                weakAreas: analysis.learningPatterns.weakBloomsLevels,
              }
            }
          },
          include: {
            LearningPath: {
              include: {
                LearningPathNode: true
              }
            }
          }
        });

        return recommendation;
      })
    );

    return NextResponse.json({
      success: true,
      recommendations: savedRecommendations,
      analysis: {
        coursesAnalyzed: analysis.completedCourses.length,
        examsAnalyzed: analysis.examPerformance.length,
        learningPace: analysis.learningPatterns.learningPace,
        strongAreas: analysis.learningPatterns.strongBloomsLevels,
        weakAreas: analysis.learningPatterns.weakBloomsLevels,
      }
    });
  } catch (error: any) {
    logger.error("Learning path recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active recommendations for the user
    const recommendations = await db.pathRecommendation.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        LearningPath: {
          include: {
            LearningPathNode: {
              orderBy: { order: "asc" }
            },
            PathEnrollment: {
              where: { userId: session.user.id }
            }
          }
        },
        RecommendationInteraction: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: [
        { priority: "desc" },
        { score: "desc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({
      success: true,
      recommendations
    });
  } catch (error: any) {
    logger.error("Fetch recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}