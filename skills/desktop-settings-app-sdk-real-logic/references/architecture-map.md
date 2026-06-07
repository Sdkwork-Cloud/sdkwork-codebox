# Desktop Settings Architecture Map

## Stack

- React + TypeScript + Vite
- pnpm workspace with codebox packages
- Tauri desktop host

## Standard Remote Path

Use this path for any remote business capability backed by desktop settings product SDK ownership:

`src shell / package module -> shared product SDK boundary in sdkwork-codebox-core or sdkwork-codebox-integration -> typed product app client port or generated product app SDK facade`

If the shared boundary is incomplete, complete it first instead of spreading direct HTTP across packages.

## Local And Native Path

Keep these concerns on their original boundaries:

- Tauri commands and desktop plugin bridges
- local workspace settings, files, updater, process, and proxy management
- local diagnostics and debug tooling
- package orchestration and renderer composition

Local-only capability should stay local even while adjacent business modules move to the generated SDK.

## Replace Or Remove

- raw REST helpers in renderer or package service code
- duplicate DTO mapping that only exists to hide a missing SDK method
- package-local backend clients that bypass the shared boundary
- manual auth header assignment in service layers

## Contract Closure Rule

If a feature package needs a method that the generated app SDK does not expose:

1. Fix the product-owned API/OpenAPI/generator contract or declare the correct dependency SDK.
2. Regenerate the product app SDK from the repository-standard generator flow when the generated family exists.
3. Reconnect the package through the shared boundary.
4. Delete the temporary bypass.

If that backend work would touch schema, migration, or embedded DB layout, pause and ask the user first.
