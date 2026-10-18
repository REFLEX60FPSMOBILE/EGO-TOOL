# EGO TOOL - Vencord Plugin Injector (Windows)
# Made by shoyzontop
#
# Simply injects EGO TOOL into the Vencord userplugins folder and rebuilds.
# Nothing is reinstalled, no plugins or settings are removed.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File inject.ps1 [-VencordDir "C:\path\to\Vencord"] [-NoBuild] [-Remove] [-Orion] [-RemoveOrion]

param(
    [string]$VencordDir = "",
    [switch]$NoBuild,
    [switch]$Remove,
    [switch]$Orion,
    [switch]$RemoveOrion
)

$ErrorActionPreference = "Stop"
$EgoRepoUrl   = "https://github.com/REFLEX60FPSMOBILE/EGO-TOOL.git"
$OrionRepoUrl = "https://github.com/nyxxbit/discord-quest-completer.git"
$PluginName   = "EGO-Tool"
$OrionPluginName = "discord-quest-completer"

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

$UserPluginsDir   = Join-Path $VencordDir "src\userplugins"
$PluginDir        = Join-Path $UserPluginsDir $PluginName
$OrionPluginDir   = Join-Path $UserPluginsDir $OrionPluginName

# ----------------------------------------------------------------
# 2. Remove modes
# ----------------------------------------------------------------
if ($RemoveOrion) {
    if (-not (Test-Path $OrionPluginDir)) { Write-Fail "Orion (OrionQuests) is not present in $UserPluginsDir" }
    Write-Info "Removing OrionQuests from userplugins..."
    Remove-Item -Recurse -Force $OrionPluginDir
    if (-not $NoBuild) {
        Write-Info "Rebuilding Vencord (pnpm build)..."
        Push-Location $VencordDir; pnpm build; $buildCode = $LASTEXITCODE; Pop-Location
        if ($buildCode -ne 0) { Write-Fail "pnpm build failed." }
        Write-Info "Re-installing the clean client into Discord (pnpm inject)..."
        Push-Location $VencordDir; pnpm inject; if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Fail "pnpm inject failed." }; Pop-Location
    }
    Write-Ok "OrionQuests removed. Everything else is untouched."
    exit 0
}

if ($Remove) {
    if (-not (Test-Path $PluginDir)) { Write-Fail "EGO TOOL is not present in $UserPluginsDir" }
    Write-Info "Removing EGO TOOL from userplugins..."
    Remove-Item -Recurse -Force $PluginDir
    if (Test-Path $OrionPluginDir) {
        Write-Info "OrionQuests detected ($OrionPluginName): nothing touched, remove it with -RemoveOrion"
    }
    if (-not $NoBuild) {
        Write-Info "Rebuilding Vencord (pnpm build)..."
        Push-Location $VencordDir; pnpm build; $buildCode = $LASTEXITCODE; Pop-Location
        if ($buildCode -ne 0) { Write-Fail "pnpm build failed." }
        Write-Info "Re-installing the clean client into Discord (pnpm inject)..."
        Push-Location $VencordDir; pnpm inject; if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Fail "pnpm inject failed." }; Pop-Location
    }
    Write-Ok "EGO TOOL removed. All your other plugins and settings are untouched."
    exit 0
}

# ----------------------------------------------------------------
# 3. Inject the plugin(s) into the userplugins folder
# ----------------------------------------------------------------
New-Item -ItemType Directory -Force -Path $UserPluginsDir | Out-Null

if (-not $Orion -and -not $RemoveOrion) {
    if (Test-Path "$PluginDir\.git") {
        Write-Info "EGO TOOL already injected - updating to latest version..."
        git -C $PluginDir pull --ff-only
    } else {
        if (Test-Path $PluginDir) { Remove-Item -Recurse -Force $PluginDir }
        Write-Info "Injecting EGO TOOL into $PluginDir..."
        git clone --depth 1 $EgoRepoUrl $PluginDir
    }
}

if ($Orion) {
    Write-Host ""
    Write-Info "WARNING: Orion automates Discord Quests. Discord is enforcing against quest"
    Write-Info "automation: quest restrictions and Account Standing violations have been reported."
    Write-Info "Use it on your account entirely at your own risk."
    Write-Host ""
    if (Test-Path "$OrionPluginDir\.git") {
        Write-Info "OrionQuests already injected - updating to latest version..."
        git -C $OrionPluginDir pull --ff-only
    } else {
        if (Test-Path $OrionPluginDir) { Remove-Item -Recurse -Force $OrionPluginDir }
        Write-Info "Injecting OrionQuests into $OrionPluginDir..."
        git clone --depth 1 $OrionRepoUrl $OrionPluginDir
    }
}

