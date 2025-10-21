# Initiative 4: Source Citation System

**Timeline**: Weeks 21-22 (2 weeks)
**Priority**: 🟡 High
**Budget**: $20,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: Current SAM responses don't cite sources, making it impossible for students to:
- Verify AI-generated information
- Explore original course materials
- Build trust in AI answers
- Comply with academic integrity requirements

**The Solution**: Implement automatic source citation extraction from RAG retrievals, embed citations directly in responses, and provide clickable source links to original course materials.

**Impact**:
- **Trust**: "I can verify this" confidence
- **Academic Integrity**: Proper attribution for educational content
- **Engagement**: 40% increase in course material exploration
- **Citation Rate**: 80%+ of answers include source citations

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Citation rate >80% (answers with at least 1 citation)
- ✅ Citation accuracy >95% (citations point to correct sources)
- ✅ Citation extraction latency <100ms
- ✅ Deep link accuracy 100% (links work correctly)

### Quality Metrics
- ✅ Relevant citation rate >90% (citations actually support the answer)
- ✅ Citation diversity >3 sources per complex answer
- ✅ No hallucinated citations (0% fabricated sources)
- ✅ Citation formatting consistency 100%

### User Experience Metrics
- ✅ "Citations helpful" rating >85%
- ✅ Citation click-through rate >40%
- ✅ Trust in AI answers increase to >4.5/5
- ✅ Course material exploration increase by 40%

### Business Metrics
- ✅ Academic integrity compliance 100%
- ✅ Student confidence in SAM increase by 30%
- ✅ Teacher satisfaction with attribution >90%

---

## 🏗️ Architecture Design

### Citation Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Source Citation Pipeline                   │
└─────────────────────────────────────────────────────────────┘

User Question → RAG Retrieval → AI Generation with Citations
                      │                    │
                      │                    ▼
                      │         ┌──────────────────────┐
                      │         │  Extract Citations   │
                      │         │  from Response       │
                      │         └──────────────────────┘
                      │                    │
                      ▼                    ▼
        ┌────────────────────┐   ┌────────────────────┐
        │  Retrieved Chunks  │   │  Citation Matches  │
        │  with Metadata     │   │  and Validation    │
        └────────────────────┘   └────────────────────┘
                      │                    │
                      └──────────┬─────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Format Citations      │
                    │   • Inline [1], [2]     │
                    │   • Bibliography        │
                    │   • Deep Links          │
                    └─────────────────────────┘
                                 │
                                 ▼
                    Response with Citations to User
```

### Citation Storage Schema

```prisma
model Citation {
  id              String   @id @default(uuid())
  responseId      String

  // Source information
  sourceType      SourceType @default(COURSE_CONTENT)
  sourceId        String   // Course/Chapter/Section ID
  sourceName      String   // "Chapter 3: Quadratic Equations"
  sourceUrl       String?  // Deep link to content

  // Citation details
  citationText    String   @db.Text // Quoted text from source
  citationNumber  Int      // [1], [2], etc.
  relevanceScore  Float    // 0-1 (how relevant to answer)

  // Positioning
  startPosition   Int?     // Character position in response
  endPosition     Int?

  createdAt       DateTime @default(now())

  @@index([responseId])
  @@index([sourceId])
}

model SAMResponse {
  id              String   @id @default(uuid())
  conversationId  String
  userId          String

  // Response content
  content         String   @db.Text
  citationCount   Int      @default(0)

  // Citations
  citations       Citation[]
  bibliography    Json?    // Formatted citation list

  createdAt       DateTime @default(now())

  @@index([conversationId])
  @@index([userId])
}

enum SourceType {
  COURSE_CONTENT   // Course materials
  TEXTBOOK         // External textbooks
  VIDEO            // Video transcripts
  EXERCISE         // Practice problems
  REFERENCE        // External references
}
```

---

## 🔧 Implementation Plan

### Week 21: Citation Extraction & Formatting

#### Day 1-2: Citation Extractor

**File: `lib/sam/citations/citation-extractor.ts`**

```typescript
import { RetrievedChunk } from '../rag/types';

