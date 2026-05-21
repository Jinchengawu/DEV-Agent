#!/bin/bash

# DEV-Agent 全部服务启动脚本
# 使用方法: ./start-all.sh

set -e

echo "🚀 DEV-Agent 多服务启动"
echo "========================"

# 检查 Hermes 是否已安装
if ! command -v hermes &> /dev/null; then
    echo "❌ Hermes 未安装"
    exit 1
fi

echo "✅ Hermes 已安装"

# 定义 Agent 配置
declare -A AGENTS=(
    ["dev-frontend"]="8201:~/.hermes-dev-frontend:前端开发 Agent"
    ["dev-backend"]="8202:~/.hermes-dev-backend:后端开发 Agent"
    ["dev-testing"]="8203:~/.hermes-dev-testing:测试开发 Agent"
    ["dev-devops"]="8204:~/.hermes-dev-devops:DevOps Agent"
)

# 启动每个 Agent
for agent in "${!AGENTS[@]}"; do
    IFS=':' read -r port home_dir label <<< "${AGENTS[$agent]}"
    
    echo ""
    echo "📦 启动 $label ($agent)..."
    
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
    
    echo "   ✅ 配置文件已创建: $home_dir/config.yaml"
    
    # 启动实例（后台运行）
    HERMES_HOME="$home_dir" hermes gateway run &
    PID=$!
    
    echo "   ✅ 实例已启动 (PID: $PID, 端口: $port)"
    
    # 等待实例启动
    sleep 2
done

echo ""
echo "🎉 所有 Agent 已启动！"
echo ""
echo "📋 Agent 状态："
for agent in "${!AGENTS[@]}"; do
    IFS=':' read -r port home_dir label <<< "${AGENTS[$agent]}"
    if curl -s "http://127.0.0.1:$port/health" > /dev/null 2>&1; then
        echo "   ✅ $label (端口 $port) - 运行中"
    else
        echo "   ❌ $label (端口 $port) - 未响应"
    fi
done

echo ""
echo "📋 下一步："
echo "   1. 启动 Gateway: ./start-gateway.sh"
echo "   2. 测试路由: ./test-routing.sh"
echo "   3. 停止所有实例: pkill -f 'hermes gateway run'"
