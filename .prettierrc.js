/**
 * Enterprise Prettier Configuration
 * Phase 2: Code Standardization
 */

module.exports = {
  // Line Length
  printWidth: 100,
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Semicolons
  semi: true,
  
  // Quotes
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  
  // Trailing Commas
  trailingComma: 'es5',
  
  // Brackets
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow Functions
  arrowParens: 'always',
  
  // File endings
  endOfLine: 'lf',
  
  // Formatting embedded languages
  embeddedLanguageFormatting: 'auto',
  
  // HTML/JSX
  htmlWhitespaceSensitivity: 'css',
  
  // Markdown
  proseWrap: 'preserve',
  
  // Special overrides for specific file types
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: ['*.json', '.prettierrc', '.eslintrc'],
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
      },
    },
    {
      files: ['*.css', '*.scss'],
      options: {
        singleQuote: false,
      },
    },
  ],
};