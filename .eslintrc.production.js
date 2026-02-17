// Production ESLint configuration with all strict rules
// Use this for CI/CD and pre-commit hooks
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'unused-imports',
    'security',
    'sonarjs',
  ],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:security/recommended-legacy',
    'plugin:sonarjs/recommended-legacy',
    'prettier',
  ],
  rules: {
    // TypeScript strict rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
      allowDirectConstAssertionInArrowFunctions: true,
    }],
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    
    // React hooks - strict enforcement
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',
    
    // React best practices
    'react/no-unescaped-entities': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-danger': 'warn',
    
    // Next.js specific
    '@next/next/no-img-element': 'error',
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-page-custom-font': 'error',
    '@next/next/no-sync-scripts': 'error',
    
    // Console and debugging
    'no-console': 'error',
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Import organization
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'object',
        'type'
      ],
      'pathGroups': [
        {
          'pattern': 'react',
          'group': 'external',
          'position': 'before'
        },
        {
          'pattern': 'next/**',
          'group': 'external',
          'position': 'before'
        },
        {
          'pattern': '@/**',
          'group': 'internal',
          'position': 'after'
        }
      ],
      'pathGroupsExcludedImportTypes': ['react'],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }],
    'import/no-duplicates': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    
    // Unused imports
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      { 
        'vars': 'all', 
        'varsIgnorePattern': '^_',
        'args': 'after-used', 
        'argsIgnorePattern': '^_' 
      }
    ],
    
    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-eval-with-expression': 'error',
    
    // Code quality
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/max-switch-cases': ['error', 10],
    'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
    'sonarjs/no-identical-functions': 'error',
    
    // SAM store facade enforcement — prevent direct imports from individual store files
    // in API routes. Use @/lib/sam/taxomind-context for store instances (getStore(),
    // getPracticeStores(), etc.) and @/lib/sam/stores barrel for types/constants.
    // The lib/sam/ internal files are excluded via overrides below.
    '@typescript-eslint/no-restricted-imports': ['warn', {
      'patterns': [
        {
          'group': ['@/lib/sam/stores/prisma-*'],
          'message': 'Import types/constants from @/lib/sam/stores (barrel). Use getStore()/getPracticeStores() from @/lib/sam/taxomind-context for store instances.',
          'allowTypeImports': true,
        },
      ],
    }],

    // General best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'require-await': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
    
    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        'selector': 'variable',
        'format': ['camelCase', 'PascalCase', 'UPPER_CASE'],
        'leadingUnderscore': 'allow'
      },
      {
        'selector': 'function',
        'format': ['camelCase', 'PascalCase']
      },
      {
        'selector': 'typeLike',
        'format': ['PascalCase']
      },
      {
        'selector': 'enum',
        'format': ['PascalCase']
      },
      {
        'selector': 'enumMember',
        'format': ['UPPER_CASE']
      }
    ],
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'sonarjs/no-duplicate-string': 'off',
      }
    },
    {
      files: ['*.config.js', '*.config.ts', 'scripts/*.js'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      }
    },
    {
      // SAM internal files may import from individual store files
      files: ['lib/sam/**/*.ts', 'lib/sam/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-restricted-imports': 'off',
      }
    }
  ],
  ignorePatterns: [
    'node_modules',
    '.next',
    'out',
    'public',
    'coverage',
    '*.min.js',
    'backups',
    'backup*',
    '*.backup',
  ],
};