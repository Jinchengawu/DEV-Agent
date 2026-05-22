#!/bin/bash

# DEV-Agent OpenClaw 启动脚本
# 使用方法: ./start-openclaw.sh

set -e

echo "🚀 DEV-Agent OpenClaw 启动"
echo "=========================="

# 检查依赖
if ! command -v openclaw &> /dev/null; then
    echo "❌ OpenClaw 未安装"
    echo "请先安装 OpenClaw: npm install -g openclaw"
    exit 1
fi

if ! command -v hermes &> /dev/null; then
    echo "❌ Hermes 未安装"
    exit 1
fi

echo "✅ OpenClaw 已安装: $(openclaw --version)"
echo "✅ Hermes 已安装"

# 定义 Agent 配置
declare -A AGENTS=(
    ["frontend"]="8201:~/.hermes-dev-frontend:前端开发 Agent"
    ["backend"]="8202:~/.hermes-dev-backend:后端开发 Agent"
    ["testing"]="8203:~/.hermes-dev-testing:测试开发 Agent"
    ["devops"]="8204:~/.hermes-dev-devops:DevOps Agent"
)

# 步骤 1: 启动 Hermes 实例
echo ""
echo "📦 步骤 1: 启动 Hermes 实例..."

for agent in "${!AGENTS[@]}"; do
    IFS=':' read -r port home_dir label <<< "${AGENTS[$agent]}"
    
    echo "   启动 Hermes for $label (端口 $port)..."
    
    # 创建配置目录
    mkdir -p "$home_dir"
    
    # 创建配置文件
    cat > "$home_dir/config.yaml" << EOF
model:
  default: mimo-v2.5
  provider: xiaomi
  base_url: https://token-plan-sgp.xiaomimimo.com/v1

platforms:
  api_server:
    enabled: true
    extra:
      host: "127.0.0.1"
      port: $port
      model_name: "hermes-agent"

agent:
  max_turns: 90
  gateway_timeout: 1800

toolsets:
  - hermes-cli
EOF
    
    # 启动 Hermes（后台运行）
    HERMES_HOME="$home_dir" hermes gateway run &
    HERMES_PID=$!
    
    echo "   ✅ Hermes 已启动 (PID: $HERMES_PID, 端口: $port)"
    
    # 等待 Hermes 启动
    sleep 3
done

# 步骤 2: 安装 OpenClaw 插件
echo ""
echo "📦 步骤 2: 安装 OpenClaw 插件..."

OPENCLAW_HOOKS_DIR="$HOME/.openclaw/hooks"
mkdir -p "$OPENCLAW_HOOKS_DIR"

# 复制插件
cp -r plugins/ai-router "$OPENCLAW_HOOKS_DIR/"
echo "   ✅ AI 路由器插件已安装"

# 步骤 3: 启动 OpenClaw Gateway
echo ""
echo "📦 步骤 3: 启动 OpenClaw Gateway..."

openclaw gateway &
OPENCLAW_PID=$!

echo "   ✅ OpenClaw Gateway 已启动 (PID: $OPENCLAW_PID)"

# 等待启动
sleep 5

echo ""
echo "🎉 所有服务已启动！"
echo ""
echo "📋 服务状态："

# 检查 Hermes 状态
echo "Hermes 实例:"
for agent in "${!AGENTS[@]}"; do
    IFS=':' read -r port home_dir label <<< "${AGENTS[$agent]}"
    if curl -s "http://127.0.0.1:$port/health" > /dev/null 2>&1; then
        echo "   ✅ $label (端口 $port) - 运行中"
    else
        echo "   ❌ $label (端口 $port) - 未响应"
    fi
done

echo ""
echo "📋 使用方法："
echo "   1. 测试路由: openclaw agent --local -m \"创建 React 组件\""
echo "   2. 查看日志: openclaw logs --follow"
echo "   3. 停止服务: pkill -f 'hermes gateway run' && pkill -f 'openclaw gateway'"
