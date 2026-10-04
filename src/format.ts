/**
 * Oxfmt format presets.
 *
 * @example
 * ```ts
 * // oxfmt.config.ts
 * import { format, tailwindFormat } from '@hooshid/ox-config/format'
 * import { defineConfig } from 'oxfmt'
 *
 * export default defineConfig({
 *   ...format(),
 *   ...tailwindFormat({ stylesheet: 'src/styles/globals.css' }),
 * })
 * ```
 */

import { defu } from 'defu'

import type { OxfmtConfig } from 'oxfmt'

/** Base format preset. Pass overrides to customize. */
export function format(overrides?: Record<string, unknown>): OxfmtConfig {
  return defu(overrides, {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: true,
    jsxSingleQuote: false,
    quoteProps: 'consistent' as const,
    trailingComma: 'all' as const,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always' as const,
    endOfLine: 'lf' as const,
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
    ignorePatterns: [
      // Build outputs
      'dist/**',
      'build/**',
      'out/**',
      '.output/**',
      '.next/**',
      '.turbo/**',
      '.cache/**',
      '.nitro/**',
      '.tanstack/**',
      '.vinxi/**',
      '.content-collections/**',

      // Generated / vendor
      'public/**',
      'coverage/**',
      '**/api',
      '**/build',
      '**/public',
      'routeTree.gen.ts',
      '*.min.js',
      '*.min.css',

      // Lock files
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
    ],
  }) as OxfmtConfig
}

/**
 * Oxfmt Tailwind class-sorting preset.
 * Spread into your format config alongside `format()` to enable.
 */
export function tailwindFormat(options: { stylesheet?: string } = {}): OxfmtConfig {
  return {
    sortTailwindcss: {
      stylesheet: options.stylesheet ?? 'src/styles/globals.css',
      functions: ['cn', 'clsx', 'cva', 'tw'] as string[],
    },
  }
}
