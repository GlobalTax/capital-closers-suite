import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistTemplateManager } from "@/components/templates/ChecklistTemplateManager";

const PlantillasChecklist = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plantillas Checklist</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las plantillas globales de checklist para mandatos Sell-Side y Buy-Side.
        </p>
      </div>

      <Tabs defaultValue="venta" className="w-full">
        <TabsList>
          <TabsTrigger value="venta">Checklist M&A – Sell-Side</TabsTrigger>
          <TabsTrigger value="compra">Checklist M&A – Buy-Side</TabsTrigger>
        </TabsList>
        <TabsContent value="venta">
          <ChecklistTemplateManager tipo="venta" />
        </TabsContent>
        <TabsContent value="compra">
          <ChecklistTemplateManager tipo="compra" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlantillasChecklist;
