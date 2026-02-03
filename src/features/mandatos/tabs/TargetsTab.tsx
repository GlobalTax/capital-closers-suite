import { useState, useEffect } from "react";
import { EmpresasAsociadasCard } from "@/components/mandatos/EmpresasAsociadasCard";
import { NuevoTargetDrawer } from "@/components/targets/NuevoTargetDrawer";
import { AsociarEmpresaDialog } from "@/components/empresas/AsociarEmpresaDialog";
import { QuickAddTarget } from "@/components/targets/QuickAddTarget";
import { EnrichFromWebDrawer } from "@/components/targets/EnrichFromWebDrawer";
import { AIImportDrawer } from "@/components/importacion/AIImportDrawer";
import { TargetCard } from "@/components/targets/TargetCard";
import { NuevoContactoDrawer } from "@/components/contactos/NuevoContactoDrawer";
import { ImportFromLinkDrawer } from "@/components/contactos/ImportFromLinkDrawer";
import { AsociarContactoEmpresaDialog } from "@/components/contactos/AsociarContactoEmpresaDialog";
import { TargetsTabBuySide } from "./TargetsTabBuySide";
import { SearchFundsSection } from "@/components/targets/SearchFundsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Building2, Globe, Sparkles, Link2 } from "lucide-react";
import { fetchInteraccionesByMandatoTarget, getContactosByEmpresa } from "@/services/interacciones";
import { addEmpresaToMandato } from "@/services/mandatos";
import type { Interaccion } from "@/services/interacciones";
import type { Mandato, Contacto } from "@/types";

interface TargetsTabProps {
  mandato: Mandato;
  onRefresh: () => void;
  onEditMandato?: () => void;
}

interface EmpresaData {
  interacciones: Interaccion[];
  contactos: Contacto[];
  loadingInteracciones: boolean;
  loadingContactos: boolean;
}

export function TargetsTab({ mandato, onRefresh, onEditMandato }: TargetsTabProps) {
  // Si es mandato de compra, usar la vista Buy-Side especializada
  if (mandato.tipo === 'compra') {
    return <TargetsTabBuySide mandato={mandato} onRefresh={onRefresh} onEditMandato={onEditMandato} />;
  }

  // Vista original para mandatos de venta
  return <TargetsTabSellSide mandato={mandato} onRefresh={onRefresh} />;
}

