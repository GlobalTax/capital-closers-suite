import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Megaphone, FileSpreadsheet } from "lucide-react";
import { TeaserManager } from "./TeaserManager";
import { DealSheetEditor } from "./dealsheet";

interface MarketingSubTabsProps {
  mandatoId: string;
  mandatoNombre?: string;
  onRefresh?: () => void;
}

export function MarketingSubTabs({ mandatoId, mandatoNombre, onRefresh }: MarketingSubTabsProps) {
  const [activeSubTab, setActiveSubTab] = useState('teaser');

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="teaser" className="gap-1.5">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Teaser</span>
          </TabsTrigger>
          <TabsTrigger value="dealsheet" className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Deal Sheet</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teaser" className="mt-6">
          <TeaserManager
            mandatoId={mandatoId}
            mandatoNombre={mandatoNombre}
            onRefresh={onRefresh}
          />
        </TabsContent>

        <TabsContent value="dealsheet" className="mt-6">
          <DealSheetEditor
            mandatoId={mandatoId}
            mandatoNombre={mandatoNombre}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
