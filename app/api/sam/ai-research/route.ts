import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createResearchEngine } from '@sam-ai/educational';
import type { ResearchDatabaseAdapter, ResearchPaper, ResearchCategory } from '@sam-ai/educational';
import { getUserScopedSAMConfig } from '@/lib/adapters';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Create research-specific database adapter
function createResearchDatabaseAdapter(): ResearchDatabaseAdapter {
  return {
    async createInteraction(data: {
      userId: string;
      interactionType: string;
      context?: Record<string, unknown>;
    }): Promise<void> {
      // Map to valid SAMInteractionType
      type SAMInteractionType = 'NAVIGATION' | 'FORM_POPULATE' | 'FORM_SUBMIT' | 'FORM_VALIDATE' | 'CONTENT_GENERATE' | 'CHAT_MESSAGE' | 'QUICK_ACTION' | 'ANALYTICS_VIEW' | 'GAMIFICATION_ACTION' | 'LEARNING_ASSISTANCE';
      const validType: SAMInteractionType = 'CONTENT_GENERATE';

      await db.sAMInteraction.create({
        data: {
          userId: data.userId,
          interactionType: validType,
          context: data.context ?? {},
        }
      });
    }
  };
}

// Create a user-scoped research engine instance
async function createResearchEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'course');
  return createResearchEngine({
    samConfig,
    database: createResearchDatabaseAdapter(),
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const engine = await createResearchEngineForUser(session.user.id);

    switch (action) {
      case 'search': {
        const query = searchParams.get('query') || '';
        const categories = searchParams.get('categories')?.split(',').filter(Boolean) as any;
        const minCitations = searchParams.get('minCitations');
        const hasCode = searchParams.get('hasCode') === 'true';
        const hasDataset = searchParams.get('hasDataset') === 'true';
        const difficulty = searchParams.get('difficulty') || undefined;
        const sort = searchParams.get('sort') as any;
        const limit = searchParams.get('limit');

        const papers = await engine.searchPapers({
          query,
          filters: {
            categories,
            minCitations: minCitations ? parseInt(minCitations) : undefined,
            hasCode,
            hasDataset,
            difficulty
          },
          sort,
          limit: limit ? parseInt(limit) : undefined
        });

        return NextResponse.json({ papers });
      }

      case 'trends': {
        const trends = await engine.getResearchTrends();
        return NextResponse.json({ trends });
      }

      case 'paper': {
        const paperId = searchParams.get('paperId');
        if (!paperId) {
          return NextResponse.json({ error: 'Paper ID required' }, { status: 400 });
        }

        const paper = await engine.getPaperDetails(paperId);
        if (!paper) {
          return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
        }

        return NextResponse.json({ paper });
      }

      case 'citations': {
        const paperId = searchParams.get('paperId');
        const depth = searchParams.get('depth');

        if (!paperId) {
          return NextResponse.json({ error: 'Paper ID required' }, { status: 400 });
        }

        const network = await engine.getCitationNetwork(
          paperId,
          depth ? parseInt(depth) : 1
        );

        // Convert Map to serializable format
        const citationData = Object.fromEntries(
          Array.from(network.entries()).map(([key, value]) => [key, Array.from(value)])
        );

        return NextResponse.json({ citations: citationData });
      }

      case 'recommend': {
        const paperId = searchParams.get('paperId');
        const count = searchParams.get('count');

        if (!paperId) {
          return NextResponse.json({ error: 'Paper ID required' }, { status: 400 });
        }

        const recommendations = await engine.recommendPapers(
          paperId,
          count ? parseInt(count) : 5
        );

        return NextResponse.json({ recommendations });
      }

      case 'educational': {
        const difficulty = searchParams.get('difficulty') || undefined;
        const prerequisites = searchParams.get('prerequisites')?.split(',').filter(Boolean) || undefined;

        const papers = await engine.getEducationalPapers(
          difficulty,
          prerequisites
        );

        return NextResponse.json({ papers });
      }

      case 'metrics': {
        const field = searchParams.get('field') || 'AI';
        const timeframe = searchParams.get('timeframe') as any || 'month';

        const metrics = await engine.getMetrics(field, timeframe);
        return NextResponse.json({ metrics });
      }

      case 'reading-lists': {
        const lists = await engine.getReadingLists(session.user.id);
        return NextResponse.json({ lists });
      }

      default: {
        // Default: search all papers
        const papers = await engine.searchPapers({ query: '' });
        return NextResponse.json({ papers });
      }
    }
  } catch (error) {
    logger.error('AI Research API error:', error);
    return NextResponse.json(
      { error: 'Failed to process research request' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...params } = body;
    const engine = await createResearchEngineForUser(session.user.id);

    switch (action) {
      case 'literature-review': {
        const { topic, scope, paperIds } = params;

        if (!topic || !scope) {
          return NextResponse.json({ error: 'Topic and scope required' }, { status: 400 });
        }

        const review = await engine.generateLiteratureReview(
          topic,
          scope,
          paperIds
        );

        return NextResponse.json({ review });
      }

      case 'create-reading-list': {
        const { name, description, paperIds, visibility } = params;

        if (!name || !description || !paperIds) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const list = await engine.createReadingList(
          session.user.id,
          name,
          description,
          paperIds,
          visibility
        );

        return NextResponse.json({ list });
      }

      case 'record-interaction': {
        const { paperId, interactionType } = params;

        if (!paperId || !interactionType) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        await engine.recordInteraction(
          session.user.id,
          paperId,
          interactionType
        );

        return NextResponse.json({ success: true });
      }

      case 'analyze-papers': {
        // Advanced analysis of multiple papers
        const { paperIds, analysisType } = params;

        if (!paperIds || !Array.isArray(paperIds)) {
          return NextResponse.json({ error: 'Paper IDs array required' }, { status: 400 });
        }

        // Get all papers
        const papers = await Promise.all(
          paperIds.map(id => engine.getPaperDetails(id))
        );

        const validPapers = papers.filter(p => p !== null);

        // Perform analysis based on type
        let analysis;
        switch (analysisType) {
          case 'trends':
            analysis = analyzeTrends(validPapers);
            break;
          case 'gaps':
            analysis = analyzeGaps(validPapers);
            break;
          case 'collaboration':
            analysis = analyzeCollaboration(validPapers);
            break;
          default:
            analysis = { message: 'Basic analysis completed', paperCount: validPapers.length };
        }

        return NextResponse.json({ analysis, papers: validPapers });
      }

      case 'export-bibtex': {
        const { paperIds } = params;

        if (!paperIds || !Array.isArray(paperIds)) {
          return NextResponse.json({ error: 'Paper IDs array required' }, { status: 400 });
        }

        // Generate BibTeX entries
        const bibtexEntries = await Promise.all(
          paperIds.map(async (id) => {
            const paper = await engine.getPaperDetails(id);
            if (!paper) return null;
            return generateBibtex(paper);
          })
        );

        const bibtex = bibtexEntries.filter((e): e is string => e !== null).join('\n\n');

        return NextResponse.json({ bibtex });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('AI Research API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process research request' },
      { status: 500 }
    );
  }
}

// Helper functions for analysis
interface TrendAnalysis {
  yearlyDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  topKeywords: Array<{ keyword: string; count: number }>;
  growthRate: number;
}

interface GapAnalysis {
  potentialGaps: string[];
  underexploredAreas: string[];
  methodologyGaps: string;
}

interface CollaborationAnalysis {
  totalCollaborations: number;
  topCollaborations: Array<{ institutions: string; count: number }>;
  collaborationIntensity: number;
}

function analyzeTrends(papers: ResearchPaper[]): TrendAnalysis {
  const yearCounts = new Map<number, number>();
  const categoryCounts = new Map<string, number>();
  const keywordFrequency = new Map<string, number>();

  papers.forEach(paper => {
    // Year trends
    const year = paper.publishDate.getFullYear();
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1);

    // Category trends
    categoryCounts.set(paper.category, (categoryCounts.get(paper.category) || 0) + 1);

    // Keyword trends
    paper.keywords.forEach((keyword: string) => {
      keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
    });
  });

  return {
    yearlyDistribution: Object.fromEntries(yearCounts),
    categoryDistribution: Object.fromEntries(categoryCounts),
    topKeywords: Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count })),
    growthRate: calculateGrowthRate(yearCounts)
  };
}

