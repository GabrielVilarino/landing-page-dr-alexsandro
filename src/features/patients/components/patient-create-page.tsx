"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";

import { AccessDenied } from "@/components/admin/access-denied";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/hooks/use-session";
import { PatientForm } from "@/features/patients/components/patient-form";
import type { Patient } from "@/features/patients/types/patient";

export function PatientCreatePage() {
  const router = useRouter();
  const { can } = useSession();
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (!can("patients.create")) return <AccessDenied />;

  return (
    <>
      <PageHeader
        title="Novo paciente"
        description="Cadastre os dados do paciente e, se necessário, seus responsáveis."
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={can("patients.read") ? "/admin/pacientes" : "/admin"} />}
          >
            <ArrowLeft /> {can("patients.read") ? "Voltar à lista" : "Voltar ao início"}
          </Button>
        }
      />
      {createdPatient ? (
        <Alert role="status">
          <CheckCircle2 />
          <AlertTitle>Paciente cadastrado com sucesso</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              {createdPatient.full_name} foi cadastrado com o ID {createdPatient.id}.
              Sua permissão atual permite novos cadastros, mas não a consulta dos dados.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setCreatedPatient(null);
                  setFormKey((current) => current + 1);
                }}
              >
                <Plus /> Cadastrar outro paciente
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href="/admin" />}>
                Voltar ao início
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <PatientForm
          key={formKey}
          mode="create"
          onCancel={() => router.push(can("patients.read") ? "/admin/pacientes" : "/admin")}
          onSaved={(patient) => {
            if (!can("patients.read")) {
              setCreatedPatient(patient);
              return;
            }
            window.sessionStorage.setItem("patient-created", String(patient.id));
            router.replace(`/admin/pacientes/${patient.id}`);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
