# AI-Powered Course Depth Analyzer V2 - Implementation Plan

## Executive Summary

Transform the Depth Analyzer V2 from rule-based to AI-powered analysis. The AI will deeply analyze courses using Bloom's Taxonomy, check content consistency, identify gaps, and provide specific, actionable fixes with exact locations (course page, chapter page, section page).

---

## Current State (Rule-Based)

The current implementation uses:
- **Keyword matching** for Bloom's classification (e.g., "define" → REMEMBER)
- **Word count checks** for thin sections
- **Text similarity** for duplicate detection
- **Template-based** fix suggestions

**Problem**: No semantic understanding, misses context, generic suggestions.

---

## Target State (AI-Powered)

### What AI Will Analyze

1. **Bloom's Taxonomy Compliance**
   - Is content properly scaffolded from Remember → Create?
   - Does each chapter progressively build cognitive complexity?
   - Are learning objectives aligned with content depth?

2. **Content Quality & Consistency**
   - Is the course content comprehensive and well-structured?
   - Is terminology consistent across chapters/sections?
   - Is the writing style consistent?
   - Are there unexplained jargon or concepts?

3. **Knowledge Flow & Dependencies**
   - Are prerequisites introduced before being used?
   - Is there logical progression between topics?
   - Are there cognitive jumps that could confuse learners?

4. **Learning Objectives Alignment**
   - Do section objectives match actual content?
   - Do chapter objectives roll up correctly?
   - Are course goals adequately covered?

5. **Gap Detection**
   - Missing topics mentioned in goals but not covered
   - Incomplete explanations
   - Missing examples or practice opportunities

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Depth Analysis Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User clicks "Start Analysis"                                 │
│                         ↓                                         │
│  2. API calculates course size                                   │
│     - If ≤ 50,000 tokens: Full course analysis                   │
│     - If > 50,000 tokens: Chapter-by-chapter analysis            │
│                         ↓                                         │
│  3. SSE stream starts, frontend shows progress                   │
│                         ↓                                         │
│  4. AI analyzes with structured prompts:                         │
│     a. Overall course structure analysis                         │
│     b. Per-chapter Bloom's classification                        │
│     c. Per-section content quality check                         │
│     d. Cross-chapter consistency check                           │
│     e. Issue generation with exact locations                     │
│                         ↓                                         │
│  5. Issues saved to database with:                               │
│     - Exact location (courseId, chapterId, sectionId)            │
│     - Direct link to fix location                                │
│     - AI-generated fix instructions                              │
│                         ↓                                         │
│  6. Results displayed with navigation links                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### SSE Events

| Event | Description |
|-------|-------------|
| `analysis_start` | Analysis beginning, shows estimated time |
| `stage_start` | New analysis stage (structure, blooms, flow, etc.) |
| `analyzing_item` | Currently analyzing chapter/section |
| `thinking` | AI's reasoning (transparency) |
| `issue_found` | Real-time issue discovery |
| `stage_complete` | Stage finished with partial results |
| `progress` | Percentage update |
| `complete` | Full analysis done |
| `error` | Something went wrong |

---

## Implementation Plan

### Phase 1: AI Integration Core

#### 1.1 Create AI Prompts (`lib/sam/depth-analysis-v2/prompts/`)

**File: `course-overview-prompt.ts`**
```typescript
export function buildCourseOverviewPrompt(course: CourseInput): string {
  return `You are an expert instructional designer analyzing a course for pedagogical quality.

## Course Information
- Title: ${course.title}
- Description: ${course.description}
- Course Goals: ${course.courseGoals}
- What You'll Learn: ${course.whatYouWillLearn.join(', ')}
- Difficulty: ${course.difficulty}
- Total Chapters: ${course.chapters.length}
- Total Sections: ${totalSections}

## Your Task
Analyze this course structure and provide:
1. Overall quality assessment (1-100 score)
2. Bloom's Taxonomy balance assessment
3. Key strengths (list 2-3)
4. Key weaknesses (list 2-3)
5. Missing topics based on stated goals

