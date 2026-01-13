import { useState } from "react";
import { Upload, FolderTree as FolderTreeIcon, FileText, History, Download, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FolderTree } from "@/components/documentos/FolderTree";
import { CreateFolderDialog, RenameFolderDialog } from "@/components/documentos/FolderDialogs";
import { UploadToFolderDialog } from "@/components/documentos/UploadToFolderDialog";
import { DocumentVersionHistory } from "@/components/documentos/DocumentVersionHistory";
import { TemplateLibrary } from "@/components/documentos/TemplateLibrary";
import { useDocumentFolders } from "@/hooks/useDocumentFolders";
import { useDocumentStorage } from "@/hooks/useDocumentStorage";
import { uploadDocumentToFolder, createDocumentVersion } from "@/services/documentFolders.service";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { DocumentWithVersion } from "@/types/documents";
import type { MandatoTipo } from "@/types";

interface DocumentosTabProps {
  mandatoId: string;
  mandatoTipo?: MandatoTipo;
  documentos?: any[];
  onRefresh: () => void;
}

export function DocumentosTab({ mandatoId, mandatoTipo, onRefresh }: DocumentosTabProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [parentFolderForCreate, setParentFolderForCreate] = useState<string | undefined>();
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<{ id: string; name: string } | null>(null);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<DocumentWithVersion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithVersion | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { folders, documents, folderTree, unfiledDocuments, isLoading, createFolder, renameFolder, deleteFolder, refetch } = useDocumentFolders(mandatoId);
  const { getSignedUrl, deleteDocument } = useDocumentStorage();

  // Filtrar documentos por carpeta seleccionada
  const filteredDocuments = selectedFolderId === null
    ? documents
    : selectedFolderId === 'unfiled'
    ? unfiledDocuments
    : documents.filter(d => d.folder_id === selectedFolderId);

  const handleUpload = async (params: {
    file: File;
    folderId: string | null;
    tipo: string;
    descripcion?: string;
    isNewVersion?: boolean;
    parentDocumentId?: string;
  }) => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const timestamp = Date.now();
      const sanitizedFileName = params.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${user?.id}/mandatos/${mandatoId}/${timestamp}_${sanitizedFileName}`;

      // Subir a storage
      const { error: uploadError } = await supabase.storage
        .from('mandato-documentos')
        .upload(storagePath, params.file);

      if (uploadError) throw uploadError;

      if (params.isNewVersion && params.parentDocumentId) {
        await createDocumentVersion(
          params.parentDocumentId,
          params.file.name,
          params.file.size,
          params.file.type,
          storagePath,
          user?.id
        );
        toast.success('Nueva versión subida');
      } else {
        await uploadDocumentToFolder(
          mandatoId,
          params.folderId,
          params.file.name,
          params.file.size,
          params.file.type,
          storagePath,
          params.tipo,
          params.descripcion,
          user?.id
        );
        toast.success('Documento subido');
      }

      refetch();
      onRefresh();
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Error al subir documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: DocumentWithVersion) => {
    setDownloadingId(doc.id);
    try {
      console.log('[Documentos] Descargando:', doc.file_name, 'Path:', doc.storage_path);
      
      if (!doc.storage_path) {
        toast.error('El documento no tiene ruta de almacenamiento');
        return;
      }

      const url = await getSignedUrl(doc.storage_path, { 
        id: doc.id, 
        nombre: doc.file_name 
      });
      
      if (url) {
        // Forzar descarga usando un enlace temporal
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Descargando ${doc.file_name}`);
      } else {
        toast.error('No se pudo generar el enlace de descarga');
      }
    } catch (error) {
      console.error('[Documentos] Error descarga:', error);
      toast.error('Error al descargar el documento');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    const success = await deleteDocument(documentToDelete.id, documentToDelete.storage_path);
    if (success) {
      refetch();
      onRefresh();
    }
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="documentos" className="w-full">
        <TabsList>
          <TabsTrigger value="documentos" className="gap-2">
            <FolderTreeIcon className="w-4 h-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="plantillas" className="gap-2">
            <FileText className="w-4 h-4" />
            Plantillas M&A
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Árbol de carpetas */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Carpetas</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <FolderTree
                  folders={folderTree}
                  unfiledDocuments={unfiledDocuments}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  onSelectDocument={(doc) => setVersionHistoryDoc(doc)}
                  onCreateFolder={(parentId) => {
                    setParentFolderForCreate(parentId);
                    setCreateFolderDialogOpen(true);
                  }}
                  onRenameFolder={(id, name) => {
                    setFolderToRename({ id, name });
                    setRenameFolderDialogOpen(true);
                  }}
                  onDeleteFolder={(id) => deleteFolder(id)}
                />
              </CardContent>
            </Card>

            {/* Lista de documentos */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {selectedFolderId === null ? 'Todos los documentos' : 
                   selectedFolderId === 'unfiled' ? 'Sin carpeta' :
                   folders.find(f => f.id === selectedFolderId)?.name || 'Documentos'}
                </h3>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir documento
                </Button>
              </div>

              {filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No hay documentos</p>
                    <p className="text-sm text-muted-foreground">Sube el primer documento a esta carpeta</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Versión</TableHead>
                        <TableHead>Tamaño</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              {doc.folder_name && <p className="text-xs text-muted-foreground">{doc.folder_name}</p>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{doc.tipo}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="secondary">v{doc.version}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatFileSize(doc.file_size_bytes)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(doc.created_at), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(doc)} disabled={downloadingId === doc.id}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Descargar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setVersionHistoryDoc(doc)}>
                                  <History className="w-4 h-4 mr-2" />
                                  Ver versiones
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setDocumentToDelete(doc); setDeleteDialogOpen(true); }} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plantillas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas M&A</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateLibrary tipoOperacion={mandatoTipo} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        onSubmit={(name) => {
          createFolder({ name, parentId: parentFolderForCreate });
          setCreateFolderDialogOpen(false);
        }}
        parentFolderName={parentFolderForCreate ? folders.find(f => f.id === parentFolderForCreate)?.name : undefined}
      />

      {folderToRename && (
        <RenameFolderDialog
          open={renameFolderDialogOpen}
          onOpenChange={setRenameFolderDialogOpen}
          onSubmit={(newName) => {
            renameFolder({ folderId: folderToRename.id, newName });
            setRenameFolderDialogOpen(false);
          }}
          currentName={folderToRename.name}
        />
      )}

      <UploadToFolderDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onUpload={handleUpload}
        isUploading={isUploading}
      />

      {versionHistoryDoc && (
        <DocumentVersionHistory
          document={versionHistoryDoc}
          open={!!versionHistoryDoc}
          onOpenChange={(open) => !open && setVersionHistoryDoc(null)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento "{documentToDelete?.file_name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
