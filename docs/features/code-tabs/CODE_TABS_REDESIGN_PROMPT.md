# Code Tabs Redesign - Intelligent Code Grouping with Hover Explanations

## 🎯 OBJECTIVE
Redesign the Interactive Learning Materials - Code Section to provide an intelligent, elegant system where teachers can:
1. Add multiple code blocks independently
2. Add corresponding explanations for each block
3. Display all code blocks as a unified, complete program
4. Show explanations on hover with smooth animations
5. Follow enterprise standards with full type safety

## 📋 CURRENT IMPLEMENTATION ANALYSIS

### Existing Database Schema (CodeExplanation Model)
```prisma
model CodeExplanation {
  id          String   @id @default(uuid())
  heading     String?  // Title of the code block
  code        String?  // Code content
  explanation String?  // Explanation text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  sectionId   String?
  language    String?  @default("typescript")
  order       Int?     @default(0)  // Order in which blocks appear
  section     Section? @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@index([sectionId])
}
```

### Current Problems
1. **Monolithic Approach**: Current form creates one code block at a time with single explanation
2. **Poor Visualization**: No intelligent grouping or unified display of multiple code blocks
3. **Limited Interactivity**: No hover-based explanation system
4. **Unclear Workflow**: Users must create title + code + explanation together (not separate)
5. **No Grouping Logic**: Code blocks displayed individually, not as cohesive program
6. **Missing Type Safety**: API endpoints lack proper Zod validation and TypeScript interfaces

### Current API Endpoints
- `POST /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-explanations` - Create code blocks
- `GET /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-explanations` - List all
- `DELETE /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-explanations/[explanationId]` - Delete one

## 🎨 PROPOSED REDESIGN

### Design Principles (Enterprise Standards)
1. **Separation of Concerns**: Separate "Add Code" and "Add Explanation" workflows
2. **Intelligent Grouping**: Auto-combine code blocks into complete program view
3. **Interactive Learning**: Hover-based explanation display with smooth animations
4. **Progressive Building**: Add multiple blocks incrementally
5. **Visual Clarity**: Clear visual indicators linking code to explanations
6. **Type Safety**: Full TypeScript + Zod validation throughout

### New User Experience Flow

#### **Workflow 1: Adding Code Blocks**
```
┌─────────────────────────────────────────────────────────────┐
│  Add Code Block                            [+ Add Another]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📝 Block Title: ___________________________________________  │
│      (e.g., "Import Dependencies", "Define User Class")     │
│                                                               │
│  🔧 Language: [TypeScript ▼]                                │
│      • TypeScript  • JavaScript  • Python  • Java           │
│      • C++  • Go  • Rust  • Other                           │
│                                                               │
│  💻 Code Editor                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1  import { User } from './models';                 │   │
│  │ 2  import { Database } from './db';                 │   │
│  │ 3  import { Logger } from './utils';                │   │
│  │ 4                                                    │   │
│  │ 5  // Additional code...                            │   │
│  │                                                      │   │
│  │ [Syntax highlighting, line numbers, autocomplete]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  [Cancel]                                    [Save Block]    │
│                                              [Save & Add More]│
└─────────────────────────────────────────────────────────────┘
```

#### **Workflow 2: Adding Explanations**
```
┌─────────────────────────────────────────────────────────────┐
│  Add Explanation for Code Block                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Select Code Block: [Import Dependencies ▼]                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Available blocks:                                    │   │
│  │ • Import Dependencies (No explanation)              │   │
│  │ • Define User Class (Has explanation)               │   │
│  │ • Create Database Connection (No explanation)       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  📖 Explanation (Rich Text Editor)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [B] [I] [U] [Link] [Code] [List] [Highlight]        │   │
│  │                                                      │   │
│  │ This block imports the essential dependencies:      │   │
│  │ - User model for type safety                        │   │
│  │ - Database client for data operations               │   │
│  │ - Logger for debugging                              │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  [Cancel]                              [Save Explanation]    │
│                                        [Save & Add Another]  │
└─────────────────────────────────────────────────────────────┘
```

