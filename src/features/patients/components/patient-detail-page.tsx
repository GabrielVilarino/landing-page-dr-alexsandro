"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  History,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/features/auth/hooks/use-session";
import { PatientForm } from "@/features/patients/components/patient-form";
import { patientService } from "@/features/patients/services/patient-service";
import type { Patient, PatientHistoryEntry } from "@/features/patients/types/patient";
import { ApiError, getErrorMessage } from "@/lib/api-error";

const HISTORY_LIMIT = 50;

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day));
}

function formatInstant(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR");
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    created: "Cadastro criado",
    updated: "Cadastro atualizado",
  };
  return labels[action] ?? action;
}

export function PatientDetailPage({ id }: { id: number }) {
  const { can, reload: reloadSession } = useSession();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PatientHistoryEntry[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPatient = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("O identificador do paciente é inválido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPatient(await patientService.get(id));
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 404
          ? "O paciente não existe ou foi removido."
          : getErrorMessage(caught),
      );
      if (caught instanceof ApiError && caught.status === 403) await reloadSession();
    } finally {
      setLoading(false);
    }
  }, [id, reloadSession]);

  const loadHistory = useCallback(async (offsetToLoad: number) => {
    if (!Number.isInteger(id) || id <= 0) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      setHistory(await patientService.history(id, HISTORY_LIMIT, offsetToLoad));
    } catch (caught) {
      setHistory([]);
      setHistoryError(getErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 403) await reloadSession();
    } finally {
      setHistoryLoading(false);
    }
  }, [id, reloadSession]);

  useEffect(() => {
    if (!can("patients.read")) return;
    const timeout = window.setTimeout(() => void loadPatient(), 0);
    return () => window.clearTimeout(timeout);
  }, [can, loadPatient]);

  useEffect(() => {
    if (!can("patients.read")) return;
    const timeout = window.setTimeout(() => void loadHistory(historyOffset), 0);
    return () => window.clearTimeout(timeout);
  }, [can, historyOffset, loadHistory]);

  useEffect(() => {
    const createdId = window.sessionStorage.getItem("patient-created");
    if (createdId === String(id)) {
      window.sessionStorage.removeItem("patient-created");
      const timeout = window.setTimeout(
        () => setSuccess("Paciente cadastrado com sucesso."),
        0,
      );
      return () => window.clearTimeout(timeout);
    }
  }, [id]);

  if (!can("patients.read")) return <AccessDenied />;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertTitle>Não foi possível abrir o cadastro</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error ?? "Paciente não encontrado."}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/pacientes" />}>
              <ArrowLeft /> Voltar à lista
            </Button>
            <Button variant="outline" onClick={() => void loadPatient()}>
              Tentar novamente
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (editing) {
    return (
      <>
        <PageHeader
          title={`Editar ${patient.full_name}`}
          description={`Versão ${patient.version}. Campos protegidos permanecem preservados quando deixados vazios.`}
          actions={
            <Button variant="outline" onClick={() => setEditing(false)}>
              <ArrowLeft /> Voltar ao cadastro
            </Button>
          }
        />
        <PatientForm
          mode="update"
          patient={patient}
          onCancel={() => setEditing(false)}
          onSaved={(saved) => {
            setPatient(saved);
            setEditing(false);
            setSuccess("Cadastro atualizado com sucesso.");
            setHistoryOffset(0);
            window.setTimeout(() => void loadHistory(0), 0);
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Cadastro do paciente"
        description="Consulte os dados cadastrais, responsáveis e histórico de alterações."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/pacientes" />}>
              <ArrowLeft /> Voltar
            </Button>
            {can("patients.update") && (
              <Button onClick={() => setEditing(true)}>
                <Edit3 /> Editar paciente
              </Button>
            )}
          </div>
        }
      />

      {success && (
        <Alert className="mb-4" role="status">
          <ShieldCheck />
          <AlertTitle>Operação concluída</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground">
            {initials(patient.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold">{patient.full_name}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>ID {patient.id}</span>
              <span>CPF {patient.cpf_masked}</span>
              <span>Versão {patient.version}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="data">
        <TabsList variant="line" className="mb-4 w-full justify-start">
          <TabsTrigger value="data"><UserRound /> Dados cadastrais</TabsTrigger>
          <TabsTrigger value="guardians"><UsersRound /> Responsáveis ({patient.guardians.length})</TabsTrigger>
          <TabsTrigger value="history"><History /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <CardHeader><CardTitle>Dados cadastrais</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Nome completo</p><p className="font-medium">{patient.full_name}</p></div>
              <div><p className="text-xs text-muted-foreground">CPF</p><p className="font-mono text-sm">{patient.cpf_masked}</p></div>
              <div><p className="text-xs text-muted-foreground">Data de nascimento</p><p className="font-medium">{formatDate(patient.birth_date)}</p></div>
              <div><p className="text-xs text-muted-foreground">Telefone</p><p className="flex items-center gap-2 font-medium"><Phone className="size-4 text-muted-foreground" />{patient.phone}</p></div>
              <div><p className="text-xs text-muted-foreground">E-mail</p><p className="flex items-center gap-2 font-medium break-all"><Mail className="size-4 text-muted-foreground" />{patient.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Última atualização</p><p className="flex items-center gap-2 font-medium"><Clock3 className="size-4 text-muted-foreground" />{formatInstant(patient.updated_at)}</p></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardians">
          {patient.guardians.length === 0 ? (
            <Card><CardContent className="grid min-h-48 place-items-center text-center text-sm text-muted-foreground">Nenhum responsável vinculado.</CardContent></Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {patient.guardians.map((guardian) => (
                <Card key={guardian.id}>
                  <CardHeader className="flex-row items-start justify-between gap-3">
                    <div><CardTitle>{guardian.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{guardian.relationship || "Relação não informada"}</p></div>
                    {guardian.is_primary && <Badge>Principal</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Documento</p><p className="font-mono">{guardian.document_masked || "Não informado"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Telefone</p><p>{guardian.phone || "Não informado"}</p></div>
                    <div><p className="text-xs text-muted-foreground">E-mail</p><p className="break-all">{guardian.email || "Não informado"}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Histórico de alterações</CardTitle></CardHeader>
            <CardContent>
              {historyError ? (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>Não foi possível carregar o histórico</AlertTitle>
                  <AlertDescription className="space-y-3"><p>{historyError}</p><Button variant="outline" onClick={() => void loadHistory(historyOffset)}>Tentar novamente</Button></AlertDescription>
                </Alert>
              ) : historyLoading ? (
                <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : history.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <article key={entry.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="font-medium">{actionLabel(entry.action)}</p><p className="text-sm text-muted-foreground">{entry.patient.full_name ?? patient.full_name}</p></div>
                      <div className="text-sm sm:text-right"><Badge variant="secondary">Versão {entry.version}</Badge><p className="mt-1 text-xs text-muted-foreground">{formatInstant(entry.changed_at)} · usuário {entry.changed_by}</p></div>
                    </article>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" size="sm" disabled={historyOffset === 0 || historyLoading} onClick={() => setHistoryOffset(Math.max(0, historyOffset - HISTORY_LIMIT))}><ChevronLeft /> Anterior</Button>
                <Button variant="outline" size="sm" disabled={history.length < HISTORY_LIMIT || historyLoading} onClick={() => setHistoryOffset(historyOffset + HISTORY_LIMIT)}>Próxima <ChevronRight /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
