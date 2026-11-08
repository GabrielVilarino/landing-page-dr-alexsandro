"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, LoaderCircle, Plus, Trash2, UserRound } from "lucide-react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/features/auth/hooks/use-session";
import {
  emptyGuardian,
  patientFormSchema,
  type PatientFormValues,
} from "@/features/patients/schemas/patient-schema";
import { patientService } from "@/features/patients/services/patient-service";
import type { Patient } from "@/features/patients/types/patient";
import { ApiError, getErrorMessage } from "@/lib/api-error";

function valuesFor(mode: "create" | "update", patient?: Patient): PatientFormValues {
  return {
    mode,
    full_name: patient?.full_name ?? "",
    cpf: "",
    birth_date: patient?.birth_date ?? "",
    phone: patient?.phone ?? "",
    email: patient?.email ?? "",
    guardians:
      patient?.guardians.map((guardian) => ({
        id: guardian.id,
        name: guardian.name,
        document: "",
        document_masked: guardian.document_masked,
        remove_document: false,
        phone: guardian.phone ?? "",
        email: guardian.email ?? "",
        relationship: guardian.relationship ?? "",
        is_primary: guardian.is_primary,
      })) ?? [],
  };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

function ComparisonField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-medium">{value || "Não informado"}</p>
    </div>
  );
}