#### **Display: Intelligent Unified Code View**
```
┌──────────────────────────────────────────────────────────────┐
│  Complete Code Implementation                    [⚙️ Settings]│
│  📊 3 blocks • 45 lines • TypeScript                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ // 📦 Block 1: Import Dependencies                   ┃  │
│  ┃ 1  import { User } from './models';      [💡 hover]  ┃  │
│  ┃ 2  import { Database } from './db';                   ┃  │
│  ┃ 3  import { Logger } from './utils';                  ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ // 🏗️ Block 2: Define User Class                     ┃  │
│  ┃ 5  class UserService {                    [💡 hover] ┃  │
│  ┃ 6    private db: Database;                           ┃  │
│  ┃ 7    private logger: Logger;                         ┃  │
│  ┃ 8                                                     ┃  │
│  ┃ 9    constructor(db: Database, logger: Logger) {     ┃  │
│  ┃ 10     this.db = db;                                 ┃  │
│  ┃ 11     this.logger = logger;                         ┃  │
│  ┃ 12   }                                                ┃  │
│  ┃ 13 }                                                  ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ // 🔌 Block 3: Create Database Connection            ┃  │
│  ┃ 15 const db = new Database();             [💡 hover] ┃  │
│  ┃ 16 const logger = new Logger();                      ┃  │
│  ┃ 17 const userService = new UserService(db, logger);  ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                │
│  [Copy All Code]  [Download]  [Share]  [Run in Playground]   │
└──────────────────────────────────────────────────────────────┘

HOVER INTERACTION:
┌──────────────────────────────────────────┐
│  When user hovers on "Block 1" area:     │
│  ┌────────────────────────────────────┐  │
│  │ 💡 Import Dependencies              │  │
│  │ ─────────────────────────────────  │  │
│  │                                     │  │
│  │ This block imports the essential    │  │
│  │ dependencies needed for our user    │  │
│  │ service implementation:             │  │
│  │                                     │  │
│  │ • User model for type safety       │  │
│  │ • Database client for data ops     │  │
│  │ • Logger for debugging             │  │
│  │                                     │  │
│  │ [View Details →]                    │  │
│  └────────────────────────────────────┘  │
│  Smooth fade-in animation (200ms)       │
│  Positioned near hovered block          │
│  Auto-dismisses on mouse leave          │
└──────────────────────────────────────────┘
```

### Technical Implementation Specifications

#### **1. Enhanced Database Schema**

**Proposed Schema Changes:**
```prisma
model CodeExplanation {
  id            String   @id @default(uuid())

  // Core content fields
  title         String   @db.VarChar(200)  // Block title (e.g., "Import Dependencies")
  code          String   @db.Text          // Code content
  explanation   String?  @db.Text          // Explanation (optional initially)

  // Metadata
  language      String   @default("typescript") @db.VarChar(50)
  position      Int      @default(0)       // Order in unified view
  lineStart     Int?                       // Starting line in unified view (auto-calculated)
  lineEnd       Int?                       // Ending line in unified view (auto-calculated)

  // Grouping & organization
  sectionId     String
  groupId       String?                    // Optional: group related blocks
  isPublished   Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  section       Section  @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@index([sectionId])
  @@index([sectionId, position])
  @@index([groupId])
}
```

**Migration Script:**
```typescript
// prisma/migrations/[timestamp]_enhance_code_explanation/migration.sql

-- Add new columns
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "title" VARCHAR(200);
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "lineStart" INTEGER;
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "lineEnd" INTEGER;
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
ALTER TABLE "CodeExplanation" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT true;

-- Migrate existing data: use 'heading' as 'title'
UPDATE "CodeExplanation"
SET "title" = COALESCE("heading", 'Code Block')
WHERE "title" IS NULL;

-- Make title required
ALTER TABLE "CodeExplanation" ALTER COLUMN "title" SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "CodeExplanation_sectionId_position_idx" ON "CodeExplanation"("sectionId", "position");
CREATE INDEX IF NOT EXISTS "CodeExplanation_groupId_idx" ON "CodeExplanation"("groupId");

-- Drop heading column (replaced by title)
ALTER TABLE "CodeExplanation" DROP COLUMN IF EXISTS "heading";
```

#### **2. Type-Safe API Endpoints**

**File:** `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-blocks/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
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

const UpdateCodeBlockSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  code: z.string().min(1).max(50000).optional(),
  language: z.string().min(1).max(50).optional(),
  position: z.number().int().min(0).optional(),
  explanation: z.string().optional(),
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

    // Verify ownership
    const hasAccess = await verifySectionOwnership(
      params.sectionId,
      params.courseId,
      user.id
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
    const validatedData = CreateCodeBlocksSchema.parse(body);

    // Verify ownership
    const hasAccess = await verifySectionOwnership(
      params.sectionId,
      params.courseId,
      user.id
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
            explanation: null, // Initially no explanation
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
```