Respond in JSON format:
{
  "overallScore": number,
  "bloomsAssessment": "well-balanced" | "bottom-heavy" | "top-heavy",
  "strengths": string[],
  "weaknesses": string[],
  "missingTopics": string[],
  "thinking": "your reasoning"
}`;
}
```

**File: `chapter-analysis-prompt.ts`**
```typescript
export function buildChapterAnalysisPrompt(
  chapter: ChapterInput,
  chapterIndex: number,
  courseContext: CourseContext,
  previousChapters: ChapterSummary[]
): string {
  return `Analyze Chapter ${chapterIndex + 1}: "${chapter.title}"

## Course Context
- Course: ${courseContext.title}
- This is chapter ${chapterIndex + 1} of ${courseContext.totalChapters}
- Previous chapters covered: ${previousChapters.map(c => c.title).join(', ')}

## Chapter Content
${chapter.sections.map((s, i) => `
### Section ${i + 1}: ${s.title}
- Objectives: ${s.objectives?.join(', ') || 'None specified'}
- Content preview: ${s.content?.substring(0, 500) || 'No content'}
- Has video: ${s.videoUrl ? 'Yes' : 'No'}
- Has assessments: ${s.exams?.length > 0 ? 'Yes' : 'No'}
`).join('\n')}

## Analyze For:
1. **Bloom's Level**: What cognitive level does this chapter target?
2. **Consistency**: Is content depth consistent across sections?
3. **Flow**: Does content flow logically within the chapter?
4. **Prerequisites**: Are concepts properly introduced before use?
5. **Issues**: List specific problems with exact section locations

Respond in JSON:
{
  "primaryBloomsLevel": "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE",
  "bloomsDistribution": { "REMEMBER": %, "UNDERSTAND": %, ... },
  "consistencyScore": 0-100,
  "flowScore": 0-100,
  "qualityScore": 0-100,
  "issues": [
    {
      "sectionIndex": number,
      "sectionTitle": string,
      "type": "STRUCTURE" | "CONTENT" | "FLOW" | "CONSISTENCY" | "DEPTH" | "OBJECTIVE",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "title": "short issue title",
      "description": "detailed explanation",
      "evidence": ["specific quote or observation"],
      "fix": {
        "action": "add" | "modify" | "remove" | "reorder",
        "what": "what to change",
        "how": "step by step instructions",
        "suggestedContent": "if applicable, AI-generated content"
      }
    }
  ],
  "thinking": "your analysis reasoning"
}`;
}
```

**File: `cross-chapter-prompt.ts`**
```typescript
export function buildCrossChapterPrompt(
  chapters: ChapterSummary[],
  courseContext: CourseContext
): string {
  return `Analyze cross-chapter consistency and flow for course: "${courseContext.title}"

## Chapter Summaries
${chapters.map((ch, i) => `
Chapter ${i + 1}: ${ch.title}
- Bloom's Level: ${ch.primaryBloomsLevel}
- Section Count: ${ch.sectionCount}
- Key Topics: ${ch.keyTopics.join(', ')}
- Objectives Count: ${ch.objectivesCount}
`).join('\n')}

## Analyze For:
1. **Bloom's Progression**: Do chapters progress in cognitive complexity?
2. **Topic Flow**: Are topics introduced in logical order?
3. **Style Consistency**: Is depth/detail level consistent?
4. **Gaps**: Any missing connections between chapters?
5. **Duplicates**: Any repeated content across chapters?

Respond in JSON:
{
  "bloomsProgression": "good" | "inconsistent" | "needs_reordering",
  "flowScore": 0-100,
  "styleConsistency": 0-100,
  "issues": [
    {
      "type": "FLOW" | "CONSISTENCY" | "DUPLICATE" | "GAP",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "affectedChapters": [chapterIndex1, chapterIndex2],
      "title": "issue title",
      "description": "detailed explanation",
      "fix": {
        "action": "reorder" | "merge" | "add" | "modify",
        "what": "what to change",
        "how": "instructions"
      }
    }
  ],
  "thinking": "reasoning"
}`;
}
```

#### 1.2 Create AI Analyzer (`lib/sam/depth-analysis-v2/ai-analyzer.ts`)

