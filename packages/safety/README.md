# @sam-ai/safety

Safety validation for SAM AI Tutor. Ensures AI-generated feedback is fair, unbiased, and accessible.

## Installation

```bash
npm install @sam-ai/safety
```

## Usage

```typescript
import {
  FairnessSafetyValidator,
  createFairnessSafetyValidator,
  validateFeedbackSafety,
  isFeedbackSafe
} from '@sam-ai/safety';

// Quick validation
const feedback = {
  overallFeedback: 'Your work shows understanding...',
  strengthsFeedback: 'Great analysis of...',
  improvementFeedback: 'Consider exploring...',
  nextStepsFeedback: 'Try practicing with...'
};

const result = await validateFeedbackSafety(feedback);
if (result.passed) {
  console.log('Feedback is safe to deliver');
} else {
  console.log('Issues found:', result.issues);
  console.log('Suggestions:', result.recommendations);
}

// Rewrite feedback if needed
import { rewriteFeedbackSafely } from '@sam-ai/safety';
const safeFeedback = rewriteFeedbackSafely(feedback);
```

## Features

- **Discouraging Language Detection**: Identifies potentially discouraging phrases
- **Bias Detection**: Detects cultural, gender, and other biases
- **Accessibility Checker**: Ensures content is readable and accessible
- **Constructive Framing**: Validates feedback uses growth mindset language
- **Fairness Auditor**: Comprehensive fairness auditing across demographics

## API

### `createFairnessSafetyValidator(config)`

Creates a comprehensive safety validator.

### `validateFeedbackSafety(feedback)`

Quick validation using default settings.

### `isFeedbackSafe(feedback)`

Returns boolean for pass/fail.

### `rewriteFeedbackSafely(feedback)`

Automatically rewrites feedback to be safer.

### `createFairnessAuditor(config)`

Creates an auditor for demographic analysis.

## License

MIT
