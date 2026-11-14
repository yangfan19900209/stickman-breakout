#!/bin/bash
set -u
project_root="$(cd -- "$(dirname -- "$0")" && pwd)"
cd -- "$project_root/源码" || exit 1
pause_on_exit=0
if [ "$#" -eq 0 ]; then pause_on_exit=1; set -- menu; fi
bash scripts/mac/run.sh "$@"
result=$?
if [ "$result" -ne 0 ]; then
  printf '\n操作未完成（退出码 %s）。请查看上方错误与开发进度/验证记录/mac/。\n' "$result"
fi
if [ "$pause_on_exit" -eq 1 ] && [ -t 0 ]; then
  read -r -p '按回车关闭此窗口…' _
fi
exit "$result"
