import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Send,
  Save,
  ChevronDown,
  Settings2,
  Building2,
  FileText,
  Eye,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PSHPlantillaSelector } from "./PSHPlantillaSelector";
import { PSHAlcanceDialog } from "./PSHAlcanceDialog";
import {
  AREAS_DD,
  CLAUSULAS_DEFAULT,
  CONDICIONES_PAGO_PRESETS,
  type AlcanceDD,
  type AlcanceAreaDD,
  type AreaDD,
  type PSHPlantilla,
  type ClausulasAdicionales,
} from "@/types/psh";
import { calcularTotalDD } from "@/services/psh.service";
import type { PropuestaHonorarios } from "@/types/propuestas";

const formSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion_transaccion: z.string().optional(),
  cliente_nombre: z.string().optional(),
  cliente_cif: z.string().optional(),
  cliente_domicilio: z.string().optional(),
  target_nombre: z.string().optional(),
  target_cif: z.string().optional(),
  target_domicilio: z.string().optional(),
  honorarios_negociacion: z.number().min(0).optional(),
  fecha_vencimiento: z.date().optional(),
  condiciones_pago: z.string().optional(),
  notas_internas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevaPSHDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propuesta?: PropuestaHonorarios | null;
  version: number;
  onSave: (data: Partial<PropuestaHonorarios>, enviar: boolean) => void;
  onPreviewPDF?: (data: Partial<PropuestaHonorarios>) => void;
  isLoading?: boolean;
}

