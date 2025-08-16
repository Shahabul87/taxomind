#!/bin/bash

echo "🔧 Fixing build errors in API files..."

# Find all files with malformed exports and fix them
find app/api -name "*.ts" -exec grep -l "iexport\|export const.*from" {} \; | while read file; do
    echo "Fixing: $file"
    
    # Add missing import if not present
    if ! grep -q "import { withAuth" "$file"; then
        # Add the import after the last import line
        sed -i.bak '/^import/{ N; /\nimport/b; s/$/\nimport { withAuth } from '\''@\/lib\/api\/with-api-auth'\'';/; }' "$file"
    fi
    
    # Fix malformed iexport
    sed -i.bak 's/iexport const/export const/g' "$file"
    
    # Fix malformed export...from pattern
    sed -i.bak 's/export const \([^=]*\) = \([^}]*\)}\);\s*from.*/export const \1 = \2});/g' "$file"
    
    # Remove backup file
    rm -f "$file.bak"
done

echo "✅ Build error fixes completed!"