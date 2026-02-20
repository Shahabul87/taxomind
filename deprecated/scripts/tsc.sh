#!/bin/bash

# Simple wrapper script for TypeScript compiler with memory optimization
# This provides a permanent solution for the memory issue

# Set memory to 8GB for TypeScript compilation
export NODE_OPTIONS="--max-old-space-size=8192"

# Run TypeScript compiler with all arguments passed through
npx tsc "$@"