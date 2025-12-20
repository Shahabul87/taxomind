# Initiative 3: Conversation Summarization

**Timeline**: Weeks 19-20 (2 weeks)
**Priority**: 🟡 High
**Budget**: $22,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: Current SAM conversations are limited by AI model context windows (4K-200K tokens). Long conversations lose early context, causing coherence issues and forcing users to repeat information.

**The Solution**: Implement rolling conversation summarization that compresses conversation history while preserving key information, enabling effectively infinite conversation length.

**Impact**:
- **Context Window**: Effectively infinite (compress 10K+ token conversations → 500 tokens)
- **Coherence**: Maintain multi-turn coherence across sessions
- **Cost Savings**: Reduce token costs by 60-80% for long conversations
- **User Experience**: "SAM remembers our entire conversation" feeling

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Compression ratio >80% (4000 tokens → <800 tokens)
- ✅ Summary generation latency <2 seconds
- ✅ Summary accuracy >85% (key points preserved)
- ✅ Multi-turn coherence maintained >90%

### AI Quality Metrics
- ✅ Information retention rate >90% (critical facts preserved)
- ✅ Context relevance score >85%
- ✅ Hallucination rate in summaries <3%
- ✅ Temporal coherence maintained (correct sequence of events)

### User Experience Metrics
- ✅ "SAM remembered context" rating >85%
- ✅ Conversation length increase by 3x (average 5 turns → 15+ turns)
- ✅ User satisfaction with long conversations >4.0/5
- ✅ Context loss complaints reduction by 80%

### Business Metrics
- ✅ Token cost reduction of 60-80% for conversations >10 turns
- ✅ Session duration increase by 40% (more engaged conversations)
- ✅ Return rate (students continuing conversations) >70%

---

## 🏗️ Architecture Design

### Conversation Summarization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 Conversation Summarization Pipeline          │
└─────────────────────────────────────────────────────────────┘

User Message → Add to Conversation History → Check Window Usage
                                                    │
                                                    ▼
                                        ┌───────────────────────┐
                                        │ Window > 70% full?    │
                                        └───────────────────────┘
                                                    │
                                    ┌───────────────┴───────────────┐
                                    │                               │
                                   YES                             NO
                                    │                               │
                                    ▼                               ▼
                        ┌──────────────────────┐          Continue normally
                        │  Trigger Summary     │
                        │  Generation          │
                        └──────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            Extract Key      Generate         Compress
              Points        Summary          Metadata
                    │               │               │
                    └───────────────┴───────────────┘
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │  Store Summary +     │
                        │  Archive Full Msgs   │
                        └──────────────────────┘
                                    │
                                    ▼
                    Replace conversation with:
                    [Summary] + [Recent N messages]
```

### Summary Storage Schema

```prisma
model ConversationSummary {
  id                String   @id @default(uuid())
  conversationId    String
  userId            String

  // Summary content
  summaryText       String   @db.Text
  keyPoints         Json     // Extracted important facts
  entities          Json     // People, places, concepts mentioned
  topics            Json     // Main discussion topics

  // Metadata
  messageRange      Json     // { startIdx: 0, endIdx: 10 }
  originalTokens    Int      // Tokens before summarization
  summaryTokens     Int      // Tokens after summarization
  compressionRatio  Float    // originalTokens / summaryTokens

  // Quality metrics
  qualityScore      Float?   // 0-1 (AI-evaluated)
  informationLoss   Float?   // Estimated % of info lost

  createdAt         DateTime @default(now())

  @@index([conversationId])
  @@index([userId])
}

model ConversationMessage {
  id                String   @id @default(uuid())
  conversationId    String
  role              Role     @default(USER) // USER, ASSISTANT, SYSTEM
  content           String   @db.Text

  // Summarization state
  isSummarized      Boolean  @default(false)
  summaryId         String?

  // Metadata
  tokenCount        Int
  timestamp         DateTime @default(now())

  @@index([conversationId, timestamp])
  @@index([summaryId])
}

model Conversation {
  id                String   @id @default(uuid())
  userId            String
  courseId          String?

  // Summary tracking
  currentSummaryId  String?
  totalSummaries    Int      @default(0)

  // Token management
  totalTokens       Int      @default(0)
  effectiveTokens   Int      @default(0) // After summarization

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId])
  @@index([courseId])
}

