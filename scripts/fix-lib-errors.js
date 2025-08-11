#!/usr/bin/env node

/**
 * Script to fix common TypeScript errors in lib folder
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of incorrect to correct Prisma model names
const MODEL_REPLACEMENTS = {
  'db.studentInteraction': 'db.sAMInteraction',
  'db.learningMetric': 'db.learning_metrics',
  'db.analyticsEvent': '(db as any).analyticsEvent',
  'db.progress': 'db.user_progress',
  'Difficulty': 'QuestionDifficulty',
  'course:': 'Course:',
  '.course.': '.Course.',
  'enrollments:': 'Enrollment:',
  '.enrollments': '.Enrollment',
};

// Common type fixes
const TYPE_FIXES = {
  'catch(error =>': 'catch((error: any) =>',
  'catch(error)': 'catch((error: any))',
  '.filter(goal =>': '.filter((goal: any) =>',
  '.filter(e =>': '.filter((e: any) =>',
  '.map(item =>': '.map((item: any) =>',
  '.reduce((acc, item)': '.reduce((acc: any, item: any)',
};

async function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changeCount = 0;

  // Apply model replacements
  for (const [incorrect, correct] of Object.entries(MODEL_REPLACEMENTS)) {
    const regex = new RegExp(incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newContent = content.replace(regex, correct);
    if (newContent !== content) {
      changeCount++;
      content = newContent;
    }
  }

  // Apply type fixes
  for (const [incorrect, correct] of Object.entries(TYPE_FIXES)) {
    const regex = new RegExp(incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newContent = content.replace(regex, correct);
    if (newContent !== content) {
      changeCount++;
      content = newContent;
    }
  }

  // Fix error handling patterns
  content = content.replace(
    /} catch \(error\) {/g,
    '} catch (error: any) {'
  );

  // Fix implicit any in parameters
  content = content.replace(
    /\((\w+)\) =>/g,
    (match, param) => {
      // Only add type if it's a common parameter name that needs typing
      if (['error', 'event', 'data', 'alert', 'item', 'entry'].includes(param)) {
        return `(${param}: any) =>`;
      }
      return match;
    }
  );

  if (changeCount > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${changeCount} issues in ${path.relative(process.cwd(), filePath)}`);
  }

  return changeCount;
}

async function main() {
  console.log('Fixing TypeScript errors in lib folder...\n');

  const files = glob.sync('lib/**/*.ts', {
    ignore: ['lib/**/*.test.ts', 'lib/**/*.spec.ts']
  });

  let totalChanges = 0;
  for (const file of files) {
    const changes = await fixFile(file);
    totalChanges += changes;
  }

  console.log(`\nTotal fixes applied: ${totalChanges}`);
  console.log('\nNote: Some errors may require manual fixes.');
  console.log('Run "npm run build" to check remaining errors.');
}

main().catch(console.error);