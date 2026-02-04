import { FileSignature } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeloCategorySection } from "@/components/modelos/ModeloCategorySection";
import type { ModeloCategory } from "@/types/documents";

const MODELO_TABS: { value: ModeloCategory; label: string }[] = [
  { value: 'Mandato_Compra', label: 'Mandatos de Compra' },
  { value: 'Mandato_Venta', label: 'Mandatos de Venta' },
  { value: 'NDA_Modelo', label: 'NDA' },
];

export default function Modelos() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSignature className="h-6 w-6" />
          Modelos de Documentos
        </h1>
        <p className="text-muted-foreground mt-1">
          Repositorio central de plantillas Word reutilizables para mandatos y NDAs
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="Mandato_Compra" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          {MODELO_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {MODELO_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <ModeloCategorySection category={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
