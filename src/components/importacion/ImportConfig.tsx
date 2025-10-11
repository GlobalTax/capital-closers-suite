import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ImportConfig } from "@/hooks/useImportacion";

interface ImportConfigProps {
  config: ImportConfig;
  onChange: (config: ImportConfig) => void;
}

export const ImportConfigComponent = ({ config, onChange }: ImportConfigProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>⚙️ Configuración</CardTitle>
        <CardDescription>
          Opciones de importación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-create">Crear empresas automáticamente</Label>
            <p className="text-sm text-muted-foreground">
              Si la empresa no existe, se creará durante la importación
            </p>
          </div>
          <Switch
            id="auto-create"
            checked={config.autoCrearEmpresas}
            onCheckedChange={(checked) =>
              onChange({ ...config, autoCrearEmpresas: checked })
            }
          />
        </div>

        <div className="space-y-3">
          <Label>Estrategia para duplicados</Label>
          <p className="text-sm text-muted-foreground">
            Qué hacer si ya existe una oportunidad con el mismo título y empresa
          </p>
          <RadioGroup
            value={config.estrategiaDuplicados}
            onValueChange={(value) =>
              onChange({ ...config, estrategiaDuplicados: value as any })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skip" id="skip" />
              <Label htmlFor="skip" className="font-normal cursor-pointer">
                <span className="font-medium">Omitir duplicados</span> - No importar si ya existe
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="create_new" id="create_new" />
              <Label htmlFor="create_new" className="font-normal cursor-pointer">
                <span className="font-medium">Permitir duplicados</span> - Crear siempre
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};
