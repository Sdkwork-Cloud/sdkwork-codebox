---
name: desktop-settings-app-sdk-real-logic
description: Guides desktop-settings modules onto application-root product app SDK contracts. Use when integrating or repairing apps/sdkwork-desktop-settings remote business modules so they consume generated product SDK facades or typed injected product client ports instead of package-local HTTP or renderer-side shortcuts, or when a missing contract must be closed end to end before the desktop app can ship.
---

# Desktop Settings App SDK Real Logic

## Overview

Drive `apps/sdkwork-desktop-settings` to one split architecture:

`src shell / package module -> shared product SDK boundary in sdkwork-codebox-core or sdkwork-codebox-integration -> typed product app client port or generated product app SDK facade`

Keep Tauri, local workspace settings, updater, process, proxy, and filesystem work on native boundaries. Route only remote business capability through the shared app SDK. If a method is missing, close the backend/OpenAPI/generator gap first, then return and delete the workaround.

Treat every round as a recursive closure loop: self-review the touched app or client code, decide whether the next fix belongs in app or frontend code, backend or service code, or generator inputs, regenerate the SDK when contracts move, then review again until no higher-value gap remains.

## Progressive Loading

- Start with this file only.
- Load `references/architecture-map.md` only when boundary ownership or shared-boundary placement is unclear.
- Load `../../../SDK_INTEGRATION_STANDARD.md` only when lifecycle, env keys, or token rules matter.
- Load `../../ARCHITECT.md` only when package ownership or dependency direction is unclear.
- Load `references/verification.md` only before closing the round.

## Hard Rules

- Use application-root product SDK families or typed injected product client ports as the remote business boundary.
- Use dependency SDKs through their own application-root SDK packages instead of copying their APIs into the desktop settings product SDK.
- If the workspace does not already expose a unified app-sdk boundary, implement it in `packages/sdkwork-codebox-core` or `packages/sdkwork-codebox-integration` before touching feature modules.
- Keep Tauri, workspace files, local settings, updater flows, proxy configuration, and process management out of the app SDK path.
- Replace package-local business HTTP with the shared boundary. Do not add raw `fetch`, generic API helpers, manual auth headers, mock branches, or app-local SDK forks.
- Never hand-edit generated SDK output. Fix backend or generator inputs, then regenerate.
- Any table, column, index, migration, local data-store schema change, or embedded DB layout change requires user confirmation first.

## Default Loop

1. Classify the target as remote-business, local-native, or mixed.
2. Audit the touched package and shared core for raw HTTP, duplicated DTOs, manual headers, mock branches, or stale shortcuts.
3. Verify the real generated SDK export and the shared boundary surface.
4. If the method exists, refactor to the standard shared-boundary -> product SDK path and delete the bypass.
5. If the method is missing, close the gap in the product-owned API/OpenAPI/generator inputs or inject a typed product client port until the generated product SDK family exists, then finish the desktop integration.
6. If gap closure or local state evolution needs any schema change, stop and ask the user before touching structure.
7. Self-review the touched path. If a better next fix still belongs in app or frontend code, backend or service code, generator inputs, or adjacent cleanup, keep iterating instead of stopping at the first pass.
8. Run verification, then rescan adjacent packages and one extra global pass.

## Red Flags

- raw `fetch(`, `axios.`, or generic API helpers in business modules
- manual `Authorization` or `Access-Token` assignment
- package-local SDK forks or DTO shims
- fake success fallback or timeout-based save simulation
- any unapproved migration, DDL, or embedded DB schema edit

## Completion Bar

- Remote business modules use the shared product SDK boundary.
- Local-only features still stay on the correct native boundary.
- No raw HTTP, manual header, mock bypass, or temporary fallback remains.
- Missing contracts are closed in backend/OpenAPI/generator inputs, and no schema change happened without approval.
- Relevant typecheck, test, package build, and desktop build verification pass.
