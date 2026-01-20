import { cn } from "@/lib/utils";
import type { PresentationSlide, SlideContent, BrandKit, SlideLayout } from "@/types/presentations";

interface SlideCanvasProps {
  slide: PresentationSlide;
  brandKit?: BrandKit | null;
  isPresenting?: boolean;
  className?: string;
}

// Premium color schemes for M&A presentations
const PREMIUM_SCHEMES = {
  navy: {
    background: "linear-gradient(135deg, #0c1929 0%, #1a365d 100%)",
    accent: "#d4a853",
    text: "#ffffff",
    muted: "rgba(255,255,255,0.7)",
    card: "rgba(255,255,255,0.08)",
    border: "rgba(212,168,83,0.3)",
  },
  dark: {
    background: "linear-gradient(180deg, #0a0a0a 0%, #171717 100%)",
    accent: "#22c55e",
    text: "#fafafa",
    muted: "rgba(250,250,250,0.6)",
    card: "rgba(255,255,255,0.05)",
    border: "rgba(34,197,94,0.3)",
  },
  light: {
    background: "#ffffff",
    accent: "#1e3a5f",
    text: "#0f172a",
    muted: "#64748b",
    card: "#f8fafc",
    border: "#e2e8f0",
  },
  emerald: {
    background: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
    accent: "#6ee7b7",
    text: "#ffffff",
    muted: "rgba(255,255,255,0.7)",
    card: "rgba(110,231,183,0.1)",
    border: "rgba(110,231,183,0.3)",
  },
};

function getSchemeFromColors(backgroundColor?: string): keyof typeof PREMIUM_SCHEMES {
  if (!backgroundColor) return "light";
  const lower = backgroundColor.toLowerCase();
  if (lower.includes("0c1929") || lower.includes("1a365d") || lower.includes("navy")) return "navy";
  if (lower.includes("0a0a0a") || lower.includes("171717") || lower.includes("#000")) return "dark";
  if (lower.includes("022c22") || lower.includes("064e3b")) return "emerald";
  return "light";
}

export function SlideCanvas({ slide, brandKit, isPresenting = false, className }: SlideCanvasProps) {
  const content = slide.content as SlideContent;
  
  // Determine color scheme
  const schemeName = getSchemeFromColors(slide.background_color || brandKit?.backgroundColor);
  const scheme = PREMIUM_SCHEMES[schemeName];
  
  // Use slide-specific colors or fallback to scheme
  const backgroundColor = slide.background_color || brandKit?.backgroundColor || scheme.background;
  const textColor = slide.text_color || brandKit?.textColor || scheme.text;
  const accentColor = brandKit?.accentColor || scheme.accent;
  const mutedColor = brandKit?.mutedTextColor || scheme.muted;
  const fontHeading = brandKit?.fontHeading || "'Inter', sans-serif";
  const fontBody = brandKit?.fontBody || "'Inter', sans-serif";
  const footerText = content.confidentialityText || brandKit?.footerText || "CONFIDENTIAL";
  const logoUrl = content.logoUrl || brandKit?.logoUrl;
  
  const isGradient = backgroundColor.includes("gradient");
  
  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col overflow-hidden",
        isPresenting && "min-h-screen",
        className
      )}
      style={{
        background: isGradient ? backgroundColor : undefined,
        backgroundColor: !isGradient ? backgroundColor : undefined,
        color: textColor,
        fontFamily: fontBody,
      }}
    >
      {/* Decorative elements */}
      {schemeName !== "light" && (
        <>
          {/* Corner accent */}
          <div 
            className="absolute top-0 right-0 w-[400px] h-[400px] opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top right, ${accentColor} 0%, transparent 70%)`,
            }}
          />
          {/* Bottom accent line */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
              opacity: 0.3,
            }}
          />
        </>
      )}

      {/* Logo header */}
      {logoUrl && (
        <div className="absolute top-8 left-12 z-10">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-8 object-contain opacity-90"
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col justify-center px-16 py-16 md:px-24 md:py-20">
        {/* Headline */}
        {slide.headline && (
          <h1 
            className={cn(
              "tracking-tight mb-4 leading-tight",
              slide.layout === "title" || slide.layout === "hero" 
                ? "text-5xl md:text-6xl lg:text-7xl" 
                : "text-3xl md:text-4xl lg:text-5xl"
            )}
            style={{ 
              fontFamily: fontHeading,
              fontWeight: 300,
              letterSpacing: "-0.02em",
            }}
          >
            {slide.headline}
          </h1>
        )}
        
        {/* Subline */}
        {slide.subline && (
          <p 
            className={cn(
              "mb-8 leading-relaxed max-w-4xl",
              slide.layout === "title" || slide.layout === "hero"
                ? "text-xl md:text-2xl"
                : "text-lg md:text-xl"
            )}
            style={{ 
              color: mutedColor,
              fontWeight: 300,
            }}
          >
            {slide.subline}
          </p>
        )}

        {/* Layout-specific content */}
        <SlideLayoutContent 
          layout={slide.layout} 
          content={content} 
          accentColor={accentColor}
          mutedColor={mutedColor}
          textColor={textColor}
          cardBg={scheme.card}
          borderColor={scheme.border}
          logoUrl={logoUrl}
          fontHeading={fontHeading}
          schemeName={schemeName}
        />
      </div>

      {/* Footer */}
      <div 
        className="absolute bottom-4 left-16 right-16 flex justify-between items-center text-[10px] uppercase tracking-[0.2em]"
        style={{ color: mutedColor }}
      >
        <span>{footerText}</span>
        <span>{content.footnote}</span>
      </div>
    </div>
  );
}

