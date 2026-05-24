'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { AGENTS, detectAgent } from '@/lib/agents'
import type { ChatMessage } from '@/lib/types'

const AGENT_LIST = Object.entries(AGENTS).map(([, info]) => ({ ...info }))

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm DEV-Agent-Teams. I can help you with:\n\n• 🎨 Frontend development (React, Vue, TypeScript)\n• ⚙️ Backend development (Python, Node.js, Go)\n• 🧪 Testing (pytest, Jest, Playwright)\n• 🚀 DevOps (Docker, Kubernetes, CI/CD)\n• 📋 Product Management (PRD, user stories, requirements)\n\nWhat would you like to work on?",
  agentId: 'system',
  timestamp: Date.now(),
}

function getWelcomeMessage(agentId: string): ChatMessage {
  if (!agentId) return WELCOME_MESSAGE
  const info = AGENTS[agentId]
  if (!info) return WELCOME_MESSAGE
  return {
    id: `welcome-${agentId}`,
    role: 'assistant',
    content: `Hi, I'm the ${info.name}. I specialize in ${info.label}. How can I help you today?`,
    agentId: info.id,
    timestamp: Date.now(),
  }
}

export default function ChatContent() {
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const initialAgent = searchParams.get('agent') || ''

  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgent)
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({})
  const [sessions, setSessions] = useState<Record<string, string>>({})
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const agentKey = selectedAgent || 'auto'
  const currentMessages = conversations[agentKey] || [getWelcomeMessage(selectedAgent)]
  const currentSessionId = sessions[agentKey] || ''

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [currentMessages, isSending, scrollToBottom])

  useEffect(() => {
    if (initialAgent) {
      setSelectedAgent(initialAgent)
    }
  }, [initialAgent])

  const addMessage = useCallback((key: string, msg: ChatMessage) => {
    setConversations((prev) => {
      const msgs = [...(prev[key] || [getWelcomeMessage(key === 'auto' ? '' : key)])]
      msgs.push(msg)
      return { ...prev, [key]: msgs }
    })
  }, [])

  const clearConversation = useCallback(() => {
    setConversations((prev) => {
      const next = { ...prev }
      delete next[agentKey]
      return next
    })
    setSessions((prev) => {
      const next = { ...prev }
      delete next[agentKey]
      return next
    })
    showToast('Conversation cleared', 'info')
  }, [agentKey, showToast])

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const targetAgent = selectedAgent || detectAgent(input.trim())
    const key = agentKey

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      agentId: targetAgent,
      timestamp: Date.now(),
    }

    addMessage(key, userMessage)
    setInput('')
    setIsSending(true)

    // Build conversation history for this agent/session
    const history = (conversations[key] || [])
      .filter((m) => m.id !== 'welcome' && !m.id.startsWith('welcome-'))
      .map((m) => ({ role: m.role, content: m.content }))

    // Add the new user message
    history.push({ role: 'user', content: input.trim() })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          agentId: targetAgent,
          sessionId: currentSessionId || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      if (data.sessionId && !currentSessionId) {
        setSessions((prev) => ({ ...prev, [key]: data.sessionId }))
      }

      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: data.message?.content || 'No response from agent.',
        agentId: targetAgent,
        timestamp: Date.now(),
      }

      addMessage(key, agentMessage)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error occurred'
      showToast(`Failed: ${errorMsg}`, 'error')

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Failed to reach the ${targetAgent} agent.\n\nMake sure the agent services are running. You can start them with:\n\`\`\`\n./scripts/start-all.sh\n\`\`\``,
        agentId: 'system',
        timestamp: Date.now(),
      }
      addMessage(key, errorMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSwitchAgent = (id: string) => {
    if (id === selectedAgent) {
      setSelectedAgent('')
    } else {
      setSelectedAgent(id)
    }
  }

  function getAgentDisplayInfo(agentId: string | undefined) {
    if (!agentId || agentId === 'system') return { icon: '🤖', name: 'System' }
    const agent = AGENTS[agentId]
    if (!agent) return { icon: '🤖', name: 'System' }
    return { icon: agent.icon, name: agent.name }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-gray-900">💬 Chat</h2>
              {currentMessages.length > 1 && (
                <Button variant="ghost" size="sm" onClick={clearConversation}>
                  🗑️ Clear
                </Button>
              )}
            </div>
            <div className="flex space-x-1.5">
              <Badge
                variant={selectedAgent === '' ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => setSelectedAgent('')}
              >
                Auto
              </Badge>
              {AGENT_LIST.map((agent) => (
                <Badge
                  key={agent.id}
                  variant={selectedAgent === agent.id ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => handleSwitchAgent(agent.id)}
                >
                  {agent.icon} {agent.label}
                </Badge>
              ))}
            </div>
          </div>
          {selectedAgent ? (
            <p className="text-xs text-blue-600 mt-1">
              Routing all messages to: {AGENTS[selectedAgent]?.name || selectedAgent}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              Auto-routing based on message content
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.map((message) => {
            const displayInfo = getAgentDisplayInfo(message.agentId)

            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-white border border-slate-200 text-gray-900 shadow-sm'
                  }`}
                >
                  <div
                    className={`text-xs font-medium mb-2 flex items-center space-x-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
                      {displayInfo.icon}
                    </span>
                    <span>{displayInfo.name}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">Agent thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t p-4 bg-slate-50">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedAgent
                  ? `Message ${AGENTS[selectedAgent]?.name || selectedAgent}...`
                  : 'Type your message... (e.g., "Create a React login component")'
              }
              disabled={isSending}
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              size="lg"
            >
              Send →
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: 'React component', text: 'Create a React login component with TypeScript and Tailwind CSS' },
              { label: 'Design API', text: 'Design a RESTful user API endpoint with Express' },
              { label: 'Write tests', text: 'Write unit tests for an authentication module' },
              { label: 'Create Dockerfile', text: 'Create a Dockerfile for a Node.js application' },
            ].map((suggestion) => (
              <Button
                key={suggestion.label}
                variant="outline"
                size="sm"
                onClick={() => setInput(suggestion.text)}
                className="text-xs"
                disabled={isSending}
              >
                💡 {suggestion.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