**File:** `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-blocks/[blockId]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const UpdateBlockSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  code: z.string().min(1).max(50000).optional(),
  language: z.string().min(1).max(50).optional(),
  explanation: z.string().optional(),
  position: z.number().int().min(0).optional(),
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

/**
 * PATCH - Update a code block
 */
export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; blockId: string }> }
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
    const validatedData = UpdateBlockSchema.parse(body);

    // Verify ownership
    const codeBlock = await db.codeExplanation.findUnique({
      where: { id: params.blockId },
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

    if (!codeBlock || codeBlock.section.chapter.course.userId !== user.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, { status: 403 });
    }

    // Update block
    const updated = await db.codeExplanation.update({
      where: { id: params.blockId },
      data: validatedData
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[CODE_BLOCK_PATCH]', error);

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

/**
 * DELETE - Remove a code block
 */
export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; blockId: string }> }
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
    const codeBlock = await db.codeExplanation.findUnique({
      where: { id: params.blockId },
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

    if (!codeBlock || codeBlock.section.chapter.course.userId !== user.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, { status: 403 });
    }

    // Delete block
    await db.codeExplanation.delete({
      where: { id: params.blockId }
    });

    // Recalculate line numbers for remaining blocks
    const remainingBlocks = await db.codeExplanation.findMany({
      where: { sectionId: params.sectionId },
      orderBy: { position: 'asc' }
    });

    if (remainingBlocks.length > 0) {
      const lineNumbers = remainingBlocks.map((block, index) => {
        const lines = (block.code || '').split('\n').length;
        const lineStart = index === 0 ? 1 : (remainingBlocks[index - 1].lineEnd || 0) + 2;
        const lineEnd = lineStart + lines - 1;
        return { id: block.id, lineStart, lineEnd };
      });

      await Promise.all(
        lineNumbers.map(({ id, lineStart, lineEnd }) =>
          db.codeExplanation.update({
            where: { id },
            data: { lineStart, lineEnd }
          })
        )
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    console.error('[CODE_BLOCK_DELETE]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Delete failed' }
    }, { status: 500 });
  }
}
```

**File:** `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-blocks/[blockId]/explanation/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const ExplanationSchema = z.object({
  explanation: z.string()
    .min(10, 'Explanation must be at least 10 characters')
    .max(50000, 'Explanation must not exceed 50,000 characters')
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

/**
 * POST/PATCH - Add or update explanation for a code block
 */
export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; blockId: string }> }
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
    const validatedData = ExplanationSchema.parse(body);

    // Verify ownership
    const codeBlock = await db.codeExplanation.findUnique({
      where: { id: params.blockId },
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

    if (!codeBlock || codeBlock.section.chapter.course.userId !== user.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, { status: 403 });
    }

    // Update explanation
    const updated = await db.codeExplanation.update({
      where: { id: params.blockId },
      data: {
        explanation: validatedData.explanation,
        updatedAt: new Date()
      }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[CODE_BLOCK_EXPLANATION]', error);

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
```

#### **3. Frontend Component Architecture**

**Component Structure:**
```
_components/
├── code/
│   ├── CodeBlockManager.tsx          # Main container (Smart Component)
│   ├── AddCodeBlockForm.tsx          # Form for adding code blocks
│   ├── AddExplanationForm.tsx        # Form for adding explanations
│   ├── UnifiedCodeView.tsx           # Displays all blocks as complete program
│   ├── CodeBlockCard.tsx             # Individual block with hover interaction
│   ├── ExplanationTooltip.tsx        # Animated tooltip for explanations
│   ├── CodeEditor.tsx                # Monaco/CodeMirror editor component
│   └── CodeBlockList.tsx             # List view for managing blocks
```

**File:** `_components/code/UnifiedCodeView.tsx`

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Download, Play, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExplanationTooltip } from "./ExplanationTooltip";

interface CodeBlock {
  id: string;
  title: string;
  code: string;
  explanation: string | null;
  language: string;
  position: number;
  lineStart: number | null;
  lineEnd: number | null;
}

interface UnifiedCodeViewProps {
  blocks: CodeBlock[];
  onEdit?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
}

