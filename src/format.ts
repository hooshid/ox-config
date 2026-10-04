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
    semi: false,
    singleQuote: true,
    trailingComma: 'all' as const,
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    arrowParens: 'always' as const,
    bracketSpacing: true,
    endOfLine: 'lf' as const,
    quoteProps: 'consistent' as const,

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
      internalPattern: ['~/', '@/'],
    },

    sortPackageJson: true,
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