'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, ArrowRight, ArrowLeft, CheckCircle2, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/auth/actions'

interface OnboardingFormProps {
  userId: string
  existingProfile: Record<string, unknown> | null
}

const GOALS = ['Boost productivity', 'Manage energy better', 'Improve health', 'Reduce PMS symptoms', 'Balance work & life']
const SLEEP_TIMES = ['Before 10pm', '10pm–11pm', '11pm–12am', 'After midnight']
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active']
const WORKOUTS = ['Yoga / Stretching', 'Running / Cardio', 'Strength training', 'HIIT', 'Walking', 'No regular workout']

export function OnboardingForm({ userId, existingProfile }: OnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    goal: (existingProfile?.goal as string) || '',
    sleep_time: (existingProfile?.sleep_time as string) || '',
    activity_level: (existingProfile?.activity_level as string) || '',
    preferred_workout: (existingProfile?.preferred_workout as string) || '',
    last_period_date: (existingProfile?.last_period_date as string) || '',
    cycle_length: (existingProfile?.cycle_length as number) || 28,
    period_length: (existingProfile?.period_length as number) || 5,
  })

  const totalSteps = 4
  const progress = ((step + 1) / totalSteps) * 100

  const handleSelect = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    setError(null)
    if (step === 0 && !form.goal) { setError('Please select a goal'); return }
    if (step === 1 && (!form.sleep_time || !form.activity_level || !form.preferred_workout)) {
      setError('Please fill in all lifestyle fields'); return
    }
    if (step === 2 && !form.last_period_date) { setError('Please enter your last period date'); return }
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: userId,
      ...form,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground gap-2 hover:text-foreground">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">FlowSync</span>
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Step {step + 1} of {totalSteps}</span>
              <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 0: Goal */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">What is your main goal?</h2>
              <p className="mt-1 text-sm text-muted-foreground">This helps us tailor your AI task plan.</p>
            </div>
            <div className="grid gap-3">
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => handleSelect('goal', g)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-5 py-4 text-left text-sm font-medium transition-all',
                    form.goal === g
                      ? 'border-primary bg-accent text-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent/50',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      form.goal === g ? 'border-primary bg-primary' : 'border-muted-foreground',
                    )}
                  >
                    {form.goal === g && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Lifestyle */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Tell us about your lifestyle</h2>
              <p className="mt-1 text-sm text-muted-foreground">We use this to personalize your recommendations.</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Usual bedtime</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SLEEP_TIMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSelect('sleep_time', t)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-center',
                        form.sleep_time === t
                          ? 'border-primary bg-accent text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/50',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Activity level</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_LEVELS.map((a) => (
                    <button
                      key={a}
                      onClick={() => handleSelect('activity_level', a)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-center',
                        form.activity_level === a
                          ? 'border-primary bg-accent text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/50',
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preferred workout</Label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKOUTS.map((w) => (
                    <button
                      key={w}
                      onClick={() => handleSelect('preferred_workout', w)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-center',
                        form.preferred_workout === w
                          ? 'border-primary bg-accent text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/50',
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cycle info */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">About your cycle</h2>
              <p className="mt-1 text-sm text-muted-foreground">This powers the phase tracking at the heart of FlowSync.</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="last_period_date">When did your last period start?</Label>
                <Input
                  id="last_period_date"
                  type="date"
                  value={form.last_period_date}
                  onChange={(e) => handleSelect('last_period_date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cycle_length">Cycle length (days)</Label>
                  <Input
                    id="cycle_length"
                    type="number"
                    min={21}
                    max={45}
                    value={form.cycle_length}
                    onChange={(e) => setForm((p) => ({ ...p, cycle_length: parseInt(e.target.value) || 28 }))}
                  />
                  <p className="text-xs text-muted-foreground">Typically 21–35 days</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_length">Period length (days)</Label>
                  <Input
                    id="period_length"
                    type="number"
                    min={2}
                    max={10}
                    value={form.period_length}
                    onChange={(e) => setForm((p) => ({ ...p, period_length: parseInt(e.target.value) || 5 }))}
                  />
                  <p className="text-xs text-muted-foreground">Typically 3–7 days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">You are all set!</h2>
              <p className="mt-1 text-sm text-muted-foreground">Here is a summary of your profile.</p>
            </div>
            <Card className="border-border">
              <CardContent className="p-5 space-y-3">
                {[
                  { label: 'Main goal', value: form.goal },
                  { label: 'Bedtime', value: form.sleep_time },
                  { label: 'Activity level', value: form.activity_level },
                  { label: 'Preferred workout', value: form.preferred_workout },
                  { label: 'Last period', value: form.last_period_date },
                  { label: 'Cycle length', value: `${form.cycle_length} days` },
                  { label: 'Period length', value: `${form.period_length} days` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <div />
          )}
          {step < totalSteps - 1 ? (
            <Button onClick={handleNext} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? 'Saving...' : 'Go to dashboard'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
