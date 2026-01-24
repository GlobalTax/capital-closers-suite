/**
 * Confirmation step showing summary of changes
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Building2, Users, FileEdit, Plus } from "lucide-react";
import type { MergeMode, EnrichedData, ExistingEmpresa, ContactWithDedupe } from "@/types/enrichment";
import { calculateFieldDiff } from "@/services/enrichment.service";

interface EnrichmentConfirmationProps {
  enrichedData: EnrichedData;
  existingEmpresa: ExistingEmpresa | null;
  mergeMode: MergeMode;
  fieldSelections: Record<string, boolean>;
  contactsToImport: ContactWithDedupe[];
}

export function EnrichmentConfirmation({
  enrichedData,
  existingEmpresa,
  mergeMode,
  fieldSelections,
  contactsToImport,
}: EnrichmentConfirmationProps) {
  const isCreating = mergeMode === 'create_new' || !existingEmpresa;
  
  // Calculate what will be updated
  let fieldsToUpdate: string[] = [];
  if (existingEmpresa && mergeMode !== 'create_new') {
    const diffs = calculateFieldDiff(existingEmpresa, enrichedData);
    fieldsToUpdate = diffs
      .filter(d => {
        if (d.newValue == null) return false;
        if (mergeMode === 'empty_only') return d.oldValue == null;
        return fieldSelections[d.field] ?? d.selected;
      })
      .map(d => d.label);
  }

  const contactsToCreate = contactsToImport.filter(c => c.selected && !c.isDuplicate);
  const contactsSkipped = contactsToImport.filter(c => c.isDuplicate);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <h3 className="font-medium text-lg">Resumen de cambios</h3>
      </div>

      <Card className="p-4 space-y-4">
        {/* Action summary */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {isCreating ? (
              <Plus className="h-5 w-5 text-primary" />
            ) : (
              <FileEdit className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {isCreating ? 'Crear nueva empresa' : 'Actualizar empresa existente'}
            </p>
            <p className="text-sm text-muted-foreground">
              {enrichedData.nombre}
            </p>
          </div>
        </div>

        {/* Fields update summary */}
        {!isCreating && fieldsToUpdate.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Campos a actualizar ({fieldsToUpdate.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {fieldsToUpdate.map(field => (
                <Badge key={field} variant="secondary">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Contacts summary */}
        {(contactsToCreate.length > 0 || contactsSkipped.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Contactos
            </div>
            <div className="flex flex-wrap gap-2">
              {contactsToCreate.length > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                  {contactsToCreate.length} a crear
                </Badge>
              )}
              {contactsSkipped.length > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  {contactsSkipped.length} omitidos (duplicados)
                </Badge>
              )}
            </div>
            {contactsToCreate.length > 0 && (
              <ul className="text-sm text-muted-foreground pl-4 space-y-1">
                {contactsToCreate.map((c, idx) => (
                  <li key={idx} className="list-disc">
                    {c.nombre} {c.cargo && `- ${c.cargo}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Nothing to do */}
        {!isCreating && fieldsToUpdate.length === 0 && contactsToCreate.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>No hay cambios que aplicar</p>
          </div>
        )}
      </Card>
    </div>
  );
}
