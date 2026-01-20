import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Loader2, AlertTriangle } from "lucide-react";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/hooks/useTranslateSlides";

interface TranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranslate: (targetLanguage: string) => void;
  isTranslating: boolean;
  slideCount: number;
  protectedSlideCount?: number;
}

export function TranslateDialog({
  open,
  onOpenChange,
  onTranslate,
  isTranslating,
  slideCount,
  protectedSlideCount = 0,
}: TranslateDialogProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | "">("");

  const handleTranslate = () => {
    if (!selectedLanguage) return;
    const language = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
    if (language) {
      onTranslate(language.label);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isTranslating) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setSelectedLanguage("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Traducir Presentación
          </DialogTitle>
          <DialogDescription>
            Traduce todas las diapositivas a otro idioma manteniendo el formato y los datos financieros intactos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="language">Idioma de destino</Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => setSelectedLanguage(value as LanguageCode)}
              disabled={isTranslating}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Selecciona un idioma" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diapositivas a traducir:</span>
              <span className="font-medium">{slideCount}</span>
            </div>
            {protectedSlideCount > 0 && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-xs">
                  {protectedSlideCount} diapositiva(s) aprobada(s) también serán traducidas. 
                  Usa el historial de versiones para restaurar si es necesario.
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Se preservarán:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>Números, porcentajes y cifras financieras</li>
              <li>Nombres de empresas y personas</li>
              <li>Formato y estructura de las diapositivas</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isTranslating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTranslate}
            disabled={!selectedLanguage || isTranslating}
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traduciendo...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Traducir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
