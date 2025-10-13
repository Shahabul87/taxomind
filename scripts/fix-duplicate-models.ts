#!/usr/bin/env tsx
/**
 * Fix Duplicate Models in Merged Schema
 *
 * Removes duplicate model definitions from the merged schema that were
 * already present in the original monolithic schema.
 */

import fs from 'fs';
import path from 'path';

function fixDuplicates() {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const lines = content.split('\n');

  console.log('🔧 Fixing duplicate models in schema...\n');

  // Track which models we've seen
  const seenModels = new Set<string>();
  const duplicateRanges: Array<{ start: number; end: number; name: string }> = [];

  let currentModel: { start: number; name: string } | null = null;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('model ')) {
      const modelName = trimmed.match(/model\s+(\w+)/)?.[1];
      if (modelName) {
        if (seenModels.has(modelName)) {
          // This is a duplicate!
          currentModel = { start: i, name: modelName };
          braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
          console.log(`⚠️  Found duplicate: ${modelName} at line ${i + 1}`);
        } else {
          seenModels.add(modelName);
          currentModel = null;
        }
      }
    } else if (currentModel) {
      // We're inside a duplicate model
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

      if (braceCount === 0) {
        // End of duplicate model
        duplicateRanges.push({
          start: currentModel.start,
          end: i,
          name: currentModel.name,
        });
        console.log(`   Removing lines ${currentModel.start + 1}-${i + 1}`);
        currentModel = null;
      }
    }
  }

  if (duplicateRanges.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  // Remove duplicates by creating a new array without those lines
  let cleanedLines: string[] = [];
  let currentLine = 0;

  for (const range of duplicateRanges.sort((a, b) => a.start - b.start)) {
    // Add lines before this duplicate
    cleanedLines.push(...lines.slice(currentLine, range.start));
    // Skip the duplicate
    currentLine = range.end + 1;
  }

  // Add remaining lines
  cleanedLines.push(...lines.slice(currentLine));

  // Write back
  fs.writeFileSync(schemaPath, cleanedLines.join('\n'));

  console.log(`\n✅ Removed ${duplicateRanges.length} duplicate models:`);
  duplicateRanges.forEach(r => console.log(`   - ${r.name}`));
  console.log(`\n📝 Schema cleaned and saved!`);
}

if (require.main === module) {
  try {
    fixDuplicates();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

export { fixDuplicates };
