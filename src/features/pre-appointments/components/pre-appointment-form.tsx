"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, MessageCircle, TriangleAlert } from "lucide-react";
import { clinicDate, formatClinicTime } from "@/features/appointments/services/appointment-date";
import { preAppointmentSchema, type PreAppointmentForm } from "@/features/pre-appointments/schemas/pre-appointment-schema";
import { usePreAppointment } from "@/features/pre-appointments/hooks/use-pre-appointment";
import type { CreatePreAppointmentPayload, PreAppointmentResult } from "@/features/pre-appointments/types/pre-appointment";

const errorId = (name: keyof PreAppointmentForm) => `${name}-error`;
// EXEMPLO A SUBSTITUIR: usar o WhatsApp real da clínica antes de publicar.
const WHATSAPP_EXAMPLE_LINK = "https://wa.me/5511999999999";

export default function PreAppointmentForm() {
  const form = useForm<PreAppointmentForm>({
    resolver: zodResolver(preAppointmentSchema),
    defaultValues: { full_name: "", cpf: "", birth_date: "", phone: "", email: "", doctor_id: "", type_id: "", date: clinicDate(), start_at: "" },
  });
  const doctorId = useWatch({ control: form.control, name: "doctor_id" });
  const typeId = useWatch({ control: form.control, name: "type_id" });
  const date = useWatch({ control: form.control, name: "date" });
  const { doctors, types, slots, loadingCatalog, loadingSlots, submitting, error, clearError, submit } = usePreAppointment(doctorId, typeId, date);
  const [success, setSuccess] = useState<PreAppointmentResult | null>(null);
  useEffect(() => {
    queueMicrotask(() => {
      form.setValue("start_at", "");
      setSuccess(null);
    });
  }, [date, doctorId, form, typeId]);
  const fieldError = (name: keyof PreAppointmentForm) => form.formState.errors[name]?.message;

  async function onSubmit(values: PreAppointmentForm) {
    const payload: CreatePreAppointmentPayload = {
      full_name: values.full_name,
      cpf: values.cpf,
      birth_date: values.birth_date,
      phone: values.phone,
      email: values.email,
      doctor_id: Number(values.doctor_id),
      type_id: Number(values.type_id),
      start_at: values.start_at,
    };
    try {
      const result = await submit(payload);
      setSuccess(result);
      form.reset({ ...form.getValues(), start_at: "" });
    } catch { /* a mensagem segura já é exibida pelo hook */ }
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-2">
          <Field label="Nome completo" name="full_name" register={form.register} error={fieldError("full_name")} />
          <Field label="CPF" name="cpf" register={form.register} error={fieldError("cpf")} placeholder="000.000.000-00" />
          <Field label="Data de nascimento" name="birth_date" type="date" register={form.register} error={fieldError("birth_date")} />
          <Field label="Telefone" name="phone" type="tel" register={form.register} error={fieldError("phone")} />
          <Field label="E-mail" name="email" type="email" register={form.register} error={fieldError("email")} />
          <Field label="Data desejada" name="date" type="date" register={form.register} error={fieldError("date")} min={clinicDate()} />
          <SelectField label="Médico" name="doctor_id" value={doctorId} onChange={(value) => form.setValue("doctor_id", value, { shouldValidate: true })} error={fieldError("doctor_id")} disabled={loadingCatalog} options={doctors.map((item) => ({ value: String(item.id), label: item.name }))} />
          <SelectField label="Tipo de consulta" name="type_id" value={typeId} onChange={(value) => form.setValue("type_id", value, { shouldValidate: true })} error={fieldError("type_id")} disabled={loadingCatalog} options={types.map((item) => ({ value: String(item.id), label: item.name }))} />
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="start_at">Horário disponível</Label>
            <Controller name="start_at" control={form.control} render={({ field }) => (
              <Select value={field.value} onValueChange={(value) => field.onChange(String(value))} disabled={loadingSlots || !doctorId || !typeId}>
                <SelectTrigger id="start_at" aria-invalid={Boolean(fieldError("start_at"))} aria-describedby={fieldError("start_at") ? errorId("start_at") : undefined} className="h-10 w-full"><SelectValue placeholder={loadingSlots ? "Carregando horários..." : "Selecione um horário"}>{slots.find((slot) => slot.start_at === field.value) ? formatClinicTime(field.value) : undefined}</SelectValue></SelectTrigger>
                <SelectContent>{slots.map((slot) => <SelectItem key={slot.start_at} value={slot.start_at}>{formatClinicTime(slot.start_at)}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {fieldError("start_at") && <p id={errorId("start_at")} className="text-sm text-destructive">{fieldError("start_at")}</p>}
            {!loadingSlots && doctorId && typeId && date && slots.length === 0 && <p className="text-sm text-muted-foreground">Não há horários disponíveis para os dados selecionados.</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 px-6 pb-6">
          <p className="w-full text-sm text-muted-foreground">Este formulário envia uma solicitação. O horário só será confirmado após análise da clínica.</p>
          <Button type="submit" disabled={submitting} className="w-full bg-[#BF9462] hover:bg-[#92714E] md:w-auto md:px-10">{submitting ? "Enviando..." : "Solicitar agendamento"}</Button>
        </CardFooter>
      </form>
      <AlertDialog open={success !== null} onOpenChange={(open) => !open && setSuccess(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><CheckCircle2 className="text-green-700" /></AlertDialogMedia>
            <AlertDialogTitle>Pré-agendamento realizado</AlertDialogTitle>
            <AlertDialogDescription>Recebemos sua solicitação com status. Vamos entrar em contato pelo WhatsApp para confirmar o horário. O pré-agendamento ainda não é uma consulta confirmada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Fechar</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={error !== null} onOpenChange={(open) => !open && clearError()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><TriangleAlert className="text-destructive" /></AlertDialogMedia>
            <AlertDialogTitle>Não foi possível realizar o pré-agendamento</AlertDialogTitle>
            <AlertDialogDescription>{error} Você pode tentar novamente ou falar com a clínica pelo WhatsApp.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction nativeButton={false} render={<a href={WHATSAPP_EXAMPLE_LINK} target="_blank" rel="noreferrer" />}><MessageCircle /> Falar no WhatsApp</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

type FieldProps = { label: string; name: keyof PreAppointmentForm; type?: string; placeholder?: string; min?: string; register: ReturnType<typeof useForm<PreAppointmentForm>>["register"]; error?: string; };
function Field({ label, name, type = "text", placeholder, min, register, error }: FieldProps) {
  return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} type={type} placeholder={placeholder} min={min} aria-invalid={Boolean(error)} aria-describedby={error ? errorId(name) : undefined} {...register(name)} />{error && <p id={errorId(name)} className="text-sm text-destructive">{error}</p>}</div>;
}

type SelectFieldProps = { label: string; name: keyof PreAppointmentForm; value: string; onChange: (value: string) => void; error?: string; disabled?: boolean; options: { value: string; label: string }[]; };
function SelectField({ label, name, value, onChange, error, disabled, options }: SelectFieldProps) {
  const selectedOption = options.find((option) => option.value === value);
  return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Select value={value} onValueChange={(next) => onChange(String(next))} disabled={disabled}><SelectTrigger id={name} aria-invalid={Boolean(error)} aria-describedby={error ? errorId(name) : undefined} className="h-10 w-full"><SelectValue placeholder={`Selecione ${label.toLowerCase()}`}>{selectedOption?.label}</SelectValue></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{error && <p id={errorId(name)} className="text-sm text-destructive">{error}</p>}</div>;
}
