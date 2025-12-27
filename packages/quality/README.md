# @sam-ai/quality

Content quality validation pipeline for SAM AI Tutor. Ensures AI-generated educational content meets quality standards.

## Installation

```bash
npm install @sam-ai/quality @sam-ai/core
```

## Usage

```typescript
import {
  ContentQualityPipeline,
  createContentQualityPipeline
} from '@sam-ai/quality';

const pipeline = createContentQualityPipeline({
  targetLevel: 'UNDERSTAND',
  strictMode: false
});

const result = await pipeline.validate({
  type: 'explanation',
  content: 'Your AI-generated content...',
  targetBloomsLevel: 'UNDERSTAND'
});

if (result.passed) {
  console.log('Content meets quality standards');
} else {
  console.log('Issues:', result.issues);
}
```

## Quality Gates

- **Completeness Gate**: Ensures content is comprehensive
- **Example Quality Gate**: Validates examples are relevant and helpful
- **Difficulty Match Gate**: Checks content matches target cognitive level
- **Structure Gate**: Validates proper organization and formatting
- **Depth Gate**: Ensures appropriate level of detail

## API

### `createContentQualityPipeline(config)`

Creates a quality validation pipeline.

### `createQuickQualityChecker()`

Creates a fast, lightweight quality checker.

## License

MIT
