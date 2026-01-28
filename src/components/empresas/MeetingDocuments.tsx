import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  File,
  FileSpreadsheet,
  Image,
  Presentation,
} from "lucide-react";
import {
  useMeetingDocuments,
  useUploadMeetingDocument,
  useDeleteMeetingDocument,
  useDownloadMeetingDocument,
} from "@/hooks/queries/useCompanyMeetings";
import type { MeetingDocument } from "@/services/companyMeetings.service";

interface MeetingDocumentsProps {
  meetingId: string;
  companyId: string;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation;
  if (mimeType.includes("image")) return Image;
  return FileText;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MeetingDocuments({ meetingId, companyId }: MeetingDocumentsProps) {
  const [deleteDoc, setDeleteDoc] = useState<MeetingDocument | null>(null);

  const { data: documents = [], isLoading } = useMeetingDocuments(meetingId);
  const { mutate: uploadDocument, isPending: isUploading } = useUploadMeetingDocument();
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteMeetingDocument();
  const { mutate: downloadDocument } = useDownloadMeetingDocument();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        uploadDocument({ meetingId, companyId, file });
      });
    },
    [meetingId, companyId, uploadDocument]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    disabled: isUploading,
  });

  const handleDelete = () => {
    if (deleteDoc) {
      deleteDocument({
        docId: deleteDoc.id,
        storagePath: deleteDoc.storage_path,
        meetingId,
      });
      setDeleteDoc(null);
    }
  };

  const handleDownload = (doc: MeetingDocument) => {
    downloadDocument({ storagePath: doc.storage_path, fileName: doc.file_name });
  };

  const handlePreview = (doc: MeetingDocument) => {
    // For now, download works as preview for most file types
    // Could be enhanced with a proper viewer modal later
    downloadDocument({ storagePath: doc.storage_path, fileName: doc.file_name });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">
        Documentos ({documents.length})
      </Label>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => {
            const IconComponent = getFileIcon(doc.mime_type);
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.file_name}</p>
                    {doc.file_size_bytes && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size_bytes)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handlePreview(doc)}
                    title="Ver documento"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleDownload(doc)}
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteDoc(doc)}
                    title="Eliminar"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        {isUploading ? (
          <p className="text-sm text-muted-foreground">Subiendo documento...</p>
        ) : isDragActive ? (
          <p className="text-sm text-primary">Suelta el archivo aquí</p>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">
              Arrastra archivos o haz clic para subir
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Word, Excel, PowerPoint, imágenes (máx. 20MB)
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteDoc}
        onOpenChange={(open) => !open && setDeleteDoc(null)}
        titulo="¿Eliminar documento?"
        descripcion={`El documento "${deleteDoc?.file_name}" será eliminado permanentemente.`}
        onConfirmar={handleDelete}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
