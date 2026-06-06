# Repository Guidelines

<!-- SDKWORK-AGENTS-GENERATED: v1 -->

## SDKWORK Soul

Read `../sdkwork-specs/SOUL.md` before executing tasks in this root. Follow specs before memory, dictionary before context, stop on ambiguity, and evidence before completion.

## SDKWORK Standards

Canonical SDKWORK specs path from this root:

- `../sdkwork-specs/README.md`
- `../sdkwork-specs/SOUL.md`
- `../sdkwork-specs/AGENTS_SPEC.md`
- `../sdkwork-specs/CODE_STYLE_SPEC.md`
- `../sdkwork-specs/NAMING_SPEC.md`

Do not copy root standard text into this repository. If these relative paths do not resolve, stop and report the broken workspace layout.

## Application Identity

No `sdkwork.app.config.json` is present at this root. If the task changes application behavior, runtime config, SDK wiring, release metadata, or app-owned capabilities, first locate the nearest application root that has this manifest or add one according to the root specs.

## Local Dictionary Structure

- `AGENTS.md`: local agent entrypoint and relative SDKWORK spec index.
- `CLAUDE.md`: Claude Code compatibility shim that points to `AGENTS.md` and must not duplicate rules.
- `GEMINI.md`: Gemini CLI compatibility shim that points to `AGENTS.md` and must not duplicate rules.
- `CODEX.md`: Codex compatibility shim that points to `AGENTS.md` and must not duplicate rules.
- `sdkwork.app.config.json`: not present here; required for application roots.
- `.sdkwork/`: reserved local dictionary folder; create only for local skills, plugins, manifests, or AI workspace metadata.
- `specs/`: not present here; use when local contracts need to narrow root standards.
- `sdks/`: not present here; use only for SDK authority or generation surfaces.
- `package.json`, `pnpm-workspace.yaml`: language/build manifests.
- Local directories to inspect first when relevant: `.github/`, `assets/`, `codebox-main/`, `docs/`, `flatpak/`, `packages/`, `scripts/`, `skills/`, `src/`, `src-tauri/`, `tests/`.

## Spec Resolution Order

1. Read this `AGENTS.md` and any nearer component-level `AGENTS.md`.
2. Read `sdkwork.app.config.json` when present.
3. Read local `specs/README.md` and `specs/component.spec.json` when present.
4. Read local `.sdkwork/README.md`, `.sdkwork/skills/`, and `.sdkwork/plugins/` when relevant.
5. Read `../sdkwork-specs/README.md` and the task-specific root specs.
6. Inspect implementation files only after the relevant dictionary entries are clear.

## Required Specs By Task Type

- Agent/workflow changes: `../sdkwork-specs/SOUL.md`, `../sdkwork-specs/AGENTS_SPEC.md`, `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`.
- Any code change: `../sdkwork-specs/CODE_STYLE_SPEC.md`, `../sdkwork-specs/NAMING_SPEC.md`, plus only the touched language/framework spec.
- Rust code: `../sdkwork-specs/RUST_CODE_SPEC.md` and `../sdkwork-specs/RUST_RPC_SPEC.md` when RPC is touched.
- Java/Spring code: `../sdkwork-specs/JAVA_CODE_SPEC.md` and `../sdkwork-specs/WEB_BACKEND_SPEC.md` when HTTP backend behavior is touched.
- TypeScript/Node code: `../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`.
- Frontend/UI code: `../sdkwork-specs/FRONTEND_CODE_SPEC.md`, `../sdkwork-specs/FRONTEND_SPEC.md`, `../sdkwork-specs/UI_ARCHITECTURE_SPEC.md`, and exactly one detailed UI architecture spec.
- API, SDK, database, runtime, security, and deployment changes must follow the task matrix in `../sdkwork-specs/README.md`.

Language-specific specs are on-demand; do not load Rust, Java, TypeScript, and frontend specs for unrelated tasks.

## Code Style Rules

Read `../sdkwork-specs/CODE_STYLE_SPEC.md` and `../sdkwork-specs/NAMING_SPEC.md` before code changes.

Load language specs only when touched: Rust uses `RUST_CODE_SPEC.md`, Java/Spring uses `JAVA_CODE_SPEC.md`, TypeScript/Node uses `TYPESCRIPT_CODE_SPEC.md`, and frontend/UI uses `FRONTEND_CODE_SPEC.md`.

For TypeScript or frontend code, prefer strict types, explicit package exports, colocated tests, and existing package/module boundaries.

## Build, Test, and Verification

Run commands from this directory unless a command explicitly targets another path.

