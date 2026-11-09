import type { AppointmentStatus } from "@/features/appointments/types/appointment";

export type AppointmentAction =
  "confirm" | "start" | "finish" | "no-show" | "cancel" | "reschedule";

const transitions: Record<AppointmentStatus, AppointmentAction[]> = {
  AGENDADA: ["confirm", "no-show", "cancel", "reschedule"],
  CONFIRMADA: ["start", "no-show", "cancel", "reschedule"],
  EM_ATENDIMENTO: ["finish"],
  FINALIZADA: [],
  REMARCADA: [],
  CANCELADA: [],
  NAO_COMPARECEU: [],
};

export function availableAppointmentActions(
  status: AppointmentStatus,
  permissions: string[],
  ownAppointment: boolean,
) {
  return transitions[status].filter((action) => {
    if (action === "start" || action === "finish")
      return ownAppointment && permissions.includes("appointments.attend");
    return permissions.includes("appointments.update");
  });
}
