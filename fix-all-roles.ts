import fs from 'fs';
import path from 'path';

const filesToFix = [
  'app/api/courses/[courseId]/analytics/report/route.ts',
  'app/api/courses/[courseId]/analytics/route.ts',
  'app/api/courses/[courseId]/cognitive-assessment/route.ts',
  'app/api/courses/[courseId]/predictions/route.ts',
  'app/api/courses/generate-blueprint-stream/route.ts',
  'app/api/courses/generate-blueprint/route.ts',
  'app/api/courses/generate-chapter-content/route.ts',
  'app/api/sam/conversations/[conversationId]/route.ts',
  'app/api/sections/analyze-content/route.ts',
  'app/api/sections/generate-content/route.ts',
  'app/api/test-auth/route.ts',
  'components/auth/enhanced-role-guard.tsx',
  'components/auth/role-guard.tsx',
  'components/mobile/mobile-navigation.tsx',
  'components/sam/sam-global-provider.tsx',
  'hooks/use-permissions.ts',
  'lib/api-protection.ts',
  'lib/auth/permissions.ts',
  'lib/content-versioning.ts',
  'lib/middleware/role-guard.ts',
  'lib/role-management.ts',
];

const replacements = [
  // Role comparisons
  { from: /role === ['"]TEACHER['"]/g, to: 'isTeacher === true' },
  { from: /role !== ['"]TEACHER['"]/g, to: '!isTeacher' },
  { from: /userRole === ['"]TEACHER['"]/g, to: 'isTeacher === true' },
  { from: /userRole !== ['"]TEACHER['"]/g, to: '!isTeacher' },
  
  // UserRole enum references
  { from: /UserRole\.TEACHER/g, to: 'UserRole.USER' },
  { from: /UserRole\.STUDENT/g, to: 'UserRole.USER' },
  { from: /UserRole\.LEARNER/g, to: 'UserRole.USER' },
  { from: /UserRole\.INSTRUCTOR/g, to: 'UserRole.USER' },
  
  // String literals
  { from: /['"]TEACHER['"]/g, to: '"USER"' },
  { from: /['"]STUDENT['"]/g, to: '"USER"' },
  { from: /['"]LEARNER['"]/g, to: '"USER"' },
  { from: /['"]INSTRUCTOR['"]/g, to: '"USER"' },
  
  // PrismaUserRole references
  { from: /PrismaUserRole\.TEACHER/g, to: 'PrismaUserRole.USER' },
  { from: /PrismaUserRole\.STUDENT/g, to: 'PrismaUserRole.USER' },
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Done!');