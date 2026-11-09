"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CalendarOff,
  Clock,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  appointmentTypeSchema,
  blockSchema,
  scheduleSchema,
  type AppointmentTypeValues,
  type BlockValues,
  type ScheduleValues,
} from "@/features/appointments/schemas/appointment-schema";
import {
  clinicInstant,
  formatClinicDateTime,
  scheduleBlockInterval,
} from "@/features/appointments/services/appointment-date";
import { appointmentService } from "@/features/appointments/services/appointment-service";
import type {
  AppointmentType,
  Doctor,
  DoctorSchedule,
  ScheduleBlock,
} from "@/features/appointments/types/appointment";
import { useSession } from "@/features/auth/hooks/use-session";
import { ApiError, getErrorMessage } from "@/lib/api-error";
import { FieldError } from "./appointment-ui";

const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
type Removal = {
  kind: "schedule" | "block";
  id: number;
  doctorId: number;
} | null;

export function AppointmentSettingsPage() {
  const { can, reload: reloadSession } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorDataLoading, setDoctorDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removal, setRemoval] = useState<Removal>(null);
  const doctorDataController = useRef<AbortController | null>(null);
  const doctorDataSequence = useRef(0);
  const selectedDoctorId = useRef("");

  const report = useCallback(
    async (caught: unknown) => {
      setError(getErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 403)
        await reloadSession();
    },
    [reloadSession],
  );
  const loadBase = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const [loadedDoctors, loadedTypes] = await Promise.all([
          appointmentService.doctors(signal),
          appointmentService.types(false, signal),
        ]);
        setDoctors(loadedDoctors);
        setTypes(loadedTypes);
        setDoctorId((current) => {
          const next = current || String(loadedDoctors[0]?.id || "");
          selectedDoctorId.current = next;
          return next;
        });
        setError(null);
      } catch (caught) {
        if (!signal?.aborted) await report(caught);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [report],
  );
  const loadDoctorData = useCallback(
    async (id: number) => {
      if (String(id) !== selectedDoctorId.current) return;
      doctorDataController.current?.abort();
      const controller = new AbortController();
      const sequence = doctorDataSequence.current + 1;
      doctorDataController.current = controller;
      doctorDataSequence.current = sequence;
      setDoctorDataLoading(true);
      try {
        const blockInterval = scheduleBlockInterval();
        const [loadedSchedules, loadedBlocks] = await Promise.all([
          appointmentService.schedules(id, controller.signal),
          appointmentService.blocks(
            id,
            blockInterval.start_at,
            blockInterval.end_at,
            controller.signal,
          ),
        ]);
        if (
          controller.signal.aborted ||
          sequence !== doctorDataSequence.current ||
          String(id) !== selectedDoctorId.current
        )
          return;
        setSchedules(loadedSchedules);
        setBlocks(loadedBlocks);
        setError(null);
      } catch (caught) {
        if (
          !controller.signal.aborted &&
          sequence === doctorDataSequence.current &&
          String(id) === selectedDoctorId.current
        )
          await report(caught);
      } finally {
        if (
          !controller.signal.aborted &&
          sequence === doctorDataSequence.current
        )
          setDoctorDataLoading(false);
      }
    },
    [report],
  );

  const changeDoctor = useCallback((nextDoctorId: string) => {
    selectedDoctorId.current = nextDoctorId;
    doctorDataController.current?.abort();
    setDoctorId(nextDoctorId);
  }, []);

  const reloadDoctorAfterMutation = useCallback(
    async (mutationDoctorId: number) => {
      if (String(mutationDoctorId) !== selectedDoctorId.current) return;
      await loadDoctorData(mutationDoctorId);
    },
    [loadDoctorData],
  );

  useEffect(() => {
    if (!can("appointments.manage")) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => void loadBase(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [can, loadBase]);
  useEffect(() => {
    if (!doctorId) return;
    const timeout = window.setTimeout(
      () => void loadDoctorData(Number(doctorId)),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, [doctorId, loadDoctorData]);
  useEffect(() => () => doctorDataController.current?.abort(), []);

  async function remove() {
    if (!removal) return;
    try {
      if (removal.kind === "schedule")
        await appointmentService.deleteSchedule(removal.id);
      else await appointmentService.deleteBlock(removal.id);
      await reloadDoctorAfterMutation(removal.doctorId);
      setRemoval(null);
    } catch (caught) {
      await report(caught);
    }
  }

  if (!can("appointments.manage")) return <AccessDenied />;
  return (
    <div>
      <PageHeader
        title="Configurações da agenda"
        description="Gerencie tipos de consulta, grades semanais e bloqueios."
        backAction={
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href="/admin/agenda" />}
            aria-label="Voltar para a agenda"
            title="Voltar para a agenda"
          >
            <ArrowLeft />
          </Button>
        }
      />
      {error && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentDoctorId = Number(selectedDoctorId.current);
                void loadBase();
                if (currentDoctorId) void loadDoctorData(currentDoctorId);
              }}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {doctorDataLoading && (
        <Alert className="mb-4">
          <LoaderCircle className="animate-spin" />
          <AlertDescription>
            Atualizando grades e bloqueios do médico...
          </AlertDescription>
        </Alert>
      )}
      {loading ? (
        <div className="grid min-h-56 place-items-center">
          <LoaderCircle className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="types">
          <TabsList className="mb-5 h-auto w-full justify-start">
            <TabsTrigger value="types">Tipos de consulta</TabsTrigger>
            <TabsTrigger value="schedules">Grades semanais</TabsTrigger>
            <TabsTrigger value="blocks">Bloqueios</TabsTrigger>
          </TabsList>
          <TabsContent value="types">
            <TypesPanel
              items={types}
              onReload={async () =>
                setTypes(await appointmentService.types(false))
              }
              onError={report}
            />
          </TabsContent>
          <TabsContent value="schedules">
            <DoctorPicker
              doctors={doctors}
              value={doctorId}
              onChange={changeDoctor}
            />
            <SchedulesPanel
              doctorId={doctorId}
              items={schedules}
              onReload={reloadDoctorAfterMutation}
              onRemove={(id) =>
                setRemoval({ kind: "schedule", id, doctorId: Number(doctorId) })
              }
              onError={report}
            />
          </TabsContent>
          <TabsContent value="blocks">
            <DoctorPicker
              doctors={doctors}
              value={doctorId}
              onChange={changeDoctor}
            />
            <BlocksPanel
              doctorId={doctorId}
              items={blocks}
              onReload={reloadDoctorAfterMutation}
              onRemove={(id) =>
                setRemoval({ kind: "block", id, doctorId: Number(doctorId) })
              }
              onError={report}
            />
          </TabsContent>
        </Tabs>
      )}
      <AlertDialog
        open={removal !== null}
        onOpenChange={(open) => !open && setRemoval(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Excluir este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              A operação remove o intervalo da configuração da agenda e não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void remove()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DoctorPicker({
  doctors,
  value,
  onChange,
}: {
  doctors: Doctor[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Card className="mb-4">
      <CardContent className="flex items-center gap-3">
        <Label htmlFor="settings-doctor" className="shrink-0">
          Médico
        </Label>
        <Select value={value} onValueChange={(next) => onChange(String(next))}>
          <SelectTrigger id="settings-doctor" className="w-full max-w-sm">
            <SelectValue>
              {(selectedValue) =>
                selectedValue
                  ? doctors.find(
                      (doctor) => String(doctor.id) === selectedValue,
                    )?.name || "Médico selecionado"
                  : "Selecione"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={String(doctor.id)}>
                {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function TypesPanel({
  items,
  onReload,
  onError,
}: {
  items: AppointmentType[];
  onReload: () => Promise<void>;
  onError: (error: unknown) => Promise<void>;
}) {
  const [editing, setEditing] = useState<AppointmentType | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentTypeValues>({
    resolver: zodResolver(appointmentTypeSchema),
    defaultValues: { name: "", duration_minutes: "60" },
  });
  const submit = async (values: AppointmentTypeValues) => {
    try {
      if (editing)
        await appointmentService.updateType(editing.id, {
          name: values.name,
          duration_minutes: Number(values.duration_minutes),
          active: editing.active,
        });
      else
        await appointmentService.createType({
          name: values.name,
          duration_minutes: Number(values.duration_minutes),
        });
      setEditing(null);
      reset({ name: "", duration_minutes: "60" });
      await onReload();
    } catch (caught) {
      await onError(caught);
    }
  };
  const edit = (item: AppointmentType) => {
    setEditing(item);
    reset({ name: item.name, duration_minutes: String(item.duration_minutes) });
  };
  const toggle = async (item: AppointmentType) => {
    try {
      await appointmentService.updateType(item.id, {
        name: item.name,
        duration_minutes: item.duration_minutes,
        active: !item.active,
      });
      await onReload();
    } catch (caught) {
      await onError(caught);
    }
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar tipo" : "Novo tipo"}</CardTitle>
          <CardDescription>
            A duração define o término das novas consultas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(submit)}
            noValidate
            className="space-y-4"
          >
            <div>
              <Label htmlFor="type-name">Nome</Label>
              <Input
                id="type-name"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "type-name-error" : undefined}
              />
              <FieldError id="type-name-error" message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="type-duration">Duração em minutos</Label>
              <Input
                id="type-duration"
                inputMode="numeric"
                {...register("duration_minutes")}
                aria-invalid={Boolean(errors.duration_minutes)}
                aria-describedby={
                  errors.duration_minutes ? "type-duration-error" : undefined
                }
              />
              <FieldError
                id="type-duration-error"
                message={errors.duration_minutes?.message}
              />
            </div>
            <div className="flex gap-2">
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    reset({ name: "", duration_minutes: "60" });
                  }}
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Plus />
                )}{" "}
                {editing ? "Salvar" : "Criar tipo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tipos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.duration_minutes} minutos
                </p>
              </div>
              <Badge variant={item.active ? "default" : "outline"}>
                {item.active ? "Ativo" : "Inativo"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => edit(item)}>
                <Pencil /> Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void toggle(item)}
              >
                {item.active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          ))}
          {items.length === 0 && <Empty text="Nenhum tipo cadastrado." />}
        </CardContent>
      </Card>
    </div>
  );
}

function SchedulesPanel({
  doctorId,
  items,
  onReload,
  onRemove,
  onError,
}: {
  doctorId: string;
  items: DoctorSchedule[];
  onReload: (doctorId: number) => Promise<void>;
  onRemove: (id: number) => void;
  onError: (error: unknown) => Promise<void>;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      doctor_id: doctorId,
      weekday: "1",
      start_time: "08:00",
      end_time: "18:00",
      slot_interval_minutes: "20",
    },
  });
  useEffect(() => setValue("doctor_id", doctorId), [doctorId, setValue]);
  const submit = async (values: ScheduleValues) => {
    try {
      const mutationDoctorId = Number(values.doctor_id);
      await appointmentService.createSchedule({
        doctor_id: mutationDoctorId,
        weekday: Number(values.weekday),
        start_time: values.start_time,
        end_time: values.end_time,
        slot_interval_minutes: Number(values.slot_interval_minutes),
      });
      reset({
        doctor_id: doctorId,
        weekday: "1",
        start_time: "08:00",
        end_time: "18:00",
        slot_interval_minutes: "20",
      });
      await onReload(mutationDoctorId);
    } catch (caught) {
      await onError(caught);
    }
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Novo intervalo</CardTitle>
          <CardDescription>Grades são incluídas e excluídas;</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(submit)}
            noValidate
            className="space-y-4"
          >
            <input type="hidden" {...register("doctor_id")} />
            <div>
              <Label htmlFor="schedule-weekday">Dia da semana</Label>
              <Controller
                name="weekday"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(String(value))}
                  >
                    <SelectTrigger
                      id="schedule-weekday"
                      className="w-full"
                      aria-invalid={Boolean(errors.weekday)}
                      aria-describedby={
                        errors.weekday ? "schedule-weekday-error" : undefined
                      }
                    >
                      <SelectValue>
                        {(value) =>
                          value === null || value === undefined || value === ""
                            ? "Selecione"
                            : weekdays[Number(value)] || "Dia selecionado"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {weekdays.map((day, index) => (
                        <SelectItem key={day} value={String(index)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                id="schedule-weekday-error"
                message={errors.weekday?.message}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="schedule-start">Início</Label>
                <Input
                  id="schedule-start"
                  type="time"
                  aria-invalid={Boolean(errors.start_time)}
                  aria-describedby={
                    errors.start_time ? "schedule-start-error" : undefined
                  }
                  {...register("start_time")}
                />
                <FieldError
                  id="schedule-start-error"
                  message={errors.start_time?.message}
                />
              </div>
              <div>
                <Label htmlFor="schedule-end">Fim</Label>
                <Input
                  id="schedule-end"
                  type="time"
                  aria-invalid={Boolean(errors.end_time)}
                  aria-describedby={
                    errors.end_time ? "schedule-end-error" : undefined
                  }
                  {...register("end_time")}
                />
                <FieldError
                  id="schedule-end-error"
                  message={errors.end_time?.message}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="schedule-interval">
                Intervalo entre inícios (min)
              </Label>
              <Input
                id="schedule-interval"
                inputMode="numeric"
                aria-invalid={Boolean(errors.slot_interval_minutes)}
                aria-describedby={
                  errors.slot_interval_minutes
                    ? "schedule-interval-error"
                    : undefined
                }
                {...register("slot_interval_minutes")}
              />
              <FieldError
                id="schedule-interval-error"
                message={errors.slot_interval_minutes?.message}
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !doctorId}>
              <Plus /> Adicionar intervalo
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Grade semanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items
            .sort(
              (a, b) =>
                a.weekday - b.weekday ||
                a.start_time.localeCompare(b.start_time),
            )
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Clock className="size-4 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">{weekdays[item.weekday]}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.start_time}–{item.end_time} · intervalos de{" "}
                    {item.slot_interval_minutes} min
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label={`Excluir grade de ${weekdays[item.weekday]}`}
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          {items.length === 0 && (
            <Empty text="Nenhuma grade para este médico." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BlocksPanel({
  doctorId,
  items,
  onReload,
  onRemove,
  onError,
}: {
  doctorId: string;
  items: ScheduleBlock[];
  onReload: (doctorId: number) => Promise<void>;
  onRemove: (id: number) => void;
  onError: (error: unknown) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BlockValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      doctor_id: doctorId,
      start_at: "",
      end_at: "",
      reason: "",
    },
  });
  useEffect(() => setValue("doctor_id", doctorId), [doctorId, setValue]);
  const submit = async (values: BlockValues) => {
    try {
      const mutationDoctorId = Number(values.doctor_id);
      const [startDate, startTime] = values.start_at.split("T");
      const [endDate, endTime] = values.end_at.split("T");
      await appointmentService.createBlock({
        doctor_id: mutationDoctorId,
        start_at: clinicInstant(startDate, startTime),
        end_at: clinicInstant(endDate, endTime),
        reason: values.reason,
      });
      reset({ doctor_id: doctorId, start_at: "", end_at: "", reason: "" });
      await onReload(mutationDoctorId);
    } catch (caught) {
      await onError(caught);
    }
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Novo bloqueio</CardTitle>
          <CardDescription>
            Use para indisponibilidades e feriados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(submit)}
            noValidate
            className="space-y-4"
          >
            <input type="hidden" {...register("doctor_id")} />
            <div>
              <Label htmlFor="block-start">Início</Label>
              <Input
                id="block-start"
                type="datetime-local"
                aria-invalid={Boolean(errors.start_at)}
                aria-describedby={
                  errors.start_at ? "block-start-error" : undefined
                }
                {...register("start_at")}
              />
              <FieldError
                id="block-start-error"
                message={errors.start_at?.message}
              />
            </div>
            <div>
              <Label htmlFor="block-end">Fim</Label>
              <Input
                id="block-end"
                type="datetime-local"
                aria-invalid={Boolean(errors.end_at)}
                aria-describedby={errors.end_at ? "block-end-error" : undefined}
                {...register("end_at")}
              />
              <FieldError
                id="block-end-error"
                message={errors.end_at?.message}
              />
            </div>
            <div>
              <Label htmlFor="block-reason">Motivo</Label>
              <Textarea
                id="block-reason"
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={
                  errors.reason ? "block-reason-error" : undefined
                }
                {...register("reason")}
              />
              <FieldError
                id="block-reason-error"
                message={errors.reason?.message}
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !doctorId}>
              <CalendarOff /> Criar bloqueio
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bloqueios futuros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <CalendarOff className="mt-1 size-4 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{item.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {formatClinicDateTime(item.start_at)} até{" "}
                  {formatClinicDateTime(item.end_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Criado por {item.created_by_name || `#${item.created_by}`}
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                aria-label="Excluir bloqueio"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <Empty text="Nenhum bloqueio futuro para este médico." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
