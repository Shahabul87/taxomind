#!/bin/bash

echo "🔄 Smart Rollback Strategy for API Files"
echo "========================================="

# Create backup of current state
echo "📦 Creating backup of current state..."
cp -r app/api app/api.corrupted.backup

# Get list of all TypeScript compilation errors
echo "🔍 Identifying corrupted files..."
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | cut -d: -f1 | sort -u > corrupted-files.txt

# Count corrupted files
CORRUPTED_COUNT=$(wc -l < corrupted-files.txt)
echo "Found $CORRUPTED_COUNT corrupted files"

# For each corrupted file, restore from git
echo "🔧 Restoring files from last working commit..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        echo "Restoring: $file"
        # Get the file from before the corruption (5 commits ago)
        git show HEAD~5:"$file" > "$file" 2>/dev/null || echo "  ⚠️  Could not restore $file"
    fi
done < corrupted-files.txt

echo "✅ Restoration complete!"
echo ""
echo "📊 Summary:"
echo "- Corrupted files found: $CORRUPTED_COUNT"
echo "- Backup created at: app/api.corrupted.backup"
echo "- Files restored from: HEAD~5"
echo ""
echo "🔍 Verifying build..."
npm run build 2>&1 | grep -E "Successfully|Failed|error TS" | head -10