export const UnifiedCodeView = ({
  blocks,
  onEdit,
  onDelete
}: UnifiedCodeViewProps) => {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showExplanations, setShowExplanations] = useState(true);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort blocks by position
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);

  // Combine all code into unified view
  const unifiedCode = sortedBlocks
    .map(block => `// ${block.title}\n${block.code}`)
    .join('\n\n');

  const totalLines = unifiedCode.split('\n').length;
  const language = sortedBlocks[0]?.language || 'typescript';

  // Handle mouse hover on code blocks
  const handleBlockHover = (
    blockId: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!showExplanations) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block?.explanation) return;

    setHoveredBlockId(blockId);

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 16,
      y: rect.top
    });
  };

  const handleBlockLeave = () => {
    setHoveredBlockId(null);
  };

  // Copy entire code to clipboard
  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(unifiedCode);
      toast.success('Code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  // Copy individual block
  const handleCopyBlock = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    try {
      await navigator.clipboard.writeText(block.code);
      setCopiedBlockId(blockId);
      toast.success(`"${block.title}" copied!`);
      setTimeout(() => setCopiedBlockId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  // Download as file
  const handleDownload = () => {
    const blob = new Blob([unifiedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-complete.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-bold">
              Complete Code Implementation
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              {sortedBlocks.length} {sortedBlocks.length === 1 ? 'Block' : 'Blocks'}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {totalLines} Lines
            </Badge>
            <Badge variant="secondary">
              {language}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanations(!showExplanations)}
              className="gap-2"
            >
              {showExplanations ? (
                <>
                  <Eye className="h-4 w-4" />
                  Hide Explanations
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Show Explanations
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative" ref={containerRef}>
        <div className="relative">
          {sortedBlocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative border-b border-gray-200 dark:border-gray-800 last:border-b-0"
              onMouseEnter={(e) => handleBlockHover(block.id, e)}
              onMouseLeave={handleBlockLeave}
            >
              {/* Block Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {block.title}
                  </span>
                  {block.explanation && showExplanations && (
                    <Badge variant="secondary" className="text-xs">
                      💡 Hover for explanation
                    </Badge>
                  )}
                  {!block.explanation && (
                    <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                      No explanation yet
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyBlock(block.id)}
                    className="h-7 px-2 text-xs"
                  >
                    {copiedBlockId === block.id ? (
                      <>✓ Copied</>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(block.id)}
                      className="h-7 px-2 text-xs"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Code Block */}
              <div className="relative group">
                <SyntaxHighlighter
                  language={block.language}
                  style={vscDarkPlus}
                  showLineNumbers
                  startingLineNumber={block.lineStart || 1}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: 'transparent',
                    fontSize: '0.875rem',
                  }}
                  lineNumberStyle={{
                    minWidth: '3rem',
                    paddingRight: '1rem',
                    color: '#6B7280',
                  }}
                >
                  {block.code}
                </SyntaxHighlighter>

                {/* Hover overlay */}
                {block.explanation && showExplanations && hoveredBlockId === block.id && (
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Explanation Tooltip */}
        <AnimatePresence>
          {hoveredBlockId && showExplanations && (
            <ExplanationTooltip
              explanation={blocks.find(b => b.id === hoveredBlockId)?.explanation || ''}
              title={blocks.find(b => b.id === hoveredBlockId)?.title || ''}
              position={tooltipPosition}
              onClose={() => setHoveredBlockId(null)}
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
```

**File:** `_components/code/ExplanationTooltip.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExplanationTooltipProps {
  explanation: string;
  title: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const ExplanationTooltip = ({
  explanation,
  title,
  position,
  onClose
}: ExplanationTooltipProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed z-50 w-96 max-w-sm"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-blue-500/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <h4 className="font-semibold text-sm truncate">{title}</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-white/20 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-96 p-4">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: explanation }}
          />
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Move your mouse away to close
          </p>
        </div>
      </div>
    </motion.div>
  );
};
```

#### **4. Responsive Design Specifications**

**Breakpoint System:**
```typescript
// tailwind.config.ts
const breakpoints = {
  'xs': '320px',   // Small phones
  'sm': '640px',   // Phones
  'md': '768px',   // Tablets
  'lg': '1024px',  // Small laptops
  'xl': '1280px',  // Laptops
  '2xl': '1536px', // Desktops
};
```

**Responsive Behavior:**

| Screen Size | Unified Code View | Explanation Tooltip | Actions |
|-------------|------------------|---------------------|---------|
| **xs (< 640px)** | Single column, horizontal scroll for wide code | Bottom sheet (slides up) | Stacked vertically |
| **sm (640px - 768px)** | Single column, better padding | Bottom sheet | Stacked vertically |
| **md (768px - 1024px)** | Single column, optimal width | Right side tooltip (smaller) | Horizontal layout |
| **lg (1024px - 1280px)** | Full width, side panel | Right side tooltip | Full horizontal |
| **xl (1280px+)** | Centered with max-width | Right side tooltip (large) | Full horizontal |

**Mobile-First CSS:**
```css
/* _components/code/UnifiedCodeView.module.css */

/* Base (Mobile) */
.unified-code-container {
  @apply w-full px-2 py-4;
}

.code-block {
  @apply w-full overflow-x-auto rounded-lg;
}

.explanation-tooltip {
  @apply fixed bottom-0 left-0 right-0 max-h-[60vh];
  @apply rounded-t-2xl shadow-2xl;
}

/* Tablet */
@screen md {
  .unified-code-container {
    @apply px-6 py-6;
  }

  .explanation-tooltip {
    @apply fixed bottom-auto left-auto right-auto max-h-96 w-96;
    @apply rounded-lg;
  }
}

/* Desktop */
@screen lg {
  .unified-code-container {
    @apply max-w-6xl mx-auto px-8 py-8;
  }

  .code-block {
    @apply rounded-xl;
  }
}
```

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Database & API (Day 1-2)
1. ✅ Create migration to enhance CodeExplanation schema
2. ✅ Add new columns: `title`, `position`, `lineStart`, `lineEnd`, `groupId`
3. ✅ Migrate existing data
4. ✅ Implement type-safe API endpoints with Zod validation
5. ✅ Add line number calculation logic
6. ✅ Write API integration tests

### Phase 2: Core Components (Day 3-4)
1. ✅ Build `AddCodeBlockForm` component
2. ✅ Build `AddExplanationForm` component
3. ✅ Create `UnifiedCodeView` with intelligent grouping
4. ✅ Implement `ExplanationTooltip` with smooth animations
5. ✅ Integrate Monaco/CodeMirror editor
6. ✅ Add syntax highlighting

### Phase 3: Interactivity & Polish (Day 5)
1. ✅ Implement hover detection and tooltip positioning
2. ✅ Add copy/download functionality
3. ✅ Create mobile-responsive tooltip (bottom sheet)
4. ✅ Add keyboard shortcuts (Esc to close tooltip)
5. ✅ Implement smooth animations with Framer Motion
6. ✅ Add loading states and error boundaries

### Phase 4: Integration & Testing (Day 6)
1. ✅ Integrate with existing section page
2. ✅ Test all user flows
3. ✅ Perform accessibility audit (WCAG 2.1 AA)
4. ✅ Test responsive design on all breakpoints
5. ✅ Cross-browser testing
6. ✅ Performance optimization

### Phase 5: Deploy (Day 7)
1. ✅ Final QA
2. ✅ Update user documentation
3. ✅ Deploy to staging
4. ✅ User acceptance testing
5. ✅ Production deployment

## 📝 SUCCESS CRITERIA

✅ Teachers can add code blocks independently
✅ Teachers can add explanations separately
✅ All code blocks display as unified, complete program
✅ Hover on any block shows corresponding explanation
✅ Smooth animations (< 200ms)
✅ Responsive on all devices (320px - 1920px+)
✅ Full type safety (zero `any` types)
✅ Enterprise-grade API security
✅ WCAG 2.1 AA accessibility compliance
✅ < 100ms interaction time (hover to tooltip)
✅ Zero TypeScript errors
✅ Zero ESLint warnings

## 🎯 AGENT EXECUTION INSTRUCTIONS

When executing this redesign, follow these steps:

1. **Read this entire document carefully**
2. **Follow the implementation roadmap sequentially**
3. **Adhere to all enterprise standards** (from CLAUDE.md)
4. **Test each component before moving to the next**
5. **Run linting and type checking after each file**
6. **Update this document with any deviations or improvements**

### CRITICAL RULES:
- ⛔ **NEVER use `any` type**
- ⛔ **NEVER skip validation**
- ⛔ **NEVER commit code with TypeScript/ESLint errors**
- ⛔ **NEVER create files with "_enhanced", "_new" suffixes**
- ✅ **ALWAYS test functionality before marking complete**
- ✅ **ALWAYS follow the existing project patterns**
- ✅ **ALWAYS use Zod for schema validation**
- ✅ **ALWAYS implement proper error boundaries**
- ✅ **ALWAYS add loading states**

## 📊 TECHNICAL SPECIFICATIONS SUMMARY

### Database
- Enhanced `CodeExplanation` model with intelligent fields
- Auto-calculated line numbers for unified view
- Proper indexing for performance

### API Endpoints
- Type-safe with Zod schemas
- Comprehensive error handling
- Standard ApiResponse interface
- Full authentication & authorization

### Frontend
- React with TypeScript (strict mode)
- Framer Motion for animations
- Syntax highlighting with Prism
- Monaco/CodeMirror for editing
- Responsive design (mobile-first)
- Accessibility built-in

### Performance
- Line number calculation: O(n)
- Hover detection: O(1)
- Rendering: Virtualized for large code
- Bundle size: Optimized with code splitting

---

**Last Updated:** 2025-01-16
**Status:** Ready for Implementation
**Agent:** Awaiting execution command
**Estimated Completion:** 7 days
