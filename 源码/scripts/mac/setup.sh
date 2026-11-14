#!/bin/bash
set -euo pipefail
source "$(dirname -- "$0")/env.sh"
mac_require_platform
cd -- "$MAC_SOURCE_DIR"
case "$(uname -m)" in
  arm64) node_arch=arm64 ;;
  x86_64) node_arch=x64 ;;
  *) printf '%s\n' '不支持的 Mac CPU 架构。' >&2; exit 1 ;;
esac
mkdir -p "$MAC_LOCAL_DIR"

if [ ! -x "$MAC_NODE_DIR/bin/node" ] || [ ! -f "$MAC_NODE_DIR/lib/node_modules/npm/bin/npm-cli.js" ]; then
  download_dir="$(mktemp -d "$MAC_LOCAL_DIR/node-download.XXXXXX")"
  trap 'rm -rf -- "$download_dir"' EXIT
  archive="node-v$MAC_NODE_VERSION-darwin-$node_arch.tar.gz"
  base_url="https://nodejs.org/dist/v$MAC_NODE_VERSION"
  printf '从 Node.js 官网安装项目独立运行环境 v%s（%s）…\n' "$MAC_NODE_VERSION" "$node_arch"
  curl --fail --location --retry 2 --connect-timeout 20 --max-time 600 \
    "$base_url/$archive" -o "$download_dir/$archive"
  curl --fail --location --retry 2 --connect-timeout 20 --max-time 120 \
    "$base_url/SHASUMS256.txt" -o "$download_dir/SHASUMS256.txt"
  expected="$(awk -v file="$archive" '$2 == file { print $1 }' "$download_dir/SHASUMS256.txt")"
  actual="$(shasum -a 256 "$download_dir/$archive" | awk '{print $1}')"
  if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
    printf '%s\n' 'Node 下载校验失败，未安装。' >&2
    exit 1
  fi
  mkdir "$download_dir/runtime"
  tar -xzf "$download_dir/$archive" -C "$download_dir/runtime" --strip-components=1
  "$download_dir/runtime/bin/node" --version
  if [ -e "$MAC_NODE_DIR" ]; then
    mv "$MAC_NODE_DIR" "$MAC_NODE_DIR.incomplete-$(date +%Y%m%d-%H%M%S)-$$"
  fi
  mv "$download_dir/runtime" "$MAC_NODE_DIR"
fi

export NODE_BIN="$MAC_NODE_DIR/bin/node"
mac_find_node
npm_cli="$MAC_NODE_DIR/lib/node_modules/npm/bin/npm-cli.js"
printf '\nNode: %s\nnpm: ' "$MAC_NODE_BIN"
"$MAC_NODE_BIN" "$npm_cli" --version

# Keep the previous offline/editor dependencies recoverable before npm ci.
backup_dir=''
if [ -e node_modules ]; then
  backup_dir="$MAC_LOCAL_DIR/dependencies-before-setup-$(date +%Y%m%d-%H%M%S)-$$"
  mv node_modules "$backup_dir"
fi
if ! "$MAC_NODE_BIN" "$npm_cli" ci --no-audit --no-fund; then
  if [ -e node_modules ]; then
    mv node_modules "$MAC_LOCAL_DIR/dependencies-incomplete-$(date +%Y%m%d-%H%M%S)-$$"
  fi
  if [ -n "$backup_dir" ]; then mv "$backup_dir" node_modules; fi
  printf '%s\n' '依赖安装失败，原有依赖已保留/恢复。请检查终端网络后重试。' >&2
  exit 1
fi
"$MAC_NODE_BIN" scripts/mac/doctor.mjs --require-ready
printf '\nMac 环境已初始化。可运行 bash scripts/mac/run.sh verify。\n'
