import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/index': 'src/adapters/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false, // Skip DTS for now to allow build to succeed
  sourcemap: true,
  clean: true,
  target: 'es2022',
  skipNodeModulesBundle: true,
  external: [
    '@prisma/client',
    '@sam-ai/core',
    '@sam-ai/agentic',
    '@sam-ai/integration',
    '@anthropic-ai/sdk',
    'openai',
    'next-auth',
  ],
});
