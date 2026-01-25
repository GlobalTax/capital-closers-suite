import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Eye, 
  RotateCcw, 
  Clock, 
  User,
  FileText,
  Loader2
} from 'lucide-react';
import { useHelpVersions } from '@/hooks/useHelpEditor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HelpVersionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  onRestore: (content: string, title: string) => void;
}

export function HelpVersionsDialog({ 
  open, 
  onOpenChange, 
  sectionId,
  onRestore 
}: HelpVersionsDialogProps) {
  const { data: versions, isLoading } = useHelpVersions(sectionId);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const handleRestore = (content: string, title: string) => {
    onRestore(content, title);
  };

  const previewVersion = versions?.find(v => v.id === showPreview);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Versiones
          </DialogTitle>
          <DialogDescription>
            Visualiza y restaura versiones anteriores de esta sección
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !versions || versions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay versiones anteriores guardadas
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Las versiones se crean automáticamente al guardar cambios
            </p>
          </div>
        ) : showPreview ? (
          // Preview mode
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Versión {previewVersion?.version_number}</Badge>
                <span className="text-sm text-muted-foreground">
                  {previewVersion && format(new Date(previewVersion.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(null)}>
                Volver a lista
              </Button>
            </div>
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <MarkdownRenderer content={previewVersion?.content_md || ''} />
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button 
                onClick={() => {
                  if (previewVersion) {
                    handleRestore(previewVersion.content_md, previewVersion.title);
                  }
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar esta versión
              </Button>
            </div>
          </div>
        ) : (
          // List mode
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {versions.map((version, index) => (
                <Card 
                  key={version.id}
                  className={`transition-colors hover:bg-accent/50 ${
                    selectedVersion === version.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            v{version.version_number}
                          </Badge>
                          <span className="font-medium text-sm">
                            {version.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(version.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </span>
                          {version.change_summary && (
                            <span className="italic">
                              "{version.change_summary}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowPreview(version.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRestore(version.content_md, version.title)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