interface SlideLayoutContentProps {
  layout: SlideLayout;
  content: SlideContent;
  accentColor: string;
  mutedColor: string;
  textColor: string;
  cardBg: string;
  borderColor: string;
  logoUrl?: string;
  fontHeading?: string;
  schemeName: string;
}

function SlideLayoutContent({ 
  layout, 
  content, 
  accentColor, 
  mutedColor,
  textColor,
  cardBg,
  borderColor,
  logoUrl,
  fontHeading,
  schemeName,
}: SlideLayoutContentProps) {
  switch (layout) {
    case 'title':
    case 'hero':
      return (
        <div className="flex-1 flex flex-col justify-center">
          {/* Decorative line */}
          <div 
            className="w-24 h-0.5 mb-8"
            style={{ backgroundColor: accentColor }}
          />
          {/* Large logo for hero slides */}
          {logoUrl && layout === 'hero' && (
            <div className="mt-12">
              <img src={logoUrl} alt="Logo" className="h-16 opacity-80" />
            </div>
          )}
        </div>
      );

    case 'bullets':
      return (
        <ul className="space-y-5 mt-6 max-w-4xl">
          {content.bullets?.map((bullet, i) => (
            <li 
              key={i} 
              className="flex items-start gap-4 text-lg md:text-xl"
              style={{ fontWeight: 300 }}
            >
              <span 
                className="w-2 h-2 rounded-full mt-2.5 shrink-0"
                style={{ 
                  backgroundColor: accentColor,
                  boxShadow: `0 0 0 2px ${accentColor}40`,
                }}
              />
              <span style={{ lineHeight: 1.6 }}>{bullet}</span>
            </li>
          ))}
        </ul>
      );

    case 'stats':
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 mt-8">
          {content.stats?.map((stat, i) => (
            <div 
              key={i} 
              className="relative p-6 rounded-lg"
              style={{ 
                backgroundColor: cardBg,
                borderLeft: `3px solid ${accentColor}`,
              }}
            >
              <div 
                className="text-4xl md:text-5xl lg:text-6xl tracking-tight"
                style={{ 
                  color: accentColor,
                  fontWeight: 200,
                  fontFamily: fontHeading,
                }}
              >
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div 
                className="text-sm md:text-base mt-3 uppercase tracking-wider"
                style={{ 
                  color: mutedColor,
                  fontWeight: 400,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      );

    case 'team':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
          {content.teamMembers?.map((member, i) => (
            <div key={i} className="text-center group">
              <div 
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden transition-all"
                style={{ 
                  backgroundColor: cardBg,
                  boxShadow: `0 0 0 2px ${schemeName === 'light' ? '#ffffff' : '#0a0a0a'}, 0 0 0 4px ${accentColor}`,
                }}
              >
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span 
                    className="text-3xl font-light"
                    style={{ color: accentColor }}
                  >
                    {member.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-base font-normal">{member.name}</div>
              <div 
                className="text-sm mt-1"
                style={{ color: mutedColor }}
              >
                {member.role}
              </div>
            </div>
          ))}
        </div>
      );

    case 'comparison':
      return (
        <div className="grid grid-cols-2 gap-12 mt-8">
          {content.columns?.map((column, i) => (
            <div 
              key={i}
              className="p-6 rounded-lg"
              style={{ 
                backgroundColor: cardBg,
                borderTop: `2px solid ${accentColor}`,
              }}
            >
              <h3 
                className="text-xl md:text-2xl mb-6 pb-4"
                style={{ 
                  fontFamily: fontHeading,
                  fontWeight: 400,
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-base">
                    <span 
                      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span style={{ color: mutedColor }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 'overview':
    case 'market':
      return (
        <div className="mt-6 max-w-5xl">
          {content.bodyText && (
            <p 
              className="text-lg md:text-xl leading-relaxed mb-8"
              style={{ 
                fontWeight: 300,
                lineHeight: 1.8,
              }}
            >
              {content.bodyText}
            </p>
          )}
          {content.bullets && content.bullets.length > 0 && (
            <ul className="space-y-4 mt-6">
              {content.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-4 text-lg">
                  <span 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                    style={{ 
                      backgroundColor: accentColor,
                      color: schemeName === 'light' ? '#ffffff' : '#0a0a0a',
                      fontWeight: 500,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ lineHeight: 1.6 }}>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
          {content.stats && content.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-8 mt-12">
              {content.stats.map((stat, i) => (
                <div 
                  key={i} 
                  className="text-center p-6 rounded-lg"
                  style={{ backgroundColor: cardBg }}
                >
                  <div 
                    className="text-4xl md:text-5xl tracking-tight"
                    style={{ 
                      color: accentColor,
                      fontWeight: 200,
                      fontFamily: fontHeading,
                    }}
                  >
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div 
                    className="text-sm mt-3 uppercase tracking-wider"
                    style={{ color: mutedColor }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'financials':
      return (
        <div className="mt-6 max-w-5xl">
          {content.bodyText && (
            <p 
              className="text-lg leading-relaxed mb-8"
              style={{ fontWeight: 300 }}
            >
              {content.bodyText}
            </p>
          )}
          {content.stats && content.stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
              {content.stats.map((stat, i) => (
                <div 
                  key={i} 
                  className="p-6 rounded-lg relative overflow-hidden"
                  style={{ 
                    backgroundColor: cardBg,
                    borderBottom: `2px solid ${accentColor}`,
                  }}
                >
                  <div 
                    className="text-sm uppercase tracking-wider mb-3"
                    style={{ color: mutedColor }}
                  >
                    {stat.label}
                  </div>
                  <div 
                    className="text-3xl md:text-4xl tracking-tight"
                    style={{ 
                      color: accentColor,
                      fontWeight: 300,
                      fontFamily: fontHeading,
                    }}
                  >
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                </div>
              ))}
            </div>
          )}
          {content.bullets && content.bullets.length > 0 && (
            <ul className="space-y-3 mt-8">
              {content.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-base">
                  <span 
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case 'timeline':
      return (
        <div className="mt-8 relative">
          {/* Timeline line */}
          <div 
            className="absolute left-4 top-0 bottom-0 w-px"
            style={{ backgroundColor: borderColor }}
          />
          <div className="space-y-8 pl-12">
            {content.bullets?.map((item, i) => (
              <div key={i} className="relative">
                {/* Timeline dot */}
                <div 
                  className="absolute -left-12 top-2 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ 
                    backgroundColor: accentColor,
                    color: schemeName === 'light' ? '#ffffff' : '#0a0a0a',
                    fontWeight: 500,
                  }}
                >
                  {i + 1}
                </div>
                <div 
                  className="p-5 rounded-lg"
                  style={{ backgroundColor: cardBg }}
                >
                  <p className="text-base" style={{ lineHeight: 1.6 }}>{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'closing':
      return (
        <div className="mt-8 text-center max-w-3xl mx-auto">
          {/* Decorative line */}
          <div 
            className="w-16 h-0.5 mx-auto mb-8"
            style={{ backgroundColor: accentColor }}
          />
          {content.bodyText && (
            <p 
              className="text-xl md:text-2xl leading-relaxed"
              style={{ 
                fontWeight: 300,
                lineHeight: 1.8,
              }}
            >
              {content.bodyText}
            </p>
          )}
          {content.bullets && content.bullets.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {content.bullets.map((item, i) => (
                <div 
                  key={i}
                  className="px-6 py-3 rounded-full text-sm"
                  style={{ 
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'disclaimer':
      return (
        <div className="mt-8 max-w-4xl">
          <div 
            className="p-8 rounded-lg border"
            style={{ 
              backgroundColor: cardBg,
              borderColor: borderColor,
            }}
          >
            {content.bodyText && (
              <p 
                className="text-sm md:text-base leading-relaxed"
                style={{ 
                  color: mutedColor,
                  lineHeight: 1.8,
                }}
              >
                {content.bodyText}
              </p>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}

export default SlideCanvas;
