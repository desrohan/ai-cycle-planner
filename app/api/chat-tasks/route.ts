import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, addDays } from 'date-fns'
import { Task } from '@/lib/types'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, phase, profile, userId, context, confirmData } = await req.json()

    // If UI explicitly says "I am confirming this specific plan we already generated", skip LLM and save
    if (confirmData) {
        const { actionType, tasks: safeTasks } = confirmData;
        let processedTasks = [];
        let tasks_to_delete = [];

        if (actionType === 'delete_tasks') {
            const idsToDelete = safeTasks.map((t: any) => t.id).filter(Boolean);
            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('tasks')
                    .delete()
                    .in('id', idsToDelete)
                    .eq('user_id', userId)
                if (!deleteError) tasks_to_delete = idsToDelete;
            }
        } else if (actionType === 'generate_tasks') {
            const tasksToInsert = safeTasks.map((t: Record<string, unknown>) => ({
                ...t,
                user_id: userId,
            }))
            // make sure we don't insert `id` from some preview if it happens to be there
            tasksToInsert.forEach((t: any) => { delete t.id });
            const { data: inserted, error: supabaseError } = await supabase
                .from('tasks')
                .insert(tasksToInsert)
                .select()
            if (!supabaseError) processedTasks = inserted ?? [];
        } else if (actionType === 'edit_task' || actionType === 'batch_edit_tasks') {
            // Must update existing
            const updatedTasks = []
            for (const t of safeTasks) {
                if (t.id) {
                    const { id, ...updateData } = t
                    const { data: updated, error } = await supabase
                        .from('tasks')
                        .update(updateData)
                        .eq('id', id)
                        .eq('user_id', userId)
                        .select()
                        .single()
                    if (!error && updated) updatedTasks.push(updated)
                }
            }
            processedTasks = updatedTasks
        }

        return NextResponse.json({
            message: "Action confirmed. I have updated your tasks successfully.",
            type: actionType,
            requires_confirmation: false,
            preview_tasks: [],
            tasks: processedTasks,
            tasks_to_delete
        })
    }

    // Context is an array of selected contexts (e.g. particular Tasks or Phase references)
    // To feed efficiently to Gemini, we stringify it.
    const contextString = context && context.length > 0
        ? `User provided explicit context to focus on: ${JSON.stringify(context, null, 2)}`
        : `No explicit task/phase context provided.`

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const today = format(new Date(), 'yyyy-MM-dd')

    const systemPrompt = `You are an AI planner for FlowSync, a cycle-aware task management app. 
You act as a supportive, knowledgeable task planner.
The user is currently in the **${phase}** phase of their menstrual cycle.

User Profile:
- Goal: ${profile?.goal || 'General wellness'}
- Activity Level: ${profile?.activity_level || 'Moderate'}
- Preferred Workout: ${profile?.preferred_workout || 'Mixed'}

Phase-specific planning guidelines:
- Menstrual: Prioritize rest, low intensity (e.g., yoga, walking), short durations, deep work.
- Follicular: Increasing intensity (e.g., jogging, learning), longer durations, high creativity.
- Ovulation: Peak intensity (e.g., HIIT, running), most demanding tasks, highly social.
- Luteal: Declining intensity (e.g., pilates, strength), medium durations, detailed-oriented tasks, emphasis on sleep.

Context provided by user:
${contextString}

You MUST reply in STRICT JSON format matching this structure perfectly. No markdown code blocks.
{
  "type": "chat" | "plan_overview" | "generate_tasks" | "edit_task" | "batch_edit_tasks" | "delete_tasks",
  "message": "A supportive conversational response.",
  "requires_confirmation": boolean,
  "preview_tasks": [
     // Include if type is plan_overview or requires_confirmation is true, showing the proposed new/edited tasks
  ],
  "tasks": [
     // ONLY include if requires_confirmation is false AND type is generate_tasks, edit_task, or batch_edit_tasks. These will be immediately saved to DB.
  ],
  "tasks_to_delete": [
     // Array of UUID strings. ONLY include if requires_confirmation is false AND type is delete_tasks.
  ]
}

Task object structure:
{
  "id": "existing-uuid" (ONLY if editing an existing task),
  "title": "Task Name",
  "description": "Short description",
  "scheduled_date": "YYYY-MM-DD",
  "duration_minutes": 30,
  "intensity": "low" | "medium" | "high",
  "phase_context": "phase name"
}

Behavior Rules:
1. If the user asks for a large new plan (e.g. "I want to run a marathon in 3 months"):
   - Set type to "plan_overview".
   - Set requires_confirmation to true.
   - Summarize the multi-month plan in the "message".
   - Put a few sample task objects in "preview_tasks" to show what will be generated. Do NOT populate "tasks".
2. If the user explicitly says "Confirm" or "Looks good" to a plan:
   - Set type to "generate_tasks", "edit_task", "batch_edit_tasks", or "delete_tasks" based on their previous request.
   - Set requires_confirmation to false.
   - Populate "tasks" or "tasks_to_delete" to enact the changes.
3. If the user provided a specific Task in the context and asks to change/update it:
   - YOU MUST NOT CREATE A NEW TASK.
   - Set type to "edit_task".
   - Set requires_confirmation to true (so they can review the change first).
   - Put the EXACT SAME original task id in the modified task inside "preview_tasks".
4. If the user provided a Phase in the context and asks to change tasks for that phase:
   - Set type to "batch_edit_tasks".
   - Set requires_confirmation to true.
   - Put the proposed modified tasks in "preview_tasks" (MUST include original ids).
5. If the user asks to delete a specific task(s):
   - Set type to "delete_tasks".
   - Set requires_confirmation to true.
   - Populate "preview_tasks" with the original task objects so the user knows what will be deleted.
   - Once confirmed, populate "tasks_to_delete" with their UUIDs and set requires_confirmation to false.
6. If the user is just chatting normally, set type to "chat" and requires_confirmation to false, leaving arrays empty.
7. Start scheduling tasks from today: ${today} unless instructed otherwise.`

    const geminiMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
        generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
            maxOutputTokens: 2048,
        },
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            },
        )

        const data = await response.json()

        if (!response.ok) {
            console.error('Gemini API returned error', data)
            return NextResponse.json({ error: data.error?.message || 'Gemini API error' }, { status: 500 })
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

        let parsedContent;
        try {
            parsedContent = JSON.parse(text);
        } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                parsedContent = JSON.parse(match[0]);
            } else {
                return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
            }
        }

        const aiMessage = parsedContent.message || "I've processed your request.";
        const type = parsedContent.type || "chat";
        const requiresConfirmation = parsedContent.requires_confirmation || false;
        const previewTasks = parsedContent.preview_tasks || [];
        const aiTasks = parsedContent.tasks || [];
        const tasksToDelete = parsedContent.tasks_to_delete || [];

        let processedTasks = [];
        let processedDeletedIds = [];

        // If tasks are provided and NO confirmation is needed, save them to DB immediately
        if (!requiresConfirmation) {
            if (type === 'generate_tasks' && aiTasks.length > 0) {
                const tasksToInsert = aiTasks.map((t: Record<string, unknown>) => ({
                    ...t,
                    user_id: userId,
                }))
                const { data: inserted, error: supabaseError } = await supabase
                    .from('tasks')
                    .insert(tasksToInsert)
                    .select()
                if (!supabaseError) processedTasks = inserted ?? [];
            }
            else if ((type === 'edit_task' || type === 'batch_edit_tasks') && aiTasks.length > 0) {
                // For edits, we need to update existing rows
                const updatedTasks = []
                for (const t of aiTasks) {
                    if (t.id) {
                        const { id, ...updateData } = t
                        const { data: updated, error } = await supabase
                            .from('tasks')
                            .update(updateData)
                            .eq('id', id)
                            .eq('user_id', userId)
                            .select()
                            .single()
                        if (!error && updated) updatedTasks.push(updated)
                    }
                }
                processedTasks = updatedTasks
            }
            else if (type === 'delete_tasks' && tasksToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('tasks')
                    .delete()
                    .in('id', tasksToDelete)
                    .eq('user_id', userId)

                if (!deleteError) {
                    processedDeletedIds = tasksToDelete;
                }
            }
        }

        return NextResponse.json({
            message: aiMessage,
            type,
            requires_confirmation: requiresConfirmation,
            preview_tasks: previewTasks,
            tasks: processedTasks,
            tasks_to_delete: processedDeletedIds
        })
    } catch (err) {
        console.error('Chat generate tasks error:', err)
        return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 })
    }
}
