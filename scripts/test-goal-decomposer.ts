/**
 * Test script to verify the GoalDecomposer works correctly
 */

import { createGoalDecomposer, type LearningGoal } from '../packages/agentic/src';
import { AnthropicAdapter } from '../packages/core/src/adapters/anthropic';

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Creating AnthropicAdapter...');
  const aiAdapter = new AnthropicAdapter({
    apiKey,
    model: 'claude-sonnet-4-20250514',
  });

  console.log('Creating GoalDecomposer...');
  const decomposer = createGoalDecomposer({
    aiAdapter,
    logger: console,
  });

  const testGoal: LearningGoal = {
    id: 'test-goal-1',
    userId: 'test-user',
    title: 'Learn Python for Data Science',
    description: 'Master Python programming for data analysis and machine learning',
    priority: 'MEDIUM',
    status: 'DRAFT',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('Testing goal decomposition...');
  console.log('Goal:', testGoal.title);

  try {
    const decomposition = await decomposer.decompose(testGoal, {
      maxSubGoals: 5,
      minSubGoals: 3,
      includeAssessments: true,
    });

    console.log('\n✅ Decomposition successful!');
    console.log('Sub-goals:', decomposition.subGoals.length);
    console.log('Estimated duration:', decomposition.estimatedDuration, 'minutes');
    console.log('Difficulty:', decomposition.difficulty);
    console.log('Confidence:', decomposition.confidence);

    console.log('\nSub-goals:');
    decomposition.subGoals.forEach((sg, i) => {
      console.log(`  ${i + 1}. ${sg.title} (${sg.type}, ${sg.estimatedMinutes}min, ${sg.difficulty})`);
    });
  } catch (error) {
    console.error('\n❌ Decomposition failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
