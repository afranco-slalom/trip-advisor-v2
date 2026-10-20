#!/usr/bin/env bash
# setup-hooks.sh — installs shared git hooks for this project
# Run once after cloning: bash scripts/setup-hooks.sh

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/hooks" && pwd)"

echo "Installing git hooks from $SOURCE_DIR → $HOOKS_DIR"

HOOKS=("pre-commit" "commit-msg" "pre-push")

for hook in "${HOOKS[@]}"; do
  src="$SOURCE_DIR/$hook"
  dest="$HOOKS_DIR/$hook"

  if [ ! -f "$src" ]; then
    echo -e "${YELLOW}  Skipping $hook (not found in scripts/hooks/)${NC}"
    continue
  fi

  # Back up any existing hook that isn't already our symlink
  if [ -f "$dest" ] && [ ! -L "$dest" ]; then
    echo -e "${YELLOW}  Backing up existing $hook → $hook.bak${NC}"
    mv "$dest" "$dest.bak"
  fi

  ln -sf "$src" "$dest"
  chmod +x "$src"
  echo -e "${GREEN}  ✓ $hook${NC}"
done

echo ""
echo -e "${GREEN}Hooks installed. They will run on your next commit and push.${NC}"
echo ""
echo "Configure the pre-push hook for your tech stack:"
echo "  Edit scripts/hooks/pre-push and uncomment the commands for your project."
