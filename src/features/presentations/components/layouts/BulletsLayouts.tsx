import React from 'react';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { LayoutProps } from './types';
import { NumberBadge, AccentCard } from './PremiumDecorations';

// Variant A: Classic elegant list
export function BulletsLayoutA({ content, scheme }: LayoutProps) {
  const bullets = content.bullets || [];

  return (
    <div className="flex-1 flex items-center justify-center px-20">
      <div className="w-full max-w-3xl space-y-5">
        {bullets.map((bullet, i) => (
          <div 
            key={i} 
            className="flex items-start gap-4 group"
          >
            <div 
              className="w-2 h-2 rounded-full mt-2.5 flex-shrink-0 transition-transform group-hover:scale-150"
              style={{ background: scheme.accent }}
            />
            <p 
              className="text-xl font-light leading-relaxed"
              style={{ color: scheme.text }}
            >
              {bullet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Variant B: Two columns with numbered badges
export function BulletsLayoutB({ content, scheme }: LayoutProps) {
  const bullets = content.bullets || [];
  const midpoint = Math.ceil(bullets.length / 2);
  const leftColumn = bullets.slice(0, midpoint);
  const rightColumn = bullets.slice(midpoint);

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-12 w-full max-w-5xl">
        {/* Left column */}
        <div className="space-y-6">
          {leftColumn.map((bullet, i) => (
            <div key={i} className="flex items-start gap-4">
              <NumberBadge number={i + 1} accent={scheme.accent} />
              <div>
                <p 
                  className="text-lg font-light leading-relaxed"
                  style={{ color: scheme.text }}
                >
                  {bullet}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {rightColumn.map((bullet, i) => (
            <div key={i} className="flex items-start gap-4">
              <NumberBadge number={midpoint + i + 1} accent={scheme.accent} />
              <div>
                <p 
                  className="text-lg font-light leading-relaxed"
                  style={{ color: scheme.text }}
                >
                  {bullet}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Variant C: Cards with icons
export function BulletsLayoutC({ content, scheme }: LayoutProps) {
  const bullets = content.bullets || [];
  const gridCols = bullets.length <= 2 ? 'grid-cols-2' : bullets.length <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className={`grid ${gridCols} gap-6 w-full max-w-5xl`}>
        {bullets.map((bullet, i) => (
          <AccentCard 
            key={i}
            accent={scheme.accent}
            cardBg={scheme.card}
            border={scheme.border}
            variant="subtle"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${scheme.accent}20` }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: scheme.accent }} />
              </div>
              <p 
                className="text-base font-light leading-relaxed"
                style={{ color: scheme.text }}
              >
                {bullet}
              </p>
            </div>
          </AccentCard>
        ))}
      </div>
    </div>
  );
}
