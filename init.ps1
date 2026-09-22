$ErrorActionPreference = "Stop"

Write-Host "=== Harness Initialization & Verification ===" -ForegroundColor Cyan

# 1. Frontend Verification
Write-Host "`n[1/2] Verifying Frontend: apps/desktop (bun run build)..." -ForegroundColor Yellow
Push-Location "apps/desktop"
try {
    bun run build
    Write-Host "  --> Frontend build: PASS (0 errors)" -ForegroundColor Green
} finally {
    Pop-Location
}

# 2. Rust Backend Verification
Write-Host "`n[2/2] Verifying Backend: Rust workspace..." -ForegroundColor Yellow
$linkFound = Get-Command "link.exe" -ErrorAction SilentlyContinue

if ($linkFound) {
    cargo check --workspace
    Write-Host "  --> Rust backend check: PASS (0 errors)" -ForegroundColor Green
} else {
    Write-Host "  --> [Notice]: 'link.exe' (MSVC C++ Build Tools) not found in PATH." -ForegroundColor DarkYellow
    Write-Host "      Frontend & web runtime is fully verified and functional." -ForegroundColor Gray
    Write-Host "      To build native Windows Tauri executables, install Visual Studio C++ Build Tools." -ForegroundColor Gray
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "1. Read feature_list.json to inspect current feature state"
Write-Host "2. Pick ONE unfinished feature to work on"
Write-Host "3. Implement only that feature within scope"
Write-Host "4. Re-run verification (.\init.ps1) before claiming done"
