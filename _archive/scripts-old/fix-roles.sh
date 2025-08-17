#!/bin/bash

# Fix API routes that check for TEACHER role
echo "Fixing API routes..."

# Fix courses API routes
files=(
  "app/api/courses/[courseId]/analytics/report/route.ts"
  "app/api/courses/[courseId]/analytics/route.ts"
  "app/api/courses/[courseId]/cognitive-assessment/route.ts"
  "app/api/courses/[courseId]/predictions/route.ts"
  "app/api/courses/generate-blueprint-stream/route.ts"
  "app/api/courses/generate-blueprint/route.ts"
  "app/api/courses/generate-chapter-content/route.ts"
  "app/api/courses/route.ts"
  "app/api/sections/analyze-content/route.ts"
  "app/api/sections/generate-content/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Replace role checks
    sed -i '' "s/role === 'TEACHER'/isTeacher === true/g" "$file"
    sed -i '' "s/role === \"TEACHER\"/isTeacher === true/g" "$file"
    sed -i '' "s/role !== 'TEACHER'/!isTeacher/g" "$file"
    sed -i '' "s/role !== \"TEACHER\"/!isTeacher/g" "$file"
    sed -i '' "s/'TEACHER'/'USER'/g" "$file"
    sed -i '' "s/\"TEACHER\"/\"USER\"/g" "$file"
    sed -i '' "s/'STUDENT'/'USER'/g" "$file"
    sed -i '' "s/\"STUDENT\"/\"USER\"/g" "$file"
    sed -i '' "s/'LEARNER'/'USER'/g" "$file"
    sed -i '' "s/\"LEARNER\"/\"USER\"/g" "$file"
    sed -i '' "s/'INSTRUCTOR'/'USER'/g" "$file"
    sed -i '' "s/\"INSTRUCTOR\"/\"USER\"/g" "$file"
  fi
done

echo "Done!"