import { useState, useEffect } from "react";
import { Palette, Image, Type, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BrandKit } from "@/types/presentations";
import { cn } from "@/lib/utils";

interface BrandKitEditorProps {
  brandKit: BrandKit | null;
  onSave: (brandKit: BrandKit) => void;
}

const DEFAULT_BRAND_KIT: BrandKit = {
  primaryColor: "#2563eb",
  secondaryColor: "#64748b",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  textColor: "#0f172a",
  mutedTextColor: "#64748b",
  footerText: "Confidencial",
  disclaimerText: "Este documento es confidencial y está destinado exclusivamente al destinatario. Queda prohibida su reproducción o distribución sin autorización expresa.",
};

const PRESET_THEMES = [
  {
    name: "Corporativo",
    colors: { primaryColor: "#2563eb", secondaryColor: "#475569", accentColor: "#3b82f6", backgroundColor: "#ffffff", textColor: "#0f172a", mutedTextColor: "#64748b" },
  },
  {
    name: "Elegante",
    colors: { primaryColor: "#0f172a", secondaryColor: "#1e293b", accentColor: "#c9a227", backgroundColor: "#ffffff", textColor: "#0f172a", mutedTextColor: "#475569" },
  },
  {
    name: "Moderno",
    colors: { primaryColor: "#6366f1", secondaryColor: "#8b5cf6", accentColor: "#ec4899", backgroundColor: "#fafafa", textColor: "#18181b", mutedTextColor: "#71717a" },
  },
  {
    name: "Oscuro",
    colors: { primaryColor: "#3b82f6", secondaryColor: "#6366f1", accentColor: "#22d3ee", backgroundColor: "#0f172a", textColor: "#f8fafc", mutedTextColor: "#94a3b8" },
  },
  {
    name: "Verde",
    colors: { primaryColor: "#059669", secondaryColor: "#0d9488", accentColor: "#10b981", backgroundColor: "#ffffff", textColor: "#064e3b", mutedTextColor: "#6b7280" },
  },
  {
    name: "Minimalista",
    colors: { primaryColor: "#18181b", secondaryColor: "#3f3f46", accentColor: "#18181b", backgroundColor: "#ffffff", textColor: "#18181b", mutedTextColor: "#a1a1aa" },
  },
];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded border cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function BrandKitEditor({ brandKit, onSave }: BrandKitEditorProps) {
  const [localKit, setLocalKit] = useState<BrandKit>(brandKit || DEFAULT_BRAND_KIT);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (brandKit) {
      setLocalKit(brandKit);
    }
  }, [brandKit]);

  const updateField = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => {
    setLocalKit(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setLocalKit(prev => ({ ...prev, ...preset.colors }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localKit);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalKit(DEFAULT_BRAND_KIT);
    setHasChanges(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <span className="font-medium">Brand Kit</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-3 w-3 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Preset themes */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Temas predefinidos
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "p-2 rounded border text-xs text-center transition-all hover:border-primary",
                    "flex flex-col items-center gap-1"
                  )}
                >
                  <div className="flex gap-0.5">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.colors.primaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.colors.secondaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.colors.accentColor }}
                    />
                  </div>
                  <span className="text-muted-foreground">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="colors">
            <TabsList className="w-full">
              <TabsTrigger value="colors" className="flex-1 gap-1">
                <Palette className="h-3 w-3" />
                Colores
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex-1 gap-1">
                <Image className="h-3 w-3" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 gap-1">
                <Type className="h-3 w-3" />
                Textos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="mt-4 space-y-4">
              <ColorInput
                label="Color primario"
                value={localKit.primaryColor}
                onChange={(v) => updateField("primaryColor", v)}
              />
              <ColorInput
                label="Color secundario"
                value={localKit.secondaryColor}
                onChange={(v) => updateField("secondaryColor", v)}
              />
              <ColorInput
                label="Color de acento"
                value={localKit.accentColor}
                onChange={(v) => updateField("accentColor", v)}
              />
              <Separator />
              <ColorInput
                label="Fondo"
                value={localKit.backgroundColor}
                onChange={(v) => updateField("backgroundColor", v)}
              />
              <ColorInput
                label="Texto principal"
                value={localKit.textColor}
                onChange={(v) => updateField("textColor", v)}
              />
              <ColorInput
                label="Texto secundario"
                value={localKit.mutedTextColor}
                onChange={(v) => updateField("mutedTextColor", v)}
              />
            </TabsContent>

            <TabsContent value="assets" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Logo principal (URL)</Label>
                <Input
                  value={localKit.logoUrl || ""}
                  onChange={(e) => updateField("logoUrl", e.target.value || undefined)}
                  placeholder="https://..."
                />
                {localKit.logoUrl && (
                  <div className="mt-2 p-4 bg-muted rounded flex items-center justify-center">
                    <img src={localKit.logoUrl} alt="Logo" className="max-h-16 object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Logo (fondo oscuro)</Label>
                <Input
                  value={localKit.logoDarkUrl || ""}
                  onChange={(e) => updateField("logoDarkUrl", e.target.value || undefined)}
                  placeholder="https://..."
                />
                {localKit.logoDarkUrl && (
                  <div className="mt-2 p-4 bg-slate-800 rounded flex items-center justify-center">
                    <img src={localKit.logoDarkUrl} alt="Logo dark" className="max-h-16 object-contain" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Fuente títulos</Label>
                <Input
                  value={localKit.fontHeading || ""}
                  onChange={(e) => updateField("fontHeading", e.target.value || undefined)}
                  placeholder="Inter, sans-serif"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fuente cuerpo</Label>
                <Input
                  value={localKit.fontBody || ""}
                  onChange={(e) => updateField("fontBody", e.target.value || undefined)}
                  placeholder="Inter, sans-serif"
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs">Texto de pie</Label>
                <Input
                  value={localKit.footerText || ""}
                  onChange={(e) => updateField("footerText", e.target.value || undefined)}
                  placeholder="Confidencial"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Texto disclaimer</Label>
                <Textarea
                  value={localKit.disclaimerText || ""}
                  onChange={(e) => updateField("disclaimerText", e.target.value || undefined)}
                  placeholder="Texto legal..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Live preview */}
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Vista previa
            </Label>
            <div
              className="rounded-lg border overflow-hidden aspect-video flex flex-col"
              style={{
                backgroundColor: localKit.backgroundColor,
                color: localKit.textColor,
              }}
            >
              <div className="flex-1 p-4 flex flex-col justify-center">
                {localKit.logoUrl && (
                  <img src={localKit.logoUrl} alt="Logo" className="h-6 mb-3 object-contain self-start" />
                )}
                <h3 
                  className="text-lg font-semibold mb-1"
                  style={{ fontFamily: localKit.fontHeading }}
                >
                  Título de ejemplo
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: localKit.mutedTextColor, fontFamily: localKit.fontBody }}
                >
                  Subtítulo con texto secundario
                </p>
                <div className="flex gap-2 mt-3">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: localKit.primaryColor }}
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: localKit.secondaryColor }}
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: localKit.accentColor }}
                  />
                </div>
              </div>
              <div
                className="px-4 py-2 text-[10px] border-t"
                style={{ color: localKit.mutedTextColor, borderColor: localKit.mutedTextColor + "30" }}
              >
                {localKit.footerText || "Confidencial"}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}