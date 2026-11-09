import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/features/appointments/types/appointment";
import { cn } from "@/lib/utils";

export const statusLabels: Record<AppointmentStatus, string> = {
  AGENDADA: "Agendada",
  CONFIRMADA: "Confirmada",
  EM_ATENDIMENTO: "Em atendimento",
  FINALIZADA: "Finalizada",
  REMARCADA: "Remarcada",
  CANCELADA: "Cancelada",
  NAO_COMPARECEU: "Não compareceu",
};

const colors: Record<AppointmentStatus, string> = {
  AGENDADA: "border-sky-200 bg-sky-50 text-sky-800",
  CONFIRMADA: "border-emerald-200 bg-emerald-50 text-emerald-800",
  EM_ATENDIMENTO: "border-amber-200 bg-amber-50 text-amber-900",
  FINALIZADA: "border-stone-200 bg-stone-100 text-stone-700",
  REMARCADA: "border-violet-200 bg-violet-50 text-violet-800",
  CANCELADA: "border-red-200 bg-red-50 text-red-800",
  NAO_COMPARECEU: "border-orange-200 bg-orange-50 text-orange-900",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(colors[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}
