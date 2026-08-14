#!/bin/bash
# Installs/persists the Agent Reach CLI (https://github.com/Panniantong/agent-reach)
# for Claude Code on the web, whose containers can start from a fresh filesystem
# each session. Idempotent: skips reinstall if a working install is already
# present (e.g. the container was cached from a prior session).
set -euo pipefail

# Only remote/web sessions get a fresh container each time — nothing to persist
# on a local machine where the filesystem already survives between sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

VENV_DIR="$HOME/.agent-reach-venv"
SRC_DIR="$HOME/.local/src/agent-reach"
BIN="$VENV_DIR/bin/agent-reach"
ENV_FILE="${CLAUDE_ENV_FILE:-/dev/null}"

if [ ! -x "$BIN" ] || ! "$BIN" --version >/dev/null 2>&1; then
  echo "[agent-reach] Not found (or broken) — installing..." >&2

  python3 -m venv "$VENV_DIR"

  mkdir -p "$(dirname "$SRC_DIR")"
  if [ -d "$SRC_DIR/.git" ]; then
    git -C "$SRC_DIR" fetch --depth 1 origin main
    git -C "$SRC_DIR" reset --hard origin/main
  else
    rm -rf "$SRC_DIR"
    GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/Panniantong/agent-reach "$SRC_DIR"
  fi

  "$VENV_DIR/bin/pip" install --quiet "$SRC_DIR"

  # Put the venv's own bin/ (yt-dlp, agent-reach, etc.) on PATH *before*
  # running the installer below — it shells out to `yt-dlp` by bare name to
  # configure the JS runtime, and without this it silently can't find the
  # copy it just pip-installed, downgrading the YouTube channel.
  export PATH="$VENV_DIR/bin:$PATH"

  # Non-interactive system install: gh CLI, mcporter, yt-dlp JS runtime, Exa search.
  # Deliberately does NOT configure login-required channels (Twitter/Reddit/
  # Bilibili/XiaoHongShu/Facebook/Instagram/LinkedIn/etc) — ask explicitly for
  # those per session since they need per-platform credentials.
  "$BIN" install --env=auto --system || true

  echo "[agent-reach] Install complete." >&2
else
  echo "[agent-reach] Already installed, skipping." >&2
fi

echo "export PATH=\"$VENV_DIR/bin:\$PATH\"" >> "$ENV_FILE"
