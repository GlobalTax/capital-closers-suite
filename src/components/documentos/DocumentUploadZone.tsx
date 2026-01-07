import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useDocumentStorage, DocumentoTipo } from "@/hooks/useDocumentStorage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadZoneProps {
  mandatoId: string;
  onSuccess?: () => void;
}

type FileWithPreview = File & { preview?: string };

const ALLOWED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"]
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function DocumentUploadZone({ mandatoId, onSuccess }: DocumentUploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [tipo, setTipo] = useState<DocumentoTipo>("Otro");
  const [descripcion, setDescripcion] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const { uploadFile, uploadProgress } = useDocumentStorage();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map(file => {
      const fileWithPreview = file as FileWithPreview;
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      
      return fileWithPreview;
    });
    
    setSelectedFiles(prev => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejections) => {
      rejections.forEach(rejection => {
        if (rejection.file.size > MAX_FILE_SIZE) {
          toast.error(`${rejection.file.name} excede el tamaño máximo de 20MB`);
        } else {
          toast.error(`${rejection.file.name} no es un tipo de archivo permitido`);
        }
      });
    }
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      
      // Revoke preview URL
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Selecciona al menos un archivo");
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Upload files sequentially to avoid overwhelming the system
      for (const file of selectedFiles) {
        try {
          await uploadFile(file, mandatoId, tipo, descripcion || undefined);
          successCount++;
          
          // Revoke preview URL after successful upload
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} archivo(s) subido(s) correctamente`);
        setSelectedFiles([]);
        setTipo("Otro");
        setDescripcion("");
        onSuccess?.();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} archivo(s) fallaron al subir`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type === "application/pdf") return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6 p-6 border border-border rounded-2xl bg-card">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
          "hover:border-primary hover:bg-accent/50",
          isDragActive && "border-primary bg-accent/50 scale-[1.02]",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">Suelta los archivos aquí...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, DOCX, XLSX, PNG, JPG, WEBP (máx. 20MB)
            </p>
          </>
        )}
      </div>

      {/* File Metadata */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Documento</Label>
              <Select value={tipo} onValueChange={(value) => setTipo(value as DocumentoTipo)}>
                <SelectTrigger id="tipo">
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

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción del documento"
              />
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <Label>Archivos seleccionados ({selectedFiles.length})</Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const fileId = `${file.name}-${Date.now()}`;
              const progress = uploadProgress[fileId];

              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border border-border rounded-xl bg-background/50"
                >
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    getFileIcon(file.type)
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {progress && progress.status === "uploading" && (
                      <div className="mt-2">
                        <Progress value={progress.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Subiendo... {progress.progress}%
                        </p>
                      </div>
                    )}

                    {progress && progress.status === "error" && (
                      <p className="text-xs text-destructive mt-1">
                        Error: {progress.error}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
          size="lg"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Subiendo..." : `Subir ${selectedFiles.length} archivo(s)`}
        </Button>
      )}
    </div>
  );
}
