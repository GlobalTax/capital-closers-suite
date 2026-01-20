import React from 'react';
import { Quote, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import { LayoutProps } from './types';
import { AccentCard, SectionDivider, NumberBadge } from './PremiumDecorations';

// Hero Stat Layout - Single massive KPI
export function HeroStatLayout({ content, scheme }: LayoutProps) {
  const stats = content.stats || [];
  const heroStat = stats[0];

  if (!heroStat) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-16">
      <div 
        className="text-center p-12 rounded-3xl relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${scheme.card} 0%, transparent 100%)`,
        }}
      >
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ 
            background: `radial-gradient(circle at center, ${scheme.accent} 0%, transparent 70%)`,
          }}
        />

        <div className="relative">
          <div 
            className="text-9xl font-light tracking-tighter mb-4"
            style={{ 
              color: scheme.accent,
              textShadow: `0 0 100px ${scheme.accent}40`,
            }}
          >
            {heroStat.prefix}{heroStat.value}{heroStat.suffix}
          </div>
          <div 
            className="text-2xl uppercase tracking-[0.3em] opacity-70"
            style={{ color: scheme.muted }}
          >
            {heroStat.label}
          </div>
        </div>
      </div>
    </div>
  );
}

// Quote Layout - Testimonial or key message
export function QuoteLayout({ content, scheme }: LayoutProps) {
  const quote = content.bodyText || '';
  const author = content.bullets?.[0] || '';

  return (
    <div className="flex-1 flex items-center justify-center px-20">
      <div className="w-full max-w-3xl text-center">
        {/* Quote marks */}
        <Quote 
          className="w-16 h-16 mx-auto mb-8 opacity-30" 
          style={{ color: scheme.accent }}
        />

        {/* Quote text */}
        <blockquote 
          className="text-3xl font-light leading-relaxed mb-8"
          style={{ color: scheme.text }}
        >
          {quote}
        </blockquote>

        {/* Author */}
        {author && (
          <>
            <SectionDivider accent={scheme.accent} variant="solid" />
            <cite 
              className="text-base not-italic opacity-60 mt-4 block"
              style={{ color: scheme.muted }}
            >
              — {author}
            </cite>
          </>
        )}
      </div>
    </div>
  );
}

// Process Layout - Horizontal steps
export function ProcessLayout({ content, scheme }: LayoutProps) {
  const steps = content.bullets || [];

  return (
    <div className="flex-1 flex items-center justify-center px-12">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              {/* Step */}
              <div className="flex flex-col items-center text-center flex-1">
                <NumberBadge number={i + 1} accent={scheme.accent} size="lg" />
                <p 
                  className="text-sm font-light mt-4 max-w-[120px]"
                  style={{ color: scheme.text }}
                >
                  {step}
                </p>
              </div>

              {/* Arrow */}
              {i < steps.length - 1 && (
                <ArrowRight 
                  className="w-6 h-6 flex-shrink-0 mx-2 opacity-40" 
                  style={{ color: scheme.accent }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// Disclaimer Layout - Legal/confidentiality
export function DisclaimerLayout({ content, scheme }: LayoutProps) {
  const text = content.confidentialityText || content.bodyText || 
    'This document contains confidential information intended solely for the use of the intended recipient(s). Any unauthorized review, use, disclosure, or distribution is prohibited.';

  return (
    <div className="flex-1 flex items-center justify-center px-20">
      <div className="w-full max-w-2xl text-center">
        <div 
          className="w-16 h-16 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ background: `${scheme.accent}20` }}
        >
          <Shield className="w-8 h-8" style={{ color: scheme.accent }} />
        </div>

        <h3 
          className="text-xl uppercase tracking-widest mb-6"
          style={{ color: scheme.accent }}
        >
          Confidential
        </h3>

        <p 
          className="text-base font-light leading-relaxed opacity-70"
          style={{ color: scheme.text }}
        >
          {text}
        </p>

        <div 
          className="mt-8 pt-6"
          style={{ borderTop: `1px solid ${scheme.border}` }}
        >
          <p 
            className="text-xs uppercase tracking-wider opacity-40"
            style={{ color: scheme.muted }}
          >
            Strictly Private & Confidential
          </p>
        </div>
      </div>
    </div>
  );
}

// Closing Layout - Call to action
export function ClosingLayout({ content, scheme }: LayoutProps) {
  const headline = content.headline || 'Thank You';
  const subline = content.subline || '';
  const bullets = content.bullets || [];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-20">
      <div className="text-center">
        <h2 
          className="text-5xl font-light tracking-tight mb-4"
          style={{ color: scheme.text }}
        >
          {headline}
        </h2>

        {subline && (
          <p 
            className="text-xl font-light opacity-60 mb-8"
            style={{ color: scheme.muted }}
          >
            {subline}
          </p>
        )}

        {bullets.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {bullets.map((bullet, i) => (
              <div 
                key={i}
                className="px-6 py-3 rounded-lg"
                style={{ 
                  background: scheme.card,
                  border: `1px solid ${scheme.border}`,
                }}
              >
                <span 
                  className="text-sm font-light"
                  style={{ color: scheme.text }}
                >
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Market Layout - Market overview with segments
export function MarketLayout({ content, scheme }: LayoutProps) {
  const stats = content.stats || [];
  const bullets = content.bullets || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-12 w-full max-w-5xl">
        {/* Stats side */}
        <div className="space-y-6">
          {stats.map((stat, i) => (
            <AccentCard
              key={i}
              accent={scheme.accent}
              cardBg={scheme.card}
              border={scheme.border}
              variant="left"
            >
              <div className="flex items-baseline justify-between">
                <span 
                  className="text-sm opacity-60"
                  style={{ color: scheme.muted }}
                >
                  {stat.label}
                </span>
                <span 
                  className="text-2xl font-light"
                  style={{ color: scheme.accent }}
                >
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
              </div>
            </AccentCard>
          ))}
        </div>

        {/* Bullets side */}
        <div className="flex flex-col justify-center">
          <div 
            className="text-xs uppercase tracking-widest mb-4 opacity-50"
            style={{ color: scheme.muted }}
          >
            Market Dynamics
          </div>
          <div className="space-y-4">
            {bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3">
                <div 
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
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
    </div>
  );
}
