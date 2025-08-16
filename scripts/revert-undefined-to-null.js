#!/usr/bin/env node

/**
 * Script to revert searchParams.get() || undefined back to just searchParams.get()
 * for files where functions expect string | null instead of string | undefined
 */

const fs = require('fs');
const path = require('path');

// Files where we should revert || undefined because functions expect null
const filesToRevert = [
  'app/api/analytics/dashboard/route.ts',
  'app/api/analytics/real-time/activities/route.ts',
  'app/api/analytics/real-time/alerts/route.ts',
  'app/api/analytics/real-time/metrics/route.ts',
  'app/api/analytics/predict-completion/route.ts',
  'app/api/analytics/video-analytics/route.ts',
  'app/api/analytics/recommendations/route.ts',
  'app/api/analytics/study-schedule/route.ts',
  'app/api/analytics/struggle-detection/route.ts',
  'app/api/analytics/enhanced/route.ts',
  'app/api/analytics/learning-velocity/route.ts',
  'app/api/analytics/at-risk-students/route.ts',
  'app/api/analytics/websocket/route.ts',
  'app/api/analytics/student/route.ts',
  'app/api/analytics/enterprise/route.ts',
  'app/api/dashboard/user/analytics/route.ts',
  'app/api/dashboard/user/activity/route.ts',
];

const projectRoot = path.join(__dirname, '..');

filesToRevert.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Pattern to match searchParams.get() || undefined
  const pattern = /(searchParams\.get\([^)]+\))\s*\|\|\s*undefined/g;
  
  const newContent = content.replace(pattern, (match, group1) => {
    modified = true;
    return group1;
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Reverted: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
});

console.log('\n✨ Revert completed! searchParams.get() now returns string | null as expected.');