import { PhaseInfo } from '@/lib/types'
import { CalendarDays } from 'lucide-react'

interface PhaseBannerProps {
  phaseInfo: PhaseInfo
}

export function PhaseBanner({ phaseInfo }: PhaseBannerProps) {
  const phaseColors: Record<string, { bg: string; text: string; border: string; bar: string }> = {
    menstrual:  { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   bar: 'bg-rose-400' },
    follicular: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  bar: 'bg-amber-400' },
    ovulation:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  bar: 'bg-green-400' },
    luteal:     { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', bar: 'bg-violet-400' },
  }

  const colors = phaseColors[phaseInfo.phase]

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colors.bar}/20`}>
            <div className={`h-5 w-5 rounded-full ${colors.bar}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
                Current Phase
              </span>
            </div>
            <h2 className={`mt-0.5 text-xl font-bold ${colors.text}`}>{phaseInfo.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{phaseInfo.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>
            Day <strong className={`font-bold ${colors.text}`}>{phaseInfo.day}</strong> &middot; {phaseInfo.daysLeft} day{phaseInfo.daysLeft !== 1 ? 's' : ''} left
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {phaseInfo.traits.map((trait) => (
          <span key={trait} className={`rounded-full border ${colors.border} ${colors.bg} px-3 py-1 text-xs font-medium ${colors.text}`}>
            {trait}
          </span>
        ))}
      </div>
    </div>
  )
}
