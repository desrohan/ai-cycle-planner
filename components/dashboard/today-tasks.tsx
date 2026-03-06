'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TodayTasksProps {
  tasks: Task[]
}

const intensityColors = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-rose-100 text-rose-700',
}

export function TodayTasks({ tasks: initialTasks }: TodayTasksProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const toggleTask = async (taskId: string, completed: boolean) => {
    const supabase = createClient()
    await supabase.from('tasks').update({ completed: !completed, updated_at: new Date().toISOString() }).eq('id', taskId)
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !completed } : t)))
  }

  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Today&apos;s Tasks</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{tasks.length} done
          </span>
          <Button asChild size="sm" variant="outline" className="h-7 gap-1 text-xs">
            <Link href="/tasks">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No tasks for today</p>
              <p className="text-xs text-muted-foreground">Head to tasks to generate your AI plan</p>
            </div>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/tasks">Generate tasks</Link>
            </Button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-colors',
                task.completed ? 'bg-muted/50' : 'bg-card hover:bg-accent/30',
              )}
            >
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
                <p className={cn('text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {task.duration_minutes}m
                  </span>
                  {task.intensity && (
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', intensityColors[task.intensity])}>
                      {task.intensity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
