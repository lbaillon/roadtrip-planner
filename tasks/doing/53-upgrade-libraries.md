# Global cleanup (multiple goals)

source : <https://trello.com/c/Yv1XfwmS/53-upgrade-libraries>

## Purpose

The goal here is to take a critical look at our codebase and assess our choices. Is there unnecessary complexity, can we reduce duplication, is it easy to comprehend and what can we do better?

## Description

There are several paths to explore here. The first is a general assessment of our whole codebase and what could be done better, with an emphasis on how to simplify things and make it easy to manage in the future. The second is to upgrade our libraries and make sure everything works correctly. I am especially motivated to upgrade Vite with the latest release of Vite 8.0. Third and finally, I want to improve our design system. For example, I want all colors and general settings to be defined in `:root` in index.css so that CSS variables are used in the rest of the code. Also, having the color in the name defeats the purpose of naming them with primary/secondary/success/error, their names should be agnostic of the color to allow an easy switch between themes. There are more things to do than just that, be critical and explore the best ways to improve our design system.

## Notes

Command `npx npm-check-updates -u` may be used to upgrade our libraries.

---

## Implementation Plan

### Decisions

- CSS variable naming: no prefix (e.g. `--primary`, `--error`). Only theme-level tokens in `:root` — colors, global typography, and any value that a theme switch would need to change. Component-specific values (margins, component widths, etc.) stay in their own `.module.css`.
- Responsive/mobile is in scope: improve media queries, prefer `rem` over `px` where relevant.
- Library upgrades: run `npx npm-check-updates -u`, validate with `pnpm lint` and `pnpm type-check`, fix any breakage.
- TypeScript: unify all packages to the latest version, defined once in the root `package.json`.

---

### Phase 1 — Unify TypeScript at the root

**Goal:** single source of truth for the TypeScript version, no drift between packages.

1. Run `npm show typescript version` to find the latest stable version.
2. In the root `package.json`, set TypeScript as a `devDependency` at the latest version.
3. Remove the `typescript` devDependency from `packages/api/package.json` and `packages/shared/package.json` (it is already at the right version in `packages/web`).
4. Run `pnpm install` to reconcile the lockfile.
5. Run `pnpm type-check` to confirm nothing broke.

---

### Phase 2 — Upgrade all libraries

**Goal:** bring all dependencies up to date, with special focus on Vite.

1. At the monorepo root, run `npx npm-check-updates -u` to rewrite all `package.json` files with the latest versions (review the diff before committing).
2. Run `pnpm install`.
3. Run `pnpm type-check` and `pnpm lint` — fix any type errors or lint violations introduced by the upgrades.
4. Start the dev server (`pnpm dev`) and do a quick smoke-test of key features (map, auth, GPX upload).
5. Check Vite's migration guide for any config changes required (plugin API, build options, etc.) and update `vite.config.ts` accordingly.
6. Commit the upgrade as its own standalone commit for easy rollback if needed.

---

### Phase 3 — Design system refactor

**Goal:** all theme-level values in `:root`, semantic and color-agnostic names, consistent use throughout.

#### 3a. Rename and expand CSS variables in `index.css`

Rename existing variables to semantic, color-agnostic names:

| Current name         | New name          |
|----------------------|-------------------|
| `--primary-green`    | `--primary`       |
| `--secondary-green`  | `--secondary`     |
| `--primary-grey`     | `--muted`         |
| `--secondary-grey`   | `--surface`       |
| `--error-red`        | `--error`         |
| `--warning-orange`   | `--warning`       |
| `--info-blue`        | `--info`          |

Evaluate whether to add `--primary-dark` / `--primary-light` tints based on actual usage across components (check if any component currently hard-codes a darker/lighter variant of the primary color).

Add global typography tokens for values repeated across components:

```css
:root {
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-size-base: 1rem;
  --font-size-sm: 0.875rem;
  --font-size-lg: 1.125rem;
  --line-height-base: 1.6;
  --border-radius-base: ...;  /* if a consistent radius is used across components */
}
```

Only add a token if the value is genuinely reused across multiple components or constitutes a thematic choice.

#### 3b. Update all references

1. Search all `.module.css` files for hard-coded color values and old variable names — replace with the new variables.
2. Check `.tsx` components for any inline styles using old variable names via `style=` props.
3. Verify the Vite PWA manifest `themeColor` (`#184c45`) still matches `--primary` after renaming.

---

### Phase 4 — Responsive improvements

**Goal:** ensure the app is usable on mobile without breaking the existing desktop grid.

1. Audit the CSS grid layout in `MainLayout.module.css` — identify breakpoints where the 12-column grid should collapse.
2. Add `@media` queries for at least two breakpoints (e.g. `< 768px` for mobile, `< 1024px` for tablet) in layout files.
3. Replace `px` with `rem` for font sizes and spacing values that should scale with user preferences — scan `.module.css` files for `font-size`, `padding`, `margin`, and `gap` in `px`.
4. Avoid changing structural pixel values (e.g. `--header-height`, pixel-perfect map positioning) that should not scale.

---

### Phase 5 — General codebase cleanup

**Goal:** reduce complexity, improve consistency, remove dead code.

1. **TypeScript strictness**: now that all packages share the same TypeScript version, verify that strict mode is consistently enabled in every `tsconfig.json`.
2. **Dead code / unused imports**: run `pnpm lint` with the existing ESLint config and fix all warnings. Check if any components or hooks are unused.
3. **API error handling consistency**: the API has a `route-handler.ts` wrapper and an `errors/` directory — verify the pattern is used uniformly across all routes and no route does ad-hoc `try/catch` outside the wrapper.
4. **Shared types completeness**: check if any type is duplicated between `packages/api` and `packages/web` that should live in `packages/shared`.
5. Quick review of `packages/api/src/services/` for any obvious refactoring opportunities (noted: `uploader.ts` was recently changed from class to stateless functions — confirm the pattern is consistent with other services).
6. Run `pnpm format` at the end to ensure consistent formatting across all modified files.
