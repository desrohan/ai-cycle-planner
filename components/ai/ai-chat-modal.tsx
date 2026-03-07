'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PhaseInfo, Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Send, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AIChatModalProps {
  profile: Profile
  phaseInfo: PhaseInfo
}

const phaseColorConfig: Record<string, { badge: string; text: string }> = {
  menstrual: { badge: 'bg-rose-100 text-rose-700', text: 'text-rose-700' },
  follicular: { badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700' },
  ovulation: { badge: 'bg-green-100 text-green-700', text: 'text-green-700' },
  luteal: { badge: 'bg-violet-100 text-violet-700', text: 'text-violet-700' },
}

const SUGGESTED_PROMPTS = [
  'What tasks suit my phase today?',
  'Suggest a workout for right now',
  'What should I eat this phase?',
  'How can I manage my energy better?',
]

export function AIChatModal({ profile, phaseInfo }: AIChatModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm your FlowSync AI assistant. You're currently in your **${phaseInfo.label}** — ${phaseInfo.description} How can I help you today?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const colors = phaseColorConfig[phaseInfo.phase] ?? { badge: 'bg-accent text-foreground', text: 'text-foreground' }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          phase: phaseInfo.phase,
          profile,
        }),
      })
      const data = await res.json()
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.error || 'Something went wrong.',
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    router.push('/dashboard')
  }

  function renderContent(text: string) {
    // Simple bold rendering for **text**
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="flex flex-col h-[85vh] max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 flex flex-row items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">AI Assistant</DialogTitle>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', colors.badge)}>
                {phaseInfo.label}
              </span>
            </div>
          </div>
          {/* <Button variant="ghost" size="sm" onClick={handleClose} className="h-7 text-xs text-muted-foreground">
            Close
          </Button> */}
        </DialogHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
          <div className="space-y-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground',
                  )}
                >
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-secondary text-secondary-foreground rounded-tl-sm',
                  )}
                >
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggested prompts */}
        {messages.length === 1 && (
          <div className="shrink-0 px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 flex items-center gap-2 border-t border-border px-4 py-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask me anything about your cycle..."
            disabled={loading}
            className="flex-1 text-sm"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
