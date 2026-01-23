import { Lock, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PricingMethodology } from "@/types/pricing";

interface MethodologySelectorProps {
  value: PricingMethodology;
  onChange: (value: PricingMethodology) => void;
}

export function MethodologySelector({ value, onChange }: MethodologySelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('locked_box')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
          value === 'locked_box'
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background border-border hover:bg-muted"
        )}
      >
        <Lock className="h-4 w-4" />
        <span className="font-medium">Locked Box</span>
      </button>
      <button
        onClick={() => onChange('completion_accounts')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
          value === 'completion_accounts'
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background border-border hover:bg-muted"
        )}
      >
        <FileCheck className="h-4 w-4" />
        <span className="font-medium">Completion Accounts</span>
      </button>
    </div>
  );
}
