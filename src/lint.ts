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
  '**/.svn/**',
  '**/.hg/**',
  '**/.pnp.*',
  '**/public/**',
  '**/routeTree.gen.ts',
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

/**
 * Resolve a jsPlugin package name to its absolute path.
 * This allows oxlint to load plugins directly without relying on
 * Node module resolution from the consumer's CWD — fixes pnpm strict mode.
 */
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
        // Shape-only check; necessary in interactive CLI and sequential workflows.
        'no-await-in-loop': 'off',
        // High-noise; readonly intent better expressed via `const generics` or call-site.
        'typescript/prefer-readonly-parameter-types': 'off',
        // Turns `if (str)` into ceremony for marginal safety gain.
        'typescript/strict-boolean-expressions': 'off',
        // File/function size is a reviewer call, not a lint rule.
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        // Misfires on `/* @__PURE__ */` and similar bundler annotations.
        'no-inline-comments': 'off',
        // TODO/FIXME triage belongs in the issue tracker.
        'no-warning-comments': 'off',
        // Default cap of 10 is too tight for modern React/Next component files.
        'import/max-dependencies': 'off',
        // Modern React renders apostrophes correctly; legacy noise.
        'react/no-unescaped-entities': 'off',
        // Misfires on Next.js Server Actions and placeholder async functions.
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
            // Only list rules that DIFFER from categories defaults
            'typescript/consistent-type-definitions': 'off',
            'typescript/consistent-type-imports': 'error',
            'no-unused-vars': 'off',
            'no-useless-rename': 'error',
            'uninvoked-array-callback': 'error',
            'typescript/array-type': 'error',
            'typescript/consistent-generic-constructors': 'error',
            'typescript/consistent-indexed-object-style': 'error',
            'typescript/consistent-type-assertions': 'error',
            'typescript/ban-tslint-comment': 'error',
            'typescript/no-empty-interface': 'error',
            'typescript/no-inferrable-types': 'error',
            'typescript/no-misused-new': 'error',
            'typescript/no-unnecessary-parameter-property-assignment': 'error',
            'typescript/no-useless-empty-export': 'error',
            'typescript/no-deprecated': 'warn',
            'typescript/prefer-for-of': 'error',
            'typescript/prefer-function-type': 'error',
            'typescript/unified-signatures': 'error',
          },
        },
        {
          files: [GLOB_SRC],
          rules: {
            // CSS/style side-effect imports are standard in all frontend frameworks
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
          // Config files commonly import shared roots via `../../config.ts`
          // in monorepos — intended pattern, not a smell.
          files: ['**/*.config.{ts,mts,cts,js,mjs,cjs}'],
          rules: {
            'import/no-relative-parent-imports': 'off',
          },
        },
        {
          // Test files use mock setup patterns (vi.mock/vi.hoisted before imports),
          // explicit mock signatures, and fixture data that
          // legitimately violate strict style/safety rules.
          files: GLOB_TESTS,
          rules: {
            // Mock setup pattern breaks standard import ordering
            'import/first': 'off',
            'import/no-duplicates': 'off',
            'import/consistent-type-specifier-style': 'off',
            // Mock signatures need explicit values / async without await
            'unicorn/no-useless-undefined': 'off',
            'typescript/no-empty-function': 'off',
            // Modernization hints aren't useful in tests
            'unicorn/prefer-string-replace-all': 'off',
            'unicorn/no-array-callback-reference': 'off',
            'unicorn/prefer-spread': 'off',
            // Tests deliberately use non-null assertions, magic numbers, any
            'typescript/no-non-null-assertion': 'off',
            'no-magic-numbers': 'off',
            'typescript/no-explicit-any': 'off',
            'typescript/no-unsafe-assignment': 'off',
            'typescript/no-unsafe-call': 'off',
            'typescript/no-unsafe-member-access': 'off',
            'typescript/no-unsafe-return': 'off',
            'typescript/no-unsafe-argument': 'off',
            // Index keys are fine when rendering fixture lists
            'react/no-array-index-key': 'off',
          },
        },
      ],
    },
    overrides,
  )
}

