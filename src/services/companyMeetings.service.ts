import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";

// ============================================
// Types
// ============================================
export interface CompanyMeeting {
  id: string;
  company_id: string;
  meeting_date: string;
  title: string;
  preparation_notes: string | null;
  meeting_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  ai_summary: string | null;
  ai_action_items: unknown[] | null;
  ai_key_quotes: string[] | null;
  ai_processed_at: string | null;
}

export interface MeetingDocument {
  id: string;
  meeting_id: string;
  file_name: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface CreateMeetingData {
  company_id: string;
  meeting_date: string;
  title: string;
  preparation_notes?: string;
}

export interface UpdateMeetingData {
  title?: string;
  meeting_date?: string;
  preparation_notes?: string;
  meeting_notes?: string;
}

// ============================================
// Meeting CRUD Operations
// ============================================

export async function fetchMeetingsByCompany(companyId: string): Promise<CompanyMeeting[]> {
  const { data, error } = await supabase
    .from("company_meetings")
    .select("*")
    .eq("company_id", companyId)
    .order("meeting_date", { ascending: false });

  if (error) throw new DatabaseError('Error al obtener reuniones', { supabaseError: error, table: 'company_meetings' });
  return (data || []) as unknown as CompanyMeeting[];
}

export async function getMeetingById(id: string): Promise<CompanyMeeting | null> {
  const { data, error } = await supabase
    .from("company_meetings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DatabaseError('Error al obtener reunión', { supabaseError: error, table: 'company_meetings', id });
  return data as unknown as CompanyMeeting | null;
}

export async function createMeeting(meetingData: CreateMeetingData): Promise<CompanyMeeting> {
  const { data: session } = await supabase.auth.getSession();
  
  const { data, error } = await supabase
    .from("company_meetings")
    .insert({
      ...meetingData,
      created_by: session?.session?.user?.id || null,
    })
    .select()
    .single();

  if (error) throw new DatabaseError('Error al crear reunión', { supabaseError: error, table: 'company_meetings' });
  return data as unknown as CompanyMeeting;
}

export async function updateMeeting(id: string, updateData: UpdateMeetingData): Promise<CompanyMeeting> {
  const { data, error } = await supabase
    .from("company_meetings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new DatabaseError('Error al actualizar reunión', { supabaseError: error, table: 'company_meetings', id });
  return data as unknown as CompanyMeeting;
}

export async function deleteMeeting(id: string): Promise<void> {
  // First, get all documents to delete from storage
  const { data: docs } = await supabase
    .from("company_meeting_documents")
    .select("storage_path")
    .eq("meeting_id", id);

  // Delete documents from storage
  if (docs && docs.length > 0) {
    const paths = docs.map(d => d.storage_path);
    await supabase.storage.from("mandato-documentos").remove(paths);
  }

  // Delete the meeting (cascade will delete document records)
  const { error } = await supabase
    .from("company_meetings")
    .delete()
    .eq("id", id);

  if (error) throw new DatabaseError('Error al eliminar reunión', { supabaseError: error, table: 'company_meetings', id });
}

// ============================================
// Meeting Documents Operations
// ============================================

export async function fetchMeetingDocuments(meetingId: string): Promise<MeetingDocument[]> {
  const { data, error } = await supabase
    .from("company_meeting_documents")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("uploaded_at", { ascending: false });

  if (error) throw new DatabaseError('Error al obtener documentos de reunión', { supabaseError: error, table: 'company_meeting_documents' });
  return data || [];
}

export async function uploadMeetingDocument(
  meetingId: string,
  companyId: string,
  file: File
): Promise<MeetingDocument> {
  const { data: session } = await supabase.auth.getSession();
  
  // Create unique path: companies/{company_id}/meetings/{meeting_id}/{timestamp}_{filename}
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `companies/${companyId}/meetings/${meetingId}/${timestamp}_${safeName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("mandato-documentos")
    .upload(storagePath, file);

  if (uploadError) throw new DatabaseError('Error al subir documento', { supabaseError: uploadError, table: 'storage' });

  // Create document record
  const { data, error } = await supabase
    .from("company_meeting_documents")
    .insert({
      meeting_id: meetingId,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      uploaded_by: session?.session?.user?.id || null,
    })
    .select()
    .single();

  if (error) {
    // Rollback: delete uploaded file
    await supabase.storage.from("mandato-documentos").remove([storagePath]);
    throw new DatabaseError('Error al registrar documento', { supabaseError: error, table: 'company_meeting_documents' });
  }

  return data;
}

export async function deleteMeetingDocument(docId: string, storagePath: string): Promise<void> {
  // Delete from storage first
  const { error: storageError } = await supabase.storage
    .from("mandato-documentos")
    .remove([storagePath]);

  // Continue to delete the record even if storage delete fails

  // Delete the document record
  const { error } = await supabase
    .from("company_meeting_documents")
    .delete()
    .eq("id", docId);

  if (error) throw new DatabaseError('Error al eliminar documento de reunión', { supabaseError: error, table: 'company_meeting_documents' });
}

export async function downloadMeetingDocument(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from("mandato-documentos")
    .download(storagePath);

  if (error) throw new DatabaseError('Error al descargar documento', { supabaseError: error, table: 'storage' });
  return data;
}
