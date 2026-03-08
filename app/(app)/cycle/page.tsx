import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentPhase } from '@/lib/cycle-utils'
import { CycleTrackerClient } from '@/components/cycle/cycle-tracker-client'
import { format } from 'date-fns'

export default async function CyclePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: cycleData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('cycle_data')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(90),
  ])

  if (!profile?.last_period_date) redirect('/onboarding')

  const phaseInfo = getCurrentPhase(profile.last_period_date, profile.cycle_length, profile.period_length)

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Cycle Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log your daily symptoms and energy levels
        </p>
      </div>
      <CycleTrackerClient
        userId={user.id}
        profile={profile}
        cycleData={cycleData ?? []}
        phaseInfo={phaseInfo}
        today={format(new Date(), 'yyyy-MM-dd')}
      />
    </div>
  )
}