enum Role {
  USER
  ASSISTANT
  SYSTEM
}
```

---

## 🔧 Implementation Plan

### Week 19: Core Summarization Engine

#### Day 1-2: Summary Generation Engine

**File: `lib/sam/summarization/summary-engine.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { ConversationMessage } from '@/types/conversation';

interface SummaryConfig {
  maxSummaryTokens: number;
  minMessagesForSummary: number;
  compressionTarget: number; // Target ratio (e.g., 0.2 = 80% reduction)
  qualityThreshold: number;  // Minimum quality score (0-1)
}

interface SummaryResult {
  summaryText: string;
  keyPoints: string[];
  entities: Record<string, string[]>; // { people: [...], concepts: [...] }
  topics: string[];
  qualityScore: number;
  informationLoss: number;
  compressionRatio: number;
}

export class ConversationSummarizer {
  private anthropic: Anthropic;
  private config: SummaryConfig;

  constructor(config: Partial<SummaryConfig> = {}) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.config = {
      maxSummaryTokens: 500,
      minMessagesForSummary: 8,
      compressionTarget: 0.2,
      qualityThreshold: 0.8,
      ...config,
    };
  }

  /**
   * Generate summary from conversation messages
   */
  async summarize(
    messages: ConversationMessage[]
  ): Promise<SummaryResult> {
    // Validate minimum messages
    if (messages.length < this.config.minMessagesForSummary) {
      throw new Error(
        `Need at least ${this.config.minMessagesForSummary} messages to summarize`
      );
    }

    // Format messages for summarization
    const conversationText = this.formatMessages(messages);
    const originalTokens = this.estimateTokens(conversationText);

    // Generate summary using Claude
    const summary = await this.generateSummary(conversationText);

    // Extract key points
    const keyPoints = await this.extractKeyPoints(conversationText);

    // Extract entities (people, concepts, topics)
    const entities = await this.extractEntities(conversationText);

    // Extract main topics
    const topics = await this.extractTopics(conversationText);

    // Calculate quality metrics
    const summaryTokens = this.estimateTokens(summary);
    const compressionRatio = summaryTokens / originalTokens;
    const qualityScore = await this.evaluateQuality(
      conversationText,
      summary,
      keyPoints
    );

    // Estimate information loss
    const informationLoss = await this.estimateInformationLoss(
      conversationText,
      summary
    );

    return {
      summaryText: summary,
      keyPoints,
      entities,
      topics,
      qualityScore,
      informationLoss,
      compressionRatio,
    };
  }

  /**
   * Generate concise summary using Claude
   */
  private async generateSummary(conversationText: string): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: this.config.maxSummaryTokens,
      temperature: 0.3, // Lower temperature for more factual summaries
      messages: [
        {
          role: 'user',
          content: `You are an expert at summarizing educational conversations.

Given the following conversation between a student and an AI tutor, create a concise summary that:
1. Preserves all critical learning points and concepts discussed
2. Maintains the sequence of topics (temporal coherence)
3. Includes student's questions and the tutor's key explanations
4. Notes any misunderstandings or corrections
5. Highlights student's progress or struggles

Keep the summary factual and comprehensive but concise (target: ${this.config.maxSummaryTokens} tokens).

CONVERSATION:
${conversationText}

SUMMARY:`,
        },
      ],
    });

    return message.content[0].type === 'text'
      ? message.content[0].text
      : '';
  }

  /**
   * Extract key points from conversation
   */
  private async extractKeyPoints(conversationText: string): Promise<string[]> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Extract 5-10 key points from this educational conversation as a JSON array of strings:

${conversationText}

Return ONLY a JSON array, nothing else.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';

    try {
      return JSON.parse(text);
    } catch {
      // Fallback: split by newlines
      return text
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
    }
  }

  /**
   * Extract entities (people, concepts, topics)
   */
  private async extractEntities(
    conversationText: string
  ): Promise<Record<string, string[]>> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Extract entities from this conversation. Return JSON with:
{
  "concepts": ["concept1", "concept2"],
  "people": ["person1"],
  "tools": ["tool1"]
}

CONVERSATION:
${conversationText}

