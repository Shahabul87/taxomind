#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Mass fixing corrupted API files...');

// Find all TypeScript files in app/api directory
const findTsFiles = (dir) => {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

const apiDir = '/Users/mdshahabulalam/myprojects/alam-lms/alam-lms/app/api';
const tsFiles = findTsFiles(apiDir);

console.log(`Found ${tsFiles.length} TypeScript files in API directory`);

let fixedCount = 0;

for (const filePath of tsFiles) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix 1: Remove malformed export...from pattern
    content = content.replace(/export const [A-Z_]+ = withAuth\(async \(request, context\) => \{\s*\}, \{\s*rateLimit: \{[^}]+\},\s*auditLog: [^}]+\}\); from ['"][^'"]+['"];?/g, '');
    
    // Fix 2: Add missing withAuth import if references exist but import is missing
    if (content.includes('withAuth') && !content.includes("import { withAuth }") && !content.includes("import {") && !content.includes("withAuth")) {
      const importMatch = content.match(/^(import[^;]+;)\s*$/m);
      if (importMatch) {
        const lastImportIndex = content.lastIndexOf(importMatch[0]);
        const afterLastImport = lastImportIndex + importMatch[0].length;
        content = content.slice(0, afterLastImport) + "\nimport { withAuth } from '@/lib/api/with-api-auth';" + content.slice(afterLastImport);
      }
    }
    
    // Fix 3: Fix broken function declarations
    content = content.replace(/NextResexport const/g, 'NextResponse.json(\n      { error: "Internal error" },\n      { status: 500 }\n    );\n  } catch (error: any) {\n    logger.error("API error:", error);\n    return NextResponse.json(\n      { error: "Internal error" },\n      { status: 500 }\n    );\n  }\n}\n\nexport const');
    
    content = content.replace(/Nextexport const/g, 'NextResponse.json(\n      { error: "Internal error" },\n      { status: 500 }\n    );\n  } catch (error: any) {\n    logger.error("API error:", error);\n    return NextResponse.json(\n      { error: "Internal error" },\n      { status: 500 }\n    );\n  }\n}\n\nexport const');
    
    // Fix 4: Remove any remaining malformed "iexport" 
    content = content.replace(/iexport const/g, 'export const');
    
    // Fix 5: Fix malformed import statements that got corrupted
    content = content.replace(/import \{ withAuth[^}]+\} from ['"][^'"]+['"]; from ['"][^'"]+['"];/g, "import { withAuth } from '@/lib/api/with-api-auth';");
    
    // Fix 6: Fix unterminated strings by adding closing quotes
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Count quotes in the line
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      
      // If odd number of quotes, likely unterminated
      if (singleQuotes % 2 === 1 && line.includes('error:')) {
        lines[i] = line + "'";
      }
      if (doubleQuotes % 2 === 1 && line.includes('error:')) {
        lines[i] = line + '"';
      }
    }
    content = lines.join('\n');
    
    // If content changed, write it back
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      console.log(`✅ Fixed: ${filePath}`);
    }
    
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files!`);
console.log('🔍 Running build test...');

// Try a quick syntax check
try {
  execSync('npx tsc --noEmit --skipLibCheck', { 
    cwd: '/Users/mdshahabulalam/myprojects/alam-lms/alam-lms',
    stdio: 'pipe'
  });
  console.log('✅ TypeScript syntax check passed!');
} catch (error) {
  console.log('❌ TypeScript syntax check still has errors');
  console.log('First few errors:');
  console.log(error.stdout?.toString().split('\n').slice(0, 10).join('\n'));
}