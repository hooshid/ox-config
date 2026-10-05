# @hooshid/ox-config

Shared [Oxlint](https://oxc.rs/) + [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) presets for my projects. One install, lint and format ready.

## Install

```bash
pnpm add -D @hooshid/ox-config
```

> [!TIP]
> Works with pnpm strict mode out of the box — jsPlugin paths are resolved internally via `require.resolve()`, no hoisting hacks needed.

## Lint (Oxlint)

Create `oxlint.config.ts` in your project root:

```ts
import { base, unicorn, depend, react, tailwind, vitest } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base(), unicorn(), depend(), react(), tailwind(), vitest()],
})
```

Every preset is a function. Call without arguments for defaults, or pass overrides:

```ts
export default defineConfig({
  extends: [
    base({ rules: { 'no-console': 'off' } }),
    unicorn({ rules: { 'unicorn/no-array-for-each': 'off' } }),
    vitest({ files: ['**/*.e2e-spec.ts', '**/*.spec.ts'] }),
  ],
})
```

> [!IMPORTANT]
> Most presets use deep merge via `defu` — user values take priority. File scope options **replace** their defaults (e.g. `vitest({ files: [...] })` replaces the default test globs).

### Available presets

#### Core

| Preset        | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `base()`      | TypeScript, Import, categories, env, ignores. Always include first. |
| `typeAware()` | 59 type-aware rules via tsgolint (requires TS-compatible tsconfig)  |
| `unicorn()`   | 100+ code quality rules                                             |
| `depend()`    | Flag packages replaceable with native APIs or micro-utilities       |

#### Runtime

| Preset      | Description                        |
| ----------- | ---------------------------------- |
| `node()`    | Node.js specific rules             |
| `promise()` | Promise best practices (16 rules)  |

#### Frontend

| Preset             | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `react()`          | React + React Hooks                                      |
| `reactVite()`      | React + React Hooks + React Refresh (for Vite)           |
| `nextjs()`         | Next.js rules + Core Web Vitals                          |
| `tanstackRouter()` | TanStack Router — route param names + property ordering  |
| `tailwind()`       | Tailwind class consistency (better-tailwindcss plugin)   |

#### Backend / ORM

| Preset      | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| `nestjs()`  | NestJS DI validation, Swagger consistency, decorator checks (14 rules) |
| `drizzle()` | Drizzle ORM — enforce where clause on delete/update                    |

#### Quality

| Preset    | Description              |
| --------- | ------------------------ |
| `a11y()`  | JSX accessibility (WCAG) |
| `jsdoc()` | JSDoc validation         |

#### Testing

| Preset     | Description                              |
| ---------- | ---------------------------------------- |
| `vitest()` | Vitest best practices, environment-aware |

### Which React preset should I use?

| Project type                  | Preset        |
| ----------------------------- | ------------- |
| Next.js                       | `nextjs()`    |
| Vite + React                  | `reactVite()` |
| TanStack Start                | `reactVite()` |
| Plain React (CRA, custom)     | `react()`     |

> `reactVite()` adds `eslint-plugin-react-refresh` to warn about incorrect fast-refresh patterns — use it for any Vite-based setup.

### NestJS projects

> [!WARNING]
> NestJS must disable `typescript/consistent-type-imports` — NestJS DI uses runtime class references in constructor params, and without type-aware linting this rule incorrectly converts them to `import type`, breaking DI at runtime.
>
> ```ts
> export default defineConfig({
>   extends: [base(), nestjs()],
>   overrides: [
>     {
>       files: ['**/*.{ts,mts,cts,tsx}'],
>       rules: {
>         'typescript/consistent-type-imports': 'off',
>         'typescript/no-extraneous-class': ['error', { allowWithDecorator: true }],
>       },
>     },
>   ],
> })
> ```

### TanStack Router

The `tanstackRouter()` preset loads [`@tanstack/eslint-plugin-router`](https://www.npmjs.com/package/@tanstack/eslint-plugin-router):

```ts
import { base, tanstackRouter } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base(), tanstackRouter()],
})
```

Covers:
- `route-param-names` — validates route param placeholders match
- `create-route-property-order` — enforces property ordering in `createRoute()`

### Full frontend example

```ts
import {
  base,
  unicorn,
  depend,
  reactVite,
  tanstackRouter,
  tailwind,
  vitest,
} from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [
    base(),
    unicorn(),
    depend(),
    reactVite(),
    tanstackRouter(),
    tailwind({ entryPoint: 'src/styles/globals.css', rootFontSize: 16 }),
    vitest(),
  ],
})
```

### Full backend example

```ts
import { base, unicorn, depend, node, promise, nestjs, drizzle, vitest } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [
    base(),
    unicorn(),
    depend(),
    node(),
    promise(),
    nestjs(),
    drizzle({
      rules: {
        'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName: 'db' }],
        'drizzle/enforce-update-with-where': ['error', { drizzleObjectName: 'db' }],
      },
    }),
    vitest({ files: ['**/*.spec.ts', '**/*.e2e-spec.ts'] }),
  ],
  rules: {
    // NestJS exception filter .catch() is not Promise.catch()
    'promise/valid-params': 'off',
  },
  overrides: [
    {
      files: ['**/*.{ts,mts,cts,tsx}'],
      rules: {
        'typescript/consistent-type-imports': 'off',
        'typescript/no-extraneous-class': ['error', { allowWithDecorator: true }],
      },
    },
  ],
})
```

### Type-aware linting

The `typeAware()` preset enables two options on oxlint:

- **`typeAware`** — turns on ~59 lint rules that need type information, implemented via [`oxlint-tsgolint`](https://www.npmjs.com/package/oxlint-tsgolint) (e.g. `no-floating-promises`, `no-misused-promises`, `consistent-type-imports`)
- **`typeCheck`** — pipes the TypeScript compiler's own diagnostics (`TS2322`, `TS6133`, `TS2307`, ...) through oxlint, so `oxlint` reports type errors alongside lint violations

```ts
import { base, typeAware, unicorn } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base(), typeAware(), unicorn()],
})
```

> [!IMPORTANT]
> `typeAware` and `typeCheck` are **root-config-only** options. Oxlint will error if either is set in a nested (per-package) config file. Always place `typeAware()` in the root config only.

Each package's own `tsconfig.json` is auto-detected by oxlint — no extra configuration needed.

#### Do I still need a separate `tsc --noEmit` step?

Short answer: **yes, keep it.** With `typeCheck` enabled, oxlint already surfaces tsc diagnostics for the files it lints, so during local development you'll usually catch type errors from `lint` alone. But a dedicated `typecheck` script is still worth keeping because:

- **Different file scope.** `tsc --noEmit` honors the tsconfig's `include` / `exclude`. `oxlint` walks the filesystem by its own rules and honors `ignorePatterns`. The two sets overlap but are not identical — a file covered by tsconfig but excluded from lint (or vice versa) will only be checked by one of them.
- **Project-level diagnostics.** tsc catches errors that aren't attached to a single source file: `tsconfig.json` misconfiguration (`TS5xxx`), broken project `references`, `paths` alias typos. Per-file type-aware linting can't see these.
- **Clearer CI failures.** Running `typecheck` and `lint` as separate steps makes it obvious whether a red build is a type error or a lint rule violation.

### Monorepo (nested configs)

Oxlint supports [nested configuration](https://oxc.rs/docs/guide/usage/linter/nested-config.html) for monorepos. Each package can have its own `oxlint.config.ts` that extends the root config and adds package-specific presets.

#### Root config

Keep shared baseline and `typeAware()` at the root:

```ts
// oxlint.config.ts (root)
import { base, typeAware, unicorn, depend } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base(), typeAware(), unicorn(), depend()],
})
```

#### Package configs

```ts
// packages/web/oxlint.config.ts
import rootConfig from '../../oxlint.config.ts'
import { reactVite, tanstackRouter, vitest, tailwind } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [rootConfig, reactVite(), tanstackRouter(), vitest(), tailwind()],
})
```

```ts
// packages/api/oxlint.config.ts
import rootConfig from '../../oxlint.config.ts'
import { node, nestjs, drizzle, vitest } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [rootConfig, node(), nestjs(), drizzle(), vitest()],
})
```

> [!TIP]
> Packages without their own `oxlint.config.ts` automatically use the root config — no setup needed for packages that only need the shared baseline.

> [!WARNING]
> Passing `-c` or `--config` explicitly on the CLI **disables** nested config lookup. Let oxlint auto-detect configs by running without `-c`.

## Format (Oxfmt)

Create `oxfmt.config.ts`:

```ts
import { format } from '@hooshid/ox-config/format'
import { defineConfig } from 'oxfmt'

export default defineConfig({ ...format() })
```

### Defaults

| Option               | Value                 |
| -------------------- | --------------------- |
| `semi`               | `false`               |
| `singleQuote`        | `true`                |
| `trailingComma`      | `all`                 |
| `printWidth`         | `100`                 |
| `tabWidth`           | `2`                   |
| `endOfLine`          | `lf`                  |
| Import sorting       | Grouped with newlines |
| Package.json sorting | Enabled               |

### Override

```ts
export default defineConfig({
  ...format({ printWidth: 120, semi: true }),
})
```

### Tailwind class sorting

```ts
import { format, tailwindFormat } from '@hooshid/ox-config/format'

export default defineConfig({
  ...format(),
  ...tailwindFormat({ stylesheet: 'src/styles/globals.css' }),
})
```

### Editor setup (recommended)

To keep line endings consistent and avoid the "final newline flip-flop" problem, add an `.editorconfig` at the root of every project:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
max_line_length = 100

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2
```

Most modern editors support EditorConfig natively or via a plugin. This ensures LF endings and a single trailing newline across every file.

## Scripts

```json
{
  "scripts": {
    "lint": "oxlint .",
    "lint:fix": "oxlint . --fix",
    "format": "oxfmt .",
    "format:check": "oxfmt --check .",
    "typecheck": "tsc --noEmit"
  }
}
```

## License

MIT