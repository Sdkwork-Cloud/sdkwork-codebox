# Desktop Settings Verification

Run the narrowest useful set first, then broaden before completion:

```bash
pnpm install
pnpm typecheck
pnpm typecheck:packages
pnpm test:unit
pnpm build:packages
pnpm build
```

`pnpm build` exercises the Tauri desktop build. For package-only work, `pnpm typecheck:packages`, `pnpm test:unit`, and `pnpm build:packages` are the minimum bar before the full desktop build.
