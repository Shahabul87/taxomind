#!/bin/bash

# TypeScript type checking with increased memory allocation
echo "🔍 Running TypeScript type checking..."

# Set Node options for increased memory
export NODE_OPTIONS='--max-old-space-size=8192'

# Run TypeScript compiler in no-emit mode (only type checking)
npx tsc --noEmit

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ TypeScript type checking passed!"
else
  echo "❌ TypeScript type checking failed with errors"
fi

exit $EXIT_CODE