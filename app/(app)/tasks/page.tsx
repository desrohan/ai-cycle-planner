import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentPhase } from '@/lib/cycle-utils'
import { TasksClient } from '@/components/tasks/tasks-client'
import { format } from 'date-fns'

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: tasks }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  if (!profile?.last_period_date) redirect('/onboarding')

  const phaseInfo = getCurrentPhase(profile.last_period_date, profile.cycle_length, profile.period_length)

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your cycle-aware task plan
        </p>
      </div>
      <TasksClient
        tasks={tasks ?? []}
        userId={user.id}
        phaseInfo={phaseInfo}
        profile={profile}
        today={format(new Date(), 'yyyy-MM-dd')}
      />
    </div>
  )
}
