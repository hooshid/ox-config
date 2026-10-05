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
import { base, unicorn, depend, reactVite, tailwind } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base(), unicorn(), depend(), reactVite(), tailwind()],
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

| Preset      | Description                       |
| ----------- | --------------------------------- |
| `node()`    | Node.js specific rules            |
| `promise()` | Promise best practices (16 rules) |

#### Frontend

| Preset             | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `react()`          | React + React Hooks — core rules for any React setup            |
| `reactVite()`      | React + React Hooks + React Refresh (for Vite)                  |
| `nextjs()`         | Next.js rules + Core Web Vitals                                 |
| `tanstackRouter()` | TanStack Router — routing rules + route folder naming convention |
| `tanstackStart()`  | TanStack Start — server/client boundaries, SSR safety           |
| `tailwind()`       | Tailwind class consistency (better-tailwindcss plugin)          |

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

| Project type              | Presets to use                                    |
| ------------------------- | ------------------------------------------------- |
| Next.js                   | `nextjs()` + `react()`                            |
| Vite + React              | `reactVite()`                                     |
| TanStack Router (SPA)     | `reactVite()` + `tanstackRouter()`                |
| TanStack Start            | `reactVite()` + `tanstackRouter()` + `tanstackStart()` |
| Plain React (custom build)| `react()`                                         |

> `reactVite()` adds `eslint-plugin-react-refresh` to warn about incorrect fast-refresh patterns — use it for any Vite-based setup.

### React rules

The `react()` and `reactVite()` presets enable **~27 rules** covering:

- **Hooks (critical):** `rules-of-hooks`, `exhaustive-deps`
- **JSX correctness:** `jsx-key`, `jsx-no-duplicate-props`, `jsx-no-undef`, `jsx-no-target-blank`, `jsx-no-script-url`, `jsx-no-comment-textnodes`
- **JSX style:** `jsx-boolean-value`, `jsx-curly-brace-presence`, `jsx-fragments`, `jsx-pascal-case`, `self-closing-comp`, `hook-use-state`
- **Runtime safety:** `no-children-prop`, `no-danger-with-children`, `no-deprecated`, `no-direct-mutation-state`, `no-find-dom-node`, `no-is-mounted`, `no-render-return-value`, `no-string-refs`, `no-unknown-property`, `no-unsafe`, `require-render-return`, `void-dom-elements-no-children`

Modern React 17+ is assumed — `react/react-in-jsx-scope` and `react/jsx-uses-react` are off.

### TanStack Router

