#!/bin/bash

# Fix isTeacher reference error in all files
FILES=(
  "app/api/sections/generate-content/route.ts"
  "app/api/sections/analyze-content/route.ts"
  "app/api/courses/generate-chapter-content/route.ts"
  "app/api/courses/[courseId]/predictions/route.ts"
  "app/api/courses/[courseId]/cognitive-assessment/route.ts"
  "app/api/courses/[courseId]/analytics/route.ts"
  "app/api/courses/generate-blueprint-stream/route.ts"
  "app/api/courses/generate-blueprint/route.ts"
  "app/api/courses/route.ts"
)

for file in "${FILES[@]}"; do
  echo "Fixing $file..."
  # Replace !isTeacher with !dbUser?.isTeacher
  sed -i '' 's/userRole !== '\''ADMIN'\'' && !isTeacher)/userRole !== '\''ADMIN'\'' && !dbUser?.isTeacher)/g' "$file"
done

echo "All files fixed!"