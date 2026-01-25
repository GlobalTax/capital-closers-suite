import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, Compass, FileText, Building2, Files, 
  CheckSquare, BarChart3, HelpCircle, ChevronRight 
} from 'lucide-react';
import type { HelpSection } from '@/types/help';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Compass,
  FileText,
  Building2,
  Files,
  CheckSquare,
  BarChart3,
  HelpCircle,
};

interface HelpSidebarProps {
  sections: HelpSection[];
  className?: string;
}

export function HelpSidebar({ sections, className }: HelpSidebarProps) {
  const { slug } = useParams<{ slug?: string }>();
  const activeSlug = slug || sections[0]?.slug;

  return (
    <aside className={cn("w-64 flex-shrink-0", className)}>
      <div className="sticky top-0">
        <div className="pb-4 mb-4 border-b">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Manual
          </h2>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <nav className="space-y-1 pr-4">
            {sections.map((section) => {
              const Icon = section.icon ? iconMap[section.icon] : FileText;
              const isActive = activeSlug === section.slug;
              
              return (
                <div key={section.id}>
                  <Link
                    to={`/ayuda/${section.slug}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                    <span className="truncate">{section.title}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </Link>
                  
                  {/* Render children if any */}
                  {section.children && section.children.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.children.map((child) => {
                        const isChildActive = activeSlug === child.slug;
                        return (
                          <Link
                            key={child.id}
                            to={`/ayuda/${child.slug}`}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                              isChildActive 
                                ? "bg-primary/10 text-primary font-medium" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                            <span className="truncate">{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}