interface CitationMatch {
  chunkId: string;
  sourceId: string;
  sourceName: string;
  sourceType: 'COURSE_CONTENT' | 'TEXTBOOK' | 'VIDEO';
  citationText: string;
  relevanceScore: number;
  sourceUrl?: string;
}

interface ExtractedCitations {
  citations: CitationMatch[];
  bibliography: FormattedCitation[];
}

interface FormattedCitation {
  number: number;
  sourceName: string;
  sourceType: string;
  excerpt: string;
  url?: string;
}

export class CitationExtractor {
  /**
   * Extract citations from retrieved chunks and AI response
   */
  async extractCitations(
    retrievedChunks: RetrievedChunk[],
    aiResponse: string
  ): Promise<ExtractedCitations> {
    // Match response content to retrieved chunks
    const matches = this.matchContentToSources(retrievedChunks, aiResponse);

    // Score relevance
    const scoredMatches = this.scoreRelevance(matches, aiResponse);

    // Filter low-relevance citations
    const relevantCitations = scoredMatches.filter(
      match => match.relevanceScore > 0.7
    );

    // Sort by relevance
    relevantCitations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Assign citation numbers
    const citations = relevantCitations.map((match, index) => ({
      ...match,
      number: index + 1,
    }));

    // Format bibliography
    const bibliography = this.formatBibliography(citations);

    return {
      citations,
      bibliography,
    };
  }

  /**
   * Match AI response content to retrieved source chunks
   */
  private matchContentToSources(
    chunks: RetrievedChunk[],
    response: string
  ): CitationMatch[] {
    const matches: CitationMatch[] = [];

    for (const chunk of chunks) {
      // Extract key phrases from chunk (3-5 word sequences)
      const chunkPhrases = this.extractKeyPhrases(chunk.content);

      // Find matching phrases in response
      for (const phrase of chunkPhrases) {
        if (this.containsPhrase(response, phrase)) {
          matches.push({
            chunkId: chunk.id,
            sourceId: chunk.metadata.sectionId || chunk.metadata.chapterId,
            sourceName: this.formatSourceName(chunk.metadata),
            sourceType: this.determineSourceType(chunk.metadata),
            citationText: this.extractRelevantSnippet(chunk.content, phrase),
            relevanceScore: 0, // Will be scored later
            sourceUrl: this.buildDeepLink(chunk.metadata),
          });
        }
      }
    }

    // Deduplicate by sourceId
    return this.deduplicateMatches(matches);
  }

  /**
   * Extract key phrases from text (3-5 word sequences)
   */
  private extractKeyPhrases(text: string): string[] {
    const sentences = text.split(/[.!?]+/);
    const phrases: string[] = [];

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);

