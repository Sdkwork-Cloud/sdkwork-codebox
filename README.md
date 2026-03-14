# sdkwork-codebox

<div align="center">

## CodeBox

Cross-platform desktop control center for Claude Code, Codex, Gemini CLI, OpenCode, and OpenClaw.

[![Repository](https://img.shields.io/badge/repo-sdkwork--codebox-181717?logo=github)](https://github.com/Sdkwork-Cloud/sdkwork-codebox)
[![Latest Release](https://img.shields.io/github/v/release/Sdkwork-Cloud/sdkwork-codebox?display_name=tag)](https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/Sdkwork-Cloud/sdkwork-codebox)
[![Downloads](https://img.shields.io/github/downloads/Sdkwork-Cloud/sdkwork-codebox/total?logo=github)](https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

English | [中文](README_ZH.md) | [日本語](README_JA.md) | [Changelog](CHANGELOG.md)

</div>

## Overview

CodeBox is a cross-platform desktop control plane for modern AI coding tools.
It unifies provider switching, product-specific configuration, runtime control,
workspace editing, prompts, skills, MCP, usage analytics, and deep-link import
across Claude Code, Codex, Gemini CLI, OpenCode, and OpenClaw.

The current product is structured around a clear information architecture:

- a left product rail for switching between supported tools
- top contextual tabs that change per product and remember the last valid view
- a dedicated settings center with a left vertical tab rail
- drawer-based provider workbenches that preserve shell context while editing
- an OpenClaw workspace explorer plus editor for long-lived project memory
- a runtime console for proxy, takeover, failover, usage, and diagnostics

The repository is organized as a `pnpm` workspace with a React + Vite renderer,
a Tauri native host, and feature packages under `packages/` so the product can
continue to grow without collapsing into one shell-level codepath.

## Why CodeBox

Modern AI coding workflows still fragment core operations:

- each CLI uses its own config files, directory layout, and environment rules
- switching providers often means editing JSON, TOML, or `.env` files manually
- prompts, skills, MCP servers, and usage data drift across products
- workspace memory and agent files are rarely surfaced as first-class UI
- platform-specific config roots and backup behavior are easy to misconfigure

CodeBox turns that into a coherent desktop system with explicit product
surfaces, safe persistence, reusable integrations, and a consistent visual
model.

## Experience Highlights

- Product shell with a left app rail, contextual header tabs, and product-aware
  fallback behavior when a previously selected tab is not available.
- Provider workbench drawers for add and edit flows, with app-specific and
  universal entry points, better width usage, and less long-form scrolling.
- OpenClaw workspace tooling with a file explorer, daily-memory search, editor
  tabs, and dedicated surfaces for environment variables, tool permissions, and
  agent defaults.
- Runtime console that keeps proxy, takeover, failover, usage, and diagnostics
  in one navigable area instead of spreading operational state across pages.
- Settings center that separates Appearance, General, Data and Sync,
  Directories, Advanced, and About into a dedicated left-side settings layout.
- Deep-link import for providers, MCP, prompts, and skills, including
  multi-product provider import when the link does not lock a target product.
- Cross-platform config persistence standardized on `~/.sdkwork/codebox`
  including `%USERPROFILE%\\.sdkwork\\codebox` on Windows.

## Screenshots

| Product Shell                                          | Settings Center                                           |
| ------------------------------------------------------ | --------------------------------------------------------- |
| ![Product Shell](assets/screenshots/product-shell.svg) | ![Settings Center](assets/screenshots/control-center.svg) |

| Workspace Editor                                             | Provider Workbench                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| ![Workspace Editor](assets/screenshots/workspace-editor.svg) | ![Provider Workbench](assets/screenshots/provider-workbench.svg) |

## Deep Link Import

CodeBox supports `codebox://` links for provider, MCP, prompt, and skill
imports.

- Provider links can prefill provider name, endpoint, API key, and metadata.
- Links may either lock a single target product or let the user select multiple
  target products during import.
- Embedded or remote config payloads can be merged before the final save step,
  so imported providers behave like native CodeBox-managed entries.

## Downloads

Prebuilt desktop packages are published on GitHub Releases:

- Windows: MSI installer and portable ZIP
- macOS: ZIP bundle and updater tarball
- Linux x86_64 / arm64: AppImage, `.deb`, and `.rpm`

Latest downloads:

```text
https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest
```

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
- [Release Guide](docs/releasing.md)
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
