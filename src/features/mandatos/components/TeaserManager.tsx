// ============================================
// TEASER MANAGER COMPONENT
// Gestión completa de teasers con versionado, idiomas y workflow
// ============================================

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Eye,
  Download,
  CheckCircle,
  Globe,
  RotateCcw,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useTeasersByLanguage, useTeaserFolder, useTeaserDownload } from "@/hooks/useTeaser";
import {
  useTeaserVersionHistory,
  useApproveTeaser,
  usePublishTeaser,
  useRevertTeaser,
  useDeleteDraftTeaser,
} from "@/hooks/useTeaserWorkflow";
import { upsertTeaser } from "@/services/teaser.service";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDocumentViewer, type DocumentInfo } from "@/components/shared/UnifiedDocumentViewer";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import type { IdiomaTeaser, TeaserStatus, DocumentWithVersion } from "@/types/documents";
import { TEASER_STATUS_LABELS, TEASER_STATUS_COLORS } from "@/types/documents";

interface TeaserManagerProps {
  mandatoId: string;
  mandatoNombre?: string;
  onRefresh?: () => void;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
};

export function TeaserManager({ mandatoId, mandatoNombre, onRefresh }: TeaserManagerProps) {
  const { session } = useAuth();
  const { isAdmin } = useSimpleAuth();
  const [activeLanguage, setActiveLanguage] = useState<IdiomaTeaser>('ES');
  const [uploading, setUploading] = useState<IdiomaTeaser | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentInfo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; path: string } | null>(null);

  // Queries
  const { data: teasers, refetch: refetchTeasers } = useTeasersByLanguage(mandatoId);
  const { data: versionHistory, isLoading: loadingHistory } = useTeaserVersionHistory(mandatoId, activeLanguage);
  const { ensureTeaserFolder } = useTeaserFolder(mandatoId);
  const { downloadTeaser } = useTeaserDownload();

  // Mutations
  const approveMutation = useApproveTeaser(mandatoId);
  const publishMutation = usePublishTeaser(mandatoId);
  const revertMutation = useRevertTeaser(mandatoId);
  const deleteMutation = useDeleteDraftTeaser(mandatoId);

  // Upload handler
  const handleUpload = useCallback(async (file: File, idioma: IdiomaTeaser) => {
    if (!session?.user?.id) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setUploading(idioma);

    try {
      // Ensure teaser folder exists
      const folder = await ensureTeaserFolder();
      if (!folder) {
        throw new Error('No se pudo crear la carpeta de teasers');
      }

      // Upload file directly to storage
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${mandatoId}/teaser/${idioma.toLowerCase()}_${timestamp}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mandato-documentos')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError || !uploadData) {
        throw new Error('Error al subir el archivo');
      }

      // Create document record
      await upsertTeaser({
        mandatoId,
        folderId: folder.id,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        storagePath: uploadData.path,
        uploadedBy: session.user.id,
        idioma,
      });

      toast.success(`Teaser ${idioma} subido como borrador`);
      refetchTeasers();
      onRefresh?.();
    } catch (error) {
      console.error('[TeaserManager] Upload error:', error);
      toast.error('Error al subir el teaser');
    } finally {
      setUploading(null);
    }
  }, [mandatoId, session, ensureTeaserFolder, refetchTeasers, onRefresh]);

  // Dropzone for each language
  const createDropzone = (idioma: IdiomaTeaser) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => files[0] && handleUpload(files[0], idioma),
      accept: ACCEPTED_TYPES,
      maxFiles: 1,
      disabled: uploading !== null,
    });
    return { getRootProps, getInputProps, isDragActive };
  };

  const esDropzone = createDropzone('ES');
  const enDropzone = createDropzone('EN');

  // Action handlers
  const handlePreview = (doc: DocumentWithVersion) => {
    setPreviewDoc({
      id: doc.id,
      file_name: doc.file_name,
      mime_type: doc.mime_type,
      storage_path: doc.storage_path,
      file_size_bytes: doc.file_size_bytes,
    });
  };

  const handleDownload = async (doc: DocumentWithVersion) => {
    await downloadTeaser(doc);
  };

  const handleApprove = (documentId: string) => {
    approveMutation.mutate(documentId);
  };

  const handlePublish = (documentId: string, idioma: IdiomaTeaser) => {
    publishMutation.mutate({ documentId, idioma });
  };

  const handleRevert = (documentId: string, idioma: IdiomaTeaser) => {
    revertMutation.mutate({ documentId, idioma });
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate({ documentId: deleteConfirm.id, storagePath: deleteConfirm.path });
      setDeleteConfirm(null);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: TeaserStatus }) => {
    const colors = TEASER_STATUS_COLORS[status];
    return (
      <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border}`}>
        {status === 'published' && <Globe className="w-3 h-3 mr-1" />}
        {status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
        {TEASER_STATUS_LABELS[status]}
      </Badge>
    );
  };

  // Published teaser card
  const PublishedCard = ({ teaser, idioma, label }: { teaser: DocumentWithVersion | null; idioma: IdiomaTeaser; label: string }) => {
    const dropzone = idioma === 'ES' ? esDropzone : enDropzone;
    const isUploading = uploading === idioma;

    return (
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-lg">{idioma === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teaser && teaser.status === 'published' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{teaser.file_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status="published" />
                <span>v{teaser.version}</span>
                {teaser.published_at && (
                  <span>· {format(new Date(teaser.published_at), 'dd MMM yyyy', { locale: es })}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handlePreview(teaser)}>
                  <Eye className="w-3 h-3 mr-1" />
                  Ver
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload(teaser)}>
                  <Download className="w-3 h-3 mr-1" />
                  Descargar
                </Button>
              </div>
            </div>
          ) : (
            <div
              {...dropzone.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${dropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            >
              <input {...dropzone.getInputProps()} />
              {isUploading ? (
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {dropzone.isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un PDF/PPTX o haz clic'}
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Filter history by active language
  const filteredHistory = versionHistory?.filter(v => v.idioma === activeLanguage) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Teaser Manager</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona versiones y publicación de teasers en español e inglés
          </p>
        </div>
      </div>

      {/* Published teasers overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PublishedCard 
          teaser={teasers?.es || null} 
          idioma="ES" 
          label="Español" 
        />
        <PublishedCard 
          teaser={teasers?.en || null} 
          idioma="EN" 
          label="English" 
        />
      </div>

      {/* Version history */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Historial de Versiones</CardTitle>
            <Tabs value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as IdiomaTeaser)}>
              <TabsList className="h-8">
                <TabsTrigger value="ES" className="text-xs px-3">🇪🇸 Español</TabsTrigger>
                <TabsTrigger value="EN" className="text-xs px-3">🇬🇧 English</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay versiones de teaser en {activeLanguage === 'ES' ? 'español' : 'inglés'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Versión</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead className="w-32">Estado</TableHead>
                  <TableHead className="w-32">Fecha</TableHead>
                  <TableHead className="w-48 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-mono">v{version.version}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{version.file_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={version.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(version.created_at), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Preview */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handlePreview(version as unknown as DocumentWithVersion)}
                          title="Vista previa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        {/* Approve - only for drafts, only admins */}
                        {isAdmin && version.status === 'draft' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-amber-600 hover:text-amber-700"
                            onClick={() => handleApprove(version.id)}
                            disabled={approveMutation.isPending}
                            title="Aprobar"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Publish - only for approved, only admins */}
                        {isAdmin && version.status === 'approved' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                            onClick={() => handlePublish(version.id, version.idioma)}
                            disabled={publishMutation.isPending}
                            title="Publicar"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Revert - for approved versions when not currently published */}
                        {isAdmin && version.status === 'approved' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleRevert(version.id, version.idioma)}
                            disabled={revertMutation.isPending}
                            title="Revertir a esta versión"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Delete - only for drafts */}
                        {isAdmin && version.status === 'draft' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm({ id: version.id, path: version.storage_path })}
                            title="Eliminar borrador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview dialog */}
      {previewDoc && (
        <UnifiedDocumentViewer
          document={previewDoc}
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          onDownload={() => previewDoc && handleDownload(previewDoc as unknown as DocumentWithVersion)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