/**
 * Type-aware lint preset — enables 59 type-aware rules via tsgolint + type checking.
 * Requires TypeScript 7.0+ and `oxlint-tsgolint` (bundled as dependency).
 */
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
        'unicorn/number-literal-case': 'error',
        'unicorn/numeric-separators-style': 'error',
        'unicorn/prefer-includes': 'error',
        'unicorn/prefer-spread': 'error',
        'unicorn/prefer-ternary': 'error',
        'unicorn/prefer-string-trim-start-end': 'error',
        'unicorn/prefer-structured-clone': 'error',
        'unicorn/prefer-default-parameters': 'error',
        'unicorn/prefer-string-starts-ends-with': 'error',
        'unicorn/prefer-set-size': 'error',
        'unicorn/throw-new-error': 'error',
        'unicorn/require-array-join-separator': 'error',

        // Correctness
        'unicorn/no-zero-fractions': 'error',
        'unicorn/no-console-spaces': 'error',
        'unicorn/no-useless-spread': 'error',
        'unicorn/no-useless-fallback-in-spread': 'error',
        'unicorn/no-unnecessary-await': 'error',
        'unicorn/no-useless-length-check': 'error',
        'unicorn/no-single-promise-in-promise-methods': 'error',
        'unicorn/no-await-in-promise-methods': 'error',
        'unicorn/no-invalid-remove-event-listener': 'error',
        'unicorn/no-invalid-fetch-options': 'error',
        'unicorn/no-new-array': 'error',
        'unicorn/no-empty-file': 'warn',
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
  return preset(
    {
      plugins: ['node'],
      rules: {
        'unicorn/prefer-node-protocol': 'error',
      },
    },
    overrides,
  )
}

/** Promise lint preset — native promise plugin. */
export function promise(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset({ plugins: ['promise'] }, overrides)
}

// ============================================================================
// Frontend
// ============================================================================

const reactRules = {
  // Hooks (CRITICAL)
  'react/rules-of-hooks': 'error',
  'react/exhaustive-deps': 'warn',

  // JSX Correctness
  'react/jsx-key': 'error',
  'react/jsx-no-duplicate-props': 'error',
  'react/jsx-no-undef': 'error',
  'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
  'react/jsx-no-comment-textnodes': 'error',
  'react/jsx-no-script-url': 'error',
  'react/jsx-props-no-spread-multi': 'error',
  'react/jsx-no-useless-fragment': 'warn',

  // JSX Style
  'react/jsx-boolean-value': ['error', 'never'],
  'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
  'react/jsx-fragments': ['error', 'syntax'],
  'react/jsx-pascal-case': ['error', { allowAllCaps: false, allowNamespace: true }],
  'react/self-closing-comp': ['error', { component: true, html: true }],
  'react/hook-use-state': 'error',

  // Runtime Safety
  'react/no-children-prop': 'error',
  'react/no-danger-with-children': 'error',
  'react/no-direct-mutation-state': 'error',
  'react/no-find-dom-node': 'error',
  'react/no-is-mounted': 'error',
  'react/no-render-return-value': 'error',
  'react/no-string-refs': 'error',
  'react/no-unknown-property': 'error',
  'react/no-unsafe': 'error',
  'react/require-render-return': 'error',
  'react/void-dom-elements-no-children': 'error',

  // Lifecycle Safety
  'react/no-set-state': 'error',
  'react/no-did-mount-set-state': 'error',
  'react/no-did-update-set-state': 'error',
  'react/no-will-update-set-state': 'error',
  'react/no-this-in-sfc': 'error',

  // Refs & Boundaries
  'react/forward-ref-uses-ref': 'error',
  'react/no-unstable-nested-components': 'warn',
  'react/iframe-missing-sandbox': 'error',
  'react/set-state-in-render': 'error',
  'react/error-boundaries': 'error',

  // Performance
  'react/jsx-no-constructed-context-values': 'warn',
  'react/no-array-index-key': 'warn',
  'react/style-prop-object': 'error',

  // Modern React (17+)
  'react/react-in-jsx-scope': 'off',

  // Noise Reduction
  'react/no-unescaped-entities': 'off',
} satisfies NonNullable<OxlintConfig['rules']>

