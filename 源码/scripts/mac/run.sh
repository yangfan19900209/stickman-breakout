#!/bin/bash
set -euo pipefail
source "$(dirname -- "$0")/env.sh"
mac_require_platform
cd -- "$MAC_SOURCE_DIR"
action="${1:-menu}"
if [ "$#" -gt 0 ]; then shift; fi

if [ "$action" = setup ]; then exec bash "$MAC_SCRIPT_DIR/setup.sh" "$@"; fi
if [ "$action" = menu ]; then
  printf '\n线条突围 · Mac 开发入口\n\n'
  printf '  1  首次初始化 + 全流程自检（测试、双平台构建、浏览器回归）\n'
  printf '  2  测试代码\n  3  构建 Web 并试玩\n  4  构建微信包\n'
  printf '  5  固定打包微信包（生成 ZIP 与哈希）\n  6  在微信开发者工具打开\n'
  printf '  7  上传前检查\n  8  上传微信开发版本\n  9  环境诊断\n  0  退出\n\n'
  read -r -p '选择操作：' choice
  case "$choice" in
    1) bash "$MAC_SCRIPT_DIR/setup.sh"; action=verify ;;
    2) action=test ;;
    3) action=dev ;;
    4) action=build; set -- wechatgame ;;
    5) action=package ;;
    6) action=open-wechat ;;
    7) action=upload-check ;;
    8) action=upload ;;
    9) action=doctor ;;
    0) exit 0 ;;
    *) printf '%s\n' '无效选择。' >&2; exit 1 ;;
  esac
fi
mac_find_node
exec "$MAC_NODE_BIN" "$MAC_SCRIPT_DIR/workflow.mjs" "$action" "$@"
