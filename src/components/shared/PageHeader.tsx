import { Button } from "@/components/ui/button";
import { Plus, type LucideIcon } from "lucide-react";
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  icon?: LucideIcon | React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  subtitle,
  icon,
  actionLabel,
  onAction,
  actions,
}: PageHeaderProps) {
  // Check if icon is a LucideIcon (function component) or a ReactNode
  const renderIcon = () => {
    if (!icon) return null;
    
    // If it's a function (LucideIcon component), render it
    if (typeof icon === 'function') {
      const Icon = icon as LucideIcon;
      return <Icon className="h-7 w-7 text-foreground" />;
    }
    
    // Otherwise it's already a ReactNode
    return icon;
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {renderIcon()}
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
