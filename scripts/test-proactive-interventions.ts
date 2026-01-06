/**
 * Test Proactive Interventions
 * Tests the proactive intervention system via the unified SAM route
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import {
  initializeProactiveInterventions,
  processProactiveInterventions,
  trackSessionStart,
  trackQuestionAsked,
  trackFrustrationSignal,
  detectPatterns,
  predictChurnRisk,
  predictStruggleAreas,
  getPendingInterventions,
  createStruggleCheckIn,
  formatProactiveResponse,
} from '../lib/sam/proactive-intervention-integration';

const prisma = new PrismaClient();

async function testProactiveInterventions() {
  console.log('🧪 Testing Proactive Intervention System\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Get test user
  const user = await prisma.user.findFirst({
    where: { email: { not: null } },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    console.log('❌ No user found');
    return;
  }

  console.log('👤 User:', user.name, '(' + user.id + ')');
  console.log('');

  // Get a course for context
  const course = await prisma.course.findFirst({
    where: { isPublished: true },
    select: { id: true, title: true },
  });

  const courseId = course?.id ?? 'test-course';
  console.log('📚 Course:', course?.title ?? 'Test Course', '(' + courseId + ')');
  console.log('');

  // 2. Initialize Proactive Subsystems
  console.log('🔧 Initializing proactive subsystems...');
  const subsystems = initializeProactiveInterventions();
  console.log('   ✅ BehaviorMonitor initialized:', !!subsystems.behaviorMonitor);
  console.log('   ✅ CheckInScheduler initialized:', !!subsystems.checkInScheduler);
  console.log('   ✅ PlanTracker initialized:', !!subsystems.planTracker);
  console.log('');

  const sessionId = `test-session-${Date.now()}`;

  // 3. Test Session Start Tracking
  console.log('📍 Testing trackSessionStart...');
  const sessionEvent = await trackSessionStart(user.id, sessionId, {
    path: '/courses/' + courseId + '/learn',
    courseId,
  });
  console.log('   ✅ Session start tracked:', sessionEvent ? sessionEvent.id : 'null');
  console.log('');

  // 4. Test Question Asked Tracking
  console.log('❓ Testing trackQuestionAsked...');
  const questionEvent = await trackQuestionAsked(
    user.id,
    sessionId,
    { path: '/courses/' + courseId + '/learn', courseId },
    {
      question: 'What is the difference between let and const in JavaScript?',
      bloomsLevel: 'understand',
      topic: 'JavaScript Variables',
    }
  );
  console.log('   ✅ Question tracked:', questionEvent ? questionEvent.id : 'null');
  console.log('');

  // 5. Test Frustration Signal
  console.log('😤 Testing trackFrustrationSignal...');
  const frustrationEvent = await trackFrustrationSignal(
    user.id,
    sessionId,
    { path: '/courses/' + courseId + '/learn', courseId },
    0.8,
    'text'
  );
  console.log('   ✅ Frustration signal tracked:', frustrationEvent ? frustrationEvent.id : 'null');
  console.log('');

  // 6. Test Pattern Detection
  console.log('🔍 Testing detectPatterns...');
  const patterns = await detectPatterns(user.id);
  console.log('   Patterns found:', patterns?.patterns.length ?? 0);
  if (patterns && patterns.patterns.length > 0) {
    patterns.patterns.slice(0, 3).forEach((p) => {
      console.log(`   - ${p.name}: ${(p.confidence * 100).toFixed(1)}% confidence`);
    });
  }
  console.log('');

  // 7. Test Churn Prediction
  console.log('📉 Testing predictChurnRisk...');
  const churnPrediction = await predictChurnRisk(user.id);
  if (churnPrediction) {
    console.log('   Risk Level:', churnPrediction.riskLevel);
    console.log('   Probability:', (churnPrediction.probability * 100).toFixed(1) + '%');
    console.log('   Factors:', churnPrediction.factors.length);
    console.log('   Recommended Interventions:', churnPrediction.recommendedInterventions.length);
  } else {
    console.log('   ⚠️ No churn prediction available (not enough data)');
  }
  console.log('');

  // 8. Test Struggle Prediction
  console.log('🆘 Testing predictStruggleAreas...');
  const strugglePrediction = await predictStruggleAreas(user.id);
  if (strugglePrediction) {
    console.log('   Probability:', (strugglePrediction.probability * 100).toFixed(1) + '%');
    console.log('   Areas:', strugglePrediction.areas.length);
    console.log('   Recommended Support:', strugglePrediction.recommendedSupport.length);
  } else {
    console.log('   ⚠️ No struggle prediction available (not enough data)');
  }
  console.log('');

  // 9. Test Struggle Check-In Creation
  console.log('🔔 Testing createStruggleCheckIn...');
  const checkIn = await createStruggleCheckIn(user.id, 0.8);
  console.log('   ✅ Struggle check-in created:', checkIn ? `${checkIn.id} (${checkIn.type})` : 'null');
  console.log('');

  // 10. Test Pending Interventions
  console.log('📋 Testing getPendingInterventions...');
  const interventions = await getPendingInterventions(user.id);
  console.log('   Pending interventions:', interventions.length);
  interventions.slice(0, 3).forEach((i) => {
    console.log(`   - [${i.priority}] ${i.type}: ${i.message.substring(0, 50)}...`);
  });
  console.log('');

  // 11. Test Full Process (simulating unified route call)
  console.log('🚀 Testing processProactiveInterventions (full flow)...');
  const proactiveResult = await processProactiveInterventions(
    user.id,
    sessionId,
    'I keep getting confused about closures in JavaScript. Can you help?',
    {
      path: '/courses/' + courseId + '/learn',
      type: 'sam-chat',
      courseId,
    },
    {
      bloomsLevel: 'understand',
      confidence: 0.6,
      topic: 'JavaScript Closures',
      frustrationDetected: true,
      frustrationLevel: 0.7,
    }
  );

  console.log('   Events tracked:', proactiveResult.eventsTracked.length);
  console.log('   Patterns detected:', proactiveResult.patternsDetected.length);
  console.log('   Interventions triggered:', proactiveResult.interventionsTriggered.length);
  console.log('   Check-ins triggered:', proactiveResult.checkInsTriggered.length);
  console.log('   Has predictions:', !!proactiveResult.predictions);
  console.log('');

  // 12. Test Response Formatting
  console.log('📦 Testing formatProactiveResponse...');
  const formattedResponse = formatProactiveResponse(proactiveResult);
  console.log('   Formatted response:');
  console.log(JSON.stringify(formattedResponse, null, 2));
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Proactive Intervention Test Complete\n');
  console.log('Summary:');
  console.log('• BehaviorMonitor: Tracks events, detects patterns, predicts churn/struggle');
  console.log('• CheckInScheduler: Creates proactive check-ins for struggling users');
  console.log('• MultiSessionPlanTracker: Tracks learning progress across sessions');
  console.log('• All components integrated into unified SAM route');
  console.log('');
}

testProactiveInterventions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
