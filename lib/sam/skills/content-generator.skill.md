# Content Generator

## What It Does
Generates course, chapter, and section content including descriptions,
learning objectives, chapter lists, and section lists with full Bloom's
taxonomy alignment and hierarchical context awareness.

## When to Use
- Teacher asks to generate a description for a course, chapter, or section
- Teacher wants AI-generated learning objectives
- Teacher requests chapter or section titles for their course
- Teacher asks to create or write content for any entity in the course hierarchy
- Any "Generate with AI" button action on edit pages

## Capabilities
- Description generation with engagement language and student-facing tone
- Learning objectives with Bloom's taxonomy action verbs
- Chapter list generation with progressive difficulty
- Section list generation with content type awareness
- Quality validation with scoring (0-100)
- Hierarchical context (course -> chapter -> section) for aligned content
- Advanced mode with audience, tone, creativity, and detail controls
- Tool invocation tracking and generation history

## Required Information
1. Content type (description, learningObjectives, chapters, sections, etc.)
2. Entity level (course, chapter, section)
3. Entity title
4. Context hierarchy (course/chapter/section details)

## Output
- Generated content string (HTML for descriptions/objectives, JSON array for chapters/sections)
- Quality score and feedback
- Generation metadata (provider, model, generation time)
- Persisted audit trail (AIContentGeneration + AgentToolInvocation records)
