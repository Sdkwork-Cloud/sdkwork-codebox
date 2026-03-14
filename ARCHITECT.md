# CodeBox Architecture Standard

## Purpose

This document is the authoritative architecture baseline for the CodeBox desktop
settings workspace. It defines:

- how the monorepo is partitioned
- what each package is responsible for
- which dependency directions are allowed
- how package identities must be named
- how the root app shell composes package modules

The goal is to keep the workspace predictable, independently evolvable, and
safe to refactor as product capabilities continue to grow.

## Core Principles

- Keep the root app thin. `src/` is a composition layer, not a business logic dump.
- Keep package boundaries explicit. Each package owns one clear responsibility.
- Keep dependency direction one-way. Lower layers never depend on higher layers.
- Keep package identities stable. Filesystem paths and npm package names must be
  standardized and intentional.
- Prefer shared abstractions over copy-paste. If a concern is reused across
  multiple business modules, it belongs in a lower layer.

## Workspace Layout

```text
sdkwork-desktop-settings/
├── src/                 # app shell, startup, route/layout composition
├── packages/            # reusable workspace packages
├── src-tauri/           # desktop-native Rust host and commands
├── tests/               # Vitest + integration coverage
├── docs/                # architecture, plans, manuals, release notes
├── package.json         # root scripts only
├── pnpm-workspace.yaml  # workspace package registration
├── tsconfig.json        # root TS config + alias surface
├── workspace.aliases.ts # alias mapping for app/package source imports
└── vite.config.ts       # renderer build orchestration
```

## Naming Standard

### Directory Names

Package directories remain filesystem-oriented and live under `packages/`:

- `packages/sdkwork-codebox-types`
- `packages/sdkwork-codebox-i18n`
- `packages/sdkwork-codebox-commons`
- `packages/sdkwork-codebox-core`
- `packages/sdkwork-codebox-provider`
- `packages/sdkwork-codebox-settings`
- `packages/sdkwork-codebox-proxy`
- `packages/sdkwork-codebox-usage`
- `packages/sdkwork-codebox-workspace`
- `packages/sdkwork-codebox-integration`

Directory names are chosen for local readability and path stability.

### npm Package Names

All workspace package identities must use the scoped npm format:

```text
@sdkwork/codebox-<module>
```

Examples:

- `@sdkwork/codebox-commons`
- `@sdkwork/codebox-core`
- `@sdkwork/codebox-provider`
- `@sdkwork/codebox-settings`

Rules:

- `@sdkwork` is the fixed organization scope
- `codebox` is the fixed project namespace
- `<module>` describes one bounded capability
- internal workspace dependencies must always use `workspace:*`
- unscoped names such as `sdkwork-codebox-commons` are not valid package ids

## Package Map

### Foundation Layer

- `@sdkwork/codebox-types`
  Responsibility: shared domain contracts, DTOs, enums, and cross-package type surfaces.

- `@sdkwork/codebox-i18n`
  Responsibility: translation resources, i18n bootstrap, and locale-level helpers.

- `@sdkwork/codebox-commons`
  Responsibility: shared UI primitives, common components, shared hooks, icons,
  config helpers, and renderer-only utilities.

- `@sdkwork/codebox-core`
  Responsibility: runtime abstractions, APIs, query helpers, platform services,
  shared schemas, contexts, and cross-cutting integration logic that is not
  business-module specific.

### Business Capability Layer

- `@sdkwork/codebox-provider`
  Responsibility: provider management, provider forms, provider switching,
  provider-specific editors, and provider domain utilities.

- `@sdkwork/codebox-settings`
  Responsibility: application settings UX, directory management, import/export,
  theme settings, system settings, and settings orchestration hooks.

- `@sdkwork/codebox-proxy`
  Responsibility: local proxy controls, failover settings, circuit breaker
  configuration, proxy status views, and proxy-specific data flow.

- `@sdkwork/codebox-usage`
  Responsibility: usage dashboards, request logs, pricing, scripts, and usage analytics UI.

