// Daily Digest Edge Function for Phase 3
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DigestTask {
  id: string;
  titulo: string;
  prioridad: string;
  fecha_vencimiento: string | null;
  estado: string;
  estimated_minutes?: number;
  context_type?: string;
  health_status?: string;
}

interface DailyDigest {
  greeting: string;
  focus_tasks: DigestTask[];
  ordered_task_ids: string[];
  warnings: string[];
  suggestions: string[];
  total_estimated_hours: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user info
    const { data: userData } = await supabase
      .from('admin_users')
      .select('full_name, role')
      .eq('user_id', user_id)
      .single();

    const userName = userData?.full_name?.split(' ')[0] || 'Usuario';

    // Get open tasks for user
    const { data: tasks, error: tasksError } = await supabase
      .from('tareas')
      .select('id, titulo, descripcion, prioridad, fecha_vencimiento, estado, health_status')
      .or(`asignado_a.eq.${user_id},creado_por.eq.${user_id}`)
      .neq('estado', 'completada')
      .order('fecha_vencimiento', { ascending: true, nullsFirst: false });

    if (tasksError) throw tasksError;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    let timeOfDay = 'día';
    if (hour < 12) timeOfDay = 'mañana';
    else if (hour < 18) timeOfDay = 'tarde';
    else timeOfDay = 'noche';

    const systemPrompt = `You are a productivity assistant for M&A professionals at Capittal Partners.

Current date: ${today}
Current time of day: ${timeOfDay}
User name: ${userName}
User role: ${userData?.role || 'member'}

Analyze the user's open tasks and create a daily digest.

Rules:
- Prioritize overdue tasks first
- Then urgent/alta priority tasks
- Consider due dates (closest first)
- Maximum 8 hours of suggested work per day
- Group related tasks when logical
- Be encouraging but realistic

Tasks JSON:
${JSON.stringify(tasks, null, 2)}

Return JSON:
{
  "greeting": "Buenos días/tardes/noches [name], hoy tienes X tareas pendientes...",
  "focus_tasks": [top 3 task objects with id, titulo, prioridad, why it's priority],
  "ordered_task_ids": ["id1", "id2", ...],
  "warnings": ["Tienes 2 tareas vencidas", "La tarea X lleva 5 días sin progreso"],
  "suggestions": ["Quick win: la tarea Y solo requiere 15 min", "Considera delegar X"],
  "total_estimated_hours": 6.5
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate my daily digest' }
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Clean markdown
    content = content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);

    const digest: DailyDigest = JSON.parse(content.trim());

    // Enrich focus_tasks with full task data
    const focusTasksEnriched = digest.focus_tasks.map(ft => {
      const fullTask = tasks?.find(t => t.id === ft.id);
      return fullTask ? { ...fullTask, ...ft } : ft;
    });

    return new Response(
      JSON.stringify({
        success: true,
        digest: {
          ...digest,
          focus_tasks: focusTasksEnriched,
          all_tasks: tasks,
          generated_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Daily digest error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
