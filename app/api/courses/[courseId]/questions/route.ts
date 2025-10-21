import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';

// Schema for creating a question
const CreateQuestionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be at most 200 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters').max(5000, 'Content must be at most 5000 characters'),
  sectionId: z.string().optional(),
});

// Schema for query parameters
const QuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || '1', 10)),
  limit: z.string().optional().transform((val) => parseInt(val || '10', 10)),
  sortBy: z.enum(['recent', 'top', 'unanswered']).optional().default('recent'),
  sectionId: z.string().optional(),
  search: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    courseId: string;
  }>;
}

// GET: List all questions for a course
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to view questions' }
        },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Course not found' }
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sectionId: searchParams.get('sectionId') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const { page, limit, sortBy, sectionId, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      courseId: string;
      sectionId?: string;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        content?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      courseId,
    };

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    let orderBy: Record<string, string> | Array<Record<string, string>> = { createdAt: 'desc' };

    if (sortBy === 'top') {
      orderBy = [{ upvotes: 'desc' }, { createdAt: 'desc' }];
    } else if (sortBy === 'unanswered') {
      orderBy = [{ isAnswered: 'asc' }, { createdAt: 'desc' }];
    }

    // Fetch questions
    const [questions, totalCount] = await Promise.all([
      db.courseQuestion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          section: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              answers: true,
              votes: true,
            },
          },
        },
      }),
      db.courseQuestion.count({ where }),
    ]);

    // Get user's votes for these questions
    const questionIds = questions.map((q) => q.id);
    const userVotes = await db.questionVote.findMany({
      where: {
        userId: user.id,
        questionId: { in: questionIds },
      },
    });

    const userVotesMap = new Map(userVotes.map((v) => [v.questionId, v.value]));

    // Enhance questions with user vote status
    const enhancedQuestions = questions.map((question) => ({
      ...question,
      userVote: userVotesMap.get(question.id) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        questions: enhancedQuestions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching questions',
        },
      },
      { status: 500 }
    );
  }
}

// POST: Create a new question
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to ask a question' }
        },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Verify course exists and user is enrolled
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You must be enrolled in this course to ask questions' }
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateQuestionSchema.parse(body);

    // Verify section exists if provided
    if (validatedData.sectionId) {
      const section = await db.section.findFirst({
        where: {
          id: validatedData.sectionId,
          chapter: {
            courseId,
          },
        },
      });

      if (!section) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Section not found in this course' }
          },
          { status: 404 }
        );
      }
    }

    // Create question
    const question = await db.courseQuestion.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        sectionId: validatedData.sectionId || null,
        courseId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...question,
          userVote: 0, // New question, user hasn't voted yet
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating question:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid question data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating the question',
        },
      },
      { status: 500 }
    );
  }
}
