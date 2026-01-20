import React from 'react';
import { Check, Minus } from 'lucide-react';
import { LayoutProps } from './types';
import { AccentCard } from './PremiumDecorations';

// Variant A: Classic two columns
export function ComparisonLayoutA({ content, scheme }: LayoutProps) {
  const columns = content.columns || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
        {columns.map((column, i) => (
          <AccentCard 
            key={i}
            accent={scheme.accent}
            cardBg={scheme.card}
            border={scheme.border}
            variant={i === 0 ? 'top' : 'full'}
          >
            <h4 
              className="text-xl font-light mb-6 pb-3"
              style={{ 
                color: i === 0 ? scheme.accent : scheme.text,
                borderBottom: `1px solid ${scheme.border}`,
              }}
            >
              {column.title}
            </h4>
            <ul className="space-y-3">
              {column.items.map((item, j) => (
                <li 
                  key={j}
                  className="flex items-center gap-3"
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i === 0 ? scheme.accent : scheme.muted }}
                  />
                  <span 
                    className="text-base font-light"
                    style={{ color: scheme.text }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </AccentCard>
        ))}
      </div>
    </div>
  );
}

// Variant B: Table comparison style
export function ComparisonLayoutB({ content, scheme }: LayoutProps) {
  const columns = content.columns || [];
  if (columns.length < 2) return <ComparisonLayoutA content={content} scheme={scheme} />;

  // Find max items to create rows
  const maxItems = Math.max(...columns.map(c => c.items.length));
  const rows = Array.from({ length: maxItems }, (_, i) => 
    columns.map(c => c.items[i] || '—')
  );

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div 
        className="w-full max-w-4xl rounded-xl overflow-hidden"
        style={{ background: scheme.card }}
      >
        {/* Header row */}
        <div 
          className="grid gap-0"
          style={{ 
            gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
            borderBottom: `2px solid ${scheme.accent}`,
          }}
        >
          {columns.map((column, i) => (
            <div 
              key={i}
              className="px-6 py-4 text-center"
              style={{ 
                background: i === 0 ? `${scheme.accent}20` : 'transparent',
                borderRight: i < columns.length - 1 ? `1px solid ${scheme.border}` : 'none',
              }}
            >
              <span 
                className="text-lg font-light"
                style={{ color: i === 0 ? scheme.accent : scheme.text }}
              >
                {column.title}
              </span>
            </div>
          ))}
        </div>

        {/* Data rows */}
        {rows.map((row, rowIndex) => (
          <div 
            key={rowIndex}
            className="grid gap-0"
            style={{ 
              gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
              borderBottom: rowIndex < rows.length - 1 ? `1px solid ${scheme.border}` : 'none',
            }}
          >
            {row.map((cell, cellIndex) => (
              <div 
                key={cellIndex}
                className="px-6 py-4 text-center"
                style={{ 
                  background: cellIndex === 0 ? `${scheme.accent}10` : 'transparent',
                  borderRight: cellIndex < row.length - 1 ? `1px solid ${scheme.border}` : 'none',
                }}
              >
                <span 
                  className="text-base font-light"
                  style={{ color: scheme.text }}
                >
                  {cell}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Variant C: Side-by-side cards with highlight
export function ComparisonLayoutC({ content, scheme }: LayoutProps) {
  const columns = content.columns || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="flex gap-6 w-full max-w-5xl justify-center">
        {columns.map((column, i) => {
          const isHighlighted = i === 0;
          return (
            <div 
              key={i}
              className="flex-1 max-w-xs rounded-xl overflow-hidden"
              style={{ 
                background: isHighlighted ? `${scheme.accent}15` : scheme.card,
                border: isHighlighted ? `2px solid ${scheme.accent}` : `1px solid ${scheme.border}`,
                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {/* Header */}
              <div 
                className="px-6 py-4 text-center"
                style={{ 
                  background: isHighlighted ? scheme.accent : 'transparent',
                  color: isHighlighted ? '#ffffff' : scheme.text,
                }}
              >
                <span className="text-lg font-light">{column.title}</span>
                {isHighlighted && (
                  <div className="text-xs uppercase tracking-wider mt-1 opacity-80">
                    Recommended
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="p-6 space-y-4">
                {column.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Check 
                      className="w-4 h-4 flex-shrink-0" 
                      style={{ color: isHighlighted ? scheme.accent : scheme.muted }} 
                    />
                    <span 
                      className="text-sm font-light"
                      style={{ color: scheme.text }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
