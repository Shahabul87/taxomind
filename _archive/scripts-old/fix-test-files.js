const fs = require('fs');
const path = require('path');

// Fix test files
const testFiles = [
  '__tests__/api/courses.test.ts',
  '__tests__/utils/test-utils.tsx'
];

testFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    // Replace role references in test files
    content = content.replace(/role: ['"]TEACHER['"]/g, "role: 'USER', isTeacher: true");
    content = content.replace(/role: ['"]STUDENT['"]/g, "role: 'USER'");
    content = content.replace(/role: ['"]LEARNER['"]/g, "role: 'USER'");
    
    // Fix as const patterns
    content = content.replace(/['"]TEACHER['"] as const/g, "'USER' as const");
    content = content.replace(/['"]STUDENT['"] as const/g, "'USER' as const");
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Test files fixed!');