import { logger } from '@/lib/logger';
import { getOpenAIEmbeddingProvider } from '@/lib/sam/providers';
import type { CompletedChapter } from './types';

export interface SemanticDuplicateCandidate {
  title: string;
  topicFocus: string;
  concepts?: string[];
}

export interface SemanticDuplicateMatch {
  chapter: number;
  section: number;
  title: string;
  topicFocus: string;
}

export interface SemanticDuplicateAssessment {
  isDuplicate: boolean;
  similarity: number;
  threshold: number;
  mode: 'embedding' | 'lexical';
  match: SemanticDuplicateMatch;
}

interface ExistingSectionRef extends SemanticDuplicateMatch {
  semanticText: string;
}

const EMBEDDING_DUPLICATE_THRESHOLD = 0.88;
const LEXICAL_DUPLICATE_THRESHOLD = 0.72;

export class SemanticDuplicateGate {
  private readonly existingSections: ExistingSectionRef[];
  private readonly embeddingCache = new Map<string, number[]>();
  private embeddingProvider: EmbeddingProvider | null = null;
  private embeddingProviderResolved = false;

  constructor(completedChapters: CompletedChapter[], currentChapter: number) {
    this.existingSections = completedChapters
      .filter(ch => ch.position < currentChapter)
      .flatMap(ch =>
        ch.sections.map(sec => ({
          chapter: ch.position,
          section: sec.position,
          title: sec.title,
          topicFocus: sec.topicFocus,
          semanticText: buildSemanticText({
            title: sec.title,
            topicFocus: sec.topicFocus,
            concepts: sec.conceptsIntroduced,
          }),
        })),
      );
  }

  async assess(candidate: SemanticDuplicateCandidate): Promise<SemanticDuplicateAssessment | null> {
    if (this.existingSections.length === 0) return null;

    const candidateText = buildSemanticText(candidate);
    if (!candidateText.trim()) return null;

    const provider = await this.getProvider();
    if (provider) {
      const assessment = await this.assessWithEmbeddings(candidateText, provider);
      if (assessment) return assessment;
    }

    return this.assessLexically(candidateText);
  }

  private async getProvider(): Promise<EmbeddingProvider | null> {
    if (!this.embeddingProviderResolved) {
      this.embeddingProviderResolved = true;
      try {
        this.embeddingProvider = getOpenAIEmbeddingProvider();
      } catch (error) {
        logger.debug('[SemanticDuplicateGate] Embedding provider unavailable, using lexical fallback', {
          error: error instanceof Error ? error.message : String(error),
        });
        this.embeddingProvider = null;
      }
    }
    return this.embeddingProvider;
  }

  private async assessWithEmbeddings(
    candidateText: string,
    provider: EmbeddingProvider,
  ): Promise<SemanticDuplicateAssessment | null> {
    try {
      const candidateEmbedding = await this.embedText(candidateText, provider);
      if (!candidateEmbedding) return null;

      let bestSimilarity = -1;
      let bestMatch: ExistingSectionRef | null = null;

      for (const existing of this.existingSections) {
        const existingEmbedding = await this.embedText(existing.semanticText, provider);
        if (!existingEmbedding) continue;
        const similarity = cosineSimilarity(candidateEmbedding, existingEmbedding);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = existing;
        }
      }

      if (!bestMatch || bestSimilarity < EMBEDDING_DUPLICATE_THRESHOLD) {
        return null;
      }

      return {
        isDuplicate: true,
        similarity: round2(bestSimilarity),
        threshold: EMBEDDING_DUPLICATE_THRESHOLD,
        mode: 'embedding',
        match: {
          chapter: bestMatch.chapter,
          section: bestMatch.section,
          title: bestMatch.title,
          topicFocus: bestMatch.topicFocus,
        },
      };
    } catch (error) {
      logger.debug('[SemanticDuplicateGate] Embedding similarity failed, using lexical fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private assessLexically(candidateText: string): SemanticDuplicateAssessment | null {
    let bestSimilarity = -1;
    let bestMatch: ExistingSectionRef | null = null;

    for (const existing of this.existingSections) {
      const similarity = lexicalSimilarity(candidateText, existing.semanticText);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = existing;
      }
    }

    if (!bestMatch || bestSimilarity < LEXICAL_DUPLICATE_THRESHOLD) {
      return null;
    }

    return {
      isDuplicate: true,
      similarity: round2(bestSimilarity),
      threshold: LEXICAL_DUPLICATE_THRESHOLD,
      mode: 'lexical',
      match: {
        chapter: bestMatch.chapter,
        section: bestMatch.section,
        title: bestMatch.title,
        topicFocus: bestMatch.topicFocus,
      },
    };
  }

  private async embedText(text: string, provider: EmbeddingProvider): Promise<number[] | null> {
    const cached = this.embeddingCache.get(text);
    if (cached) return cached;
    const embedding = await provider.embed(text);
    if (!Array.isArray(embedding) || embedding.length === 0) return null;
    this.embeddingCache.set(text, embedding);
    return embedding;
  }
}

function buildSemanticText(input: SemanticDuplicateCandidate): string {
  return [
    input.title?.trim() ?? '',
    input.topicFocus?.trim() ?? '',
    (input.concepts ?? []).join(', '),
  ].filter(Boolean).join(' | ');
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function lexicalSimilarity(a: string, b: string): number {
  const tokensA = normalizeTokens(a);
  const tokensB = normalizeTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap++;
  }

  const union = tokensA.size + tokensB.size - overlap;
  return union > 0 ? overlap / union : 0;
}

function normalizeTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 2),
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
type EmbeddingProvider = {
  embed(text: string): Promise<number[]>;
};
