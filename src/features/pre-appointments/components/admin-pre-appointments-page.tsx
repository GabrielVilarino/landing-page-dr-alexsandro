"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Check, ChevronLeft, ChevronRight, RefreshCw, Search, UserRound, X } from "lucide-react";
import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/features/auth/hooks/use-session";
import { clinicInstant, formatClinicDateTime, moveClinicDate } from "@/features/appointments/services/appointment-date";
import { ApiError, getErrorMessage } from "@/lib/api-error";
import { preAppointmentService } from "@/features/pre-appointments/services/pre-appointment-service";
import { useAdminPreAppointments } from "@/features/pre-appointments/hooks/use-admin-pre-appointments";
import { adminPreAppointmentFilterSchema, rejectPreAppointmentSchema, type AdminPreAppointmentFilters, type RejectPreAppointmentValues } from "@/features/pre-appointments/schemas/admin-pre-appointment-schema";
import { preAppointmentStatuses, type AdminPreAppointment, type PreAppointmentStatus } from "@/features/pre-appointments/types/pre-appointment";

const statusLabels: Record<PreAppointmentStatus, string> = { PENDENTE: "Pendente", APROVADA: "Aprovada", RECUSADA: "Recusada" };

export function AdminPreAppointmentsPage() {
  const { can } = useSession();
  const canRead = can("appointments.read") && can("patients.read");
  const canApprove = can("appointments.create") && can("patients.create");
  const canReject = can("appointments.update") && can("patients.read");
  const [doctors, setDoctors] = useState<Array<{ id: number; name: string }>>([]);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<AdminPreAppointmentFilters>({ status: "PENDENTE", doctor_id: "", start_date: "", end_date: "" });
  const [selected, setSelected] = useState<AdminPreAppointment | null>(null);
  const [acting, setActing] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const filterForm = useForm<AdminPreAppointmentFilters>({ resolver: zodResolver(adminPreAppointmentFilterSchema), defaultValues: filters });
  const rejectForm = useForm<RejectPreAppointmentValues>({ resolver: zodResolver(rejectPreAppointmentSchema), defaultValues: { reason: "" } });
  const query = useMemo(() => {
    if (!canRead) return null;
    const values = filters.start_date && filters.end_date ? { start_at: clinicInstant(filters.start_date, "00:00"), end_at: clinicInstant(moveClinicDate(filters.end_date, 1), "00:00") } : {};
    return { limit: 50, offset, ...(filters.status ? { status: filters.status as PreAppointmentStatus } : {}), ...(filters.doctor_id ? { doctor_id: Number(filters.doctor_id) } : {}), ...values };
  }, [canRead, filters, offset]);
  const list = useAdminPreAppointments(query);

  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    void preAppointmentService.adminDoctors(controller.signal)
      .then((items) => { setDoctors(items); setDoctorError(null); })
      .catch((caught) => { if (!controller.signal.aborted) setDoctorError(getErrorMessage(caught)); });
    return () => controller.abort();
  }, [canRead]);

  const reload = useCallback(async () => { setActionError(null); await list.reload(); }, [list]);
  async function approve(item: AdminPreAppointment) {
    setActing(item.id); setActionError(null);
    try { await preAppointmentService.approve(item.id); await reload(); }
    catch (caught) {
      setActionError(getErrorMessage(caught));
      if (caught instanceof ApiError && (caught.status === 404 || caught.status === 409)) await list.reload();
    }
    finally { setActing(null); }
  }
  async function reject(values: RejectPreAppointmentValues) {
    if (!selected) return;
    setActing(selected.id); setActionError(null);
    try { await preAppointmentService.reject(selected.id, values.reason); setSelected(null); rejectForm.reset(); await reload(); }
    catch (caught) {
      setActionError(getErrorMessage(caught));
      if (caught instanceof ApiError && (caught.status === 404 || caught.status === 409)) await list.reload();
    }
    finally { setActing(null); }
  }

  if (!canRead) return <AccessDenied />;
  return <>
    <PageHeader title="Pré-agendamentos" description="Analise as solicitações recebidas pelo formulário público." actions={<Button variant="outline" onClick={() => void reload()} disabled={list.loading}><RefreshCw className={list.loading ? "animate-spin" : ""} /> Atualizar</Button>} />
    <Card className="mb-6"><CardContent className="pt-6"><form className="grid gap-4 md:grid-cols-2 lg:grid-cols-5" onSubmit={filterForm.handleSubmit((values) => { setOffset(0); setFilters(values); })} noValidate>
      <div className="grid gap-2"><Label htmlFor="pre-status">Status</Label><Controller name="status" control={filterForm.control} render={({ field }) => <Select value={field.value} onValueChange={(value) => field.onChange(String(value))}><SelectTrigger id="pre-status" className="w-full"><SelectValue placeholder="Todos">{field.value ? statusLabels[field.value as PreAppointmentStatus] : undefined}</SelectValue></SelectTrigger><SelectContent><SelectItem value="">Todos</SelectItem>{preAppointmentStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select>} /></div>
      <div className="grid gap-2"><Label htmlFor="pre-doctor">Médico</Label><Controller name="doctor_id" control={filterForm.control} render={({ field }) => <Select value={field.value} onValueChange={(value) => field.onChange(String(value))}><SelectTrigger id="pre-doctor" className="w-full"><SelectValue placeholder="Todos os médicos">{doctors.find((doctor) => String(doctor.id) === field.value)?.name}</SelectValue></SelectTrigger><SelectContent><SelectItem value="">Todos os médicos</SelectItem>{doctors.map((doctor) => <SelectItem key={doctor.id} value={String(doctor.id)}>{doctor.name}</SelectItem>)}</SelectContent></Select>} /></div>
      <div className="grid gap-2"><Label htmlFor="pre-start">De</Label><Input id="pre-start" type="date" aria-invalid={Boolean(filterForm.formState.errors.start_date)} aria-describedby={filterForm.formState.errors.start_date ? "pre-start-error" : undefined} {...filterForm.register("start_date")} /></div>
      <div className="grid gap-2"><Label htmlFor="pre-end">Até</Label><Input id="pre-end" type="date" aria-invalid={Boolean(filterForm.formState.errors.end_date)} aria-describedby={filterForm.formState.errors.end_date ? "pre-end-error" : undefined} {...filterForm.register("end_date")} /></div>
      <div className="flex items-end"><Button type="submit" className="w-full"><Search /> Filtrar</Button></div>
      {filterForm.formState.errors.start_date && <p id="pre-start-error" className="text-sm text-destructive md:col-span-2">{filterForm.formState.errors.start_date.message}</p>}
      {filterForm.formState.errors.end_date && <p id="pre-end-error" className="text-sm text-destructive md:col-span-2">{filterForm.formState.errors.end_date.message}</p>}
    </form></CardContent></Card>
    {doctorError && <Alert variant="destructive" className="mb-6" role="alert"><AlertDescription>Não foi possível carregar o catálogo de médicos: {doctorError} O restante da fila continua disponível.</AlertDescription></Alert>}
    {list.error && <Alert variant="destructive" className="mb-6"><AlertDescription>{list.error}</AlertDescription></Alert>}
    {actionError && <Alert variant="destructive" className="mb-6" role="alert"><AlertDescription>{actionError}</AlertDescription></Alert>}
    <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">Fila de solicitações de pré-agendamento</caption><thead className="border-b bg-muted/50 text-left"><tr><th className="p-4 font-medium">Paciente</th><th className="p-4 font-medium">Médico e tipo</th><th className="p-4 font-medium">Horário</th><th className="p-4 font-medium">Status</th><th className="p-4 text-right font-medium">Ações</th></tr></thead><tbody>{list.loading && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando solicitações...</td></tr>}{!list.loading && list.items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum pré-agendamento encontrado.</td></tr>}{!list.loading && list.items.map((item) => <PreAppointmentRow key={item.id} item={item} acting={acting === item.id} canApprove={canApprove} canReject={canReject} onApprove={() => void approve(item)} onReject={() => { setSelected(item); rejectForm.reset(); }} />)}</tbody></table></div><div className="flex items-center justify-between border-t p-4"><span className="text-sm text-muted-foreground">{list.total !== undefined ? `${list.items.length} de ${list.total}` : `${list.items.length} solicitação(ões)`}</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setOffset((value) => Math.max(0, value - 50))} disabled={offset === 0 || list.loading}><ChevronLeft /> Anterior</Button><Button variant="outline" size="sm" onClick={() => setOffset((value) => value + 50)} disabled={list.loading || list.items.length < 50}><ChevronRight /> Próxima</Button></div></div></CardContent></Card>
    <AlertDialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Recusar pré-agendamento?</AlertDialogTitle><AlertDialogDescription>Informe um motivo para a recusa de {selected?.full_name}. Esse motivo será preservado no histórico.</AlertDialogDescription></AlertDialogHeader><form onSubmit={rejectForm.handleSubmit(reject)} noValidate><div className="grid gap-2"><Label htmlFor="reject-reason">Motivo da recusa</Label><Textarea id="reject-reason" maxLength={500} aria-invalid={Boolean(rejectForm.formState.errors.reason)} aria-describedby="reject-reason-error" {...rejectForm.register("reason")} />{rejectForm.formState.errors.reason && <p id="reject-reason-error" className="text-sm text-destructive">{rejectForm.formState.errors.reason.message}</p>}</div><AlertDialogFooter className="mt-4"><AlertDialogCancel type="button">Cancelar</AlertDialogCancel><AlertDialogAction type="submit" variant="destructive" disabled={acting !== null}>Recusar</AlertDialogAction></AlertDialogFooter></form></AlertDialogContent></AlertDialog>
  </>;
}