// Componente interno para mandatos de venta (código original)
function TargetsTabSellSide({ mandato, onRefresh }: TargetsTabProps) {
  const [nuevoTargetOpen, setNuevoTargetOpen] = useState(false);
  const [asociarEmpresaOpen, setAsociarEmpresaOpen] = useState(false);
  const [enrichFromWebOpen, setEnrichFromWebOpen] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [enrichInitialName, setEnrichInitialName] = useState("");
  const [enrichInitialUrl, setEnrichInitialUrl] = useState("");
  
  // Nuevo contacto drawer
  const [nuevoContactoOpen, setNuevoContactoOpen] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null);
  
  // Link import drawer (Apollo/LinkedIn)
  const [linkImportOpen, setLinkImportOpen] = useState(false);
  const [linkSelectedEmpresaId, setLinkSelectedEmpresaId] = useState<string | null>(null);
  
  // Asociar contacto existente dialog
  const [asociarContactoOpen, setAsociarContactoOpen] = useState(false);
  const [asociarContactoEmpresaId, setAsociarContactoEmpresaId] = useState<string | null>(null);
  const [asociarContactoEmpresaNombre, setAsociarContactoEmpresaNombre] = useState<string>("");
  
  // Datos por empresa (interacciones + contactos)
  const [empresaData, setEmpresaData] = useState<Record<string, EmpresaData>>({});
  const targetEmpresas = mandato.empresas?.filter(e => e.rol === 'target') || [];
  const otrasEmpresas = mandato.empresas?.filter(e => e.rol !== 'target') || [];

  // Cargar datos de todas las empresas target
  useEffect(() => {
    const loadAllData = async () => {
      for (const me of targetEmpresas) {
        const empresaId = me.empresa?.id;
        if (!empresaId) continue;
        
        // Skip if already loaded
        if (empresaData[empresaId]?.interacciones?.length > 0 || 
            empresaData[empresaId]?.contactos?.length > 0) {
          continue;
        }

        // Initialize loading state
        setEmpresaData(prev => ({
          ...prev,
          [empresaId]: {
            interacciones: prev[empresaId]?.interacciones || [],
            contactos: prev[empresaId]?.contactos || [],
            loadingInteracciones: true,
            loadingContactos: true,
          }
        }));

        // Load interacciones (FILTRADO por mandato + empresa para aislamiento)
        try {
          const interacciones = await fetchInteraccionesByMandatoTarget(mandato.id, empresaId);
          setEmpresaData(prev => ({
            ...prev,
            [empresaId]: {
              ...prev[empresaId],
              interacciones,
              loadingInteracciones: false,
            }
          }));
        } catch (error) {
          console.error("Error cargando interacciones:", error);
          setEmpresaData(prev => ({
            ...prev,
            [empresaId]: {
              ...prev[empresaId],
              loadingInteracciones: false,
            }
          }));
        }

        // Load contactos
        try {
          const contactos = await getContactosByEmpresa(empresaId);
          setEmpresaData(prev => ({
            ...prev,
            [empresaId]: {
              ...prev[empresaId],
              contactos,
              loadingContactos: false,
            }
          }));
        } catch (error) {
          console.error("Error cargando contactos:", error);
          setEmpresaData(prev => ({
            ...prev,
            [empresaId]: {
              ...prev[empresaId],
              loadingContactos: false,
            }
          }));
        }
      }
    };

    if (targetEmpresas.length > 0) {
      loadAllData();
    }
  }, [targetEmpresas.map(e => e.empresa?.id).join(',')]);

  const handleEnrichFromWeb = (name: string, url?: string) => {
    setEnrichInitialName(name);
    setEnrichInitialUrl(url || "");
    setEnrichFromWebOpen(true);
  };

  const handleAIImportSuccess = async (data: { empresaId?: string; contactoId?: string }) => {
    if (data.empresaId) {
      try {
        await addEmpresaToMandato(mandato.id, data.empresaId, "target");
        onRefresh();
      } catch (error) {
        console.error("Error associating empresa:", error);
      }
    }
  };

  const handleAddContacto = (empresaId: string) => {
    setSelectedEmpresaId(empresaId);
    setNuevoContactoOpen(true);
  };

  const handleImportFromLink = (empresaId: string) => {
    setLinkSelectedEmpresaId(empresaId);
    setLinkImportOpen(true);
  };

  const handleAsociarExistente = (empresaId: string, empresaNombre?: string) => {
    setAsociarContactoEmpresaId(empresaId);
    setAsociarContactoEmpresaNombre(empresaNombre || "");
    setAsociarContactoOpen(true);
  };

  const handleAsociarContactoSuccess = () => {
    // Reload contactos for the empresa
    if (asociarContactoEmpresaId) {
      setEmpresaData(prev => ({
        ...prev,
        [asociarContactoEmpresaId]: {
          ...prev[asociarContactoEmpresaId],
          loadingContactos: true,
        }
      }));

      getContactosByEmpresa(asociarContactoEmpresaId)
        .then(contactos => {
          setEmpresaData(prev => ({
            ...prev,
            [asociarContactoEmpresaId!]: {
              ...prev[asociarContactoEmpresaId!],
              contactos,
              loadingContactos: false,
            }
          }));
        })
        .catch(error => {
          console.error("Error recargando contactos:", error);
        });
    }
  };

  const handleInteraccionUpdate = (empresaId: string) => {
    // Reload interacciones for this empresa
    setEmpresaData(prev => ({
      ...prev,
      [empresaId]: {
        ...prev[empresaId],
        loadingInteracciones: true,
      }
    }));

    fetchInteraccionesByMandatoTarget(mandato.id, empresaId)
      .then(interacciones => {
        setEmpresaData(prev => ({
          ...prev,
          [empresaId]: {
            ...prev[empresaId],
            interacciones,
            loadingInteracciones: false,
          }
        }));
      })
      .catch(error => {
        console.error("Error recargando interacciones:", error);
        setEmpresaData(prev => ({
          ...prev,
          [empresaId]: {
            ...prev[empresaId],
            loadingInteracciones: false,
          }
        }));
      });
  };

  const handleContactoSuccess = () => {
    // Reload contactos for selected empresa
    if (selectedEmpresaId) {
      setEmpresaData(prev => ({
        ...prev,
        [selectedEmpresaId]: {
          ...prev[selectedEmpresaId],
          loadingContactos: true,
        }
      }));

      getContactosByEmpresa(selectedEmpresaId)
        .then(contactos => {
          setEmpresaData(prev => ({
            ...prev,
            [selectedEmpresaId!]: {
              ...prev[selectedEmpresaId!],
              contactos,
              loadingContactos: false,
            }
          }));
        })
        .catch(error => {
          console.error("Error recargando contactos:", error);
        });
    }
  };

  const handleLinkSuccess = () => {
    // Reload contactos for link import selected empresa
    if (linkSelectedEmpresaId) {
      setEmpresaData(prev => ({
        ...prev,
        [linkSelectedEmpresaId]: {
          ...prev[linkSelectedEmpresaId],
          loadingContactos: true,
        }
      }));

      getContactosByEmpresa(linkSelectedEmpresaId)
        .then(contactos => {
          setEmpresaData(prev => ({
            ...prev,
            [linkSelectedEmpresaId!]: {
              ...prev[linkSelectedEmpresaId!],
              contactos,
              loadingContactos: false,
            }
          }));
        })
        .catch(error => {
          console.error("Error recargando contactos:", error);
        });
    }
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Empresas Target</h3>
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setLinkSelectedEmpresaId(null);
              setLinkImportOpen(true);
            }}
            title="Importar contactos desde Apollo.io o LinkedIn"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Link
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

      {/* Lista de empresas target con el nuevo TargetCard */}
      {targetEmpresas.length > 0 ? (
        <div className="space-y-4">
          {targetEmpresas.map((me) => {
            const empresa = me.empresa;
            if (!empresa) return null;
            
            const data = empresaData[empresa.id] || {
              interacciones: [],
              contactos: [],
              loadingInteracciones: false,
              loadingContactos: false,
            };

            return (
              <TargetCard
                key={me.id}
                empresa={empresa}
                interacciones={data.interacciones}
                contactos={data.contactos}
                isLoadingInteracciones={data.loadingInteracciones}
                isLoadingContactos={data.loadingContactos}
                mandatoId={mandato.id}
                onAddContacto={handleAddContacto}
                onImportFromLink={() => handleImportFromLink(empresa.id)}
                onInteraccionUpdate={() => handleInteraccionUpdate(empresa.id)}
                onAsociarExistente={() => handleAsociarExistente(empresa.id, empresa.nombre)}
              />
            );
          })}
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

      {/* Search Funds Section - solo para mandatos con potencial_searchfund */}
      {mandato.potencial_searchfund && (
        <SearchFundsSection mandato={mandato} />
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

      {/* Nuevo contacto drawer */}
      <NuevoContactoDrawer
        open={nuevoContactoOpen}
        onOpenChange={setNuevoContactoOpen}
        mandatoId={mandato.id}
        defaultEmpresaId={selectedEmpresaId || undefined}
        onSuccess={handleContactoSuccess}
      />

      {/* Link import drawer (Apollo/LinkedIn) */}
      <ImportFromLinkDrawer
        open={linkImportOpen}
        onOpenChange={setLinkImportOpen}
        mandatoId={mandato.id}
        onSuccess={handleLinkSuccess}
      />

      {/* Asociar contacto existente dialog */}
      <AsociarContactoEmpresaDialog
        open={asociarContactoOpen}
        onOpenChange={setAsociarContactoOpen}
        empresaId={asociarContactoEmpresaId || ""}
        empresaNombre={asociarContactoEmpresaNombre}
        onSuccess={handleAsociarContactoSuccess}
      />
    </div>
  );
}
