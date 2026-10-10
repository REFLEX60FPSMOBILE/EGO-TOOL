# EGO TOOL - Vencord Plugin Installer (Windows)
# Made by shoyzontop
# Usage:
#   powershell -ExecutionPolicy Bypass -File install.ps1 [-VencordDir "C:\path\to\Vencord"] [-Uninstall]

param(
    [string]$VencordDir = "",
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$RepoUrl    = "https://github.com/REFLEX60FPSMOBILE/vencord-hidebadges.git"
$PluginName = "EGO-Tool"

function Write-Info  { Write-Host "[EGO TOOL] $args" -ForegroundColor Cyan }
function Write-Ok    { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Fail  { Write-Host "[ERROR] $args" -ForegroundColor Red; exit 1 }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Fail "git is not installed. Get it from https://git-scm.com"
}

# ----------------------------------------------------------------
# 1. Locate the Vencord source folder
# ----------------------------------------------------------------
if (-not $VencordDir -or -not (Test-Path "$VencordDir/package.json")) {
    $candidates = @(
        "$env:USERPROFILE\Vencord",
        "$env:USERPROFILE\Documents\Vencord",
        "$env:USERPROFILE\Desktop\Vencord",
        "$env:USERPROFILE\source\repos\Vencord",
        "C:\Vencord"
    )
    foreach ($c in $candidates) {
        if (Test-Path "$c/package.json") { $VencordDir = $c; break }
    }
}

if (-not (Test-Path "$VencordDir/package.json")) {
    Write-Fail "Could not find your Vencord source folder. Re-run with: powershell -ExecutionPolicy Bypass -File install.ps1 -VencordDir C:\path\to\Vencord"
}

$pkg = Get-Content "$VencordDir/package.json" -Raw
if ($pkg -notmatch '"vencord"') {
    Write-Fail "$VencordDir does not look like a Vencord source checkout."
}
Write-Info "Vencord source found: $VencordDir"

$UserPluginsDir = Join-Path $VencordDir "src\userplugins"
$PluginDir      = Join-Path $UserPluginsDir $PluginName

# ----------------------------------------------------------------
# 2. Uninstall mode
# ----------------------------------------------------------------
if ($Uninstall) {
    if (-not (Test-Path $PluginDir)) { Write-Fail "EGO TOOL is not installed in $UserPluginsDir" }
    Write-Info "Removing EGO TOOL..."
    Remove-Item -Recurse -Force $PluginDir
    Push-Location $VencordDir; pnpm build; Pop-Location
    Write-Ok "EGO TOOL has been uninstalled and Vencord rebuilt."
    exit 0
}

# ----------------------------------------------------------------
# 3. Download / update the plugin
# ----------------------------------------------------------------
New-Item -ItemType Directory -Force -Path $UserPluginsDir | Out-Null
if (Test-Path "$PluginDir\.git") {
    Write-Info "EGO TOOL already installed - pulling latest version..."
    git -C $PluginDir pull --ff-only
} else {
    if (Test-Path $PluginDir) { Remove-Item -Recurse -Force $PluginDir }
    Write-Info "Cloning EGO TOOL into $PluginDir..."
    git clone --depth 1 $RepoUrl $PluginDir
}

# ----------------------------------------------------------------
# 4. Build Vencord
# ----------------------------------------------------------------
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Fail "pnpm is not installed. Install it with: npm install -g pnpm"
}
Push-Location $VencordDir
if (-not (Test-Path "$VencordDir\node_modules")) {
    Write-Info "Installing Vencord dependencies (pnpm i)..."
    pnpm i
}
Write-Info "Building Vencord (pnpm build)..."
pnpm build
Pop-Location

Write-Host ""
Write-Ok "EGO TOOL installed successfully!"
Write-Host ""
Write-Host "  Next steps:"
Write-Host "    1. Fully restart Discord (or Vesktop)."
Write-Host "    2. Open User Settings -> Vencord -> Plugins."
Write-Host "    3. Enable EGO TOOL."
Write-Host ""
Write-Host "  Uninstall anytime with: powershell -ExecutionPolicy Bypass -File install.ps1 -Uninstall"
Write-Host ""