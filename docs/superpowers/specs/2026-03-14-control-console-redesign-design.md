# Control Console Redesign Design

**Date:** 2026-03-14

**Status:** Approved for planning

**Owner:** Codex

## Goal

Redesign the entire desktop application into a deep, cohesive, dark-first control console with a new information architecture, unified visual system, and clarified interaction model while preserving all existing functional behavior, business semantics, and outcomes.

The redesign must ship as a complete new structure in one cutover. It must not expose a mixed old/new shell to users. Internally, implementation may be phased, but the final delivered UI must feel like a single intentional product.

## Hard Constraints

1. No business capability may be removed.
2. No existing feature semantics may change.
3. Existing operations must still produce the same results.
4. This is a product and interaction redesign, not a business-logic rewrite.
5. Final delivery must be a complete new shell and structure, not a compatibility UI.
6. The visual system must reference `claw-studio` as the palette and theme standard.
7. Default experience is dark-first.
8. UI naming is mixed: Chinese-first, while retaining industry terms such as `Runtime`, `Extensions`, `MCP`, and `Skills`.

## Product Direction

The target product is a high-end desktop control console rather than a generic settings utility or a collection of feature pages.

The experience should feel:

- stable
- professional
- status-aware
- information-dense but legible
- visually premium without becoming decorative noise

The product must support multiple priorities at once:

- provider and product management
- runtime control and observability
- extensions and workflow configuration
- system-level desktop settings

## Non-Goals

This redesign does not aim to:

- invent new runtime features
- alter backend contracts or feature results
- redesign provider logic or sync logic at the business-rule level
- change persistence semantics unless needed to make the theme system a first-class setting

## Information Architecture

The new product is organized into four top-level domains.

### 1. 产品

Purpose: day-to-day product and provider operations.

Sub-navigation:

- `Providers`
- `Sessions`
- `Workspace`

### 2. Runtime

Purpose: runtime control, routing, failover, diagnostics, and usage visibility.

Sub-navigation:

- `Proxy`
- `Takeover`
- `Failover`
- `Usage`
- `Diagnostics`

### 3. Extensions

Purpose: configurable extensions and reusable resources.

Sub-navigation:

- `Prompts`
- `Skills`
- `MCP`

### 4. 控制中心

Purpose: device-level and application-level settings.

Sub-navigation:

- `外观`
- `通用`
- `数据与同步`
- `目录`
- `高级`
- `关于`

## Global Navigation Model

The shell must clearly separate three concepts that are currently easy to confuse.

### Product Context Switching

The `Products` area in the left sidebar changes active product context only:

- `Claude`
- `Codex`
- `Gemini`
- `OpenCode`
- `OpenClaw`

This is not page navigation.

### Domain Navigation

The main global navigation changes the working domain:

- `产品`
- `Runtime`
- `Extensions`
- `控制中心`

This is not product switching.

### Local Navigation

Each domain may expose local page-level tabs, panels, or split views. These are internal to the active domain.

Examples:

- vertical tabs inside `控制中心`
- usage sub-panels inside `Runtime`
- list/detail split views inside `Providers`

## Shell Structure

The shell uses a consistent three-area layout.

### Left Sidebar

Contains:

- product brand and identity
- global health and runtime state
- product context switcher
- domain navigation
- bottom utility links such as update/help/about

### Top Context Toolbar

Contains:

- current domain title
- active product badge
- runtime summary
- domain-level primary actions
- optional sub-navigation controls

### Main Work Area

Contains:

- current domain content
- unified container patterns
- loading, empty, error, and action states

## Domain Behaviors

### 产品

This domain prioritizes high-frequency operations.

Expected structure:

- list-plus-detail or list-plus-panel composition
- quick switching
- visible current active provider and product context

### Runtime

This domain acts as an operational console.

Expected structure:

- status overview
- runtime control panels
- diagnostics and usage surfaces
- clear warnings and health indicators

### Extensions

This domain groups all extension-style capabilities together.

Expected structure:

- resource list
- editing workflows
- import/export or discovery actions where already supported

### 控制中心

This domain becomes a focused system control center and keeps the required layout:

- left vertical navigation tabs
- right content panel

It must no longer act as a dumping ground for unrelated runtime capabilities.

## Interaction Model

The redesign standardizes interaction into three types:

1. context switching
2. workflow navigation
3. content operations

### Product Switching Rules

Switching products changes application context, not the active domain.

Rules:

- inside `产品`, remain in the current sub-view if supported
- inside `Runtime`, remain in the current sub-view and swap data context
- inside `Extensions`, remain in the current sub-view and swap data context
- inside `控制中心`, remain in `控制中心`; only product-related settings should react to the active product if applicable
- if the target product does not support the current sub-view, move to the nearest valid sub-view in that domain

### Domain Switching Rules

Each domain remembers its last active sub-view.

Default entries:

- `产品` -> `Providers`
- `Runtime` -> `Proxy`
- `Extensions` -> `Prompts`
- `控制中心` -> `外观`

Returning to a domain should restore the user's last local position when possible.

### Save Strategy Rules

The UI must distinguish among:

- immediate-save settings
- explicit-save settings
- action-based operations

#### Immediate Save