```typescript
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';

const MAX_TOKENS = 4000;
const TOKEN_LIMIT_FULL_COURSE = 50000;

export interface AIAnalyzerOptions {
  courseId: string;
  course: CourseInput;
  userId: string;
  onProgress?: (event: AnalysisProgressEvent) => void;
}

export async function runAIAnalysis(options: AIAnalyzerOptions): Promise<AIAnalysisResult> {
  const { course, userId, onProgress } = options;

  // Calculate token estimate
  const tokenEstimate = estimateTokens(course);
  const useChapterWise = tokenEstimate > TOKEN_LIMIT_FULL_COURSE;

  onProgress?.({
    type: 'analysis_start',
    data: {
      mode: useChapterWise ? 'chapter-wise' : 'full-course',
      estimatedTime: useChapterWise
        ? `~${course.chapters.length * 30} seconds`
        : '~60 seconds',
      tokenEstimate,
    }
  });

  if (useChapterWise) {
    return runChapterWiseAnalysis(options);
  } else {
    return runFullCourseAnalysis(options);
  }
}

async function runFullCourseAnalysis(options: AIAnalyzerOptions): Promise<AIAnalysisResult> {
  const { course, userId, onProgress } = options;
  const results: AIAnalysisResult = initEmptyResult();

  // Stage 1: Course Overview
  onProgress?.({ type: 'stage_start', data: { stage: 'overview', message: 'Analyzing course structure...' }});

  const overviewPrompt = buildCourseOverviewPrompt(course);
  const overviewResponse = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    maxTokens: MAX_TOKENS,
    messages: [{ role: 'user', content: overviewPrompt }],
  });

  const overview = parseOverviewResponse(overviewResponse);
  results.overview = overview;

  // Stage 2: Per-Chapter Analysis
  onProgress?.({ type: 'stage_start', data: { stage: 'chapters', message: 'Analyzing chapters...' }});

  for (let i = 0; i < course.chapters.length; i++) {
    const chapter = course.chapters[i];
    onProgress?.({
      type: 'analyzing_item',
      data: {
        item: `Chapter ${i + 1}: ${chapter.title}`,
        progress: Math.round((i / course.chapters.length) * 50) + 25,
      }
    });

    const chapterPrompt = buildChapterAnalysisPrompt(chapter, i, course, results.chapterSummaries);
    const chapterResponse = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      maxTokens: MAX_TOKENS,
      messages: [{ role: 'user', content: chapterPrompt }],
    });

    const chapterResult = parseChapterResponse(chapterResponse, chapter, i);
    results.chapters.push(chapterResult);
    results.chapterSummaries.push(buildChapterSummary(chapter, chapterResult));

    // Emit issues as they're found
    for (const issue of chapterResult.issues) {
      onProgress?.({ type: 'issue_found', data: issue });
    }
  }

  // Stage 3: Cross-Chapter Analysis
  onProgress?.({ type: 'stage_start', data: { stage: 'cross-chapter', message: 'Checking cross-chapter consistency...' }});

  const crossChapterPrompt = buildCrossChapterPrompt(results.chapterSummaries, course);
  const crossChapterResponse = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    maxTokens: MAX_TOKENS,
    messages: [{ role: 'user', content: crossChapterPrompt }],
  });

  const crossChapterResult = parseCrossChapterResponse(crossChapterResponse);
  results.crossChapter = crossChapterResult;

  // Stage 4: Generate Final Scores & Issues
  onProgress?.({ type: 'stage_start', data: { stage: 'finalizing', message: 'Generating final report...' }});

  results.allIssues = aggregateAllIssues(results);
  results.scores = calculateFinalScores(results);

  return results;
}
```

#### 1.3 Update API Route (`app/api/teacher/depth-analysis-v2/analyze/route.ts`)

Key changes:
1. Use SSE streaming (like course creation)
2. Call AI analyzer instead of rule-based
3. Stream progress events

