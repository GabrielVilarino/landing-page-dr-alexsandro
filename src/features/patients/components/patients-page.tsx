"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";

import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/features/auth/hooks/use-session";
import { patientSearchSchema } from "@/features/patients/schemas/patient-schema";
import { patientService } from "@/features/patients/services/patient-service";
import type { Patient } from "@/features/patients/types/patient";
import { ApiError, getErrorMessage } from "@/lib/api-error";

const LIMIT = 50;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day));
}

export function PatientsPage() {
  const { can, reload: reloadSession } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);

  const cancelActiveRequest = useCallback(() => {
    requestSequence.current += 1;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
  }, []);

  const load = useCallback(async function loadPatients(
    queryToLoad: string,
    offsetToLoad: number,
  ) {
    activeRequest.current?.abort();
    const controller = new AbortController();
    const sequence = ++requestSequence.current;
    activeRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await patientService.list(
        queryToLoad,
        LIMIT,
        offsetToLoad,
        controller.signal,
      );
      if (controller.signal.aborted || sequence !== requestSequence.current)
        return;
      if (result.length === 0 && offsetToLoad > 0) {
        const previousOffset = Math.max(0, offsetToLoad - LIMIT);
        setOffset(previousOffset);
        return loadPatients(queryToLoad, previousOffset);
      }
      setPatients(result);
    } catch (caught) {
      if (controller.signal.aborted || sequence !== requestSequence.current)
        return;
      setPatients([]);
      setError(getErrorMessage(caught));
      if (caught instanceof ApiError && caught.status === 403) await reloadSession();
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
      if (!controller.signal.aborted && sequence === requestSequence.current)
        setLoading(false);
    }
  }, [reloadSession]);

  useEffect(() => {
    if (search === "") return;
    const timeout = window.setTimeout(() => {
      const parsed = patientSearchSchema.safeParse(search);
      if (!parsed.success) {
        setSearchError(parsed.error.issues[0]?.message ?? "Busca inválida.");
        return;
      }
      setSearchError(null);
      setQuery(parsed.data);
      setOffset(0);
      void load(parsed.data, 0);
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [load, search]);

  useEffect(() => {
    if (!can("patients.read")) return;
    const timeout = window.setTimeout(() => void load("", 0), 0);
    return () => {
      window.clearTimeout(timeout);
      requestSequence.current += 1;
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [can, load]);

  function handleSearchChange(value: string) {
    cancelActiveRequest();
    setSearch(value);
    if (value !== "") return;

    setSearchError(null);
    setQuery("");
    setOffset(0);
    void load("", 0);
  }

  function changePage(nextOffset: number) {
    setOffset(nextOffset);
    void load(query, nextOffset);
  }

  if (!can("patients.read")) return <AccessDenied />;

  const first = patients.length === 0 ? 0 : offset + 1;
  const last = offset + patients.length;

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Gerencie os dados cadastrais e os responsáveis dos pacientes."
        actions={
          can("patients.create") ? (
            <Button nativeButton={false} render={<Link href="/admin/pacientes/novo" />}>
              <Plus /> Novo paciente
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-md space-y-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="pl-9"
                placeholder="Buscar por nome ou ID"
                aria-label="Buscar pacientes por nome ou ID"
                aria-invalid={Boolean(searchError)}
                aria-describedby={searchError ? "patient-search-error" : undefined}
              />
            </div>
            {searchError && (
              <p id="patient-search-error" className="text-sm text-destructive">
                {searchError}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading ? "Buscando pacientes…" : `${patients.length} paciente${patients.length === 1 ? "" : "s"} nesta página`}
          </p>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Não foi possível carregar os pacientes</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            <Button variant="outline" onClick={() => void load(query, offset)}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <CardContent className="grid min-h-56 place-items-center text-center">
            <div>
              <UserRound className="mx-auto mb-3 size-9 text-muted-foreground" />
              <p className="font-medium">Nenhum paciente encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query ? "Revise o nome ou ID pesquisado." : "Cadastre o primeiro paciente para começar."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Paciente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nascimento</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Responsáveis</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {initials(patient.full_name)}
                        </span>
                        <div>
                          <p className="font-medium">{patient.full_name}</p>
                          <p className="text-xs text-muted-foreground">ID {patient.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{patient.cpf_masked}</TableCell>
                    <TableCell>{formatDate(patient.birth_date)}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <UsersRound className="size-4 text-muted-foreground" /> {patient.guardians.length}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        nativeButton={false}
                        render={<Link href={`/admin/pacientes/${patient.id}`} />}
                        aria-label={`Ver cadastro de ${patient.full_name}`}
                        title="Ver cadastro"
                      >
                        <Eye />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Exibindo {first}–{last}.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => changePage(Math.max(0, offset - LIMIT))}>
                <ChevronLeft /> Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={patients.length < LIMIT || loading} onClick={() => changePage(offset + LIMIT)}>
                Próxima <ChevronRight />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && patients.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-4 animate-spin" /> Atualizando resultados…
        </p>
      )}
    </>
  );
}
