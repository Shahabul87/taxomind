/**
 * Test Script: Practice Goal Auto-Update
 *
 * Tests the automatic goal progress update when practice sessions end.
 *
 * Usage: npx tsx scripts/test-goal-auto-update.ts
 */

import { db } from '../lib/db';
import {
  createPrismaPracticeGoalStore,
  createPrismaPracticeSessionStore,
} from '../lib/sam/stores';

const practiceGoalStore = createPrismaPracticeGoalStore();
const practiceSessionStore = createPrismaPracticeSessionStore();

async function runTest() {
  console.log('🧪 Testing Practice Goal Auto-Update\n');
  console.log('='.repeat(50));

  // Get a test user
  const testUser = await db.user.findFirst({
    select: { id: true, email: true },
  });

  if (!testUser) {
    console.error('❌ No users found in database. Please create a user first.');
    process.exit(1);
  }

  console.log(`\n📧 Using test user: ${testUser.email} (${testUser.id})\n`);

  // Clean up any existing test goals
  const existingGoals = await db.practiceGoal.findMany({
    where: {
      userId: testUser.id,
      title: { startsWith: '[TEST]' },
    },
  });

  if (existingGoals.length > 0) {
    console.log(`🧹 Cleaning up ${existingGoals.length} existing test goals...`);
    await db.practiceGoal.deleteMany({
      where: {
        userId: testUser.id,
        title: { startsWith: '[TEST]' },
      },
    });
  }

  // =========================================================================
  // TEST 1: HOURS Goal
  // =========================================================================
  console.log('\n📌 TEST 1: HOURS Goal Auto-Update');
  console.log('-'.repeat(50));

  const hoursGoal = await practiceGoalStore.create({
    userId: testUser.id,
    title: '[TEST] Practice 2 Hours',
    description: 'Test goal for hours tracking',
    goalType: 'HOURS',
    targetValue: 2, // 2 hours target
  });

  console.log(`✅ Created HOURS goal: "${hoursGoal.title}"`);
  console.log(`   Target: ${hoursGoal.targetValue} hours, Current: ${hoursGoal.currentValue} hours`);

  // Simulate session end with 0.5 hours
  const hoursUpdate1 = await practiceGoalStore.updateGoalsOnSessionEnd(testUser.id, {
    rawHours: 0.5,
    qualityHours: 0.6,
    sessionsCount: 1,
  });

  console.log(`\n📊 After 30-min session (0.5 raw hours):`);
  for (const update of hoursUpdate1) {
    console.log(`   Goal: "${update.goal.title}"`);
    console.log(`   Progress: ${update.previousValue.toFixed(2)} → ${update.newValue.toFixed(2)} (+${update.progressDelta.toFixed(2)})`);
    console.log(`   Completed: ${update.wasCompleted ? '✅ YES!' : '❌ No'}`);
  }

  // Simulate another session to complete the goal
  const hoursUpdate2 = await practiceGoalStore.updateGoalsOnSessionEnd(testUser.id, {
    rawHours: 1.6,
    qualityHours: 2.0,
    sessionsCount: 1,
  });

  console.log(`\n📊 After 96-min session (1.6 raw hours):`);
  for (const update of hoursUpdate2) {
    console.log(`   Goal: "${update.goal.title}"`);
    console.log(`   Progress: ${update.previousValue.toFixed(2)} → ${update.newValue.toFixed(2)} (+${update.progressDelta.toFixed(2)})`);
    console.log(`   Completed: ${update.wasCompleted ? '✅ YES!' : '❌ No'}`);
  }

  // =========================================================================
  // TEST 2: SESSIONS Goal
  // =========================================================================
  console.log('\n\n📌 TEST 2: SESSIONS Goal Auto-Update');
  console.log('-'.repeat(50));

  const sessionsGoal = await practiceGoalStore.create({
    userId: testUser.id,
    title: '[TEST] Complete 3 Sessions',
    description: 'Test goal for session counting',
    goalType: 'SESSIONS',
    targetValue: 3,
  });

  console.log(`✅ Created SESSIONS goal: "${sessionsGoal.title}"`);
  console.log(`   Target: ${sessionsGoal.targetValue} sessions, Current: ${sessionsGoal.currentValue} sessions`);

  // Simulate 3 session ends
  for (let i = 1; i <= 3; i++) {
    const update = await practiceGoalStore.updateGoalsOnSessionEnd(testUser.id, {
      rawHours: 0.25,
      qualityHours: 0.3,
      sessionsCount: 1,
    });

    const sessionUpdate = update.find(u => u.goal.goalType === 'SESSIONS');
    if (sessionUpdate) {
      console.log(`\n📊 After session ${i}:`);
      console.log(`   Progress: ${sessionUpdate.previousValue} → ${sessionUpdate.newValue} (+${sessionUpdate.progressDelta})`);
      console.log(`   Completed: ${sessionUpdate.wasCompleted ? '✅ YES!' : '❌ No'}`);
    }
  }

  // =========================================================================
  // TEST 3: QUALITY_HOURS Goal
  // =========================================================================
  console.log('\n\n📌 TEST 3: QUALITY_HOURS Goal Auto-Update');
  console.log('-'.repeat(50));

  const qualityGoal = await practiceGoalStore.create({
    userId: testUser.id,
    title: '[TEST] Earn 1 Quality Hour',
    description: 'Test goal for quality hours tracking',
    goalType: 'QUALITY_HOURS',
    targetValue: 1,
  });

  console.log(`✅ Created QUALITY_HOURS goal: "${qualityGoal.title}"`);
  console.log(`   Target: ${qualityGoal.targetValue} quality hours, Current: ${qualityGoal.currentValue}`);

  // Simulate session with quality multiplier (0.5 raw * 2.0 multiplier = 1.0 quality)
  const qualityUpdate = await practiceGoalStore.updateGoalsOnSessionEnd(testUser.id, {
    rawHours: 0.5,
    qualityHours: 1.0, // With 2x multiplier
    sessionsCount: 1,
  });

  const qUpdate = qualityUpdate.find(u => u.goal.goalType === 'QUALITY_HOURS');
  if (qUpdate) {
    console.log(`\n📊 After session with 2x quality multiplier:`);
    console.log(`   Progress: ${qUpdate.previousValue.toFixed(2)} → ${qUpdate.newValue.toFixed(2)} (+${qUpdate.progressDelta.toFixed(2)})`);
    console.log(`   Completed: ${qUpdate.wasCompleted ? '✅ YES!' : '❌ No'}`);
  }

  // =========================================================================
  // TEST 4: Goal Statistics
  // =========================================================================
  console.log('\n\n📌 TEST 4: Goal Statistics');
  console.log('-'.repeat(50));

  const stats = await practiceGoalStore.getGoalStats(testUser.id);
  console.log(`\n📈 User Goal Statistics:`);
  console.log(`   Total Goals: ${stats.totalGoals}`);
  console.log(`   Active Goals: ${stats.activeGoals}`);
  console.log(`   Completed Goals: ${stats.completedGoals}`);
  console.log(`   Completion Rate: ${stats.completionRate.toFixed(1)}%`);
  console.log(`   Goals by Type:`, stats.byType);
  console.log(`   Recently Completed: ${stats.recentlyCompleted.length}`);

  // =========================================================================
  // CLEANUP
  // =========================================================================
  console.log('\n\n🧹 Cleaning up test goals...');
  await db.practiceGoal.deleteMany({
    where: {
      userId: testUser.id,
      title: { startsWith: '[TEST]' },
    },
  });
  console.log('✅ Test goals cleaned up');

  console.log('\n' + '='.repeat(50));
  console.log('🎉 All tests completed successfully!');
  console.log('='.repeat(50) + '\n');

  await db.$disconnect();
}

runTest().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
