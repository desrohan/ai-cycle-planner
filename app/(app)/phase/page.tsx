import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentPhase, getPhaseInfo } from '@/lib/cycle-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phase } from '@/lib/types'
import { cn } from '@/lib/utils'

const phaseOrder: Phase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']

const phaseDetails: Record<Phase, {
  nutrition: string[]
  exercise: string[]
  work: string[]
  selfCare: string[]
}> = {
  menstrual: {
    nutrition: ['Iron-rich foods (leafy greens, lentils)', 'Magnesium (dark chocolate, nuts)', 'Anti-inflammatory foods', 'Stay well hydrated', 'Reduce caffeine and alcohol'],
    exercise: ['Gentle yoga and stretching', 'Light walks in nature', 'Swimming at easy pace', 'Rest is productive — honor it'],
    work: ['Reflective and creative work', 'Journaling and planning', 'Low-pressure admin tasks', 'Avoid major decisions'],
    selfCare: ['Warm baths or heat pads', 'Extra sleep and rest', 'Gentle massage', 'Cozy and comfortable environments'],
  },
  follicular: {
    nutrition: ['Fermented foods for gut health', 'High-fiber foods', 'Fresh fruits and vegetables', 'Light proteins (fish, eggs)', 'Hydrating foods'],
    exercise: ['Cardio and interval training', 'Strength training (building phase)', 'Try new workout classes', 'Dance or energetic movement'],
    work: ['Brainstorming and ideation', 'Starting new projects', 'Learning and skill-building', 'Collaborative meetings'],
    selfCare: ['Explore new hobbies', 'Social activities with friends', 'Plan exciting experiences', 'Try new creative outlets'],
  },
  ovulation: {
    nutrition: ['Antioxidant-rich foods', 'Zinc (pumpkin seeds, oysters)', 'Light and fresh meals', 'Limit processed foods', 'Stay hydrated'],
    exercise: ['HIIT and high-intensity training', 'Group fitness classes', 'Competitive sports', 'Peak performance workouts'],
    work: ['Presentations and public speaking', 'Negotiations and pitches', 'Leadership and team initiatives', 'Networking events'],
    selfCare: ['Social outings and gatherings', 'Express yourself creatively', 'Embrace your peak confidence', 'Connect deeply with others'],
  },
  luteal: {
    nutrition: ['Complex carbohydrates (sweet potato, quinoa)', 'B vitamins (bananas, chickpeas)', 'Calcium-rich foods', 'Reduce sugar and salt', 'Herbal teas'],
    exercise: ['Moderate strength training', 'Pilates and barre', 'Walking and hiking', 'Gentle yoga as phase progresses'],
    work: ['Detail-oriented tasks', 'Editing and refining', 'Completing existing projects', 'Organization and planning'],
    selfCare: ['Prioritize alone time', 'Limit social obligations', 'Practice mindfulness', 'Warm and nourishing meals'],
  },
}

const phaseColorConfig: Record<Phase, { bg: string; border: string; text: string; badge: string }> = {
  menstrual:  { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700' },
  follicular: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
  ovulation:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  luteal:     { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
}

export default async function PhasePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.last_period_date) redirect('/onboarding')

  const currentPhaseInfo = getCurrentPhase(profile.last_period_date, profile.cycle_length, profile.period_length)

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Phase</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Understand each phase and get personalized guidance
        </p>
      </div>

      {/* Cycle timeline */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {phaseOrder.map((phase) => {
              const info = getPhaseInfo(phase, 0, 0)
              const colors = phaseColorConfig[phase]
              const isCurrent = phase === currentPhaseInfo.phase
              return (
                <div
                  key={phase}
                  className={cn('flex-1 py-4 px-3 text-center border-r last:border-r-0 border-border transition-all', colors.bg, isCurrent && 'ring-2 ring-primary ring-inset')}
                >
                  <div className={cn('text-xs font-bold uppercase tracking-wide', colors.text)}>{info.label.split(' ')[0]}</div>
                  {isCurrent && (
                    <div className="mt-1 text-xs font-medium text-primary">Day {currentPhaseInfo.day}</div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current phase highlight */}
      {(() => {
        const colors = phaseColorConfig[currentPhaseInfo.phase]
        const details = phaseDetails[currentPhaseInfo.phase]
        return (
          <Card className={cn('border', colors.border, colors.bg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={cn('text-lg', colors.text)}>{currentPhaseInfo.label}</CardTitle>
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', colors.badge)}>
                  Current — Day {currentPhaseInfo.day}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{currentPhaseInfo.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: 'Nutrition', items: details.nutrition },
                  { title: 'Exercise', items: details.exercise },
                  { title: 'Work & Focus', items: details.work },
                  { title: 'Self-Care', items: details.selfCare },
                ].map(({ title, items }) => (
                  <div key={title} className="space-y-2">
                    <h4 className={cn('text-xs font-bold uppercase tracking-wider', colors.text)}>{title}</h4>
                    <ul className="space-y-1">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                          <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', colors.badge.split(' ')[0].replace('bg-', 'bg-'))}>
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* All phases overview */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">All Phases Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {phaseOrder.filter((p) => p !== currentPhaseInfo.phase).map((phase) => {
            const info = getPhaseInfo(phase, 0, 0)
            const colors = phaseColorConfig[phase]
            return (
              <Card key={phase} className={cn('border', colors.border)}>
                <CardHeader className="pb-2">
                  <CardTitle className={cn('text-sm', colors.text)}>{info.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{info.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {info.traits.map((t) => (
                      <span key={t} className={cn('rounded-full px-2 py-0.5 text-xs', colors.badge)}>{t}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
