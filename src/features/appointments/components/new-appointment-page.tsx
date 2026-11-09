"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, LoaderCircle, Search } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  appointmentCreateSchema,
  type AppointmentCreateValues,
} from "@/features/appointments/schemas/appointment-schema";
import {
  clinicDate,
  clinicInstant,
  formatClinicDateTime,
  formatClinicTime,
} from "@/features/appointments/services/appointment-date";
import { appointmentService } from "@/features/appointments/services/appointment-service";
import type {
  Appointment,
  AppointmentType,
  AvailabilitySlot,
  Doctor,
} from "@/features/appointments/types/appointment";
import { useSession } from "@/features/auth/hooks/use-session";
import { patientService } from "@/features/patients/services/patient-service";
import { patientSearchSchema } from "@/features/patients/schemas/patient-schema";
import type { Patient } from "@/features/patients/types/patient";
import { ApiError, getErrorMessage } from "@/lib/api-error";
import { FieldError } from "./appointment-ui";

export function NewAppointmentPage() {
  const { can, reload: reloadSession } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientSearchError, setPatientSearchError] = useState<string | null>(
    null,
  );
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Appointment | null>(null);
  const patientRequest = useRef<AbortController | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentCreateValues>({
    resolver: zodResolver(appointmentCreateSchema),
    defaultValues: {
      patient_id: "",
      doctor_id: "",
      type_id: "",
      date: clinicDate(),
      start_at: "",
      is_fit_in: false,
    },
  });
  const doctorId = useWatch({ control, name: "doctor_id" });
  const typeId = useWatch({ control, name: "type_id" });
  const date = useWatch({ control, name: "date" });
  const isFitIn = useWatch({ control, name: "is_fit_in" });
  const startAt = useWatch({ control, name: "start_at" });

  const loadOptions = useCallback(async (signal?: AbortSignal) => {
    setLoadingOptions(true);
    try {
      const [loadedDoctors, loadedTypes] = await Promise.all([
        appointmentService.doctors(signal),
        appointmentService.types(true, signal),
      ]);
      setDoctors(loadedDoctors);
      setTypes(loadedTypes);
      setOptionsError(null);
    } catch (caught) {
      if (!signal?.aborted) setOptionsError(getErrorMessage(caught));
    } finally {
      if (!signal?.aborted) setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    if (!can("appointments.read")) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => void loadOptions(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [can, loadOptions]);

  useEffect(() => {
    if (!doctorId || !typeId || !date || isFitIn) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoadingSlots(true);
      setValue("start_at", "");
      void appointmentService
        .availability(Number(doctorId), Number(typeId), date, controller.signal)
        .then((values) => {
          setSlots(values);
          setApiError(null);
        })
        .catch((error) => {
          if (!controller.signal.aborted) setApiError(getErrorMessage(error));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingSlots(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [date, doctorId, isFitIn, setValue, typeId]);

  async function searchPatients() {
    const parsed = patientSearchSchema.safeParse(patientSearch);
    if (!parsed.success) {
      setPatientSearchError(
        parsed.error.issues[0]?.message ?? "Informe um nome ou ID válido.",
      );
      return;
    }
    patientRequest.current?.abort();
    const controller = new AbortController();
    patientRequest.current = controller;
    setPatientSearchError(null);
    setApiError(null);
    try {
      setPatients(
        await patientService.list(parsed.data, 20, 0, controller.signal),
      );
    } catch (caught) {
      if (!controller.signal.aborted) {
        setApiError(getErrorMessage(caught));
        if (caught instanceof ApiError && caught.status === 403)
          await reloadSession();
      }
    }
  }

  useEffect(() => () => patientRequest.current?.abort(), []);

  async function submit(values: AppointmentCreateValues) {
    setApiError(null);
    try {
      const created = await appointmentService.create({
        patient_id: Number(values.patient_id),
        doctor_id: Number(values.doctor_id),
        type_id: Number(values.type_id),
        start_at: values.is_fit_in
          ? clinicInstant(values.date, values.start_at)
          : values.start_at,
        is_fit_in: values.is_fit_in,
      });
      setSaved(created);
    } catch (caught) {
      setApiError(getErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 403)
        await reloadSession();
      if (
        caught instanceof ApiError &&
        caught.status === 409 &&
        !values.is_fit_in
      ) {
        setSlots(
          await appointmentService.availability(
            Number(values.doctor_id),
            Number(values.type_id),
            values.date,
          ),
        );
        setValue("start_at", "");
      }
    }
  }

  if (!can("appointments.create") || !can("appointments.read"))
    return <AccessDenied />;
  if (saved)
    return (
      <div>
        <PageHeader
          title="Agendamento realizado"
          description="A consulta foi registrada com sucesso."
        />
        <Card className="mx-auto max-w-lg">
          <CardContent className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
            <div>
              <p className="text-lg font-bold">
                {saved.patient_name || `Paciente #${saved.patient_id}`}
              </p>
              <p className="text-muted-foreground">
                {saved.doctor_name} · {formatClinicDateTime(saved.start_at)}
              </p>
            </div>
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  setSaved(null);
                  reset();
                }}
              >
                Novo agendamento
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/admin/agenda" />}
              >
                Ir para a agenda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  const selectedType = types.find((item) => String(item.id) === typeId);
  return (
    <div>
      <PageHeader
        title="Novo agendamento"
        description="Selecione paciente, médico, tipo e um horário disponível."
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
      {loadingOptions && (
        <Alert className="mb-4">
          <LoaderCircle className="animate-spin" />
          <AlertDescription>
            Carregando médicos e tipos de consulta...
          </AlertDescription>
        </Alert>
      )}
      {optionsError && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertTitle>Não foi possível carregar as opções</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{optionsError}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadOptions()}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {apiError && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertTitle>Não foi possível concluir</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={handleSubmit(submit)}
        noValidate
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <Card>
          <CardHeader>
            <CardTitle>Dados da consulta</CardTitle>
            <CardDescription>
              Os campos refletem apenas o contrato disponível da agenda.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="appointment-patient">Paciente</Label>
              {can("patients.read") ? (
                <>
                  <Label htmlFor="patient-search" className="sr-only">
                    Buscar paciente por nome ou ID
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="patient-search"
                      value={patientSearch}
                      onChange={(event) => {
                        setPatientSearch(event.target.value);
                        setPatientSearchError(null);
                      }}
                      placeholder="Buscar por nome ou ID"
                      aria-invalid={Boolean(patientSearchError)}
                      aria-describedby={
                        patientSearchError ? "patient-search-error" : undefined
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void searchPatients();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void searchPatients()}
                    >
                      <Search /> Buscar
                    </Button>
                  </div>
                  <FieldError
                    id="patient-search-error"
                    message={patientSearchError ?? undefined}
                  />
                  <Controller
                    name="patient_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(String(value))}
                      >
                        <SelectTrigger
                          id="appointment-patient"
                          className="w-full"
                          aria-invalid={Boolean(errors.patient_id)}
                          aria-describedby={
                            errors.patient_id
                              ? "appointment-patient-error"
                              : undefined
                          }
                        >
                          <SelectValue>
                            {(value) => {
                              const patient = patients.find(
                                (item) => String(item.id) === value,
                              );
                              return patient
                                ? `${patient.full_name} · ID ${patient.id}`
                                : value
                                  ? "Paciente selecionado"
                                  : "Selecione nos resultados";
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem
                              key={patient.id}
                              value={String(patient.id)}
                            >
                              {patient.full_name} · ID {patient.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </>
              ) : (
                <Input
                  id="appointment-patient"
                  inputMode="numeric"
                  placeholder="ID do paciente"
                  aria-invalid={Boolean(errors.patient_id)}
                  aria-describedby={
                    errors.patient_id ? "appointment-patient-error" : undefined
                  }
                  {...register("patient_id")}
                />
              )}
              <FieldError
                id="appointment-patient-error"
                message={errors.patient_id?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-doctor">Médico</Label>
              <Controller
                name="doctor_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(String(value))}
                  >
                    <SelectTrigger
                      id="appointment-doctor"
                      className="w-full"
                      aria-invalid={Boolean(errors.doctor_id)}
                      aria-describedby={
                        errors.doctor_id
                          ? "appointment-doctor-error"
                          : undefined
                      }
                    >
                      <SelectValue>
                        {(value) =>
                          value
                            ? doctors.find(
                                (doctor) => String(doctor.id) === value,
                              )?.name || "Médico selecionado"
                            : loadingOptions
                              ? "Carregando..."
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
                )}
              />
              <FieldError
                id="appointment-doctor-error"
                message={errors.doctor_id?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-type">Tipo de consulta</Label>
              <Controller
                name="type_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(String(value))}
                  >
                    <SelectTrigger
                      id="appointment-type"
                      className="w-full"
                      aria-invalid={Boolean(errors.type_id)}
                      aria-describedby={
                        errors.type_id ? "appointment-type-error" : undefined
                      }
                    >
                      <SelectValue>
                        {(value) => {
                          const type = types.find(
                            (item) => String(item.id) === value,
                          );
                          return type
                            ? `${type.name} · ${type.duration_minutes} min`
                            : value
                              ? "Tipo selecionado"
                              : "Selecione";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name} · {type.duration_minutes} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                id="appointment-type-error"
                message={errors.type_id?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-date">Data</Label>
              <Input
                id="appointment-date"
                type="date"
                min={clinicDate()}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={
                  errors.date ? "appointment-date-error" : undefined
                }
                {...register("date")}
              />
              <FieldError
                id="appointment-date-error"
                message={errors.date?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-time">Horário</Label>
              {isFitIn ? (
                <Input
                  id="appointment-time"
                  type="time"
                  aria-invalid={Boolean(errors.start_at)}
                  aria-describedby={
                    errors.start_at ? "appointment-time-error" : undefined
                  }
                  {...register("start_at")}
                />
              ) : (
                <Controller
                  name="start_at"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(String(value))}
                    >
                      <SelectTrigger
                        id="appointment-time"
                        className="w-full"
                        aria-invalid={Boolean(errors.start_at)}
                        aria-describedby={
                          errors.start_at ? "appointment-time-error" : undefined
                        }
                      >
                        <SelectValue>
                          {(value) =>
                            value
                              ? slots.find((slot) => slot.start_at === value)
                                ? formatClinicTime(String(value))
                                : "Horário selecionado"
                              : loadingSlots
                                ? "Consultando..."
                                : doctorId && typeId
                                  ? "Selecione"
                                  : "Informe médico e tipo"
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
                />
              )}
              <FieldError
                id="appointment-time-error"
                message={errors.start_at?.message}
              />
              {!isFitIn &&
                doctorId &&
                typeId &&
                !loadingSlots &&
                slots.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum horário regular disponível.
                  </p>
                )}
            </div>
            <label
              htmlFor="appointment-fit-in"
              className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 sm:col-span-2"
            >
              <Controller
                name="is_fit_in"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="appointment-fit-in"
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      setValue("start_at", "");
                    }}
                  />
                )}
              />
              <span>
                <strong className="block">Agendamento de encaixe</strong>
                <span className="text-xs text-muted-foreground">
                  Permite informar um início fora do alinhamento regular, sem
                  ignorar bloqueios ou conflitos.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Summary
                label="Médico"
                value={
                  doctors.find((item) => String(item.id) === doctorId)?.name
                }
              />
              <Summary label="Tipo" value={selectedType?.name} />
              <Summary
                label="Duração"
                value={
                  selectedType
                    ? `${selectedType.duration_minutes} minutos`
                    : undefined
                }
              />
              <Summary
                label="Data"
                value={
                  date
                    ? new Intl.DateTimeFormat("pt-BR", {
                        timeZone: "UTC",
                      }).format(new Date(`${date}T12:00:00Z`))
                    : undefined
                }
              />
              <Summary
                label="Horário"
                value={
                  startAt
                    ? isFitIn
                      ? startAt
                      : formatClinicTime(startAt)
                    : undefined
                }
              />
              <Summary
                label="Modalidade"
                value={isFitIn ? "Encaixe" : "Horário regular"}
              />
            </CardContent>
          </Card>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || loadingOptions || loadingSlots}
          >
            {isSubmitting && <LoaderCircle className="animate-spin" />} Agendar
            consulta
          </Button>
        </div>
      </form>
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right">{value || "—"}</strong>
    </div>
  );
}
