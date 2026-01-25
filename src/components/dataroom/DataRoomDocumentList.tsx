// ============================================
// DATA ROOM DOCUMENT LIST
// Lista de documentos disponibles en el Data Room
// ============================================

import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File, 
  Eye, 
  Download, 
  RefreshCw,
  Loader2,
  FolderOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DataRoomDocument } from "@/hooks/useDataRoomAccess";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface DataRoomDocumentListProps {
  documents: DataRoomDocument[];
  downloadingId: string | null;
  onOpen: (id: string) => void;
  onDownload: (id: string, filename: string) => void;
  onRefresh: () => void;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return <FileText className="h-8 w-8 text-red-500" />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return <FileImage className="h-8 w-8 text-purple-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-8 w-8 text-blue-500" />;
    default:
      return <File className="h-8 w-8 text-muted-foreground" />;
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DataRoomDocumentList({
  documents,
  downloadingId,
  onOpen,
  onDownload,
  onRefresh,
}: DataRoomDocumentListProps) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin documentos disponibles</h3>
          <p className="text-muted-foreground mb-4">
            Aún no hay documentos en el Data Room para este proyecto.
          </p>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Documentos Disponibles
            </CardTitle>
            <CardDescription>
              {documents.length} documento{documents.length !== 1 ? 's' : ''} en el Data Room
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {documents.map((doc) => {
            const isDownloading = downloadingId === doc.id;
            const filename = doc.file_path.split('/').pop() || doc.nombre;
            
            return (
              <div 
                key={doc.id} 
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                {/* File icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(filename)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{doc.nombre}</h4>
                  {doc.descripcion && (
                    <p className="text-sm text-muted-foreground truncate">
                      {doc.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>·</span>
                    <span>
                      Añadido{' '}
                      {formatDistanceToNow(new Date(doc.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpen(doc.id)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver documento</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(doc.id, filename)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Descargar</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