```typescript
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const body = await req.json();
  const validated = AnalyzeSchema.parse(body);

  // Check AI access
  const usageCheck = await checkAIAccess(session.user.id, 'analysis');
  if (!usageCheck.allowed) {
    return rateLimited(usageCheck.reason);
  }

  // Fetch course data
  const course = await fetchCourseData(validated.courseId, session.user.id);
  if (!course) {
    return notFound();
  }

  // Set up SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        sendEvent('analysis_start', {
          courseTitle: course.title,
          chaptersCount: course.chapters.length,
        });

        // Run AI analysis with progress callbacks
        const result = await runAIAnalysis({
          courseId: validated.courseId,
          course,
          userId: session.user.id,
          onProgress: (event) => {
            sendEvent(event.type, event.data);
          },
        });

        // Save results
        const analysisId = await saveAnalysisResults(result, validated.courseId);

        sendEvent('complete', {
          analysisId,
          overallScore: result.scores.overall,
          issueCount: result.allIssues.length,
        });

        controller.close();
      } catch (error) {
        sendEvent('error', { message: error.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Phase 2: Enhanced Issue Details

#### 2.1 Issue Location Links

Each issue will include direct links:

```typescript
interface IssueLocation {
  courseId: string;
  chapterId?: string;
  sectionId?: string;

  // Generated links
  fixUrl: string; // Direct link to fix location
  breadcrumb: string; // "Course > Chapter 2 > Section 1"
}

function generateFixUrl(issue: AnalysisIssue, courseId: string): string {
  const base = `/teacher/courses/${courseId}`;

  if (issue.location.sectionId) {
    return `${base}/chapters/${issue.location.chapterId}/section/${issue.location.sectionId}`;
  }
  if (issue.location.chapterId) {
    return `${base}/chapters/${issue.location.chapterId}`;
  }
  return base;
}
```

#### 2.2 AI-Generated Fix Suggestions

For each issue, AI generates:
- **What to fix**: Specific change needed
- **Why**: Educational rationale
- **How**: Step-by-step instructions
- **Suggested content**: For content issues, AI-generated replacement text

### Phase 3: Frontend Updates

#### 3.1 Progress Display Component

```typescript
// components/sam/chat/DepthAnalysisProgress.tsx

interface DepthAnalysisProgressProps {
  stage: string;
  currentItem: string;
  percentage: number;
  thinking?: string;
  issuesFound: number;
}

