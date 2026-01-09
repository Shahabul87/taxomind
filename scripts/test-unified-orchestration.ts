/**
 * Test Script: Unified API Orchestration
 * Makes a request to /api/sam/unified to test orchestration loop
 */

async function main() {
  console.log('🧪 Testing SAM Unified API with Orchestration...\n');

  // We need to authenticate first - let's use a session cookie
  // For testing, we'll make a direct request with the test user ID
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const testPayload = {
    message: 'Explain variables and data types in JavaScript. What are the differences between let, const, and var?',
    pageContext: {
      type: 'learning',
      path: '/learning',
    },
    // Orchestration will be auto-detected based on user's active plan
    orchestrationContext: {
      autoDetectPlan: true,
    },
  };

  console.log('📤 Request payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('');

  try {
    const response = await fetch(baseUrl + '/api/sam/unified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This won't work without proper auth cookie
        // For real testing, use the browser or a proper auth flow
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();

    console.log('📥 Response status:', response.status);
    console.log('');

    if (data.success) {
      console.log('✅ SUCCESS!');
      console.log('');

      // Check orchestration data
      if (data.insights?.orchestration) {
        console.log('🎯 ORCHESTRATION DATA:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Has Active Plan:', data.insights.orchestration.hasActivePlan);

        if (data.insights.orchestration.currentStep) {
          console.log('Current Step:', data.insights.orchestration.currentStep.title);
          console.log('Step Type:', data.insights.orchestration.currentStep.type);
          console.log('Step Objectives:', data.insights.orchestration.currentStep.objectives?.join(', '));
        }

        if (data.insights.orchestration.stepProgress) {
          console.log('Progress:', data.insights.orchestration.stepProgress.progressPercent + '%');
          console.log('Step Complete:', data.insights.orchestration.stepProgress.stepComplete);
          console.log('Confidence:', data.insights.orchestration.stepProgress.confidence);
          if (data.insights.orchestration.stepProgress.pendingCriteria?.length > 0) {
            console.log('Pending Criteria:', data.insights.orchestration.stepProgress.pendingCriteria.join(', '));
          }
        }

        if (data.insights.orchestration.transition) {
          console.log('');
          console.log('🎉 STEP TRANSITION:');
          console.log('Type:', data.insights.orchestration.transition.type);
          console.log('Message:', data.insights.orchestration.transition.message);
          console.log('Plan Complete:', data.insights.orchestration.transition.planComplete);
        }

        if (data.insights.orchestration.metadata) {
          console.log('');
          console.log('📊 Metadata:');
          console.log('Processing Time:', data.insights.orchestration.metadata.processingTime + 'ms');
          console.log('Step Advanced:', data.insights.orchestration.metadata.stepAdvanced);
          console.log('Interventions Triggered:', data.insights.orchestration.metadata.interventionsTriggered);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else {
        console.log('⚠️ No orchestration data in response');
        console.log('Check if user has an active plan and is authenticated');
      }

      console.log('');
      console.log('📝 Subsystems Active:');
      if (data.metadata?.subsystems) {
        console.log('  - Tutoring Orchestration:', data.metadata.subsystems.tutoringOrchestration);
        console.log('  - Tutoring Context:', data.metadata.subsystems.tutoringContext);
        console.log('  - Step Evaluation:', data.metadata.subsystems.stepEvaluation);
        console.log('  - Step Transition:', data.metadata.subsystems.stepTransition);
        console.log('  - Plan Context Injection:', data.metadata.subsystems.planContextInjection);
      }

      console.log('');
      console.log('💬 Response Preview:');
      console.log(data.response?.substring(0, 500) + '...');
    } else {
      console.log('❌ FAILED');
      console.log('Error:', data.error || data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    console.log('');
    console.log('Note: This test requires:');
    console.log('1. Dev server running on port 3000');
    console.log('2. Valid authentication (session cookie)');
    console.log('');
    console.log('To test properly, use the browser:');
    console.log('1. Log in to the app');
    console.log('2. Open SAM chat');
    console.log('3. Ask about the current step topic');
    console.log('4. Check browser console for orchestration data');
  }
}

main();
