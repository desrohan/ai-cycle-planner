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

const phaseColors: Record<string, string> = {
  menstrual: 'bg-rose-400',
  follicular: 'bg-amber-400',
  ovulation: 'bg-green-400',
  luteal: 'bg-violet-400',
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
    const phase = profile.last_period_date
      ? getPhaseForDate(d, profile.last_period_date, profile.cycle_length, profile.period_length)
      : null
    const hasData = cycleData.some((cd) => cd.date === ds)
    return { date: ds, phase, hasData, isToday: ds === today }
  })

  return (
    <div className="space-y-6">
      {/* Mini calendar */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Last 5 weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {calendarDays.map(({ date, phase, hasData, isToday: isTodayDate }) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={cn(
                  'relative flex h-8 w-full items-center justify-center rounded-md text-xs transition-all',
                  selectedDate === date ? 'ring-2 ring-primary ring-offset-1' : '',
                  isTodayDate ? 'font-bold text-primary' : 'text-foreground',
                  'hover:bg-accent',
                )}
              >
                {format(parseISO(date), 'd')}
                {phase && (
                  <div className={cn('absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full', phaseColors[phase])} />
                )}
                {hasData && (
                  <div className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(phaseColors).map(([phase, color]) => (
              <span key={phase} className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                <div className={cn('h-2 w-2 rounded-full', color)} />
                {phase}
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
