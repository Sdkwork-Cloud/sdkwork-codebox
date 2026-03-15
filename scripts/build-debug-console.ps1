$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$srcTauriDir = Join-Path $repoRoot "src-tauri"
$releaseDir = Join-Path $srcTauriDir "target\release"
$debugExe = Join-Path $releaseDir "codebox-debug-console.exe"

$env:VITE_DEBUG_DIAGNOSTICS = "true"
$env:CODEBOX_DEBUG_CONSOLE = "1"

Push-Location $repoRoot
try {
  & pnpm.cmd run build:renderer
  if ($LASTEXITCODE -ne 0) {
    throw "Renderer build failed with exit code $LASTEXITCODE"
  }

  Push-Location $srcTauriDir
  try {
    & cargo build --release --features debug-console
    if ($LASTEXITCODE -ne 0) {
      throw "Cargo build failed with exit code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }

  Copy-Item (Join-Path $releaseDir "codebox.exe") $debugExe -Force
  Write-Host "Built debug console binary: $debugExe"
}
finally {
  Pop-Location
}