- `pnpm install`: install dependencies for this workspace or package.
- `pnpm run dev`: start the local development server or app shell.
- `pnpm run build`: build production artifacts or package outputs.
- `pnpm run test:unit`: run the configured test suite for this scope.
- `pnpm run lint`: run lint and static checks.
- `pnpm run typecheck`: run TypeScript type checks.
- `pnpm run format`: apply or verify formatting.
- `pnpm run format:check`: apply or verify formatting.
- `pnpm run build:debug-console`: build production artifacts or package outputs.
- `pnpm run build:packages`: build production artifacts or package outputs.
- `pnpm run build:renderer`: build production artifacts or package outputs.
- `pnpm run test:unit:watch`: run the configured test suite for this scope.
- `pnpm run typecheck:packages`: run TypeScript type checks.

Run the narrowest relevant check first, then broader verification when API contracts, SDK generation, persistence, security, or cross-package boundaries change.

## Agent Execution Rules

Use the convention dictionary instead of broad context loading. Do not hand-edit generated SDK output unless the task is explicitly about generated artifacts and the source contract is verified. Do not replace generated SDK integration with raw HTTP. Keep changes scoped to the owning module, package, crate, or app root. Record the exact verification commands and important outputs before reporting completion.

## Human Review Rules

Request human review before breaking SDKWORK standards, changing public naming, altering security/auth behavior, changing database migrations or production deployment config, deleting data/files, or changing generated SDK ownership. Surface unresolved spec paths, app identity conflicts, component ownership conflicts, and API authority ambiguity instead of guessing.

## Existing Local Guidance

The repository-specific guidance below was preserved from the previous `AGENTS.md`. If it conflicts with the SDKWORK sections above or with `../sdkwork-specs/`, the SDKWORK standards win.

### Project Structure & Module Organization

This project is a `pnpm` workspace desktop app built with React, Vite, and Tauri. Keep root `src/` limited to the app shell, startup, and layout composition. Reusable implementation belongs in `packages/`, especially:

- `packages/sdkwork-codebox-commons` (`@sdkwork/codebox-commons`): shared UI, hooks, utils
- `packages/sdkwork-codebox-core` (`@sdkwork/codebox-core`): APIs, query helpers, platform/runtime code
- `packages/sdkwork-codebox-*` (`@sdkwork/codebox-*`): business modules such as provider, settings, proxy, usage, workspace
- `src-tauri/`: Rust host integration and native packaging
- `tests/`: Vitest suites (`components/`, `hooks/`, `integration/`, `shell/`, `utils/`)
- `assets/` and `docs/`: screenshots, partner assets, manuals, release notes

Do not move reusable business logic back into root `src/`; follow `ARCHITECT.md`.

### Build, Test, and Development Commands

- `pnpm dev`: run the Tauri desktop app in development mode
- `pnpm dev:renderer`: run the Vite renderer only
- `pnpm build`: build the desktop application
- `pnpm build:packages`: build all workspace packages under `packages/`
- `pnpm typecheck`: run root TypeScript checks
- `pnpm typecheck:packages`: run package-level type checks
- `pnpm test:unit`: run the Vitest suite
- `pnpm test:unit:watch`: run tests in watch mode
- `pnpm format` / `pnpm format:check`: apply or verify Prettier formatting

### Coding Style & Naming Conventions

Use TypeScript with 2-space indentation, ES modules, and strict typing. Prefer functional React components and colocate shell-only UI in `src/shell`. Package names must follow `@sdkwork/codebox-<module>`. Keep files and exported symbols descriptive: `ProviderList.tsx`, `useShellEffects.ts`, `openclawKeys.ts`. Format with Prettier before submitting.

### Testing Guidelines

Tests use `Vitest`, `@testing-library/react`, `jsdom`, and `msw`. Place tests near their concern under `tests/` and name files `*.test.ts` or `*.test.tsx`. Cover shell navigation, provider workflows, and integration flows when changing layout or state wiring. Run targeted suites first, then `pnpm test:unit`. Exclude `backup/**` when running ad hoc Vitest commands.

### Commit & Pull Request Guidelines

Recent history follows Conventional Commit style, for example: `feat: add authHeader field...`, `fix: rename OpenCode API format label...`, `chore: bump version...`. Keep commits scoped and imperative. PRs should include a concise summary, linked issue if applicable, test results, and screenshots or recordings for UI changes.

### Architecture Notes

Respect dependency direction: `types -> commons/i18n -> core -> business modules -> app shell`. Packages must never depend on root `src/`. If a change affects composition only, prefer updating `src/App.tsx` and `src/shell/*` rather than package internals.
