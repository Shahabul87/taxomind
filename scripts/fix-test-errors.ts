#!/usr/bin/env ts-node

/**
 * Script to fix common test TypeScript errors
 */

import * as fs from 'fs';
import * as path from 'path';

const fixSettingsTest = () => {
  const filePath = path.join(__dirname, '../__tests__/actions/settings.test.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix all settings calls to include role parameter
  const patterns = [
    {
      from: /await settings\(\{\s*name: 'New Name',\s*\}\)/g,
      to: `await settings({\n      name: 'New Name',\n      role: 'USER',\n    })`
    },
    {
      from: /await settings\(\{\s*email: 'newemail@example\.com',\s*\}\)/g,
      to: `await settings({\n      email: 'newemail@example.com',\n      role: 'USER',\n    })`
    },
    {
      from: /await settings\(\{\s*password: 'newPassword123',\s*newPassword: 'newPassword123',\s*\}\)/g,
      to: `await settings({\n      password: 'newPassword123',\n      newPassword: 'newPassword123',\n      role: 'USER',\n    })`
    },
    {
      from: /await settings\(\{\s*password: 'wrongPassword',\s*newPassword: 'newPassword123',\s*\}\)/g,
      to: `await settings({\n      password: 'wrongPassword',\n      newPassword: 'newPassword123',\n      role: 'USER',\n    })`
    },
    {
      from: /await settings\(\{\s*isTwoFactorEnabled: true,\s*\}\)/g,
      to: `await settings({\n      isTwoFactorEnabled: true,\n      role: 'USER',\n    })`
    },
    {
      from: /await settings\(\{\s*password: undefined,\s*newPassword: 'newPassword123',\s*\}\)/g,
      to: `await settings({\n      password: undefined,\n      newPassword: 'newPassword123',\n      role: 'USER',\n    })`
    },
    {
      from: /await settings\(\{\s*name: 'Updated Name',\s*\}\)/g,
      to: `await settings({\n      name: 'Updated Name',\n      role: 'USER',\n    })`
    },
    {
      from: /await settings\(\{\s*name: 'New Name',\s*isTwoFactorEnabled: true,\s*\}\)/g,
      to: `await settings({\n      name: 'New Name',\n      isTwoFactorEnabled: true,\n      role: 'USER',\n    })`
    },
    {
      from: /await settings\(\{\s*newPassword: 'newPassword123',\s*\}\)/g,
      to: `await settings({\n      newPassword: 'newPassword123',\n      role: 'USER',\n    })`
    }
  ];
  
  patterns.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Fixed settings.test.ts');
};

const fixChapterTest = () => {
  const filePath = path.join(__dirname, '../__tests__/api/chapters.test.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠ chapters.test.ts not found');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix POST import if needed
  if (content.includes("import { POST }")) {
    content = content.replace(
      "import { POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/publish/route'",
      "import { PATCH as POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/publish/route'"
    );
  }
  
  // Fix params structure
  content = content.replace(
    /params: Promise<\{ courseId: string; chapterId: string; \}>/g,
    'params: { courseId: string; chapterId: string; }'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Fixed chapters.test.ts');
};

const main = () => {
  console.log('Fixing test TypeScript errors...\n');
  
  try {
    fixSettingsTest();
    fixChapterTest();
    
    console.log('\n✅ Test fixes applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npx tsc --noEmit to verify TypeScript errors are reduced');
    console.log('2. Run: npm test to verify tests pass');
  } catch (error) {
    console.error('Error fixing tests:', error);
    process.exit(1);
  }
};

main();