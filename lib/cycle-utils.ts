import { Phase, PhaseInfo } from './types'
import { differenceInDays } from 'date-fns'

export function getCurrentPhase(
  lastPeriodDate: string,
  cycleLength: number = 28,
  periodLength: number = 5,
): PhaseInfo {
  const today = new Date()
  const lastPeriod = new Date(lastPeriodDate)
  const daysSince = differenceInDays(today, lastPeriod)
  const cycleDay = (daysSince % cycleLength) + 1

  let phase: Phase
  let daysLeft: number

  if (cycleDay <= periodLength) {
    phase = 'menstrual'
    daysLeft = periodLength - cycleDay + 1
  } else if (cycleDay <= 13) {
    phase = 'follicular'
    daysLeft = 13 - cycleDay + 1
  } else if (cycleDay <= 16) {
    phase = 'ovulation'
    daysLeft = 16 - cycleDay + 1
  } else {
    phase = 'luteal'
    daysLeft = cycleLength - cycleDay + 1
  }

  return getPhaseInfo(phase, cycleDay, daysLeft)
}

export function getPhaseInfo(phase: Phase, day: number, daysLeft: number): PhaseInfo {
  const phaseData: Record<Phase, Omit<PhaseInfo, 'phase' | 'day' | 'daysLeft'>> = {
    menstrual: {
      label: 'Menstrual Phase',
      description: 'Rest and reflect. Your body is doing important work.',
      color: '#e11d48',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      badgeColor: 'bg-rose-100 text-rose-700',
      traits: ['Low energy', 'Introspection', 'Rest needed'],
      tips: [
        'Gentle movement like yoga or walking',
        'Prioritize rest and recovery tasks',
        'Avoid high-intensity workouts',
        'Focus on reflective or creative work',
      ],
    },
    follicular: {
      label: 'Follicular Phase',
      description: 'Energy rising. Great time to start new projects.',
      color: '#d97706',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      badgeColor: 'bg-amber-100 text-amber-700',
      traits: ['Rising energy', 'Curious', 'Creative'],
      tips: [
        'Start new projects and brainstorm',
        'Try moderate to high-intensity workouts',
        'Learn new skills or take on challenges',
        'Social activities and collaboration',
      ],
    },
    ovulation: {
      label: 'Ovulation Phase',
      description: 'Peak energy and confidence. You are unstoppable.',
      color: '#16a34a',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      badgeColor: 'bg-green-100 text-green-700',
      traits: ['Peak energy', 'Confident', 'Social'],
      tips: [
        'Take on your most demanding tasks',
        'High-intensity exercise is ideal',
        'Presentations and important meetings',
        'Networking and social engagements',
      ],
    },
    luteal: {
      label: 'Luteal Phase',
      description: 'Wind down and complete. Focus on finishing tasks.',
      color: '#7c3aed',
      textColor: 'text-violet-700',
      bgColor: 'bg-violet-50',
      badgeColor: 'bg-violet-100 text-violet-700',
      traits: ['Detail-oriented', 'Focused', 'Winding down'],
      tips: [
        'Complete ongoing projects',
        'Moderate intensity workouts',
        'Organize and plan ahead',
        'Prioritize self-care and nutrition',
      ],
    },
  }

  return {
    phase,
    day,
    daysLeft,
    ...phaseData[phase],
  }
}

export function getNextPeriodDate(lastPeriodDate: string, cycleLength: number = 28): Date {
  const last = new Date(lastPeriodDate)
  const today = new Date()
  const daysSince = differenceInDays(today, last)
  const cyclesElapsed = Math.floor(daysSince / cycleLength)
  const nextPeriod = new Date(last)
  nextPeriod.setDate(last.getDate() + (cyclesElapsed + 1) * cycleLength)
  return nextPeriod
}

export function getPhaseForDate(
  date: Date,
  lastPeriodDate: string,
  cycleLength: number = 28,
  periodLength: number = 5,
): Phase {
  const lastPeriod = new Date(lastPeriodDate)
  const daysSince = differenceInDays(date, lastPeriod)
  const cycleDay = ((daysSince % cycleLength) + cycleLength) % cycleLength + 1

  if (cycleDay <= periodLength) return 'menstrual'
  if (cycleDay <= 13) return 'follicular'
  if (cycleDay <= 16) return 'ovulation'
  return 'luteal'
}
