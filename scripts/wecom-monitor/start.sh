#!/bin/bash
# 企業微信群消息监控器启动脚本
# 目标: 莲藕（T-乐康医生团队）交流群
# 只读模式 - 绝不发送任何消息

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/monitor.js"
LOG_FILE="$SCRIPT_DIR/messages.log"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  企業微信群消息监控器${NC}"
echo -e "${CYAN}  目标: 莲藕（T-乐康医生团队）交流群${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装${NC}"
    exit 1
fi

# 检查企業微信是否运行
if ! pgrep -q "企业微信"; then
    echo -e "${YELLOW}警告: 企業微信 App 似乎未运行${NC}"
    echo -e "${YELLOW}请先启动企業微信并打开目标群聊${NC}"
    echo ""
fi

# 检查辅助功能权限
if ! osascript -l JavaScript -e 'Application("System Events").processes["企业微信"].windows[0].name()' &>/dev/null; then
    echo -e "${RED}错误: 无法访问企業微信窗口${NC}"
    echo -e "${RED}请授予终端/IDE 辅助功能权限:${NC}"
    echo -e "${RED}  系统设置 → 隐私与安全性 → 辅助功能 → 勾选终端/Cursor${NC}"
    echo ""
    echo -e "${YELLOW}是否继续尝试启动? (y/n)${NC}"
    read -r answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
        exit 1
    fi
fi

echo -e "${GREEN}启动监控器...${NC}"
echo -e "${GREEN}日志文件: $LOG_FILE${NC}"
echo -e "${GREEN}按 Ctrl+C 停止监控${NC}"
echo ""

# 启动 (传递所有参数)
exec node "$MONITOR_SCRIPT" "$@"
