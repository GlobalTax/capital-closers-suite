import React from 'react';
import { LayoutProps } from './types';
import { NumberBadge, AccentCard } from './PremiumDecorations';

// Variant A: Vertical timeline with line
export function TimelineLayoutA({ content, scheme }: LayoutProps) {
  const items = content.bullets || [];

  return (
    <div className="flex-1 flex items-center justify-center px-20">
      <div className="relative w-full max-w-2xl">
        {/* Vertical line */}
        <div 
          className="absolute left-4 top-0 bottom-0 w-0.5"
          style={{ background: `linear-gradient(180deg, ${scheme.accent}, ${scheme.border})` }}
        />

        <div className="space-y-8">
          {items.map((item, i) => {
            // Try to parse "YEAR: Description" format
            const colonIndex = item.indexOf(':');
            const year = colonIndex > 0 ? item.slice(0, colonIndex).trim() : '';
            const description = colonIndex > 0 ? item.slice(colonIndex + 1).trim() : item;

            return (
              <div key={i} className="flex items-start gap-6 relative">
                {/* Dot */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center z-10 text-xs font-light"
                  style={{ 
                    background: scheme.accent,
                    color: '#ffffff',
                  }}
                >
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  {year && (
                    <div 
                      className="text-sm uppercase tracking-wider mb-1 opacity-60"
                      style={{ color: scheme.accent }}
                    >
                      {year}
                    </div>
                  )}
                  <p 
                    className="text-lg font-light"
                    style={{ color: scheme.text }}
                  >
                    {description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Variant B: Horizontal timeline
export function TimelineLayoutB({ content, scheme }: LayoutProps) {
  const items = content.bullets || [];

  return (
    <div className="flex-1 flex items-center justify-center px-12">
      <div className="w-full max-w-5xl">
        {/* Horizontal line */}
        <div className="relative">
          <div 
            className="absolute left-0 right-0 top-4 h-0.5"
            style={{ background: `linear-gradient(90deg, ${scheme.border}, ${scheme.accent}, ${scheme.border})` }}
          />

          <div className="flex justify-between">
            {items.map((item, i) => {
              const colonIndex = item.indexOf(':');
              const year = colonIndex > 0 ? item.slice(0, colonIndex).trim() : '';
              const description = colonIndex > 0 ? item.slice(colonIndex + 1).trim() : item;

              return (
                <div key={i} className="flex flex-col items-center text-center max-w-[150px]">
                  {/* Dot */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center z-10 mb-4"
                    style={{ 
                      background: scheme.accent,
                      color: '#ffffff',
                    }}
                  >
                    <span className="text-xs font-light">{i + 1}</span>
                  </div>

                  {/* Content */}
                  {year && (
                    <div 
                      className="text-xs uppercase tracking-wider mb-2"
                      style={{ color: scheme.accent }}
                    >
                      {year}
                    </div>
                  )}
                  <p 
                    className="text-sm font-light leading-tight"
                    style={{ color: scheme.text }}
                  >
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Variant C: Cards with progress
export function TimelineLayoutC({ content, scheme }: LayoutProps) {
  const items = content.bullets || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
        {items.map((item, i) => {
          const colonIndex = item.indexOf(':');
          const year = colonIndex > 0 ? item.slice(0, colonIndex).trim() : '';
          const description = colonIndex > 0 ? item.slice(colonIndex + 1).trim() : item;

          return (
            <AccentCard
              key={i}
              accent={scheme.accent}
              cardBg={scheme.card}
              border={scheme.border}
              variant="left"
            >
              <div className="flex items-start gap-4">
                <NumberBadge number={i + 1} accent={scheme.accent} size="lg" />
                <div>
                  {year && (
                    <div 
                      className="text-sm uppercase tracking-wider mb-1"
                      style={{ color: scheme.accent }}
                    >
                      {year}
                    </div>
                  )}
                  <p 
                    className="text-base font-light"
                    style={{ color: scheme.text }}
                  >
                    {description}
                  </p>
                </div>
              </div>
            </AccentCard>
          );
        })}
      </div>
    </div>
  );
}
