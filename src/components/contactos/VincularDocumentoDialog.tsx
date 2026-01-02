import { useState, useMemo } from "react";
import { Search, FileText, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocumentos, useVincularDocumentoContacto } from "@/hooks/queries/useDocumentos";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VincularDocumentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactoId: string;
  documentosVinculados: string[];
}

export function VincularDocumentoDialog({
  open,
  onOpenChange,
  contactoId,
  documentosVinculados,
}: VincularDocumentoDialogProps) {
  const [search, setSearch] = useState("");
  const { data: documentos = [], isLoading } = useDocumentos();
  const vincularMutation = useVincularDocumentoContacto();

  const documentosDisponibles = useMemo(() => {
    return documentos
      .filter((doc) => !documentosVinculados.includes(doc.id))
      .filter((doc) =>
        doc.file_name?.toLowerCase().includes(search.toLowerCase())
      );
  }, [documentos, documentosVinculados, search]);

  const handleVincular = (documentoId: string) => {
    vincularMutation.mutate(
      { contactoId, documentoId },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSearch("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Cargando documentos...
              </p>
            ) : documentosDisponibles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {search
                  ? "No se encontraron documentos"
                  : "No hay documentos disponibles"}
              </p>
            ) : (
              <div className="space-y-2">
                {documentosDisponibles.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleVincular(doc.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tipo} •{" "}
                          {format(new Date(doc.created_at), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={vincularMutation.isPending}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
