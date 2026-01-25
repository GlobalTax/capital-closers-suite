// ============================================
// NDA STATS CARD
// Tarjeta de estadísticas NDA para campañas
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCheck, 
  Send, 
  CheckCircle2, 
  Unlock,
  Clock
} from "lucide-react";
import type { NDAStats } from "@/services/ndaWorkflow.service";

interface NDAStatsCardProps {
  stats: NDAStats;
  className?: string;
}

export function NDAStatsCard({ stats, className }: NDAStatsCardProps) {
  const signedPercentage = stats.sent > 0 
    ? Math.round((stats.signed / stats.sent) * 100) 
    : 0;

  const eligiblePercentage = stats.total > 0 
    ? Math.round((stats.eligible / stats.total) * 100) 
    : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Estado NDA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={Users}
            label="Total destinatarios"
            value={stats.total}
            color="text-muted-foreground"
          />
          <StatItem
            icon={UserCheck}
            label="Elegibles NDA"
            value={stats.eligible}
            sublabel={`${eligiblePercentage}% con engagement`}
            color="text-blue-500"
          />
          <StatItem
            icon={Clock}
            label="NDA pendiente"
            value={stats.pending}
            color="text-yellow-500"
          />
          <StatItem
            icon={Send}
            label="NDA enviado"
            value={stats.sent}
            color="text-orange-500"
          />
          <StatItem
            icon={CheckCircle2}
            label="NDA firmado"
            value={stats.signed}
            color="text-green-500"
          />
          <StatItem
            icon={Unlock}
            label="Acceso CIM"
            value={stats.cimAccessGranted}
            color="text-purple-500"
          />
        </div>

        {/* Progress bar for conversion */}
        {stats.sent > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tasa de firma</span>
              <span className="font-medium">{signedPercentage}%</span>
            </div>
            <Progress value={signedPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {stats.signed} de {stats.sent} NDAs enviados han sido firmados
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  sublabel?: string;
  color: string;
}

function StatItem({ icon: Icon, label, value, sublabel, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-lg bg-muted ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// Compact version for inline use
export function NDAStatsInline({ stats }: { stats: NDAStats }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-yellow-500" />
        {stats.pending} pendientes
      </span>
      <span className="flex items-center gap-1">
        <Send className="h-3 w-3 text-orange-500" />
        {stats.sent} enviados
      </span>
      <span className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        {stats.signed} firmados
      </span>
      <span className="flex items-center gap-1">
        <Unlock className="h-3 w-3 text-purple-500" />
        {stats.cimAccessGranted} con acceso
      </span>
    </div>
  );
}
