import React from 'react';

interface PremiumDecorationsProps {
  accent: string;
  variant?: 'corners' | 'lines' | 'dots' | 'minimal';
}

export function PremiumDecorations({ accent, variant = 'corners' }: PremiumDecorationsProps) {
  if (variant === 'minimal') return null;

  return (
    <>
      {/* Top-left corner accent */}
      <div 
        className="absolute top-0 left-0 w-32 h-32 pointer-events-none opacity-20"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, transparent 60%)`,
        }}
      />
      
      {/* Bottom-right corner accent */}
      <div 
        className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none opacity-20"
        style={{
          background: `linear-gradient(-45deg, ${accent} 0%, transparent 60%)`,
        }}
      />

      {variant === 'lines' && (
        <>
          {/* Top accent line */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
            style={{ background: accent }}
          />
          {/* Bottom accent line */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-0.5 pointer-events-none opacity-50"
            style={{ background: accent }}
          />
        </>
      )}

      {variant === 'dots' && (
        <div className="absolute top-8 right-8 pointer-events-none opacity-30">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div 
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: accent }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface NumberBadgeProps {
  number: number;
  accent: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NumberBadge({ number, accent, size = 'md' }: NumberBadgeProps) {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div 
      className={`${sizes[size]} rounded-full flex items-center justify-center font-light`}
      style={{ 
        background: accent,
        color: '#ffffff',
      }}
    >
      {number}
    </div>
  );
}

interface SectionDividerProps {
  accent: string;
  variant?: 'solid' | 'gradient' | 'dashed';
}

export function SectionDivider({ accent, variant = 'gradient' }: SectionDividerProps) {
  if (variant === 'solid') {
    return (
      <div 
        className="w-16 h-0.5 my-4"
        style={{ background: accent }}
      />
    );
  }

  if (variant === 'dashed') {
    return (
      <div 
        className="w-24 h-0.5 my-4"
        style={{ 
          backgroundImage: `repeating-linear-gradient(90deg, ${accent}, ${accent} 8px, transparent 8px, transparent 16px)`,
        }}
      />
    );
  }

  return (
    <div 
      className="w-24 h-0.5 my-4"
      style={{ 
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }}
    />
  );
}

interface AccentCardProps {
  children: React.ReactNode;
  accent: string;
  cardBg: string;
  border: string;
  variant?: 'top' | 'left' | 'full' | 'subtle';
}

export function AccentCard({ children, accent, cardBg, border, variant = 'top' }: AccentCardProps) {
  const baseStyles = "relative overflow-hidden";
  
  const borderStyles = {
    top: { borderTop: `3px solid ${accent}` },
    left: { borderLeft: `3px solid ${accent}` },
    full: { border: `1px solid ${border}` },
    subtle: { border: `1px solid ${border}` },
  };

  return (
    <div 
      className={`${baseStyles} rounded-lg p-6`}
      style={{ 
        background: cardBg,
        ...borderStyles[variant],
      }}
    >
      {variant === 'subtle' && (
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
          style={{ 
            background: `linear-gradient(135deg, ${accent} 0%, transparent 50%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  accent: string;
  background: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, accent, background, showLabel = true }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className="w-full">
      <div 
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background }}
      >
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${clampedValue}%`,
            background: accent,
          }}
        />
      </div>
      {showLabel && (
        <div className="text-xs mt-1 opacity-60">{clampedValue}%</div>
      )}
    </div>
  );
}
