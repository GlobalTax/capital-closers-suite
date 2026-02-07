import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AccessRequest {
  trackingId: string;
  documentId?: string;
  action: 'validate' | 'list' | 'download';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // This function is PUBLIC - authentication via tracking_id token only
    const body: AccessRequest = await req.json()
    const { trackingId, documentId, action = 'validate' } = body

    if (!trackingId) {
      return new Response(
        JSON.stringify({ error: 'Token requerido', code: 'MISSING_TOKEN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role to access data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Validate tracking_id and get recipient data
    const { data: recipient, error: recipientError } = await supabase
      .from('teaser_recipients')
      .select(`
        id,
        email,
        nombre,
        empresa_nombre,
        campaign_id,
        nda_status,
        nda_signed_at,
        cim_access_granted,
        cim_access_granted_at,
        cim_access_revoked_at,
        cim_access_revoke_reason
      `)
      .eq('tracking_id', trackingId)
      .single()

    if (recipientError || !recipient) {
      console.error('[AccessCIM] Invalid tracking_id:', recipientError)
      return new Response(
        JSON.stringify({ 
          error: 'Token inválido o expirado', 
          code: 'INVALID_TOKEN' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Check if access has been revoked
    if (recipient.cim_access_revoked_at) {
      return new Response(
        JSON.stringify({ 
          error: 'El acceso ha sido revocado',
          code: 'ACCESS_REVOKED',
          reason: recipient.cim_access_revoke_reason || 'Sin razón especificada'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Check if can access CIM (NDA signed or manual grant)
    const canAccess = recipient.nda_status === 'signed' || recipient.cim_access_granted === true

    if (!canAccess) {
      // Return current status for UI display
      return new Response(
        JSON.stringify({ 
          error: 'NDA requerido para acceder al CIM',
          code: 'NDA_REQUIRED',
          ndaStatus: recipient.nda_status,
          recipient: {
            nombre: recipient.nombre,
            email: recipient.email,
            empresa: recipient.empresa_nombre
          }
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get campaign details to find mandato
    const { data: campaign, error: campaignError } = await supabase
      .from('teaser_campaigns')
      .select('id, name, mandato_id, mandato:mandatos(id, nombre)')
      .eq('id', recipient.campaign_id)
      .single()

    if (campaignError || !campaign?.mandato_id) {
      console.error('[AccessCIM] Campaign/mandato not found:', campaignError)
      return new Response(
        JSON.stringify({ error: 'Proyecto no encontrado', code: 'PROJECT_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log access event
    await supabase
      .from('nda_tracking_events')
      .insert({
        recipient_id: recipient.id,
        event_type: 'cim_accessed',
        metadata: {
          action,
          document_id: documentId || null,
          timestamp: new Date().toISOString(),
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })

    // Handle different actions
    if (action === 'validate') {
      // Just validate access - return basic info
      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: true,
          recipient: {
            nombre: recipient.nombre,
            email: recipient.email,
            empresa: recipient.empresa_nombre
          },
          project: {
            id: campaign.mandato_id,
            nombre: (campaign.mandato as any)?.nombre || campaign.name
          },
          accessGrantedAt: recipient.cim_access_granted_at || recipient.nda_signed_at
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'list') {
      // List available Data Room documents for this mandato
      const { data: documents, error: docsError } = await supabase
        .from('documentos')
        .select('id, file_name, descripcion, tipo, storage_path, file_size_bytes, created_at')
        .eq('mandato_id', campaign.mandato_id)
        .eq('is_data_room', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (docsError) {
        console.error('[AccessCIM] Error fetching documents:', docsError)
        return new Response(
          JSON.stringify({ error: 'Error al cargar documentos', code: 'FETCH_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          recipient: {
            nombre: recipient.nombre,
            email: recipient.email,
            empresa: recipient.empresa_nombre
          },
          project: {
            id: campaign.mandato_id,
            nombre: (campaign.mandato as any)?.nombre || campaign.name
          },
          documents: documents || []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'download') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: 'ID de documento requerido', code: 'MISSING_DOC_ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get document details
      const { data: document, error: docError } = await supabase
        .from('documentos')
        .select('id, file_name, storage_path, mandato_id, is_data_room, is_active')
        .eq('id', documentId)
        .single()

      if (docError || !document) {
        return new Response(
          JSON.stringify({ error: 'Documento no encontrado', code: 'DOC_NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify document belongs to same mandato
      if (document.mandato_id !== campaign.mandato_id) {
        return new Response(
          JSON.stringify({ error: 'Acceso no autorizado a este documento', code: 'UNAUTHORIZED' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify document is in data room and active
      if (!document.is_data_room || !document.is_active) {
        return new Response(
          JSON.stringify({ error: 'Documento no disponible', code: 'DOC_UNAVAILABLE' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate signed URL (1 hour expiration for security)
      const expiresIn = 3600 // 1 hour
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('mandato-documentos')
        .createSignedUrl(document.storage_path, expiresIn)

      if (signedUrlError) {
        console.error('[AccessCIM] Error generating signed URL:', signedUrlError)
        return new Response(
          JSON.stringify({ error: 'Error al generar enlace de descarga', code: 'URL_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log download event
      await supabase
        .from('document_access_logs')
        .insert({
          document_id: documentId,
          action: 'download',
          user_id: null, // External user
          ip_address: req.headers.get('x-forwarded-for') || null,
          user_agent: req.headers.get('user-agent') || null,
          metadata: {
            tracking_id: trackingId,
            recipient_id: recipient.id,
            recipient_email: recipient.email
          }
        })

      return new Response(
        JSON.stringify({
          success: true,
          signedUrl: signedUrlData.signedUrl,
          expiresIn,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
          document: {
            id: document.id,
            file_name: document.file_name
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida', code: 'INVALID_ACTION' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[AccessCIM] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor', 
        code: 'INTERNAL_ERROR' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
