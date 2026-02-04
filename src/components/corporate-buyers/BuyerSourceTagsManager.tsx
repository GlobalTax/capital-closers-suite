import { useState } from "react";
import { Plus, Loader2, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tag } from "lucide-react";

import {
  useBuyerSourceTags,
  useCreateSourceTag,
  useUpdateSourceTag,
} from "@/hooks/queries/useCorporateBuyers";
import type { BuyerSourceTag, CreateSourceTagInput, UpdateSourceTagInput } from "@/types/corporateBuyers";

export function BuyerSourceTagsManager() {
  const { data: tags, isLoading } = useBuyerSourceTags(true);
  const createMutation = useCreateSourceTag();
  const updateMutation = useUpdateSourceTag();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BuyerSourceTag | null>(null);
  const [formData, setFormData] = useState({ key: "", label: "", color: "#6366f1" });

  const handleOpenCreate = () => {
    setEditingTag(null);
    setFormData({ key: "", label: "", color: "#6366f1" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (tag: BuyerSourceTag) => {
    setEditingTag(tag);
    setFormData({ key: tag.key, label: tag.label, color: tag.color || "#6366f1" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingTag) {
      await updateMutation.mutateAsync({
        id: editingTag.id,
        input: { label: formData.label, color: formData.color },
      });
    } else {
      await createMutation.mutateAsync({
        key: formData.key,
        label: formData.label,
        color: formData.color,
      });
    }
    setDialogOpen(false);
  };

  const handleToggleActive = async (tag: BuyerSourceTag) => {
    await updateMutation.mutateAsync({
      id: tag.id,
      input: { is_active: !tag.is_active },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etiquetas de Origen"
        description="Gestiona las etiquetas de origen para compradores corporativos"
        icon={Tag}
        actionLabel="Nueva etiqueta"
        onAction={handleOpenCreate}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : tags?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay etiquetas configuradas
                </TableCell>
              </TableRow>
            ) : (
              tags?.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-mono text-sm">{tag.key}</TableCell>
                  <TableCell>{tag.label}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: tag.color || "#6366f1" }}
                      />
                      <span className="text-xs text-muted-foreground">{tag.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tag.is_active ? "default" : "secondary"}>
                      {tag.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(tag)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(tag)}
                      >
                        {tag.is_active ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Editar etiqueta" : "Nueva etiqueta de origen"}
            </DialogTitle>
            <DialogDescription>
              {editingTag
                ? "Modifica los datos de la etiqueta"
                : "Crea una nueva etiqueta para categorizar compradores"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingTag && (
              <div className="space-y-2">
                <Label htmlFor="key">Key (identificador único)</Label>
                <Input
                  id="key"
                  placeholder="linkedin"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Solo letras minúsculas y guiones bajos
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="label">Label (nombre visible)</Label>
              <Input
                id="label"
                placeholder="LinkedIn"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  className="w-16 h-10 p-1"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="pt-2">
              <Label>Preview</Label>
              <div className="mt-2">
                <Badge
                  style={{
                    backgroundColor: `${formData.color}20`,
                    color: formData.color,
                    borderColor: formData.color,
                  }}
                >
                  {formData.label || "Etiqueta"}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !formData.label}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingTag ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
