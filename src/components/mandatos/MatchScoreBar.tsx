import { cn } from "@/lib/utils";

interface MatchScoreBarProps {
  fitDimensions: {
    sector_fit: number;
    financial_fit: number;
    geographic_fit: number;
    strategic_fit: number;
  };
}

const dimensions = [
  { key: "sector_fit" as const, label: "Sector" },
  { key: "financial_fit" as const, label: "Financiero" },
  { key: "geographic_fit" as const, label: "Geográfico" },
  { key: "strategic_fit" as const, label: "Estratégico" },
];

function getColorClass(value: number) {
  if (value < 40) return "bg-destructive";
  if (value < 70) return "bg-yellow-500";
  return "bg-green-500";
}

export function MatchScoreBar({ fitDimensions }: MatchScoreBarProps) {
  return (
    <div className="space-y-1.5">
      {dimensions.map(({ key, label }) => {
        const value = fitDimensions[key] ?? 0;
        return (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-muted-foreground shrink-0">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", getColorClass(value))}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="w-8 text-right font-medium">{value}%</span>
          </div>
        );
      })}
    </div>
  );
}
