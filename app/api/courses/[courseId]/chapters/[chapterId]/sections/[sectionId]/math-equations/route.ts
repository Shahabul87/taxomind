import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Force Node.js runtime
export const runtime = 'nodejs';

// Validation Schema
const MathExplanationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must not exceed 200 characters'),
  latexEquation: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
}).refine(
  (data) => data.latexEquation || data.imageUrl,
  { message: 'Either LaTeX equation or image URL must be provided' }
);

// Type-safe response interface
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    // Verify section ownership
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapter: {
          courseId: params.courseId,
          course: {
            userId: user.id
          }
        }
      }
    });

    if (!section) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this section'
        }
      }, { status: 403 });
    }

    // Fetch math explanations
    const mathExplanations = await db.mathExplanation.findMany({
      where: { sectionId: params.sectionId },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: mathExplanations,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    });
  } catch (error) {
    console.error('[MATH_EQUATIONS_GET]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching math explanations'
      }
    }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = MathExplanationSchema.parse(body);

    // Verify section ownership
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapter: {
          courseId: params.courseId,
          course: {
            userId: user.id
          }
        }
      }
    });

    if (!section) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this section'
        }
      }, { status: 403 });
    }

    // Get max position for ordering
    const maxPosition = await db.mathExplanation.aggregate({
      where: { sectionId: params.sectionId },
      _max: { position: true }
    });

    // Create math explanation
    const mathExplanation = await db.mathExplanation.create({
      data: {
        title: validatedData.title,
        latexEquation: validatedData.latexEquation || null,
        imageUrl: validatedData.imageUrl || null,
        explanation: validatedData.explanation,
        sectionId: params.sectionId,
        position: (maxPosition._max.position || 0) + 1,
        isPublished: true
      }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: mathExplanation,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[MATH_EQUATIONS_POST]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors as unknown as Record<string, unknown>
        }
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating math explanation'
      }
    }, { status: 500 });
  }
} 