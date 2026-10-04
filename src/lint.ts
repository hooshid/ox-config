/**
 * Oxlint lint presets.
 *
 * Every preset is a function that accepts optional overrides, merged via `defu`.
 * User overrides take priority over preset defaults.
 *
 * @example
 * ```ts
 * // oxlint.config.ts
 * import { base, unicorn, react, tailwind, vitest } from '@hooshid/ox-config/lint'
 * import { defineConfig } from 'oxlint'
 *
 * export default defineConfig({
 *   extends: [base(), unicorn(), react(), tailwind(), vitest()],
 * })
 * ```
 */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { defu } from 'defu'
import { defineConfig } from 'oxlint'

import { GLOB_JSX, GLOB_SRC, GLOB_TESTS, GLOB_TS, isInEditorEnv } from './utils'

import type { ExternalPluginEntry, OxlintConfig } from 'oxlint'

const require = createRequire(import.meta.url)

// ============================================================================
// Ignore patterns
// ============================================================================

const DEFAULT_IGNORES: string[] = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/.cache/**',
  '**/.turbo/**',
  '**/.output/**',
  '**/.nitro/**',
  '**/.tanstack/**',
  '**/.vinxi/**',
  '**/.git/**',
  '**/public/**',
  '**/*.d.ts',
]

function loadGitignorePatterns(): string[] {
  const gitignoreFile = path.resolve(process.cwd(), '.gitignore')
  if (!existsSync(gitignoreFile)) return []

  return readFileSync(gitignoreFile, 'utf8')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((pattern) => {
      let p = pattern.trimEnd()
      if (p.startsWith('/')) p = p.slice(1)
      if (!p.includes('/') && !p.includes('*')) p = `**/${p}`
      if (p.endsWith('/')) p = `${p}**`
      return p
    })
}

// ============================================================================
// Helpers
// ============================================================================

function preset(defaults: OxlintConfig, overrides?: Partial<OxlintConfig>): OxlintConfig {
  return defineConfig(defu(overrides ?? {}, defaults))
}

function resolvePlugin(name: string): string {
  try {
    return require.resolve(name)
  } catch {
    return name
  }
}

function resolvePlugins(plugins: ExternalPluginEntry[]): ExternalPluginEntry[] {
  return plugins.map((p) => {
    if (typeof p === 'string') return resolvePlugin(p)
    return { ...p, specifier: resolvePlugin(p.specifier) }
  })
}

// ============================================================================
// Core
// ============================================================================

/**
 * Base lint preset — TypeScript + Import plugins, categories, env, ignores.
 * Always include first.
 */
export function base(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      plugins: ['typescript', 'import'],
      categories: {
        correctness: 'error',
        suspicious: 'error',
        perf: 'error',
        pedantic: 'warn',
      },
      rules: {
        'no-await-in-loop': 'off',
        'typescript/prefer-readonly-parameter-types': 'off',
        'typescript/strict-boolean-expressions': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        'no-inline-comments': 'off',
        'no-warning-comments': 'off',
        'import/max-dependencies': 'off',
        'react/no-unescaped-entities': 'off',
        'require-await': 'off',
      },
      env: {
        browser: true,
        node: true,
        es2026: true,
        builtin: true,
      },
      ignorePatterns: [...DEFAULT_IGNORES, ...loadGitignorePatterns()],
      overrides: [
        {
          files: [GLOB_TS],
          rules: {
            'typescript/consistent-type-definitions': 'off',
            'typescript/consistent-type-imports': 'error',
            'no-unused-vars': 'off',
            'typescript/array-type': 'error',
            'typescript/consistent-generic-constructors': 'error',
            'typescript/consistent-indexed-object-style': 'error',
            'typescript/consistent-type-assertions': 'error',
            'typescript/ban-tslint-comment': 'error',
            'typescript/no-empty-interface': 'error',
            'typescript/no-inferrable-types': 'error',
            'typescript/prefer-for-of': 'error',
            'typescript/prefer-function-type': 'error',
            'typescript/unified-signatures': 'error',
          },
        },
        {
          files: [GLOB_SRC],
          rules: {
            'import/no-unassigned-import': 'off',
            'import/no-relative-parent-imports': 'error',
            'import/first': 'error',
            'import/no-duplicates': 'error',
            'import/consistent-type-specifier-style': 'error',
            'import/no-mutable-exports': 'error',
            'import/no-named-default': 'error',
          },
        },
        {
          files: ['**/*.config.{ts,mts,cts,js,mjs,cjs}'],
          rules: {
            'import/no-relative-parent-imports': 'off',
          },
        },
        {
          files: GLOB_TESTS,
          rules: {
            'import/first': 'off',
            'import/no-duplicates': 'off',
            'import/consistent-type-specifier-style': 'off',
            'unicorn/no-useless-undefined': 'off',
            'typescript/no-empty-function': 'off',
            'unicorn/prefer-string-replace-all': 'off',
            'unicorn/no-array-callback-reference': 'off',
            'unicorn/prefer-spread': 'off',
            'typescript/no-non-null-assertion': 'off',
            'no-magic-numbers': 'off',
            'typescript/no-explicit-any': 'off',
            'typescript/no-unsafe-assignment': 'off',
            'typescript/no-unsafe-call': 'off',
            'typescript/no-unsafe-member-access': 'off',
            'typescript/no-unsafe-return': 'off',
            'typescript/no-unsafe-argument': 'off',
            'react/no-array-index-key': 'off',
          },
        },
      ],
    },
    overrides,
  )
}