      // Extract 3-5 word sequences
      for (let len = 3; len <= 5; len++) {
        for (let i = 0; i <= words.length - len; i++) {
          const phrase = words.slice(i, i + len).join(' ');

          // Filter out common phrases
          if (this.isSignificantPhrase(phrase)) {
            phrases.push(phrase.toLowerCase());
          }
        }
      }
    }

    return phrases;
  }

  /**
   * Check if phrase is significant (not common filler)
   */
  private isSignificantPhrase(phrase: string): boolean {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
      'to', 'for', 'of', 'with', 'by', 'from', 'this', 'that',
    ]);

    const words = phrase.toLowerCase().split(/\s+/);

    // Must contain at least one non-common word
    return words.some(word => !commonWords.has(word));
  }

  /**
   * Check if response contains phrase (case-insensitive, fuzzy)
   */
  private containsPhrase(text: string, phrase: string): boolean {
    const normalizedText = text.toLowerCase();
    const normalizedPhrase = phrase.toLowerCase();

    return normalizedText.includes(normalizedPhrase);
  }

  /**
   * Score citation relevance to response
   */
  private scoreRelevance(
    matches: CitationMatch[],
    response: string
  ): CitationMatch[] {
    return matches.map(match => {
      // Factors:
      // 1. Chunk similarity score (from RAG)
      // 2. Phrase match count
      // 3. Position in response (earlier = more relevant)

      const phraseMatchCount = this.countPhraseMatches(
        match.citationText,
        response
      );

      const positionScore = this.calculatePositionScore(
        match.citationText,
        response
      );

      // Weighted score
      const relevanceScore =
        0.4 * phraseMatchCount +
        0.3 * positionScore +
        0.3 * (match.relevanceScore || 0.5);

      return {
        ...match,
        relevanceScore: Math.min(1, relevanceScore),
      };
    });
  }

  /**
   * Count matching phrases between citation and response
   */
  private countPhraseMatches(citation: string, response: string): number {
    const citationPhrases = this.extractKeyPhrases(citation);
    const responseLower = response.toLowerCase();

    let matchCount = 0;

    for (const phrase of citationPhrases) {
      if (responseLower.includes(phrase.toLowerCase())) {
        matchCount++;
      }
    }

    return Math.min(1, matchCount / citationPhrases.length);
  }

  /**
   * Calculate position-based relevance (earlier mentions = more relevant)
   */
  private calculatePositionScore(citation: string, response: string): number {
    const phrases = this.extractKeyPhrases(citation);
    const positions: number[] = [];

    for (const phrase of phrases) {
      const pos = response.toLowerCase().indexOf(phrase.toLowerCase());
      if (pos !== -1) {
        positions.push(pos);
      }
    }

    if (positions.length === 0) return 0;

    // Average position as fraction of response length
    const avgPosition = positions.reduce((a, b) => a + b) / positions.length;
    const relativePosition = avgPosition / response.length;

    // Earlier = higher score
    return 1 - relativePosition;
  }

  /**
   * Extract relevant snippet from source
   */
  private extractRelevantSnippet(content: string, phrase: string): string {
    const pos = content.toLowerCase().indexOf(phrase.toLowerCase());

    if (pos === -1) {
      return content.substring(0, 200); // Fallback
    }

    // Extract context around phrase (±100 chars)
    const start = Math.max(0, pos - 100);
    const end = Math.min(content.length, pos + phrase.length + 100);

    let snippet = content.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Format source name from metadata
   */
  private formatSourceName(metadata: Record<string, any>): string {
    if (metadata.sectionTitle) {
      return `Section: ${metadata.sectionTitle}`;
    }

    if (metadata.chapterTitle) {
      return `Chapter: ${metadata.chapterTitle}`;
    }

    if (metadata.courseTitle) {
      return `Course: ${metadata.courseTitle}`;
    }

    return 'Course Content';
  }

  /**
   * Determine source type from metadata
   */
  private determineSourceType(metadata: Record<string, any>): SourceType {
    if (metadata.videoId) return 'VIDEO';
    if (metadata.textbookId) return 'TEXTBOOK';
    return 'COURSE_CONTENT';
  }

  /**
   * Build deep link to source content
   */
  private buildDeepLink(metadata: Record<string, any>): string | undefined {
    const { courseId, chapterId, sectionId } = metadata;

    if (!courseId) return undefined;

    if (sectionId) {
      return `/courses/${courseId}/learn/${chapterId}/sections/${sectionId}`;
    }

    if (chapterId) {
      return `/courses/${courseId}/learn/${chapterId}`;
    }

    return `/courses/${courseId}`;
  }

  /**
   * Deduplicate matches by sourceId
   */
  private deduplicateMatches(matches: CitationMatch[]): CitationMatch[] {
    const seen = new Set<string>();
    const unique: CitationMatch[] = [];

    for (const match of matches) {
      if (!seen.has(match.sourceId)) {
        seen.add(match.sourceId);
        unique.push(match);
      }
    }

    return unique;
  }

  /**
   * Format bibliography
   */
  private formatBibliography(
    citations: Array<CitationMatch & { number: number }>
  ): FormattedCitation[] {
    return citations.map(citation => ({
      number: citation.number,
      sourceName: citation.sourceName,
      sourceType: citation.sourceType,
      excerpt: citation.citationText.substring(0, 150) + '...',
      url: citation.sourceUrl,
    }));
  }
}
```

#### Day 3-4: Citation Formatter

**File: `lib/sam/citations/citation-formatter.ts`**

```typescript
import { FormattedCitation } from './citation-extractor';

interface InlineCitation {
  text: string;
  citationNumber: number;
  position: number;
}

