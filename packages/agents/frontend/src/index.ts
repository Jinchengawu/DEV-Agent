/**
 * DEV-Agent Frontend Agent (Hermes 集成版)
 * 
 * 前端开发专用 Agent：通过 Hermes 实现真正的 AI 能力
 */

import express from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface AgentConfig {
  id: string;
  label: string;
  port: number;
  hermesPort: number;
  skills: string[];
}

const config: AgentConfig = {
  id: 'dev-frontend',
  label: '前端开发 Agent',
  port: parseInt(process.env.AGENT_PORT || '8201'),
  hermesPort: parseInt(process.env.HERMES_PORT || '8201'),
  skills: [
    'react-development',
    'vue-development',
    'nextjs-development',
    'css-tailwind',
    'typescript-best-practices',
    'performance-optimization',
  ],
};

// 加载技能内容
function loadSkillContent(skillName: string): string {
  const skillPath = join(process.cwd(), '../../skills/frontend', skillName, 'SKILL.md');
  
  if (existsSync(skillPath)) {
    return readFileSync(skillPath, 'utf-8');
  }
  
  return '';
}

// 构建系统提示
function buildSystemPrompt(): string {
  const skills = config.skills.map(skill => {
    const content = loadSkillContent(skill);
    return `## ${skill}\n${content.substring(0, 500)}...`;
  }).join('\n\n');

  return `你是一个专业的前端开发 Agent，专注于 React、Vue、TypeScript、CSS 开发。

你的技能包括：
${config.skills.map(s => `- ${s}`).join('\n')}

技能详情：
${skills}

请根据用户的需求，提供专业的前端开发建议和代码示例。`;
}

// 转发请求到 Hermes
async function callHermes(message: string): Promise<string> {
  try {
    const response = await fetch(`http://127.0.0.1:${config.hermesPort}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'hermes-agent',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: message }
        ],
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (response.ok) {
      const data = await response.json() as any;
      return data.choices?.[0]?.message?.content || '无法生成响应';
    }
    
    return `Hermes 调用失败: ${response.status}`;
  } catch (error) {
    return `Hermes 连接失败: ${error instanceof Error ? error.message : '未知错误'}`;
  }
}

const app = express();
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: config.id,
    label: config.label,
    hermesPort: config.hermesPort,
    skills: config.skills.length,
  });
});

// 聊天补全（转发到 Hermes）
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages } = req.body;
    const userMessage = messages?.[0]?.content || '';
    
    // 调用 Hermes 获取 AI 响应
    const content = await callHermes(userMessage);
    
    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: config.id,
      choices: [{
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: userMessage.length,
        completion_tokens: content.length,
        total_tokens: userMessage.length + content.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(config.port, () => {
  console.log(`🚀 ${config.label} listening on port ${config.port}`);
  console.log(`🔗 Hermes integration: http://127.0.0.1:${config.hermesPort}`);
  console.log(`📋 Skills: ${config.skills.join(', ')}`);
});
