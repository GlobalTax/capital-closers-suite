import React from 'react';
import { User } from 'lucide-react';
import { LayoutProps } from './types';
import { AccentCard } from './PremiumDecorations';

// Variant A: Classic grid with circular avatars
export function TeamLayoutA({ content, scheme }: LayoutProps) {
  const members = content.teamMembers || [];
  const gridCols = members.length <= 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className={`grid ${gridCols} gap-8 w-full max-w-4xl`}>
        {members.map((member, i) => (
          <div key={i} className="text-center">
            <div 
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 overflow-hidden"
              style={{ 
                background: scheme.card,
                boxShadow: `0 0 0 3px ${scheme.accent}40`,
              }}
            >
              {member.imageUrl ? (
                <img 
                  src={member.imageUrl} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" style={{ color: scheme.muted }} />
              )}
            </div>
            <h4 
              className="text-lg font-light mb-1"
              style={{ color: scheme.text }}
            >
              {member.name}
            </h4>
            <p 
              className="text-sm opacity-60"
              style={{ color: scheme.muted }}
            >
              {member.role}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Variant B: Horizontal cards with bio
export function TeamLayoutB({ content, scheme }: LayoutProps) {
  const members = content.teamMembers || [];

  return (
    <div className="flex-1 flex items-center justify-center px-16">
      <div className="grid grid-cols-2 gap-6 w-full max-w-5xl">
        {members.map((member, i) => (
          <div 
            key={i} 
            className="flex items-center gap-5 p-5 rounded-xl"
            style={{ 
              background: scheme.card,
              borderLeft: `3px solid ${scheme.accent}`,
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: `${scheme.accent}20` }}
            >
              {member.imageUrl ? (
                <img 
                  src={member.imageUrl} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8" style={{ color: scheme.accent }} />
              )}
            </div>
            <div>
              <h4 
                className="text-lg font-light"
                style={{ color: scheme.text }}
              >
                {member.name}
              </h4>
              <p 
                className="text-sm opacity-60"
                style={{ color: scheme.muted }}
              >
                {member.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Variant C: Executive minimalist list
export function TeamLayoutC({ content, scheme }: LayoutProps) {
  const members = content.teamMembers || [];

  return (
    <div className="flex-1 flex items-center justify-center px-20">
      <div className="w-full max-w-2xl">
        <div 
          className="border-b pb-2 mb-6"
          style={{ borderColor: scheme.border }}
        >
          <span 
            className="text-xs uppercase tracking-widest opacity-50"
            style={{ color: scheme.muted }}
          >
            Leadership Team
          </span>
        </div>
        <div className="space-y-4">
          {members.map((member, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between py-3"
              style={{ 
                borderBottom: i < members.length - 1 ? `1px solid ${scheme.border}` : 'none',
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ background: scheme.accent }}
                />
                <span 
                  className="text-lg font-light"
                  style={{ color: scheme.text }}
                >
                  {member.name}
                </span>
              </div>
              <span 
                className="text-sm opacity-60"
                style={{ color: scheme.muted }}
              >
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
