import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'import', 'unicorn'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error',
    pedantic: 'warn',
  },
  rules: {
    // Style
    'no-inline-comments': 'off',
    'no-warning-comments': 'off',
    'max-lines': 'off',
    'max-lines-per-function': 'off',
    // TypeScript
    'typescript/consistent-type-imports': 'error',
    'typescript/consistent-type-definitions': 'off',
    'typescript/array-type': 'error',
    'typescript/no-unused-vars': 'error',
    'typescript/no-explicit-any': 'warn',
    // Import
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'import/consistent-type-specifier-style': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-named-default': 'error',
    'import/no-unassigned-import': 'off',
    // Unicorn
    'unicorn/filename-case': ['error', { case: 'kebabCase' }],
    'unicorn/catch-error-name': 'error',
    'unicorn/error-message': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-optional-catch-binding': 'error',
    'unicorn/prefer-spread': 'error',
    'unicorn/prefer-ternary': 'error',
    'unicorn/throw-new-error': 'error',
    'unicorn/no-null': 'off',
  },
  env: {
    node: true,
    es2024: true,
  },
  ignorePatterns: ['dist/**', 'node_modules/**', '.changeset/**', '**/*.d.ts'],
  overrides: [
    {
      files: ['**/*.config.{ts,mts,cts,js,mjs,cjs}'],
      rules: {
        'import/no-relative-parent-imports': 'off',
      },
    },
  ],
})
