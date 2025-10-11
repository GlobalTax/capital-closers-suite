import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmpresaBadgeProps {
  variant: 'new' | 'sourced' | 'hot' | 'cold' | 'prioritaria';
  className?: string;
}

const badgeConfig = {
  new: {
    label: 'Nuevo',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  sourced: {
    label: 'Captado',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  hot: {
    label: 'Caliente',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  },
  cold: {
    label: 'Frío',
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  },
  prioritaria: {
    label: 'Prioritaria',
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  },
};

export function EmpresaBadge({ variant, className }: EmpresaBadgeProps) {
  const config = badgeConfig[variant];
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
