const fs = require('fs');
const path = require('path');

// List of files that need fixing
const filesToFix = [
  'app/api/courses/[courseId]/analytics/report/route.ts',
  'app/api/courses/[courseId]/analytics/route.ts',
  'app/api/courses/[courseId]/cognitive-assessment/route.ts',
  'app/api/courses/[courseId]/predictions/route.ts',
  'app/api/courses/generate-chapter-content/route.ts',
  'app/api/sam/conversations/[conversationId]/route.ts',
  'app/api/sections/analyze-content/route.ts',
  'app/api/sections/generate-content/route.ts',
  'app/api/test-auth/route.ts',
  'app/test-auth-roles/page.tsx',
  'app/(protected)/content-governance/dashboard/_components/workflow-templates.tsx',
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
  'lib/swagger.ts',
  '__tests__/api/courses.test.ts',
  '__tests__/utils/test-utils.tsx',
  'packages/sam-engine/src/sam-engine.ts',
  'packages/sam-engine/src/types.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let originalContent = content;
  
  // Fix role comparisons in API routes
  content = content.replace(/role !== ['"]TEACHER['"] && role !== ['"]ADMIN['"]/g, 
    "role !== 'ADMIN' && !isTeacher");
  content = content.replace(/userRole !== ['"]TEACHER['"] && userRole !== ['"]ADMIN['"]/g, 
    "userRole !== 'ADMIN' && !isTeacher");
  content = content.replace(/role === ['"]TEACHER['"]/g, "isTeacher === true");
  content = content.replace(/role !== ['"]TEACHER['"]/g, "!isTeacher");
  content = content.replace(/userRole === ['"]TEACHER['"]/g, "isTeacher === true");
  content = content.replace(/userRole !== ['"]TEACHER['"]/g, "!isTeacher");
  
  // Fix UserRole enum references
  content = content.replace(/UserRole\.TEACHER/g, "UserRole.USER");
  content = content.replace(/UserRole\.STUDENT/g, "UserRole.USER");
  content = content.replace(/UserRole\.LEARNER/g, "UserRole.USER");
  content = content.replace(/UserRole\.INSTRUCTOR/g, "UserRole.USER");
  
  // Fix PrismaUserRole references
  content = content.replace(/PrismaUserRole\.TEACHER/g, "PrismaUserRole.USER");
  content = content.replace(/PrismaUserRole\.STUDENT/g, "PrismaUserRole.USER");
  content = content.replace(/PrismaUserRole\.LEARNER/g, "PrismaUserRole.USER");
  content = content.replace(/PrismaUserRole\.INSTRUCTOR/g, "PrismaUserRole.USER");
  
  // Fix string role checks
  content = content.replace(/['"]TEACHER['"] \|\| ['"]ADMIN['"]/g, "'ADMIN'");
  content = content.replace(/['"]STUDENT['"] \|\| ['"]TEACHER['"]/g, "'USER'");
  
  // Add isTeacher to database queries where needed
  content = content.replace(/select: { id: true, email: true, role: true }/g, 
    "select: { id: true, email: true, role: true, isTeacher: true }");
  
  // Fix standalone string literals (but not in error messages)
  content = content.replace(/case ['"]TEACHER['"]/g, "case 'USER'");
  content = content.replace(/case ['"]STUDENT['"]/g, "case 'USER'");
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  } else {
    console.log(`- No changes needed: ${filePath}`);
    return false;
  }
}

console.log('Starting batch fix for role references...\n');

let fixedCount = 0;
let notFoundCount = 0;
let noChangeCount = 0;

filesToFix.forEach(file => {
  try {
    const result = fixFile(file);
    if (result === true) fixedCount++;
    else if (result === false) notFoundCount++;
    else noChangeCount++;
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
});

console.log('\n=== Summary ===');
console.log(`Files fixed: ${fixedCount}`);
console.log(`Files not found: ${notFoundCount}`);
console.log(`Files with no changes: ${noChangeCount}`);
console.log('\nDone!');