/** React lint preset — core React + Hooks rules. */
export function react(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      plugins: ['react'],
      rules: reactRules,
    },
    overrides,
  )
}

/** React + react-refresh preset (for Vite, TanStack Start, etc.). */
export function reactVite(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      plugins: ['react'],
      jsPlugins: resolvePlugins(['eslint-plugin-react-refresh']),
      rules: {
        ...reactRules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
    overrides,
  )
}

/** Next.js lint preset — enables native nextjs plugin. */
export function nextjs(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset({ plugins: ['nextjs'] }, overrides)
}

/**
 * TanStack Router lint preset.
 *
 * Loads @tanstack/eslint-plugin-router and applies conventions specific
 * to file-based routing setups.
 *
 * Rules provided by the plugin:
 * - `route-param-names` — validates `$param` names match between route path and params
 * - `create-route-property-order` — enforces consistent property order in `createRoute()`
 */
export function tanstackRouter(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      jsPlugins: resolvePlugins([
        { name: 'tanstack-router', specifier: '@tanstack/eslint-plugin-router' },
      ]),
      rules: {
        // ─── Route Configuration ─────────────────────────
        'tanstack-router/route-param-names': 'error',
        'tanstack-router/create-route-property-order': 'error',

        // ─── Route File Conventions ──────────────────────
        // Route files should use named exports for route objects
        // (default export reserved for the component or route)
        'import/no-default-export': 'off', // Router requires default exports
      },
      overrides: [
        // ─── Generated route tree ───────────────────────
        // TanStack Router's plugin writes routeTree.gen.ts on every dev run.
        // Never lint it — it's not source code and its filename is
        // intentionally PascalCase (routeTree), which unicorn/filename-case
        // would otherwise flag.
        {
          files: [
            '**/routeTree.gen.ts',
            '**/routeTree.gen.tsx',
            '**/*.generated.ts',
            '**/*.gen.ts',
          ],
          rules: {
            'unicorn/filename-case': 'off',
          },
        },

        {
          // Route files follow specific naming and structure
          files: ['**/routes/**/*.{ts,tsx}'],
          rules: {
            // Routes must not use window directly — use router hooks
            'no-restricted-globals': [
              'error',
              {
                name: 'window',
                message: 'Use useRouter() or useNavigate() instead of window in route files.',
              },
            ],
          },
        },
        {
          files: ['**/routes/**/*.{ts,tsx}'],
          plugins: ['unicorn'],
          rules: {
            'unicorn/filename-case': [
              'error',
              {
                case: 'kebabCase',
                ignore: [
                  '\\$', // dynamic params: $postId.tsx, posts.$postId.tsx
                  '^_', // pathless/root: _auth.tsx, __root.tsx
                  '\\.', // multi-segment: posts.index.tsx, route.lazy.tsx
                ],
              },
            ],
          },
        },
        {
          // Root route file convention
          files: ['**/routes/__root.tsx'],
          rules: {
            // __root.tsx can't use useNavigate (no router context yet)
            'no-restricted-globals': 'off',
          },
        },
      ],
    },
    overrides,
  )
}

/**
 * TanStack Start lint preset.
 *
 * Adds rules for server functions, client/server boundaries, and Start
 * conventions. This preset assumes `reactVite()` and `tanstackRouter()`
 * are already in the `extends` array.
 *
 */
