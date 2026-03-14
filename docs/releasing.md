# Releasing CodeBox

This repository publishes multi-platform desktop packages through GitHub Actions
and GitHub Releases.

## Output Artifacts

Each tagged release publishes the following assets:

- Windows: `CodeBox-vX.Y.Z-Windows.msi`
- Windows portable: `CodeBox-vX.Y.Z-Windows-Portable.zip`
- macOS: `CodeBox-vX.Y.Z-macOS.zip`
- macOS updater bundle: `CodeBox-vX.Y.Z-macOS.tar.gz`
- Linux x86_64: `CodeBox-vX.Y.Z-Linux-x86_64.AppImage`, `.deb`, `.rpm`
- Linux arm64: `CodeBox-vX.Y.Z-Linux-arm64.AppImage`, `.deb`, `.rpm`
- Updater manifest: `latest.json`

## Required GitHub Secrets

Set these repository secrets before releasing:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
  This is optional if the signing key does not use a password.

The release workflow normalizes common private key formats and then signs updater
artifacts for Windows, macOS, and Linux.

## Release Triggers

There are two supported release flows:

1. Push a version tag that matches `v*`
2. Run the `Release` workflow manually with an existing tag

## Tag Release Flow

```bash
git checkout main
git pull
git tag vX.Y.Z
git push origin vX.Y.Z
```

This triggers `.github/workflows/release.yml`.

## Manual Release Flow

Open the `Release` workflow in GitHub Actions and provide:

- `tag`: an existing git tag such as `v3.12.1`
- `prerelease`: set to `true` for preview builds

## Notes

- The workflow uploads all platform packages to the matching GitHub Release.
- `latest.json` is regenerated after all matrix builds finish and then uploaded
  to the same release for the Tauri updater.
- The updater endpoint is configured to use:
  `https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest/download/latest.json`
