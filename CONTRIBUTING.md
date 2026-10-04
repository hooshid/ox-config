# Contributing Guide

This document explains how to develop, update, and release `@hooshid/ox-config`.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Using Changesets](#using-changesets)
- [Release Workflow](#release-workflow)
- [Available Scripts](#available-scripts)

---

## Prerequisites

Before you start, make sure you have:

| Tool        | Version | Notes                                                                 |
| :---------- | :------ | :-------------------------------------------------------------------- |
| **Node.js** | `>=20`  | Check with `node --version`                                           |
| **pnpm**    | `>=9`   | Install: `corepack enable && corepack prepare pnpm@latest --activate` |
| **Git**     | Latest  | —                                                                     |

---

## Development Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/hooshid/ox-config.git
cd ox-config
pnpm install
```

Verify everything works:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

---

## Project Structure

```
ox-config/
├── .changeset/           # Changesets config and pending changes
│   ├── config.json       # Changesets configuration
│   └── *.md              # Pending change descriptions
├── .github/
│   └── workflows/
│       ├── ci.yml        # Runs on PRs: typecheck, lint, build
│       └── release.yml   # Runs on main: creates release PR or publishes
├── src/
│   ├── format.ts         # Oxfmt presets
│   ├── lint.ts           # Oxlint presets
│   └── utils.ts          # Shared utilities and glob patterns
├── dist/                 # Build output (git-ignored)
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

---

## Making Changes

### 1. Create a branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make your changes

Edit files in `src/`. The two main entry points are:

- **`src/lint.ts`** — Oxlint presets (functions that return `OxlintConfig`)
- **`src/format.ts`** — Oxfmt presets

Every preset follows the same pattern:

```ts
export function myPreset(overrides?: Partial<OxlintConfig>): OxlintConfig {
  return preset({/* defaults */}, overrides)
}
```

The `preset()` helper merges `overrides` on top of `defaults` using `defu`, so user overrides always win.

### 3. Verify locally

```bash
pnpm typecheck    # TypeScript check
pnpm lint         # Lint the source
pnpm build        # Build the package
```

### 4. Test in a real project (optional but recommended)

Before publishing, you can test the package locally:

```bash
# In this repo:
pnpm build
pnpm link --global

# In a test project:
pnpm link --global @hooshid/ox-config
```

---

## Using Changesets

[Changesets](https://github.com/changesets/changesets) manages versioning and changelogs. **Every PR that changes the public API must include a changeset.**

### What needs a changeset?

| Change Type                                        | Needs Changeset? | Bump Type          |
| :------------------------------------------------- | :--------------- | :----------------- |
| Add a new preset or rule                           | ✅ Yes           | `minor`            |
| Change default rules for a preset                  | ✅ Yes           | `minor` or `major` |
| Fix a bug in an existing preset                    | ✅ Yes           | `patch`            |
| Add/update documentation                           | ❌ No            | —                  |
| Update internal dependencies                       | ❌ No            | —                  |
| Refactor without behavior change                   | ❌ No            | —                  |
| **Breaking change** (remove preset, rename export) | ✅ Yes           | `major`            |

### How to create a changeset

```bash
pnpm changeset
```

The CLI will ask three questions:

1. **Which packages would you like to include?**
   → Select `@hooshid/ox-config` with `Space`, then `Enter`

2. **Which kind of change is this for each package?**
   → Choose `patch`, `minor`, or `major`

3. **Please enter a summary for this change:**
   → Write a short, user-facing description

Example summary:

```
Add `tanstackStart()` preset with TanStack Start specific rules
```

A new file will be created in `.changeset/` (e.g., `.changeset/funny-cats-dance.md`):

```markdown
---
'@hooshid/ox-config': minor
---

Add `tanstackStart()` preset with TanStack Start specific rules
```

**Commit this file with your changes.** It will be consumed during the next release.

### Semantic versioning cheatsheet

| Current | `patch` | `minor` | `major` |
| :------ | :------ | :------ | :------ |
| `0.1.0` | `0.1.1` | `0.2.0` | `1.0.0` |
| `0.2.5` | `0.2.6` | `0.3.0` | `1.0.0` |
| `1.0.0` | `1.0.1` | `1.1.0` | `2.0.0` |

> **Note:** While the package is at `0.x.y`, `major` bumps follow a looser convention. Pre-1.0.0, a `minor` can include breaking changes.

---

## Release Workflow

Releases are **fully automated** via GitHub Actions and npm Trusted Publishing. No manual tokens or OTPs are required.

### The flow

```
1. You push changes + a changeset to a branch
   ↓
2. Open a PR → CI runs (typecheck, lint, build)
   ↓
3. Review and merge PR to `main`
   ↓
4. GitHub Action "Release" runs automatically
   ↓
5. Changesets opens a "chore: release" PR
   ├── Bumps version in package.json
   ├── Updates CHANGELOG.md
   └── Removes consumed changeset files
   ↓
6. Review and merge the "chore: release" PR
   ↓
7. GitHub Action "Release" runs again
   ├── Builds the package
   ├── Publishes to npm (via OIDC — no tokens!)
   ├── Creates a git tag (e.g., v0.2.0)
   └── Creates a GitHub Release
```

### What if I forget a changeset?

CI will still pass. However, the release PR won't include your change, and it won't be published until the next changeset is added.

**Fix:** Just create a new changeset in a follow-up PR.

### Skipping the changeset check

If your change doesn't affect the published output (docs, CI config, etc.), you can skip the changeset entirely. No action needed.

---

## Available Scripts

Run from the repository root:

| Script                   | Description                        |
| :----------------------- | :--------------------------------- |
| `pnpm build`             | Build the package with tsdown      |
| `pnpm dev`               | Build in watch mode                |
| `pnpm typecheck`         | Run `tsc --noEmit`                 |
| `pnpm lint`              | Lint source with oxlint            |
| `pnpm lint:fix`          | Lint and auto-fix                  |
| `pnpm format`            | Format with oxfmt                  |
| `pnpm format:check`      | Check formatting without writing   |
| `pnpm changeset`         | Create a new changeset             |
| `pnpm changeset:version` | Apply changesets and bump versions |
| `pnpm changeset:publish` | Publish to npm (used by CI)        |
| `pnpm release`           | Build + publish (used by CI)       |

---

## Troubleshooting

### `pnpm build` fails with missing module

Ensure you've run `pnpm install` and are on the correct Node.js version (`>=20`).

### `pnpm publish` fails with E403

You likely don't have a Bypass 2FA token. First publish requires it. See the [npm docs](https://docs.npmjs.com/about-access-tokens) for details on Granular Access Tokens.

### GitHub Action fails with "unauthorized"

Check that:

1. Trusted Publisher is configured on npmjs.com for this repo
2. The workflow filename is exactly `release.yml`
3. The `id-token: write` permission is set in the workflow

### How do I make a pre-release (e.g., `1.0.0-beta.1`)?

Use the `pre` mode in Changesets:

```bash
pnpm changeset pre enter beta
pnpm changeset
pnpm changeset:version
pnpm changeset pre exit
```

Then push and let CI handle the rest.

---

## Questions?

Open an issue: https://github.com/hooshid/ox-config/issues