export function DepthAnalysisProgress({
  stage,
  currentItem,
  percentage,
  thinking,
  issuesFound,
}: DepthAnalysisProgressProps) {
  return (
    <div className="space-y-4 p-6">
      {/* Stage indicator */}
      <div className="flex items-center gap-3">
        <Brain className="h-5 w-5 text-violet-500 animate-pulse" />
        <span className="font-medium">{stage}</span>
      </div>

      {/* Current item */}
      <div className="text-sm text-muted-foreground">
        Analyzing: {currentItem}
      </div>

      {/* Progress bar */}
      <Progress value={percentage} className="h-2" />

      {/* AI thinking (collapsible) */}
      {thinking && (
        <Collapsible>
          <CollapsibleTrigger className="text-xs text-muted-foreground">
            Show AI reasoning
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 bg-slate-50 rounded text-sm">
            {thinking}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Issues found so far */}
      <div className="text-sm">
        Issues found: <Badge variant="destructive">{issuesFound}</Badge>
      </div>
    </div>
  );
}
```

#### 3.2 Issue Card with Fix Link

```typescript
// Enhanced IssueCard with navigation

export function IssueCard({ issue, courseId }: IssueCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge>
          <Badge variant="outline">{issue.type}</Badge>
        </div>
        <CardTitle>{issue.title}</CardTitle>
        <CardDescription>{issue.description}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Location breadcrumb */}
        <div className="text-sm text-muted-foreground mb-4">
          📍 {issue.breadcrumb}
        </div>

        {/* Evidence */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Evidence</h4>
          <ul className="list-disc pl-5 text-sm">
            {issue.evidence.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>

        {/* Fix instructions */}
        <div className="bg-emerald-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            How to Fix
          </h4>
          <p className="mb-2">{issue.fix.what}</p>
          <p className="text-sm text-muted-foreground mb-3">{issue.fix.how}</p>

          {/* Direct link to fix location */}
          <Button asChild>
            <Link href={issue.fixUrl}>
              Go to {issue.location.sectionTitle || issue.location.chapterTitle || 'Course'} →
            </Link>
          </Button>
        </div>

        {/* AI suggested content (if available) */}
        {issue.fix.suggestedContent && (
          <Collapsible className="mt-4">
            <CollapsibleTrigger className="text-sm text-violet-600">
              View AI-suggested content
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-4 bg-violet-50 rounded">
              <pre className="whitespace-pre-wrap text-sm">
                {issue.fix.suggestedContent}
              </pre>
              <Button variant="outline" size="sm" className="mt-2">
                Copy to clipboard
              </Button>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Token Management & Chunking

### Token Estimation

```typescript
function estimateTokens(course: CourseInput): number {
  let tokens = 0;

  // Course metadata (~100 tokens)
  tokens += 100;

  // Each chapter title/description (~50 tokens)
  tokens += course.chapters.length * 50;

  // Each section (title + description + content)
  for (const chapter of course.chapters) {
    for (const section of chapter.sections) {
      tokens += 30; // title + description
      tokens += Math.ceil((section.content?.length || 0) / 4); // ~4 chars per token
      tokens += (section.objectives?.length || 0) * 10;
    }
  }

  return tokens;
}
```

### Chunking Strategy

For large courses (> 50,000 tokens):

1. **Course overview**: Send metadata + chapter titles only
2. **Per-chapter analysis**: Full chapter content + context summary
3. **Cross-chapter analysis**: Chapter summaries only (not full content)

---

## Database Schema Updates

No schema changes needed - current schema supports all required fields.

---

## Files to Create/Modify

### Create:
1. `lib/sam/depth-analysis-v2/prompts/course-overview-prompt.ts`
2. `lib/sam/depth-analysis-v2/prompts/chapter-analysis-prompt.ts`
3. `lib/sam/depth-analysis-v2/prompts/cross-chapter-prompt.ts`
4. `lib/sam/depth-analysis-v2/prompts/index.ts`
5. `lib/sam/depth-analysis-v2/ai-analyzer.ts`
6. `lib/sam/depth-analysis-v2/token-estimator.ts`
7. `components/depth-analyzer/AnalysisProgress.tsx`

### Modify:
1. `app/api/teacher/depth-analysis-v2/analyze/route.ts` - Use AI instead of rule-based
2. `lib/sam/depth-analysis-v2/enhanced-analyzer.ts` - Integrate AI calls
3. `app/(protected)/teacher/depth-analyzer/_components/v2/IssueList.tsx` - Add fix links
4. `app/(protected)/teacher/depth-analyzer/_components/v2/IssueCard.tsx` - Enhanced UI

---

## Estimated Time Per Analysis

| Course Size | Chapters | Sections | Estimated Time |
|-------------|----------|----------|----------------|
| Small | 3-5 | 10-20 | 30-60 seconds |
| Medium | 6-10 | 20-50 | 1-2 minutes |
| Large | 10-15 | 50-100 | 2-4 minutes |
| Very Large | 15+ | 100+ | 4-6 minutes |

---

## Error Handling

1. **AI timeout**: Retry once, then fall back to rule-based for that section
2. **Token limit exceeded**: Automatically chunk by chapter
3. **Rate limit**: Queue and retry with exponential backoff
4. **Parse error**: Log and use fallback analysis for that item

---

## Testing Plan

1. **Unit tests**: Prompt generation, response parsing
2. **Integration tests**: Full analysis flow with mock AI
3. **Manual testing**:
   - Small course (< 5 chapters)
   - Medium course (5-10 chapters)
   - Large course (> 10 chapters)
   - Course with no issues
   - Course with many issues

---

## Implementation Order

1. **Day 1**: Create prompts and AI analyzer core
2. **Day 2**: Update API route with SSE streaming
3. **Day 3**: Frontend progress display and issue links
4. **Day 4**: Testing and edge cases
5. **Day 5**: Polish and optimization

---

## Success Metrics

1. Analysis provides actionable issues (not generic)
2. Fix locations are accurate (link to correct page)
3. AI-suggested content is relevant
4. Analysis completes within reasonable time
5. Users can fix issues using the suggestions
