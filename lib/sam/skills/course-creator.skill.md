# Course Creator Skill

## What It Does
Creates complete courses with AI-generated chapters, sections, and learning objectives.
Each course is pedagogically aligned to Bloom's taxonomy with progressive cognitive complexity.

## When to Use
- User wants to create a new course or curriculum
- User asks to build educational content
- User needs a course outline or structure
- User mentions creating lessons, modules, or learning paths for a subject

## Capabilities
- Generate 3-15 chapters with learning objectives
- Generate sections per chapter with content types (video, reading, quiz, etc.)
- Enrich sections with detailed descriptions, activities, and resources
- Quality scoring with retry on low scores (<60)
- Bloom's taxonomy progression (REMEMBER through CREATE)
- Concept tracking for curriculum coherence

## Required Information
1. Course name
2. Subject area
3. Target audience (beginners, professionals, students, career changers)
4. Difficulty level (beginner / intermediate / advanced / expert)
5. Bloom's taxonomy focus (which cognitive levels to target)
6. Number of chapters (3-15)
7. Preferred content types (video, reading, assignment, quiz, project, discussion)

## Output
- Course record with chapters and sections saved to database
- Each chapter: title, description, Bloom's level, learning objectives, key topics
- Each section: title, content type, learning objectives, activity, resources
- Quality scores for every generated item
- SAM Goal and ExecutionPlan tracking the creation process
