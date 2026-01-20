import { Quote } from "lucide-react";
import { LayoutProps } from "./types";

// Quote Layout: Large quote with attribution
export function QuoteLayoutA({ content, scheme }: LayoutProps) {
  const quote = content.quote;
  if (!quote?.text) return null;

  return (
    <div className="mt-12 max-w-4xl mx-auto text-center">
      <Quote 
        className="h-12 w-12 mx-auto mb-6 opacity-30"
        style={{ color: scheme.accent }}
      />
      <blockquote 
        className="text-2xl md:text-3xl leading-relaxed mb-8"
        style={{ 
          color: scheme.text,
          fontWeight: 300,
          fontStyle: 'italic',
        }}
      >
        "{quote.text}"
      </blockquote>
      {(quote.author || quote.role || quote.company) && (
        <div className="flex items-center justify-center gap-3">
          <div 
            className="w-12 h-px"
            style={{ backgroundColor: scheme.accent }}
          />
          <div style={{ color: scheme.muted }}>
            {quote.author && (
              <span className="font-medium" style={{ color: scheme.text }}>
                {quote.author}
              </span>
            )}
            {quote.role && (
              <span>, {quote.role}</span>
            )}
            {quote.company && (
              <span> — {quote.company}</span>
            )}
          </div>
          <div 
            className="w-12 h-px"
            style={{ backgroundColor: scheme.accent }}
          />
        </div>
      )}
    </div>
  );
}

// Quote Layout B: Left-aligned with accent bar
export function QuoteLayoutB({ content, scheme }: LayoutProps) {
  const quote = content.quote;
  if (!quote?.text) return null;

  return (
    <div className="mt-8 flex gap-6">
      <div 
        className="w-1 rounded-full shrink-0"
        style={{ backgroundColor: scheme.accent }}
      />
      <div>
        <blockquote 
          className="text-xl md:text-2xl leading-relaxed mb-6"
          style={{ 
            color: scheme.text,
            fontWeight: 300,
          }}
        >
          "{quote.text}"
        </blockquote>
        {(quote.author || quote.role) && (
          <div style={{ color: scheme.muted }}>
            <span className="font-medium" style={{ color: scheme.accent }}>
              {quote.author}
            </span>
            {quote.role && <span className="ml-2">{quote.role}</span>}
            {quote.company && <span className="ml-2">| {quote.company}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// Quote Layout C: Card style
export function QuoteLayoutC({ content, scheme }: LayoutProps) {
  const quote = content.quote;
  if (!quote?.text) return null;

  return (
    <div 
      className="mt-8 p-8 rounded-xl relative"
      style={{ 
        backgroundColor: scheme.card,
        border: `1px solid ${scheme.border}`,
      }}
    >
      <Quote 
        className="absolute top-4 left-4 h-8 w-8 opacity-20"
        style={{ color: scheme.accent }}
      />
      <blockquote 
        className="text-xl leading-relaxed mb-6 pl-8"
        style={{ 
          color: scheme.text,
          fontWeight: 300,
        }}
      >
        {quote.text}
      </blockquote>
      <div className="flex items-center gap-4 pl-8">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium"
          style={{ 
            backgroundColor: scheme.accent,
            color: scheme.background.includes('gradient') ? '#ffffff' : scheme.card,
          }}
        >
          {quote.author?.charAt(0) || 'Q'}
        </div>
        <div>
          <div style={{ color: scheme.text }} className="font-medium">
            {quote.author}
          </div>
          <div className="text-sm" style={{ color: scheme.muted }}>
            {[quote.role, quote.company].filter(Boolean).join(' | ')}
          </div>
        </div>
      </div>
    </div>
  );
}
