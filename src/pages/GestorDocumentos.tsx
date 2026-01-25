import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Shield, 
  Search, 
  Mail, 
  Download, 
  Eye, 
  Clock,
  Building2,
  Calendar,
  Filter,
  Plus,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DocumentGeneratorPanel } from "@/components/documentos/DocumentGeneratorPanel";
import { DocumentTemplatesManager } from "@/components/documentos/DocumentTemplatesManager";
import { toast } from "@/hooks/use-toast";

interface GeneratedDocument {
  id: string;
  file_name: string;
  tipo: string;
  created_at: string;
  file_size_bytes: number;
  storage_path: string;
  mandato_id: string | null;
  mandato?: {
    empresa_principal?: {
      nombre: string;
    };
  };
}

const DOCUMENT_TYPE_ICONS: Record<string, typeof Shield> = {
  NDA: Shield,
  Mandato: FileText,
  LOI: Mail,
  default: FileText,
};

const DOCUMENT_TYPE_COLORS: Record<string, string> = {
  NDA: "bg-purple-500/10 text-purple-500",
  Mandato: "bg-blue-500/10 text-blue-500",
  LOI: "bg-amber-500/10 text-amber-500",
  default: "bg-muted text-muted-foreground",
};

export default function GestorDocumentos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "generar");
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Get mandato context from URL params
  const mandatoId = searchParams.get("mandatoId");
  const empresaNombre = searchParams.get("empresa");

  useEffect(() => {
    if (activeTab === "historial") {
      loadGeneratedDocuments();
    }
  }, [activeTab]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const loadGeneratedDocuments = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("documentos")
        .select(`
          id,
          file_name,
          tipo,
          created_at,
          file_size_bytes,
          storage_path,
          mandato_id,
          mandatos:mandato_id (
            empresa_principal:empresa_principal_id (
              nombre
            )
          )
        `)
        .in("tipo", ["NDA", "Mandato", "LOI"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const formatted = (data || []).map((doc: any) => ({
        ...doc,
        mandato: doc.mandatos ? {
          empresa_principal: doc.mandatos.empresa_principal
        } : undefined
      }));

      setGeneratedDocs(formatted);
    } catch (error) {
      console.error("Error loading generated documents:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos generados",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDownloadDocument = async (doc: GeneratedDocument) => {
    try {
      // Usar Edge Function con service_role para bypass RLS
      const { data, error } = await supabase.functions.invoke('download-document', {
        body: { filePath: doc.storage_path, bucket: 'mandato-documentos', expiresIn: 600 }
      });

      if (error) {
        console.error('[GestorDocumentos] Edge function error:', error);
        if (error.message?.includes('403') || error.message?.includes('Acceso denegado')) {
          toast({
            title: "Sin permisos",
            description: "No tienes permisos para descargar este documento",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error('No se pudo obtener URL firmada');
      }

      // Descargar usando la signed URL
      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error('Error al descargar archivo');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
    }
  };

  const handleViewDocument = async (doc: GeneratedDocument) => {
    try {
      // Usar Edge Function con service_role para bypass RLS
      const { data, error } = await supabase.functions.invoke('download-document', {
        body: { filePath: doc.storage_path, bucket: 'mandato-documentos', expiresIn: 600 }
      });

      if (error) {
        console.error('[GestorDocumentos] Edge function error:', error);
        if (error.message?.includes('403') || error.message?.includes('Acceso denegado')) {
          toast({
            title: "Sin permisos",
            description: "No tienes permisos para ver este documento",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error('No se pudo obtener URL firmada');
      }

      // Abrir en nueva pestaña
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error viewing document:", error);
      toast({
        title: "Error",
        description: "No se pudo abrir el documento",
        variant: "destructive",
      });
    }
  };

  const filteredDocs = generatedDocs.filter((doc) => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.mandato?.empresa_principal?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestor de Documentos"
        description="Genera, gestiona y organiza documentos legales y corporativos"
      />

      {mandatoId && empresaNombre && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm">
              Contexto: <strong>{empresaNombre}</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/gestor-documentos")}
            >
              Limpiar contexto
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="generar" className="gap-2">
            <Plus className="h-4 w-4" />
            Generar
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <Clock className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="plantillas" className="gap-2">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generar" className="mt-6">
          <DocumentGeneratorPanel 
            mandatoId={mandatoId || undefined}
            empresaNombre={empresaNombre || undefined}
          />
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Documentos Generados</CardTitle>
                  <CardDescription>
                    Historial de todos los documentos generados desde el sistema
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="NDA">NDA</option>
                    <option value="Mandato">Mandato</option>
                    <option value="LOI">LOI</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No hay documentos generados</p>
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("generar")}
                    className="mt-2"
                  >
                    Genera tu primer documento
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredDocs.map((doc) => {
                      const Icon = DOCUMENT_TYPE_ICONS[doc.tipo] || DOCUMENT_TYPE_ICONS.default;
                      const colorClass = DOCUMENT_TYPE_COLORS[doc.tipo] || DOCUMENT_TYPE_COLORS.default;

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(doc.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                </span>
                                <span>{formatFileSize(doc.file_size_bytes)}</span>
                                {doc.mandato?.empresa_principal?.nombre && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {doc.mandato.empresa_principal.nombre}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={colorClass}>
                              {doc.tipo}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDocument(doc)}
                              title="Ver documento"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadDocument(doc)}
                              title="Descargar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plantillas" className="mt-6">
          <DocumentTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
