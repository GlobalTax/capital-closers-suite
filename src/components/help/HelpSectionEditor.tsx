import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  X, 
  Eye, 
  History, 
  Loader2,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2
} from 'lucide-react';
import { useHelpEditor, useHelpVersions } from '@/hooks/useHelpEditor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { HelpVersionsDialog } from './HelpVersionsDialog';
import type { HelpSection } from '@/types/help';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface HelpSectionEditorProps {
  section: HelpSection;
  onClose: () => void;
}

export function HelpSectionEditor({ section, onClose }: HelpSectionEditorProps) {
  const { updateSection } = useHelpEditor();
  const [title, setTitle] = useState(section.title);
  const [contentMd, setContentMd] = useState(section.content_md);
  const [description, setDescription] = useState(section.description || '');
  const [isPublished, setIsPublished] = useState(section.is_published);
  const [showVersions, setShowVersions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const debouncedContent = useDebounce(contentMd, 30000); // Auto-save after 30s of no changes

  // Track changes
  useEffect(() => {
    const changed = 
      title !== section.title || 
      contentMd !== section.content_md ||
      description !== (section.description || '') ||
      isPublished !== section.is_published;
    setHasChanges(changed);
  }, [title, contentMd, description, isPublished, section]);

  // Auto-save with debounce
  useEffect(() => {
    if (hasChanges && debouncedContent === contentMd) {
      handleSave();
    }
  }, [debouncedContent]);

  const handleSave = useCallback(() => {
    updateSection.mutate({
      id: section.id,
      data: {
        title,
        content_md: contentMd,
        description: description || null,
        is_published: isPublished,
      }
    }, {
      onSuccess: () => {
        setHasChanges(false);
        setLastSaved(new Date());
      }
    });
  }, [section.id, title, contentMd, description, isPublished, updateSection]);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = contentMd.substring(start, end);
    const newText = contentMd.substring(0, start) + before + selectedText + after + contentMd.substring(end);
    
    setContentMd(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleRestoreVersion = (content: string, versionTitle: string) => {
    setTitle(versionTitle);
    setContentMd(content);
    setShowVersions(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Editar Sección</h2>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Guardado: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowVersions(true)}
          >
            <History className="h-4 w-4 mr-1" />
            Versiones
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!hasChanges || updateSection.isPending}
          >
            {updateSection.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la sección"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
        />
        <Label htmlFor="published">Publicado</Label>
      </div>

      <Separator />

      {/* Markdown Toolbar */}
      <div className="flex items-center gap-1 p-2 border rounded-lg bg-muted/50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => insertMarkdown('**', '**')}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => insertMarkdown('*', '*')}
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => insertMarkdown('# ')}
          title="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => insertMarkdown('## ')}
          title="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => insertMarkdown('- ')}
          title="Lista"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => insertMarkdown('1. ')}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => insertMarkdown('[', '](url)')}
          title="Enlace"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => insertMarkdown('`', '`')}
          title="Código"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      {/* Split View: Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[500px]">
        {/* Editor */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Markdown
          </Label>
          <Textarea
            id="content-editor"
            value={contentMd}
            onChange={(e) => setContentMd(e.target.value)}
            placeholder="Escribe tu contenido en Markdown..."
            className="min-h-[450px] font-mono text-sm resize-none"
          />
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Vista Previa
          </Label>
          <Card className="min-h-[450px] overflow-auto">
            <CardContent className="pt-4">
              <MarkdownRenderer content={contentMd} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Versions Dialog */}
      <HelpVersionsDialog 
        open={showVersions}
        onOpenChange={setShowVersions}
        sectionId={section.id}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
}
