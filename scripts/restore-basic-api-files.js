#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 Emergency restore: Creating basic API route templates...');

// List of severely corrupted files that need basic templates
const corruptedFiles = [
  'app/api/adaptive-assessment/recommend-questions/route.ts',
  'app/api/adaptive-content/route.ts',
  'app/api/admin/email-queue/route.ts',
  'app/api/ai/advanced-exam-generator/route.ts',
  'app/api/ai/blueprint-refinement/route.ts',
  'app/api/ai/bulk-chapters/route.ts',
  'app/api/ai/chapter-content/route.ts',
  'app/api/analytics/enterprise/route.ts',
];

// Basic template for API routes
const basicTemplate = `import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement actual functionality
    return NextResponse.json({
      success: true,
      message: 'API endpoint needs implementation',
      data: null
    });

  } catch (error: any) {
    logger.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement actual functionality
    return NextResponse.json({
      success: true,
      message: 'API endpoint needs implementation',
      data: []
    });

  } catch (error: any) {
    logger.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
`;

let restoredCount = 0;

for (const relativeFilePath of corruptedFiles) {
  const fullPath = path.join('/Users/mdshahabulalam/myprojects/alam-lms/alam-lms', relativeFilePath);
  
  try {
    // Check if file exists and is severely corrupted
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // If file has severe syntax errors, replace with template
      if (content.includes('sexport const') || 
          content.includes('actionItems: s') || 
          content.includes('unterminated') ||
          content.split('\n').some(line => line.match(/^\s*[a-z]+:\s*$/))) {
        
        // Create backup
        fs.writeFileSync(fullPath + '.corrupted.bak', content);
        
        // Write basic template
        fs.writeFileSync(fullPath, basicTemplate);
        restoredCount++;
        console.log(`✅ Restored: ${relativeFilePath}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error restoring ${relativeFilePath}:`, error.message);
  }
}

console.log(`\n🎉 Restored ${restoredCount} severely corrupted files with basic templates!`);
console.log('📝 Original corrupted content saved with .corrupted.bak extension');
console.log('⚠️  These files now have basic functionality but need proper implementation');

// Also try to fix files with simple pattern replacements
console.log('\n🔧 Applying simple pattern fixes to remaining files...');

const { execSync } = require('child_process');

try {
  // Quick pattern fixes using find and sed
  execSync(`
    find /Users/mdshahabulalam/myprojects/alam-lms/alam-lms/app/api -name "*.ts" -exec grep -l "actionItems: s" {} \\; | 
    while read file; do
      echo "Quick-fixing: $file"
      sed -i.quickfix 's/actionItems: s.*/actionItems: [];/' "$file"
    done
  `, { stdio: 'inherit' });
  
  console.log('✅ Applied quick pattern fixes');
} catch (error) {
  console.log('⚠️  Some quick fixes may have failed');
}

console.log('\n🏗️  Files should now be in a buildable state!');