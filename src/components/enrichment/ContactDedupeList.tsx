/**
 * Contact list with duplicate detection for enrichment
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Phone, Linkedin, AlertCircle, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContactWithDedupe } from "@/types/enrichment";
import { Link } from "react-router-dom";

interface ContactDedupeListProps {
  contacts: ContactWithDedupe[];
  onToggle: (index: number) => void;
}

export function ContactDedupeList({ contacts, onToggle }: ContactDedupeListProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No se encontraron contactos</p>
      </div>
    );
  }

  const selectedCount = contacts.filter(c => c.selected && !c.isDuplicate).length;
  const duplicateCount = contacts.filter(c => c.isDuplicate).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Contactos encontrados</h3>
          <Badge variant="outline">{contacts.length}</Badge>
        </div>
        <div className="flex gap-2 text-sm">
          {selectedCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              {selectedCount} a importar
            </Badge>
          )}
          {duplicateCount > 0 && (
            <Badge variant="outline" className="border-amber-500/50 text-amber-600">
              {duplicateCount} duplicados
            </Badge>
          )}
        </div>
      </div>

      {/* Contact list */}
      <div className="space-y-2">
        {contacts.map((contact, idx) => (
          <Card
            key={idx}
            className={cn(
              "p-3 cursor-pointer transition-colors",
              contact.isDuplicate && "border-amber-500/30 bg-amber-500/5",
              contact.selected && !contact.isDuplicate && "border-primary/50 bg-primary/5"
            )}
            onClick={() => onToggle(idx)}
          >
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <Checkbox
                  checked={contact.selected}
                  onCheckedChange={() => onToggle(idx)}
                  disabled={contact.isDuplicate}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{contact.nombre}</span>
                  {contact.isDuplicate && (
                    <Badge variant="outline" className="shrink-0 text-xs border-amber-500/50 text-amber-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Ya existe
                    </Badge>
                  )}
                </div>
                {contact.cargo && (
                  <p className="text-sm text-muted-foreground">{contact.cargo}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                  )}
                  {contact.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.telefono}
                    </span>
                  )}
                  {contact.linkedin && (
                    <a
                      href={contact.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                </div>
                {contact.isDuplicate && contact.existingContactId && (
                  <div className="mt-2 text-xs">
                    <Link
                      to={`/contactos/${contact.existingContactId}`}
                      className="text-primary hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link2 className="h-3 w-3" />
                      Ver contacto existente: {contact.existingContactName}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
