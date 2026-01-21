import { cn } from "@/lib/utils";

interface LeadCanalCellProps {
  canal?: string;
  leadForm?: string;
}

const CANAL_COLORS: Record<string, string> = {
  "Meta Ads": "bg-blue-500",
  "Google Ads": "bg-red-500",
  "LinkedIn": "bg-sky-600",
  "Referido": "bg-amber-500",
  "Web orgánico": "bg-green-500",
  "Email": "bg-purple-500",
  "default": "bg-muted-foreground",
};

export function LeadCanalCell({ canal, leadForm }: LeadCanalCellProps) {
  if (!canal && !leadForm) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const colorClass = canal ? (CANAL_COLORS[canal] || CANAL_COLORS.default) : CANAL_COLORS.default;

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      {canal && (
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", colorClass)} />
          <span className="text-xs font-medium truncate">{canal}</span>
        </div>
      )}
      {leadForm && (
        <span className="text-[11px] text-muted-foreground truncate pl-3.5">
          {leadForm}
        </span>
      )}
    </div>
  );
}
