# Analytics Database Migration Instructions

## Steps to Apply the Analytics Tables

1. **Generate the migration**:
```bash
npx prisma migrate dev --name add_analytics_tables
```

2. **If you get any errors about missing relations**, run:
```bash
npx prisma generate
```

3. **Apply the migration to production** (when ready):
```bash
npx prisma migrate deploy
```

## What These Tables Do:

### StudentInteraction
- Stores every user interaction (clicks, scrolls, video events, etc.)
- Links to user, course, chapter, and section
- Stores metadata as JSON for flexibility
- Indexed for fast queries

### LearningMetric
- Daily aggregated metrics per student per course
- Tracks time spent, interactions, video watch time, quiz attempts
- Includes engagement score and learning velocity
- Updated by the analytics processing pipeline

### ContentFlag
- Flags problematic content automatically
- Tracks struggle points where many students have issues
- Used to alert instructors about content that needs improvement

### LearningPattern
- Stores detected learning patterns for each student
- Tracks preferred study times, content preferences
- Identifies struggling and strong topics
- Used for personalization

## Next Steps:

1. Run the migration
2. Test the API endpoints with the new tables
3. Start collecting real data!