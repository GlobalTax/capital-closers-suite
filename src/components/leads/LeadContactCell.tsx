import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeadContactCellProps {
  nombre: string;
  email: string;
  phone?: string;
  isPro?: boolean;
}

export function LeadContactCell({ nombre, email, phone, isPro }: LeadContactCellProps) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-sm truncate">{nombre}</span>
        {isPro && (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4">
            Pro
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="truncate">{email}</span>
        {phone && (
          <Phone className="w-3 h-3 text-muted-foreground/70 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
