import React from 'react';
import { LayoutProps } from './types';
import { AccentCard, SectionDivider } from './PremiumDecorations';

// Variant A: Text left + bullets right
export function OverviewLayoutA({ content, scheme }: LayoutProps) {
  const bodyText = content.bodyText || '';
  const bullets = content.bullets || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-12 w-full max-w-5xl">
        {/* Text column */}
        <div>
          {bodyText && (
            <p 
              className="text-lg font-light leading-relaxed"
              style={{ color: scheme.text }}
            >
              {bodyText}
            </p>
          )}
        </div>

        {/* Bullets column */}
        <div className="space-y-4">
          {bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-3">
              <div 
                className="w-2 h-2 rounded-full mt-2.5 flex-shrink-0"
                style={{ background: scheme.accent }}
              />
              <p 
                className="text-base font-light"
                style={{ color: scheme.text }}
              >
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Variant B: Full width with highlight quote
export function OverviewLayoutB({ content, scheme }: LayoutProps) {
  const bodyText = content.bodyText || '';
  const bullets = content.bullets || [];

  // Extract first sentence as quote
  const firstSentence = bodyText.split('.')[0] + '.';
  const restText = bodyText.slice(firstSentence.length).trim();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-20">
      <div className="w-full max-w-4xl">
        {/* Quote highlight */}
        {firstSentence && (
          <div className="mb-8">
            <div 
              className="text-5xl leading-none mb-4 opacity-30"
              style={{ color: scheme.accent }}
            >
              "
            </div>
            <p 
              className="text-2xl font-light leading-relaxed pl-8"
              style={{ color: scheme.text }}
            >
              {firstSentence}
            </p>
          </div>
        )}

        <SectionDivider accent={scheme.accent} />

        {/* Rest of content */}
        {restText && (
          <p 
            className="text-base font-light leading-relaxed mb-8 opacity-80"
            style={{ color: scheme.text }}
          >
            {restText}
          </p>
        )}

        {/* Bullets in row */}
        {bullets.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {bullets.map((bullet, i) => (
              <div 
                key={i}
                className="px-4 py-2 rounded-full text-sm"
                style={{ 
                  background: `${scheme.accent}15`,
                  color: scheme.accent,
                  border: `1px solid ${scheme.accent}40`,
                }}
              >
                {bullet}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Variant C: Split 40/60 with stats
export function OverviewLayoutC({ content, scheme }: LayoutProps) {
  const bodyText = content.bodyText || '';
  const bullets = content.bullets || [];
  const stats = content.stats || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-5 gap-12 w-full max-w-5xl">
        {/* Left column - 40% */}
        <div className="col-span-2 flex flex-col justify-center">
          {stats.length > 0 ? (
            <div className="space-y-6">
              {stats.slice(0, 3).map((stat, i) => (
                <div key={i}>
                  <div 
                    className="text-4xl font-light tracking-tight"
                    style={{ color: scheme.accent }}
                  >
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div 
                    className="text-sm opacity-60 mt-1"
                    style={{ color: scheme.muted }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="w-full aspect-square rounded-xl flex items-center justify-center"
              style={{ 
                background: scheme.card,
                border: `1px solid ${scheme.border}`,
              }}
            >
              <span 
                className="text-sm opacity-40"
                style={{ color: scheme.muted }}
              >
                Image placeholder
              </span>
            </div>
          )}
        </div>

        {/* Right column - 60% */}
        <div className="col-span-3">
          {bodyText && (
            <p 
              className="text-lg font-light leading-relaxed mb-6"
              style={{ color: scheme.text }}
            >
              {bodyText}
            </p>
          )}

          {bullets.length > 0 && (
            <div className="space-y-3 mt-6">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs"
                    style={{ 
                      background: `${scheme.accent}20`,
                      color: scheme.accent,
                    }}
                  >
                    {i + 1}
                  </div>
                  <p 
                    className="text-base font-light pt-0.5"
                    style={{ color: scheme.text }}
                  >
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