/** Type-aware lint preset — enables 59 type-aware rules via tsgolint. */
export function typeAware(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      options: {
        typeAware: true,
        typeCheck: true,
      },
    },
    overrides,
  )
}

/** Unicorn lint preset — 100+ code quality rules. */
export function unicorn(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      plugins: ['unicorn'],
      rules: {
        'unicorn/no-null': 'off',
        'unicorn/filename-case': ['error', { case: 'kebabCase' }],
        'unicorn/catch-error-name': 'error',
        'unicorn/error-message': 'error',
        'unicorn/prefer-optional-catch-binding': 'error',
        'unicorn/no-zero-fractions': 'error',
        'unicorn/number-literal-case': 'error',
        'unicorn/numeric-separators-style': 'error',
        'unicorn/prefer-includes': 'error',
        'unicorn/prefer-spread': 'error',
        'unicorn/prefer-ternary': 'error',
        'unicorn/prefer-string-trim-start-end': 'error',
        'unicorn/prefer-structured-clone': 'error',
        'unicorn/prefer-default-parameters': 'error',
        'unicorn/no-console-spaces': 'error',
        'unicorn/throw-new-error': 'error',
        'unicorn/require-array-join-separator': 'error',
      },
    },
    overrides,
  )
}

/** Dependency optimization — flags packages replaceable with native APIs. */
export function depend(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      jsPlugins: resolvePlugins(['eslint-plugin-depend']),
      rules: {
        'depend/ban-dependencies': [
          'error',
          {
            presets: ['native', 'microutilities', 'preferred'],
            modules: [],
            allowed: ['dotenv'],
          },
        ],
      },
    },
    overrides,
  )
}

// ============================================================================
// Runtime environments
// ============================================================================

/** Node.js lint preset — native node plugin. */
export function node(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset({ plugins: ['node'] }, overrides)
}

/** Promise lint preset — native promise plugin. */
export function promise(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset({ plugins: ['promise'] }, overrides)
}

// ============================================================================
// Frontend
// ============================================================================

const reactStyleRules = {
  'react/jsx-pascal-case': 'error',
  'react/jsx-boolean-value': 'error',
  'react/jsx-curly-brace-presence': 'error',
  'react/jsx-fragments': 'error',
  'react/self-closing-comp': 'error',
  'react/hook-use-state': 'error',
} as const

/**
 * React lint preset — React + react-refresh (for Vite/TanStack Start).
 */
export function react(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      plugins: ['react'],
      jsPlugins: resolvePlugins(['eslint-plugin-react-refresh']),
      rules: {
        'react/react-in-jsx-scope': 'off',
        ...reactStyleRules,
      },
    },
    overrides,
  )
}

/**
 * TanStack Router lint preset — loads @tanstack/eslint-plugin-router.
 * Covers route-param-names and create-route-property-order.
 */
export function tanstackRouter(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      jsPlugins: resolvePlugins([
        { name: 'tanstack-router', specifier: '@tanstack/eslint-plugin-router' },
      ]),
      rules: {
        'tanstack-router/route-param-names': 'error',
        'tanstack-router/create-route-property-order': 'error',
      },
    },
    overrides,
  )
}

// ============================================================================
// Tailwind
// ============================================================================

interface TailwindOptions extends Partial<OxlintConfig> {
  entryPoint?: string
  rootFontSize?: number
  /** File glob patterns for tailwind rules. @default GLOB_JSX */
  files?: string[]
}

