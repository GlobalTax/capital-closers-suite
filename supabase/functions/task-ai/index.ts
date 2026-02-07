import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedTask {
  title: string;
  description: string;
  priority: 'urgente' | 'alta' | 'media' | 'baja';
  due_date: string | null;
  assigned_to_name: string | null;
  context_type: 'mandato' | 'cliente' | 'general';
  context_hint: string | null;
  estimated_minutes: number;
  suggested_fase: string | null;
}

interface AIResponse {
  tasks: ParsedTask[];
  reasoning: string;
}

/**
 * Validates the request is from an admin user.
 */
async function validateAdminAuth(req: Request): Promise<{ userId: string; role: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ success: false, error: "No autorizado: token requerido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "No autorizado: token inválido" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser || !["admin", "super_admin"].includes(adminUser.role)) {
    return new Response(
      JSON.stringify({ success: false, error: "Permisos insuficientes: se requiere rol admin" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return { userId: user.id, role: adminUser.role };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth validation
  const authResult = await validateAdminAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { raw_text, user_context } = await req.json();

    if (!raw_text || typeof raw_text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'raw_text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: teamMembers } = await supabase
      .from('admin_users')
      .select('full_name, role, skills, is_active')
      .eq('is_active', true);

    const teamList = teamMembers?.map(m => ({
      name: m.full_name,
      role: m.role,
      skills: m.skills || []
    })) || [];

    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are an intelligent task management assistant for a professional M&A advisory firm (Capittal Partners).

Your job:
- Understand the user input (which may be informal, in Spanish)
- Extract actionable tasks
- Split complex inputs into atomic tasks when needed
- Assign priority, due date, and responsible person

Rules:
- Prefer fewer tasks, but well-defined
- Tasks must be actionable and specific
- Use professional M&A context (teaser, LOI, due diligence, NDA, etc.)
- If a team member name is mentioned, assign directly to them
- If assignment is unclear, leave assigned_to_name as null
- Use realistic deadlines based on urgency cues:
  - "urgente/hoy/ya" → today
  - "esta semana" → 3 days from now
  - "próxima semana/semana que viene" → 7 days from now
  - Default → 5 days from now
- Detect context_type:
  - "mandato" if mentions deal, operación, venta, compra, due diligence
  - "cliente" if mentions cliente, empresa specific
  - "general" for internal tasks
- For M&A tasks, suggest the phase:
  - "1. Preparación" (teaser, NDA, información)
  - "2. Marketing" (longlist, contactos, envíos)
  - "3. Ofertas" (IOI, LOI, negociación)
  - "4. Due Diligence" (documentación, análisis)
  - "5. Cierre" (SPA, closing, post-merger)

Team members available:
${JSON.stringify(teamList, null, 2)}

Current date: ${today}
User role: ${user_context?.role || authResult.role || 'socio'}

IMPORTANT: Always respond in valid JSON format with this exact structure:
{
  "tasks": [
    {
      "title": "Task title in Spanish",
      "description": "Brief description",
      "priority": "urgente|alta|media|baja",
      "due_date": "YYYY-MM-DD or null",
      "assigned_to_name": "Team member name or null",
      "context_type": "mandato|cliente|general",
      "context_hint": "Name of mandato/client if mentioned, or null",
      "estimated_minutes": 30,
      "suggested_fase": "1. Preparación|2. Marketing|3. Ofertas|4. Due Diligence|5. Cierre|null"
    }
  ],
  "reasoning": "Brief explanation of how you interpreted the input"
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
          { role: 'user', content: raw_text }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let parsed: AIResponse;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
      parsed = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Invalid AI response structure: missing tasks array');
    }

    const tasksWithIds = await Promise.all(
      parsed.tasks.map(async (task) => {
        let assigned_to_id: string | null = null;
        
        if (task.assigned_to_name) {
          const { data: user } = await supabase
            .from('admin_users')
            .select('user_id')
            .ilike('full_name', `%${task.assigned_to_name}%`)
            .eq('is_active', true)
            .limit(1)
            .single();
          
          assigned_to_id = user?.user_id || null;
        }

        return { ...task, assigned_to_id };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        tasks: tasksWithIds,
        reasoning: parsed.reasoning,
        team_members: teamList,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Task AI error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
