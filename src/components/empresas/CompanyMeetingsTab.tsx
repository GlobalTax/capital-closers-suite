import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus } from "lucide-react";
import { useCompanyMeetings } from "@/hooks/queries/useCompanyMeetings";
import { NewMeetingDialog } from "./NewMeetingDialog";
import { MeetingCard } from "./MeetingCard";

interface CompanyMeetingsTabProps {
  companyId: string;
}

export function CompanyMeetingsTab({ companyId }: CompanyMeetingsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: meetings = [], isLoading } = useCompanyMeetings(companyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reuniones
          </CardTitle>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reunión
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {meetings.length > 0 ? (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                companyId={companyId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay reuniones registradas
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Registra tu primera reunión para mantener un histórico de las interacciones con esta empresa
            </p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reunión
            </Button>
          </div>
        )}
      </CardContent>

      <NewMeetingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
      />
    </Card>
  );
}
