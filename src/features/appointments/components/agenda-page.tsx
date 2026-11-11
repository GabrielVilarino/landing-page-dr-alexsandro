"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CalendarClock,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleX,
  LoaderCircle,
  Plus,
  RefreshCw,
  Settings2,
  TriangleAlert,
  UserRound,
  UserX,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppointments } from "@/features/appointments/hooks/use-appointments";
import {
  reasonSchema,
  rescheduleSchema,
  type ReasonValues,
  type RescheduleValues,
} from "@/features/appointments/schemas/appointment-schema";
import {
  clinicDate,
  clinicInstant,
  clinicInterval,
  formatClinicDateTime,
  formatClinicTime,
  isClinicDate,
  moveClinicDate,
} from "@/features/appointments/services/appointment-date";
import { appointmentService } from "@/features/appointments/services/appointment-service";
import { availableAppointmentActions } from "@/features/appointments/services/appointment-rules";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  AvailabilitySlot,
  Doctor,
} from "@/features/appointments/types/appointment";
import { appointmentStatuses } from "@/features/appointments/types/appointment";
import { useSession } from "@/features/auth/hooks/use-session";
import { ApiError, getErrorMessage } from "@/lib/api-error";
import { FieldError, StatusBadge, statusLabels } from "./appointment-ui";

type Operation = "cancel" | "reschedule" | null;

