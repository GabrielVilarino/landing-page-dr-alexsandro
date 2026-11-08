import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ senha?: string }>;
}) {
  const { senha } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-background p-5">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex justify-center">
          <Image
            src="/admin-logo.png"
            alt="Dr. Alexsandro Araújo — Médico"
            width={280}
            height={96}
            className="h-auto w-[260px]"
            priority
          />
        </div>
        {senha === "alterada" && (
          <Alert className="mb-4">
            <AlertDescription>
              Senha alterada. Entre novamente para continuar.
            </AlertDescription>
          </Alert>
        )}
        <Card className="shadow-[0_8px_32px_rgba(141,107,69,0.12)]">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Bem-vindo(a)!</CardTitle>
            <CardDescription>Acesse sua conta para continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 Dr. Alexsandro Araújo. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}