export function tanstackStart(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      rules: {
        // ─── Server Function Safety ──────────────────────
        // Prevent async promise executors (Start loaders must be sync wrapper)
        'no-async-promise-executor': 'error',
        // Sequential awaits are fine in server functions
        'no-await-in-loop': 'off',

        // ─── Client / Server Boundary ────────────────────
        // Node.js modules must not leak into client bundles
        'import/no-nodejs-modules': 'error',

        // ─── Loader Conventions ──────────────────────────
        // Loaders must consistently return or throw
        'consistent-return': 'error',

        // ─── Common Start Pitfalls ───────────────────────
        // Empty functions are common in placeholder server functions
        'no-empty-function': 'warn',
      },

      overrides: [
        {
          // Server-only files — Node.js APIs allowed
          files: ['**/*.server.{ts,tsx}', '**/server/**/*.{ts,tsx}', '**/server-fns/**/*.{ts,tsx}'],
          rules: {
            'import/no-nodejs-modules': 'off',
            'no-console': 'off',
          },
        },
        {
          // Client-only files — Node.js APIs forbidden
          files: ['**/*.client.{ts,tsx}', '**/components/**/*.{ts,tsx}'],
          rules: {
            'import/no-nodejs-modules': 'error',
          },
        },
        {
          // Route files — server-aware
          files: ['**/routes/**/*.{ts,tsx}'],
          rules: {
            // Routes use loaders, not direct fetch in component
            'no-restricted-syntax': [
              'warn',
              {
                selector: 'CallExpression[callee.name="fetch"]',
                message: 'Prefer a loader or server function over direct fetch in route files.',
              },
            ],
          },
        },
        {
          files: ['**/*.server.{ts,tsx}', '**/*.client.{ts,tsx}'],
          plugins: ['unicorn'],
          rules: {
            'unicorn/filename-case': [
              'error',
              {
                case: 'kebabCase',
                ignore: [
                  '\\.', // allow *.server.ts / *.client.ts (has dots)
                ],
              },
            ],
          },
        },
        {
          files: ['**/*.server.{ts,tsx}', '**/server/**/*.{ts,tsx}', '**/server-fns/**/*.{ts,tsx}'],
          rules: {
            'import/no-nodejs-modules': 'off',
            'no-console': 'off',
            // ← جدید: جلوگیری از crash توی SSR
            'no-restricted-globals': [
              'error',
              {
                name: 'window',
                message:
                  'Not available in server context. Use a server function or guard with typeof window.',
              },
              { name: 'document', message: 'Not available in server context.' },
              { name: 'localStorage', message: 'Not available in server context.' },
              { name: 'sessionStorage', message: 'Not available in server context.' },
            ],
          },
        },
      ],
    },
    overrides,
  )
}

// ============================================================================
// Quality
// ============================================================================

/** Accessibility lint preset — enables native jsx-a11y plugin. */
export function a11y(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset({ plugins: ['jsx-a11y'] }, overrides)
}

/** JSDoc lint preset — enables native jsdoc plugin. */
export function jsdoc(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset({ plugins: ['jsdoc'] }, overrides)
}

// ============================================================================
// Testing
// ============================================================================

interface VitestOptions extends Partial<OxlintConfig> {
  /** Test file glob patterns. Replaces the default GLOB_TESTS. */
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
            // Prefer toHaveBeenCalledOnce() over toHaveBeenCalledTimes(1) — more readable
            'vitest/prefer-called-once': 'error',
            'vitest/prefer-expect-type-of': 'error',
            'vitest/prefer-to-be-object': 'error',
            'vitest/hoisted-apis-on-top': 'error',
            'vitest/require-awaited-expect-poll': 'error',
            'vitest/no-conditional-tests': 'error',
            'vitest/consistent-vitest-vi': 'error',
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
// Backend / ORM
// ============================================================================

/**
 * NestJS lint preset — loads @darraghor/eslint-plugin-nestjs-typed via jsPlugin.
 * Covers DI validation, Swagger consistency, decorator bug prevention (19 AST rules).
 */
export function nestjs(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset(
    {
      jsPlugins: resolvePlugins([
        { name: 'nestjs-typed', specifier: '@darraghor/eslint-plugin-nestjs-typed' },
      ]),
      rules: {
        // DI
        'nestjs-typed/injectable-should-be-provided': 'error',
        'nestjs-typed/provided-injected-should-match-factory-parameters': 'error',
        'nestjs-typed/use-injectable-provided-token': 'error',
        // Swagger
        'nestjs-typed/api-property-matches-property-optionality': 'error',
        'nestjs-typed/controllers-should-supply-api-tags': 'error',
        'nestjs-typed/api-method-should-specify-api-response': 'error',
        'nestjs-typed/api-property-returning-array-should-set-array': 'error',
        'nestjs-typed/api-property-should-have-api-extra-models': 'error',
        'nestjs-typed/api-operation-summary-description-capitalized': 'error',
        // Bug prevention
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
