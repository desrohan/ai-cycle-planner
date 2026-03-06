'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, PhaseInfo, Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Circle, Plus, Trash2, Sparkles, Clock, Calendar } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { cn } from '@/lib/utils'

interface TasksClientProps {
  tasks: Task[]
  userId: string
  phaseInfo: PhaseInfo
  profile: Profile
  today: string
}

const intensityColors = {
  low:    'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high:   'bg-rose-100 text-rose-700 border-rose-200',
}

function getDateLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE, MMM d')
}

export function TasksClient({ tasks: initialTasks, userId, phaseInfo, profile, today }: TasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [addOpen, setAddOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    scheduled_date: today,
    duration_minutes: 30,
    intensity: 'medium' as 'low' | 'medium' | 'high',
  })

  const supabase = createClient()

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'today') return t.scheduled_date === today
    if (filter === 'upcoming') return t.scheduled_date > today && !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const grouped = filteredTasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.scheduled_date
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase.from('tasks').update({ completed: !completed, updated_at: new Date().toISOString() }).eq('id', taskId)
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !completed } : t)))
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const addTask = async () => {
    if (!newTask.title.trim()) return
    const { data } = await supabase
      .from('tasks')
      .insert({ ...newTask, user_id: userId })
      .select()
      .single()
    if (data) {
      setTasks((prev) => [...prev, data as Task])
      setNewTask({ title: '', description: '', scheduled_date: today, duration_minutes: 30, intensity: 'medium' })
      setAddOpen(false)
    }
  }

  const generateAITasks = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: phaseInfo.phase, profile, userId }),
      })
      const { tasks: newTasks } = await res.json()
      if (newTasks) setTasks((prev) => [...prev, ...newTasks])
    } catch (e) {
      console.error('Failed to generate tasks', e)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateAITasks}
            disabled={aiLoading}
            className="gap-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {aiLoading ? 'Generating...' : 'AI Generate'}
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" /> Add task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Add task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Task name"
                    value={newTask.title}
                    onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Details..."
                    value={newTask.description}
                    onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newTask.scheduled_date}
                      onChange={(e) => setNewTask((p) => ({ ...p, scheduled_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={480}
                      value={newTask.duration_minutes}
                      onChange={(e) => setNewTask((p) => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Intensity</Label>
                  <Select
                    value={newTask.intensity}
                    onValueChange={(v) => setNewTask((p) => ({ ...p, intensity: v as 'low' | 'medium' | 'high' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
                  <Button onClick={addTask} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task groups */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No tasks found</p>
              <p className="text-sm text-muted-foreground">Add a task manually or use AI Generate</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, dateTasks]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  date === today ? 'text-primary' : 'text-muted-foreground',
                )}>
                  {getDateLabel(date)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {dateTasks.map((task) => (
                  <Card key={task.id} className={cn('border-border transition-colors', task.completed && 'opacity-60')}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <button
                        onClick={() => toggleTask(task.id, task.completed)}
                        className="mt-0.5 shrink-0"
                        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium text-foreground', task.completed && 'line-through')}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{task.duration_minutes}m
                          </span>
                          {task.intensity && (
                            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', intensityColors[task.intensity])}>
                              {task.intensity}
                            </span>
                          )}
                          {task.phase_context && (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                              {task.phase_context}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="shrink-0 p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  )
}
