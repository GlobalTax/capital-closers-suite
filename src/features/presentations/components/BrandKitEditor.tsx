import { useState, useEffect } from "react";
import { Palette, Image, Type, Save, RotateCcw, Sparkles } from "lucide-react";
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
  primaryColor: "#1e3a5f",
  secondaryColor: "#64748b",
  accentColor: "#d4a853",
  backgroundColor: "#ffffff",
  textColor: "#0f172a",
  mutedTextColor: "#64748b",
  footerText: "CONFIDENTIAL",
  disclaimerText: "This document is confidential and intended solely for the recipient. Reproduction or distribution without express authorization is prohibited.",
};

// Premium M&A-grade themes
const PRESET_THEMES = [
  {
    name: "Investment Navy",
    description: "Goldman Sachs style",
    preview: "linear-gradient(135deg, #0c1929 0%, #1a365d 100%)",
    colors: { 
      primaryColor: "#1a365d", 
      secondaryColor: "#2d4a6f", 
      accentColor: "#d4a853", 
      backgroundColor: "linear-gradient(135deg, #0c1929 0%, #1a365d 100%)", 
      textColor: "#ffffff", 
      mutedTextColor: "rgba(255,255,255,0.7)" 
    },
  },
  {
    name: "Executive Dark",
    description: "McKinsey style",
    preview: "linear-gradient(180deg, #0a0a0a 0%, #171717 100%)",
    colors: { 
      primaryColor: "#171717", 
      secondaryColor: "#262626", 
      accentColor: "#22c55e", 
      backgroundColor: "linear-gradient(180deg, #0a0a0a 0%, #171717 100%)", 
      textColor: "#fafafa", 
      mutedTextColor: "rgba(250,250,250,0.6)" 
    },
  },
  {
    name: "Clean White",
    description: "Minimalist corporate",
    preview: "#ffffff",
    colors: { 
      primaryColor: "#1e3a5f", 
      secondaryColor: "#475569", 
      accentColor: "#1e3a5f", 
      backgroundColor: "#ffffff", 
      textColor: "#0f172a", 
      mutedTextColor: "#64748b" 
    },
  },
  {
    name: "Emerald Private",
    description: "Private equity style",
    preview: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
    colors: { 
      primaryColor: "#064e3b", 
      secondaryColor: "#065f46", 
      accentColor: "#6ee7b7", 
      backgroundColor: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)", 
      textColor: "#ffffff", 
      mutedTextColor: "rgba(255,255,255,0.7)" 
    },
  },
  {
    name: "Burgundy M&A",
    description: "Classic advisory",
    preview: "linear-gradient(135deg, #1a0a0a 0%, #4a1c1c 100%)",
    colors: { 
      primaryColor: "#4a1c1c", 
      secondaryColor: "#5c2424", 
      accentColor: "#f5d0a9", 
      backgroundColor: "linear-gradient(135deg, #1a0a0a 0%, #4a1c1c 100%)", 
      textColor: "#ffffff", 
      mutedTextColor: "rgba(255,255,255,0.7)" 
    },
  },
  {
    name: "Steel Blue",
    description: "Modern institutional",
    preview: "linear-gradient(135deg, #0f1419 0%, #1e3a5f 100%)",
    colors: { 
      primaryColor: "#1e3a5f", 
      secondaryColor: "#2d4a6f", 
      accentColor: "#60a5fa", 
      backgroundColor: "linear-gradient(135deg, #0f1419 0%, #1e3a5f 100%)", 
      textColor: "#ffffff", 
      mutedTextColor: "rgba(255,255,255,0.7)" 
    },
  },
];

function ColorInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const isGradient = value.includes("gradient");
  
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">
        {!isGradient && (
          <div className="relative">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
          </div>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000 or linear-gradient(...)"
          className="flex-1 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function BrandKitEditor({ brandKit, onSave }: BrandKitEditorProps) {
  const [localKit, setLocalKit] = useState<BrandKit>(brandKit || DEFAULT_BRAND_KIT);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (brandKit) {
      setLocalKit(brandKit);
    }
  }, [brandKit]);

  const updateField = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => {
    setLocalKit(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSelectedPreset(null);
  };

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setLocalKit(prev => ({ ...prev, ...preset.colors }));
    setHasChanges(true);
    setSelectedPreset(preset.name);
  };

  const handleSave = () => {
    onSave(localKit);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalKit(DEFAULT_BRAND_KIT);
    setHasChanges(true);
    setSelectedPreset(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="font-medium">Premium Themes</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-3 w-3 mr-1" />
            Apply
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Premium preset themes */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              M&A-Grade Themes
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all hover:border-primary group",
                    selectedPreset === preset.name && "border-primary ring-1 ring-primary"
                  )}
                >
                  <div 
                    className="w-full h-12 rounded-md mb-2 shadow-inner"
                    style={{ background: preset.preview }}
                  />
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: preset.colors.accentColor }}
                    />
                    <span className="text-xs font-medium">{preset.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="colors">
            <TabsList className="w-full">
              <TabsTrigger value="colors" className="flex-1 gap-1">
                <Palette className="h-3 w-3" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex-1 gap-1">
                <Image className="h-3 w-3" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 gap-1">
                <Type className="h-3 w-3" />
                Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="mt-4 space-y-4">
              <ColorInput
                label="Background"
                value={localKit.backgroundColor}
                onChange={(v) => updateField("backgroundColor", v)}
                hint="Supports gradients: linear-gradient(135deg, #000 0%, #333 100%)"
              />
              <ColorInput
                label="Accent Color"
                value={localKit.accentColor}
                onChange={(v) => updateField("accentColor", v)}
                hint="Used for highlights, stats, and decorative elements"
              />
              <Separator />
              <ColorInput
                label="Text Color"
                value={localKit.textColor}
                onChange={(v) => updateField("textColor", v)}
              />
              <ColorInput
                label="Muted Text"
                value={localKit.mutedTextColor}
                onChange={(v) => updateField("mutedTextColor", v)}
              />
              <Separator />
              <ColorInput
                label="Primary Color"
                value={localKit.primaryColor}
                onChange={(v) => updateField("primaryColor", v)}
              />
              <ColorInput
                label="Secondary Color"
                value={localKit.secondaryColor}
                onChange={(v) => updateField("secondaryColor", v)}
              />
            </TabsContent>

            <TabsContent value="assets" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Logo URL (light backgrounds)</Label>
                <Input
                  value={localKit.logoUrl || ""}
                  onChange={(e) => updateField("logoUrl", e.target.value || undefined)}
                  placeholder="https://..."
                />
                {localKit.logoUrl && (
                  <div className="mt-2 p-4 bg-white rounded border flex items-center justify-center">
                    <img src={localKit.logoUrl} alt="Logo" className="max-h-12 object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Logo URL (dark backgrounds)</Label>
                <Input
                  value={localKit.logoDarkUrl || ""}
                  onChange={(e) => updateField("logoDarkUrl", e.target.value || undefined)}
                  placeholder="https://..."
                />
                {localKit.logoDarkUrl && (
                  <div className="mt-2 p-4 bg-slate-900 rounded flex items-center justify-center">
                    <img src={localKit.logoDarkUrl} alt="Logo dark" className="max-h-12 object-contain" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Heading Font</Label>
                <Input
                  value={localKit.fontHeading || ""}
                  onChange={(e) => updateField("fontHeading", e.target.value || undefined)}
                  placeholder="'Inter', sans-serif"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Body Font</Label>
                <Input
                  value={localKit.fontBody || ""}
                  onChange={(e) => updateField("fontBody", e.target.value || undefined)}
                  placeholder="'Inter', sans-serif"
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs">Footer Text</Label>
                <Input
                  value={localKit.footerText || ""}
                  onChange={(e) => updateField("footerText", e.target.value || undefined)}
                  placeholder="CONFIDENTIAL"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Disclaimer Text</Label>
                <Textarea
                  value={localKit.disclaimerText || ""}
                  onChange={(e) => updateField("disclaimerText", e.target.value || undefined)}
                  placeholder="Legal disclaimer..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Live preview */}
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Live Preview
            </Label>
            <div
              className="rounded-lg border overflow-hidden aspect-video flex flex-col relative"
              style={{
                background: localKit.backgroundColor,
                color: localKit.textColor,
              }}
            >
              {/* Decorative corner */}
              <div 
                className="absolute top-0 right-0 w-20 h-20 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${localKit.accentColor} 0%, transparent 70%)`,
                }}
              />
              
              <div className="flex-1 p-4 flex flex-col justify-center">
                {localKit.logoUrl && (
                  <img src={localKit.logoUrl} alt="Logo" className="h-4 mb-3 object-contain self-start opacity-80" />
                )}
                <div 
                  className="w-8 h-0.5 mb-2"
                  style={{ backgroundColor: localKit.accentColor }}
                />
                <h3 
                  className="text-base mb-1"
                  style={{ fontFamily: localKit.fontHeading, fontWeight: 300 }}
                >
                  Investment Highlights
                </h3>
                <p 
                  className="text-[10px]"
                  style={{ color: localKit.mutedTextColor, fontFamily: localKit.fontBody }}
                >
                  Premium M&A presentation design
                </p>
                <div className="flex gap-3 mt-3">
                  <div 
                    className="px-2 py-1 rounded text-[8px] flex items-center gap-1"
                    style={{ 
                      backgroundColor: `${localKit.accentColor}20`,
                      borderLeft: `2px solid ${localKit.accentColor}`,
                    }}
                  >
                    <span style={{ color: localKit.accentColor, fontWeight: 500 }}>€25M</span>
                    <span style={{ color: localKit.mutedTextColor }}>REVENUE</span>
                  </div>
                  <div 
                    className="px-2 py-1 rounded text-[8px] flex items-center gap-1"
                    style={{ 
                      backgroundColor: `${localKit.accentColor}20`,
                      borderLeft: `2px solid ${localKit.accentColor}`,
                    }}
                  >
                    <span style={{ color: localKit.accentColor, fontWeight: 500 }}>32%</span>
                    <span style={{ color: localKit.mutedTextColor }}>GROWTH</span>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div
                className="px-4 py-1.5 text-[8px] uppercase tracking-widest flex justify-between"
                style={{ color: localKit.mutedTextColor }}
              >
                <span>{localKit.footerText || "CONFIDENTIAL"}</span>
                <span>1/8</span>
              </div>
              
              {/* Bottom accent line */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${localKit.accentColor} 50%, transparent 100%)`,
                  opacity: 0.5,
                }}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
