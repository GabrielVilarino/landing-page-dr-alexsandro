"use client";

import { useCallback, useEffect, useState } from "react";
import { appointmentService } from "@/features/appointments/services/appointment-service";
import type {
  Appointment,
  AppointmentQuery,
} from "@/features/appointments/types/appointment";
import { getErrorMessage } from "@/lib/api-error";

export function useAppointments(params: AppointmentQuery | null) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startAt = params?.start_at;
  const endAt = params?.end_at;
  const doctorId = params?.doctor_id;
  const status = params?.status;
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!params) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setItems(
          await appointmentService.appointments(
            {
              start_at: startAt!,
              end_at: endAt!,
              ...(doctorId ? { doctor_id: doctorId } : {}),
              ...(status ? { status } : {}),
            },
            signal,
          ),
        );
        setError(null);
      } catch (caught) {
        if (!signal?.aborted) setError(getErrorMessage(caught));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [doctorId, endAt, params, startAt, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [load]);
  const replace = useCallback(
    (updated: Appointment) =>
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      ),
    [],
  );
  return { items, loading, error, reload: () => load(), replace };
}