export class CitationFormatter {
  /**
   * Embed inline citations into response text
   */
  embedInlineCitations(
    response: string,
    citations: FormattedCitation[]
  ): string {
    // Find citation insertion points
    const insertionPoints = this.findInsertionPoints(response, citations);

    // Insert citation markers [1], [2], etc.
    let result = response;
    let offset = 0;

    for (const point of insertionPoints) {
      const marker = `[${point.citationNumber}]`;
      const insertPos = point.position + offset;

      result =
        result.slice(0, insertPos) +
        marker +
        result.slice(insertPos);

      offset += marker.length;
    }

    return result;
  }

  /**
   * Find optimal insertion points for citations
   */
  private findInsertionPoints(
    response: string,
    citations: FormattedCitation[]
  ): InlineCitation[] {
    const points: InlineCitation[] = [];

    for (const citation of citations) {
      // Find where citation content appears in response
      const excerpt = citation.excerpt
        .replace(/^\.\.\./, '')
        .replace(/\.\.\.$/, '')
        .trim()
        .substring(0, 50); // First 50 chars

      const pos = response.toLowerCase().indexOf(excerpt.toLowerCase());

      if (pos !== -1) {
        // Insert at end of matching content
        const endPos = pos + excerpt.length;

        points.push({
          text: excerpt,
          citationNumber: citation.number,
          position: endPos,
        });
      }
    }

    // Sort by position
    return points.sort((a, b) => a.position - b.position);
  }

