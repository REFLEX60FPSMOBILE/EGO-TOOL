#!/usr/bin/env bash
#
# EGO TOOL - Vencord Plugin Injector (Linux / macOS / Git Bash)
# Made by shoyzontop
#
# Simply injects EGO TOOL into the Vencord userplugins folder and rebuilds.
# Nothing is reinstalled, no plugins or settings are removed.
#
# Usage:
#   ./inject.sh [--vencord-dir /path/to/Vencord] [--no-build] [--remove] [--orion] [--remove-orion]
#
set -euo pipefail

EGO_REPO_URL="https://github.com/REFLEX60FPSMOBILE/EGO-TOOL.git"
ORION_REPO_URL="https://github.com/nyxxbit/discord-quest-completer.git"
PLUGIN_NAME="EGO-Tool"
ORION_PLUGIN_NAME="discord-quest-completer"
VENCORD_DIR="${VENCORD_DIR:-}"
NO_BUILD="false"
ACTION="inject"

RED="\033[0;31m"; GREEN="\033[0;32m"; CYAN="\033[0;36m"; RESET="\033[0m"
info() { printf "${CYAN}[EGO TOOL]${RESET} %s\n" "$1"; }
ok()   { printf "${GREEN}[OK]${RESET} %s\n" "$1"; }
fail() { printf "${RED}[ERROR]${RESET} %s\n" "$1" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vencord-dir) VENCORD_DIR="$2"; shift 2 ;;
    --no-build) NO_BUILD="true"; shift ;;
    --remove|-r) ACTION="remove"; shift ;;
    --orion) ACTION="orion"; shift ;;
    --remove-orion) ACTION="remove-orion"; shift ;;
    --help|-h)
      echo "Usage: ./inject.sh [--vencord-dir /path/to/Vencord] [--no-build] [--remove] [--orion] [--remove-orion]"; exit 0 ;;
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
  fail "Could not find your Vencord source folder. Re-run with: ./inject.sh --vencord-dir /path/to/Vencord"
grep -q '"vencord"' "$VENCORD_DIR/package.json" || fail "$VENCORD_DIR does not look like a Vencord source checkout."
info "Vencord source found: $VENCORD_DIR"

USERPLUGINS_DIR="$VENCORD_DIR/src/userplugins"
PLUGIN_DIR="$USERPLUGINS_DIR/$PLUGIN_NAME"
ORION_PLUGIN_DIR="$USERPLUGINS_DIR/$ORION_PLUGIN_NAME"

# ----------------------------------------------------------------
# 2. Remove modes
# ----------------------------------------------------------------
if [[ "$ACTION" == "remove-orion" ]]; then
  [[ -d "$ORION_PLUGIN_DIR" ]] || fail "Orion (OrionQuests) is not present in $USERPLUGINS_DIR"
  info "Removing OrionQuests from userplugins..."
  rm -rf "$ORION_PLUGIN_DIR"
  if [[ "$NO_BUILD" != "true" ]]; then
    info "Rebuilding Vencord (pnpm build)..."
    (cd "$VENCORD_DIR" && pnpm build) || fail "pnpm build failed."
  fi
  ok "OrionQuests removed. Everything else is untouched."
  exit 0
fi

if [[ "$ACTION" == "remove" ]]; then
  [[ -d "$PLUGIN_DIR" ]] || fail "EGO TOOL is not present in $USERPLUGINS_DIR"
  info "Removing EGO TOOL from userplugins..."
  rm -rf "$PLUGIN_DIR"
  if [[ -d "$ORION_PLUGIN_DIR" ]]; then
    info "OrionQuests detected (-$ORION_PLUGIN_NAME): nothing touched, remove it with ./inject.sh --remove-orion"
  fi
  if [[ "$NO_BUILD" != "true" ]]; then
    info "Rebuilding Vencord (pnpm build)..."
    (cd "$VENCORD_DIR" && pnpm build) || fail "pnpm build failed."
  fi
  ok "EGO TOOL removed. All your other plugins and settings are untouched."
  exit 0
fi

# ----------------------------------------------------------------
# 3. Inject the plugin(s) into the userplugins folder
# ----------------------------------------------------------------
mkdir -p "$USERPLUGINS_DIR"

if [[ "$ACTION" == "inject" ]]; then
  if [[ -d "$PLUGIN_DIR/.git" ]]; then
    info "EGO TOOL already injected - updating to latest version..."
    git -C "$PLUGIN_DIR" pull --ff-only
  else
    rm -rf "$PLUGIN_DIR"
    info "Injecting EGO TOOL into $PLUGIN_DIR..."
    git clone --depth 1 "$EGO_REPO_URL" "$PLUGIN_DIR"
  fi
fi

if [[ "$ACTION" == "orion" ]]; then
  printf "${RED}"
  info "WARNING: Orion automates Discord Quests. Discord is enforcing against quest"
  info "automation: quest restrictions and Account Standing violations have been reported."
  printf "${RESET}"
  info "Use it on your account entirely at your own risk."
  if [[ -d "$ORION_PLUGIN_DIR/.git" ]]; then
    info "OrionQuests already injected - updating to latest version..."
    git -C "$ORION_PLUGIN_DIR" pull --ff-only
  else
    rm -rf "$ORION_PLUGIN_DIR"
    info "Injecting OrionQuests into $ORION_PLUGIN_DIR..."
    git clone --depth 1 "$ORION_REPO_URL" "$ORION_PLUGIN_DIR"
  fi
fi

if [[ "$NO_BUILD" == "true" ]]; then
  ok "Finished injecting into the userplugins folder (build skipped)."
  echo "   Run: cd $VENCORD_DIR && pnpm build   to apply it to the client."
  exit 0
fi

# ----------------------------------------------------------------
# 4. Rebuild (this is the actual injection into the client bundle -
#    nothing is reinstalled or reset, your plugins/settings are safe)
# ----------------------------------------------------------------
command -v pnpm >/dev/null 2>&1 || fail "pnpm is not installed. Install it with: npm install -g pnpm"
cd "$VENCORD_DIR"
[[ -d node_modules ]] || { info "Installing Vencord dependencies (pnpm i)..."; pnpm i; }
info "Injecting into client bundle (pnpm build)..."
pnpm build || fail "Build failed - the plugin(s) were placed in userplugins but the client was NOT patched. Fix the error above and re-run."

echo ""
ok "Injection successful!"
echo ""
echo "  Next steps:"
echo "    1. Fully restart Discord (or Vesktop)."
echo "    2. Open User Settings -> Vencord -> Plugins."
if [[ "$ACTION" == "orion" ]]; then
printf "    3. Enable ${CYAN}OrionQuests${RESET} and type /orion status in any channel.\n"
else
printf "    3. Enable ${CYAN}EGO TOOL${RESET}.\n"
fi
echo ""
echo "  Remove EGO TOOL anytime with: ./inject.sh --remove"
echo "  Remove OrionQuests anytime with: ./inject.sh --remove-orion"
echo ""