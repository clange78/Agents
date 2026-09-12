#!/bin/bash
# Installs/persists the Agent Reach CLI (https://github.com/Panniantong/agent-reach)
# for Claude Code on the web, whose containers can start from a fresh filesystem
# each session. Idempotent: skips work that's already done (e.g. the container
# was cached from a prior session).
set -euo pipefail

# Only remote/web sessions get a fresh container each time — nothing to persist
# on a local machine where the filesystem already survives between sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

VENV_DIR="$HOME/.agent-reach-venv"
SRC_DIR="$HOME/.local/src/agent-reach"
BIN="$VENV_DIR/bin/agent-reach"
TWITTER_BIN="$HOME/.local/bin/twitter"
ENV_FILE="${CLAUDE_ENV_FILE:-/dev/null}"

CORE_OK=0
[ -x "$BIN" ] && "$BIN" --version >/dev/null 2>&1 && CORE_OK=1

if [ "$CORE_OK" -eq 0 ]; then
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

  # Non-interactive system install: gh CLI, mcporter, yt-dlp JS runtime, Exa
  # search, plus the Twitter channel package (twitter-cli, via uv). This does
  # NOT configure Twitter credentials (agent-reach configure twitter-cookies)
  # or any other login-required channel (Reddit/Bilibili/XiaoHongShu/
  # Facebook/Instagram/LinkedIn/etc) — those need per-platform credentials
  # supplied explicitly, not something to do unattended on every session.
  "$BIN" install --env=auto --system --channels=twitter || true

  echo "[agent-reach] Install complete." >&2
elif [ ! -x "$TWITTER_BIN" ]; then
  # Core already installed (cached container) but the Twitter channel isn't —
  # e.g. a container cached before this channel was added to the hook. Add it
  # without repeating the full clone/venv/system setup.
  echo "[agent-reach] Core already installed; adding Twitter channel..." >&2
  export PATH="$VENV_DIR/bin:$PATH"
  "$BIN" install --env=auto --system --channels=twitter || true
else
  echo "[agent-reach] Already installed, skipping." >&2
fi

echo "export PATH=\"$VENV_DIR/bin:\$PATH\"" >> "$ENV_FILE"
