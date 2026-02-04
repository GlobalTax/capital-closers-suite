import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useCreateCorporateBuyer, useUpdateCorporateBuyer, useBuyerSourceTags } from "@/hooks/queries/useCorporateBuyers";
import type { CorporateBuyer, CreateCorporateBuyerInput } from "@/types/corporateBuyers";
import { BUYER_TYPE_OPTIONS } from "@/types/corporateBuyers";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  buyer_type: z.enum(["corporate", "holding", "family_office", "strategic_buyer"], {
    required_error: "Selecciona un tipo",
  }),
  source_tag_id: z.string().min(1, "Selecciona un origen"),
  country_base: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  description: z.string().optional(),
  sector_focus: z.string().optional(),
  geography_focus: z.string().optional(),
  revenue_min: z.coerce.number().optional(),
  revenue_max: z.coerce.number().optional(),
  ebitda_min: z.coerce.number().optional(),
  ebitda_max: z.coerce.number().optional(),
  deal_size_min: z.coerce.number().optional(),
  deal_size_max: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CorporateBuyerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buyer?: CorporateBuyer | null;
}

export function CorporateBuyerDrawer({ open, onOpenChange, buyer }: CorporateBuyerDrawerProps) {
  const isEditing = !!buyer;
  const { data: sourceTags, isLoading: loadingTags } = useBuyerSourceTags();
  const createMutation = useCreateCorporateBuyer();
  const updateMutation = useUpdateCorporateBuyer();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: buyer?.name || "",
      buyer_type: buyer?.buyer_type || undefined,
      source_tag_id: buyer?.source_tag_id || "",
      country_base: buyer?.country_base || "",
      website: buyer?.website || "",
      description: buyer?.description || "",
      sector_focus: buyer?.sector_focus?.join(", ") || "",
      geography_focus: buyer?.geography_focus?.join(", ") || "",
      revenue_min: buyer?.revenue_min || undefined,
      revenue_max: buyer?.revenue_max || undefined,
      ebitda_min: buyer?.ebitda_min || undefined,
      ebitda_max: buyer?.ebitda_max || undefined,
      deal_size_min: buyer?.deal_size_min || undefined,
      deal_size_max: buyer?.deal_size_max || undefined,
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: FormValues) => {
    const input: CreateCorporateBuyerInput = {
      name: values.name,
      buyer_type: values.buyer_type,
      source_tag_id: values.source_tag_id,
      country_base: values.country_base || null,
      website: values.website || null,
      description: values.description || null,
      sector_focus: values.sector_focus 
        ? values.sector_focus.split(",").map(s => s.trim()).filter(Boolean)
        : null,
      geography_focus: values.geography_focus
        ? values.geography_focus.split(",").map(s => s.trim()).filter(Boolean)
        : null,
      revenue_min: values.revenue_min || null,
      revenue_max: values.revenue_max || null,
      ebitda_min: values.ebitda_min || null,
      ebitda_max: values.ebitda_max || null,
      deal_size_min: values.deal_size_min || null,
      deal_size_max: values.deal_size_max || null,
    };

    try {
      if (isEditing && buyer) {
        await updateMutation.mutateAsync({ id: buyer.id, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>
            {isEditing ? "Editar Comprador" : "Nuevo Comprador Corporativo"}
          </DrawerTitle>
          <DrawerDescription>
            {isEditing 
              ? "Modifica los datos del comprador corporativo" 
              : "Añade un nuevo comprador al directorio corporativo"
            }
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 pb-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Required fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del comprador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buyer_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BUYER_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source_tag_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origen *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar origen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingTags ? (
                            <SelectItem value="loading" disabled>Cargando...</SelectItem>
                          ) : (
                            sourceTags?.map((tag) => (
                              <SelectItem key={tag.id} value={tag.id}>
                                {tag.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country_base"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input placeholder="España" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sectors & Geography */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sector_focus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sectores (separados por coma)</FormLabel>
                      <FormControl>
                        <Input placeholder="Tecnología, Industrial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="geography_focus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geografías (separadas por coma)</FormLabel>
                      <FormControl>
                        <Input placeholder="España, Portugal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Financial ranges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="revenue_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facturación min (€M)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="revenue_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facturación max (€M)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ebitda_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EBITDA min (€M)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ebitda_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EBITDA max (€M)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deal_size_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal size min (€M)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deal_size_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal size max (€M)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="20" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional info */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionales sobre el comprador..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DrawerFooter className="px-0 pt-4">
              <div className="flex gap-2 justify-end">
                <DrawerClose asChild>
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </DrawerClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isEditing ? "Guardar cambios" : "Crear comprador"}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
