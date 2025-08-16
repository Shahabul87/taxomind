#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧠 Intelligent API File Fixer');
console.log('==============================\n');

// Corruption patterns to detect and fix
const CORRUPTION_PATTERNS = [
  {
    name: 'Nested withAuth in catch block',
    detect: /catch\s*\([^)]*\)\s*{\s*export const.*withAuth/s,
    fix: (content) => {
      // Remove the corrupted withAuth insertion from catch blocks
      return content.replace(
        /catch\s*\(([^)]*)\)\s*{\s*export const.*?}\);.*?}\s*}/gs,
        'catch ($1) {\n    return NextResponse.json({ error: "Internal server error" }, { status: 500 });\n  }'
      );
    }
  },
  {
    name: 'Malformed export with trailing from',
    detect: /export const.*}\);\s*from\s*['"].*?['"];?/s,
    fix: (content) => {
      // Remove the malformed export pattern
      return content.replace(/export const.*?}\);\s*from\s*['"].*?['"];?/gs, '');
    }
  },
  {
    name: 'Duplicate function declarations',
    detect: /export async function (GET|POST|PUT|DELETE|PATCH).*?export async function \1/s,
    fix: (content) => {
      // Keep only the last (usually correct) function declaration
      const functions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      for (const func of functions) {
        const regex = new RegExp(`(export async function ${func}[^}]*})[\\s\\S]*?(export async function ${func})`, 'g');
        if (regex.test(content)) {
          // Find all occurrences
          const matches = content.match(new RegExp(`export async function ${func}[\\s\\S]*?^}`, 'gm'));
          if (matches && matches.length > 1) {
            // Keep the last one (usually the correct one)
            const lastMatch = matches[matches.length - 1];
            // Remove all occurrences first
            for (const match of matches) {
              content = content.replace(match, '');
            }
            // Add back the last one
            content += '\n\n' + lastMatch;
          }
        }
      }
      return content;
    }
  },
  {
    name: 'Unterminated string literals',
    detect: /['"][^'"]*$/gm,
    fix: (content) => {
      // Fix lines that end with an unclosed quote
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Count quotes
        const singleQuotes = (line.match(/'/g) || []).length;
        const doubleQuotes = (line.match(/"/g) || []).length;
        
        // If odd number of quotes and line doesn't end with escape
        if (singleQuotes % 2 === 1 && !line.endsWith("\\'")) {
          lines[i] = line + "'";
        }
        if (doubleQuotes % 2 === 1 && !line.endsWith('\\"')) {
          lines[i] = line + '"';
        }
      }
      return lines.join('\n');
    }
  },
  {
    name: 'Broken imports',
    detect: /import\s*{[^}]*}\s*from\s*['"][^'"]*['"];\s*from/,
    fix: (content) => {
      // Remove duplicate 'from' statements
      return content.replace(/;\s*from\s*['"][^'"]*['"]/g, '');
    }
  }
];

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fixesApplied = [];

    // Apply each fix pattern
    for (const pattern of CORRUPTION_PATTERNS) {
      if (pattern.detect.test(content)) {
        content = pattern.fix(content);
        fixesApplied.push(pattern.name);
      }
    }

    // Ensure proper imports if withAuth is used
    if (content.includes('withAuth') && !content.includes("import { withAuth")) {
      // Add import at the top after other imports
      const importLine = "import { withAuth } from '@/lib/api/with-api-auth';";
      const lastImportMatch = content.match(/^import.*$/m);
      if (lastImportMatch) {
        const lastImportIndex = content.lastIndexOf(lastImportMatch[0]);
        content = content.slice(0, lastImportIndex + lastImportMatch[0].length) + 
                  '\n' + importLine + 
                  content.slice(lastImportIndex + lastImportMatch[0].length);
      } else {
        content = importLine + '\n\n' + content;
      }
      fixesApplied.push('Added missing withAuth import');
    }

    // Only write if changes were made
    if (content !== originalContent) {
      // Create backup
      fs.writeFileSync(filePath + '.prefixed.bak', originalContent);
      // Write fixed content
      fs.writeFileSync(filePath, content);
      return { success: true, fixes: fixesApplied };
    }

    return { success: false, reason: 'No fixes needed' };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

// Main execution
async function main() {
  // Get list of files with TypeScript errors
  console.log('🔍 Identifying files with TypeScript errors...');
  let errorFiles;
  try {
    const tscOutput = execSync('npx tsc --noEmit --skipLibCheck 2>&1', { encoding: 'utf8' });
    errorFiles = [...new Set(tscOutput.match(/app\/api\/[^:(]+\.ts/g) || [])];
  } catch (error) {
    // tsc returns non-zero exit code when there are errors, which is expected
    const output = error.stdout || error.output?.toString() || '';
    errorFiles = [...new Set(output.match(/app\/api\/[^:(]+\.ts/g) || [])];
  }

  console.log(`Found ${errorFiles.length} files with errors\n`);

  let successCount = 0;
  let failCount = 0;
  const results = [];

  // Process each file
  for (const file of errorFiles) {
    process.stdout.write(`Processing ${file}... `);
    const result = fixFile(file);
    
    if (result.success) {
      console.log(`✅ Fixed (${result.fixes.join(', ')})`);
      successCount++;
    } else {
      console.log(`⏭️  Skipped (${result.reason})`);
      failCount++;
    }
    
    results.push({ file, ...result });
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully fixed: ${successCount} files`);
  console.log(`⏭️  Skipped: ${failCount} files`);
  console.log(`📁 Backups created with .prefixed.bak extension`);

  // Test build
  console.log('\n🔨 Testing build...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful!');
  } catch (error) {
    const remainingErrors = (error.stdout?.toString() || '').split('\n').length;
    console.log(`⚠️  Still ${remainingErrors} errors remaining`);
    console.log('Run "npm run build" to see detailed errors');
  }

  return results;
}

// Run the fixer
main().catch(console.error);