/** Tailwind CSS lint preset — eslint-plugin-better-tailwindcss. */
export function tailwind(options: TailwindOptions = {}): OxlintConfig {
  const { entryPoint = 'src/styles/globals.css', rootFontSize = 16, files, ...overrides } = options

  return preset(
    {
      jsPlugins: resolvePlugins(['eslint-plugin-better-tailwindcss']),
      settings: { 'better-tailwindcss': { entryPoint, rootFontSize } },
      overrides: [
        {
          files: files ?? [GLOB_JSX],
          rules: {
            'better-tailwindcss/enforce-consistent-line-wrapping': ['error', { printWidth: 0 }],
            'better-tailwindcss/enforce-canonical-classes': 'error',
          },
        },
      ],
    },
    overrides,
  )
}

// ============================================================================
// Testing
// ============================================================================

interface VitestOptions extends Partial<OxlintConfig> {
  files?: string[]
}

/** Vitest lint preset — native vitest plugin with test-file scoping. */
export function vitest(options?: VitestOptions): OxlintConfig {
  const { files, ...overrides } = options ?? {}

  return preset(
    {
      plugins: ['vitest'],
      settings: { vitest: { typecheck: true } },
      overrides: [
        {
          files: files ?? GLOB_TESTS,
          rules: {
            'vitest/expect-expect': 'error',
            'vitest/no-conditional-expect': 'error',
            'vitest/no-identical-title': 'error',
            'vitest/no-import-node-test': 'error',
            'vitest/no-interpolation-in-snapshots': 'error',
            'vitest/no-mocks-import': 'error',
            'vitest/no-standalone-expect': 'error',
            'vitest/valid-describe-callback': 'error',
            'vitest/valid-expect': 'error',
            'vitest/valid-title': 'error',
            'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
            'vitest/prefer-hooks-in-order': 'error',
            'vitest/prefer-lowercase-title': 'error',
            'vitest/no-disabled-tests': isInEditorEnv() ? 'warn' : 'error',
            'vitest/no-focused-tests': isInEditorEnv() ? 'warn' : 'error',
            'vitest/require-mock-type-parameters': 'off',
            'no-console': 'off',
            'unicorn/no-null': 'off',
            'typescript/ban-ts-comment': 'off',
          },
        },
      ],
    },
    overrides,
  )
}

// ============================================================================
// Backend / ORM
// ============================================================================

/** NestJS lint preset — @darraghor/eslint-plugin-nestjs-typed. */
export function nestjs(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      jsPlugins: resolvePlugins([
        { name: 'nestjs-typed', specifier: '@darraghor/eslint-plugin-nestjs-typed' },
      ]),
      rules: {
        'nestjs-typed/injectable-should-be-provided': 'error',
        'nestjs-typed/provided-injected-should-match-factory-parameters': 'error',
        'nestjs-typed/use-injectable-provided-token': 'error',
        'nestjs-typed/api-property-matches-property-optionality': 'error',
        'nestjs-typed/controllers-should-supply-api-tags': 'error',
        'nestjs-typed/api-method-should-specify-api-response': 'error',
        'nestjs-typed/api-property-returning-array-should-set-array': 'error',
        'nestjs-typed/api-property-should-have-api-extra-models': 'error',
        'nestjs-typed/api-operation-summary-description-capitalized': 'error',
        'nestjs-typed/param-decorator-name-matches-route-param': 'error',
        'nestjs-typed/validate-nested-of-array-should-set-each': 'error',
        'nestjs-typed/all-properties-are-whitelisted': 'error',
        'nestjs-typed/no-duplicate-decorators': 'error',
        'nestjs-typed/validation-pipe-should-use-forbid-unknown': 'error',
      },
    },
    overrides,
  )
}

/** Drizzle ORM lint preset — eslint-plugin-drizzle. */
export function drizzle(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      jsPlugins: resolvePlugins(['eslint-plugin-drizzle']),
      rules: {
        'drizzle/enforce-delete-with-where': 'error',
        'drizzle/enforce-update-with-where': 'error',
      },
    },
    overrides,
  )
}

// ============================================================================
// Re-exports
// ============================================================================

export { defineConfig } from 'oxlint'
export { GLOB_SRC, GLOB_JS, GLOB_TS, GLOB_JSX, GLOB_TESTS, GLOB_JSON, GLOB_MARKDOWN } from './utils'
