"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/api-error";
import { preAppointmentService } from "@/features/pre-appointments/services/pre-appointment-service";
import type { CreatePreAppointmentPayload, PublicAppointmentType, PublicAvailabilitySlot, PublicDoctor, PreAppointmentResult } from "@/features/pre-appointments/types/pre-appointment";

export function usePreAppointment(doctorId: string, typeId: string, date: string) {
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [types, setTypes] = useState<PublicAppointmentType[]>([]);
  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([preAppointmentService.doctors(controller.signal), preAppointmentService.appointmentTypes(controller.signal)])
      .then(([nextDoctors, nextTypes]) => { setDoctors(nextDoctors); setTypes(nextTypes); setError(null); })
      .catch((caught: unknown) => { if (!controller.signal.aborted) setError(getErrorMessage(caught)); })
      .finally(() => { if (!controller.signal.aborted) setLoadingCatalog(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (!doctorId || !typeId || !date) {
      queueMicrotask(() => {
        if (!controller.signal.aborted) setSlots([]);
      });
      return () => controller.abort();
    }
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        setSlots([]);
        setLoadingSlots(true);
      }
      return preAppointmentService.availability(Number(doctorId), Number(typeId), date, controller.signal);
    })
      .then((nextSlots) => { setSlots(nextSlots); setError(null); })
      .catch((caught: unknown) => { if (!controller.signal.aborted) { setSlots([]); setError(getErrorMessage(caught)); } })
      .finally(() => { if (!controller.signal.aborted) setLoadingSlots(false); });
    return () => controller.abort();
  }, [date, doctorId, typeId]);

  const submit = useCallback(async (payload: CreatePreAppointmentPayload): Promise<PreAppointmentResult> => {
    setSubmitting(true); setError(null);
    try { return await preAppointmentService.create(payload); }
    catch (caught) { const message = getErrorMessage(caught); setError(message); throw caught; }
    finally { setSubmitting(false); }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { doctors, types, slots, loadingCatalog, loadingSlots, submitting, error, clearError, submit };
}
