# @sam-ai/adapter-prisma

Prisma database adapter for SAM AI Tutor. Connects SAM to any Prisma-supported database.

## Installation

```bash
npm install @sam-ai/adapter-prisma @sam-ai/core
```

## Usage

```typescript
import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dbAdapter = createPrismaSAMAdapter({ prisma });

// Use with SAM orchestrator
const config = createSAMConfig({
  database: dbAdapter,
  // ... other config
});
```

## Features

- Full SAMDatabaseAdapter implementation
- Student profile storage
- Memory/conversation persistence
- Review schedule tracking
- Golden test storage for calibration

## API

### `createPrismaSAMAdapter(config)`

Creates a Prisma-based database adapter.

### `createPrismaStudentProfileStore(config)`

Creates a student profile store.

### `createPrismaMemoryStore(config)`

Creates a memory/conversation store.

### `createPrismaReviewScheduleStore(config)`

Creates a spaced repetition schedule store.

## License

MIT