# ----------------------------------------------------------------
# 3b. Neutralize known-broken third-party userplugins before build
#     (e.g. plugins importing copyWithToast or the old Toasts object API,
#      which no longer exist in the current Vencord — they break the whole build)
# ----------------------------------------------------------------
$DisabledDir = Join-Path $VencordDir "ego-disabled-plugins"
$brokenPlugins = @()
Get-ChildItem -LiteralPath $UserPluginsDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Name -in @($PluginName, $OrionPluginName)) { return }
    $hit = Get-ChildItem -LiteralPath $_.FullName -Recurse -Include *.tsx,*.ts -File -ErrorAction SilentlyContinue |
        Select-String -Pattern "copyWithToast","Toasts\\.show" -List -ErrorAction SilentlyContinue
    if ($hit) { $brokenPlugins += $_.FullName }
}
foreach ($broken in $brokenPlugins) {
    $name = Split-Path $broken -Leaf
    Write-Info "Disabling broken third-party plugin '$name' (deprecated Vencord API: copyWithToast / Toasts obj)..."
    Write-Info "  -> moved to $DisabledDir\$name (put it back there manually if you need it)"
    New-Item -ItemType Directory -Force -Path $DisabledDir | Out-Null
    Move-Item -LiteralPath $broken -Destination (Join-Path $DisabledDir $name) -Force
}

if ($NoBuild) {
    Write-Ok "Finished injecting into the userplugins folder (build skipped)."
    Write-Host "   Run: cd $VencordDir && pnpm build   to apply it to the client."
    exit 0
}

# ----------------------------------------------------------------
# 4. Rebuild AND install into the actual Discord client
#    - pnpm build  : compiles the patched client into dist/
#    - pnpm inject : official Vencord installer copy - copies the fresh dist
#      into your installed Discord (that is the install step - without it,
#      Discord keeps running the previously patched build)
#    Nothing is reinstalled or reset, your plugins/settings are safe.
# ----------------------------------------------------------------
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Fail "pnpm is not installed. Install it with: npm install -g pnpm"
}
Push-Location $VencordDir

# The plugin targets the CURRENT Vencord API — an outdated source checkout
# fails to compile it (export removed upstream: copyWithToast, Toasts...).
git pull --ff-only 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "" 
    Write-Info "WARNING: could not fast-forward the Vencord source (local changes?)."
    Write-Info "   If the build below fails with 'No matching export', update Vencord:"
    Write-Info "   cd $VencordDir; git stash; git pull"
}

if (-not (Test-Path "$VencordDir\node_modules")) {
    Write-Info "Installing Vencord dependencies (pnpm i)..."
    pnpm i
}
Write-Info "Building patched client (pnpm build)..."
pnpm build
$buildCode = $LASTEXITCODE
if ($buildCode -ne 0) { Pop-Location; Write-Fail "Build failed - the plugin(s) were placed in userplugins but the client was NOT patched. Fix the error above and re-run." }

Write-Info "Installing the patched client into Discord (pnpm inject)..."
Write-Host "    If the installer lists Discord versions, select yours (Space/Enter)."
pnpm inject
$injectCode = $LASTEXITCODE
Pop-Location
if ($injectCode -ne 0) { Write-Fail "pnpm inject failed - the fresh build is in $VencordDir\dist but your Discord was not re-patched. Re-run the script to retry." }

Write-Host ""
Write-Ok "Install successful - Discord now runs this new build!"
Write-Host ""
Write-Host "  Next steps:"
Write-Host "    1. Fully QUIT and restart Discord (tray icon included)."
Write-Host "    2. Open User Settings -> Vencord -> Plugins."
if ($Orion -or $RemoveOrion) {
    Write-Host "    3. Enable OrionQuests and type /orion status in any channel."
} else {
    Write-Host "    3. Enable EGO TOOL."
}
Write-Host ""
Write-Host "  Remove EGO TOOL anytime with: powershell -ExecutionPolicy Bypass -File inject.ps1 -Remove (then it re-installs the clean client automatically)"
Write-Host "  Remove OrionQuests anytime with: powershell -ExecutionPolicy Bypass -File inject.ps1 -RemoveOrion"
Write-Host ""