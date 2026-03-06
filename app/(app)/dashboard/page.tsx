import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentPhase, getNextPeriodDate } from '@/lib/cycle-utils'
import { PhaseBanner } from '@/components/dashboard/phase-banner'
import { TodayTasks } from '@/components/dashboard/today-tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, differenceInDays } from 'date-fns'
import { CalendarDays, TrendingUp, Target, Activity } from 'lucide-react'
import { AIChatModal } from '@/components/ai/ai-chat-modal'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>
}) {
  const { chat } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: tasks }, { data: allTasks }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheduled_date', format(new Date(), 'yyyy-MM-dd'))
      .order('created_at'),
    supabase
      .from('tasks')
      .select('id, completed')
      .eq('user_id', user.id),
  ])

  if (!profile?.last_period_date) redirect('/onboarding')

  const phaseInfo = getCurrentPhase(profile.last_period_date, profile.cycle_length, profile.period_length)
  const nextPeriod = getNextPeriodDate(profile.last_period_date, profile.cycle_length)
  const daysToNextPeriod = differenceInDays(nextPeriod, new Date())

  const completedTasks = allTasks?.filter((t) => t.completed).length ?? 0
  const totalTasks = allTasks?.length ?? 0
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good {getTimeOfDay()}, {user.email?.split('@')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Phase Banner */}
      <PhaseBanner phaseInfo={phaseInfo} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Next period"
          value={`${daysToNextPeriod}d`}
          sub={format(nextPeriod, 'MMM d')}
          color="text-primary"
        />
        <StatCard
          icon={Target}
          label="Today"
          value={`${tasks?.filter((t) => t.completed).length ?? 0}/${tasks?.length ?? 0}`}
          sub="tasks done"
          color="text-green-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Completion"
          value={`${completionRate}%`}
          sub="all time"
          color="text-amber-600"
        />
        <StatCard
          icon={Activity}
          label="Cycle day"
          value={`${phaseInfo.day}`}
          sub={`of ${profile.cycle_length}`}
          color="text-violet-600"
        />
      </div>

      {/* Today's Tasks */}
      <TodayTasks tasks={tasks ?? []} />

      {/* Phase Tips */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Phase Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {phaseInfo.tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* AI Chat Modal */}
      {chat === 'open' && <AIChatModal profile={profile} phaseInfo={phaseInfo} />}
    </div>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}