Return ONLY valid JSON.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

    try {
      return JSON.parse(text);
    } catch {
      return { concepts: [], people: [], tools: [] };
    }
  }

  /**
   * Extract main discussion topics
   */
  private async extractTopics(conversationText: string): Promise<string[]> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `List 3-5 main topics discussed in this conversation as a JSON array:

${conversationText}

Return ONLY a JSON array of topic strings.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';

    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  }

  /**
   * Evaluate summary quality (0-1 score)
   */
  private async evaluateQuality(
    original: string,
    summary: string,
    keyPoints: string[]
  ): Promise<number> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Rate this summary's quality on a scale of 0.0 to 1.0 based on:
- Coverage of key points
- Factual accuracy
- Coherence

ORIGINAL:
${original.substring(0, 2000)}...

SUMMARY:
${summary}

KEY POINTS:
${keyPoints.join('\n')}

Return ONLY a number between 0.0 and 1.0.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '0.5';
    const score = parseFloat(text.trim());

    return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
  }

  /**
   * Estimate information loss (0-1, where 0 = no loss)
   */
  private async estimateInformationLoss(
    original: string,
    summary: string
  ): Promise<number> {
    // Simple heuristic: compare unique concepts
    const originalConcepts = this.extractConceptSet(original);
    const summaryConcepts = this.extractConceptSet(summary);

    const intersection = new Set(
      [...summaryConcepts].filter(c => originalConcepts.has(c))
    );

    const loss = 1 - (intersection.size / originalConcepts.size);

    return Math.max(0, Math.min(1, loss));
  }

  /**
   * Extract unique concepts from text
   */
  private extractConceptSet(text: string): Set<string> {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4); // Only significant words

    return new Set(words);
  }

  /**
   * Format messages into readable text
   */
  private formatMessages(messages: ConversationMessage[]): string {
    return messages
      .map(msg => {
        const role = msg.role === 'USER' ? 'Student' : 'Tutor';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
```

#### Day 3-4: Conversation Window Manager

**File: `lib/sam/summarization/window-manager.ts`**

