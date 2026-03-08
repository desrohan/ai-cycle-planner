'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CycleData, PhaseInfo, Profile } from '@/lib/types'
import { getPhaseForDate } from '@/lib/cycle-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { format, parseISO, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { CheckCircle2, Droplets } from 'lucide-react'

interface CycleTrackerClientProps {
  userId: string
  profile: Profile
  cycleData: CycleData[]
  phaseInfo: PhaseInfo
  today: string
}

const SYMPTOMS = ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Mood swings', 'Breast tenderness', 'Acne', 'Back pain']
const FLOW_LEVELS = [
  { value: 'light', label: 'Light', color: 'bg-rose-100 border-rose-300 text-rose-700' },
  { value: 'medium', label: 'Medium', color: 'bg-rose-200 border-rose-400 text-rose-800' },
  { value: 'heavy', label: 'Heavy', color: 'bg-rose-400 border-rose-500 text-white' },
]
const ENERGY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 border-amber-300 text-amber-700' },
  { value: 'high', label: 'High', color: 'bg-green-100 border-green-300 text-green-700' },
]

const phaseStyles: Record<string, { bg: string, strongBg: string, ring: string, text: string, label: string }> = {
  menstrual: { bg: 'bg-rose-100', strongBg: 'bg-rose-400', ring: 'bg-rose-400/30', text: 'text-rose-500', label: 'PERIOD' },
  follicular: { bg: 'bg-amber-100', strongBg: 'bg-amber-400', ring: 'bg-amber-400/30', text: 'text-amber-600', label: 'FOLLICULAR' },
  ovulation: { bg: 'bg-[#d8f4fc]', strongBg: 'bg-[#75dcf5]', ring: 'bg-[#75dcf5]/40', text: 'text-[#5bcded]', label: 'OVULATION' },
  luteal: { bg: 'bg-violet-100', strongBg: 'bg-violet-400', ring: 'bg-violet-400/30', text: 'text-violet-600', label: 'LUTEAL' },
}

