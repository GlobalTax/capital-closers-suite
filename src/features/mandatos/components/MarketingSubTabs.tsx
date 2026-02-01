import { TeaserManager } from "./TeaserManager";

interface MarketingSubTabsProps {
  mandatoId: string;
  mandatoNombre?: string;
  onRefresh?: () => void;
}

export function MarketingSubTabs({ mandatoId, mandatoNombre, onRefresh }: MarketingSubTabsProps) {
  return (
    <div className="space-y-4">
      <TeaserManager
        mandatoId={mandatoId}
        mandatoNombre={mandatoNombre}
        onRefresh={onRefresh}
      />
    </div>
  );
}
