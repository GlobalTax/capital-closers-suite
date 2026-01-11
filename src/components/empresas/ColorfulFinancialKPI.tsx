import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ColorfulFinancialKPIProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme: 'green' | 'purple' | 'blue' | 'yellow' | 'orange';
}

const colorSchemes = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-500',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-500',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-500',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'text-yellow-500',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: 'text-orange-500',
  },
};

export function ColorfulFinancialKPI({
  label,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
}: ColorfulFinancialKPIProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <Card className={cn("border-none shadow-sm", colors.bg)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </span>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
        <div>
          <p className={cn("text-3xl font-medium mb-1", colors.text)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
