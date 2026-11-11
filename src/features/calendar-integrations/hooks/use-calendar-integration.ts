"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { calendarIntegrationService } from "@/features/calendar-integrations/services/calendar-integration-service";
import type {
  CalendarIntegration,
  GoogleCalendarOption,
} from "@/features/calendar-integrations/types/calendar-integration";
import { ApiError } from "@/lib/api-error";

type Mutation = "authorize" | "select" | "disconnect" | "retry" | null;
type LoadStatus = "idle" | "loading" | "success" | "error";

function calendarErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  const messages: Record<number, string> = {
    400: "Confira o médico e o calendário informados.",
    401: "Sua sessão expirou. Entre novamente.",
    403: "Você não tem permissão para gerenciar esta integração.",
    404: "A integração ou o calendário não está mais disponível.",
    409: "A integração mudou ou já possui uma conexão. Confira o estado atualizado.",
    500: "Não foi possível concluir a operação. Tente novamente.",
  };
  return messages[error.status] ?? messages[500];
}

export function useCalendarIntegration({
  doctorId,
  canRead,
  canManage,
}: {
  doctorId: number | null;
  canRead: boolean;
  canManage: boolean;
}) {
  const [connection, setConnection] =
    useState<CalendarIntegration | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarOption[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [calendarsLoading, setCalendarsLoading] = useState(false);
  const [mutation, setMutation] = useState<Mutation>(null);
  const [error, setError] = useState<string | null>(null);
  const connectionRequest = useRef<AbortController | null>(null);
  const calendarsRequest = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);

  const report = useCallback(async (caught: unknown) => {
    setError(calendarErrorMessage(caught));
  }, []);

  const refresh = useCallback(async () => {
    connectionRequest.current?.abort();
    calendarsRequest.current?.abort();
    if (!doctorId || !canRead) {
      setConnection(null);
      setCalendars([]);
      setSelectedCalendarId("");
      setLoading(false);
      setLoadStatus("idle");
      return null;
    }

    const controller = new AbortController();
    const sequence = requestSequence.current + 1;
    connectionRequest.current = controller;
    requestSequence.current = sequence;
    setLoading(true);
    setLoadStatus("loading");
    setError(null);
    setCalendars([]);
    setSelectedCalendarId("");

    try {
      const loadedConnection =
        await calendarIntegrationService.getConnection(
          doctorId,
          controller.signal,
        );
      if (
        controller.signal.aborted ||
        sequence !== requestSequence.current
      ) {
        return undefined;
      }

      setConnection(loadedConnection);
      setLoadStatus("success");
      if (loadedConnection?.status === "ATIVA") {
        setSelectedCalendarId(loadedConnection.calendar_id ?? "");
      }

      if (
        (loadedConnection?.status === "PENDENTE" ||
          loadedConnection?.status === "ATIVA") &&
        canManage
      ) {
        setCalendarsLoading(true);
        try {
          const loadedCalendars = await calendarIntegrationService.calendars(
            doctorId,
            controller.signal,
          );
          if (
            !controller.signal.aborted &&
            sequence === requestSequence.current
          ) {
            setCalendars(loadedCalendars);
          }
        } catch (caught) {
          if (
            !controller.signal.aborted &&
            sequence === requestSequence.current
          ) {
            await report(caught);
          }
        }
      }
      return loadedConnection;
    } catch (caught) {
      if (
        !controller.signal.aborted &&
        sequence === requestSequence.current
      ) {
        setConnection(null);
        setLoadStatus("error");
        await report(caught);
      }
      return undefined;
    } finally {
      if (
        !controller.signal.aborted &&
        sequence === requestSequence.current
      ) {
        setLoading(false);
        setCalendarsLoading(false);
      }
    }
  }, [canManage, canRead, doctorId, report]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void refresh(), 0);
    return () => {
      window.clearTimeout(timeout);
      connectionRequest.current?.abort();
      calendarsRequest.current?.abort();
    };
  }, [refresh]);

  const loadCalendars = useCallback(async () => {
    calendarsRequest.current?.abort();
    if (!doctorId || !canManage) return false;
    const controller = new AbortController();
    calendarsRequest.current = controller;
    setCalendarsLoading(true);
    setError(null);
    try {
      const loadedCalendars = await calendarIntegrationService.calendars(
        doctorId,
        controller.signal,
      );
      if (controller.signal.aborted) return false;
      setCalendars(loadedCalendars);
      return true;
    } catch (caught) {
      if (!controller.signal.aborted) await report(caught);
      return false;
    } finally {
      if (!controller.signal.aborted) setCalendarsLoading(false);
    }
  }, [canManage, doctorId, report]);

  const refreshAfterConflict = useCallback(
    async (caught: unknown) => {
      if (
        caught instanceof ApiError &&
        (caught.status === 404 || caught.status === 409)
      ) {
        await refresh();
      }
      await report(caught);
    },
    [refresh, report],
  );

  const authorize = useCallback(async () => {
    if (!doctorId || !canManage || mutation) return false;
    setMutation("authorize");
    setError(null);
    try {
      const authorization =
        await calendarIntegrationService.authorize(doctorId);
      window.location.assign(authorization.authorization_url);
      return true;
    } catch (caught) {
      await refreshAfterConflict(caught);
      setMutation(null);
      return false;
    }
  }, [canManage, doctorId, mutation, refreshAfterConflict]);

  const selectCalendar = useCallback(async () => {
    if (!doctorId || !canManage || !selectedCalendarId || mutation) {
      if (!selectedCalendarId) setError("Selecione um calendário.");
      return false;
    }
    setMutation("select");
    setError(null);
    try {
      await calendarIntegrationService.selectCalendar({
        doctor_id: doctorId,
        calendar_id: selectedCalendarId,
      });
      const updatedConnection = await refresh();
      return updatedConnection?.status === "ATIVA";
    } catch (caught) {
      await refreshAfterConflict(caught);
      return false;
    } finally {
      setMutation(null);
    }
  }, [
    canManage,
    doctorId,
    mutation,
    refresh,
    refreshAfterConflict,
    selectedCalendarId,
  ]);

  const disconnect = useCallback(async () => {
    if (!doctorId || !canManage || mutation) return false;
    setMutation("disconnect");
    setError(null);
    try {
      await calendarIntegrationService.disconnect(doctorId);
      const updatedConnection = await refresh();
      return (
        updatedConnection === null ||
        updatedConnection?.status === "DESCONECTADA"
      );
    } catch (caught) {
      await refreshAfterConflict(caught);
      return false;
    } finally {
      setMutation(null);
    }
  }, [canManage, doctorId, mutation, refresh, refreshAfterConflict]);

  const retry = useCallback(async () => {
    if (!doctorId || !canManage || mutation) return false;
    setMutation("retry");
    setError(null);
    try {
      await calendarIntegrationService.retry(doctorId);
      const updatedConnection = await refresh();
      return updatedConnection !== undefined;
    } catch (caught) {
      await refreshAfterConflict(caught);
      return false;
    } finally {
      setMutation(null);
    }
  }, [canManage, doctorId, mutation, refresh, refreshAfterConflict]);

  return {
    connection,
    calendars,
    selectedCalendarId,
    setSelectedCalendarId,
    loading,
    loadStatus,
    calendarsLoading,
    mutation,
    error,
    refresh,
    loadCalendars,
    authorize,
    selectCalendar,
    disconnect,
    retry,
  };
}
