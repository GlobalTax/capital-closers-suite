import { cn } from "@/lib/utils";
import type { PresentationSlide, SlideContent } from "@/types/presentations";

interface SlideCanvasProps {
  slide: PresentationSlide;
  isPresenting?: boolean;
  className?: string;
}

export function SlideCanvas({ slide, isPresenting = false, className }: SlideCanvasProps) {
  const content = slide.content as SlideContent;
  
  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col",
        "bg-background text-foreground",
        isPresenting && "min-h-screen",
        className
      )}
      style={{
        backgroundColor: slide.background_color || undefined,
        color: slide.text_color || undefined,
      }}
    >
      {/* Main content area with safe margins */}
      <div className="flex-1 flex flex-col justify-center px-[100px] py-[80px]">
        {/* Headline */}
        {slide.headline && (
          <h1 className="text-[48px] leading-[56px] tracking-tight mb-6">
            {slide.headline}
          </h1>
        )}
        
        {/* Subline */}
        {slide.subline && (
          <p className="text-[24px] leading-[32px] text-muted-foreground mb-8">
            {slide.subline}
          </p>
        )}

        {/* Layout-specific content */}
        <SlideLayoutContent layout={slide.layout} content={content} />
      </div>

      {/* Footer with slide number placeholder */}
      <div className="absolute bottom-6 left-[100px] right-[100px] flex justify-between items-center text-xs text-muted-foreground">
        <span>{content.confidentialityText || 'Confidencial'}</span>
        <span>{content.footnote}</span>
      </div>
    </div>
  );
}

function SlideLayoutContent({ layout, content }: { layout: string; content: SlideContent }) {
  switch (layout) {
    case 'title':
    case 'hero':
      return (
        <div className="flex-1 flex items-center justify-center">
          {content.logoUrl && (
            <img src={content.logoUrl} alt="Logo" className="max-h-24 opacity-80" />
          )}
        </div>
      );

    case 'bullets':
      return (
        <ul className="space-y-4 mt-4">
          {content.bullets?.map((bullet, i) => (
            <li key={i} className="flex items-start gap-3 text-[18px] leading-[28px]">
              <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
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
              <div className="text-[56px] leading-none tracking-tight text-primary">
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div className="text-[16px] text-muted-foreground mt-2">
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
                  <span className="text-2xl text-muted-foreground">
                    {member.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-[16px]">{member.name}</div>
              <div className="text-[14px] text-muted-foreground">{member.role}</div>
            </div>
          ))}
        </div>
      );

    case 'comparison':
      return (
        <div className="grid grid-cols-2 gap-12 mt-8">
          {content.columns?.map((column, i) => (
            <div key={i}>
              <h3 className="text-[20px] mb-4 pb-2 border-b">{column.title}</h3>
              <ul className="space-y-2">
                {column.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-[16px]">
                    <span className="text-primary">•</span>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case 'closing':
    case 'disclaimer':
      return (
        <div className="mt-8 text-center">
          {content.bodyText && (
            <p className="text-[16px] leading-[24px] text-muted-foreground max-w-2xl mx-auto">
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