function ConflictComparison({
  draft,
  current,
  original,
}: {
  draft: PatientFormValues;
  current: Patient;
  original: Patient;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-4 rounded-lg border bg-background p-4">
        <h4 className="font-semibold">Seu rascunho preservado</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <ComparisonField label="Nome" value={draft.full_name} />
          <ComparisonField
            label="CPF"
            value={
              draft.cpf
                ? draft.cpf
                : `Preservar ${original.cpf_masked}`
            }
          />
          <ComparisonField label="Nascimento" value={draft.birth_date} />
          <ComparisonField label="Telefone" value={draft.phone} />
          <ComparisonField label="E-mail" value={draft.email} />
          <ComparisonField label="Versão usada no envio" value={String(original.version)} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Responsáveis no rascunho
          </p>
          {draft.guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum responsável.</p>
          ) : (
            draft.guardians.map((guardian, index) => (
              <div key={`${guardian.id ?? "new"}-${index}`} className="rounded-md border p-3 text-sm">
                <p className="font-semibold">
                  {guardian.name} {guardian.is_primary ? "· principal" : ""}
                </p>
                <p>Vínculo: {guardian.relationship || "não informado"}</p>
                <p>Telefone: {guardian.phone || "não informado"}</p>
                <p>E-mail: {guardian.email || "não informado"}</p>
                <p>
                  Documento:{" "}
                  {guardian.remove_document
                    ? "remover ao salvar"
                    : guardian.document
                      ? guardian.document
                      : guardian.document_masked
                        ? `preservar ${guardian.document_masked}`
                        : "não informado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {guardian.id ? `Responsável ID ${guardian.id}` : "Novo responsável"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border bg-background p-4">
        <h4 className="font-semibold">Versão atual no servidor</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <ComparisonField label="Nome" value={current.full_name} />
          <ComparisonField label="CPF" value={current.cpf_masked} />
          <ComparisonField label="Nascimento" value={current.birth_date} />
          <ComparisonField label="Telefone" value={current.phone} />
          <ComparisonField label="E-mail" value={current.email} />
          <ComparisonField label="Versão atual" value={String(current.version)} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Responsáveis no servidor
          </p>
          {current.guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum responsável.</p>
          ) : (
            current.guardians.map((guardian) => (
              <div key={guardian.id} className="rounded-md border p-3 text-sm">
                <p className="font-semibold">
                  {guardian.name} {guardian.is_primary ? "· principal" : ""}
                </p>
                <p>Vínculo: {guardian.relationship || "não informado"}</p>
                <p>Telefone: {guardian.phone || "não informado"}</p>
                <p>E-mail: {guardian.email || "não informado"}</p>
                <p>Documento: {guardian.document_masked || "não informado"}</p>
                <p className="text-xs text-muted-foreground">Responsável ID {guardian.id}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function PatientForm({
  mode,
  patient,
  onSaved,
  onCancel,
}: {
  mode: "create" | "update";
  patient?: Patient;
  onSaved: (patient: Patient) => void;
  onCancel?: () => void;
}) {
  const { reload: reloadSession } = useSession();
  const [apiError, setApiError] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState<string | null>(null);
  const [conflictDraft, setConflictDraft] = useState<PatientFormValues | null>(null);
  const [currentVersion, setCurrentVersion] = useState<Patient | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<number | null>(null);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: valuesFor(mode, patient),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "guardians" });
  const watchedGuardians = useWatch({ control, name: "guardians" });

  async function onSubmit(values: PatientFormValues) {
    setApiError(null);
    setVersionConflict(null);
    setConflictDraft(null);
    setCurrentVersion(null);
    try {
      const saved =
        mode === "create"
          ? await patientService.create(values)
          : await patientService.update(patient!.id, values, patient!.version);
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) await reloadSession();
      if (error instanceof ApiError && error.status === 409 && mode === "update") {
        const cpfWasChanged = values.cpf.trim() !== "";
        const isVersionConflict = /vers|concorr|desatual|outra pessoa|alterad/i.test(error.message);
        const isCpfConflict = /cpf/i.test(error.message);
        if (isVersionConflict || (!isCpfConflict && !cpfWasChanged)) {
          setConflictDraft({
            ...values,
            guardians: values.guardians.map((guardian) => ({ ...guardian })),
          });
          setVersionConflict(
            "Este cadastro foi alterado por outra pessoa. Seu preenchimento foi preservado e não será reenviado automaticamente.",
          );
          return;
        }
      }
      setApiError(getErrorMessage(error));
    }
  }

  async function checkCurrentVersion() {
    if (!patient) return;
    setCheckingVersion(true);
    setApiError(null);
    try {
      setCurrentVersion(await patientService.get(patient.id));
    } catch (error) {
      setApiError(getErrorMessage(error));
      if (error instanceof ApiError && error.status === 403) await reloadSession();
    } finally {
      setCheckingVersion(false);
    }
  }

  function selectPrimary(index: number, checked: boolean) {
    if (checked) {
      getValues("guardians").forEach((_, guardianIndex) => {
        setValue(`guardians.${guardianIndex}.is_primary`, guardianIndex === index, {
          shouldDirty: true,
          shouldValidate: true,
        });
      });
    } else {
      setValue(`guardians.${index}.is_primary`, false, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {apiError && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Não foi possível salvar</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      {versionConflict && (
        <Alert role="alert">
          <AlertTriangle />
          <AlertTitle>Cadastro atualizado em outra sessão</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{versionConflict}</p>
            <Button
              type="button"
              variant="outline"
              disabled={checkingVersion}
              onClick={() => void checkCurrentVersion()}
            >
              {checkingVersion && <LoaderCircle className="animate-spin" />}
              Consultar versão atual
            </Button>
            {currentVersion && conflictDraft && patient && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Servidor atualizado em {new Date(currentVersion.updated_at).toLocaleString("pt-BR")}. Compare todos os dados antes de decidir.
                </p>
                <ConflictComparison
                  draft={conflictDraft}
                  current={currentVersion}
                  original={patient}
                />
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Descartar rascunho e recarregar
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="patient-full-name">Nome completo</Label>
            <Input
              id="patient-full-name"
              autoComplete="name"
              aria-invalid={Boolean(errors.full_name)}
              aria-describedby={errors.full_name ? "patient-full-name-error" : undefined}
              {...register("full_name")}
            />
            <FieldError id="patient-full-name-error" message={errors.full_name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-cpf">{mode === "create" ? "CPF" : "Novo CPF"}</Label>
            <Input
              id="patient-cpf"
              inputMode="numeric"
              autoComplete="off"
              placeholder={mode === "create" ? "000.000.000-00" : "Deixe vazio para preservar"}
              aria-invalid={Boolean(errors.cpf)}
              aria-describedby={errors.cpf ? "patient-cpf-error" : mode === "update" ? "patient-cpf-help" : undefined}
              {...register("cpf")}
            />
            {mode === "update" && (
              <p id="patient-cpf-help" className="text-xs text-muted-foreground">
                CPF cadastrado: {patient?.cpf_masked}. O valor não é recuperado nem preenchido pelo sistema.
              </p>
            )}
            <FieldError id="patient-cpf-error" message={errors.cpf?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-birth-date">Data de nascimento</Label>
            <Input
              id="patient-birth-date"
              type="date"
              aria-invalid={Boolean(errors.birth_date)}
              aria-describedby={errors.birth_date ? "patient-birth-date-error" : undefined}
              {...register("birth_date")}
            />
            <FieldError id="patient-birth-date-error" message={errors.birth_date?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-phone">Telefone</Label>
            <Input
              id="patient-phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "patient-phone-error" : undefined}
              {...register("phone")}
            />
            <FieldError id="patient-phone-error" message={errors.phone?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-email">E-mail</Label>
            <Input
              id="patient-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "patient-email-error" : undefined}
              {...register("email")}
            />
            <FieldError id="patient-email-error" message={errors.email?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Responsáveis</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Adicione somente quando necessário. Um responsável pode ser marcado como principal.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => append({ ...emptyGuardian })}>
            <Plus /> Adicionar responsável
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {fields.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum responsável informado.
            </div>
          )}
          {fields.map((field, index) => {
            const fieldErrors = errors.guardians?.[index];
            const hasStoredDocument = Boolean(watchedGuardians[index]?.document_masked);
            const removingDocument = watchedGuardians[index]?.remove_document ?? false;
            return (
              <section key={field.id} className="space-y-4 rounded-xl border p-4" aria-labelledby={`guardian-${index}-title`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 id={`guardian-${index}-title`} className="flex items-center gap-2 font-semibold">
                    <UserRound className="size-4 text-primary" /> Responsável {index + 1}
                  </h3>
                  <Button type="button" variant="destructive" size="sm" onClick={() => setPendingRemoval(index)}>
                    <Trash2 /> Remover
                  </Button>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`guardian-${index}-name`}>Nome</Label>
                    <Input
                      id={`guardian-${index}-name`}
                      aria-invalid={Boolean(fieldErrors?.name)}
                      aria-describedby={fieldErrors?.name ? `guardian-${index}-name-error` : undefined}
                      {...register(`guardians.${index}.name`)}
                    />
                    <FieldError id={`guardian-${index}-name-error`} message={fieldErrors?.name?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-relationship`}>Relação</Label>
                    <Input
                      id={`guardian-${index}-relationship`}
                      placeholder="Ex.: mãe, pai ou tutor"
                      aria-invalid={Boolean(fieldErrors?.relationship)}
                      aria-describedby={fieldErrors?.relationship ? `guardian-${index}-relationship-error` : undefined}
                      {...register(`guardians.${index}.relationship`)}
                    />
                    <FieldError id={`guardian-${index}-relationship-error`} message={fieldErrors?.relationship?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-document`}>{hasStoredDocument ? "Novo documento" : "Documento"}</Label>
                    <Input
                      id={`guardian-${index}-document`}
                      autoComplete="off"
                      disabled={removingDocument}
                      placeholder={hasStoredDocument ? "Deixe vazio para preservar" : undefined}
                      aria-invalid={Boolean(fieldErrors?.document)}
                      aria-describedby={fieldErrors?.document ? `guardian-${index}-document-error` : hasStoredDocument ? `guardian-${index}-document-help` : undefined}
                      {...register(`guardians.${index}.document`)}
                    />
                    {hasStoredDocument && (
                      <p id={`guardian-${index}-document-help`} className="text-xs text-muted-foreground">
                        Documento cadastrado: {watchedGuardians[index]?.document_masked}.
                      </p>
                    )}
                    <FieldError id={`guardian-${index}-document-error`} message={fieldErrors?.document?.message} />
                  </div>
                  {hasStoredDocument && (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm sm:col-span-2">
                      <Controller
                        name={`guardians.${index}.remove_document`}
                        control={control}
                        render={({ field: checkboxField }) => (
                          <Checkbox checked={checkboxField.value} onCheckedChange={checkboxField.onChange} />
                        )}
                      />
                      Remover explicitamente o documento cadastrado
                    </label>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-phone`}>Telefone</Label>
                    <Input
                      id={`guardian-${index}-phone`}
                      type="tel"
                      aria-invalid={Boolean(fieldErrors?.phone)}
                      aria-describedby={fieldErrors?.phone ? `guardian-${index}-phone-error` : undefined}
                      {...register(`guardians.${index}.phone`)}
                    />
                    <FieldError id={`guardian-${index}-phone-error`} message={fieldErrors?.phone?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`guardian-${index}-email`}>E-mail</Label>
                    <Input
                      id={`guardian-${index}-email`}
                      type="email"
                      aria-invalid={Boolean(fieldErrors?.email)}
                      aria-describedby={fieldErrors?.email ? `guardian-${index}-email-error` : undefined}
                      {...register(`guardians.${index}.email`)}
                    />
                    <FieldError id={`guardian-${index}-email-error`} message={fieldErrors?.email?.message} />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm sm:col-span-2">
                    <Controller
                      name={`guardians.${index}.is_primary`}
                      control={control}
                      render={({ field: checkboxField }) => (
                        <Checkbox
                          checked={checkboxField.value}
                          onCheckedChange={(checked) => selectPrimary(index, checked)}
                        />
                      )}
                    />
                    Responsável principal
                  </label>
                </div>
              </section>
            );
          })}
          {errors.guardians?.message && <p className="text-sm text-destructive">{errors.guardians.message}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {mode === "create" ? "Cadastrar paciente" : "Salvar alterações"}
        </Button>
      </div>

      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Remover responsável?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta pessoa deixará de fazer parte do cadastro quando as alterações forem salvas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingRemoval !== null) remove(pendingRemoval);
                setPendingRemoval(null);
              }}
            >
              Remover responsável
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
