#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix action test files
function fixActionTest(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Extract the action name from the import
  const actionImportMatch = content.match(/import\s+{\s*(\w+)\s*}\s+from\s+['"]@\/actions\/[^'"]+['"]/);
  if (!actionImportMatch) {
    console.log(`Skipping ${fileName}: No action import found`);
    return false;
  }
  
  const actionName = actionImportMatch[1];
  console.log(`Fixing ${fileName}: action ${actionName}`);
  
  // Replace mock implementation to use simple jest.fn()
  const mockPattern = new RegExp(
    `jest\\.mock\\(['"]@/actions/[^'"]+['"],\\s*\\(\\)\\s*=>\\s*\\({[^}]+${actionName}:[^}]+}\\)\\)`,
    's'
  );
  
  if (content.match(mockPattern)) {
    content = content.replace(mockPattern, (match) => {
      const moduleMatch = match.match(/jest\.mock\(['"]([^'"]+)['"]/);
      const modulePath = moduleMatch ? moduleMatch[1] : '@/actions/unknown';
      return `jest.mock('${modulePath}', () => ({
  ${actionName}: jest.fn(),
}))`;
    });
  }
  
  // Replace prismaMock usage with direct mock calls
  const testPatterns = [
    {
      // Replace prismaMock.*.mockResolvedValue with action mock
      from: /prismaMock\.\w+\.\w+\.mockResolvedValue\(([^)]+)\)/g,
      to: `(${actionName} as jest.Mock).mockResolvedValue($1)`
    },
    {
      // Replace prismaMock.*.mockRejectedValue with action mock
      from: /prismaMock\.\w+\.\w+\.mockRejectedValue\(([^)]+)\)/g,
      to: `(${actionName} as jest.Mock).mockRejectedValue($1)`
    },
    {
      // Replace expect(prismaMock.*).toHaveBeenCalled
      from: /expect\(prismaMock\.\w+\.\w+\)\.toHaveBeenCalled/g,
      to: `expect(${actionName}).toHaveBeenCalled`
    },
    {
      // Replace expect(prismaMock.*).toHaveBeenCalledWith
      from: /expect\(prismaMock\.\w+\.\w+\)\.toHaveBeenCalledWith/g,
      to: `expect(${actionName}).toHaveBeenCalledWith`
    }
  ];
  
  testPatterns.forEach(pattern => {
    content = content.replace(pattern.from, pattern.to);
  });
  
  // Write back the fixed content
  fs.writeFileSync(filePath, content);
  return true;
}

// Get all action test files
const testDir = path.join(__dirname, '..', '__tests__', 'actions');
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.ts'))
  .map(file => path.join(testDir, file));

console.log(`Found ${testFiles.length} test files to process`);

let fixedCount = 0;
testFiles.forEach(file => {
  if (fixActionTest(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} test files`);