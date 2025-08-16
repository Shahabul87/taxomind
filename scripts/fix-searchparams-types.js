#!/usr/bin/env node

/**
 * Script to fix searchParams.get() null to undefined conversion issues
 * Adds || undefined to searchParams.get() calls that don't already have it
 */

const fs = require('fs');
const path = require('path');

// Files to fix based on the grep search results
const filesToFix = [
  // First batch
  'app/api/analytics/events/route-with-redis.ts',
  'app/api/analytics/struggle-detection/route.ts',
  'app/api/analytics/enhanced/route.ts',
  'app/api/debug-course-simple/route.ts',
  'app/api/fetch-video-metadata/route.ts',
  'app/api/analytics/study-schedule/route.ts',
  'app/api/tasks/route.ts',
  'app/api/collaboration/session/route.ts',
  'app/api/progress/sessions/route.ts',
  'app/api/collaboration/message/route.ts',
  'app/api/progress/alerts/route.ts',
  'app/api/collaboration/breakout-room/route.ts',
  'app/api/minds/route.ts',
  'app/api/posts/similar/route.ts',
  'app/api/progress/metrics/route.ts',
  'app/api/calendar/route.ts',
  'app/api/calendar/search/route.ts',
  'app/api/sam/collaboration-analytics/route.ts',
  'app/api/sam/course-guide/route.ts',
  'app/api/sam/course-market-analysis/competitors/route.ts',
  'app/api/sam/course-market-analysis/route.ts',
  'app/api/sam/ai-trends/route-secure.ts',
  'app/api/sam/multimedia-analysis/route.ts',
  'app/api/sam/chat-enhanced/route.ts',
  'app/api/sam/resource-intelligence/route.ts',
  // Second batch - additional files found
  'app/api/analytics/realtime/route.ts',
  'app/api/ideas/route.ts',
  'app/api/analytics/dashboard/route.ts',
  'app/api/fetch-article-metadata/route.ts',
  'app/api/activities/user/[userId]/route.ts',
  'app/api/analytics/recommendations/route.ts',
  'app/api/fetch-blog-metadata/route.ts',
  'app/api/templates/analytics/route.ts',
  'app/api/templates/categories/route.ts',
  'app/api/analytics/real-time/activities/route.ts',
  'app/api/social/accounts/check/route.ts',
  'app/api/templates/export/route.ts',
  'app/api/templates/route.ts',
  'app/api/enterprise/organizations/route.ts',
  'app/api/analytics/real-time/alerts/route.ts',
  'app/api/analytics/predict-completion/route.ts',
  'app/api/analytics/video-analytics/route.ts',
  'app/api/fetch-audio-metadata/route.ts',
  'app/api/dashboard/user/analytics/route.ts',
  'app/api/analytics/enterprise/route.ts',
  'app/api/cron/task-reminders/route.ts',
  'app/api/analytics/real-time/metrics/route.ts',
  'app/api/dashboard/user/activity/route.ts',
  'app/api/analytics/learning-velocity/route.ts',
  'app/api/analytics/websocket/route.ts',
  'app/api/analytics/student/route.ts',
  'app/api/analytics/at-risk-students/route.ts',
  'app/api/error-management/errors/route.ts',
];

const projectRoot = path.join(__dirname, '..');

filesToFix.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Pattern to match searchParams.get() without || undefined or || operator
  // This regex matches lines where searchParams.get() is followed by semicolon without || operator
  const pattern = /(const\s+\w+\s*=\s*searchParams\.get\([^)]+\))(?!\s*\|\|)(\s*;)/g;
  
  const newContent = content.replace(pattern, (match, group1, group2) => {
    modified = true;
    return `${group1} || undefined${group2}`;
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
});

console.log('\n✨ searchParams type fixes completed!');