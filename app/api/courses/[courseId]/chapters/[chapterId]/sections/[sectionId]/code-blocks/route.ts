import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// Force Node.js runtime
export const runtime = 'nodejs';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CodeBlockSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  code: z.string()
    .min(1, 'Code is required')
    .max(50000, 'Code must not exceed 50,000 characters'),
  explanation: z.string()
    .max(50000, 'Explanation must not exceed 50,000 characters')
    .nullable()
    .optional(),
  language: z.string()
    .min(1)
    .max(50)
    .default('typescript'),
  position: z.number()
    .int()
    .min(0)
    .optional(),
  groupId: z.string()
    .uuid()
    .optional(),
});

const CreateCodeBlocksSchema = z.object({
  blocks: z.array(CodeBlockSchema)
    .min(1, 'At least one code block is required')
    .max(50, 'Cannot create more than 50 blocks at once')
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
    count?: number;
  };
}

interface CodeBlock {
  id: string;
  title: string;
  code: string;
  explanation: string | null;
  language: string;
  position: number;
  lineStart: number | null;
  lineEnd: number | null;
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate line numbers for unified code view
 * This function processes all code blocks in order and assigns line ranges
 */
const calculateLineNumbers = (blocks: { code: string; position: number }[]) => {
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);
  let currentLine = 1;

  return sortedBlocks.map((block) => {
    const lines = block.code.split('\n').length;
    const lineStart = currentLine;
    const lineEnd = currentLine + lines - 1;
    currentLine = lineEnd + 2; // +2 for visual separation

    return { lineStart, lineEnd };
  });
};

/**
 * Verify section ownership through course relationship
 */
const verifySectionOwnership = async (
  sectionId: string,
  courseId: string,
  userId: string
) => {
  const section = await db.section.findUnique({
    where: {
      id: sectionId,
      chapter: {
        courseId: courseId,
        course: {
          userId: userId
        }
      }
    }
  });

  return section !== null;
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET - Retrieve all code blocks for a section
 * Returns blocks in order with calculated line numbers for unified view
 */
export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    // Verify ownership
    const hasAccess = await verifySectionOwnership(
      params.sectionId,
      params.courseId,
      userId
    );

    if (!hasAccess) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this section'
        }
      }, { status: 403 });
    }

    // Fetch code blocks
    const codeBlocks = await db.codeExplanation.findMany({
      where: {
        sectionId: params.sectionId,
        isPublished: true
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Calculate line numbers for unified view
    if (codeBlocks.length > 0) {
      const lineNumbers = calculateLineNumbers(
        codeBlocks.map(b => ({ code: b.code || '', position: b.position }))
      );

      // Update blocks with line numbers
      await Promise.all(
        codeBlocks.map((block, index) =>
          db.codeExplanation.update({
            where: { id: block.id },
            data: {
              lineStart: lineNumbers[index].lineStart,
              lineEnd: lineNumbers[index].lineEnd
            }
          })
        )
      );

      // Refetch with updated line numbers
      const updatedBlocks = await db.codeExplanation.findMany({
        where: {
          sectionId: params.sectionId,
          isPublished: true
        },
        orderBy: [
          { position: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      return NextResponse.json<ApiResponse<CodeBlock[]>>({
        success: true,
        data: updatedBlocks as CodeBlock[],
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          count: updatedBlocks.length
        }
      });
    }

    return NextResponse.json<ApiResponse<CodeBlock[]>>({
      success: true,
      data: [],
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        count: 0
      }
    });
  } catch (error) {
    console.error('[CODE_BLOCKS_GET]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching code blocks'
      }
    }, { status: 500 });
  }
}

/**
 * POST - Create one or more code blocks
 * Supports batch creation and auto-calculates line numbers
 */
export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
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
    const validatedData = CreateCodeBlocksSchema.parse(body);

    // Verify ownership
    const hasAccess = await verifySectionOwnership(
      params.sectionId,
      params.courseId,
      userId
    );

    if (!hasAccess) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this section'
        }
      }, { status: 403 });
    }

    // Get max position for ordering
    const maxPosition = await db.codeExplanation.aggregate({
      where: { sectionId: params.sectionId },
      _max: { position: true }
    });

    const startPosition = (maxPosition._max.position || -1) + 1;

    // Create code blocks
    const createdBlocks = await Promise.all(
      validatedData.blocks.map((block, index) =>
        db.codeExplanation.create({
          data: {
            title: block.title,
            code: block.code,
            language: block.language,
            position: block.position ?? (startPosition + index),
            groupId: block.groupId || null,
            explanation: block.explanation || null,
            sectionId: params.sectionId,
            isPublished: true
          }
        })
      )
    );

    // Calculate and update line numbers
    const allBlocks = await db.codeExplanation.findMany({
      where: { sectionId: params.sectionId },
      orderBy: { position: 'asc' }
    });

    const lineNumbers = calculateLineNumbers(
      allBlocks.map(b => ({ code: b.code || '', position: b.position }))
    );

    await Promise.all(
      allBlocks.map((block, index) =>
        db.codeExplanation.update({
          where: { id: block.id },
          data: {
            lineStart: lineNumbers[index].lineStart,
            lineEnd: lineNumbers[index].lineEnd
          }
        })
      )
    );

    return NextResponse.json<ApiResponse<CodeBlock[]>>({
      success: true,
      data: createdBlocks as CodeBlock[],
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        count: createdBlocks.length
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[CODE_BLOCKS_POST]', error);

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
        message: 'An error occurred while creating code blocks'
      }
    }, { status: 500 });
  }
}
