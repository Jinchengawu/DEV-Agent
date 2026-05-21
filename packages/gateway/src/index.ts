/**
 * DEV-Agent Gateway Server
 * 
 * 开发者多 Agent 路由网关：根据任务内容自动选择最合适的 Agent
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

// ============================================================================
// Types
// ============================================================================

interface GatewayConfig {
  server: {
    host: string;
    port: number;
  };
  auth: {
    enabled: boolean;
    apiKey: string;
  };
  agents: AgentConfig[];
  routing: {
    defaultAgent: string;
  };
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  logging: {
    level: string;
    auditFile: string;
  };
}

interface AgentConfig {
  id: string;
  label: string;
  url: string;
  tags: string[];
  keywords: string[];
  skills: string[];
  timeoutMs: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

function loadConfig(): GatewayConfig {
  const configPath = join(process.env.HOME || '~', '.dev-agent', 'config.yaml');
  
  if (!existsSync(configPath)) {
    return getDefaultConfig();
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = parseYaml(content) as GatewayConfig;
    return { ...getDefaultConfig(), ...config };
  } catch (error) {
    console.error(`[gateway] 加载配置失败:`, error);
    return getDefaultConfig();
  }
}

function getDefaultConfig(): GatewayConfig {
  return {
    server: {
      host: process.env.DEV_AGENT_HOST || '127.0.0.1',
      port: parseInt(process.env.DEV_AGENT_PORT || '8200'),
    },
    auth: {
      enabled: process.env.DEV_AGENT_AUTH_ENABLED !== 'false',
      apiKey: process.env.DEV_AGENT_API_KEY || '',
    },
    agents: [
      {
        id: 'dev-frontend',
        label: '前端开发 Agent',
        url: 'http://127.0.0.1:8201',
        tags: ['frontend', 'react', 'vue', 'css', 'ui', 'typescript'],
        keywords: ['react', 'vue', '组件', 'ui', 'css', '样式', '前端', '界面', 'typescript'],
        skills: ['react-development', 'vue-development', 'css-tailwind'],
        timeoutMs: 120000,
      },
      {
        id: 'dev-backend',
        label: '后端开发 Agent',
        url: 'http://127.0.0.1:8202',
        tags: ['backend', 'api', 'database', 'server', 'python', 'node', 'go'],
        keywords: ['api', '数据库', '接口', '服务器', '后端', 'python', 'node', 'go'],
        skills: ['python-development', 'nodejs-development', 'api-design'],
        timeoutMs: 120000,
      },
      {
        id: 'dev-testing',
        label: '测试开发 Agent',
        url: 'http://127.0.0.1:8203',
        tags: ['testing', 'test', 'qa', 'coverage', 'e2e', 'unit'],
        keywords: ['测试', '单元测试', 'e2e', '覆盖率', 'jest', 'pytest'],
        skills: ['pytest-development', 'jest-development', 'e2e-testing'],
        timeoutMs: 180000,
      },
      {
        id: 'dev-devops',
        label: 'DevOps Agent',
        url: 'http://127.0.0.1:8204',
        tags: ['devops', 'docker', 'k8s', 'deploy', 'ci/cd', 'monitoring'],
        keywords: ['docker', 'k8s', '部署', 'ci/cd', '运维', '容器', '监控'],
        skills: ['docker-management', 'kubernetes-deployment', 'ci-cd-pipeline'],
        timeoutMs: 300000,
      },
    ],
    routing: {
      defaultAgent: 'dev-backend',
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 60,
    },
    logging: {
      level: 'INFO',
      auditFile: join(process.env.HOME || '~', '.dev-agent', 'logs', 'audit.log'),
    },
  };
}

// ============================================================================
// Circuit Breaker
// ============================================================================

const circuitBreakers = new Map<string, CircuitBreakerState>();

function getCircuitBreaker(agentId: string): CircuitBreakerState {
  if (!circuitBreakers.has(agentId)) {
    circuitBreakers.set(agentId, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    });
  }
  return circuitBreakers.get(agentId)!;
}

function recordSuccess(agentId: string): void {
  const state = getCircuitBreaker(agentId);
  state.failures = 0;
  state.isOpen = false;
}

function recordFailure(agentId: string, failureThreshold: number): void {
  const state = getCircuitBreaker(agentId);
  state.failures++;
  state.lastFailure = Date.now();
  
  if (state.failures >= failureThreshold) {
    state.isOpen = true;
    console.warn(`[circuit-breaker] ${agentId} 熔断器打开`);
  }
}

function isCircuitOpen(agentId: string, coolDownMs: number): boolean {
  const state = getCircuitBreaker(agentId);
  
  if (!state.isOpen) {
    return false;
  }
  
  if (Date.now() - state.lastFailure >= coolDownMs) {
    state.isOpen = false;
    return false;
  }
  
  return true;
}

// ============================================================================
// Router
// ============================================================================

function analyzeTask(task: string, agents: AgentConfig[]): { agent: AgentConfig | null; score: number } {
  const taskLower = task.toLowerCase();
  
  const scores = agents.map(agent => {
    let score = 0;
    
    // 关键词匹配
    for (const keyword of agent.keywords) {
      if (taskLower.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
    
    // 标签匹配
    for (const tag of agent.tags) {
      if (taskLower.includes(tag.toLowerCase())) {
        score += 5;
      }
    }
    
    // 熔断器检查
    const coolDownMs = 120 * 1000;
    if (isCircuitOpen(agent.id, coolDownMs)) {
      score -= 100;
    }
    
    return { agent, score };
  });
  
  scores.sort((a, b) => b.score - a.score);
  
  return scores[0].score > 0 
    ? { agent: scores[0].agent, score: scores[0].score }
    : { agent: null, score: 0 };
}

// ============================================================================
// Audit Logger
// ============================================================================

function writeAuditLog(log: Record<string, any>, auditFile: string): void {
  try {
    const dir = join(auditFile, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const logLine = JSON.stringify(log) + '\n';
    appendFileSync(auditFile, logLine);
  } catch (error) {
    console.error('[audit] 写入日志失败:', error);
  }
}

// ============================================================================
// HTTP Handler
// ============================================================================

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: GatewayConfig
): Promise<void> {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;
  
  // 健康检查
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      gateway: 'dev-agent',
      agents: config.agents.length
    }));
    return;
  }
  
  // Agent 状态
  if (path === '/health/agents') {
    const agents = config.agents.map(a => ({
      id: a.id,
      label: a.label,
      url: a.url,
      circuitBreaker: getCircuitBreaker(a.id),
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ agents }));
    return;
  }
  
  // 鉴权检查
  if (config.auth.enabled) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    
    const token = authHeader.slice(7);
    if (token !== config.auth.apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API key' }));
      return;
    }
  }
  
  // 聊天补全
  if (req.method === 'POST' && path === '/v1/chat/completions') {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    
    try {
      const request = JSON.parse(body);
      const message = request.messages?.[0]?.content || '';
      
      // 分析任务并选择 Agent
      const { agent, score } = analyzeTask(message, config.agents);
      
      if (!agent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: requestId,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'dev-agent',
          choices: [{
            index: 0,
            message: { 
              role: 'assistant', 
              content: `无法识别任务类型，请提供更多细节。\n\n可用的 Agent：\n${config.agents.map(a => `- ${a.label}: ${a.keywords.slice(0, 3).join(', ')}`).join('\n')}`
            },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: 0, completion_tokens: 0 },
          agent: null,
          score: 0,
          latency_ms: Date.now() - startTime,
        }));
        return;
      }
      
      // 熔断器检查
      const coolDownMs = 120 * 1000;
      if (isCircuitOpen(agent.id, coolDownMs)) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Service Unavailable', 
          message: `Agent ${agent.id} is circuit-broken` 
        }));
        return;
      }
      
      // 转发请求到 Agent
      const response = await fetch(`${agent.url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(agent.timeoutMs),
      });
      
      const data = await response.json() as any;
      const latencyMs = Date.now() - startTime;
      
      // 记录成功
      recordSuccess(agent.id);
      
      // 审计日志
      writeAuditLog({
        timestamp: new Date().toISOString(),
        request_id: requestId,
        task: message.substring(0, 100),
        agent: agent.id,
        score,
        status: response.status,
        latency_ms: latencyMs,
      }, config.logging.auditFile);
      
      // 返回响应
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ...data,
        agent: agent.id,
        agent_label: agent.label,
        score,
        latency_ms: latencyMs,
      }));
      
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      
      // 记录失败
      if (error instanceof Error) {
        recordFailure(config.routing.defaultAgent, 3);
      }
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', message: `Path ${path} not found` }));
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('🚀 DEV-Agent Gateway starting...');
  
  const config = loadConfig();
  
  console.log(`📡 Server: http://${config.server.host}:${config.server.port}`);
  console.log(`🔐 Auth: ${config.auth.enabled ? 'enabled' : 'disabled'}`);
  console.log(`🤖 Agents: ${config.agents.length}`);
  
  config.agents.forEach(a => {
    console.log(`   - ${a.label} (${a.url})`);
  });
  
  const server = createServer((req, res) => {
    handleRequest(req, res, config).catch(error => {
      console.error('[gateway] 请求处理失败:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });
  });
  
  server.listen(config.server.port, config.server.host, () => {
    console.log(`\n✅ Gateway listening on http://${config.server.host}:${config.server.port}`);
    console.log('\n📋 Available endpoints:');
    console.log(`   GET  /health              - 健康检查`);
    console.log(`   GET  /health/agents       - Agent 状态`);
    console.log(`   POST /v1/chat/completions - 聊天补全`);
    console.log('\n🧪 测试命令:');
    console.log(`   curl http://${config.server.host}:${config.server.port}/health`);
  });
}

main().catch(error => {
  console.error('❌ Gateway startup failed:', error);
  process.exit(1);
});
