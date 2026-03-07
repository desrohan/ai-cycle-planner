'use client'

import { useState, useRef, useEffect } from 'react'
import { PhaseInfo, Profile, Task } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Sparkles, Send, Loader2, Bot, X, Calendar, CheckCircle2 } from 'lucide-react'

type Message = {
    role: 'user' | 'assistant'
    content: string
    requiresConfirmation?: boolean
    previewTasks?: any[]
    isConfirmed?: boolean
    contexts?: ContextItem[]
    actionType?: string
}

type ContextItem = {
    type: 'phase' | 'task'
    id: string
    label: string
    data?: any
}

interface TasksChatSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    phaseInfo: PhaseInfo
    profile: Profile
    allTasks: Task[]
    externalContext: ContextItem | null
    onClearExternalContext: () => void
    onTasksGenerated: (newTasks: Task[]) => void
    onTasksUpdated: (updatedTasks: Task[]) => void
    onTasksDeleted: (deletedIds: string[]) => void
}

export function TasksChatSidebar({
    open,
    onOpenChange,
    userId,
    phaseInfo,
    profile,
    allTasks,
    externalContext,
    onClearExternalContext,
    onTasksGenerated,
    onTasksUpdated,
    onTasksDeleted
}: TasksChatSidebarProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Hi! I'm your AI Planner. You're currently in your **${phaseInfo.phase}** phase. What's your goal? (Type **@** to mention specific tasks or phases)`,
        },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Mentions State
    const [mentionOpen, setMentionOpen] = useState(false)
    const [mentionSearch, setMentionSearch] = useState('')
    const [selectedContexts, setSelectedContexts] = useState<ContextItem[]>([])

    // Ref to handle custom keyboard events for the popover
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // Handle external context from Sparkle click
    useEffect(() => {
        if (externalContext) {
            if (!selectedContexts.find(c => c.id === externalContext.id)) {
                setSelectedContexts(prev => [...prev, externalContext])
            }
            onClearExternalContext()
        }
    }, [externalContext, selectedContexts, onClearExternalContext])

    // Detect @ typing and extract search term
    useEffect(() => {
        const lastWord = input.split(' ').pop()
        if (lastWord?.startsWith('@')) {
            setMentionOpen(true)
            setMentionSearch(lastWord.slice(1)) // text after @
        } else {
            setMentionOpen(false)
            setMentionSearch('')
        }
    }, [input])

    const handleSelectMention = (item: ContextItem) => {
        if (!selectedContexts.find(c => c.id === item.id)) {
            setSelectedContexts([...selectedContexts, item])
        }
        // Remove the @ trigger word from input
        const words = input.split(' ')
        words.pop()
        setInput(words.join(' ') + ' ')
        setMentionOpen(false)
    }

    const removeContext = (id: string) => {
        setSelectedContexts(prev => prev.filter(c => c.id !== id))
    }

    const sendToAPI = async (newMessages: Message[], contextToSend: ContextItem[], isConfirming: boolean = false, confirmData?: any) => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/chat-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    phase: phaseInfo.phase,
                    profile,
                    userId,
                    context: contextToSend,
                    confirmData: isConfirming ? confirmData : undefined
                }),
            })

            if (!res.ok) throw new Error('Failed to fetch')

            const data = await res.json()

            const assistantMsg: Message = {
                role: 'assistant',
                content: data.message,
                requiresConfirmation: data.requires_confirmation,
                previewTasks: data.preview_tasks,
                actionType: data.type
            }

            setMessages((prev) => [...prev, assistantMsg])

            if (data.tasks_to_delete && data.tasks_to_delete.length > 0) {
                onTasksDeleted(data.tasks_to_delete)
            }
            if (data.tasks && data.tasks.length > 0) {
                if (data.type === 'edit_task' || data.type === 'batch_edit_tasks') {
                    onTasksUpdated(data.tasks)
                } else if (data.type === 'generate_tasks') {
                    onTasksGenerated(data.tasks)
                }
            }

        } catch (err) {
            console.error(err)
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: "Sorry, I ran into an error. Please try again." }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        const text = input.trim()
        if (!text || isLoading) return

        const userMsg: Message = { role: 'user', content: text, contexts: selectedContexts }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')

        // Send
        sendToAPI(newMessages, selectedContexts)

        // Clear contexts after sending
        setSelectedContexts([])
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (mentionOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab') {
                // Let the Command component handle these naturally by preventing default on outer wrapper
                // but the standard Shadcn UI <Command> works best when it has focus. 
                // Since our input has focus, we need to pass these events to the command menu.
                // However, Shadcn/cmdk handles global keyboard events if we tell it to. 
                // Alternatively, we can just stop propagation for Enter if mentionOpen is true.
            }

            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                // To properly support Enter/Tab selecting the first active item without complex internal state,
                // we simulate a down arrow if nothing is selected, but cmdk usually auto-selects the first item.
                // A reliable hack for cmdk when focus is outside: dispatch keyboard events to the document.
                const event = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true,
                });
                document.querySelector('[cmdk-list]')?.dispatchEvent(event);
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const event = new KeyboardEvent('keydown', {
                    key: e.key,
                    code: e.key,
                    bubbles: true,
                });
                document.querySelector('[cmdk-list]')?.dispatchEvent(event);
            }
        }
    }

    const handleConfirm = (messageIndex: number) => {
        const msgToConfirm = messages[messageIndex];

        setMessages(prev => prev.map((m, idx) =>
            idx === messageIndex ? { ...m, isConfirmed: true, requiresConfirmation: false } : m
        ))

        const userMsg: Message = { role: 'user', content: "I confirm the plan. Please proceed." }
        const newMessages = [...messages.slice(0, messageIndex + 1), userMsg]
        setMessages(prev => [...prev, userMsg])

        // If confirming a plan with preview tasks and a specific actionType, 
        // we should pass it to the API so it executes deterministically instead of having the LLM guess.
        const confirmData = msgToConfirm.previewTasks && msgToConfirm.previewTasks.length > 0 ? {
            actionType: msgToConfirm.actionType || 'generate_tasks',
            tasks: msgToConfirm.previewTasks
        } : undefined;

        sendToAPI(newMessages, [], true, confirmData)
    }

    const handleCancelConfirmation = (messageIndex: number) => {
        setMessages(prev => prev.map((m, idx) =>
            idx === messageIndex ? { ...m, isConfirmed: false, requiresConfirmation: false } : m
        ))
        const userMsg: Message = { role: 'user', content: "Actually, cancel that plan." }
        setMessages(prev => [...prev, userMsg])
    }

    const phases = ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex flex-col w-full sm:max-w-md h-full p-0 gap-0 border-l"
            >
                <SheetHeader className="p-4 border-b bg-card">
                    <SheetTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Planner
                    </SheetTitle>
                    <SheetDescription>
                        Discuss your goals or mention tasks with '@' to edit them.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-muted/20">
                    {messages.map((msg, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                            <div
                                className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                                    }`}
                            >
                                <div
                                    className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-secondary-foreground'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        <span className="text-xs font-medium">You</span>
                                    ) : (
                                        <Bot className="h-4 w-4" />
                                    )}
                                </div>
                                <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card border shadow-sm text-card-foreground'
                                        }`}
                                >
                                    {msg.content.split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                                    )}
                                </div>
                            </div>

                            {/* Render sent contexts */}
                            {msg.role === 'user' && msg.contexts && msg.contexts.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 ml-auto justify-end max-w-[85%] pr-[44px]">
                                    {msg.contexts.map((ctx, i) => (
                                        <Badge key={i} variant="secondary" className="opacity-70 text-[10px] py-0">
                                            {ctx.label}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {msg.role === 'assistant' && msg.previewTasks && msg.previewTasks.length > 0 && (
                                <div className="ml-11 max-w-[85%] rounded-xl border bg-card p-3 shadow-sm">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 uppercase">
                                        <Calendar className="h-3 w-3" /> {msg.actionType === 'delete_tasks' ? 'Preview Deletion' : 'Preview Plan'}
                                    </p>
                                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                                        {msg.previewTasks.map((t, tid) => (
                                            <div key={tid} className="text-xs bg-muted/50 p-2 rounded-md border flex flex-col gap-1">
                                                <span className="font-medium">{t.title}</span>
                                                <div className="flex gap-2 text-muted-foreground scale-90 origin-left">
                                                    <span>{t.scheduled_date}</span>
                                                    <span>•</span>
                                                    <span>{t.duration_minutes}m</span>
                                                    <span>•</span>
                                                    <span>{t.intensity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {msg.requiresConfirmation && (
                                        <div className="flex gap-2">
                                            <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleConfirm(idx)}>
                                                <CheckCircle2 className="mr-1.5 h-3 w-3" /> Confirm
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleCancelConfirmation(idx)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                    {msg.isConfirmed && (
                                        <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded w-full text-center">
                                            Confirmed & Saved
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="rounded-2xl px-4 py-3 bg-card border shadow-sm flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t bg-card mt-auto flex flex-col gap-2">
                    {selectedContexts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-1 py-0.5">
                            {selectedContexts.map(ctx => (
                                <Badge key={ctx.id} variant="secondary" className="flex items-center gap-1 py-0.5 px-2 text-xs">
                                    {ctx.label}
                                    <button onClick={() => removeContext(ctx.id)} className="ml-1 hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
                            <PopoverTrigger asChild>
                                <div className="absolute bottom-full left-4 bg-transparent w-1 h-1" />
                            </PopoverTrigger>
                            <PopoverContent
                                side="top"
                                align="start"
                                className="p-0 w-64 mb-2 overflow-hidden"
                                onOpenAutoFocus={e => e.preventDefault()}
                                onCloseAutoFocus={e => e.preventDefault()}
                            >
                                <Command shouldFilter={false}>
                                    <CommandList className="max-h-[250px] overflow-y-auto">
                                        <CommandEmpty>No results found.</CommandEmpty>
                                        <CommandGroup heading="Cycle Phases">
                                            {phases.filter(p => p.toLowerCase().includes(mentionSearch.toLowerCase())).map(p => (
                                                <CommandItem
                                                    key={p}
                                                    value={p}
                                                    onSelect={() => handleSelectMention({ type: 'phase', id: p, label: `${p} Phase` })}
                                                >
                                                    {p} Phase
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Recent Tasks">
                                            {allTasks.filter(t => t.title.toLowerCase().includes(mentionSearch.toLowerCase())).slice(0, 5).map(t => (
                                                <CommandItem
                                                    key={t.id}
                                                    value={t.id}
                                                    onSelect={() => handleSelectMention({ type: 'task', id: t.id, label: t.title, data: t })}
                                                >
                                                    {t.title}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <form onSubmit={handleSubmit} className="flex items-end gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="E.g. @Luteal make tasks lighter..."
                                className="rounded-xl bg-muted/50 border border-border focus-visible:ring-1 focus-visible:bg-background resize-none min-h-[44px]"
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="h-11 w-11 rounded-xl flex-shrink-0 shadow-sm"
                            >
                                <Send className="h-5 w-5" />
                                <span className="sr-only">Send message</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
