import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { phase, profile, userId } = await req.json()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  const prompt = `You are a cycle-aware task planner. Generate exactly 5 personalized tasks for a woman currently in her **${phase}** phase.

User profile:
- Goal: ${profile?.goal || 'general wellness and productivity'}
- Activity level: ${profile?.activity_level || 'moderately active'}
- Preferred workout: ${profile?.preferred_workout || 'general fitness'}

Phase guidelines:
- menstrual: Low energy. Focus on rest, gentle movement, reflective/admin work. Intensity: low.
- follicular: Rising energy. Creative work, learning, moderate exercise. Intensity: low-medium.
- ovulation: Peak energy. High-priority tasks, intense exercise, social/leadership. Intensity: high.
- luteal: Declining energy. Detail work, completion, moderate exercise, self-care. Intensity: medium.

Return ONLY a valid JSON array (no markdown, no explanation) with this exact structure:
[
  {
    "title": "Task name",
    "description": "Brief description",
    "scheduled_date": "YYYY-MM-DD",
    "duration_minutes": 30,
    "intensity": "low|medium|high",
    "phase_context": "${phase}"
  }
]

Rules:
- Spread tasks across the next 7 days starting from ${today}
- Match task intensity and type to the ${phase} phase
- Include a mix of: work/productivity, exercise, nutrition, and self-care tasks
- Make titles specific and actionable (not generic)`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Gemini API error' }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const aiTasks = JSON.parse(jsonMatch[0])

    // Insert tasks into Supabase
    const tasksToInsert = aiTasks.map((t: Record<string, unknown>) => ({
      ...t,
      user_id: userId,
    }))

    const { data: inserted } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select()

    return NextResponse.json({ tasks: inserted ?? [] })
  } catch (err) {
    console.error('Generate tasks error:', err)
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 })
  }
}
