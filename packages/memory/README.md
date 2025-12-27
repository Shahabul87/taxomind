# @sam-ai/memory

Student memory system for SAM AI Tutor. Tracks mastery levels, learning pathways, and implements spaced repetition.

## Installation

```bash
npm install @sam-ai/memory
```

## Usage

```typescript
import {
  StudentProfileStore,
  MasteryTracker,
  PathwayCalculator,
  SpacedRepetitionScheduler
} from '@sam-ai/memory';

// Track student mastery
const tracker = new MasteryTracker();
await tracker.updateMastery('student-123', 'course-456', {
  conceptId: 'algebra-basics',
  level: 'UNDERSTAND',
  score: 0.85
});

// Calculate learning pathway
const calculator = new PathwayCalculator();
const pathway = await calculator.calculatePath('student-123', 'course-456');

// Schedule reviews with spaced repetition
const scheduler = new SpacedRepetitionScheduler();
const reviews = await scheduler.getUpcomingReviews('student-123');
```

## Features

- **Student Profile Store**: Persistent storage for student learning data
- **Mastery Tracker**: Track concept mastery across Bloom's levels
- **Pathway Calculator**: Calculate optimal learning pathways
- **Spaced Repetition**: SM-2 algorithm for review scheduling

## API

### `StudentProfileStore`

Stores and retrieves student learning profiles.

### `MasteryTracker`

Tracks and updates concept mastery levels.

### `PathwayCalculator`

Calculates personalized learning pathways.

### `SpacedRepetitionScheduler`

Implements spaced repetition scheduling.

## License

MIT
