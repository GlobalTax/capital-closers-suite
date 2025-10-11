import { Button } from "@/components/ui/button";
import { Plus, type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  subtitle,
  icon: Icon,
  actionLabel,
  onAction,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {Icon && <Icon className="h-7 w-7 text-foreground" />}
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
          {(description || subtitle) && (
            <p className="text-sm text-muted-foreground mt-1">{description || subtitle}</p>
          )}
        </div>
      </div>
      {actions || (actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      ))}
    </div>
  );
}