Use for low-risk settings that can safely apply instantly:

- theme mode
- theme palette
- density
- motion preference
- simple visibility toggles

#### Explicit Save

Use for settings that require validation or have larger environment impact:

- directories
- sync configuration
- advanced runtime-related settings that already require save semantics

#### Action Operations

Keep separate from settings:

- import
- export
- restore
- restart
- test connection
- run diagnostics

### Feedback Rules

Feedback must be calmer and more informative.

- use inline validation before relying on toast notifications
- use toast for completion of explicit actions
- show runtime state in visible page chrome
- show dangerous states persistently until resolved or dismissed
- show save state in the page itself, not only in notifications

## Visual System

The visual system must be aligned with `claw-studio` principles.

### Core Palette Strategy

Use:

- `zinc`-based neutral surfaces for the shell and panel structure
- tokenized `primary-50..950` scales for theme palettes

Default palette:

- dark mode
- `tech-blue`-style default primary scale

Additional palettes:

- `lobster`
- `green-tech`
- `zinc`
- `violet`
- `rose`

### Surface Hierarchy

Recommended visual layering:

- app background: near `zinc-950`
- shell/sidebar background: `zinc-950` or `zinc-900`
- main work panel: `zinc-900`
- raised cards and grouped panels: `zinc-800`
- active state: primary-tinted surface

### Visual Intent

The UI should feel:

- deep and quiet
- premium but not glossy
- panel-based rather than glassmorphic
- restrained in accent usage

Reduce:

- warm washed backgrounds
- excessive radial ambient gradients
- large-area frosted glass treatment

Retain selectively:

- subtle glows for active state
- meaningful highlights for online or takeover state
- short, crisp transitions

### Typography and Density

Typography should remain readable and operational.

Introduce density as a first-class setting:

- `Compact`
- `Comfortable`

The default should favor console efficiency while remaining readable.

### Motion

Motion should communicate hierarchy changes:

- crossfade for product switching
- subtle page transitions for domain switching
- clear but short active-indicator movement for tabs
- restrained accordion and panel transitions

Motion should not create softness or lag.

Add a motion preference:

- `Full`
- `Reduced`

## Theme System Redesign

The current theme implementation is not enough because theme state is largely local and presentation-oriented.

The redesign must promote theme into a real product setting.

### Required Theme State

- theme mode: `dark | light | system`
- theme palette
- density
- motion preference

### Persistence Requirement

Theme settings must become part of the application settings model rather than living only inside UI-local storage behavior.

### Native Window Sync

The native window theme sync behavior should be preserved so desktop chrome remains aligned with the selected theme mode.

## Technical Architecture

The redesign must follow repository architecture rules.

### Root `src/`

Responsible for:

- app shell
- top-level navigation orchestration
- domain composition
- global layout

### `commons`

Responsible for:

- theme provider
- design tokens
- shared shell primitives
- navigation atoms
- shared status and section components

### `core`

Responsible for:

- navigation schemas
- product/domain/sub-view state models
- settings types and shared runtime context rules

### Domain Packages

Responsible for:

- preserving domain functionality
- adapting existing screens into the new shell containers
- layout corrections only where needed for the new product shell

## Implementation Strategy

The implementation may be phased internally, but the release target is a complete new product shell.

### Phase 1: Shell and Navigation

Rebuild:

- global sidebar
- context toolbar
- domain navigation state
- product switching semantics
- main content composition

### Phase 2: Theme and Design Tokens

Rebuild:

- root CSS token system
- dark-first neutral palette structure
- primary palette scale support
- shared shell visual language

### Phase 3: Domain Migration

Recompose existing capability screens into the new domains:

- `产品`
- `Runtime`
- `Extensions`
- `控制中心`

### Phase 4: Interaction and Polish

Unify:

- save feedback
- warnings and alerts
- loading and empty states
- keyboard efficiency
- animation timing

## Functional Preservation Rules

This redesign is successful only if all existing capabilities remain functionally intact.

That means:

- existing settings must still save correctly
- provider switching must still work
- prompts, skills, MCP, proxy, usage, diagnostics, sessions, workspace, import/export, sync, and about flows must remain available
- side effects such as restart, tray refresh, or sync operations must continue to behave the same

The shell may move where a feature is found, but not what the feature does.

## Acceptance Criteria

The redesign is acceptable only if all of the following are true.

### Product Understanding

- users can distinguish product switching from page navigation
- users can distinguish runtime controls from system settings
- all capabilities are easier to locate than before

### Visual Consistency

- the application reads as one product, not multiple disconnected pages
- the visual system clearly reflects the `claw-studio` palette principles
- default experience feels dark, stable, premium, and operational

### Interaction Quality

- domain and product switching are predictable
- current location and current context are always visible
- saving, danger, and runtime states are clearly communicated

### Functional Stability

- existing workflows remain complete
- feature results stay consistent with the current product
- no capability becomes inaccessible

## Open Implementation Notes

- The old view model may be replaced internally, but the new shell must preserve all behaviors before rollout.
- The current settings center layout should be retained as a left-tab/right-panel pattern, but only for true control-center responsibilities.
- Runtime capabilities currently inside settings must be relocated without losing discoverability.