function PreAppointmentRow({ item, acting, canApprove, canReject, onApprove, onReject }: { item: AdminPreAppointment; acting: boolean; canApprove: boolean; canReject: boolean; onApprove: () => void; onReject: () => void }) {
  const terminal = item.status !== "PENDENTE";
  return <tr className="border-b last:border-0"><td className="p-4 align-top"><div className="flex items-start gap-2"><UserRound className="mt-0.5 size-4 text-muted-foreground" /><div><p className="font-medium">{item.full_name}</p><p className="text-xs text-muted-foreground">CPF: {item.cpf_masked ?? "protegido"} · Nascimento: {item.birth_date}</p><p className="text-xs text-muted-foreground">{item.phone} · {item.email}</p></div></div></td><td className="p-4 align-top"><p>{item.doctor_name}</p><p className="text-xs text-muted-foreground">{item.type_name}</p></td><td className="p-4 align-top whitespace-nowrap">{formatClinicDateTime(item.start_at)}</td><td className="p-4 align-top"><Badge variant="outline">{statusLabels[item.status] ?? item.status}</Badge>{item.rejection_reason && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{item.rejection_reason}</p>}</td><td className="p-4 align-top"><div className="flex justify-end gap-2">{!terminal && canApprove && <Button size="sm" onClick={onApprove} disabled={acting}><Check /> Aprovar</Button>}{!terminal && canReject && <Button size="sm" variant="destructive" onClick={onReject} disabled={acting}><X /> Recusar</Button>}{terminal && <span className="text-xs text-muted-foreground">Sem novas decisões</span>}</div></td></tr>;
}
