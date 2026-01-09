/**
 * Test Memory Package Directly
 * Tests the @sam-ai/agentic memory system components
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import {
  createMemorySystem,
  CrossSessionContext,
  InMemoryContextStore,
  type SessionContext,
} from '@sam-ai/agentic';

const prisma = new PrismaClient();

// Mock embedding provider for testing
class MockEmbeddingProvider {
  async embed(_text: string): Promise<number[]> {
    return Array(1536).fill(0).map(() => Math.random());
  }
  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(() => Array(1536).fill(0).map(() => Math.random()));
  }
  getModelName(): string { return 'mock-embedding'; }
  getDimensions(): number { return 1536; }
}

async function testMemoryPackage() {
  console.log('🧪 Testing @sam-ai/agentic Memory Package\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Get test user
  const user = await prisma.user.findFirst({
    where: { email: { not: null } },
    select: { id: true, name: true },
  });

  if (!user) {
    console.log('❌ No user found');
    return;
  }

  console.log('👤 User:', user.name, '(' + user.id + ')');
  console.log('');

  // 2. Test CrossSessionContext directly
  console.log('🧠 Testing CrossSessionContext...\n');

  const contextStore = new InMemoryContextStore();
  const crossSessionContext = new CrossSessionContext({
    contextStore,
    logger: console,
  });

  // Get or create context
  console.log('   Creating session context...');
  const sessionContext = await crossSessionContext.getOrCreateContext(user.id, 'test-course');

  console.log('   ✅ Session context created');
  console.log('   Context ID:', sessionContext.id);
  console.log('   User ID:', sessionContext.userId);
  console.log('   Course ID:', sessionContext.courseId);
  console.log('   Session count:', sessionContext.currentState.sessionCount);
  console.log('');

  // 3. Test recording a question
  console.log('📝 Recording question...');
  await crossSessionContext.recordQuestion(
    user.id,
    'What is the difference between let and const in JavaScript?',
    'test-course'
  );
  console.log('   ✅ Question recorded');
  console.log('');

  // 4. Test recording concept learned
  console.log('🎓 Recording concept learned...');
  await crossSessionContext.recordConceptLearned(
    user.id,
    'JavaScript variable declarations (let, const, var)',
    'test-course'
  );
  console.log('   ✅ Concept learned recorded');
  console.log('');

  // 5. Verify updates
  console.log('🔍 Verifying updates...');
  const updatedContext = await crossSessionContext.getOrCreateContext(user.id, 'test-course');

  console.log('   Mastered concepts:', updatedContext.insights.masteredConcepts.length);
  if (updatedContext.insights.masteredConcepts.length > 0) {
    console.log('   Latest mastered:', updatedContext.insights.masteredConcepts.slice(-3).join(', '));
  }
  console.log('   Recent concepts:', updatedContext.currentState.recentConcepts.length);
  if (updatedContext.currentState.recentConcepts.length > 0) {
    console.log('   Latest recent:', updatedContext.currentState.recentConcepts.slice(-3).join(', '));
  }
  console.log('');

  // 6. Test updating insights (simulating low progress → struggling concept)
  console.log('📊 Recording struggling concept...');
  await crossSessionContext.recordStruggle(
    user.id,
    'Closures in JavaScript',
    'test-course'
  );
  console.log('   ✅ Struggling concept recorded');

  const afterStruggle = await crossSessionContext.getOrCreateContext(user.id, 'test-course');
  console.log('   Struggling concepts:', afterStruggle.insights.strugglingConcepts.length);
  if (afterStruggle.insights.strugglingConcepts.length > 0) {
    console.log('   Latest struggling:', afterStruggle.insights.strugglingConcepts.join(', '));
  }
  console.log('');

  // 7. Test context for prompt generation
  console.log('💬 Getting context for prompt...');
  const promptContext = await crossSessionContext.getContextForPrompt(user.id, 'test-course');

  console.log('   ✅ Context for prompt retrieved');
  console.log('   Has session summary:', !!promptContext.sessionSummary);
  console.log('   Mastered count:', promptContext.mastered?.length || 0);
  console.log('   Struggling count:', promptContext.struggling?.length || 0);
  console.log('   Recent topics count:', promptContext.recentTopics?.length || 0);
  console.log('');

  // 8. Test full memory system creation
  console.log('🔧 Testing full MemorySystem creation...');
  try {
    const embeddingProvider = new MockEmbeddingProvider();
    const memorySystem = createMemorySystem({
      embeddingProvider,
      logger: console,
    });

    console.log('   ✅ Memory system created');
    console.log('   Has vectorStore:', !!memorySystem.vectorStore);
    console.log('   Has knowledgeGraph:', !!memorySystem.knowledgeGraph);
    console.log('   Has sessionContext:', !!memorySystem.sessionContext);
    console.log('   Has memoryRetriever:', !!memorySystem.memoryRetriever);
    console.log('');
  } catch (error) {
    console.log('   ⚠️ Memory system creation error:', error);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Memory Package Test Complete\n');
  console.log('Summary of Memory Integration:');
  console.log('• CrossSessionContext tracks user learning across sessions');
  console.log('• recordQuestion() - logs questions for context');
  console.log('• recordConceptLearned() - adds to mastered concepts');
  console.log('• recordStruggle() - tracks concepts needing reinforcement');
  console.log('• getContextForPrompt() - provides memory data for LLM prompts');
  console.log('');
  console.log('In the unified route, this data flows to:');
  console.log('• prepareTutoringContext() receives sessionContext');
  console.log('• TutoringContext.memoryContext gets populated');
  console.log('• PlanContextInjector adds memory to LLM prompt');
  console.log('• After response, learning is recorded back to memory');
  console.log('');
}

testMemoryPackage()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
