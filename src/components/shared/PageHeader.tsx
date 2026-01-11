import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  icon?: LucideIcon | React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actions?: React.ReactNode;
  extraActions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  subtitle,
  icon,
  actionLabel,
  onAction,
  actions,
  extraActions,
}: PageHeaderProps) {
  const renderIcon = () => {
    if (!icon) return null;
    
    // If it's already a rendered element, return it as-is
    if (React.isValidElement(icon)) {
      return icon;
    }
    
    // Otherwise treat it as a component to instantiate (LucideIcon or forwardRef)
    const Icon = icon as LucideIcon;
    return <Icon className="h-7 w-7 text-foreground" />;
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {renderIcon()}
        <div>
          <h1 className="text-2xl font-medium text-foreground tracking-tight">{title}</h1>
          {(description || subtitle) && (
            <p className="text-sm text-muted-foreground mt-1">{description || subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        {actions || (actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        ))}
      </div>
    </div>
  );
}