export function NuevaPSHDrawer({
  open,
  onOpenChange,
  propuesta,
  version,
  onSave,
  onPreviewPDF,
  isLoading,
}: NuevaPSHDrawerProps) {
  const [selectedPlantilla, setSelectedPlantilla] = useState<PSHPlantilla | null>(null);
  const [alcanceDD, setAlcanceDD] = useState<AlcanceDD>({});
  const [clausulas, setClausulas] = useState<ClausulasAdicionales>(CLAUSULAS_DEFAULT);
  const [alcanceDialogOpen, setAlcanceDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaDD | null>(null);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    partes: true,
    transaccion: true,
    alcance: true,
    negociacion: false,
    pago: false,
    clausulas: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion_transaccion: "",
      cliente_nombre: "",
      cliente_cif: "",
      cliente_domicilio: "",
      target_nombre: "",
      target_cif: "",
      target_domicilio: "",
      honorarios_negociacion: 0,
      condiciones_pago: "",
      notas_internas: "",
    },
  });

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedPlantilla(null);
      setAlcanceDD({});
      setClausulas(CLAUSULAS_DEFAULT);
    }
  }, [open]);

  // Apply plantilla when selected
  const handlePlantillaSelect = (plantilla: PSHPlantilla) => {
    setSelectedPlantilla(plantilla);
    setAlcanceDD(plantilla.alcance_default || {});
    if (plantilla.condiciones_pago_default) {
      form.setValue("condiciones_pago", plantilla.condiciones_pago_default);
    }
    if (plantilla.clausulas_default) {
      setClausulas({ ...CLAUSULAS_DEFAULT, ...plantilla.clausulas_default });
    }
    form.setValue("titulo", `Propuesta ${plantilla.nombre}`);
  };

  // Toggle area DD inclusion
  const toggleAreaDD = (area: AreaDD) => {
    setAlcanceDD((prev) => ({
      ...prev,
      [area]: {
        ...prev[area],
        incluido: !prev[area]?.incluido,
        importe: prev[area]?.importe || 0,
        alcance: prev[area]?.alcance || [],
      },
    }));
  };

  // Update area importe
  const updateAreaImporte = (area: AreaDD, importe: number) => {
    setAlcanceDD((prev) => ({
      ...prev,
      [area]: {
        ...prev[area],
        incluido: prev[area]?.incluido ?? false,
        importe,
        alcance: prev[area]?.alcance || [],
      },
    }));
  };

  // Open alcance dialog
  const openAlcanceConfig = (area: AreaDD) => {
    setEditingArea(area);
    setAlcanceDialogOpen(true);
  };

  // Save alcance from dialog
  const handleSaveAlcance = (alcance: AlcanceAreaDD) => {
    if (editingArea) {
      setAlcanceDD((prev) => ({
        ...prev,
        [editingArea]: alcance,
      }));
    }
  };

  // Calculate totals
  const totalDD = calcularTotalDD(alcanceDD);
  const honorariosNegociacion = form.watch("honorarios_negociacion") || 0;
  const totalGeneral = totalDD + honorariosNegociacion;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  const handleSubmit = (values: FormValues, enviar: boolean) => {
    const data: Partial<PropuestaHonorarios> = {
      ...values,
      version,
      alcance_dd: alcanceDD as any,
      clausulas_adicionales: clausulas as any,
      importe_total: totalGeneral,
      plantilla_tipo: selectedPlantilla?.tipo_servicio,
      fecha_vencimiento: values.fecha_vencimiento
        ? format(values.fecha_vencimiento, "yyyy-MM-dd")
        : undefined,
      // Build desglose from alcance
      desglose: Object.entries(alcanceDD)
        .filter(([_, area]) => area?.incluido)
        .map(([key, area]) => ({
          concepto: AREAS_DD[key as AreaDD]?.label || key,
          descripcion: area?.alcance?.join(", "),
          importe: area?.importe || 0,
        }))
        .concat(
          honorariosNegociacion > 0
            ? [{ concepto: "Negociación y cierre", descripcion: "Asesoramiento en SPA", importe: honorariosNegociacion }]
            : []
        ),
    };
    onSave(data, enviar);
  };

  const handlePreview = () => {
    const values = form.getValues();
    const data = {
      titulo: values.titulo,
      descripcion_transaccion: values.descripcion_transaccion,
      cliente_nombre: values.cliente_nombre,
      cliente_cif: values.cliente_cif,
      cliente_domicilio: values.cliente_domicilio,
      target_nombre: values.target_nombre,
      target_cif: values.target_cif,
      target_domicilio: values.target_domicilio,
      condiciones_pago: values.condiciones_pago,
      notas_internas: values.notas_internas,
      fecha_vencimiento: values.fecha_vencimiento 
        ? values.fecha_vencimiento.toISOString().split('T')[0] 
        : undefined,
      version,
      alcance_dd: alcanceDD,
      clausulas_adicionales: clausulas,
      importe_total: totalGeneral,
      plantilla_tipo: selectedPlantilla?.tipo_servicio,
      desglose: Object.entries(alcanceDD)
        .filter(([_, area]) => area?.incluido)
        .map(([key, area]) => ({
          concepto: AREAS_DD[key as AreaDD]?.label || key,
          descripcion: area?.alcance?.join(", "),
          importe: area?.importe || 0,
        })),
    };
    onPreviewPDF?.(data as Partial<PropuestaHonorarios>);
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle>
              {propuesta
                ? `Editar PSH v${propuesta.version}`
                : `Nueva Propuesta de Servicios y Honorarios v${version}`}
            </DrawerTitle>
          </DrawerHeader>

          <ScrollArea className="flex-1 px-4">
            <Form {...form}>
              <form className="space-y-4 pb-4">
                {/* Template Selector */}
                {!propuesta && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Seleccionar plantilla</Label>
                    <PSHPlantillaSelector
                      selectedId={selectedPlantilla?.id}
                      onSelect={handlePlantillaSelect}
                    />
                  </div>
                )}

                <Separator />

                {/* Section 1: Parties */}
                <Collapsible open={openSections.partes} onOpenChange={() => toggleSection("partes")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">1. Identificación de las partes</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openSections.partes && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cliente */}
                      <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                        <Label className="text-sm font-medium">Cliente (Comprador)</Label>
                        <FormField
                          control={form.control}
                          name="cliente_nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Razón social" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cliente_cif"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="CIF" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cliente_domicilio"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Domicilio" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Target */}
                      <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                        <Label className="text-sm font-medium">Target (Empresa a adquirir)</Label>
                        <FormField
                          control={form.control}
                          name="target_nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Razón social" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="target_cif"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="CIF" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="target_domicilio"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Domicilio" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Section 2: Transaction */}
                <Collapsible open={openSections.transaccion} onOpenChange={() => toggleSection("transaccion")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">2. Descripción de la transacción</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openSections.transaccion && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título de la propuesta *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Propuesta Due Diligence - Adquisición Target" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descripcion_transaccion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción de la operación</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describa la transacción objeto de la propuesta..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Section 3: DD Scope */}
                <Collapsible open={openSections.alcance} onOpenChange={() => toggleSection("alcance")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">3. Alcance de Due Diligence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">
                        {formatCurrency(totalDD)}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          openSections.alcance && "rotate-180"
                        )}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {(Object.keys(AREAS_DD) as AreaDD[]).map((area) => {
                      const areaConfig = AREAS_DD[area];
                      const areaData = alcanceDD[area];
                      const isIncluido = areaData?.incluido ?? false;

                      return (
                        <div
                          key={area}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            isIncluido ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                          )}
                        >
                          <Checkbox
                            id={area}
                            checked={isIncluido}
                            onCheckedChange={() => toggleAreaDD(area)}
                          />
                          <Label htmlFor={area} className="flex-1 cursor-pointer">
                            {areaConfig.label}
                          </Label>
                          <Input
                            type="number"
                            className="w-24"
                            placeholder="€"
                            value={areaData?.importe || ""}
                            onChange={(e) =>
                              updateAreaImporte(area, parseFloat(e.target.value) || 0)
                            }
                            disabled={!isIncluido}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openAlcanceConfig(area)}
                            disabled={!isIncluido}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Section 4: Negotiation */}
                <Collapsible open={openSections.negociacion} onOpenChange={() => toggleSection("negociacion")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                    <span className="font-medium">4. Negociación y cierre (SPA)</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openSections.negociacion && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="honorarios_negociacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Honorarios por negociación y cierre (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Section 5: Payment */}
                <Collapsible open={openSections.pago} onOpenChange={() => toggleSection("pago")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                    <span className="font-medium">5. Condiciones de pago</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openSections.pago && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="flex flex-wrap gap-2">
                      {CONDICIONES_PAGO_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("condiciones_pago", preset.value)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    <FormField
                      control={form.control}
                      name="condiciones_pago"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Describa las condiciones de pago..."
                              className="min-h-[60px]"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fecha_vencimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de validez</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "d/MM/yyyy") : "Seleccionar..."}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Section 6: Legal Clauses */}
                <Collapsible open={openSections.clausulas} onOpenChange={() => toggleSection("clausulas")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                    <span className="font-medium">6. Cláusulas legales</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openSections.clausulas && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="limitacion"
                        checked={clausulas.limitacion_responsabilidad}
                        onCheckedChange={(checked) =>
                          setClausulas((prev) => ({ ...prev, limitacion_responsabilidad: !!checked }))
                        }
                      />
                      <Label htmlFor="limitacion" className="cursor-pointer">
                        Limitación de responsabilidad (máximo honorarios percibidos)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="confidencialidad"
                        checked={clausulas.confidencialidad}
                        onCheckedChange={(checked) =>
                          setClausulas((prev) => ({ ...prev, confidencialidad: !!checked }))
                        }
                      />
                      <Label htmlFor="confidencialidad" className="cursor-pointer">
                        Cláusula de confidencialidad
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Ley aplicable</Label>
                        <Select
                          value={clausulas.ley_aplicable}
                          onValueChange={(v) => setClausulas((prev) => ({ ...prev, ley_aplicable: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="española">Ley española</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Jurisdicción</Label>
                        <Select
                          value={clausulas.jurisdiccion}
                          onValueChange={(v) => setClausulas((prev) => ({ ...prev, jurisdiccion: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Barcelona">Barcelona</SelectItem>
                            <SelectItem value="Madrid">Madrid</SelectItem>
                            <SelectItem value="Valencia">Valencia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Internal notes */}
                <FormField
                  control={form.control}
                  name="notas_internas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas internas (no visibles al cliente)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas para uso interno..."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Total */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Propuesta</span>
                    <span className="text-2xl font-medium text-primary">
                      {formatCurrency(totalGeneral)}
                    </span>
                  </div>
                </div>
              </form>
            </Form>
          </ScrollArea>

          <DrawerFooter className="flex-row gap-2">
            {onPreviewPDF && (
              <Button variant="outline" onClick={handlePreview} disabled={isLoading}>
                <Eye className="h-4 w-4 mr-2" />
                Vista previa
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={form.handleSubmit((v) => handleSubmit(v, false))}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar borrador
            </Button>
            <Button
              className="flex-1"
              onClick={form.handleSubmit((v) => handleSubmit(v, true))}
              disabled={isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar propuesta
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Alcance Dialog */}
      {editingArea && (
        <PSHAlcanceDialog
          open={alcanceDialogOpen}
          onOpenChange={setAlcanceDialogOpen}
          area={editingArea}
          alcance={alcanceDD[editingArea] || { incluido: false, importe: 0, alcance: [] }}
          onSave={handleSaveAlcance}
        />
      )}
    </>
  );
}
