import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

const UpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  latexEquation: z.string().optional().nullable().transform(val => val || null),
  imageUrl: z.string().optional().nullable().transform(val => val || null).refine(
    (val) => !val || z.string().url().safeParse(val).success,
    { message: 'Invalid image URL' }
  ),
  explanation: z.string().min(10).optional(),
  position: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional()
});

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; mathId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = UpdateSchema.parse(body);

    // Verify ownership
    const mathExplanation = await db.mathExplanation.findUnique({
      where: { id: params.mathId },
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
    });

    if (!mathExplanation || mathExplanation.section.chapter.course.userId !== user.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, { status: 403 });
    }

    // Update math explanation
    const updated = await db.mathExplanation.update({
      where: { id: params.mathId },
      data: validatedData
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updated
    });
  } catch (error) {
    logger.error('[MATH_EXPLANATION_PATCH]', error);

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
      error: { code: 'INTERNAL_ERROR', message: 'Update failed' }
    }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; mathId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 });
    }

    // Verify ownership
    const mathExplanation = await db.mathExplanation.findUnique({
      where: { id: params.mathId },
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
    });

    if (!mathExplanation || mathExplanation.section.chapter.course.userId !== user.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, { status: 403 });
    }

    // Delete math explanation
    await db.mathExplanation.delete({
      where: { id: params.mathId }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    logger.error('[MATH_EXPLANATION_DELETE]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Delete failed' }
    }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; mathId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 });
    }

    // Verify ownership
    const mathExplanation = await db.mathExplanation.findUnique({
      where: { id: params.mathId },
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
    });

    if (!mathExplanation || mathExplanation.section.chapter.course.userId !== user.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, { status: 403 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: mathExplanation
    });
  } catch (error) {
    logger.error('[MATH_EXPLANATION_GET]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch math explanation' }
    }, { status: 500 });
  }
} 