#!/usr/bin/env bash
# install-skills.sh — copies the shared skills library into a target project
#
# Usage:
#   bash scripts/install-skills.sh /path/to/client-project
#   bash scripts/install-skills.sh /path/to/client-project --update
#
# On first install: copies all skills and records the framework version.
# With --update: copies any skills that changed since last install.
#
# Run from inside the ai-workshop repo.

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

# ── Args ─────────────────────────────────────────────────────────────────────
TARGET="${1:-}"
UPDATE_MODE=false
[[ "${2:-}" == "--update" ]] && UPDATE_MODE=true

if [ -z "$TARGET" ]; then
  echo "Usage: bash scripts/install-skills.sh /path/to/project [--update]"
  exit 1
fi

if [ ! -d "$TARGET" ]; then
  echo -e "${RED}Target directory not found: $TARGET${NC}"
  exit 1
fi

FRAMEWORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="$FRAMEWORK_DIR/.claude/skills"
SKILLS_DEST="$TARGET/.claude/skills"
VERSION_FILE="$TARGET/.claude/.skills-version"
CURRENT_VERSION=$(git -C "$FRAMEWORK_DIR" describe --tags --always 2>/dev/null || echo "untagged")

mkdir -p "$SKILLS_DEST"

# ── Install skills ────────────────────────────────────────────────────────────
echo "Installing skills from framework $CURRENT_VERSION → $SKILLS_DEST"
echo ""

INSTALLED=0
UPDATED=0
SKIPPED=0

for skill_file in "$SKILLS_SRC"/*.md; do
  skill_name=$(basename "$skill_file")
  dest_file="$SKILLS_DEST/$skill_name"

  if [ -f "$dest_file" ]; then
    if $UPDATE_MODE; then
      # Only update if the source has changed
      if ! diff -q "$skill_file" "$dest_file" > /dev/null 2>&1; then
        cp "$skill_file" "$dest_file"
        echo -e "  ${GREEN}↑ updated${NC}  $skill_name"
        UPDATED=$((UPDATED + 1))
      else
        echo -e "  ${YELLOW}= current${NC}  $skill_name"
        SKIPPED=$((SKIPPED + 1))
      fi
    else
      echo -e "  ${YELLOW}! exists${NC}   $skill_name (use --update to overwrite)"
      SKIPPED=$((SKIPPED + 1))
    fi
  else
    cp "$skill_file" "$dest_file"
    echo -e "  ${GREEN}+ installed${NC} $skill_name"
    INSTALLED=$((INSTALLED + 1))
  fi
done

# ── Copy templates if target has none ────────────────────────────────────────
TEMPLATES_DEST="$TARGET/templates"
if [ ! -d "$TEMPLATES_DEST" ]; then
  cp -r "$FRAMEWORK_DIR/templates" "$TEMPLATES_DEST"
  echo ""
  echo -e "${GREEN}Copied templates/ to $TEMPLATES_DEST${NC}"
fi

# ── Copy .claude/settings.json if not present ────────────────────────────────
SETTINGS_SRC="$FRAMEWORK_DIR/templates/.claude/settings.json"
SETTINGS_DEST="$TARGET/.claude/settings.json"
if [ ! -f "$SETTINGS_DEST" ] && [ -f "$SETTINGS_SRC" ]; then
  cp "$SETTINGS_SRC" "$SETTINGS_DEST"
  echo -e "${GREEN}Copied .claude/settings.json to $SETTINGS_DEST${NC}"
fi

# ── Copy hook scripts if target has none ─────────────────────────────────────
HOOKS_DEST="$TARGET/scripts"
if [ ! -d "$HOOKS_DEST" ]; then
  cp -r "$FRAMEWORK_DIR/scripts" "$HOOKS_DEST"
  chmod +x "$HOOKS_DEST/hooks/"* "$HOOKS_DEST/setup-hooks.sh" 2>/dev/null || true
  echo -e "${GREEN}Copied scripts/ to $HOOKS_DEST${NC}"
fi

# ── Record version ────────────────────────────────────────────────────────────
echo "$CURRENT_VERSION" > "$VERSION_FILE"
echo "$(date -u '+%Y-%m-%d %H:%M UTC')" >> "$VERSION_FILE"
echo "Source: $FRAMEWORK_DIR" >> "$VERSION_FILE"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}Done.${NC} $INSTALLED installed, $UPDATED updated, $SKIPPED unchanged."
echo ""
echo "Framework version installed: $CURRENT_VERSION"
echo "Version recorded in: $VERSION_FILE"
echo ""
echo "Next steps for $TARGET:"
echo "  1. cp templates/org-CLAUDE.md ORG-CLAUDE.md  (fill in org name, add to top of CLAUDE.md)"
echo "  2. cp templates/CLAUDE.md CLAUDE.md           (if not already done)"
echo "  3. cp templates/CONTEXT-OWNERS.md CONTEXT-OWNERS.md  (assign owners)"
echo "  4. cp templates/mcp.json .mcp.json             (fill in your credentials)"
echo "  5. bash scripts/setup-hooks.sh                 (install git hooks)"
echo "  6. Fill in scripts/hooks/pre-push              (uncomment your tech stack)"
