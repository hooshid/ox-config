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
  sortImports: {
    groups: [
      'builtin',
      { newlinesBetween: true },
      'external',
      { newlinesBetween: true },
      'internal',
      { newlinesBetween: true },
      ['parent', 'sibling'],
      { newlinesBetween: true },
      'index',
      { newlinesBetween: true },
      'type',
    ],
    internalPattern: ['~/', '@/', '#/'],
  },

  // Ignore
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
