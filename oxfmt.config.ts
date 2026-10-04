import { defineConfig } from 'oxfmt'

export default defineConfig({
  // Layout
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',

  // Quotes & Semicolons
  semi: false,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'consistent',

  // Trailing & Spacing
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Sorting
  sortPackageJson: true,
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '.changeset/**',
    'pnpm-lock.yaml',
    'coverage/**',
    '**/*.min.js',
    'README.md',
  ],
})
