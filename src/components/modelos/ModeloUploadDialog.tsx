import { useState, useRef } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadModelo } from "@/hooks/queries/useModelos";
import { validateWordFile, ALLOWED_EXTENSIONS } from "@/services/modelos.service";
import type { ModeloCategory } from "@/types/documents";
import { MODELO_CATEGORY_LABELS } from "@/types/documents";
import { toast } from "sonner";

interface ModeloUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ModeloCategory;
}

export function ModeloUploadDialog({ open, onOpenChange, category }: ModeloUploadDialogProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadModelo();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validation = validateWordFile(selectedFile);
    if (!validation.valid) {
      toast.error(validation.error);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    if (!file) {
      toast.error('Selecciona un archivo Word');
      return;
    }

    await uploadMutation.mutateAsync({ file, title, category });
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
    onOpenChange(false);
  };

  const removeFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir modelo - {MODELO_CATEGORY_LABELS[category]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del modelo *</Label>
            <Input
              id="title"
              placeholder="Ej: Mandato de Venta Estándar v2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploadMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Archivo Word *</Label>
            
            {file ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={removeFile}
                  disabled={uploadMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos: {ALLOWED_EXTENSIONS.join(', ')}
                </p>
              </div>
            )}
            
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending || !title.trim() || !file}>
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir modelo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
