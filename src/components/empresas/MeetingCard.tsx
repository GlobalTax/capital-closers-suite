import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Calendar,
  Edit,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  useUpdateMeeting,
  useDeleteMeeting,
} from "@/hooks/queries/useCompanyMeetings";
import type { CompanyMeeting } from "@/services/companyMeetings.service";
import { MeetingDocuments } from "./MeetingDocuments";

interface MeetingCardProps {
  meeting: CompanyMeeting;
  companyId: string;
}

export function MeetingCard({ meeting, companyId }: MeetingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [preparationNotes, setPreparationNotes] = useState(meeting.preparation_notes || "");
  const [meetingNotes, setMeetingNotes] = useState(meeting.meeting_notes || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { mutate: updateMeeting, isPending: isUpdating } = useUpdateMeeting();
  const { mutate: deleteMeeting, isPending: isDeleting } = useDeleteMeeting();

  const formattedDate = format(new Date(meeting.meeting_date), "d MMM yyyy", { locale: es });

  const handleSave = () => {
    updateMeeting(
      {
        id: meeting.id,
        data: {
          preparation_notes: preparationNotes,
          meeting_notes: meetingNotes,
        },
      },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleCancel = () => {
    setPreparationNotes(meeting.preparation_notes || "");
    setMeetingNotes(meeting.meeting_notes || "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMeeting({ id: meeting.id, companyId });
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={meeting.id} className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 text-left">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="font-medium">{formattedDate}</span>
                <span className="mx-2 text-muted-foreground">—</span>
                <span>{meeting.title}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isUpdating}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isUpdating ? "Guardando..." : "Guardar"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </>
                )}
              </div>

              {/* Preparation Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Notas de preparación
                </Label>
                {isEditing ? (
                  <Textarea
                    value={preparationNotes}
                    onChange={(e) => setPreparationNotes(e.target.value)}
                    placeholder="Temas a tratar, preguntas, objetivos..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {meeting.preparation_notes || (
                      <span className="text-muted-foreground italic">Sin notas de preparación</span>
                    )}
                  </p>
                )}
              </div>

              <Separator />

              {/* Meeting Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Notas de la reunión
                </Label>
                {isEditing ? (
                  <Textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Resumen, acuerdos, próximos pasos..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {meeting.meeting_notes || (
                      <span className="text-muted-foreground italic">Sin notas de la reunión</span>
                    )}
                  </p>
                )}
              </div>

              <Separator />

              {/* Documents Section */}
              <MeetingDocuments meetingId={meeting.id} companyId={companyId} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        titulo="¿Eliminar reunión?"
        descripcion="Esta acción no se puede deshacer. La reunión y todos sus documentos adjuntos serán eliminados permanentemente."
        onConfirmar={handleDelete}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        variant="destructive"
      />
    </>
  );
}