export function CycleTrackerClient({ userId, profile, cycleData: initial, phaseInfo, today }: CycleTrackerClientProps) {
  const [cycleData, setCycleData] = useState(initial)
  const [selectedDate, setSelectedDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const existing = cycleData.find((d) => d.date === selectedDate)
  const [form, setForm] = useState<{
    flow_level: 'light' | 'medium' | 'heavy' | null
    symptoms: string[]
    energy_level: 'low' | 'medium' | 'high' | null
    notes: string
  }>({
    flow_level: existing?.flow_level ?? null,
    energy_level: existing?.energy_level ?? null,
    symptoms: existing?.symptoms ?? [],
    notes: existing?.notes ?? '',
  })

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    const e = cycleData.find((d) => d.date === date)
    setForm({
      flow_level: e?.flow_level ?? null,
      energy_level: e?.energy_level ?? null,
      symptoms: e?.symptoms ?? [],
      notes: e?.notes ?? '',
    })
    setSaved(false)
  }

  const toggleSymptom = (s: string) => {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(s) ? prev.symptoms.filter((x) => x !== s) : [...prev.symptoms, s],
    }))
  }

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    const payload = { user_id: userId, date: selectedDate, ...form }
    const { data } = await supabase.from('cycle_data').upsert(payload, { onConflict: 'user_id,date' }).select().single()
    if (data) {
      setCycleData((prev) => {
        const filtered = prev.filter((d) => d.date !== selectedDate)
        return [data as CycleData, ...filtered]
      })
      setSaved(true)
    }
    setSaving(false)
  }

  // Build last 35 days for the mini calendar
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const d = subDays(new Date(today), 34 - i)
    const ds = format(d, 'yyyy-MM-dd')
    let phase: string | null = null
    let cycleDay: number | null = null

    if (profile.last_period_date) {
      const lastPeriod = new Date(profile.last_period_date)
      const lpTime = new Date(lastPeriod.getFullYear(), lastPeriod.getMonth(), lastPeriod.getDate()).getTime()
      const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const daysSince = Math.floor((dTime - lpTime) / (1000 * 60 * 60 * 24))

      cycleDay = ((daysSince % profile.cycle_length) + profile.cycle_length) % profile.cycle_length + 1

      if (cycleDay <= profile.period_length) phase = 'menstrual'
      else if (cycleDay <= 13) phase = 'follicular'
      else if (cycleDay <= 16) phase = 'ovulation'
      else phase = 'luteal'
    }

    const hasData = cycleData.some((cd) => cd.date === ds)
    return {
      date: ds,
      phase,
      cycleDay,
      hasData,
      isToday: ds === today,
      dayOfWeek: d.getDay()
    }
  })

  return (
    <div className="space-y-6">
      {/* Mini calendar */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Last 5 weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-y-3 pt-6 pb-2 relative z-0">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[12px] font-medium text-muted-foreground/70 mb-2">{d}</div>
            ))}
            {calendarDays.map(({ date, phase, cycleDay, hasData, isToday: isTodayDate, dayOfWeek }, i) => {
              const prevPhase = i > 0 ? calendarDays[i - 1].phase : null
              const nextPhase = i < calendarDays.length - 1 ? calendarDays[i + 1].phase : null

              const isFirstDayOfPhase = phase && (i === 0 || prevPhase !== phase || dayOfWeek === 0)
              const isLastDayOfPhase = phase && (i === calendarDays.length - 1 || nextPhase !== phase || dayOfWeek === 6)

              const isMainPhaseDay =
                (phase === 'menstrual' && cycleDay === (profile.period_length > 1 ? 2 : 1)) ||
                (phase === 'ovulation' && cycleDay === 15)

              const pStyle = phase ? phaseStyles[phase] : null

              return (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className="relative flex h-11 w-full items-center justify-center text-sm transition-all focus:outline-none group"
                >
                  {/* Background Pill */}
                  {phase && pStyle && (
                    <div
                      className={cn(
                        'absolute inset-y-1 w-full z-0',
                        pStyle.bg,
                        isFirstDayOfPhase ? 'rounded-l-full ml-1 w-[calc(100%-4px)]' : '',
                        isLastDayOfPhase ? 'rounded-r-full mr-1 w-[calc(100%-4px)]' : '',
                        isFirstDayOfPhase && isLastDayOfPhase ? 'mx-1 w-[calc(100%-8px)]' : ''
                      )}
                    />
                  )}

                  {phase && pStyle && isMainPhaseDay && (
                    <>
                      {/* Main Day Highlights */}
                      <div className={cn("absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap z-20", pStyle.text)}>
                        {pStyle.label}
                      </div>
                      <div className={cn('absolute inset-0 m-auto h-10 w-10 rounded-full z-10', pStyle.ring)} />
                      <div className={cn('absolute inset-0 m-auto h-[1.8rem] w-[1.8rem] rounded-full z-10', pStyle.strongBg)} />
                    </>
                  )}

                  {/* Date Text */}
                  <span className={cn(
                    "relative z-20 text-[15px]",
                    isMainPhaseDay ? "text-white font-medium" : "text-foreground group-hover:bg-accent/40 rounded-full w-8 h-8 flex items-center justify-center",
                    isTodayDate && !isMainPhaseDay ? "font-bold text-primary" : "",
                    !isMainPhaseDay && selectedDate === date ? "bg-accent/80 font-semibold" : ""
                  )}>
                    {format(parseISO(date), 'd')}
                  </span>

                  {/* Selection Indicator on Main Day */}
                  {selectedDate === date && isMainPhaseDay && (
                    <div className="absolute inset-0 m-auto h-11 w-11 rounded-full border border-foreground/30 z-20" />
                  )}

                  {/* Data indicator */}
                  {hasData && (
                    <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full z-20", isMainPhaseDay ? "bg-white" : selectedDate === date ? "bg-primary" : "bg-muted-foreground")} />
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 px-2">
            {Object.entries(phaseStyles).map(([phase, style]) => (
              <span key={phase} className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <div className={cn('h-3 w-3 rounded-full', style.strongBg)} />
                {style.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log form */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Log for {selectedDate === today ? 'Today' : format(parseISO(selectedDate), 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Flow */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Droplets className="h-4 w-4 text-rose-500" /> Flow
            </Label>
            <div className="flex gap-2">
              {FLOW_LEVELS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setForm((p) => ({ ...p, flow_level: p.flow_level === value ? null : value as 'light' | 'medium' | 'heavy' }))}
                  className={cn(
                    'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all',
                    form.flow_level === value ? color : 'border-border bg-card text-foreground hover:bg-accent',
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setForm((p) => ({ ...p, flow_level: null }))}
                className={cn(
                  'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all',
                  form.flow_level === null ? 'border-primary bg-accent text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-accent',
                )}
              >
                None
              </button>
            </div>
          </div>

          {/* Energy */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Energy level</Label>
            <div className="flex gap-2">
              {ENERGY_LEVELS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setForm((p) => ({ ...p, energy_level: p.energy_level === value ? null : value as 'low' | 'medium' | 'high' }))}
                  className={cn(
                    'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all',
                    form.energy_level === value ? color : 'border-border bg-card text-foreground hover:bg-accent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Symptoms</Label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    form.symptoms.includes(s)
                      ? 'border-primary bg-accent text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {form.symptoms.includes(s) && <CheckCircle2 className="h-3 w-3 text-primary" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              placeholder="How are you feeling today?"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save log'}
            {saved && <CheckCircle2 className="ml-2 h-4 w-4" />}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