- `@sdkwork/codebox-workspace`
  Responsibility: workspace file browser/editor flows, session management,
  workspace-derived views, and workspace-level interaction components.

- `@sdkwork/codebox-integration`
  Responsibility: MCP, prompts, skills, deep-link import, and integration-facing
  workflows that bridge CodeBox with external tools or runtimes.

## Dependency Direction

Allowed direction:

```text
types
  -> i18n / commons
  -> core
  -> business packages
  -> app shell
```

Concrete rules:

- `@sdkwork/codebox-types` must not depend on any higher layer.
- `@sdkwork/codebox-i18n` should remain leaf-like and must not depend on business packages.
- `@sdkwork/codebox-commons` may depend on `@sdkwork/codebox-types` and shared third-party UI/runtime libraries.
- `@sdkwork/codebox-core` may depend on `@sdkwork/codebox-types`,
  `@sdkwork/codebox-i18n`, and `@sdkwork/codebox-commons`.
- Business packages may depend on `@sdkwork/codebox-types`,
  `@sdkwork/codebox-i18n`, `@sdkwork/codebox-commons`, and `@sdkwork/codebox-core`.
- Business-to-business dependencies should be avoided unless the ownership
  boundary is explicit and stable. Default to extracting shared behavior
  downward instead.
- No package may depend on root `src/`.

## Shell Composition Rules

Root `src/` is responsible for:

- app bootstrap
- shell layout
- top-level route/view composition
- global providers
- query/theme wiring
- startup error handling

Root `src/` must not become the primary home for:

- reusable business components
- reusable business hooks
- provider-specific workflows
- integration features
- proxy or usage feature logic

If logic is reused or belongs to a product capability, move it into the owning package.

## Native Boundary Rules

`src-tauri/` is the desktop-native boundary. It owns:

- filesystem access
- OS integration
- background process control
- database and backup persistence
- native configuration resolution
- deep-link/native command bridges

Frontend packages should consume native capability through `core` APIs and
query helpers instead of embedding Tauri assumptions throughout business code.

## Import Strategy

The workspace uses source aliases so package code can be composed without
publishing artifacts. The alias layer in `tsconfig.json` and
`workspace.aliases.ts` is the stable import contract for renderer code.

Rules:

- Prefer alias imports such as `@/components/*`, `@/hooks/*`, `@/lib/*`.
- Do not deep-import across unrelated package internals unless the alias map
  intentionally exposes that surface.
- Keep each package exporting its public API from `src/index.ts`.
- Avoid ad hoc relative imports that jump across package boundaries.

## Package Manifest Standard

Every package must define:

- scoped package name using `@sdkwork/codebox-<module>`
- `private: true`
- `type: module`
- `main`, `module`, and `types` pointing to `src/index.ts`
- stable `exports`
- `dev`, `build`, and `typecheck` scripts

Recommended manifest shape:

```json
{
  "name": "@sdkwork/codebox-commons",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    },
    "./*": {
      "import": "./src/*",
      "types": "./src/*"
    }
  },
  "dependencies": {
    "@sdkwork/codebox-types": "workspace:*"
  },
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  }
}
```

## Governance

- One package, one main responsibility.
- Public exports should be explicit and stable.
- Shared domain contracts belong in `@sdkwork/codebox-types`.
- Shared UI and renderer helpers belong in `@sdkwork/codebox-commons`.
- Cross-cutting runtime logic belongs in `@sdkwork/codebox-core`.
- Product-specific logic belongs in the owning business package.
- Do not create “misc” packages. Extract by responsibility, not by leftover code.
- Prefer moving duplicated logic downward into a stable lower layer over adding
  direct business-package coupling.

## Current Repository Enforcement

This repository must follow these concrete standards:

- directories remain `packages/sdkwork-codebox-*`
- package names must be `@sdkwork/codebox-*`
- internal package dependencies must use `workspace:*` with scoped names
- AGENTS and architecture docs must describe the scoped naming standard
- validation should include typecheck and targeted tests whenever package names
  or boundary rules are changed
