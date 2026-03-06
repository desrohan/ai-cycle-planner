import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, phase, profile } = await req.json()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
  }

  const systemPrompt = `You are a compassionate, knowledgeable AI wellness assistant integrated into FlowSync — a cycle-aware task planning app. You help women understand and work with their menstrual cycle to optimize their energy, productivity, and wellbeing.

The user is currently in the **${phase}** phase of their cycle.
Their main goal is: **${profile?.goal || 'overall wellness'}**
Activity level: **${profile?.activity_level || 'not specified'}**
Preferred workout: **${profile?.preferred_workout || 'not specified'}**

Your role:
- Provide personalized advice based on their current cycle phase
- Help them modify, prioritize, or plan tasks based on their energy levels
- Give guidance on exercise, nutrition, and self-care for their phase
- Be warm, supportive, and science-informed (not alarmist)
- Keep responses concise and actionable (under 200 words unless asked for more)
- Never give medical diagnoses — encourage professional consultation for health concerns

Current phase context:
- Menstrual: Rest, gentle movement, reflective work, iron-rich foods
- Follicular: Rising energy, new projects, cardio, creative thinking  
- Ovulation: Peak energy, high-intensity exercise, leadership, social activities
- Luteal: Detail work, completion, moderate exercise, self-care priority`

  const geminiMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Gemini API error' }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response.'
    return NextResponse.json({ message: text })
  } catch (err) {
    console.error('Gemini API error:', err)
    return NextResponse.json({ error: 'Failed to reach Gemini API' }, { status: 500 })
  }
}
