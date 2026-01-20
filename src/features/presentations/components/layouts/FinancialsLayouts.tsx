import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3 } from 'lucide-react';
import { LayoutProps } from './types';
import { AccentCard, ProgressBar } from './PremiumDecorations';

// Variant A: Metrics table with highlights
export function FinancialsLayoutA({ content, scheme }: LayoutProps) {
  const stats = content.stats || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div 
        className="w-full max-w-3xl rounded-xl overflow-hidden"
        style={{ background: scheme.card }}
      >
        <div 
          className="px-6 py-4 flex items-center gap-3"
          style={{ 
            background: `${scheme.accent}20`,
            borderBottom: `2px solid ${scheme.accent}`,
          }}
        >
          <BarChart3 className="w-5 h-5" style={{ color: scheme.accent }} />
          <span 
            className="text-sm uppercase tracking-widest"
            style={{ color: scheme.accent }}
          >
            Financial Highlights
          </span>
        </div>

        <div className="divide-y" style={{ borderColor: scheme.border }}>
          {stats.map((stat, i) => {
            const isGrowth = stat.value.includes('+') || stat.value.includes('%');
            return (
              <div 
                key={i}
                className="px-6 py-5 flex items-center justify-between"
                style={{ borderColor: scheme.border }}
              >
                <span 
                  className="text-base font-light"
                  style={{ color: scheme.muted }}
                >
                  {stat.label}
                </span>
                <span 
                  className="text-2xl font-light tracking-tight"
                  style={{ color: isGrowth ? scheme.accent : scheme.text }}
                >
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Variant B: Side stats with chart placeholder
export function FinancialsLayoutB({ content, scheme }: LayoutProps) {
  const stats = content.stats || [];
  const mainStats = stats.slice(0, 2);
  const secondaryStats = stats.slice(2);

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Chart placeholder */}
        <div 
          className="rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]"
          style={{ 
            background: scheme.card,
            border: `1px solid ${scheme.border}`,
          }}
        >
          {/* Simple bar chart visualization */}
          <div className="flex items-end gap-4 h-40">
            {[60, 75, 55, 85, 70, 90].map((height, i) => (
              <div 
                key={i}
                className="w-8 rounded-t transition-all hover:opacity-80"
                style={{ 
                  height: `${height}%`,
                  background: i === 5 ? scheme.accent : `${scheme.accent}60`,
                }}
              />
            ))}
          </div>
          <div 
            className="text-xs uppercase tracking-wider mt-6 opacity-50"
            style={{ color: scheme.muted }}
          >
            Revenue Evolution (FY19-FY24)
          </div>
        </div>

        {/* Stats panel */}
        <div className="flex flex-col justify-center gap-6">
          {/* Main stats */}
          {mainStats.map((stat, i) => (
            <AccentCard
              key={i}
              accent={scheme.accent}
              cardBg={scheme.card}
              border={scheme.border}
              variant="left"
            >
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm opacity-60"
                  style={{ color: scheme.muted }}
                >
                  {stat.label}
                </span>
                <span 
                  className="text-3xl font-light"
                  style={{ color: scheme.accent }}
                >
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
              </div>
            </AccentCard>
          ))}

          {/* Secondary stats */}
          {secondaryStats.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              {secondaryStats.map((stat, i) => (
                <div 
                  key={i}
                  className="text-center p-4 rounded-lg"
                  style={{ background: scheme.card }}
                >
                  <div 
                    className="text-xl font-light"
                    style={{ color: scheme.text }}
                  >
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div 
                    className="text-xs opacity-50 mt-1"
                    style={{ color: scheme.muted }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Variant C: Large KPIs with trends
export function FinancialsLayoutC({ content, scheme }: LayoutProps) {
  const stats = content.stats || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
        {stats.map((stat, i) => {
          const isPositive = stat.value.includes('+');
          const isNegative = stat.value.includes('-');
          const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

          return (
            <div 
              key={i}
              className="rounded-xl p-8 text-center relative overflow-hidden"
              style={{ 
                background: scheme.card,
                border: `1px solid ${scheme.border}`,
              }}
            >
              {/* Background accent */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 opacity-10"
                style={{ 
                  background: `radial-gradient(circle at top right, ${scheme.accent}, transparent 70%)`,
                }}
              />

              {/* Trend icon */}
              <div className="flex justify-center mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${scheme.accent}20` }}
                >
                  <TrendIcon className="w-5 h-5" style={{ color: scheme.accent }} />
                </div>
              </div>

              {/* Value */}
              <div 
                className="text-4xl font-light tracking-tight mb-2"
                style={{ color: scheme.text }}
              >
                {stat.prefix}{stat.value}{stat.suffix}
              </div>

              {/* Label */}
              <div 
                className="text-sm uppercase tracking-wider opacity-60"
                style={{ color: scheme.muted }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