```typescript
import { db } from '@/lib/db';
import { ConversationSummarizer, SummaryResult } from './summary-engine';

interface WindowConfig {
  maxContextTokens: number;    // Total context window size
  summarizationThreshold: number; // Trigger at X% full (0.7 = 70%)
  recentMessagesCount: number; // Keep N recent messages unsummarized
  minMessagesForSummary: number;
}

interface ConversationWindow {
  summaries: string[];         // Previous summaries
  recentMessages: ConversationMessage[];
  totalTokens: number;
  effectiveTokens: number;
}

export class ConversationWindowManager {
  private summarizer: ConversationSummarizer;
  private config: WindowConfig;

  constructor(config: Partial<WindowConfig> = {}) {
    this.config = {
      maxContextTokens: 8000,      // Conservative limit
      summarizationThreshold: 0.7, // Summarize at 70% full
      recentMessagesCount: 5,      // Keep 5 recent messages
      minMessagesForSummary: 8,
      ...config,
    };

    this.summarizer = new ConversationSummarizer({
      minMessagesForSummary: this.config.minMessagesForSummary,
    });
  }

  /**
   * Add a message and manage window size
   */
  async addMessage(
    conversationId: string,
    role: 'USER' | 'ASSISTANT',
    content: string
  ): Promise<void> {
    // Create message record
    const message = await db.conversationMessage.create({
      data: {
        conversationId,
        role,
        content,
        tokenCount: this.estimateTokens(content),
      },
    });

    // Check if summarization needed
    const window = await this.getConversationWindow(conversationId);

    if (this.shouldSummarize(window)) {
      await this.summarizeConversation(conversationId);
    }

    // Update conversation token counts
    await this.updateConversationMetrics(conversationId);
  }

  /**
   * Get current conversation window
   */
  async getConversationWindow(
    conversationId: string
  ): Promise<ConversationWindow> {
    // Get all messages
    const messages = await db.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
    });

    // Get existing summaries
    const summaries = await db.conversationSummary.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { summaryText: true },
    });

    // Separate summarized and recent messages
    const recentMessages = messages.slice(-this.config.recentMessagesCount);

    const totalTokens = messages.reduce(
      (sum, msg) => sum + msg.tokenCount,
      0
    );

    const summaryTokens = summaries.reduce(
      (sum, summary) => sum + this.estimateTokens(summary.summaryText),
      0
    );

    const recentTokens = recentMessages.reduce(
      (sum, msg) => sum + msg.tokenCount,
      0
    );

    const effectiveTokens = summaryTokens + recentTokens;

    return {
      summaries: summaries.map(s => s.summaryText),
      recentMessages,
      totalTokens,
      effectiveTokens,
    };
  }

  /**
   * Check if summarization should be triggered
   */
  private shouldSummarize(window: ConversationWindow): boolean {
    const usage = window.effectiveTokens / this.config.maxContextTokens;

    return (
      usage >= this.config.summarizationThreshold &&
      window.recentMessages.length >= this.config.minMessagesForSummary
    );
  }

  /**
   * Summarize conversation messages
   */
  private async summarizeConversation(conversationId: string): Promise<void> {
    // Get messages to summarize (exclude recent N messages)
    const allMessages = await db.conversationMessage.findMany({
      where: {
        conversationId,
        isSummarized: false,
      },
      orderBy: { timestamp: 'asc' },
    });

    if (allMessages.length <= this.config.recentMessagesCount) {
      return; // Not enough to summarize
    }

    // Split: messages to summarize vs keep recent
    const messagesToSummarize = allMessages.slice(
      0,
      allMessages.length - this.config.recentMessagesCount
    );

    // Generate summary
    const summary = await this.summarizer.summarize(messagesToSummarize);

    // Store summary
    const summaryRecord = await db.conversationSummary.create({
      data: {
        conversationId,
        userId: messagesToSummarize[0].userId,
        summaryText: summary.summaryText,
        keyPoints: summary.keyPoints,
        entities: summary.entities,
        topics: summary.topics,
        messageRange: {
          startIdx: 0,
          endIdx: messagesToSummarize.length - 1,
        },
        originalTokens: messagesToSummarize.reduce(
          (sum, msg) => sum + msg.tokenCount,
          0
        ),
        summaryTokens: this.estimateTokens(summary.summaryText),
        compressionRatio: summary.compressionRatio,
        qualityScore: summary.qualityScore,
        informationLoss: summary.informationLoss,
      },
    });

    // Mark messages as summarized
    await db.conversationMessage.updateMany({
      where: {
        id: { in: messagesToSummarize.map(m => m.id) },
      },
      data: {
        isSummarized: true,
        summaryId: summaryRecord.id,
      },
    });

    // Update conversation
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        currentSummaryId: summaryRecord.id,
        totalSummaries: { increment: 1 },
      },
    });
  }

  /**
   * Update conversation token metrics
   */
  private async updateConversationMetrics(
    conversationId: string
  ): Promise<void> {
    const window = await this.getConversationWindow(conversationId);

    await db.conversation.update({
      where: { id: conversationId },
      data: {
        totalTokens: window.totalTokens,
        effectiveTokens: window.effectiveTokens,
      },
    });
  }

  /**
   * Get formatted context for AI (summaries + recent messages)
   */
  async getFormattedContext(conversationId: string): Promise<string> {
    const window = await this.getConversationWindow(conversationId);

    const parts: string[] = [];

    // Add summaries if exist
    if (window.summaries.length > 0) {
      parts.push('CONVERSATION HISTORY SUMMARY:');
      parts.push(window.summaries.join('\n\n---\n\n'));
      parts.push('\nRECENT CONVERSATION:');
    }

    // Add recent messages
    const recentText = window.recentMessages
      .map(msg => {
        const role = msg.role === 'USER' ? 'Student' : 'Tutor';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    parts.push(recentText);

    return parts.join('\n');
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
```

### Week 20: Integration & Testing

#### Day 1-2: SAM Engine Integration

**File: `lib/sam/engines/conversation-aware-engine.ts`**

```typescript
import { SAMBaseEngine } from './base-engine';
import { ConversationWindowManager } from '../summarization/window-manager';

export class ConversationAwareEngine extends SAMBaseEngine {
  private windowManager: ConversationWindowManager;

  constructor() {
    super();
    this.windowManager = new ConversationWindowManager();
  }

  /**
   * Generate response with full conversation context
   */
  async generateResponse(
    userId: string,
    conversationId: string,
    userMessage: string
  ): Promise<string> {
    // Add user message to conversation
    await this.windowManager.addMessage(
      conversationId,
      'USER',
      userMessage
    );

    // Get formatted context (summaries + recent messages)
    const conversationContext = await this.windowManager.getFormattedContext(
      conversationId
    );

    // Generate AI response with full context
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are SAM, an adaptive AI tutor. Use the conversation history to provide contextually relevant responses.

${conversationContext}

Student's latest message: ${userMessage}

Provide a helpful, context-aware response that builds on our conversation history.`,
        },
      ],
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Add assistant response to conversation
    await this.windowManager.addMessage(
      conversationId,
      'ASSISTANT',
      assistantMessage
    );

    return assistantMessage;
  }
}
```

#### Day 3-4: Testing & Validation

**File: `__tests__/sam/summarization/summary-engine.test.ts`**

```typescript
import { ConversationSummarizer } from '@/lib/sam/summarization/summary-engine';
import { ConversationMessage } from '@/types/conversation';

