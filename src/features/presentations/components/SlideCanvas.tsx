import { cn } from "@/lib/utils";
import type { PresentationSlide, SlideContent, BrandKit } from "@/types/presentations";

interface SlideCanvasProps {
  slide: PresentationSlide;
  brandKit?: BrandKit | null;
  isPresenting?: boolean;
  className?: string;
}

export function SlideCanvas({ slide, brandKit, isPresenting = false, className }: SlideCanvasProps) {
  const content = slide.content as SlideContent;
  
  // Use slide-specific colors or fallback to brand kit
  const backgroundColor = slide.background_color || brandKit?.backgroundColor || undefined;
  const textColor = slide.text_color || brandKit?.textColor || undefined;
  const primaryColor = brandKit?.primaryColor || "hsl(var(--primary))";
  const mutedColor = brandKit?.mutedTextColor || "hsl(var(--muted-foreground))";
  const fontHeading = brandKit?.fontHeading;
  const fontBody = brandKit?.fontBody;
  const footerText = content.confidentialityText || brandKit?.footerText || "Confidencial";
  const logoUrl = content.logoUrl || brandKit?.logoUrl;
  
  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col",
        "bg-background text-foreground",
        isPresenting && "min-h-screen",
        className
      )}
      style={{
        backgroundColor,
        color: textColor,
        fontFamily: fontBody,
      }}
    >
      {/* Main content area with safe margins */}
      <div className="flex-1 flex flex-col justify-center px-[100px] py-[80px]">
        {/* Headline */}
        {slide.headline && (
          <h1 
            className="text-[48px] leading-[56px] tracking-tight mb-6"
            style={{ fontFamily: fontHeading }}
          >
            {slide.headline}
          </h1>
        )}
        
        {/* Subline */}
        {slide.subline && (
          <p 
            className="text-[24px] leading-[32px] mb-8"
            style={{ color: mutedColor }}
          >
            {slide.subline}
          </p>
        )}

        {/* Layout-specific content */}
        <SlideLayoutContent 
          layout={slide.layout} 
          content={content} 
          primaryColor={primaryColor}
          mutedColor={mutedColor}
          logoUrl={logoUrl}
          fontHeading={fontHeading}
        />
      </div>

      {/* Footer with slide number placeholder */}
      <div 
        className="absolute bottom-6 left-[100px] right-[100px] flex justify-between items-center text-xs"
        style={{ color: mutedColor }}
      >
        <span>{footerText}</span>
        <span>{content.footnote}</span>
      </div>
    </div>
  );
}

interface SlideLayoutContentProps {
  layout: string;
  content: SlideContent;
  primaryColor: string;
  mutedColor: string;
  logoUrl?: string;
  fontHeading?: string;
}

function SlideLayoutContent({ 
  layout, 
  content, 
  primaryColor, 
  mutedColor,
  logoUrl,
  fontHeading,
}: SlideLayoutContentProps) {
  switch (layout) {
    case 'title':
    case 'hero':
      return (
        <div className="flex-1 flex items-center justify-center">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="max-h-24 opacity-80" />
          )}
        </div>
      );

    case 'bullets':
      return (
        <ul className="space-y-4 mt-4">
          {content.bullets?.map((bullet, i) => (
            <li key={i} className="flex items-start gap-3 text-[18px] leading-[28px]">
              <span 
                className="w-2 h-2 rounded-full mt-2.5 shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      );

    case 'stats':
      return (
        <div className="grid grid-cols-3 gap-8 mt-8">
          {content.stats?.map((stat, i) => (
            <div key={i} className="text-center">
              <div 
                className="text-[56px] leading-none tracking-tight"
                style={{ color: primaryColor }}
              >
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div 
                className="text-[16px] mt-2"
                style={{ color: mutedColor }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      );

    case 'team':
      return (
        <div className="grid grid-cols-4 gap-8 mt-8">
          {content.teamMembers?.map((member, i) => (
            <div key={i} className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span 
                    className="text-2xl"
                    style={{ color: mutedColor }}
                  >
                    {member.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-[16px]">{member.name}</div>
              <div 
                className="text-[14px]"
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
            <div key={i}>
              <h3 
                className="text-[20px] mb-4 pb-2 border-b"
                style={{ fontFamily: fontHeading }}
              >
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-[16px]">
                    <span style={{ color: primaryColor }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 'overview':
    case 'market':
    case 'financials':
      return (
        <div className="mt-4">
          {content.bodyText && (
            <p className="text-[18px] leading-[28px] whitespace-pre-wrap">
              {content.bodyText}
            </p>
          )}
          {content.bullets && content.bullets.length > 0 && (
            <ul className="space-y-3 mt-6">
              {content.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-[18px]">
                  <span 
                    className="w-1.5 h-1.5 rounded-full mt-2.5 shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
          {content.stats && content.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-6 mt-8">
              {content.stats.map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
                  <div 
                    className="text-[32px] leading-none tracking-tight"
                    style={{ color: primaryColor }}
                  >
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div 
                    className="text-[14px] mt-2"
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

    case 'closing':
    case 'disclaimer':
      return (
        <div className="mt-8 text-center">
          {content.bodyText && (
            <p 
              className="text-[16px] leading-[24px] max-w-2xl mx-auto"
              style={{ color: mutedColor }}
            >
              {content.bodyText}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default SlideCanvas;