import { ArrowRight } from "lucide-react";
import { LayoutProps } from "./types";

// Process Layout A: Horizontal steps
export function ProcessLayoutA({ content, scheme }: LayoutProps) {
  const process = content.process;
  if (!process?.length) return null;

  return (
    <div className="mt-8">
      <div className="flex items-start justify-between relative">
        {/* Connection line */}
        <div 
          className="absolute top-6 left-0 right-0 h-0.5"
          style={{ backgroundColor: scheme.border }}
        />
        
        {process.map((step, i) => (
          <div key={i} className="relative flex flex-col items-center text-center flex-1">
            {/* Step number */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium mb-4 relative z-10"
              style={{ 
                backgroundColor: scheme.accent,
                color: scheme.background.includes('gradient') ? '#ffffff' : scheme.card,
              }}
            >
              {step.number}
            </div>
            <h4 
              className="text-base font-medium mb-2"
              style={{ color: scheme.text }}
            >
              {step.title}
            </h4>
            {step.description && (
              <p 
                className="text-sm max-w-[160px]"
                style={{ color: scheme.muted }}
              >
                {step.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Process Layout B: Vertical timeline
export function ProcessLayoutB({ content, scheme }: LayoutProps) {
  const process = content.process;
  if (!process?.length) return null;

  return (
    <div className="mt-8 relative">
      {/* Vertical line */}
      <div 
        className="absolute left-6 top-0 bottom-0 w-0.5"
        style={{ backgroundColor: scheme.border }}
      />
      
      <div className="space-y-6">
        {process.map((step, i) => (
          <div key={i} className="flex gap-6">
            {/* Step number */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium shrink-0 relative z-10"
              style={{ 
                backgroundColor: scheme.accent,
                color: scheme.background.includes('gradient') ? '#ffffff' : scheme.card,
              }}
            >
              {step.number}
            </div>
            <div className="pt-2">
              <h4 
                className="text-lg font-medium mb-1"
                style={{ color: scheme.text }}
              >
                {step.title}
              </h4>
              {step.description && (
                <p 
                  className="text-base"
                  style={{ color: scheme.muted }}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Process Layout C: Cards with arrows
export function ProcessLayoutC({ content, scheme }: LayoutProps) {
  const process = content.process;
  if (!process?.length) return null;

  return (
    <div className="mt-8 flex items-stretch gap-4">
      {process.map((step, i) => (
        <div key={i} className="flex items-center gap-4 flex-1">
          <div 
            className="flex-1 p-5 rounded-lg"
            style={{ 
              backgroundColor: scheme.card,
              borderLeft: `3px solid ${scheme.accent}`,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span 
                className="text-2xl font-light"
                style={{ color: scheme.accent }}
              >
                {step.number.toString().padStart(2, '0')}
              </span>
              <h4 
                className="text-base font-medium"
                style={{ color: scheme.text }}
              >
                {step.title}
              </h4>
            </div>
            {step.description && (
              <p 
                className="text-sm"
                style={{ color: scheme.muted }}
              >
                {step.description}
              </p>
            )}
          </div>
          {i < process.length - 1 && (
            <ArrowRight 
              className="shrink-0 h-5 w-5"
              style={{ color: scheme.muted }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
