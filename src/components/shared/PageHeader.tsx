import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, type LucideIcon } from "lucide-react";
import { ContextualHelpButton } from "@/components/help/ContextualHelpButton";
import { getHelpSlugForRoute } from "@/config/helpMapping";

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  icon?: LucideIcon | React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actions?: React.ReactNode;
  extraActions?: React.ReactNode;
  /** Specific help slug to show in contextual help */
  helpSlug?: string;
  /** Auto-detect help slug from current route */
  showHelp?: boolean;
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
  helpSlug,
  showHelp = false,
}: PageHeaderProps) {
  const location = useLocation();
  const resolvedSlug = helpSlug || (showHelp ? getHelpSlugForRoute(location.pathname) : null);

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 lg:mb-8">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {icon && (
          <div className="hidden sm:block shrink-0">
            {renderIcon()}
          </div>
        )}
        <div className="min-w-0 flex items-center gap-2">
          <h1 className="text-xl md:text-2xl text-foreground tracking-tight truncate">{title}</h1>
          {resolvedSlug && (
            <ContextualHelpButton slug={resolvedSlug} />
          )}
        </div>
        {(description || subtitle) && (
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 truncate hidden sm:block">{description || subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {extraActions}
        {actions || (actionLabel && onAction && (
          <Button onClick={onAction} size="sm" className="gap-1.5 h-8 md:h-9 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">{actionLabel}</span>
            <span className="xs:hidden">Nuevo</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
