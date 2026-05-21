#!/bin/bash

# DEV-Agent 路由测试脚本
# 使用方法: ./test-routing.sh

set -e

GATEWAY_URL="http://127.0.0.1:8200"

echo "🧪 DEV-Agent 路由测试"
echo "===================="

# 测试 1: 健康检查
echo ""
echo "1️⃣ 测试健康检查..."
if curl -s "$GATEWAY_URL/health" > /dev/null 2>&1; then
    echo "   ✅ Gateway 运行正常"
    curl -s "$GATEWAY_URL/health" | head -20
else
    echo "   ❌ Gateway 未运行"
    echo "   请先启动: ./start-gateway.sh"
    exit 1
fi

# 测试 2: Agent 状态
echo ""
echo "2️⃣ 测试 Agent 状态..."
if curl -s "$GATEWAY_URL/health/agents" > /dev/null 2>&1; then
    echo "   ✅ Agent 状态查询成功"
    curl -s "$GATEWAY_URL/health/agents" | head -30
else
    echo "   ⚠️  无法获取 Agent 状态"
fi

# 测试 3: 前端任务路由
echo ""
echo "3️⃣ 测试前端任务路由..."
RESPONSE=$(curl -s -X POST "$GATEWAY_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dev-agent",
    "messages": [{"role": "user", "content": "帮我创建 React 登录组件"}],
    "max_tokens": 100
  }' 2>&1)

if echo "$RESPONSE" | grep -q "dev-frontend"; then
    echo "   ✅ 正确路由到前端 Agent"
else
    echo "   ⚠️  路由结果:"
    echo "   $RESPONSE" | head -5
fi

# 测试 4: 后端任务路由
echo ""
echo "4️⃣ 测试后端任务路由..."
RESPONSE=$(curl -s -X POST "$GATEWAY_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dev-agent",
    "messages": [{"role": "user", "content": "设计用户数据库表结构"}],
    "max_tokens": 100
  }' 2>&1)

if echo "$RESPONSE" | grep -q "dev-backend"; then
    echo "   ✅ 正确路由到后端 Agent"
else
    echo "   ⚠️  路由结果:"
    echo "   $RESPONSE" | head -5
fi

# 测试 5: 测试任务路由
echo ""
echo "5️⃣ 测试任务路由..."
RESPONSE=$(curl -s -X POST "$GATEWAY_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dev-agent",
    "messages": [{"role": "user", "content": "编写单元测试用例"}],
    "max_tokens": 100
  }' 2>&1)

if echo "$RESPONSE" | grep -q "dev-testing"; then
    echo "   ✅ 正确路由到测试 Agent"
else
    echo "   ⚠️  路由结果:"
    echo "   $RESPONSE" | head -5
fi

echo ""
echo "🎉 测试完成！"
echo ""
echo "📋 Gateway 端点:"
echo "   GET  $GATEWAY_URL/health"
echo "   GET  $GATEWAY_URL/health/agents"
echo "   POST $GATEWAY_URL/v1/chat/completions"
