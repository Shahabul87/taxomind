#!/bin/bash

echo "🔧 Simple fix for corrupted API files..."

# List of files to fix
FILES=(
"/Users/mdshahabulalam/myprojects/alam-lms/alam-lms/app/api/sam/personalization/route.ts"
"/Users/mdshahabulalam/myprojects/alam-lms/alam-lms/app/api/sam/innovation-features/route.ts"
"/Users/mdshahabulalam/myprojects/alam-lms/alam-lms/app/api/sam/interactions/route.ts"
"/Users/mdshahabulalam/myprojects/alam-lms/alam-lms/app/api/activities/route.ts"
)

# Fix each file
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Fixing: $file"
        
        # Simple regex to remove the malformed pattern
        sed -i.bak 's/}); from.*with-api-auth.*;//g' "$file"
        
        # Add missing import if needed
        if ! grep -q "import { withAuth" "$file"; then
            sed -i.bak '1a\
import { withAuth } from '"'"'@/lib/api/with-api-auth'"'"';
' "$file"
        fi
    fi
done

echo "✅ Simple fixes applied!"