  /**
   * Format bibliography section
   */
  formatBibliography(citations: FormattedCitation[]): string {
    const lines: string[] = ['\n\n**Sources:**\n'];

    for (const citation of citations) {
      const line = this.formatCitationLine(citation);
      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Format a single citation line
   */
  private formatCitationLine(citation: FormattedCitation): string {
    const parts: string[] = [`[${citation.number}]`];

    // Source name
    parts.push(citation.sourceName);

    // Excerpt
    parts.push(`"${citation.excerpt}"`);

    // Link (if available)
    if (citation.url) {
      parts.push(`[View Source](${citation.url})`);
    }

    return parts.join(' - ');
  }

  /**
   * Format for markdown rendering
   */
  formatForMarkdown(
    response: string,
    citations: FormattedCitation[]
  ): string {
    const withInline = this.embedInlineCitations(response, citations);
    const bibliography = this.formatBibliography(citations);

    return withInline + bibliography;
  }

  /**
   * Format for plain text
   */
  formatForPlainText(
    response: string,
    citations: FormattedCitation[]
  ): string {
    const withInline = this.embedInlineCitations(response, citations);
    const bibliography = this.formatBibliographyPlainText(citations);

    return withInline + bibliography;
  }

  /**
   * Format bibliography for plain text (no markdown)
   */
  private formatBibliographyPlainText(citations: FormattedCitation[]): string {
    const lines: string[] = ['\n\nSources:\n'];

    for (const citation of citations) {
      lines.push(
        `[${citation.number}] ${citation.sourceName}: "${citation.excerpt}"`
      );

      if (citation.url) {
        lines.push(`     ${citation.url}`);
      }
    }

    return lines.join('\n');
  }
}
```

### Week 22: Integration & UI

#### Day 1-2: SAM Engine Integration

**File: `lib/sam/engines/citation-aware-engine.ts`**

```typescript
import { SAMBaseEngine } from './base-engine';
import { VectorSearch } from '../rag/vector-search';
import { CitationExtractor } from '../citations/citation-extractor';
import { CitationFormatter } from '../citations/citation-formatter';
import { db } from '@/lib/db';

export class CitationAwareEngine extends SAMBaseEngine {
  private vectorSearch: VectorSearch;
  private citationExtractor: CitationExtractor;
  private citationFormatter: CitationFormatter;

  constructor() {
    super();
    this.vectorSearch = new VectorSearch();
    this.citationExtractor = new CitationExtractor();
    this.citationFormatter = new CitationFormatter();
  }

  /**
   * Generate response with automatic citations
   */
  async generateWithCitations(
    userId: string,
    courseId: string,
    question: string
  ): Promise<{
    response: string;
    citations: FormattedCitation[];
  }> {
    // Retrieve relevant content
    const retrievedChunks = await this.vectorSearch.search(question, {
      courseId,
      topK: 5,
    });

    // Generate AI response with retrieved context
    const aiResponse = await this.generateResponse(question, retrievedChunks);

    // Extract citations
    const { citations, bibliography } = await this.citationExtractor.extractCitations(
      retrievedChunks,
      aiResponse
    );

    // Format response with inline citations and bibliography
    const formattedResponse = this.citationFormatter.formatForMarkdown(
      aiResponse,
      bibliography
    );

    // Store citations in database
    await this.storeCitations(userId, aiResponse, citations);

    return {
      response: formattedResponse,
      citations: bibliography,
    };
  }

  /**
   * Store citations for tracking
   */
  private async storeCitations(
    userId: string,
    response: string,
    citations: Array<CitationMatch & { number: number }>
  ): Promise<void> {
    // Create response record
    const responseRecord = await db.sAMResponse.create({
      data: {
        userId,
        content: response,
        citationCount: citations.length,
      },
    });

    // Create citation records
    await db.citation.createMany({
      data: citations.map(citation => ({
        responseId: responseRecord.id,
        sourceType: citation.sourceType,
        sourceId: citation.sourceId,
        sourceName: citation.sourceName,
        sourceUrl: citation.sourceUrl,
        citationText: citation.citationText,
        citationNumber: citation.number,
        relevanceScore: citation.relevanceScore,
      })),
    });
  }
}
```

#### Day 3-4: Citation UI Component

**File: `components/sam/citation-display.tsx`**

```typescript
'use client';

import React from 'react';
import { FormattedCitation } from '@/lib/sam/citations/citation-extractor';
import { ExternalLink, FileText, Video, Book } from 'lucide-react';

interface CitationDisplayProps {
  citations: FormattedCitation[];
  onCitationClick?: (citation: FormattedCitation) => void;
}

export const CitationDisplay: React.FC<CitationDisplayProps> = ({
  citations,
  onCitationClick,
}) => {
  if (citations.length === 0) return null;

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Sources ({citations.length})
      </h3>

      <div className="space-y-3">
        {citations.map((citation) => (
          <CitationCard
            key={citation.number}
            citation={citation}
            onClick={() => onCitationClick?.(citation)}
          />
        ))}
      </div>
    </div>
  );
};

interface CitationCardProps {
  citation: FormattedCitation;
  onClick?: () => void;
}

const CitationCard: React.FC<CitationCardProps> = ({ citation, onClick }) => {
  const Icon = getSourceIcon(citation.sourceType);

  return (
    <div
      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Citation Number */}
      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
        {citation.number}
      </div>

      {/* Source Icon */}
      <div className="flex-shrink-0 mt-1">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>

      {/* Citation Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {citation.sourceName}
        </p>

        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
          &quot;{citation.excerpt}&quot;
        </p>

        {citation.url && (
          <a
            href={citation.url}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            View Source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

function getSourceIcon(sourceType: string) {
  switch (sourceType) {
    case 'VIDEO':
      return Video;
    case 'TEXTBOOK':
      return Book;
    default:
      return FileText;
  }
}
```

---

## 📊 Metrics & Monitoring

```typescript
// lib/sam/citations/metrics.ts
export const citationMetrics = {
  citationRate: new client.Gauge({
    name: 'sam_citation_rate',
    help: 'Percentage of responses with citations',
  }),

  citationsPerResponse: new client.Histogram({
    name: 'sam_citations_per_response',
    help: 'Number of citations per response',
    buckets: [0, 1, 2, 3, 5, 10],
  }),

  citationClickRate: new client.Gauge({
    name: 'sam_citation_click_rate',
    help: 'Percentage of citations clicked by users',
  }),

  citationExtractionDuration: new client.Histogram({
    name: 'sam_citation_extraction_duration_seconds',
    help: 'Time to extract and format citations',
    buckets: [0.01, 0.05, 0.1, 0.2, 0.5],
  }),
};
```

---

## ✅ Acceptance Criteria

### Technical
- [ ] Citation rate >80%
- [ ] Citation accuracy >95%
- [ ] Extraction latency <100ms
- [ ] Deep links work 100%

### Quality
- [ ] Relevant citations >90%
- [ ] No hallucinated citations
- [ ] 3+ sources for complex answers

### UX
- [ ] "Citations helpful" >85%
- [ ] Click-through rate >40%
- [ ] Trust rating >4.5/5

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
