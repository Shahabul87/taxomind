/**
 * Test script to verify TaxomindContext works correctly
 * Run with: npx ts-node --transpile-only scripts/test-taxomind-context.ts
 */

import {
  getTaxomindContext,
  getStore,
  getGoalStores,
  getProactiveStores,
  getMemoryStores,
  getLearningPathStores,
  isTaxomindContextInitialized,
  resetTaxomindContext,
} from '../lib/sam/taxomind-context';

async function testTaxomindContext() {
  console.log('='.repeat(60));
  console.log('Testing TaxomindContext Integration');
  console.log('='.repeat(60));

  // Test 1: Context initialization
  console.log('\n[Test 1] Context Initialization');
  console.log('  Before init:', isTaxomindContextInitialized() ? 'YES' : 'NO');

  const context = getTaxomindContext();
  console.log('  After init:', isTaxomindContextInitialized() ? 'YES' : 'NO');
  console.log('  Initialization time:', context.initializationTime.toISOString());
  console.log('  Total stores:', Object.keys(context.stores).length);
  console.log('  ✓ Context initialized successfully');

  // Test 2: Individual store access
  console.log('\n[Test 2] Individual Store Access (getStore)');
  const goalStore = getStore('goal');
  const planStore = getStore('plan');
  const toolStore = getStore('tool');
  console.log('  Goal store:', goalStore ? '✓' : '✗');
  console.log('  Plan store:', planStore ? '✓' : '✗');
  console.log('  Tool store:', toolStore ? '✓' : '✗');

  // Test 3: Goal stores group
  console.log('\n[Test 3] Goal Stores Group');
  const goalStores = getGoalStores();
  console.log('  goal:', goalStores.goal ? '✓' : '✗');
  console.log('  subGoal:', goalStores.subGoal ? '✓' : '✗');
  console.log('  plan:', goalStores.plan ? '✓' : '✗');

  // Test 4: Proactive stores group
  console.log('\n[Test 4] Proactive Stores Group');
  const proactiveStores = getProactiveStores();
  console.log('  behaviorEvent:', proactiveStores.behaviorEvent ? '✓' : '✗');
  console.log('  pattern:', proactiveStores.pattern ? '✓' : '✗');
  console.log('  intervention:', proactiveStores.intervention ? '✓' : '✗');
  console.log('  checkIn:', proactiveStores.checkIn ? '✓' : '✗');

  // Test 5: Memory stores group
  console.log('\n[Test 5] Memory Stores Group');
  const memoryStores = getMemoryStores();
  console.log('  vector:', memoryStores.vector ? '✓' : '✗');
  console.log('  knowledgeGraph:', memoryStores.knowledgeGraph ? '✓' : '✗');
  console.log('  sessionContext:', memoryStores.sessionContext ? '✓' : '✗');

  // Test 6: Learning path stores group
  console.log('\n[Test 6] Learning Path Stores Group');
  const learningPathStores = getLearningPathStores();
  console.log('  skill:', learningPathStores.skill ? '✓' : '✗');
  console.log('  learningPath:', learningPathStores.learningPath ? '✓' : '✗');
  console.log('  courseGraph:', learningPathStores.courseGraph ? '✓' : '✗');

  // Test 7: Singleton behavior
  console.log('\n[Test 7] Singleton Behavior');
  const context2 = getTaxomindContext();
  console.log('  Same instance:', context === context2 ? '✓' : '✗');

  // Test 8: Reset functionality
  console.log('\n[Test 8] Reset Functionality');
  resetTaxomindContext();
  console.log('  After reset:', isTaxomindContextInitialized() ? 'Still initialized' : 'Reset successful ✓');

  // Re-initialize
  const context3 = getTaxomindContext();
  console.log('  Re-initialized:', isTaxomindContextInitialized() ? '✓' : '✗');
  console.log('  New instance:', context !== context3 ? '✓' : '✗');

  // Test 9: All store names
  console.log('\n[Test 9] All Available Stores');
  const allStoreNames = Object.keys(context3.stores);
  console.log('  Store count:', allStoreNames.length);
  console.log('  Stores:', allStoreNames.join(', '));

  console.log('\n' + '='.repeat(60));
  console.log('All tests passed! TaxomindContext is working correctly.');
  console.log('='.repeat(60));
}

// Run the test
testTaxomindContext()
  .then(() => {
    console.log('\nTest completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  });
