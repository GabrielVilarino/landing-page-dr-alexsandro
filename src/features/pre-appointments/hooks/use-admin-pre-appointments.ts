"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/api-error";
import { preAppointmentService } from "@/features/pre-appointments/services/pre-appointment-service";
import type { AdminPreAppointment, AdminPreAppointmentQuery, PreAppointmentList } from "@/features/pre-appointments/types/pre-appointment";

export function useAdminPreAppointments(query: AdminPreAppointmentQuery | null) {
  const [data, setData] = useState<PreAppointmentList>({ items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!query) return;
    setLoading(true);
    try { setData(await preAppointmentService.list(query, signal)); setError(null); }
    catch (caught) { if (!signal?.aborted) setError(getErrorMessage(caught)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void load(controller.signal), 0);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [load]);
  const replace = useCallback((item: AdminPreAppointment) => setData((current) => ({ ...current, items: current.items.map((entry) => entry.id === item.id ? item : entry) })), []);
  return { items: data.items, total: data.total, loading, error, reload: () => load(), replace, clearError: () => setError(null) };
}
