import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Loader2, BookOpen, Menu, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  HelpSidebar, 
  HelpSearchDialog, 
  HelpNavigation, 
  MarkdownRenderer,
  HelpSectionEditor
} from '@/components/help';
import { useHelpCenter, useHelpSection } from '@/hooks/useHelpCenter';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
export default function Ayuda() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { isAdmin, isSuperAdmin } = useSimpleAuth();
  const canEdit = isAdmin || isSuperAdmin;
  
  const { sections, flatSections, isLoading: sectionsLoading } = useHelpCenter();
  
  // Redirect to first section if no slug
  useEffect(() => {
    if (!slug && flatSections.length > 0) {
      navigate(`/ayuda/${flatSections[0].slug}`, { replace: true });
    }
  }, [slug, flatSections, navigate]);
  
  const currentSlug = slug || flatSections[0]?.slug;
  const { data: currentSection, isLoading: sectionLoading } = useHelpSection(currentSlug || '');
  
  // Close mobile menu when section changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentSlug]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (sectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <HelpSidebar sections={sections} />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Centro de Ayuda</h1>
              
              {/* Edit button for admins */}
              {canEdit && !isEditing && currentSection && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="ml-4"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
            
            <div className="flex-1 max-w-md ml-auto">
              <div 
                className="relative cursor-pointer"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en el manual... (Ctrl+/)"
                  className="pl-10 cursor-pointer"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Sidebar - hidden on mobile */}
          <div className="hidden lg:block">
            <HelpSidebar sections={sections} />
          </div>
          
          {/* Content */}
          <main className="flex-1 min-w-0">
            {sectionLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : currentSection ? (
              isEditing ? (
                <HelpSectionEditor 
                  section={currentSection}
                  onClose={() => setIsEditing(false)}
                />
              ) : (
                <div className="max-w-3xl">
                  <MarkdownRenderer content={currentSection.content_md} />
                  <HelpNavigation 
                    currentSlug={currentSlug || ''} 
                    sections={flatSections} 
                  />
                </div>
              )
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sección no encontrada</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Search dialog */}
      <HelpSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
