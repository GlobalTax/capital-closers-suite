import * as LucideIcons from "lucide-react";
import { LayoutProps } from "./types";
import { cn } from "@/lib/utils";

function getIcon(name: string) {
  return (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name];
}

// Icons Layout A: Grid with cards
export function IconsGridLayoutA({ content, scheme }: LayoutProps) {
  const icons = content.icons;
  if (!icons?.length) return null;

  const gridCols = icons.length <= 3 ? 'grid-cols-3' : icons.length === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className={cn("mt-8 grid gap-6", gridCols)}>
      {icons.map((item, i) => {
        const Icon = getIcon(item.name);
        return (
          <div 
            key={i}
            className="p-6 rounded-lg text-center"
            style={{ 
              backgroundColor: scheme.card,
              borderTop: `3px solid ${scheme.accent}`,
            }}
          >
            {Icon && (
              <div 
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${scheme.accent}20` }}
              >
                <Icon 
                  className="h-6 w-6"
                  style={{ color: scheme.accent }}
                />
              </div>
            )}
            <h4 
              className="text-lg font-medium mb-2"
              style={{ color: scheme.text }}
            >
              {item.label}
            </h4>
            {item.description && (
              <p 
                className="text-sm"
                style={{ color: scheme.muted }}
              >
                {item.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Icons Layout B: Horizontal list with icons left
export function IconsGridLayoutB({ content, scheme }: LayoutProps) {
  const icons = content.icons;
  if (!icons?.length) return null;

  return (
    <div className="mt-8 space-y-4">
      {icons.map((item, i) => {
        const Icon = getIcon(item.name);
        return (
          <div 
            key={i}
            className="flex items-start gap-4 p-4 rounded-lg"
            style={{ backgroundColor: scheme.card }}
          >
            {Icon && (
              <div 
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                style={{ backgroundColor: scheme.accent }}
              >
                <Icon 
                  className="h-5 w-5"
                  style={{ color: scheme.background.includes('gradient') ? '#ffffff' : scheme.card }}
                />
              </div>
            )}
            <div>
              <h4 
                className="text-base font-medium"
                style={{ color: scheme.text }}
              >
                {item.label}
              </h4>
              {item.description && (
                <p 
                  className="text-sm mt-1"
                  style={{ color: scheme.muted }}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Icons Layout C: Large icons with minimal text
export function IconsGridLayoutC({ content, scheme }: LayoutProps) {
  const icons = content.icons;
  if (!icons?.length) return null;

  return (
    <div className="mt-8 flex justify-center gap-16">
      {icons.slice(0, 4).map((item, i) => {
        const Icon = getIcon(item.name);
        return (
          <div 
            key={i}
            className="text-center"
          >
            {Icon && (
              <div 
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ 
                  backgroundColor: scheme.card,
                  boxShadow: `0 0 0 2px ${scheme.accent}`,
                }}
              >
                <Icon 
                  className="h-10 w-10"
                  style={{ color: scheme.accent }}
                />
              </div>
            )}
            <h4 
              className="text-sm uppercase tracking-wider font-medium"
              style={{ color: scheme.text }}
            >
              {item.label}
            </h4>
          </div>
        );
      })}
    </div>
  );
}
