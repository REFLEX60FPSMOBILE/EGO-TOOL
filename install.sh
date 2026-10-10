#!/usr/bin/env bash
#
# EGO TOOL - Vencord Plugin Installer (Linux / macOS / Git Bash)
# Made by shoyzontop
#
# Usage:
#   ./install.sh [--vencord-dir /path/to/Vencord] [--uninstall]
#
set -euo pipefail

REPO_URL="https://github.com/REFLEX60FPSMOBILE/vencord-hidebadges.git"
PLUGIN_NAME="EGO-Tool"
VENCORD_DIR="${VENCORD_DIR:-}"
ACTION="install"

RED="\033[0;31m"; GREEN="\033[0;32m"; CYAN="\033[0;36m"; RESET="\033[0m"
info() { printf "${CYAN}[EGO TOOL]${RESET} %s\n" "$1"; }
ok()   { printf "${GREEN}[OK]${RESET} %s\n" "$1"; }
fail() { printf "${RED}[ERROR]${RESET} %s\n" "$1" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vencord-dir) VENCORD_DIR="$2"; shift 2 ;;
    --uninstall|-u) ACTION="uninstall"; shift ;;
    --help|-h)
      echo "Usage: ./install.sh [--vencord-dir /path/to/Vencord] [--uninstall]"; exit 0 ;;
    *) fail "Unknown option: $1" ;;
  esac
done

command -v git >/dev/null 2>&1 || fail "git is not installed. Install it from https://git-scm.com"

# ----------------------------------------------------------------
# 1. Locate the Vencord source folder
# ----------------------------------------------------------------
if [[ -z "$VENCORD_DIR" ]]; then
  for candidate in "$HOME/Vencord" "$HOME/vencord" "$HOME/Documents/Vencord" \
                  "$HOME/Projects/Vencord" "$HOME/code/Vencord" "$HOME/dev/Vencord" \
                  "$HOME/Dev/Vencord" "$PWD/Vencord" "$PWD"; do
    if [[ -f "$candidate/package.json" ]] && grep -q '"vencord"' "$candidate/package.json" 2>/dev/null; then
      VENCORD_DIR="$candidate"; break
    fi
  done
fi

[[ -n "$VENCORD_DIR" && -f "$VENCORD_DIR/package.json" ]] || \
  fail "Could not find your Vencord source folder. Re-run with: ./install.sh --vencord-dir /path/to/Vencord"
grep -q '"vencord"' "$VENCORD_DIR/package.json" || fail "$VENCORD_DIR does not look like a Vencord source checkout."
info "Vencord source found: $VENCORD_DIR"

USERPLUGINS_DIR="$VENCORD_DIR/src/userplugins"
PLUGIN_DIR="$USERPLUGINS_DIR/$PLUGIN_NAME"

# ----------------------------------------------------------------
# 2. Uninstall mode
# ----------------------------------------------------------------
if [[ "$ACTION" == "uninstall" ]]; then
  [[ -d "$PLUGIN_DIR" ]] || fail "EGO TOOL is not installed in $USERPLUGINS_DIR"
  info "Removing EGO TOOL..."
  rm -rf "$PLUGIN_DIR"
  (cd "$VENCORD_DIR" && pnpm build) || fail "pnpm build failed. Try again from the Vencord folder."
  ok "EGO TOOL has been uninstalled and Vencord rebuilt."
  exit 0
fi

# ----------------------------------------------------------------
# 3. Download / update the plugin
# ----------------------------------------------------------------
mkdir -p "$USERPLUGINS_DIR"
if [[ -d "$PLUGIN_DIR/.git" ]]; then
  info "EGO TOOL already installed - pulling latest version..."
  git -C "$PLUGIN_DIR" pull --ff-only
else
  rm -rf "$PLUGIN_DIR"
  info "Cloning EGO TOOL into $PLUGIN_DIR..."
  git clone --depth 1 "$REPO_URL" "$PLUGIN_DIR"
fi

# ----------------------------------------------------------------
# 4. Build Vencord
# ----------------------------------------------------------------
command -v pnpm >/dev/null 2>&1 || fail "pnpm is not installed. Install it with: npm install -g pnpm"
cd "$VENCORD_DIR"
[[ -d node_modules ]] || { info "Installing Vencord dependencies (pnpm i)..."; pnpm i; }
info "Building Vencord (pnpm build)..."
pnpm build || fail "Build failed. Make sure your Vencord source is up to date (git pull)."

echo ""
ok "EGO TOOL installed successfully!"
echo ""
echo "  Next steps:"
echo "    1. Fully restart Discord (or Vesktop)."
echo "    2. Open User Settings -> Vencord -> Plugins."
printf "    3. Enable ${CYAN}EGO TOOL${RESET}.\n"
echo ""
echo "  Uninstall anytime with: ./install.sh --uninstall"
echo ""