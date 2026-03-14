# Repository Guidelines

## Project Structure & Module Organization

This project is a `pnpm` workspace desktop app built with React, Vite, and Tauri. Keep root `src/` limited to the app shell, startup, and layout composition. Reusable implementation belongs in `packages/`, especially:

- `packages/sdkwork-codebox-commons` (`@sdkwork/codebox-commons`): shared UI, hooks, utils
- `packages/sdkwork-codebox-core` (`@sdkwork/codebox-core`): APIs, query helpers, platform/runtime code
- `packages/sdkwork-codebox-*` (`@sdkwork/codebox-*`): business modules such as provider, settings, proxy, usage, workspace
- `src-tauri/`: Rust host integration and native packaging
- `tests/`: Vitest suites (`components/`, `hooks/`, `integration/`, `shell/`, `utils/`)
- `assets/` and `docs/`: screenshots, partner assets, manuals, release notes

Do not move reusable business logic back into root `src/`; follow `ARCHITECT.md`.

## Build, Test, and Development Commands

- `pnpm dev`: run the Tauri desktop app in development mode
- `pnpm dev:renderer`: run the Vite renderer only
- `pnpm build`: build the desktop application
- `pnpm build:packages`: build all workspace packages under `packages/`
- `pnpm typecheck`: run root TypeScript checks
- `pnpm typecheck:packages`: run package-level type checks
- `pnpm test:unit`: run the Vitest suite
- `pnpm test:unit:watch`: run tests in watch mode
- `pnpm format` / `pnpm format:check`: apply or verify Prettier formatting

## Coding Style & Naming Conventions

Use TypeScript with 2-space indentation, ES modules, and strict typing. Prefer functional React components and colocate shell-only UI in `src/shell`. Package names must follow `@sdkwork/codebox-<module>`. Keep files and exported symbols descriptive: `ProviderList.tsx`, `useShellEffects.ts`, `openclawKeys.ts`. Format with Prettier before submitting.

## Testing Guidelines

Tests use `Vitest`, `@testing-library/react`, `jsdom`, and `msw`. Place tests near their concern under `tests/` and name files `*.test.ts` or `*.test.tsx`. Cover shell navigation, provider workflows, and integration flows when changing layout or state wiring. Run targeted suites first, then `pnpm test:unit`. Exclude `backup/**` when running ad hoc Vitest commands.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commit style, for example: `feat: add authHeader field...`, `fix: rename OpenCode API format label...`, `chore: bump version...`. Keep commits scoped and imperative. PRs should include a concise summary, linked issue if applicable, test results, and screenshots or recordings for UI changes.

## Architecture Notes

Respect dependency direction: `types -> commons/i18n -> core -> business modules -> app shell`. Packages must never depend on root `src/`. If a change affects composition only, prefer updating `src/App.tsx` and `src/shell/*` rather than package internals.
