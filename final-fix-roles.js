const fs = require('fs');
const path = require('path');

// List of all files that need fixing
const filesToFix = [
  'app/test-auth-roles/page.tsx',
  'app/dashboard/user/_components/UserDashboard.tsx',
  'app/(protected)/settings/private-details.tsx',
  'app/(protected)/settings/private-details-for-profile.tsx',
  'app/(protected)/teacher/courses/_components/courses-dashboard.tsx',
  'app/api/sam/content-generation/route.ts',
  'app/api/sam/predictive-learning/route.ts',
  'app/api/sam/course-assistant/route.ts',
  'app/api/sam/gamification/achievements/route.ts',
  'schemas/index.ts',
  'components/ui/intelligent-onboarding.tsx',
  'components/header/taxomind-header.tsx',
  'hooks/use-intelligent-onboarding.ts',
  'scripts/dev-seed.ts',
  'scripts/migrate-auth.ts'
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let originalContent = content;
  
  // Fix role comparisons
  content = content.replace(/role === ['"]STUDENT['"]/g, "role === 'USER'");
  content = content.replace(/role === ['"]TEACHER['"]/g, "isTeacher === true");
  content = content.replace(/role === ['"]INSTRUCTOR['"]/g, "isTeacher === true");
  content = content.replace(/role === ['"]LEARNER['"]/g, "role === 'USER'");
  
  content = content.replace(/role !== ['"]STUDENT['"]/g, "role !== 'USER'");
  content = content.replace(/role !== ['"]TEACHER['"]/g, "!isTeacher");
  content = content.replace(/role !== ['"]INSTRUCTOR['"]/g, "!isTeacher");
  content = content.replace(/role !== ['"]LEARNER['"]/g, "role !== 'USER'");
  
  // Fix role assignments
  content = content.replace(/userRole: ["']TEACHER["']/g, 'userRole: "USER"');
  content = content.replace(/userRole: ["']STUDENT["']/g, 'userRole: "USER"');
  content = content.replace(/userRole: ["']INSTRUCTOR["']/g, 'userRole: "USER"');
  content = content.replace(/userRole: ["']LEARNER["']/g, 'userRole: "USER"');
  
  content = content.replace(/role: ["']TEACHER["']/g, 'role: "USER", isTeacher: true');
  content = content.replace(/role: ["']STUDENT["']/g, 'role: "USER"');
  content = content.replace(/role: ["']INSTRUCTOR["']/g, 'role: "USER", isTeacher: true');
  content = content.replace(/role: ["']LEARNER["']/g, 'role: "USER"');
  
  // Fix type definitions
  content = content.replace(/"TEACHER" \| "STUDENT" \| "ADMIN"/g, '"USER" | "ADMIN"');
  content = content.replace(/"STUDENT" \| "TEACHER" \| "ADMIN"/g, '"USER" | "ADMIN"');
  
  // Fix case statements
  content = content.replace(/case ["']TEACHER["']:/g, 'case "USER":');
  content = content.replace(/case ["']STUDENT["']:/g, 'case "USER":');
  content = content.replace(/case ["']INSTRUCTOR["']:/g, 'case "USER":');
  content = content.replace(/case ["']LEARNER["']:/g, 'case "USER":');
  
  // Fix combined role checks
  content = content.replace(/user\?\.role !== "ADMIN" && user\?\.role !== "TEACHER" && user\?\.role !== "INSTRUCTOR"/g, 
    'user?.role !== "ADMIN" && !user?.isTeacher');
  content = content.replace(/\(user\?\.role === "TEACHER" \|\| user\?\.role === "INSTRUCTOR"\)/g, 
    'user?.isTeacher');
  content = content.replace(/session\.user\.role !== "TEACHER" && session\.user\.role !== "ADMIN"/g,
    'session.user.role !== "ADMIN" && !session.user.isTeacher');
  content = content.replace(/user\.role !== "TEACHER" && user\.role !== "ADMIN"/g,
    'user.role !== "ADMIN" && !user.isTeacher');
  
  // Fix z.enum schemas
  content = content.replace(/z\.enum\(\["ADMIN", "USER", "STUDENT", "TEACHER", "INSTRUCTOR", "LEARNER", "MODERATOR", "AFFILIATE"\]\)/g,
    'z.enum(["ADMIN", "USER"])');
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } else {
    console.log(`✓  No changes needed: ${filePath}`);
    return false;
  }
}

console.log('🔧 Starting final role reference fixes...\n');

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
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n=== Summary ===');
console.log(`✅ Files fixed: ${fixedCount}`);
console.log(`⚠️  Files not found: ${notFoundCount}`);
console.log(`✓  Files with no changes: ${noChangeCount}`);
console.log('\n✨ Done!');