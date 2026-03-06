export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export interface Profile {
  id: string
  goal: string | null
  sleep_time: string | null
  activity_level: string | null
  preferred_workout: string | null
  last_period_date: string | null
  cycle_length: number
  period_length: number
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface CycleData {
  id: string
  user_id: string
  date: string
  flow_level: 'light' | 'medium' | 'heavy' | null
  symptoms: string[]
  energy_level: 'low' | 'medium' | 'high' | null
  notes: string | null
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  scheduled_date: string
  duration_minutes: number
  intensity: 'low' | 'medium' | 'high' | null
  phase_context: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

export interface PhaseInfo {
  phase: Phase
  label: string
  day: number
  daysLeft: number
  description: string
  color: string
  textColor: string
  bgColor: string
  badgeColor: string
  traits: string[]
  tips: string[]
}