function analyzeGaps(papers: ResearchPaper[]): GapAnalysis {
  // Simplified gap analysis
  const methodologies = new Set<string>();

  papers.forEach(paper => {
    paper.methodology.forEach((m: string) => methodologies.add(m));
  });

  return {
    potentialGaps: [
      'Limited cross-domain applications',
      'Need for more reproducible research',
      'Lack of real-world deployment studies'
    ],
    underexploredAreas: [
      'Ethical implications',
      'Long-term impact studies',
      'Interdisciplinary approaches'
    ],
    methodologyGaps: Array.from(methodologies).length < 5
      ? 'Limited methodological diversity'
      : 'Good methodological coverage'
  };
}

function analyzeCollaboration(papers: ResearchPaper[]): CollaborationAnalysis {
  const institutionPairs = new Map<string, number>();

  papers.forEach(paper => {
    const institutions = paper.authors.map(a => a.affiliation);

    // Count institution pairs
    for (let i = 0; i < institutions.length; i++) {
      for (let j = i + 1; j < institutions.length; j++) {
        const pair = [institutions[i], institutions[j]].sort().join(' <-> ');
        institutionPairs.set(pair, (institutionPairs.get(pair) || 0) + 1);
      }
    }
  });

  return {
    totalCollaborations: institutionPairs.size,
    topCollaborations: Array.from(institutionPairs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pair, count]) => ({ institutions: pair, count })),
    collaborationIntensity: papers.filter(p => p.authors.length > 2).length / papers.length
  };
}

function calculateGrowthRate(yearCounts: Map<number, number>): number {
  const years = Array.from(yearCounts.keys()).sort();
  if (years.length < 2) return 0;

  const firstYear = yearCounts.get(years[0]) || 0;
  const lastYear = yearCounts.get(years[years.length - 1]) || 0;

  return ((lastYear - firstYear) / firstYear) * 100;
}

function generateBibtex(paper: ResearchPaper): string {
  const type = paper.publication.type === 'journal' ? '@article' : '@inproceedings';
  const nameParts = paper.authors[0]?.name.split(' ') ?? ['Unknown'];
  const lastName = nameParts[nameParts.length - 1] ?? 'Unknown';
  const key = lastName + paper.publishDate.getFullYear();

  return `${type}{${key},
  title={${paper.title}},
  author={${paper.authors.map(a => a.name).join(' and ')}},
  year={${paper.publishDate.getFullYear()}},
  ${paper.publication.type === 'journal' ? 'journal' : 'booktitle'}={${paper.publication.venue}},
  ${paper.publication.doi ? `doi={${paper.publication.doi}},` : ''}
  ${paper.publication.arxivId ? `arxiv={${paper.publication.arxivId}},` : ''}
}`;
}