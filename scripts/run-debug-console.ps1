$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$debugExe = Join-Path $repoRoot "src-tauri\target\release\codebox-debug-console.exe"

if (-not (Test-Path $debugExe)) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-debug-console.ps1")
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to build debug console binary"
  }
}

$env:CODEBOX_DEBUG_CONSOLE = "1"
Write-Host "Launching debug console binary: $debugExe"
& $debugExe