describe('ConversationSummarizer', () => {
  let summarizer: ConversationSummarizer;

  beforeEach(() => {
    summarizer = new ConversationSummarizer();
  });

  describe('summarize', () => {
    it('should compress conversation by >80%', async () => {
      const messages = createLongConversation(20); // 20 messages

      const result = await summarizer.summarize(messages);

      expect(result.compressionRatio).toBeLessThan(0.2);
    });

    it('should preserve key points', async () => {
      const messages = createConversationAboutQuadraticFormula();

      const result = await summarizer.summarize(messages);

      expect(result.keyPoints).toContain(
        expect.stringContaining('quadratic formula')
      );
      expect(result.keyPoints.length).toBeGreaterThan(3);
    });

    it('should extract entities correctly', async () => {
      const messages = createConversationAboutPythonProgramming();

      const result = await summarizer.summarize(messages);

      expect(result.entities.concepts).toContain('Python');
      expect(result.entities.concepts).toContain('loops');
    });

    it('should maintain quality score >0.8', async () => {
      const messages = createLongConversation(15);

      const result = await summarizer.summarize(messages);

      expect(result.qualityScore).toBeGreaterThan(0.8);
    });
  });
});

// Test helpers
function createLongConversation(messageCount: number): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  for (let i = 0; i < messageCount; i++) {
    messages.push({
      id: `msg-${i}`,
      conversationId: 'conv-1',
      role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
      content: `Message ${i} content with sufficient length to simulate real conversation`,
      tokenCount: 20,
      timestamp: new Date(),
      isSummarized: false,
    });
  }

  return messages;
}
```

---

## 📊 Metrics & Monitoring

### Summary Quality Metrics

**Prometheus Metrics:**

```typescript
// lib/sam/summarization/metrics.ts
import client from 'prom-client';

export const summarizationMetrics = {
  // Summary generation
  summaryGenerationDuration: new client.Histogram({
    name: 'sam_summary_generation_duration_seconds',
    help: 'Time to generate conversation summaries',
    buckets: [0.5, 1, 2, 5, 10],
  }),

  // Compression metrics
  compressionRatio: new client.Histogram({
    name: 'sam_summary_compression_ratio',
    help: 'Compression ratio achieved (summaryTokens / originalTokens)',
    buckets: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
  }),

  // Quality metrics
  summaryQualityScore: new client.Histogram({
    name: 'sam_summary_quality_score',
    help: 'AI-evaluated summary quality (0-1)',
    buckets: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  }),

  informationLoss: new client.Histogram({
    name: 'sam_summary_information_loss',
    help: 'Estimated information loss during summarization (0-1)',
    buckets: [0, 0.1, 0.2, 0.3, 0.5],
  }),

  // Token savings
  tokensSaved: new client.Counter({
    name: 'sam_summary_tokens_saved_total',
    help: 'Total tokens saved through summarization',
  }),
};
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "SAM Conversation Summarization",
    "panels": [
      {
        "title": "Summary Compression Ratio",
        "targets": [{
          "expr": "histogram_quantile(0.95, sam_summary_compression_ratio)"
        }],
        "description": "Target: <0.2 (80%+ compression)"
      },
      {
        "title": "Summary Quality Score",
        "targets": [{
          "expr": "histogram_quantile(0.50, sam_summary_quality_score)"
        }],
        "description": "Target: >0.85"
      },
      {
        "title": "Token Savings (Cost Reduction)",
        "targets": [{
          "expr": "rate(sam_summary_tokens_saved_total[5m]) * 60"
        }],
        "description": "Tokens saved per minute"
      },
      {
        "title": "Information Loss",
        "targets": [{
          "expr": "histogram_quantile(0.95, sam_summary_information_loss)"
        }],
        "description": "Target: <0.15 (85%+ retention)"
      }
    ]
  }
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

**Coverage Requirements**: >85%

```typescript
// Summary Engine Tests
✅ Compression ratio validation
✅ Key point extraction accuracy
✅ Entity extraction completeness
✅ Quality score calculation
✅ Information loss estimation

// Window Manager Tests
✅ Trigger threshold detection
✅ Message archival logic
✅ Context assembly
✅ Token counting accuracy
```

