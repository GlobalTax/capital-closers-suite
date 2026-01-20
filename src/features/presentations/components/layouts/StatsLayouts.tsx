import React from 'react';
import { TrendingUp, ArrowUpRight, DollarSign, Percent, Users, Building2, RefreshCw, Globe, PieChart, Calculator, Calendar, MapPin } from 'lucide-react';
import { LayoutProps, STAT_ICON_KEYWORDS } from './types';
import { AccentCard, NumberBadge } from './PremiumDecorations';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp, ArrowUpRight, DollarSign, Percent, Users, Building2, 
  RefreshCw, Globe, PieChart, Calculator, Calendar, MapPin,
};

function getIconForStat(label: string): React.ComponentType<{ className?: string }> | null {
  const lowerLabel = label.toLowerCase();
  for (const [keyword, iconName] of Object.entries(STAT_ICON_KEYWORDS)) {
    if (lowerLabel.includes(keyword)) {
      return ICONS[iconName] || null;
    }
  }
  return null;
}

// Variant A: Classic vertical cards
export function StatsLayoutA({ content, scheme }: LayoutProps) {
  const stats = content.stats || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
        {stats.map((stat, i) => (
          <AccentCard 
            key={i} 
            accent={scheme.accent} 
            cardBg={scheme.card} 
            border={scheme.border}
            variant="top"
          >
            <div className="text-center">
              <div 
                className="text-4xl font-light tracking-tight mb-2"
                style={{ color: scheme.accent }}
              >
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div 
                className="text-sm uppercase tracking-wider opacity-70"
                style={{ color: scheme.muted }}
              >
                {stat.label}
              </div>
            </div>
          </AccentCard>
        ))}
      </div>
    </div>
  );
}

// Variant B: Horizontal grid with icons
export function StatsLayoutB({ content, scheme }: LayoutProps) {
  const stats = content.stats || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
        {stats.map((stat, i) => {
          const Icon = getIconForStat(stat.label);
          return (
            <div 
              key={i} 
              className="flex items-center gap-4 p-6 rounded-lg"
              style={{ 
                background: scheme.card,
                borderLeft: `3px solid ${scheme.accent}`,
              }}
            >
              {Icon && (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: `${scheme.accent}20` }}
                >
                  <Icon className="w-6 h-6" />
                </div>
              )}
              <div>
                <div 
                  className="text-3xl font-light tracking-tight"
                  style={{ color: scheme.text }}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Variant C: Hero stat with secondary stats
export function StatsLayoutC({ content, scheme }: LayoutProps) {
  const stats = content.stats || [];
  const heroStat = stats[0];
  const secondaryStats = stats.slice(1, 4);

  if (!heroStat) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-16">
      {/* Hero stat */}
      <div 
        className="text-center mb-12 p-8 rounded-2xl"
        style={{ 
          background: scheme.card,
          boxShadow: `0 0 60px ${scheme.accent}20`,
        }}
      >
        <div 
          className="text-7xl font-light tracking-tight mb-2"
          style={{ color: scheme.accent }}
        >
          {heroStat.prefix}{heroStat.value}{heroStat.suffix}
        </div>
        <div 
          className="text-lg uppercase tracking-widest opacity-70"
          style={{ color: scheme.muted }}
        >
          {heroStat.label}
        </div>
      </div>

      {/* Secondary stats */}
      {secondaryStats.length > 0 && (
        <div className="flex gap-8">
          {secondaryStats.map((stat, i) => (
            <div 
              key={i}
              className="text-center px-8 py-4"
              style={{ 
                borderLeft: i > 0 ? `1px solid ${scheme.border}` : 'none',
              }}
            >
              <div 
                className="text-2xl font-light tracking-tight"
                style={{ color: scheme.text }}
              >
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div 
                className="text-xs uppercase tracking-wider opacity-60 mt-1"
                style={{ color: scheme.muted }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
