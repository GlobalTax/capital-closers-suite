import { useState, useEffect } from "react";
import { EmpresasAsociadasCard } from "@/components/mandatos/EmpresasAsociadasCard";
import { NuevoTargetDrawer } from "@/components/targets/NuevoTargetDrawer";
import { AsociarEmpresaDialog } from "@/components/empresas/AsociarEmpresaDialog";
import { InteraccionTimeline } from "@/components/targets/InteraccionTimeline";
import { QuickAddTarget } from "@/components/targets/QuickAddTarget";
import { EnrichFromWebDrawer } from "@/components/targets/EnrichFromWebDrawer";
import { AIImportDrawer } from "@/components/importacion/AIImportDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, MessageSquare, Building2, Globe, Sparkles } from "lucide-react";
import { fetchInteraccionesByEmpresa } from "@/services/interacciones";
import { addEmpresaToMandato } from "@/services/mandatos";
import type { Interaccion } from "@/services/interacciones";
import type { Mandato } from "@/types";

interface TargetsTabProps {
  mandato: Mandato;
  onRefresh: () => void;
}

interface EmpresaInteracciones {
  [empresaId: string]: {
    interacciones: Interaccion[];
    loading: boolean;
  };
}

export function TargetsTab({ mandato, onRefresh }: TargetsTabProps) {
  const [nuevoTargetOpen, setNuevoTargetOpen] = useState(false);
  const [asociarEmpresaOpen, setAsociarEmpresaOpen] = useState(false);
  const [enrichFromWebOpen, setEnrichFromWebOpen] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [enrichInitialName, setEnrichInitialName] = useState("");
  const [enrichInitialUrl, setEnrichInitialUrl] = useState("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null);
  const [interaccionDialogOpen, setInteraccionDialogOpen] = useState(false);
  const [empresaInteracciones, setEmpresaInteracciones] = useState<EmpresaInteracciones>({});
  const [expandedEmpresa, setExpandedEmpresa] = useState<string | null>(null);

  // Cargar interacciones de la empresa expandida
  useEffect(() => {
    if (!expandedEmpresa) return;
    
    const loadInteracciones = async () => {
      setEmpresaInteracciones(prev => ({
        ...prev,
        [expandedEmpresa]: { ...prev[expandedEmpresa], loading: true, interacciones: prev[expandedEmpresa]?.interacciones || [] }
      }));

      try {
        const data = await fetchInteraccionesByEmpresa(expandedEmpresa);
        setEmpresaInteracciones(prev => ({
          ...prev,
          [expandedEmpresa]: { interacciones: data, loading: false }
        }));
      } catch (error) {
        console.error("Error cargando interacciones:", error);
        setEmpresaInteracciones(prev => ({
          ...prev,
          [expandedEmpresa]: { interacciones: [], loading: false }
        }));
      }
    };

    loadInteracciones();
  }, [expandedEmpresa]);

  const handleOpenInteraccionDialog = (empresaId: string) => {
    setSelectedEmpresaId(empresaId);
    setInteraccionDialogOpen(true);
  };

  const handleInteraccionSuccess = () => {
    // Recargar interacciones de la empresa seleccionada
    if (selectedEmpresaId) {
      setExpandedEmpresa(null);
      setTimeout(() => setExpandedEmpresa(selectedEmpresaId), 100);
    }
  };

  const toggleEmpresaExpanded = (empresaId: string) => {
    setExpandedEmpresa(prev => prev === empresaId ? null : empresaId);
  };

  const handleEnrichFromWeb = (name: string, url?: string) => {
    setEnrichInitialName(name);
    setEnrichInitialUrl(url || "");
    setEnrichFromWebOpen(true);
  };

  const handleAIImportSuccess = async (data: { empresaId?: string; contactoId?: string }) => {
    // If empresa was created, associate it as target
    if (data.empresaId) {
      try {
        await addEmpresaToMandato(mandato.id, data.empresaId, "target");
        onRefresh();
      } catch (error) {
        console.error("Error associating empresa:", error);
      }
    }
  };

  const targetEmpresas = mandato.empresas?.filter(e => e.rol === 'target') || [];
  const otrasEmpresas = mandato.empresas?.filter(e => e.rol !== 'target') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Empresas Target</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona las empresas objetivo asociadas a este mandato
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAiImportOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            IA Imagen
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setEnrichInitialName("");
              setEnrichInitialUrl("");
              setEnrichFromWebOpen(true);
            }}
          >
            <Globe className="w-4 h-4 mr-2" />
            IA Web
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAsociarEmpresaOpen(true)}>
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
          <Button size="sm" onClick={() => setNuevoTargetOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Completo
          </Button>
        </div>
      </div>

      {/* Quick Add */}
      <QuickAddTarget
        mandatoId={mandato.id}
        onSuccess={onRefresh}
        onEnrichFromWeb={handleEnrichFromWeb}
      />

      {/* Lista de empresas target con interacciones */}
      {targetEmpresas.length > 0 ? (
        <div className="space-y-4">
          {targetEmpresas.map((me) => (
            <Card key={me.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{me.empresa?.nombre}</CardTitle>
                      {me.empresa?.sector && (
                        <p className="text-xs text-muted-foreground">{me.empresa.sector}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {empresaInteracciones[me.empresa?.id || '']?.interacciones?.length || 0} interacciones
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => me.empresa && handleOpenInteraccionDialog(me.empresa.id)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Nueva
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => me.empresa && toggleEmpresaExpanded(me.empresa.id)}
                    >
                      {expandedEmpresa === me.empresa?.id ? "Ocultar" : "Ver Timeline"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedEmpresa === me.empresa?.id && (
                <CardContent className="pt-0">
                  <InteraccionTimeline
                    interacciones={empresaInteracciones[me.empresa?.id || '']?.interacciones || []}
                    empresaId={me.empresa?.id || ''}
                    mandatoId={mandato.id}
                    onUpdate={() => {
                      if (me.empresa) {
                        setExpandedEmpresa(null);
                        setTimeout(() => setExpandedEmpresa(me.empresa!.id), 100);
                      }
                    }}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No hay empresas target asociadas a este mandato
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Usa el Quick Add arriba para añadir rápidamente, o los botones para más opciones
            </p>
          </CardContent>
        </Card>
      )}

      {/* Otras empresas asociadas */}
      {otrasEmpresas.length > 0 && (
        <div className="pt-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Otras empresas asociadas</h4>
          <EmpresasAsociadasCard
            empresas={otrasEmpresas}
            onAddEmpresa={() => setAsociarEmpresaOpen(true)}
            mandatoId={mandato.id}
            onRefresh={onRefresh}
          />
        </div>
      )}

      {/* Drawers and Dialogs */}
      <NuevoTargetDrawer
        open={nuevoTargetOpen}
        onOpenChange={setNuevoTargetOpen}
        mandatoId={mandato.id}
        onSuccess={onRefresh}
      />

      <AsociarEmpresaDialog
        open={asociarEmpresaOpen}
        onOpenChange={setAsociarEmpresaOpen}
        mandatoId={mandato.id}
        onSuccess={onRefresh}
        defaultRol="target"
      />

      <EnrichFromWebDrawer
        open={enrichFromWebOpen}
        onOpenChange={setEnrichFromWebOpen}
        mandatoId={mandato.id}
        initialName={enrichInitialName}
        initialUrl={enrichInitialUrl}
        onSuccess={onRefresh}
      />

      <AIImportDrawer
        open={aiImportOpen}
        onOpenChange={setAiImportOpen}
        mandatoId={mandato.id}
        onSuccess={handleAIImportSuccess}
      />
    </div>
  );
}
