# EGO TOOL - Vencord Plugin Injector (Windows)
# Made by shoyzontop
#
# Simply injects EGO TOOL into the Vencord userplugins folder and rebuilds.
# Nothing is reinstalled, no plugins or settings are removed.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File inject.ps1 [-VencordDir "C:\path\to\Vencord"] [-NoBuild] [-Remove]

param(
    [string]$VencordDir = "",
    [switch]$NoBuild,
    [switch]$Remove
)

$ErrorActionPreference = "Stop"
$RepoUrl    = "https://github.com/REFLEX60FPSMOBILE/vencord-hidebadges.git"
$PluginName = "EGO-Tool"

function Write-Info { Write-Host "[EGO TOOL] $args" -ForegroundColor Cyan }
function Write-Ok   { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Fail { Write-Host "[ERROR] $args" -ForegroundColor Red; exit 1 }

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
    Write-Fail "Could not find your Vencord source folder. Re-run with: powershell -ExecutionPolicy Bypass -File inject.ps1 -VencordDir C:\path\to\Vencord"
}

$pkg = Get-Content "$VencordDir/package.json" -Raw
if ($pkg -notmatch '"vencord"') {
    Write-Fail "$VencordDir does not look like a Vencord source checkout."
}
Write-Info "Vencord source found: $VencordDir"

$UserPluginsDir = Join-Path $VencordDir "src\userplugins"
$PluginDir      = Join-Path $UserPluginsDir $PluginName

# ----------------------------------------------------------------
# 2. Remove mode
# ----------------------------------------------------------------
if ($Remove) {
    if (-not (Test-Path $PluginDir)) { Write-Fail "EGO TOOL is not present in $UserPluginsDir" }
    Write-Info "Removing EGO TOOL from userplugins..."
    Remove-Item -Recurse -Force $PluginDir
    if (-not $NoBuild) {
        Write-Info "Rebuilding Vencord (pnpm build)..."
        Push-Location $VencordDir; pnpm build; $buildCode = $LASTEXITCODE; Pop-Location
        if ($buildCode -ne 0) { Write-Fail "pnpm build failed." }
    }
    Write-Ok "EGO TOOL removed. All your other plugins and settings are untouched."
    exit 0
}

# ----------------------------------------------------------------
# 3. Inject the plugin into the userplugins folder
# ----------------------------------------------------------------
New-Item -ItemType Directory -Force -Path $UserPluginsDir | Out-Null
if (Test-Path "$PluginDir\.git") {
    Write-Info "EGO TOOL already injected - updating to latest version..."
    git -C $PluginDir pull --ff-only
} else {
    if (Test-Path $PluginDir) { Remove-Item -Recurse -Force $PluginDir }
    Write-Info "Injecting EGO TOOL into $PluginDir..."
    git clone --depth 1 $RepoUrl $PluginDir
}

if ($NoBuild) {
    Write-Ok "EGO TOOL injected into the userplugins folder (build skipped)."
    Write-Host "   Run: cd $VencordDir && pnpm build   to apply it to the client."
    exit 0
}

# ----------------------------------------------------------------
# 4. Rebuild (this is the actual injection into the client bundle -
#    nothing is reinstalled or reset, your plugins/settings are safe)
# ----------------------------------------------------------------
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Fail "pnpm is not installed. Install it with: npm install -g pnpm"
}
Push-Location $VencordDir
if (-not (Test-Path "$VencordDir\node_modules")) {
    Write-Info "Installing Vencord dependencies (pnpm i)..."
    pnpm i
}
Write-Info "Injecting into client bundle (pnpm build)..."
pnpm build
$buildCode = $LASTEXITCODE
Pop-Location
if ($buildCode -ne 0) { Write-Fail "Build failed - EGO TOOL was placed in userplugins but the client was NOT patched. Fix the error above and re-run." }

Write-Host ""
Write-Ok "EGO TOOL injected successfully!"
Write-Host ""
Write-Host "  Next steps:"
Write-Host "    1. Fully restart Discord (or Vesktop)."
Write-Host "    2. Open User Settings -> Vencord -> Plugins."
Write-Host "    3. Enable EGO TOOL."
Write-Host ""
Write-Host "  Remove anytime with: powershell -ExecutionPolicy Bypass -File inject.ps1 -Remove"
Write-Host ""