#!/usr/bin/env bash
# Link tool-specific skill dirs to .agents/skills (single source of truth).
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
agents_skills="$repo_root/.agents/skills"

mkdir -p "$agents_skills"

link_dir() {
  local target="$1"
  local relative_source="$2"
  local label="$3"

  mkdir -p "$(dirname "$target")"

  if [ -L "$target" ]; then
    rm "$target"
  elif [ -e "$target" ]; then
    rm -rf "$target"
  fi

  ln -s "$relative_source" "$target"
  echo "linked $label -> $relative_source"
}

link_dir "$repo_root/.cursor/skills" "../.agents/skills" ".cursor/skills"
link_dir "$repo_root/.claude/skills" "../.agents/skills" ".claude/skills"
