import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  fetchMeetingsByCompany,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  fetchMeetingDocuments,
  uploadMeetingDocument,
  deleteMeetingDocument,
  downloadMeetingDocument,
  type CompanyMeeting,
  type MeetingDocument,
  type CreateMeetingData,
  type UpdateMeetingData,
} from "@/services/companyMeetings.service";

// ============================================
// Query Keys
// ============================================
const MEETINGS_KEY = "company-meetings";
const MEETING_DOCS_KEY = "meeting-documents";

// ============================================
// Meeting Queries
// ============================================

export function useCompanyMeetings(companyId: string | undefined) {
  return useQuery({
    queryKey: [MEETINGS_KEY, companyId],
    queryFn: () => fetchMeetingsByCompany(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useMeeting(id: string | undefined) {
  return useQuery({
    queryKey: [MEETINGS_KEY, "detail", id],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });
}

// ============================================
// Meeting Mutations
// ============================================

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMeetingData) => createMeeting(data),
    onSuccess: (newMeeting) => {
      // Invalidate the list for this company
      queryClient.invalidateQueries({ queryKey: [MEETINGS_KEY, newMeeting.company_id] });
      toast({
        title: "Reunión creada",
        description: "La reunión se ha registrado correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error("Error creating meeting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la reunión. Inténtalo de nuevo.",
      });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMeetingData }) => updateMeeting(id, data),
    onSuccess: (updatedMeeting) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: [MEETINGS_KEY, updatedMeeting.company_id] });
      queryClient.invalidateQueries({ queryKey: [MEETINGS_KEY, "detail", updatedMeeting.id] });
      toast({
        title: "Cambios guardados",
        description: "Las notas se han actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating meeting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios.",
      });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: string }) => deleteMeeting(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_KEY, variables.companyId] });
      toast({
        title: "Reunión eliminada",
        description: "La reunión y sus documentos han sido eliminados.",
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting meeting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la reunión.",
      });
    },
  });
}

// ============================================
// Document Queries
// ============================================

export function useMeetingDocuments(meetingId: string | undefined) {
  return useQuery({
    queryKey: [MEETING_DOCS_KEY, meetingId],
    queryFn: () => fetchMeetingDocuments(meetingId!),
    enabled: !!meetingId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================
// Document Mutations
// ============================================

export function useUploadMeetingDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, companyId, file }: { meetingId: string; companyId: string; file: File }) =>
      uploadMeetingDocument(meetingId, companyId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MEETING_DOCS_KEY, variables.meetingId] });
      toast({
        title: "Documento subido",
        description: "El documento se ha subido correctamente.",
      });
    },
    onError: (error: Error) => {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo subir el documento.",
      });
    },
  });
}

export function useDeleteMeetingDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ docId, storagePath, meetingId }: { docId: string; storagePath: string; meetingId: string }) =>
      deleteMeetingDocument(docId, storagePath),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MEETING_DOCS_KEY, variables.meetingId] });
      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado.",
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el documento.",
      });
    },
  });
}

export function useDownloadMeetingDocument() {
  return useMutation({
    mutationFn: ({ storagePath, fileName }: { storagePath: string; fileName: string }) =>
      downloadMeetingDocument(storagePath).then((blob) => {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }),
    onError: (error: Error) => {
      console.error("Error downloading document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo descargar el documento.",
      });
    },
  });
}