### 2. Integration Tests

```typescript
describe('Conversation Summarization Integration', () => {
  it('should maintain coherence across 20+ turn conversation', async () => {
    const conversationId = await createConversation();

    // Simulate 25 turns (should trigger 2-3 summarizations)
    for (let i = 0; i < 25; i++) {
      await windowManager.addMessage(
        conversationId,
        i % 2 === 0 ? 'USER' : 'ASSISTANT',
        `Turn ${i} message content`
      );
    }

    // Verify summaries created
    const summaries = await db.conversationSummary.findMany({
      where: { conversationId },
    });

    expect(summaries.length).toBeGreaterThan(0);

    // Verify compression achieved
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    expect(conversation.effectiveTokens).toBeLessThan(
      conversation.totalTokens * 0.5
    );
  });
});
```

### 3. Quality Validation

```typescript
// Manual validation script
async function validateSummaryQuality() {
  const testConversations = await loadTestConversations();

  for (const conv of testConversations) {
    const summary = await summarizer.summarize(conv.messages);

    // Human evaluation
    console.log('Original:', conv.messages.length, 'messages');
    console.log('Summary:', summary.summaryText);
    console.log('Key Points:', summary.keyPoints);
    console.log('Quality Score:', summary.qualityScore);
    console.log('Compression:', summary.compressionRatio);

    const humanRating = await promptHumanRating();

    // Log for analysis
    await logQualityMetrics({
      conversationId: conv.id,
      aiQuality: summary.qualityScore,
      humanRating,
      compressionRatio: summary.compressionRatio,
    });
  }
}
```

---

## 💰 Budget Breakdown

### Engineering Costs
- **Senior Backend Engineer** (2 weeks): $12,000
- **ML/AI Engineer** (1 week): $6,000
- **QA Engineer** (1 week): $3,000
- **Total Engineering**: $21,000

### Infrastructure & API Costs
- **Anthropic API** (summarization): $500
- **Testing & validation**: $300
- **Total Infrastructure**: $800

### Contingency (10%): $2,200

**Total Budget**: $22,000

---

## ✅ Acceptance Criteria

### Technical Requirements
- [ ] Compression ratio consistently >80% (4000 tokens → <800 tokens)
- [ ] Summary generation latency <2 seconds (p95)
- [ ] Quality score >0.85 for all summaries
- [ ] Information loss <15% (85%+ retention)
- [ ] Handles conversations up to 50+ turns

### Quality Requirements
- [ ] Key points preserved in 95%+ of summaries
- [ ] Temporal coherence maintained (correct event sequence)
- [ ] No hallucinations introduced in summaries
- [ ] Entity extraction accuracy >90%

### Integration Requirements
- [ ] Integrated with all SAM engines
- [ ] Works with existing conversation storage
- [ ] Automatic summarization triggers working
- [ ] Context assembly optimized for AI consumption

### Observability Requirements
- [ ] Prometheus metrics for all summarization events
- [ ] Grafana dashboard showing compression, quality, savings
- [ ] Alerts for quality degradation
- [ ] Cost tracking for summarization API calls

### User Experience Requirements
- [ ] "SAM remembered context" rating >85%
- [ ] No visible latency for users
- [ ] Conversation length increase by 3x
- [ ] User satisfaction >4.0/5 for long conversations

---

## 🎯 Success Metrics Tracking

### Week 1 Targets
- [ ] Summary engine generating summaries with <2s latency
- [ ] Compression ratio >70%
- [ ] Key point extraction working

### Week 2 Targets
- [ ] Window manager integrated with SAM engines
- [ ] Compression ratio >80%
- [ ] Quality score >0.85
- [ ] All tests passing

### Go-Live Criteria
- ✅ All acceptance criteria met
- ✅ 100 test conversations validated
- ✅ Token cost savings verified (>60%)
- ✅ User experience improvement confirmed
- ✅ Production monitoring operational

---

## 🔗 Related Documents

### Dependencies
- [RAG Pipeline Implementation](./01-rag-pipeline-implementation.md) - Retrieval context
- [Student Memory System](./02-student-memory-system.md) - Personalization data

### Phase Documents
- [Phase 2 Overview](./README.md)
- [Master Roadmap](../00-MASTER-ROADMAP.md)

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
**Status**: Ready for Implementation
