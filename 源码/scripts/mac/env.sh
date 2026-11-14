#!/bin/bash
# Sourced by the Mac entry points. No global shell/profile changes.
MAC_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
MAC_SOURCE_DIR="$(cd -- "$MAC_SCRIPT_DIR/../.." && pwd)"
MAC_LOCAL_DIR="$MAC_SOURCE_DIR/local/mac"
MAC_NODE_VERSION="24.22.3"
MAC_NODE_DIR="$MAC_LOCAL_DIR/node-v$MAC_NODE_VERSION"

mac_require_platform() {
  if [ "$(uname -s)" != Darwin ]; then
    printf '%s\n' '此入口只用于 macOS；Windows 继续使用原 npm 构建命令。' >&2
    return 1
  fi
}

mac_find_node() {
  if [ -n "${NODE_BIN:-}" ] && [ -x "$NODE_BIN" ]; then
    MAC_NODE_BIN="$NODE_BIN"
  elif [ -x "$MAC_NODE_DIR/bin/node" ]; then
    MAC_NODE_BIN="$MAC_NODE_DIR/bin/node"
  elif command -v node >/dev/null 2>&1; then
    MAC_NODE_BIN="$(command -v node)"
  elif [ -x /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node ]; then
    # Diagnostic fallback only; setup installs an independent official runtime.
    MAC_NODE_BIN=/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node
  else
    printf '%s\n' '未找到 Node，请先运行 bash scripts/mac/setup.sh。' >&2
    return 1
  fi
  export PATH="$(dirname -- "$MAC_NODE_BIN"):$PATH"
  export npm_config_cache="$MAC_LOCAL_DIR/npm-cache"
  export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
  export MAC_NODE_BIN
}