The `tanstackRouter()` preset loads [`@tanstack/eslint-plugin-router`](https://www.npmjs.com/package/@tanstack/eslint-plugin-router) and enforces file naming for the `routes/` folder.

```ts
import { base, reactVite, tanstackRouter, tailwind } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [base(), reactVite(), tanstackRouter(), tailwind()],
})
```

**Rules provided:**

- `tanstack-router/route-param-names` — validates `$param` names between route path and params
- `tanstack-router/create-route-property-order` — enforces property order in `createRoute()`

**File naming convention:**

All files inside a `routes/` folder must be **kebab-case**:

| Filename                    | Valid? | Notes                                  |
| --------------------------- | ------ | -------------------------------------- |
| `posts.tsx`                 | ✅     |                                        |
| `posts-index.tsx`           | ✅     |                                        |
| `about-page.tsx`            | ✅     |                                        |
| `posts.$postId.tsx`         | ✅     | exception: `$` dynamic params          |
| `_auth.tsx`                 | ✅     | exception: `_` pathless routes         |
| `__root.tsx`                | ✅     | exception: `_` prefix                  |
| `posts.index.tsx`           | ✅     | exception: multiple dots (file nesting)|
| `Posts.tsx`                 | ❌     | must be `posts.tsx`                    |
| `postsIndex.tsx`            | ❌     | must be `posts-index.tsx`              |
| `posts_index.tsx`           | ❌     | must be `posts-index.tsx`              |

> [!NOTE]
> Folder naming inside `routes/` is **not** covered by Oxlint (linters run file-by-file). To enforce kebab-case for folders, use a separate script or CI step.

### TanStack Start

The `tanstackStart()` preset adds rules for **server/client boundaries**, **server function safety**, and **SSR conventions**.

> [!IMPORTANT]
> This preset does **not** include `reactVite()` or `tanstackRouter()`. Add them in the correct order:
>
> ```ts
> extends: [base(), reactVite(), tanstackRouter(), tanstackStart(), tailwind(), vitest()]
> ```

**Rules added:**

- `no-async-promise-executor`, `consistent-return`, `no-empty-function`
- `import/no-nodejs-modules` — prevents Node.js APIs from leaking into client bundles
- `no-restricted-globals` for `window`/`document`/`localStorage`/`sessionStorage` in server files

**File scope conventions:**

| File pattern                                                    | Behavior                                              |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| `**/*.server.{ts,tsx}`, `**/server/**`, `**/server-fns/**`      | Node.js APIs allowed, browser globals forbidden       |
| `**/*.client.{ts,tsx}`, `**/components/**`                      | Node.js APIs forbidden                                |
| `**/routes/**`                                                  | Warning on direct `fetch()` — prefer loaders          |

**Example:**

```ts
import {
  base,
  unicorn,
  depend,
  reactVite,
  tanstackRouter,
  tanstackStart,
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
    tanstackStart(),
    tailwind({ entryPoint: 'src/styles/globals.css' }),
    vitest(),
  ],
})
```

### NestJS

> [!WARNING]
> NestJS must disable `typescript/consistent-type-imports` — NestJS DI uses runtime class references in constructor params, and without type-aware linting this rule incorrectly converts them to `import type`, breaking DI at runtime.

```ts
import { base, node, promise, nestjs, drizzle, vitest } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [
    base(),
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

**Yes, keep it.** With `typeCheck` enabled, `oxlint` already surfaces tsc diagnostics for the files it lints, so during local development you'll usually catch type errors from `lint` alone. But a dedicated `typecheck` script is still worth keeping because:

- **Different file scope.** `tsc --noEmit` honors the tsconfig's `include`/`exclude`. `oxlint` walks the filesystem by its own rules and honors `ignorePatterns`. The two sets overlap but are not identical.
- **Project-level diagnostics.** tsc catches errors that aren't attached to a single source file: `tsconfig.json` misconfiguration (`TS5xxx`), broken project `references`, `paths` alias typos.
- **Clearer CI failures.** Running `typecheck` and `lint` as separate steps makes it obvious whether a red build is a type error or a lint rule violation.

### Monorepo (nested configs)

Oxlint supports [nested configuration](https://oxc.rs/docs/guide/usage/linter/nested-config.html) for monorepos. Each package can have its own `oxlint.config.ts` that extends the root config and adds package-specific presets.

#### Root config

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
import { reactVite, tanstackRouter, tanstackStart, vitest, tailwind } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [rootConfig, reactVite(), tanstackRouter(), tanstackStart(), vitest(), tailwind()],
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
> Packages without their own `oxlint.config.ts` automatically use the root config.

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
| Ignore patterns      | Build outputs, lockfiles, generated files |

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

## Full-stack example (TanStack Start + NestJS)

```ts
// apps/web/oxlint.config.ts
import rootConfig from '../../oxlint.config.ts'
import { reactVite, tanstackRouter, tanstackStart, tailwind, vitest } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [
    rootConfig,
    reactVite(),
    tanstackRouter(),
    tanstackStart(),
    tailwind(),
    vitest(),
  ],
})
```

```ts
// apps/api/oxlint.config.ts
import rootConfig from '../../oxlint.config.ts'
import { node, promise, nestjs, drizzle, vitest } from '@hooshid/ox-config/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [rootConfig, node(), promise(), nestjs(), drizzle(), vitest()],
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

## License

MIT

## Sources

1. [Oxlint: Writing JS Plugins](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html)
3. [infra-code source](https://github.com/oNo500/infra-code/tree/master/packages/code-quality)