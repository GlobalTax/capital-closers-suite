import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image as ImageIcon, File, FolderOpen, History, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { DocumentFolder, DocumentWithVersion } from "@/types/documents";

interface UploadToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: DocumentFolder[];
  selectedFolderId?: string | null;
  existingDocument?: DocumentWithVersion; // Para subir nueva versión
  onUpload: (params: {
    file: File;
    folderId: string | null;
    tipo: string;
    descripcion?: string;
    isNewVersion?: boolean;
    parentDocumentId?: string;
  }) => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number;
}

const ALLOWED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const DOCUMENT_TYPES = [
  "Contrato",
  "NDA", 
  "Due Diligence",
  "Financiero",
  "Legal",
  "Otro",
];

export function UploadToFolderDialog({
  open,
  onOpenChange,
  folders,
  selectedFolderId,
  existingDocument,
  onUpload,
  isUploading,
  uploadProgress,
}: UploadToFolderDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [folderId, setFolderId] = useState<string | null>(selectedFolderId || null);
  const [tipo, setTipo] = useState<string>("Otro");
  const [descripcion, setDescripcion] = useState("");
  const [mode, setMode] = useState<'new' | 'version'>(existingDocument ? 'version' : 'new');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (!file) return;

    await onUpload({
      file,
      folderId: mode === 'version' && existingDocument ? existingDocument.folder_id || null : folderId,
      tipo: mode === 'version' && existingDocument ? existingDocument.tipo : tipo,
      descripcion: descripcion || undefined,
      isNewVersion: mode === 'version',
      parentDocumentId: mode === 'version' ? existingDocument?.id : undefined,
    });

    // Reset
    setFile(null);
    setDescripcion("");
    onOpenChange(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type === "application/pdf") return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Construir lista plana de carpetas con indentación
  const flatFolders = folders.flatMap(folder => {
    const result = [{ ...folder, indent: 0 }];
    // Añadir subcarpetas si existen (asumiendo que están en children)
    return result;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5" />
            {existingDocument ? 'Subir Documento' : 'Subir Documento'}
          </DialogTitle>
        </DialogHeader>

        {existingDocument && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'new' | 'version')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="version" className="gap-2">
                <History className="w-4 h-4" />
                Nueva versión
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <Upload className="w-4 h-4" />
                Documento nuevo
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              "hover:border-primary hover:bg-accent/50",
              isDragActive && "border-primary bg-accent/50",
              file && "border-primary bg-primary/5"
            )}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="flex items-center gap-4 justify-center">
                {getFileIcon(file.type)}
                <div className="text-left">
                  <p className="font-medium truncate max-w-[250px]">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Arrastra un archivo o haz clic para seleccionar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, DOCX, XLSX, imágenes (máx. 20MB)
                </p>
              </>
            )}
          </div>

          {/* Carpeta destino (solo para documento nuevo) */}
          {mode === 'new' && (
            <div className="space-y-2">
              <Label>Carpeta destino</Label>
              <Select value={folderId || 'root'} onValueChange={(v) => setFolderId(v === 'root' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar carpeta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Sin carpeta
                    </div>
                  </SelectItem>
                  {flatFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2" style={{ marginLeft: folder.indent * 12 }}>
                        <FolderOpen className="w-4 h-4" />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo de documento (solo para nuevo) */}
          {mode === 'new' && (
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={mode === 'version' ? 'Notas sobre esta versión...' : 'Breve descripción...'}
            />
          </div>

          {/* Progress */}
          {isUploading && uploadProgress !== undefined && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Subiendo... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isUploading}>
            {isUploading ? 'Subiendo...' : mode === 'version' ? 'Subir versión' : 'Subir documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