export function AgendaPage() {
  const { user, can, reload: reloadSession } = useSession();
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState(clinicDate());
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const interval = useMemo(() => clinicInterval(date, view), [date, view]);
  const params = useMemo(
    () =>
      can("appointments.read") && interval
        ? {
            start_at: interval.start_at,
            end_at: interval.end_at,
            ...(doctorId ? { doctor_id: Number(doctorId) } : {}),
            ...(status ? { status: status as AppointmentStatus } : {}),
          }
        : null,
    [can, doctorId, interval, status],
  );
  const agenda = useAppointments(params);

  const loadCatalogs = useCallback(async (signal?: AbortSignal) => {
    setCatalogLoading(true);
    try {
      const [loadedDoctors, loadedTypes] = await Promise.all([
        appointmentService.doctors(signal),
        appointmentService.types(false, signal),
      ]);
      setDoctors(loadedDoctors);
      setTypes(loadedTypes);
      setCatalogError(null);
    } catch (caught) {
      if (!signal?.aborted) setCatalogError(getErrorMessage(caught));
    } finally {
      if (!signal?.aborted) setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!can("appointments.read")) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => void loadCatalogs(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [can, loadCatalogs]);

  async function run(action: "confirm" | "start" | "finish" | "no-show") {
    if (!selected) return;
    setActing(true);
    setActionError(null);
    try {
      const updated = await appointmentService.transition(selected.id, action);
      agenda.replace(updated);
      setSelected(updated);
    } catch (caught) {
      setActionError(getErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 403)
        await reloadSession();
      if (caught instanceof ApiError && [404, 409].includes(caught.status))
        await agenda.reload();
    } finally {
      setActing(false);
    }
  }

  if (!can("appointments.read")) return <AccessDenied />;
  const move = view === "week" ? 7 : 1;
  const actions = selected
    ? availableAppointmentActions(
        selected.status,
        user?.permissions ?? [],
        user?.id === selected.doctor_id,
      )
    : [];
  const typeName = (appointment: Appointment) =>
    appointment.type_name ||
    types.find((type) => type.id === appointment.type_id)?.name ||
    `Tipo #${appointment.type_id}`;

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Consultas e horários da clínica."
        actions={
          <div className="flex flex-wrap gap-2">
            {(can("appointments.manage") ||
              can("calendar_integrations.read")) && (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin/agenda/configuracoes" />}
              >
                <Settings2 /> Configurações
              </Button>
            )}
            {can("appointments.create") && (
              <Button
                nativeButton={false}
                render={<Link href="/admin/agenda/novo" />}
              >
                <Plus /> Novo agendamento
              </Button>
            )}
          </div>
        }
      />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Período anterior"
              onClick={() => setDate(moveClinicDate(date, -move))}
            >
              <ChevronLeft />
            </Button>
            <Button variant="outline" onClick={() => setDate(clinicDate())}>
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próximo período"
              onClick={() => setDate(moveClinicDate(date, move))}
            >
              <ChevronRight />
            </Button>
          </div>
          <div>
            <Input
              type="date"
              className="w-auto"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Data de referência"
              aria-invalid={!isClinicDate(date)}
              aria-describedby={
                !isClinicDate(date) ? "agenda-date-error" : undefined
              }
            />
            {!isClinicDate(date) && (
              <FieldError
                id="agenda-date-error"
                message="Informe uma data válida."
              />
            )}
          </div>
          <div className="flex rounded-lg border p-1">
            <Button
              size="sm"
              variant={view === "day" ? "default" : "ghost"}
              onClick={() => setView("day")}
            >
              Dia
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "default" : "ghost"}
              onClick={() => setView("week")}
            >
              Semana
            </Button>
          </div>
          <Select
            value={doctorId || "all"}
            onValueChange={(value) =>
              setDoctorId(value === "all" ? "" : String(value))
            }
          >
            <SelectTrigger className="w-full lg:ml-auto lg:w-56">
              <SelectValue>
                {(value) =>
                  value === "all"
                    ? "Todos os médicos"
                    : doctors.find((doctor) => String(doctor.id) === value)
                        ?.name || "Médico selecionado"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os médicos</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={String(doctor.id)}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status || "all"}
            onValueChange={(value) =>
              setStatus(value === "all" ? "" : String(value))
            }
          >
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue>
                {(value) =>
                  value === "all"
                    ? "Todos os estados"
                    : statusLabels[value as AppointmentStatus] ||
                      "Estado selecionado"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {appointmentStatuses.map((item) => (
                <SelectItem key={item} value={item}>
                  {statusLabels[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {catalogLoading && (
        <Alert className="mb-4">
          <LoaderCircle className="animate-spin" />
          <AlertDescription>
            Carregando médicos e tipos de consulta...
          </AlertDescription>
        </Alert>
      )}
      {catalogError && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <TriangleAlert />
          <AlertTitle>Não foi possível carregar os catálogos</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{catalogError}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadCatalogs()}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {agenda.error && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <TriangleAlert />
          <AlertTitle>Não foi possível carregar a agenda</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{agenda.error}</span>
            <Button variant="outline" onClick={() => void agenda.reload()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {agenda.loading ? (
        <div className="grid min-h-64 place-items-center">
          <LoaderCircle
            className="size-8 animate-spin text-primary"
            aria-label="Carregando agenda"
          />
        </div>
      ) : agenda.items.length === 0 && view === "day" ? (
        <Card>
          <CardContent className="grid min-h-56 place-items-center text-center">
            <div>
              <CalendarDays className="mx-auto mb-3 size-9 text-muted-foreground" />
              <p className="font-medium">Nenhuma consulta neste período</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os filtros ou selecione outra data.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : view === "week" && interval ? (
        <>
          <div className="space-y-3 md:hidden">
            {agenda.items.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                typeName={typeName(item)}
                onOpen={setSelected}
              />
            ))}
          </div>
          <WeekAgendaGrid
            startDate={interval.startDate}
            items={agenda.items}
            typeName={typeName}
            onOpen={setSelected}
          />
        </>
      ) : (
        <div className="space-y-3">
          {agenda.items.map((item) => (
            <AppointmentCard
              key={item.id}
              appointment={item}
              typeName={typeName(item)}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setOperation(null);
            setActionError(null);
          }
        }}
      >
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <AlertDialogHeader className="text-left sm:place-items-start">
                <AlertDialogTitle>Consulta #{selected.id}</AlertDialogTitle>
                <AlertDialogDescription>
                  Detalhes e ações disponíveis para este agendamento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AppointmentDetail
                appointment={selected}
                typeName={typeName(selected)}
              />
              {actionError && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}
              {operation === "cancel" && (
                <ReasonOperation
                  appointment={selected}
                  onCancel={() => setOperation(null)}
                  onSaved={(updated) => {
                    agenda.replace(updated);
                    setSelected(updated);
                    setOperation(null);
                  }}
                  onConflict={() => agenda.reload()}
                />
              )}
              {operation === "reschedule" && (
                <RescheduleOperation
                  appointment={selected}
                  canFitIn={can("appointments.create")}
                  onCancel={() => setOperation(null)}
                  onSaved={() => {
                    setSelected(null);
                    setOperation(null);
                    void agenda.reload();
                  }}
                  onConflict={() => agenda.reload()}
                />
              )}
              {!operation && (
                <div className="flex flex-wrap gap-2">
                  {actions.includes("confirm") && (
                    <Button
                      disabled={acting}
                      onClick={() => void run("confirm")}
                    >
                      Confirmar
                    </Button>
                  )}
                  {actions.includes("start") && (
                    <Button disabled={acting} onClick={() => void run("start")}>
                      Iniciar
                    </Button>
                  )}
                  {actions.includes("finish") && (
                    <Button
                      disabled={acting}
                      onClick={() => void run("finish")}
                    >
                      Finalizar
                    </Button>
                  )}
                  {actions.includes("no-show") && (
                    <Button
                      variant="outline"
                      disabled={acting}
                      onClick={() => void run("no-show")}
                    >
                      Registrar ausência
                    </Button>
                  )}
                  {actions.includes("reschedule") && (
                    <Button
                      variant="outline"
                      onClick={() => setOperation("reschedule")}
                    >
                      Remarcar
                    </Button>
                  )}
                  {actions.includes("cancel") && (
                    <Button
                      variant="destructive"
                      onClick={() => setOperation("cancel")}
                    >
                      Cancelar consulta
                    </Button>
                  )}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AppointmentCard({
  appointment,
  typeName,
  onOpen,
}: {
  appointment: Appointment;
  typeName: string;
  onOpen: (item: Appointment) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(appointment)}
      className="w-full rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-primary">
            {formatClinicTime(appointment.start_at)}–
            {formatClinicTime(appointment.end_at)}
          </p>
          <p className="font-semibold">
            {appointment.patient_name || `Paciente #${appointment.patient_id}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={appointment.status} />
          {appointment.is_fit_in && <Badge variant="secondary">Encaixe</Badge>}
        </div>
      </div>
      <div className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />{" "}
          {formatClinicDateTime(appointment.start_at)}
        </span>
        <span className="flex items-center gap-1.5">
          <UserRound className="size-3.5" /> {appointment.doctor_name}
        </span>
        <span>{typeName}</span>
      </div>
    </button>
  );
}

function AppointmentDetail({
  appointment,
  typeName,
}: {
  appointment: Appointment;
  typeName: string;
}) {
  const rows = [
    [
      "Paciente",
      appointment.patient_name || `Paciente #${appointment.patient_id}`,
    ],
    ["Médico", appointment.doctor_name],
    [
      "Período",
      `${formatClinicDateTime(appointment.start_at)} até ${formatClinicTime(appointment.end_at)}`,
    ],
    ["Tipo", typeName],
    [
      "Criado por",
      appointment.created_by_name || `Usuário #${appointment.created_by}`,
    ],
    ["Criado em", formatClinicDateTime(appointment.created_at)],
  ];
  return (
    <div className="grid gap-2 rounded-xl bg-secondary/60 p-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[7rem_1fr] gap-2">
          <span className="text-muted-foreground">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        <StatusBadge status={appointment.status} />
        {appointment.is_fit_in && <Badge>Encaixe</Badge>}
        {appointment.rescheduled_from_id && (
          <Badge variant="outline">
            Remarcada da #{appointment.rescheduled_from_id}
          </Badge>
        )}
      </div>
    </div>
  );
}

function WeekAgendaGrid({
  startDate,
  items,
  typeName,
  onOpen,
}: {
  startDate: string;
  items: Appointment[];
  typeName: (item: Appointment) => string;
  onOpen: (item: Appointment) => void;
}) {
  const statusClasses: Record<AppointmentStatus, string> = {
    AGENDADA: "border-sky-300 bg-sky-50",
    CONFIRMADA: "border-emerald-300 bg-emerald-50",
    EM_ATENDIMENTO: "border-amber-300 bg-amber-50",
    FINALIZADA: "border-stone-300 bg-stone-100",
    REMARCADA: "border-violet-300 bg-violet-50",
    CANCELADA: "border-red-300 bg-red-50",
    NAO_COMPARECEU: "border-orange-300 bg-orange-50",
  };
  const statusIcons: Record<AppointmentStatus, LucideIcon> = {
    AGENDADA: CalendarClock,
    CONFIRMADA: BadgeCheck,
    EM_ATENDIMENTO: Activity,
    FINALIZADA: CheckCheck,
    REMARCADA: RefreshCw,
    CANCELADA: CircleX,
    NAO_COMPARECEU: UserX,
  };
  const days = Array.from({ length: 7 }, (_, index) =>
    moveClinicDate(startDate, index),
  );
  const occupiedHours = items.map((item) =>
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone:
          process.env.NEXT_PUBLIC_CLINIC_TIMEZONE || "America/Araguaina",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date(item.start_at)),
    ),
  );
  const firstHour = Math.min(7, ...occupiedHours);
  const lastHour = Math.max(19, ...occupiedHours);
  const hours = Array.from(
    { length: lastHour - firstHour + 1 },
    (_, index) => firstHour + index,
  );
  return (
    <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
      <div className="grid w-full min-w-354 grid-cols-[4.5rem_repeat(7,minmax(12rem,1fr))]">
        <div className="h-10 border-b border-r bg-muted/50 p-2 text-xs font-semibold">
          Horário
        </div>
        {days.map((day) => (
          <div
            key={day}
            className="h-10 border-b border-r bg-muted/50 p-2 text-center text-xs font-semibold last:border-r-0"
          >
            {new Intl.DateTimeFormat("pt-BR", {
              timeZone: "UTC",
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            }).format(new Date(`${day}T12:00:00Z`))}
          </div>
        ))}
        {hours.flatMap((hour) => [
          <div
            key={`hour-${hour}`}
            className="h-28 border-b border-r p-2 text-xs text-muted-foreground"
          >
            {String(hour).padStart(2, "0")}:00
          </div>,
          ...days.map((day) => {
            const cellItems = items
              .filter(
                (item) =>
                  clinicDate(new Date(item.start_at)) === day &&
                  Number(
                    new Intl.DateTimeFormat("en-US", {
                      timeZone:
                        process.env.NEXT_PUBLIC_CLINIC_TIMEZONE ||
                        "America/Araguaina",
                      hour: "2-digit",
                      hourCycle: "h23",
                    }).format(new Date(item.start_at)),
                  ) === hour,
              )
              .sort(
                (first, second) =>
                  new Date(first.start_at).getTime() -
                  new Date(second.start_at).getTime(),
              );
            const startGroups = Array.from(
              cellItems
                .reduce<Map<string, Appointment[]>>((groups, item) => {
                  const group = groups.get(item.start_at) ?? [];
                  group.push(item);
                  groups.set(item.start_at, group);
                  return groups;
                }, new Map())
                .values(),
            );
            return (
              <div
                key={`${day}-${hour}`}
                className="h-28 min-w-0 overflow-hidden border-b border-r p-1 last:border-r-0"
              >
                <div className="flex h-full min-w-0 flex-col gap-1 overflow-hidden">
                  {startGroups.map((group) => (
                    <div
                      key={group[0].start_at}
                      className="flex min-h-0 min-w-0 flex-1 gap-1 overflow-hidden"
                    >
                      {group.map((item) => {
                        const StatusIcon = statusIcons[item.status];
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => onOpen(item)}
                            aria-label={`Data ${formatClinicDateTime(item.start_at, { dateStyle: "full", timeStyle: undefined })}, horário ${formatClinicTime(item.start_at)}, médico ${item.doctor_name}, ${item.patient_name || `Paciente ${item.patient_id}`}, ${typeName(item)}, ${statusLabels[item.status]}${item.is_fit_in ? ", encaixe" : ""}`}
                            className={`relative flex h-full min-w-0 flex-1 cursor-pointer flex-col overflow-hidden rounded-md border p-1 text-left text-[10px] leading-tight transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${statusClasses[item.status]}`}
                          >
                            <span className="absolute top-1 right-1 flex items-center gap-0.5 text-foreground/70">
                              <span
                                role="img"
                                aria-label={`Estado: ${statusLabels[item.status]}`}
                                title={`Estado: ${statusLabels[item.status]}`}
                              >
                                <StatusIcon
                                  className="size-3 shrink-0"
                                  aria-hidden="true"
                                />
                              </span>
                              {item.is_fit_in && (
                                <span
                                  role="img"
                                  aria-label="Encaixe"
                                  title="Encaixe"
                                >
                                  <Zap
                                    className="size-3 shrink-0 fill-current"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}
                            </span>
                            <span className="block min-w-0 pr-7 font-bold text-primary">
                              {formatClinicTime(item.start_at)}
                            </span>
                            <span
                              className="line-clamp-2 block min-w-0 wrap-break-words font-semibold whitespace-normal"
                              title={
                                item.patient_name ||
                                `Paciente #${item.patient_id}`
                              }
                            >
                              {item.patient_name ||
                                `Paciente #${item.patient_id}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}

function ReasonOperation({
  appointment,
  onCancel,
  onSaved,
  onConflict,
}: {
  appointment: Appointment;
  onCancel: () => void;
  onSaved: (item: Appointment) => void;
  onConflict: () => Promise<void>;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReasonValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });
  const submit = async (values: ReasonValues) => {
    try {
      onSaved(await appointmentService.cancel(appointment.id, values.reason));
    } catch (caught) {
      setApiError(getErrorMessage(caught));
      if (caught instanceof ApiError && [404, 409].includes(caught.status))
        await onConflict();
    }
  };
  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="space-y-3 rounded-lg border p-3"
    >
      <Label htmlFor="cancel-reason">Motivo do cancelamento</Label>
      <Textarea
        id="cancel-reason"
        aria-invalid={Boolean(errors.reason)}
        aria-describedby={errors.reason ? "cancel-reason-error" : undefined}
        {...register("reason")}
      />
      <FieldError id="cancel-reason-error" message={errors.reason?.message} />
      {apiError && (
        <p role="alert" className="text-sm text-destructive">
          {apiError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Voltar
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          Confirmar cancelamento
        </Button>
      </div>
    </form>
  );
}

function RescheduleOperation({
  appointment,
  canFitIn,
  onCancel,
  onSaved,
  onConflict,
}: {
  appointment: Appointment;
  canFitIn: boolean;
  onCancel: () => void;
  onSaved: () => void;
  onConflict: () => Promise<void>;
}) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RescheduleValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: clinicDate(),
      start_at: "",
      reason: "",
      is_fit_in: false,
    },
  });
  const date = useWatch({ control, name: "date" });
  const isFitIn = useWatch({ control, name: "is_fit_in" });
  const startAt = useWatch({ control, name: "start_at" });
  const loadAvailability = useCallback(
    async (selectedDate: string, signal: AbortSignal) => {
      setLoading(true);
      try {
        setSlots(
          await appointmentService.availability(
            appointment.doctor_id,
            appointment.type_id,
            selectedDate,
            signal,
          ),
        );
        setApiError(null);
      } catch (caught) {
        if (!signal.aborted) setApiError(getErrorMessage(caught));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [appointment.doctor_id, appointment.type_id],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setValue("start_at", "", { shouldValidate: false });
      if (isFitIn || !isClinicDate(date)) {
        setSlots([]);
        setLoading(false);
        return;
      }
      void loadAvailability(date, controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [availabilityVersion, date, isFitIn, loadAvailability, setValue]);
  const submit = async (values: RescheduleValues) => {
    try {
      await appointmentService.reschedule(appointment.id, {
        start_at: values.is_fit_in
          ? clinicInstant(values.date, values.start_at)
          : values.start_at,
        reason: values.reason,
        is_fit_in: values.is_fit_in,
      });
      onSaved();
    } catch (caught) {
      setApiError(getErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 409) {
        setValue("start_at", "");
        if (!values.is_fit_in) setAvailabilityVersion((version) => version + 1);
        await onConflict();
      } else if (caught instanceof ApiError && caught.status === 404)
        await onConflict();
    }
  };
  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="space-y-3 rounded-lg border p-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="reschedule-date">Nova data</Label>
          <Input
            id="reschedule-date"
            type="date"
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "reschedule-date-error" : undefined}
            {...register("date")}
          />
          <FieldError
            id="reschedule-date-error"
            message={errors.date?.message}
          />
        </div>
        <div>
          <Label htmlFor="reschedule-time">Novo horário</Label>
          {isFitIn ? (
            <Input
              id="reschedule-time"
              type="time"
              aria-invalid={Boolean(errors.start_at)}
              aria-describedby={
                errors.start_at ? "reschedule-time-error" : undefined
              }
              {...register("start_at")}
            />
          ) : (
            <Select
              value={startAt}
              onValueChange={(value) =>
                setValue("start_at", String(value), { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="reschedule-time"
                aria-invalid={Boolean(errors.start_at)}
                aria-describedby={
                  errors.start_at ? "reschedule-time-error" : undefined
                }
              >
                <SelectValue>
                  {(value) =>
                    value
                      ? slots.find((slot) => slot.start_at === value)
                        ? formatClinicTime(String(value))
                        : "Horário selecionado"
                      : loading
                        ? "Carregando..."
                        : "Selecione"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {slots.map((slot) => (
                  <SelectItem key={slot.start_at} value={slot.start_at}>
                    {formatClinicTime(slot.start_at)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FieldError
            id="reschedule-time-error"
            message={errors.start_at?.message}
          />
        </div>
      </div>
      {canFitIn && (
        <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
          <Controller
            name="is_fit_in"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="reschedule-fit-in"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />{" "}
          Horário de encaixe
        </label>
      )}
      <div>
        <Label htmlFor="reschedule-reason">Motivo</Label>
        <Textarea
          id="reschedule-reason"
          aria-invalid={Boolean(errors.reason)}
          aria-describedby={
            errors.reason ? "reschedule-reason-error" : undefined
          }
          {...register("reason")}
        />
        <FieldError
          id="reschedule-reason-error"
          message={errors.reason?.message}
        />
      </div>
      {apiError && (
        <p role="alert" className="text-sm text-destructive">
          {apiError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Voltar
        </Button>
        <Button type="submit" disabled={isSubmitting || loading}>
          {isSubmitting && <LoaderCircle className="animate-spin" />} Remarcar
        </Button>
      </div>
    </form>
  );
}
