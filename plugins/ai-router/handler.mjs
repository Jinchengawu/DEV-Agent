import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ============================================================================
// Configuration Loader
// ============================================================================

function loadConfig() {
  const configPath = join(process.cwd(), 'config/openclaw/instances.yaml');
  
  if (!existsSync(configPath)) {
    return getDefaultConfig();
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    // 简单的 YAML 解析（仅支持我们的 instances.yaml 格式）
    return parseSimpleYaml(content);
  } catch (error) {
    console.error('[ai-router] 配置加载失败:', error);
    return getDefaultConfig();
  }
}

function parseSimpleYaml(content) {
  // 简化的 YAML 解析器
  const lines = content.split('\n');
  const instances = [];
  let currentInstance = null;
  let currentSkills = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- id:')) {
      if (currentInstance) {
        currentInstance.skills = currentSkills;
        instances.push(currentInstance);
      }
      currentInstance = {
        id: trimmed.replace('- id:', '').trim(),
        label: '',
        port: 0,
        hermes_port: 0,
        tags: [],
        skills: [],
        timeout_ms: 120000,
      };
      currentSkills = [];
    } else if (currentInstance) {
      if (trimmed.startsWith('label:')) {
        currentInstance.label = trimmed.replace('label:', '').trim().replace(/"/g, '');
      } else if (trimmed.startsWith('port:')) {
        currentInstance.port = parseInt(trimmed.replace('port:', '').trim());
      } else if (trimmed.startsWith('hermes_port:')) {
        currentInstance.hermes_port = parseInt(trimmed.replace('hermes_port:', '').trim());
      } else if (trimmed.startsWith('timeout_ms:')) {
        currentInstance.timeout_ms = parseInt(trimmed.replace('timeout_ms:', '').trim());
      } else if (trimmed.startsWith('- ')) {
        const tag = trimmed.replace('- ', '').trim().replace(/"/g, '');
        // 区分 tags 和 skills
        if (!trimmed.includes('skills:') && !trimmed.includes('tags:')) {
          currentInstance.tags.push(tag);
        }
      }
    }
  }
  
  if (currentInstance) {
    currentInstance.skills = currentSkills;
    instances.push(currentInstance);
  }
  
  return {
    instances,
    routing: {
      default: 'dev-backend',
    },
  };
}

function getDefaultConfig() {
  return {
    instances: [
      { id: 'dev-frontend', label: '前端开发 Agent', port: 8201, hermes_port: 9201, tags: ['react','vue','component','ui','css','typescript','frontend','前端'], skills: [], timeout_ms: 120000 },
      { id: 'dev-backend', label: '后端开发 Agent', port: 8202, hermes_port: 9202, tags: ['api','database','server','python','node','go','backend','后端'], skills: [], timeout_ms: 120000 },
      { id: 'dev-testing', label: '测试开发 Agent', port: 8203, hermes_port: 9203, tags: ['test','unit','e2e','coverage','jest','pytest','testing','测试'], skills: [], timeout_ms: 180000 },
      { id: 'dev-devops', label: 'DevOps Agent', port: 8204, hermes_port: 9204, tags: ['docker','k8s','kubernetes','deploy','ci/cd','devops','运维'], skills: [], timeout_ms: 300000 },
      { id: 'dev-pm', label: '产品经理 Agent', port: 8205, hermes_port: 9205, tags: ['prd','requirement','product','strategy','user-story','pm','产品','需求'], skills: [], timeout_ms: 120000 },
    ],
    routing: { default: 'dev-backend' },
  };
}

// ============================================================================
// Intent Analysis
// ============================================================================

function analyzeIntent(message, instances) {
  const lower = message.toLowerCase();
  const scores = instances.map(inst => {
    let score = 0;
    for (const tag of inst.tags) {
      if (lower.includes(tag.toLowerCase())) {
        score += 10;
      }
    }
    return { instance: inst, score };
  });
  
  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].instance : null;
}

// ============================================================================
// Hermes Caller
// ============================================================================

async function callAgent(instance, messages) {
  try {
    const response = await fetch(`http://127.0.0.1:${instance.port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        sessionId: `ocl-${Date.now()}`,
      }),
      signal: AbortSignal.timeout(instance.timeout_ms || 180000),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '无法生成响应';
    }
    return `Agent 调用失败: HTTP ${response.status}`;
  } catch (error) {
    return `Agent 连接失败: ${error instanceof Error ? error.message : '未知错误'}`;
  }
}

// ============================================================================
// Main Handler — OpenClaw Hook
// ============================================================================

const handler = async (event) => {
  // 只处理消息接收事件
  if (event.type !== 'message' || event.action !== 'received') {
    return;
  }
  
  const content = event.context?.content || event.message;
  if (!content || content.startsWith('/')) {
    return;
  }
  
  console.log(`[ai-router] 收到消息: "${content.substring(0, 50)}..."`);
  
  const config = loadConfig();
  const instance = analyzeIntent(content, config.instances);
  
  const target = instance || config.instances.find(i => i.id === config.routing.default) || config.instances[0];
  
  console.log(`[ai-router] 路由到: ${target.label} (${target.id}) → Agent:${target.port}`);
  
  const response = await callAgent(target, [{ role: 'user', content }]);
  
  // 将响应写回事件
  if (event.messages) {
    event.messages.push({
      role: 'assistant',
      content: response,
    });
  }
  
  return response;
};

export default handler;
