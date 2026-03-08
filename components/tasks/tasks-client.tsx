'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, PhaseInfo, Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CheckCircle2, Circle, Plus, Trash2, Sparkles, Clock, Calendar as CalendarIcon, List, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { TasksChatSidebar } from './tasks-chat-sidebar'

interface TasksClientProps {
  tasks: Task[]
  userId: string
  phaseInfo: PhaseInfo
  profile: Profile
  today: string
}

const intensityColors = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-rose-100 text-rose-700 border-rose-200',
}

function getDateLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE, MMM d')
}

export function TasksClient({ tasks: initialTasks, userId, phaseInfo, profile, today }: TasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calViewMode, setCalViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const defaultTask = {
    title: '',
    description: '',
    scheduled_date: today,
    duration_minutes: 30,
    intensity: 'medium' as 'low' | 'medium' | 'high',
  }
  const [taskForm, setTaskForm] = useState(defaultTask)

  // Chat State
  const [chatOpen, setChatOpen] = useState(false)
  const [chatContext, setChatContext] = useState<any>(null)

  // Filtering
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')

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

  const openAddModal = (dateStr?: string) => {
    setTaskForm({ ...defaultTask, scheduled_date: dateStr || today })
    setEditingTaskId(null)
    setModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      scheduled_date: task.scheduled_date,
      duration_minutes: task.duration_minutes || 30,
      intensity: (task.intensity as any) || 'medium',
    })
    setEditingTaskId(task.id)
    setModalOpen(true)
  }

  const saveTask = async () => {
    if (!taskForm.title.trim()) return

    if (editingTaskId) {
      // Update
      const { data } = await supabase
        .from('tasks')
        .update({ ...taskForm, updated_at: new Date().toISOString() })
        .eq('id', editingTaskId)
        .select()
        .single()
      if (data) {
        setTasks(prev => prev.map(t => t.id === editingTaskId ? data as Task : t))
      }
    } else {
      // Insert
      const { data } = await supabase
        .from('tasks')
        .insert({ ...taskForm, user_id: userId })
        .select()
        .single()
      if (data) {
        setTasks((prev) => [...prev, data as Task])
      }
    }
    setModalOpen(false)
  }

  // --- Calendar Helpers ---
  const handlePrev = () => {
    if (calViewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    if (calViewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    if (calViewMode === 'day') setCurrentDate(subDays(currentDate, 1))
  }
  const handleNext = () => {
    if (calViewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    if (calViewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    if (calViewMode === 'day') setCurrentDate(addDays(currentDate, 1))
  }
  const handleToday = () => setCurrentDate(new Date())

  const calendarDays = useMemo(() => {
    if (calViewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      return eachDayOfInterval({ start, end })
    }
    if (calViewMode === 'week') {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return eachDayOfInterval({ start, end })
    }
    return [currentDate]
  }, [currentDate, calViewMode])

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Top Bar Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <ToggleGroup type="single" variant="outline" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} className="w-full sm:w-auto">
            <ToggleGroupItem value="list" aria-label="List view" className="flex-1 px-3">
              <List className="h-4 w-4 mr-2" /> List
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar view" className="flex-1 px-3">
              <CalendarIcon className="h-4 w-4 mr-2" /> Calendar
            </ToggleGroupItem>
          </ToggleGroup>

          {viewMode === 'calendar' && (
            <ToggleGroup type="single" variant="outline" value={calViewMode} onValueChange={(v) => v && setCalViewMode(v as any)} className="flex w-full sm:w-auto">
              <ToggleGroupItem value="day" className="flex-1 px-3 text-xs">Day</ToggleGroupItem>
              <ToggleGroupItem value="week" className="flex-1 px-3 text-xs">Week</ToggleGroupItem>
              <ToggleGroupItem value="month" className="flex-1 px-3 text-xs">Month</ToggleGroupItem>
            </ToggleGroup>
          )}

          {viewMode === 'list' && (
            <div className="hidden sm:flex gap-1.5 ml-2">
              {(['all', 'today', 'upcoming'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                    filter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatOpen(true)}
            className="gap-1.5 text-xs text-primary border-primary/50 hover:bg-primary/10 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
            AI Planner
          </Button>
          <Button size="sm" onClick={() => openAddModal()} className="gap-1.5 text-xs shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </Button>
        </div>
      </div>

      <TasksChatSidebar
        open={chatOpen}
        onOpenChange={setChatOpen}
        userId={userId}
        phaseInfo={phaseInfo}
        profile={profile}
        allTasks={tasks}
        externalContext={chatContext}
        onClearExternalContext={() => setChatContext(null)}
        onTasksGenerated={(newTasks) => setTasks(prev => [...prev, ...newTasks])}
        onTasksUpdated={(updatedTasks) => {
          setTasks(prev => {
            const map = new Map(prev.map(t => [t.id, t]))
            updatedTasks.forEach(t => map.set(t.id, t))
            return Array.from(map.values())
          })
        }}
        onTasksDeleted={(deletedIds) => {
          setTasks(prev => prev.filter(t => !deletedIds.includes(t.id)))
        }}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTaskId ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Task name"
                value={taskForm.title}
                onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Details..."
                value={taskForm.description}
                onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={taskForm.scheduled_date}
                  onChange={(e) => setTaskForm((p) => ({ ...p, scheduled_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  min={5}
                  max={480}
                  value={taskForm.duration_minutes}
                  onChange={(e) => setTaskForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Intensity</Label>
              <Select
                value={taskForm.intensity}
                onValueChange={(v) => setTaskForm((p) => ({ ...p, intensity: v as 'low' | 'medium' | 'high' }))}
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
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={saveTask} className="flex-1">{editingTaskId ? 'Update' : 'Add'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No tasks found</p>
                  <p className="text-sm text-muted-foreground">Add a task manually or use AI AI Planner</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateTasks]) => (
                <div key={date}>
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
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
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id, task.completed)}
                        onEdit={() => openEditModal(task)}
                        onDelete={() => deleteTask(task.id)}
                        onSparkleClick={() => {
                          setChatContext({ type: 'task', id: task.id, label: task.title, data: task })
                          setChatOpen(true)
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* --- CALENDAR VIEW --- */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                {calViewMode === 'day'
                  ? format(currentDate, 'MMMM d, yyyy')
                  : calViewMode === 'week'
                    ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
                    : format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </h2>
            <Button variant="secondary" size="sm" onClick={handleToday} className="hidden sm:flex h-8">Today</Button>
          </div>

          <div className="border rounded-xl bg-card overflow-hidden">
            {/* Days Header */}
            {calViewMode !== 'day' && (
              <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-semibold text-muted-foreground py-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d}>{d}</div>
                ))}
              </div>
            )}

            {/* Grid Body */}
            <div className={cn(
              "grid",
              calViewMode !== 'day' ? "grid-cols-7" : "grid-cols-1",
              calViewMode === 'month' && "auto-rows-[minmax(100px,auto)]"
            )}>
              {calendarDays.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayTasks = tasks.filter(t => t.scheduled_date === dateStr)
                const isCurrentMonth = isSameMonth(day, currentDate)

                if (calViewMode === 'day' || calViewMode === 'week') {
                  // For week and day flow, list full task cards
                  return (
                    <div key={dateStr} className={cn("p-3 border-r border-b", calViewMode === 'day' && "border-r-0")}>
                      <div className="text-sm font-semibold mb-3 flex items-center justify-between">
                        <span>{format(day, 'd')} {calViewMode === 'week' && format(day, 'MMM')} {isToday(day) && "(Today)"}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => openAddModal(dateStr)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {dayTasks.length === 0 && <span className="text-xs text-muted-foreground italic">No tasks</span>}
                        {dayTasks.map(t => (
                          <TaskBlock key={t.id} task={t} onEdit={() => openEditModal(t)} />
                        ))}
                      </div>
                    </div>
                  )
                }

                // Month Flow
                const maxDisplay = 2
                const visibleTasks = dayTasks.slice(0, maxDisplay)
                const extra = dayTasks.length - maxDisplay

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "min-h-[100px] border-r border-b p-1.5 flex flex-col gap-1 transition-colors hover:bg-muted/30 group",
                      !isCurrentMonth && "bg-muted/20 opacity-50",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full", isToday(day) && "bg-primary text-primary-foreground")}>
                        {format(day, 'd')}
                      </span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openAddModal(dateStr)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                      {visibleTasks.map(t => (
                        <div key={t.id} onClick={() => openEditModal(t)} className={cn("text-[10px] leading-tight px-1.5 py-1 rounded-sm border cursor-pointer truncate", t.completed && "opacity-50 line-through", t.intensity === 'high' ? 'bg-rose-100/50 border-rose-200 text-rose-800' : t.intensity === 'low' ? 'bg-green-100/50 border-green-200 text-green-800' : 'bg-amber-100/50 border-amber-200 text-amber-800')}>
                          {t.title}
                        </div>
                      ))}
                      {extra > 0 && (
                        <div className="text-[10px] font-medium text-muted-foreground px-1 hover:underline cursor-pointer" onClick={() => { setCalViewMode('day'); setCurrentDate(day); }}>
                          +{extra} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onToggle, onEdit, onDelete, onSparkleClick }: { task: Task, onToggle: () => void, onEdit: () => void, onDelete: () => void, onSparkleClick: () => void }) {
  return (
    <Card className={cn('border-border transition-colors group', task.completed && 'opacity-60 bg-muted/30')}>
      <CardContent className="flex items-start gap-3 p-4">
        <button onClick={onToggle} className="mt-0.5 shrink-0" aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>
          {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium text-foreground', task.completed && 'line-through')}>
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{task.description}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />{task.duration_minutes}m
            </span>
            {task.intensity && (
              <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', intensityColors[task.intensity as keyof typeof intensityColors])}>
                {task.intensity}
              </span>
            )}
            {task.phase_context && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-foreground">
                {task.phase_context}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onSparkleClick} className="p-1.5 text-muted-foreground hover:text-primary transition-colors hover:bg-muted rounded-md" aria-label="AI Edit">
            <Sparkles className="h-4 w-4" />
          </button>
          <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded-md" aria-label="Edit task">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors hover:bg-muted rounded-md" aria-label="Delete task">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskBlock({ task, onEdit }: { task: Task, onEdit: () => void }) {
  return (
    <div onClick={onEdit} className={cn("text-xs px-2 py-1.5 rounded-md border cursor-pointer border-l-4", task.completed && "opacity-50 line-through", task.intensity === 'high' ? 'bg-background border-l-rose-500' : task.intensity === 'low' ? 'bg-background border-l-green-500' : 'bg-background border-l-amber-500')}>
      <div className="font-medium truncate">{task.title}</div>
      <div className="text-muted-foreground text-[10px] mt-0.5 flex items-center gap-1">
        <Clock className="h-2.5 w-2.5" /> {task.duration_minutes}m
      </div>
    </div>
  )
}
