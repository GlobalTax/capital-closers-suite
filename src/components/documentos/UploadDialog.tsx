import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, File, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { uploadFile } from "@/services/uploads";
import type { DocumentoTipo } from "@/types";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tipo, setTipo] = useState<DocumentoTipo>("Otro");
  const [descripcion, setDescripcion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    onDrop: (acceptedFiles) => {
      setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((file) => {
        if (file.file.size > MAX_FILE_SIZE) {
          toast.error(`${file.file.name} excede el tamaño máximo de 20MB`);
        } else {
          toast.error(`${file.file.name} no es un tipo de archivo válido`);
        }
      });
    },
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Selecciona al menos un archivo");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        await uploadFile(file, tipo, descripcion, (fileProgress) => {
          const totalProgress = ((i / totalFiles) * 100) + (fileProgress / totalFiles);
          setProgress(totalProgress);
        });
      }

      toast.success(`${totalFiles} archivo(s) subido(s) correctamente`);
      setSelectedFiles([]);
      setTipo("Otro");
      setDescripcion("");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Error al subir archivos");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-primary" />;
    if (file.type === 'application/pdf') return <FileText className="w-8 h-8 text-destructive" />;
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Documentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
              transition-all duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base font-medium text-foreground mb-1">
              {isDragActive ? '¡Suelta los archivos aquí!' : 'Arrastra archivos o haz clic para seleccionar'}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, DOCX, XLSX, PNG, JPG, WEBP (máx. 20MB)
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Tipo de Documento
              </label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as DocumentoTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contrato">Contrato</SelectItem>
                  <SelectItem value="NDA">NDA</SelectItem>
                  <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                  <SelectItem value="Financiero">Financiero</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Descripción (opcional)
              </label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Añade una descripción..."
                className="resize-none"
                rows={1}
              />
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Archivos seleccionados ({selectedFiles.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subiendo...</span>
                <span className="font-medium text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? 'Subiendo...' : `Subir ${selectedFiles.length} archivo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
