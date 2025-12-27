# @sam-ai/pedagogy

Pedagogical evaluation pipeline for SAM AI Tutor. Validates educational content against learning science principles.

## Installation

```bash
npm install @sam-ai/pedagogy @sam-ai/core
```

## Usage

```typescript
import {
  PedagogicalPipeline,
  createPedagogicalPipeline
} from '@sam-ai/pedagogy';

const pipeline = createPedagogicalPipeline({
  targetLevel: 'UNDERSTAND',
  enableAllEvaluators: true
});

const result = await pipeline.evaluate({
  content: 'Your educational content...',
  targetBloomsLevel: 'UNDERSTAND',
  studentContext: { currentLevel: 'REMEMBER' }
});

console.log('Alignment score:', result.alignmentScore);
console.log('Recommendations:', result.recommendations);
```

## Evaluators

- **Blooms Aligner**: Verifies content matches target cognitive level
- **Scaffolding Evaluator**: Checks for proper learning scaffolding
- **ZPD Evaluator**: Validates content is in the Zone of Proximal Development

## API

### `createPedagogicalPipeline(config)`

Creates a pedagogical evaluation pipeline.

### `createBloomsAligner(config)`

Creates a Bloom's Taxonomy alignment checker.

### `createScaffoldingEvaluator(config)`

Creates a scaffolding validation evaluator.

### `createZPDEvaluator(config)`

Creates a Zone of Proximal Development evaluator.

## License

MIT
