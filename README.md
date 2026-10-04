# @hooshid/ox-config

Shared Oxlint + Oxfmt presets for my projects — one install for lint and format.

## Install

```bash
pnpm add -D @hooshid/ox-config oxlint oxfmt
```

## Usage

### Oxlint

Create `oxlint.config.ts` in your project root:

```ts
import {
  base,
  unicorn,
  depend,
  react,
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
    react(),
    tanstackRouter(),
    tailwind(),
    vitest(),
  ],
})
```

### Oxfmt

Create `oxfmt.config.ts`:

```ts
import { format, tailwindFormat } from '@hooshid/ox-config/format'
import { defineConfig } from 'oxfmt'

export default defineConfig({
  ...format(),
  ...tailwindFormat({ stylesheet: 'src/styles/globals.css' }),
})
```

## Available Presets

### `@hooshid/ox-config/lint`

| Preset | Purpose |
| :--- | :--- |
| `base()` | TypeScript + Import rules — always include first |
| `unicorn()` | Code quality rules |
| `depend()` | Dependency optimization |
| `typeAware()` | Type-aware rules via tsgolint |
| `react()` | React + react-refresh |
| `tanstackRouter()` | TanStack Router rules |
| `tailwind()` | Tailwind class rules |
| `vitest()` | Vitest test rules |
| `node()` | Node.js environment |
| `promise()` | Promise rules |
| `nestjs()` | NestJS rules |
| `drizzle()` | Drizzle ORM rules |

### `@hooshid/ox-config/format`

| Export | Purpose |
| :--- | :--- |
| `format()` | Base formatting config |
| `tailwindFormat()` | Tailwind class sorting |

## License

MIT