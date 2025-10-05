import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, validateFile } from "@/lib/file-utils";
import { useAuth } from "@/hooks/useAuth";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, description?: string, userId?: string) => Promise<void>;
  uploading?: boolean;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  onUpload,
  uploading = false
}: FileUploadDialogProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      try {
        validateFile(file, 10);
        setSelectedFile(file);
        setValidationError(null);
      } catch (error: any) {
        setValidationError(error.message);
        setSelectedFile(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'application/zip': ['.zip'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    }
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile, description || undefined, user?.id);
      
      // Reset form
      setSelectedFile(null);
      setDescription("");
      setValidationError(null);
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setDescription("");
    setValidationError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjuntar archivo</DialogTitle>
          <DialogDescription>
            Sube un archivo relacionado con esta tarea (máx. 10MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${validationError ? 'border-destructive' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {selectedFile ? (
              <div className="space-y-2">
                <FileIcon className="w-12 h-12 mx-auto text-primary" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setValidationError(null);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Quitar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm">
                  {isDragActive
                    ? "Suelta el archivo aquí..."
                    : "Arrastra un archivo o haz clic para seleccionar"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, Excel, PowerPoint, Imágenes, ZIP (máx. 10MB)
                </p>
              </div>
            )}
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Añade una breve descripción del archivo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Subiendo archivo...
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading || !!validationError}
          >
            {uploading ? "Subiendo..." : "Subir archivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
