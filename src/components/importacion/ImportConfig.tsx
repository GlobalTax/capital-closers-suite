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
        <CardTitle>⚙️ Configuración de Importación</CardTitle>
        <CardDescription>
          Personaliza cómo se procesarán los datos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-create">Crear empresas automáticamente</Label>
            <p className="text-sm text-muted-foreground">
              Si una empresa no existe, crearla durante la importación
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

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="validate-cif">Validar formato CIF</Label>
            <p className="text-sm text-muted-foreground">
              Verificar que los CIFs tengan formato válido español
            </p>
          </div>
          <Switch
            id="validate-cif"
            checked={config.validarCIF}
            onCheckedChange={(checked) =>
              onChange({ ...config, validarCIF: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sync-brevo">Sincronizar con Brevo</Label>
            <p className="text-sm text-muted-foreground">
              Enviar contactos a Brevo automáticamente
            </p>
          </div>
          <Switch
            id="sync-brevo"
            checked={config.sincronizarBrevo}
            onCheckedChange={(checked) =>
              onChange({ ...config, sincronizarBrevo: checked })
            }
          />
        </div>

        <div className="space-y-3">
          <Label>Estrategia para duplicados</Label>
          <RadioGroup
            value={config.estrategiaDuplicados}
            onValueChange={(value) =>
              onChange({ ...config, estrategiaDuplicados: value as any })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skip" id="skip" />
              <Label htmlFor="skip" className="font-normal cursor-pointer">
                <span className="font-medium">Omitir</span> - No importar registros duplicados
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="update" id="update" />
              <Label htmlFor="update" className="font-normal cursor-pointer">
                <span className="font-medium">Actualizar</span> - Sobrescribir datos existentes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="create_new" id="create_new" />
              <Label htmlFor="create_new" className="font-normal cursor-pointer">
                <span className="font-medium">Crear nuevo</span> - Permitir duplicados
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};
