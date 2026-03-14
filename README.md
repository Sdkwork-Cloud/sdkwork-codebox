# sdkwork-codebox

<div align="center">

## CodeBox

Cross-platform desktop control center for Claude Code, Codex, Gemini CLI, OpenCode, and OpenClaw.

[![Repository](https://img.shields.io/badge/repo-sdkwork--codebox-181717?logo=github)](https://github.com/Sdkwork-Cloud/sdkwork-codebox)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/Sdkwork-Cloud/sdkwork-codebox)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

English | [中文](README_ZH.md) | [日本語](README_JA.md) | [Changelog](CHANGELOG.md)

</div>

## Overview

CodeBox is an all-in-one desktop workspace for managing AI coding toolchains.
It gives teams and individual developers a unified control plane for provider
switching, runtime settings, proxy and failover, usage analytics, workspace
files, prompts, skills, MCP servers, and session data across multiple coding
assistants.

The repository is organized as a `pnpm` workspace with a React + Vite renderer,
Tauri native host, and feature packages under `packages/` for long-term
maintainability.

## Why This Repository Exists

Modern AI coding workflows are fragmented:

- each CLI tool uses different config files and environment conventions
- switching providers often means editing JSON, TOML, or `.env` files manually
- shared assets such as prompts, skills, MCP servers, and usage tracking are
  usually scattered across tools
- platform-specific paths and backup behavior are easy to get wrong

CodeBox turns that into a coherent product experience with visual management,
safe persistence, multi-product switching, and a consistent architecture.

## Key Capabilities

- Unified product control center for Claude Code, Codex, Gemini CLI, OpenCode,
  and OpenClaw
- Provider presets, provider switching, and cross-product configuration editing
- Settings center with product-specific tabs and configuration views
- Local proxy, failover, takeover, and usage inspection workflows
- MCP, prompts, skills, and deep-link import flows
- Workspace and session management for products that expose local project files
- Cross-platform configuration strategy based on `~/.sdkwork/codebox`
- Tauri-backed local storage, backup, native integration, and updater flows

## Product Scope

CodeBox focuses on two layers at the same time:

1. End-user desktop experience

- visual settings center
- provider and runtime operations
- usage dashboards and logs
- file/workspace editing

2. Maintainable engineering architecture

- root app shell kept thin
- reusable business logic moved into feature packages
- consistent package naming and dependency direction
- source alias based package composition in development

## Screenshots

| Main Interface                                    | Add Provider                                   |
| ------------------------------------------------- | ---------------------------------------------- |
| ![Main Interface](assets/screenshots/main-en.png) | ![Add Provider](assets/screenshots/add-en.png) |

## Repository Architecture

This workspace follows the architecture standard defined in
[ARCHITECT.md](ARCHITECT.md).

- `src/`: app shell, startup, top-level composition
- `src-tauri/`: native host, filesystem access, persistence, OS integration
- `packages/sdkwork-codebox-*`: reusable feature packages
- `tests/`: unit, integration, hook, shell, and utility coverage
- `docs/`: user manual, release notes, architecture, and design artifacts

### Package Naming Standard

- directory names stay filesystem-oriented: `packages/sdkwork-codebox-*`
- npm package names use the scoped form: `@sdkwork/codebox-*`
- internal workspace dependencies must use `workspace:*`

Representative packages:

- `@sdkwork/codebox-types`: shared domain contracts
- `@sdkwork/codebox-commons`: shared UI, hooks, and utilities
- `@sdkwork/codebox-core`: APIs, runtime abstractions, platform services
- `@sdkwork/codebox-provider`: provider management flows
- `@sdkwork/codebox-settings`: settings center and environment management
- `@sdkwork/codebox-proxy`: proxy and failover features
- `@sdkwork/codebox-usage`: usage dashboards and request inspection
- `@sdkwork/codebox-workspace`: sessions and workspace file experiences
- `@sdkwork/codebox-integration`: MCP, prompts, skills, and deep-link workflows

## Project Lineage

`sdkwork-codebox` is evolved from `cc-switch`.

This repository keeps the original idea of managing AI coding tool
configurations in one place, then expands it into a broader desktop product and
monorepo architecture centered on CodeBox.

Key directions of the refactor include:

- rebranding the product and workspace around CodeBox
- restructuring the renderer into feature packages
- standardizing configuration paths and platform behavior
- expanding settings, provider, proxy, workspace, and usage workflows
- improving product consistency, maintainability, and visual system design

## Special Thanks

Special thanks to the original `cc-switch` project, its authors, and
contributors.

CodeBox is not presented as a disconnected rewrite. It is built on top of the
ideas, exploration, and implementation foundation established by `cc-switch`,
and this lineage is intentionally acknowledged in the repository.

## Configuration and Data

The default local configuration root is standardized to:

```text
~/.sdkwork/codebox
```

Platform mapping:

- Linux: `~/.sdkwork/codebox`
- macOS: `~/.sdkwork/codebox`
- Windows: `%USERPROFILE%\\.sdkwork\\codebox`

Typical contents:

- `codebox.db`: main SQLite data store
- `settings.json`: local device-level preferences
- `backups/`: rotated backup snapshots
- `skills/`: installed skill assets

## Development

### Prerequisites

- Node.js 20+
- `pnpm`
- Rust toolchain
- Tauri build prerequisites for your platform

### Install

```bash
pnpm install
```

### Run

```bash
pnpm dev
```

Renderer only:

```bash
pnpm dev:renderer
```

### Verify

```bash
pnpm typecheck
pnpm typecheck:packages
pnpm test:unit
```

### Build

```bash
pnpm build
pnpm build:packages
```

## Documentation

- [Architecture Standard](ARCHITECT.md)
- [Repository Guidelines](AGENTS.md)
- [User Manual](docs/user-manual/en/README.md)
- [Release Notes](docs/release-notes)
- [Changelog](CHANGELOG.md)

## Release Repository

Primary repository:

```text
https://github.com/Sdkwork-Cloud/sdkwork-codebox
```

## License

This project is released under the MIT License unless a subdirectory states
otherwise.
